import { test, expect, chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
const extensionPath = fileURLToPath(new URL('../../dist/', import.meta.url));
test('sorting controls show their effect next to posts and folders', async ({ headless }) => {
    const context = await chromium.launchPersistentContext('', {
        channel: 'chromium',
        headless,
        ignoreDefaultArgs: ['--disable-extensions'],
        args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    try {
        await context.route(/^https?:\/\//, (r) => r.abort());
        const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
        const page = await context.newPage();
        await page.goto(`chrome-extension://${new URL(worker.url()).host}/src/popup/index.html`);
        await expect(page.getByRole('button', { name: 'Save Tab', exact: true })).toBeVisible();
        await page.evaluate(
            () =>
                new Promise<void>((resolve, reject) => {
                    const req = indexedDB.open('recally_db');
                    req.onsuccess = () => {
                        const db = req.result;
                        const tx = db.transaction(['posts', 'folders'], 'readwrite');
                        ['Bravo', 'Alpha', 'Charlie'].forEach((title, index) => {
                            const date = `2026-01-0${index + 1}T00:00:00.000Z`;
                            tx.objectStore('posts').put({
                                id: title,
                                url: `https://example.com/${title}`,
                                canonical_url: `https://example.com/${title}`,
                                title,
                                tags: [],
                                created_at: date,
                                updated_at: date,
                            });
                            tx.objectStore('folders').put({
                                id: title,
                                name: title,
                                color: '#123456',
                                post_ids: [],
                                order: index,
                                created_at: date,
                                updated_at: date,
                            });
                        });
                        tx.oncomplete = () => {
                            db.close();
                            resolve();
                        };
                        tx.onerror = () => reject(tx.error);
                    };
                    req.onerror = () => reject(req.error);
                })
        );
        await page.reload();
        const rows = page.locator('li[data-post-id] h3');
        await expect(rows).toHaveText(['Charlie', 'Alpha', 'Bravo']);
        await page.getByRole('combobox', { name: 'Sort by' }).selectOption('name');
        await expect(rows).toHaveText(['Alpha', 'Bravo', 'Charlie']);
        await page.getByRole('button', { name: 'Sort order: A to Z', exact: true }).click();
        await expect(rows).toHaveText(['Charlie', 'Bravo', 'Alpha']);
        await expect(
            page.getByRole('button', { name: 'Sort order: Z to A', exact: true })
        ).toBeVisible();
        await page.getByTitle('Folder View', { exact: true }).click();
        await expect(page.locator('.folder-item h3')).toHaveText(['Charlie', 'Bravo', 'Alpha']);
        await page.getByRole('combobox', { name: 'Sort by' }).selectOption('date');
        await expect(page.locator('.folder-item h3')).toHaveText(['Charlie', 'Alpha', 'Bravo']);
        await page.getByRole('button', { name: 'Sort order: Newest first', exact: true }).click();
        await expect(page.locator('.folder-item h3')).toHaveText(['Bravo', 'Alpha', 'Charlie']);
    } finally {
        await context.close();
    }
});
