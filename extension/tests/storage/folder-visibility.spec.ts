import 'fake-indexeddb/auto';
import { test, expect } from '@playwright/test';
import { db } from '../../src/storage/db';
import { StorageManager as storage } from '../../src/storage/storageManager';
const time = '2026-01-01T00:00:00.000Z';
const folder = {
    id: 'legacy',
    name: 'Legacy',
    color: '#123456',
    post_ids: [],
    created_at: time,
    updated_at: time,
};
test.beforeEach(async () => {
    await db.delete();
    await db.open();
});
test.afterEach(async () => {
    await db.delete();
});
test('folders without optional order stay visible through import and export', async () => {
    await storage.importData(
        JSON.stringify({ version: '1.0.0', data: { posts: [], folders: [folder] } }),
        'replace'
    );
    expect(await storage.getAllFolders()).toEqual([folder]);
    const exported = await storage.exportData();
    expect(JSON.parse(exported).data.folders).toEqual([folder]);
    await storage.importData(exported, 'replace');
    expect(await storage.getAllFolders()).toEqual([folder]);
});
test('existing local unordered folders are visible alongside ordered records', async () => {
    await db.folders.bulkPut([
        folder,
        { ...folder, id: 'last', order: 10 },
        { ...folder, id: 'first', order: -1 },
    ]);
    expect((await storage.getAllFolders()).map((f) => f.id)).toEqual(['first', 'legacy', 'last']);
    expect((await db.folders.get('legacy'))?.order).toBeUndefined();
});
