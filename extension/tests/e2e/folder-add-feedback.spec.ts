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

test('folder plus reports added and already-present states with explicit labels', async ({
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
                [
                    { id: 123, url: 'https://example.com/two', title: 'Article Two' },
                ] as chrome.tabs.Tab[];
        });
        const add = page.getByRole('button', { name: 'Add current tab to folder', exact: true });
        await add.click();
        await expect(page.locator('.folder-item').getByRole('status')).toHaveText(
            'Current tab added to this folder.'
        );
        await add.click();
        await expect(page.locator('.folder-item').getByRole('status')).toHaveText(
            'Current tab is already in this folder.'
        );
        await expect(page.getByText('2 TABS', { exact: true })).toBeVisible();
        await page
            .locator('.folder-item')
            .getByRole('button', { name: 'Actions', exact: true })
            .first()
            .click();
        await expect(
            page.getByRole('menuitem').filter({ hasText: 'Add Tabs to Folder' })
        ).toBeVisible();
    } finally {
        await context.close();
    }
});
