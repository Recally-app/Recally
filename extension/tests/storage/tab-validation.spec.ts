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
test('all save entry points reject unsupported URLs before writing', async () => {
    for (const url of [
        'chrome://settings/',
        'about:blank',
        'file:///tmp/page.html',
        'javascript:alert(1)',
        'data:text/html,hi',
        'not a url',
    ]) {
        await expect(storage.savePost(url, 'Title')).rejects.toThrow('Only HTTP and HTTPS');
    }
    expect(await db.posts.count()).toBe(0);
    for (const url of ['http://example.com/one', 'https://example.com/two'])
        await storage.savePost(url, 'Title');
    const exported = await storage.exportData();
    await storage.importData(exported, 'replace');
    expect(await db.posts.count()).toBe(2);
});
