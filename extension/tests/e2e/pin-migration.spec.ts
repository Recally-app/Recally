import { test, expect, chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const extensionPath = fileURLToPath(new URL('../../dist/', import.meta.url));
test('v4 Chrome storage pins survive upgrade and popup reload', async ({ headless }) => {
    const context = await chromium.launchPersistentContext('', {
        channel: 'chromium',
        headless,
        ignoreDefaultArgs: ['--disable-extensions'],
        args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    try {
        await context.route(/^https?:\/\//, (route) => route.abort());
        const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
        const origin = `chrome-extension://${new URL(worker.url()).host}`;
        const page = await context.newPage();
        await page.goto(`${origin}/src/popup/index.html`);
        await expect(page.getByRole('button', { name: 'Save Tab', exact: true })).toBeVisible();
        await page.goto(`${origin}/manifest.json`);
        await page.evaluate(async () => {
            await chrome.storage.local.set({ pinnedTabs: ['one'] });
            await new Promise<void>((resolve, reject) => {
                const req = indexedDB.deleteDatabase('recally_db');
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });
            await new Promise<void>((resolve, reject) => {
                const req = indexedDB.open('recally_db', 40);
                req.onupgradeneeded = () => {
                    const db = req.result;
                    const posts = db.createObjectStore('posts', { keyPath: 'id' });
                    for (const key of ['url', 'canonical_url', 'title', 'created_at'])
                        posts.createIndex(key, key);
                    posts.createIndex('tags', 'tags', { multiEntry: true });
                    const folders = db.createObjectStore('folders', { keyPath: 'id' });
                    for (const key of ['name', 'created_at', 'order'])
                        folders.createIndex(key, key);
                    folders.createIndex('post_ids', 'post_ids', { multiEntry: true });
                    const time = new Date().toISOString();
                    posts.put({
                        id: 'one',
                        url: 'https://example.com/one',
                        canonical_url: 'https://example.com/one',
                        title: 'Article One',
                        tags: [],
                        created_at: time,
                        updated_at: time,
                    });
                };
                req.onsuccess = () => {
                    req.result.close();
                    resolve();
                };
                req.onerror = () => reject(req.error);
            });
        });
        await page.goto(`${origin}/src/popup/index.html`);
        await expect(
            page.getByTitle('Article One - https://example.com/one', { exact: true })
        ).toBeVisible({ timeout: 3000 });
        await page.reload();
        await expect(
            page.getByTitle('Article One - https://example.com/one', { exact: true })
        ).toBeVisible();
        expect(
            (await page.evaluate(() => chrome.storage.local.get(['pinnedTabs']))).pinnedTabs
        ).toEqual([]);
    } finally {
        await context.close();
    }
});
