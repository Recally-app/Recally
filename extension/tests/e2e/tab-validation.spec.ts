import { test, expect, chromium, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';
const extensionPath = fileURLToPath(new URL('../../dist/', import.meta.url));
async function seed(page: Page) {
    await page.evaluate(
        () =>
            new Promise<void>((resolve, reject) => {
                const request = indexedDB.open('recally_db');
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    const db = request.result;
                    const tx = db.transaction(['posts', 'folders'], 'readwrite');
                    const time = new Date().toISOString();
                    tx.objectStore('posts').put({
                        id: 'one',
                        url: 'https://example.com/one',
                        canonical_url: 'https://example.com/one',
                        title: 'Article One',
                        tags: [],
                        created_at: time,
                        updated_at: time,
                    });
                    tx.objectStore('folders').put({
                        id: 'folder',
                        name: 'Reading',
                        color: '#123456',
                        post_ids: ['one'],
                        order: 0,
                        created_at: time,
                        updated_at: time,
                    });
                    tx.oncomplete = () => {
                        db.close();
                        resolve();
                    };
                    tx.onerror = () => reject(tx.error);
                };
            })
    );
    await page.reload();
}

test('folder plus rejects internal browser tabs without changing the collection', async ({
    headless,
}) => {
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
        await seed(page);
        await page.getByTitle('Folder View', { exact: true }).click();
        await page.evaluate(() => {
            chrome.tabs.query = async () =>
                [{ id: 123, url: 'chrome://settings/', title: 'Settings' }] as chrome.tabs.Tab[];
        });
        await page.getByTitle('Add current tab to folder', { exact: true }).click();
        await expect(page.getByText('Failed to Add Tab', { exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.getByTitle('List View', { exact: true }).click();
        await expect(page.locator('li[data-post-id]')).toHaveCount(1);
        await expect(page.getByText('Settings', { exact: true })).toHaveCount(0);
    } finally {
        await context.close();
    }
});
