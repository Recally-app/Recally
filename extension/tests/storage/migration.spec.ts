import 'fake-indexeddb/auto';
import { test, expect } from '@playwright/test';
import Dexie from 'dexie';
import { db } from '../../src/storage/db';

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
let legacy: unknown[];
let failRead = false;
let failClear = false;
test.beforeEach(async () => {
    await db.delete();
    legacy = ['one'];
    failRead = false;
    failClear = false;
    Object.assign(globalThis, {
        chrome: {
            storage: {
                local: {
                    get: async () => {
                        await new Promise((resolve) => setTimeout(resolve, 20));
                        if (failRead) throw new Error('read failed');
                        return { pinnedTabs: legacy };
                    },
                    set: async () => {
                        if (failClear) throw new Error('clear failed');
                        legacy = [];
                    },
                },
            },
        },
    });
});
test.afterEach(async () => {
    await db.delete();
});
async function seed(version: number) {
    const old = new Dexie('recally_db');
    old.version(version).stores({
        posts: 'id, url, canonical_url, title, created_at, *tags',
        folders: 'id, name, created_at, order, *post_ids',
        ...(version === 5 ? { pinned_tabs: 'post_id, order' } : {}),
    });
    await old.open();
    await old
        .table('posts')
        .bulkPut(Array.from({ length: 7 }, (_, i) => post(i === 0 ? 'one' : String(i))));
    old.close();
}
test('v4 pins migrate after asynchronous Chrome read', async () => {
    await seed(4);
    await db.open();
    expect((await db.pinned_tabs.toArray()).map((p) => p.post_id)).toEqual(['one']);
    expect(legacy).toEqual([]);
});
test('already-upgraded v5 profiles recover legacy objects without replacing existing pins', async () => {
    await seed(5);
    legacy = [{ id: 'one' }, '1', '1', 'missing', '2', '3', '4', '5', '6'];
    // Disable migration while seeding existing pins.
    const pending = legacy;
    legacy = [];
    await db.open();
    await db.pinned_tabs.put({ post_id: '6', order: 0 });
    db.close();
    legacy = pending;
    await db.open();
    expect((await db.pinned_tabs.orderBy('order').toArray()).map((p) => p.post_id)).toEqual([
        '6',
        'one',
        '1',
        '2',
        '3',
    ]);
    expect(legacy).toEqual([]);
});

test('read failure leaves the library usable and retries on next open', async () => {
    await seed(5);
    failRead = true;
    await db.open();
    expect(await db.posts.count()).toBe(7);
    expect(legacy).toEqual(['one']);
    db.close();
    failRead = false;
    await db.open();
    expect(await db.pinned_tabs.count()).toBe(1);
});
test('cleanup failure leaves the library usable and retries without duplicating pins', async () => {
    await seed(5);
    failClear = true;
    await db.open();
    expect(await db.posts.count()).toBe(7);
    expect(legacy).toEqual(['one']);
    expect(await db.pinned_tabs.count()).toBe(1);
    db.close();
    failClear = false;
    await db.open();
    expect(await db.pinned_tabs.count()).toBe(1);
    expect(legacy).toEqual([]);
});
test('pin write failure rolls back existing pins and preserves the legacy retry marker', async () => {
    await seed(5);
    legacy = [];
    await db.open();
    await db.pinned_tabs.put({ post_id: '6', order: 0 });
    db.close();
    legacy = ['one'];
    const fail = () => {
        throw new Error('pin write failed');
    };
    db.pinned_tabs.hook('creating', fail);
    try {
        await db.open();
        expect(await db.posts.count()).toBe(7);
        expect(await db.pinned_tabs.toArray()).toEqual([{ post_id: '6', order: 0 }]);
        expect(legacy).toEqual(['one']);
    } finally {
        db.pinned_tabs.hook('creating').unsubscribe(fail);
    }
    db.close();
    await db.open();
    expect((await db.pinned_tabs.orderBy('order').toArray()).map((p) => p.post_id)).toEqual([
        '6',
        'one',
    ]);
    expect(legacy).toEqual([]);
});
