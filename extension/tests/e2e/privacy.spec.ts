import { test, expect, chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const extensionPath = fileURLToPath(new URL('../../dist/', import.meta.url));

for (const storedIcon of [true, false]) {
    for (const iconAvailable of [true, false]) {
        test(`library, folder and pin icons (${storedIcon ? 'stored URL' : 'DuckDuckGo fallback'}) ${iconAvailable ? 'load successfully' : 'fall back when unavailable'} without host permissions`, async ({
            headless,
        }) => {
            const manifest = JSON.parse(await readFile(extensionPath + '/manifest.json', 'utf8'));
            expect(manifest.permissions).toEqual(['storage', 'tabs']);
            expect(manifest.host_permissions ?? []).toEqual([]);
            const context = await chromium.launchPersistentContext('', {
                channel: 'chromium',
                headless,
                ignoreDefaultArgs: ['--disable-extensions'],
                args: [
                    `--disable-extensions-except=${extensionPath}`,
                    `--load-extension=${extensionPath}`,
                ],
            });
            context.setDefaultTimeout(10_000);
            const requests: string[] = [];
            const iconUrl = storedIcon
                ? 'https://external.example/tracking-icon.png'
                : 'https://icons.duckduckgo.com/ip3/private.example.ico';
            const icon = await readFile(
                fileURLToPath(new URL('../../src/assets/icon/favicon-16.png', import.meta.url))
            );
            await context.route(/^https?:\/\//, (route) => {
                requests.push(route.request().url());
                if (iconAvailable && route.request().url() === iconUrl) {
                    return route.fulfill({ contentType: 'image/png', body: icon });
                }
                return route.abort();
            });
            try {
                const worker =
                    context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
                const page = await context.newPage();
                await page.goto(
                    `chrome-extension://${new URL(worker.url()).host}/src/popup/index.html`
                );
                await expect(
                    page.getByRole('button', { name: 'Save Tab', exact: true })
                ).toBeVisible();
                await page.evaluate(
                    (hasStoredIcon) =>
                        new Promise<void>((resolve, reject) => {
                            const request = indexedDB.open('recally_db');
                            request.onerror = () => reject(request.error);
                            request.onsuccess = () => {
                                const db = request.result;
                                const tx = db.transaction(
                                    ['posts', 'folders', 'pinned_tabs'],
                                    'readwrite'
                                );
                                const time = new Date().toISOString();
                                tx.objectStore('posts').put({
                                    id: 'private',
                                    url: 'https://private.example/notes',
                                    canonical_url: 'https://private.example/notes',
                                    title: 'Private article',
                                    favicon_url: hasStoredIcon
                                        ? 'https://external.example/tracking-icon.png'
                                        : undefined,
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
                        }),
                    storedIcon
                );
                await page.reload();
                await expect(page.locator('li[data-post-id="private"]')).toBeVisible();
                const assertIcon = async (image: ReturnType<typeof page.locator>) => {
                    await expect(image).toHaveAttribute(
                        'src',
                        iconAvailable
                            ? iconUrl
                            : /^(data:image\/svg\+xml|chrome-extension:\/\/.*\.svg)/
                    );
                    await expect(image).toHaveJSProperty('complete', true);
                    await expect
                        .poll(() =>
                            image.evaluate((element) => (element as HTMLImageElement).naturalWidth)
                        )
                        .toBeGreaterThan(0);
                };
                await assertIcon(
                    page.locator('li[data-post-id="private"] img[alt="private.example favicon"]')
                );
                await expect(
                    page.getByTitle('Private article - https://private.example/notes', {
                        exact: true,
                    })
                ).toBeVisible();
                await assertIcon(
                    page
                        .getByTitle('Private article - https://private.example/notes', {
                            exact: true,
                        })
                        .locator('img')
                );
                await page.getByTitle('Folder View', { exact: true }).click();
                await page.getByText('Reading', { exact: true }).click();
                await expect(page.locator('li[data-post-id="private"]')).toBeVisible();
                await assertIcon(
                    page.locator('li[data-post-id="private"] img[alt="private.example favicon"]')
                );
                expect(requests.length).toBeGreaterThan(0);
                expect(requests.every((url) => url === iconUrl)).toBe(true);
            } finally {
                await context.close();
            }
        });
    }
}
