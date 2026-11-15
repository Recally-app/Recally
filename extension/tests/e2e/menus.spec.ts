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

test('action menus persist without hover and support keyboard and outside dismissal', async ({
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
        const trigger = page.getByRole('button', { name: 'Actions', exact: true }).first();
        await trigger.click();
        const menu = page.getByRole('menu');
        await expect(menu).toBeVisible();
        await page.mouse.move(0, 0);
        await expect(menu).toBeVisible();
        const box = await menu.boundingBox();
        expect(box!.y).toBeGreaterThanOrEqual(0);
        expect(box!.y + box!.height).toBeLessThanOrEqual(await page.evaluate(() => innerHeight));
        await page.keyboard.press('End');
        await expect(menu.getByRole('menuitem').last()).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(menu).toHaveCount(0);
        await expect(trigger).toBeFocused();
        await page.keyboard.press('ArrowDown');
        await expect(menu).toBeVisible();
        await page.getByPlaceholder('Search posts...').click();
        await expect(menu).toHaveCount(0);

        await trigger.evaluate((button) => {
            const before = document.createElement('button');
            before.textContent = 'Before actions';
            const after = document.createElement('button');
            after.textContent = 'After actions';
            button.before(before);
            button.after(after);
        });
        await trigger.click();
        await expect(menu).toBeVisible();
        await page.keyboard.press('Tab');
        await expect(menu).toHaveCount(0);
        await expect(
            page.getByRole('button', { name: 'After actions', exact: true })
        ).toBeFocused();
        await trigger.click();
        await expect(menu).toBeVisible();
        await page.keyboard.press('Shift+Tab');
        await expect(menu).toHaveCount(0);
        await expect(
            page.getByRole('button', { name: 'Before actions', exact: true })
        ).toBeFocused();
    } finally {
        await context.close();
    }
});
