import { test, expect, chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const extensionPath = fileURLToPath(new URL('../../dist/', import.meta.url));

test('library, folder and pin rendering make no HTTP requests, including old favicon URLs', async ({
    headless,
}) => {
    const manifest = JSON.parse(await readFile(extensionPath + '/manifest.json', 'utf8'));
    expect(manifest.permissions).toEqual(['storage', 'tabs']);
    expect(manifest.host_permissions ?? []).toEqual([]);
    const context = await chromium.launchPersistentContext('', {
        channel: 'chromium',
        headless,
        ignoreDefaultArgs: ['--disable-extensions'],
        args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    context.setDefaultTimeout(10_000);
    const requests: string[] = [];
    await context.route(/^https?:\/\//, (route) => {
        requests.push(route.request().url());
        return route.abort();
    });
    try {
        const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
        const page = await context.newPage();
        await page.goto(`chrome-extension://${new URL(worker.url()).host}/src/popup/index.html`);
        await expect(page.getByRole('button', { name: 'Save Tab', exact: true })).toBeVisible();
        await page.evaluate(
            () =>
                new Promise<void>((resolve, reject) => {
                    const request = indexedDB.open('recally_db');
                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => {
                        const db = request.result;
                        const tx = db.transaction(['posts', 'folders', 'pinned_tabs'], 'readwrite');
                        const time = new Date().toISOString();
                        tx.objectStore('posts').put({
                            id: 'private',
                            url: 'https://private.example/notes',
                            canonical_url: 'https://private.example/notes',
                            title: 'Private article',
                            favicon_url: 'https://external.example/tracking-icon.png',
                            tags: [],
                            created_at: time,
                            updated_at: time,
                        });
                        tx.objectStore('folders').put({
                            id: 'reading',
                            name: 'Reading',
                            color: '#26405e',
                            post_ids: ['private'],
                            order: 0,
                            created_at: time,
                            updated_at: time,
                        });
                        tx.objectStore('pinned_tabs').put({ post_id: 'private', order: 0 });
                        tx.oncomplete = () => {
                            db.close();
                            resolve();
                        };
                        tx.onerror = () => reject(tx.error);
                    };
                })
        );
        await page.reload();
        await expect(page.locator('li[data-post-id="private"]')).toBeVisible();
        await expect(page.locator('li[data-post-id="private"] img').first()).toHaveJSProperty(
            'complete',
            true
        );
        await expect(
            page.getByTitle('Private article - https://private.example/notes', { exact: true })
        ).toBeVisible();
        await page.getByTitle('Folder View', { exact: true }).click();
        await page.getByText('Reading', { exact: true }).click();
        await expect(page.locator('li[data-post-id="private"]')).toBeVisible();
        await expect(page.locator('li[data-post-id="private"] img').first()).toHaveJSProperty(
            'complete',
            true
        );
        expect(requests).toEqual([]);
    } finally {
        await context.close();
    }
});
