import 'fake-indexeddb/auto';
import { test, expect } from '@playwright/test';
import { canonicalizeUrl } from '../../src/utils/canonicalizeUrl';
import { LocalStorageProvider } from '../../src/storage/localStorageProvider';
import { db } from '../../src/storage/db';

test.beforeEach(async () => {
    Object.assign(globalThis, { chrome: { storage: { local: { get: async () => ({}) } } } });
    await db.delete();
    await db.open();
});
test.afterEach(async () => {
    await db.delete();
});

test('meaningful parameters, hash routes, path case and protocols stay distinct', () => {
    const urls = [
        'https://example.com/article?page=1',
        'https://example.com/article?page=2',
        'https://example.com/article?sort=name',
        'https://example.com/article?sort=date',
        'https://example.com/article?filter=read',
        'https://example.com/article?ref=another-page',
        'https://example.com/Article',
        'https://example.com/article',
        'http://example.com/article',
        'https://example.com/article#section',
    ];
    expect(new Set(urls.map((url) => canonicalizeUrl(url))).size).toBe(urls.length);
});

test('only known attribution parameters are stripped, respecting opt-out', () => {
    const url = 'https://www.example.com/read/?page=2&utm_source=mail&fbclid=123&ref=docs';
    expect(canonicalizeUrl(url)).toBe('https://example.com/read?page=2&ref=docs');
    expect(canonicalizeUrl(url, false)).toContain('utm_source=mail');
});

test('saving different pages keeps both even when old cached canonical URLs are wrong', async () => {
    const first = await LocalStorageProvider.savePost('https://example.com/read?page=1', 'Page 1');
    await db.posts.update(first.post.id, { canonical_url: 'https://example.com/read' });
    const second = await LocalStorageProvider.savePost('https://example.com/read?page=2', 'Page 2');
    expect(second.wasDuplicate).toBe(false);
    expect(await db.posts.count()).toBe(2);
    const again = await LocalStorageProvider.savePost(
        'https://example.com/read?page=1&utm_source=mail',
        'Again'
    );
    expect(again.wasDuplicate).toBe(true);
    expect(again.post.id).toBe(first.post.id);
    expect(await db.posts.count()).toBe(2);
});

test('concurrent saves of the same tab insert one post', async () => {
    const results = await Promise.all(
        Array.from({ length: 8 }, (_, index) =>
            LocalStorageProvider.savePost('https://example.com/read?utm_source=' + index, 'Article')
        )
    );
    expect(await db.posts.count()).toBe(1);
    expect(results.filter((result) => !result.wasDuplicate)).toHaveLength(1);
});

test('preference changes are applied to existing original URLs', async () => {
    const url = 'https://example.com/read?utm_source=one';
    await LocalStorageProvider.savePost(url, 'One');
    Object.assign(globalThis, {
        chrome: {
            storage: {
                local: {
                    get: async () => ({ userPreferences: { removeTrackingParams: false } }),
                },
            },
        },
    });
    expect((await LocalStorageProvider.savePost(url, 'Again')).wasDuplicate).toBe(true);
    expect(
        (await LocalStorageProvider.savePost('https://example.com/read?utm_source=two', 'Two'))
            .wasDuplicate
    ).toBe(false);
});
