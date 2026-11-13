import 'fake-indexeddb/auto';
import { test, expect } from '@playwright/test';
import { db } from '../../src/storage/db';
import { StorageManager } from '../../src/storage/storageManager';
import type { Post, Folder } from '../../../shared';

const time = '2026-01-01T00:00:00.000Z';
const post = (id = 'local', url = 'https://example.com/local'): Post => ({
    id,
    url,
    canonical_url: url,
    title: id,
    tags: ['local'],
    notes: 'Keep my edits',
    created_at: time,
    updated_at: time,
});
const folder: Folder = {
    id: 'folder',
    name: 'Reading',
    color: '#26405e',
    post_ids: ['local'],
    created_at: time,
    updated_at: time,
    order: 1,
};
const backup = (posts: unknown, folders: unknown = [], pinnedTabs: unknown = []) =>
    JSON.stringify({ version: '1.0.0', data: { posts, folders, pinnedTabs } });
async function snapshot() {
    return {
        posts: await db.posts.toArray(),
        folders: await db.folders.toArray(),
        pins: await db.pinned_tabs.orderBy('order').toArray(),
    };
}
test.beforeEach(async () => {
    await db.delete();
    await db.open();
    await db.posts.put(post());
    await db.folders.put(folder);
    await db.pinned_tabs.put({ post_id: 'local', order: 0 });
});
test.afterEach(async () => {
    await db.delete();
});

test('invalid replace inputs preserve every table', async () => {
    const original = await snapshot();
    const invalid = [
        '{',
        backup({}),
        backup([{ ...post(), url: 'javascript:alert(1)' }]),
        backup([{ ...post(), tags: 'bad' }]),
        backup([{ ...post(), created_at: 'bad' }]),
        backup([post(), post()]),
        backup([], [folder]),
        backup([], [], ['missing']),
        backup([post()], [{ ...folder, color: 'bad' }]),
        backup([post()], [], [42]),
    ];
    for (const input of invalid) {
        await expect(StorageManager.importData(input, 'replace')).rejects.toThrow();
        expect(await snapshot()).toEqual(original);
    }
});

test('a write failure rolls back cleared posts, folders and pins', async () => {
    const original = await snapshot();
    const fail = () => {
        throw new Error('Simulated write failure');
    };
    db.folders.hook('creating', fail);
    try {
        await expect(
            StorageManager.importData(backup([post()], [folder], ['local']), 'replace')
        ).rejects.toThrow('Simulated write failure');
    } finally {
        db.folders.hook('creating').unsubscribe(fail);
    }
    expect(await snapshot()).toEqual(original);
});

test('merge preserves local edits and remaps colliding IDs and duplicate URLs', async () => {
    const sameUrl = { ...post('other'), notes: 'Old backup' };
    const collision = post('local', 'https://example.com/new');
    await StorageManager.importData(
        backup(
            [sameUrl, collision],
            [
                {
                    ...folder,
                    id: 'incoming',
                    post_ids: ['other', 'local'],
                },
            ],
            ['other', 'local']
        ),
        'merge'
    );
    const result = await snapshot();
    expect(result.posts).toHaveLength(2);
    expect(result.posts.find((p) => p.id === 'local')?.notes).toBe('Keep my edits');
    const added = result.posts.find((p) => p.url.endsWith('/new'))!;
    expect(added.id).not.toBe('local');
    expect(result.folders).toHaveLength(1);
    expect(new Set(result.folders[0]?.post_ids)).toEqual(new Set(['local', added.id]));
    expect(result.pins.map((pin) => pin.post_id)).toEqual(['local', added.id]);
});

test('replace round-trips the exported collection', async () => {
    const original = await snapshot();
    const exported = await StorageManager.exportData();
    await db.posts.put(post('extra', 'https://example.com/extra'));
    await StorageManager.importData(exported, 'replace');
    expect(await snapshot()).toEqual(original);
});

test('legacy embedded folder posts and pin objects are supported', async () => {
    const incoming = post('incoming', 'https://example.com/incoming');
    const legacy = { ...folder, posts: [incoming] } as Record<string, unknown>;
    delete legacy.post_ids;
    await StorageManager.importData(backup([incoming], [legacy], [incoming]), 'replace');
    expect((await db.folders.get('folder'))?.post_ids).toEqual(['incoming']);
    expect((await db.pinned_tabs.toArray()).map((pin) => pin.post_id)).toEqual(['incoming']);
});

test('merge does not trust stale canonical keys for distinct original URLs', async () => {
    const incoming = {
        ...post('new', 'https://example.com/local?page=2'),
        canonical_url: 'https://example.com/local',
    };
    await StorageManager.importData(backup([incoming]), 'merge');
    expect(await db.posts.count()).toBe(2);
});

test('replace preserves duplicate URL records and caps pins without dangling references', async () => {
    const posts = Array.from({ length: 7 }, (_, index) => post(`post-${index}`));
    await StorageManager.importData(
        backup(
            posts,
            [],
            posts.map((p) => p.id)
        ),
        'replace'
    );
    expect(await db.posts.count()).toBe(7);
    expect(await db.pinned_tabs.count()).toBe(5);
});
