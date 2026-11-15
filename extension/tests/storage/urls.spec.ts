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

test('specific attribution keys are removed while ambiguous keys remain', () => {
    const attribution = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'mc_cid',
        'mc_eid',
        'hsCtaTracking',
        'igshid',
    ];
    for (const key of attribution) {
        const url = `https://example.com/read?${key}=value`;
        expect(canonicalizeUrl(url)).toBe('https://example.com/read');
        expect(canonicalizeUrl(url, false)).toBe(url);
    }
    expect(canonicalizeUrl('https://example.com/read?HSCTATRACKING=value')).toBe(
        'https://example.com/read'
    );
    for (const key of [
        'ref',
        'source',
        'campaign',
        'medium',
        'content',
        'affiliate_id',
        'affiliate',
        'partner',
        'promo',
        'si',
        'ncid',
        'cmpid',
        'cid',
        'pid',
        'aid',
        'click_id',
        'clickid',
        'click',
        'session_id',
        'sessionid',
        'sid',
        'timestamp',
        'time',
        't',
        'from',
        'via',
        'share',
        'position',
        'rank',
        'page',
        'sort',
        'order',
        'filter',
        'debug',
        'test',
        'preview',
    ]) {
        const url = `https://example.com/read?${key}=value`;
        expect(canonicalizeUrl(url)).toBe(url);
    }
});

test('YouTube video timestamps do not distinguish saves, even with tracking removal off', () => {
    for (const base of [
        'https://www.youtube.com/watch?v=video&list=playlist',
        'https://m.youtube.com/watch?v=video',
        'https://music.youtube.com/watch?v=video',
        'https://youtu.be/video?list=playlist',
        'https://www.youtube.com/embed/video',
        'https://www.youtube-nocookie.com/embed/video',
        'https://www.youtube.com/shorts/video',
        'https://www.youtube.com/live/video',
    ]) {
        for (const enabled of [true, false]) {
            for (const timestamp of ['t=90', 'start=90', 'time_continue=90']) {
                expect(
                    canonicalizeUrl(base + (base.includes('?') ? '&' : '?') + timestamp, enabled)
                ).toBe(canonicalizeUrl(base, enabled));
            }
            expect(canonicalizeUrl(base + '#t=1m30s', enabled)).toBe(
                canonicalizeUrl(base, enabled)
            );
            expect(canonicalizeUrl(base + '#section', enabled)).toContain('#section');
        }
    }
    for (const url of [
        'https://example.com/watch?v=video&t=90',
        'https://youtube.com.evil.example/watch?v=video&t=90',
        'https://youtube.com/results?search_query=video&t=90',
        'https://youtube.com/watch?t=90',
    ]) {
        expect(canonicalizeUrl(url)).toBe(url);
    }
    expect(canonicalizeUrl('https://youtube.com/watch?v=one&t=90')).not.toBe(
        canonicalizeUrl('https://youtube.com/watch?v=two&t=90')
    );
});

test('video duplicate matching keeps the original saved link intact', async () => {
    const url = 'https://www.youtube.com/watch?v=video&t=90';
    const first = await LocalStorageProvider.savePost(url, 'Video');
    const again = await LocalStorageProvider.savePost(
        'https://www.youtube.com/watch?v=video&t=120',
        'Video later'
    );
    expect(again.wasDuplicate).toBe(true);
    expect(again.post.id).toBe(first.post.id);
    expect(again.post.url).toBe(url);
    expect(await db.posts.count()).toBe(1);
});
