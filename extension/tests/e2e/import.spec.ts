import { test, chromium, expect } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

test('invalid replace backup preserves saved posts after reload', async ({ headless }) => {
    const profile = await mkdtemp(path.join(tmpdir(), 'recally-release-review-'));
    const extensionPath = fileURLToPath(new URL('../../dist/', import.meta.url));
    const context = await chromium.launchPersistentContext(profile, {
        channel: 'chromium',
        headless,
        ignoreDefaultArgs: ['--disable-extensions'],
        args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    context.setDefaultTimeout(10000);
    try {
        await context.route('http://recally-review.test/**', (route) =>
            route.fulfill({
                contentType: 'text/html',
                body: '<title>Release review article</title><h1>Article</h1>',
            })
        );
        await context.route('https://icons.duckduckgo.com/**', (route) =>
            route.fulfill({ status: 404, body: '' })
        );
        const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
        const id = new URL(worker.url()).host;
        const popup = await context.newPage();
        await popup.goto(`chrome-extension://${id}/src/popup/index.html`);
        const article = await context.newPage();
        await article.goto('http://recally-review.test/article');
        await article.bringToFront();
        await popup.getByRole('button', { name: 'Save Tab', exact: true }).click();
        await expect(popup.locator('li[data-post-id]')).toHaveCount(1);
        async function countPosts() {
            return popup.evaluate(
                () =>
                    new Promise((resolve, reject) => {
                        const request = indexedDB.open('recally_db');
                        request.onsuccess = () => {
                            const db = request.result;
                            const count = db
                                .transaction('posts', 'readonly')
                                .objectStore('posts')
                                .count();
                            count.onsuccess = () => {
                                resolve(count.result);
                                db.close();
                            };
                            count.onerror = () => reject(count.error);
                        };
                        request.onerror = () => reject(request.error);
                    })
            );
        }
        await popup.getByRole('button', { name: 'Recally icon', exact: true }).click();
        await popup.getByRole('button', { name: 'Import', exact: true }).click();
        const chooserPromise = popup.waitForEvent('filechooser');
        await popup.getByRole('button', { name: 'Replace', exact: true }).click();
        const chooser = await chooserPromise;
        await chooser.setFiles({
            name: 'invalid-backup.json',
            mimeType: 'application/json',
            buffer: Buffer.from(
                JSON.stringify({
                    version: '1.0.0',
                    data: { posts: {}, folders: [], pinnedTabs: [] },
                })
            ),
        });
        await popup.getByRole('button', { name: 'Replace All', exact: true }).click();
        await expect(popup.getByText('Import Failed', { exact: true })).toBeVisible();
        await popup.getByRole('button', { name: 'OK', exact: true }).click();
        await popup.reload();
        await expect(popup.locator('li[data-post-id]')).toHaveCount(1);
        expect(await countPosts()).toBe(1);
    } finally {
        await context.close();
        await rm(profile, { recursive: true, force: true });
    }
});
