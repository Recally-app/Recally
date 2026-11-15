import 'fake-indexeddb/auto';
import { test, expect } from '@playwright/test';
import { db } from '../../src/storage/db';
import { StorageManager as storage } from '../../src/storage/storageManager';
test.beforeEach(async () => {
    Object.assign(globalThis, { chrome: { storage: { local: { get: async () => ({}) } } } });
    await db.delete();
    await db.open();
});
test.afterEach(async () => {
    await db.delete();
});
test('search matches tags without losing title and URL matching', async () => {
    const { post } = await storage.savePost('https://example.com/path', 'Unique title', [
        'Research topic',
    ]);
    for (const query of ['research', ' TOPIC ', 'unique', 'example.com/path'])
        expect((await storage.searchPosts(query)).map((p) => p.id)).toEqual([post.id]);
    expect(await storage.searchPosts('missing')).toEqual([]);
    expect(await storage.searchPosts('   ')).toHaveLength(1);
    await storage.updatePostTags(post.id, []);
    expect(await storage.searchPosts('research')).toEqual([]);
});
