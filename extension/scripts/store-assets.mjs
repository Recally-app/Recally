import { chromium } from '@playwright/test';
import { mkdir, readFile, copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const extensionDir = fileURLToPath(new URL('../', import.meta.url));
const storeDir = path.resolve(extensionDir, '../branding/store');
await mkdir(storeDir, { recursive: true });

// Rasterize the existing brand mark from the checked-in vector master.
const browser = await chromium.launch({ channel: 'chromium' });
try {
    const page = await browser.newPage({ viewport: { width: 128, height: 128 } });
    const svg = await readFile(path.join(storeDir, 'icon.svg'), 'utf8');
    await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    await page.screenshot({ path: path.join(storeDir, 'icon-128.png'), omitBackground: true });
    await copyFile(
        path.join(storeDir, 'icon-128.png'),
        path.join(extensionDir, 'src/assets/icon/recally-icon-128.png')
    );
} finally {
    await browser.close();
}

execFileSync('npm', ['run', 'build'], { cwd: extensionDir, stdio: 'inherit' });
const extensionPath = path.join(extensionDir, 'dist');
const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    ignoreDefaultArgs: ['--disable-extensions'],
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
});
context.setDefaultTimeout(10_000);
try {
    // Assets use only fictional demo records; no private browser profile is used.
    await context.route(/^https?:\/\//, (route) => route.abort());
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
    const page = await context.newPage();
    await page.goto(`chrome-extension://${new URL(worker.url()).host}/src/popup/index.html`);
    await page.getByRole('button', { name: 'Save Tab', exact: true }).waitFor();
    const icon =
        'data:image/svg+xml,' +
        encodeURIComponent(
            await readFile(path.join(extensionDir, 'src/assets/icon/recally_icon.svg'), 'utf8')
        );
    await page.evaluate(async (favicon) => {
        // Capture the app at a useful reading height in the listing canvas.
        await globalThis.chrome.storage.local.set({ popupHeight: 500, viewMode: 'list' });
        await new Promise((resolve, reject) => {
            const request = indexedDB.open('recally_db');
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction(['posts', 'folders', 'pinned_tabs'], 'readwrite');
                const time = '2026-11-12T12:00:00.000Z';
                const posts = [
                    {
                        id: 'react',
                        title: 'Understanding React Effects',
                        url: 'https://react.dev/learn/synchronizing-with-effects',
                        tags: ['React'],
                    },
                    {
                        id: 'storage',
                        title: 'Working with IndexedDB',
                        url: 'https://developer.chrome.com/docs',
                        tags: ['Storage'],
                    },
                ];
                for (const post of posts)
                    tx.objectStore('posts').put({
                        ...post,
                        canonical_url: post.url,
                        favicon_url: favicon,
                        notes: '',
                        created_at: time,
                        updated_at: time,
                    });
                tx.objectStore('folders').put({
                    id: 'reading',
                    name: 'Developer reading',
                    color: '#4CA1F7',
                    post_ids: posts.map((post) => post.id),
                    order: 0,
                    created_at: time,
                    updated_at: time,
                });
                tx.objectStore('pinned_tabs').put({ post_id: 'react', order: 0 });
                tx.oncomplete = () => {
                    db.close();
                    resolve();
                };
                tx.onerror = () => reject(tx.error);
            };
        });
    }, icon);
    async function prepareCapture(title, description) {
        await page.addStyleTag({
            content: `
            html,body{width:1280px;height:800px;min-height:800px;max-height:800px;overflow:hidden}
            body{background:radial-gradient(ellipse at 10% 10%,#26405e,#141d26 75%)}
            #root{position:absolute;right:100px;top:100px;width:380px;transform:scale(1.2);transform-origin:top right;box-shadow:0 24px 80px #0006}
            .store-caption{position:absolute;left:80px;top:180px;width:510px;color:white}
            .store-caption small{color:#4ca1f7;letter-spacing:4px;font-size:18px;font-weight:600}
            .store-caption h1{font-size:62px;line-height:1.08;margin:30px 0 24px}
            .store-caption p{font-size:25px;line-height:1.5;color:#cad7e4;margin:0}
        `,
        });
        await page.evaluate(
            ({ title, description }) => {
                document.querySelector('.store-caption')?.remove();
                const aside = document.createElement('aside');
                aside.className = 'store-caption';
                const brand = document.createElement('small');
                brand.textContent = 'RECALLY';
                const heading = document.createElement('h1');
                heading.textContent = title;
                const copy = document.createElement('p');
                copy.textContent = description;
                aside.append(brand, heading, copy);
                document.body.append(aside);
            },
            { title, description }
        );
        await page.evaluate(() => document.fonts.ready);
    }
    await page.reload();
    await page.locator('li[data-post-id="react"]').waitFor();
    await prepareCapture(
        'Save what you read.',
        'Keep useful links, notes, and tags together in your browser. No account needed.'
    );
    await page.screenshot({
        path: path.join(storeDir, '01-saved-library.png'),
        animations: 'disabled',
    });
    await page.getByTitle('Folder View', { exact: true }).click();
    await page.getByText('Developer reading', { exact: true }).click();
    await page.locator('li[data-post-id="react"]').waitFor();
    await prepareCapture(
        'Make room for recall.',
        'Group related links in folders and pin the ones you return to most.'
    );
    await page.screenshot({ path: path.join(storeDir, '02-folders.png'), animations: 'disabled' });
} finally {
    await context.close();
}

// Check the real PNG headers rather than trusting file names.
for (const [file, width, height] of [
    ['icon-128.png', 128, 128],
    ['01-saved-library.png', 1280, 800],
    ['02-folders.png', 1280, 800],
]) {
    const png = await readFile(path.join(storeDir, file));
    assert.equal(png.readUInt32BE(16), width, `${file}: width`);
    assert.equal(png.readUInt32BE(20), height, `${file}: height`);
    console.log(`${file}: ${width} x ${height}`);
}
