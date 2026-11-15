import { test, expect, chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
const extensionPath = fileURLToPath(new URL('../../dist/', import.meta.url));
for (const view of ['list', 'folder']) {
    test(`notes scroll at both boundaries without losing the ${view} controls`, async ({
        headless,
    }) => {
        const context = await chromium.launchPersistentContext('', {
            channel: 'chromium',
            headless,
            ignoreDefaultArgs: ['--disable-extensions'],
            args: [
                `--disable-extensions-except=${extensionPath}`,
                `--load-extension=${extensionPath}`,
            ],
        });
        try {
            await context.route(/^https?:\/\//, (r) => r.abort());
            const worker =
                context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
            const page = await context.newPage();
            const height = view === 'folder' ? 240 : 400;
            await page.setViewportSize({ width: 380, height });
            await page.goto(
                `chrome-extension://${new URL(worker.url()).host}/src/popup/index.html`
            );
            await expect(page.getByRole('button', { name: 'Save Tab', exact: true })).toBeVisible();
            await page.evaluate(
                () =>
                    new Promise<void>((resolve, reject) => {
                        const req = indexedDB.open('recally_db');
                        req.onsuccess = () => {
                            const db = req.result;
                            const tx = db.transaction(['posts', 'folders'], 'readwrite');
                            const time = new Date().toISOString();
                            const ids = Array.from({ length: 12 }, (_, i) => `post-${i}`);
                            for (const id of ids)
                                tx.objectStore('posts').put({
                                    id,
                                    url: `https://example.com/${id}`,
                                    canonical_url: `https://example.com/${id}`,
                                    title: id,
                                    tags: [],
                                    notes: 'Long note line\n'.repeat(150),
                                    created_at: time,
                                    updated_at: time,
                                });
                            tx.objectStore('folders').put({
                                id: 'reading',
                                name: 'Reading',
                                color: '#123456',
                                post_ids: ids,
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
                        req.onerror = () => reject(req.error);
                    })
            );
            await page.evaluate(
                (height) => chrome.storage.local.set({ popupHeight: height }),
                height
            );
            await page.reload();
            if (view === 'folder') {
                await page.getByTitle('Folder View', { exact: true }).click();
                await page.getByText('Reading', { exact: true }).click();
            }
            const rows = page.locator('li[data-post-id]');
            await expect(rows).toHaveCount(12);
            const last = rows.last();
            await last.scrollIntoViewIfNeeded();
            await page.mouse.move(0, 0);
            const blank = await last.evaluate((row) => {
                const list = row.closest('.scrollable-list')!;
                return (
                    list.scrollHeight -
                    (row.getBoundingClientRect().bottom -
                        list.getBoundingClientRect().top +
                        list.scrollTop)
                );
            });
            expect(blank).toBeLessThan(25);
            await last
                .locator('button')
                .filter({ has: page.locator('img[alt="Note"]') })
                .click();
            const dialog = page.getByRole('dialog', { name: 'Edit note' });
            const note = dialog.getByRole('textbox', { name: 'Note', exact: true });
            await expect(dialog).toBeVisible();
            const box = await dialog.boundingBox();
            expect(box!.y).toBeGreaterThanOrEqual(0);
            expect(box!.y + box!.height).toBeLessThanOrEqual(height);
            await note.evaluate((el) => (el.scrollTop = el.scrollHeight));
            await note.hover();
            await page.mouse.wheel(0, -300);
            await expect
                .poll(() =>
                    note.evaluate((el) => el.scrollTop < el.scrollHeight - el.clientHeight - 10)
                )
                .toBe(true);
            await note.evaluate((el) => (el.scrollTop = 0));
            await page.mouse.wheel(0, 300);
            await expect.poll(() => note.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
            await expect(
                dialog.getByRole('button', { name: 'Cancel', exact: true })
            ).toBeInViewport();

            if (view === 'list') {
                await note.fill('Draft survives a failed save');
                await page.evaluate(() => {
                    const original = IDBObjectStore.prototype.put;
                    IDBObjectStore.prototype.put = function (value: unknown, key?: IDBValidKey) {
                        if (this.name === 'posts') {
                            IDBObjectStore.prototype.put = original;
                            throw new DOMException('Test write failure', 'QuotaExceededError');
                        }
                        return original.call(this, value, key);
                    };
                });
                await dialog.getByRole('button', { name: 'Save', exact: true }).click();
                await expect(dialog.getByRole('alert')).toHaveText(
                    'Could not save note. Please try again.'
                );
                await expect(note).toHaveValue('Draft survives a failed save');
                await page.evaluate(
                    () =>
                        new Promise<void>((resolve, reject) => {
                            const request = indexedDB.open('recally_db');
                            request.onerror = () => reject(request.error);
                            request.onsuccess = () => {
                                const db = request.result;
                                const tx = db.transaction('posts', 'readwrite');
                                let released = false;
                                (
                                    window as Window & { releaseNoteWrite?: () => void }
                                ).releaseNoteWrite = () => {
                                    released = true;
                                };
                                const ping = () => {
                                    const read = tx.objectStore('posts').get('post-0');
                                    read.onsuccess = () => {
                                        resolve();
                                        if (!released) ping();
                                    };
                                };
                                tx.oncomplete = () => db.close();
                                ping();
                            };
                        })
                );
                await dialog.getByRole('button', { name: 'Save', exact: true }).click();
                await expect(note).toHaveAttribute('readonly', '');
                await page.evaluate(() =>
                    (window as Window & { releaseNoteWrite?: () => void }).releaseNoteWrite?.()
                );
                await expect(dialog).toHaveCount(0);
            } else {
                await page.keyboard.press('Escape');
            }
            await expect(dialog).toHaveCount(0);
            await expect(last).toBeVisible();
        } finally {
            await context.close();
        }
    });
}
