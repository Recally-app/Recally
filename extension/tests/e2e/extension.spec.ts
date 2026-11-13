import { test, expect, chromium, type BrowserContext, type Page } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const extensionPath = fileURLToPath(new URL('../../dist/', import.meta.url));

test('save active tab, reject duplicates, search, and retain data after browser restart', async ({
    headless,
}, testInfo) => {
    const profile = await mkdtemp(path.join(tmpdir(), 'recally-e2e-'));
    const server = createServer((_request, response) => {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(
            '<!doctype html><title>Recally Test Article</title><h1>A local test article</h1>'
        );
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing test server port');
    const articleUrl = `http://127.0.0.1:${address.port}/article`;
    const errors: string[] = [];
    let context: BrowserContext | undefined;
    let popup: Page | undefined;
    let run = 0;
    let extensionId: string | undefined;

    async function launch() {
        context = await chromium.launchPersistentContext(profile, {
            channel: 'chromium',
            timeout: 10_000,
            ignoreDefaultArgs: ['--disable-extensions'],
            headless,
            slowMo: headless ? 0 : 150,
            viewport: { width: 400, height: 620 },
            args: [
                `--disable-extensions-except=${extensionPath}`,
                `--load-extension=${extensionPath}`,
            ],
        });
        context.setDefaultTimeout(10_000);
        context.setDefaultNavigationTimeout(10_000);
        context.on('page', (page) => page.on('pageerror', (error) => errors.push(error.message)));
        // Keep favicon fetching deterministic; all Chrome APIs and storage remain real.
        await context.route('https://icons.duckduckgo.com/**', (route) =>
            route.fulfill({
                contentType: 'image/svg+xml',
                body: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="blue"/></svg>',
            })
        );
        await context.tracing.start({ screenshots: true, snapshots: true });
        if (!extensionId) {
            const worker =
                context.serviceWorkers()[0] ??
                (await context.waitForEvent('serviceworker', { timeout: 10_000 }));
            extensionId = new URL(worker.url()).host;
        }
        popup = await context.newPage();
        await popup.goto(`chrome-extension://${extensionId}/src/popup/index.html`);
        return { context, popup };
    }

    async function closeBrowser() {
        if (!context) return;
        const trace = testInfo.outputPath(`trace-${++run}.zip`);
        await context.tracing.stop({ path: trace });
        await testInfo.attach(`Browser trace ${run}`, {
            path: trace,
            contentType: 'application/zip',
        });
        for (const page of context.pages()) await page.close();
        await context.close();
        context = undefined;
    }

    try {
        const first = await launch();
        await expect(
            first.popup.getByRole('button', { name: 'Save Tab', exact: true })
        ).toBeVisible();
        const reader = await first.context.newPage();
        await reader.goto(articleUrl);

        // The popup document is opened as an extension page for automation. Keep the
        // article active so chrome.tabs.query sees the same tab as a toolbar popup.
        await reader.bringToFront();
        await first.popup.getByRole('button', { name: 'Save Tab', exact: true }).click();
        const cards = first.popup.locator('li[data-post-id]');
        await expect(cards).toHaveCount(1);
        await expect(cards.first()).toContainText('Recally Test Article');
        await expect(
            first.popup.getByRole('button', { name: 'Save Tab', exact: true })
        ).toBeEnabled();
        await reader.bringToFront();
        await first.popup.getByRole('button', { name: 'Save Tab', exact: true }).click();
        await expect(
            first.popup.getByRole('button', { name: 'Save Tab', exact: true })
        ).toBeEnabled();
        await expect(cards).toHaveCount(1);
        await first.popup.getByPlaceholder('Search posts...').fill('no-such-article');
        await expect(cards).toHaveCount(0);
        await expect(first.popup.getByText(/No posts found matching/)).toBeVisible();
        await first.popup.getByPlaceholder('Search posts...').fill('Recally Test');
        await expect(cards).toHaveCount(1);
        await first.popup.screenshot({ path: testInfo.outputPath('saved-article.png') });

        await first.popup.close();
        const reopened = await first.context.newPage();
        await reopened.goto(first.popup.url());
        await expect(reopened.locator('li[data-post-id]')).toHaveCount(1);
        await closeBrowser();
        const restarted = await launch();
        await expect(restarted.popup.locator('li[data-post-id]')).toHaveCount(1);
        await expect(restarted.popup.locator('li[data-post-id]')).toContainText(
            'Recally Test Article'
        );
        await restarted.popup.getByTitle('Folder View', { exact: true }).click();
        await restarted.popup.getByRole('button', { name: '+ Folder', exact: true }).click();
        await restarted.popup.getByPlaceholder('Enter folder name...').fill('Browser test folder');
        await restarted.popup.getByRole('button', { name: 'Create Folder', exact: true }).click();
        await expect(
            restarted.popup.getByText('Browser test folder', { exact: true })
        ).toBeVisible();
        await restarted.popup.reload();
        await expect(
            restarted.popup.getByText('Browser test folder', { exact: true })
        ).toBeVisible();
        await restarted.popup.screenshot({ path: testInfo.outputPath('saved-folder.png') });
        expect(errors, 'Uncaught browser errors').toEqual([]);
    } finally {
        if (popup && !popup.isClosed()) {
            await popup
                .screenshot({ path: testInfo.outputPath('final-state.png'), timeout: 3_000 })
                .catch(() => {});
        }
        await closeBrowser();
        await new Promise<void>((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve()))
        );
        await rm(profile, { recursive: true, force: true });
    }
});
