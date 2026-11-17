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

test('search clears with restored focus and labels follow the active view', async ({
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
        const posts = page.getByRole('textbox', { name: 'Search posts', exact: true });
        await posts.fill('missing');
        await expect(page.locator('li[data-post-id]')).toHaveCount(0);
        await page.getByRole('button', { name: 'Clear search' }).click();
        await expect(posts).toHaveValue('');
        await expect(posts).toBeFocused();
        await expect(page.locator('li[data-post-id]')).toHaveCount(1);
        await page.getByTitle('Folder View', { exact: true }).click();
        const folders = page.getByRole('textbox', { name: 'Search folders', exact: true });
        await expect(folders).toHaveAttribute('placeholder', 'Search folders...');
        await folders.fill('missing');
        await expect(
            page.getByText('No folders found matching "missing"', { exact: true })
        ).toBeVisible();
        await page.getByRole('button', { name: 'Clear search' }).click();
        await expect(folders).toBeFocused();
        await expect(page.getByText('Reading', { exact: true })).toBeVisible();
    } finally {
        await context.close();
    }
});
