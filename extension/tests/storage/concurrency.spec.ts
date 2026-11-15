import 'fake-indexeddb/auto';
import { test, expect } from '@playwright/test';
import { db } from '../../src/storage/db';
import { StorageManager as storage } from '../../src/storage/storageManager';
const time = '2026-01-01T00:00:00.000Z';
const post = (id: string) => ({
    id,
    url: `https://example.com/${id}`,
    canonical_url: `https://example.com/${id}`,
    title: id,
    tags: [],
    created_at: time,
    updated_at: time,
});
test.beforeEach(async () => {
    Object.assign(globalThis, { chrome: { storage: { local: { get: async () => ({}) } } } });
    await db.delete();
    await db.open();
});
test.afterEach(async () => {
    await db.delete();
});
test('overlapping note and tag edits preserve both changes', async () => {
    await db.posts.put(post('one'));
    await Promise.all([
        storage.updatePostNotes('one', 'new note'),
        storage.updatePostTags('one', ['new tag']),
    ]);
    expect(await db.posts.get('one')).toMatchObject({ notes: 'new note', tags: ['new tag'] });
});
test('overlapping folder additions and metadata edits preserve all changes', async () => {
    await db.posts.bulkPut([post('one'), post('two')]);
    const { folder } = await storage.saveFolder('Reading', '#123456');
    await Promise.all([
        storage.addPostToFolder(folder.id, 'one'),
        storage.addPostToFolder(folder.id, 'two'),
        storage.updateFolder(folder.id, { color: '#654321' }),
    ]);
    const saved = await db.folders.get(folder.id);
    expect(saved?.post_ids.sort()).toEqual(['one', 'two']);
    expect(saved?.color).toBe('#654321');
    await Promise.all([
        storage.removePostFromFolder(folder.id, 'one'),
        storage.removePostFromFolder(folder.id, 'two'),
    ]);
    expect((await db.folders.get(folder.id))?.post_ids).toEqual([]);
});
test('concurrent folder creation returns one folder', async () => {
    const results = await Promise.all(
        Array.from({ length: 8 }, () => storage.saveFolder('Reading', '#123456'))
    );
    expect(await db.folders.count()).toBe(1);
    expect(results.filter((r) => !r.wasDuplicate)).toHaveLength(1);
});
test('overlapping pins enforce limit and unique order', async () => {
    const posts = Array.from({ length: 8 }, (_, i) => post(String(i)));
    await db.posts.bulkPut(posts);
    const results = await Promise.all(posts.map((p) => storage.pinTab(p.id)));
    expect(results.filter(Boolean)).toHaveLength(5);
    const pins = await db.pinned_tabs.orderBy('order').toArray();
    expect(pins.map((p) => p.order)).toEqual([0, 1, 2, 3, 4]);
});
test('a stale reorder cannot resurrect removed pins or discard new pins', async () => {
    await db.posts.bulkPut([post('one'), post('two'), post('three')]);
    await storage.pinTab('one');
    await storage.pinTab('two');
    const stale = await storage.getPinnedTabs();
    await storage.unpinTab('one');
    await storage.pinTab('three');
    await storage.reorderPinnedTabs(stale.reverse());
    expect((await storage.getPinnedTabs()).map((p) => p.id)).toEqual(['two', 'three']);
});

test('failed deletion rolls back posts, folder memberships, and pins together', async () => {
    await db.posts.put(post('one'));
    const { folder } = await storage.saveFolder('Reading', '#123456', ['one']);
    await storage.pinTab('one');
    const fail = () => {
        throw new Error('folder write failed');
    };
    db.folders.hook('updating', fail);
    try {
        await expect(storage.deletePost('one')).rejects.toThrow('folder write failed');
    } finally {
        db.folders.hook('updating').unsubscribe(fail);
    }
    expect(await db.posts.get('one')).toBeDefined();
    expect((await db.folders.get(folder.id))?.post_ids).toEqual(['one']);
    expect(await db.pinned_tabs.get('one')).toBeDefined();
});
