# Browser testing

The Playwright smoke test builds and loads the real Manifest V3 extension into
bundled Chromium. It uses a temporary browser profile and local article server;
it does not use your personal Chrome profile or saved Recally data.

## Setup

Install Node.js 20.19+ or 22.12+, then from the repository root:

```sh
npm ci
cd extension
npm ci
npx playwright install chromium
```

## Run

From `extension/`:

```sh
npm run test:e2e
```

To watch the browser:

```sh
npm run test:e2e:headed
```

## Coverage

- Save a local article using the real `chrome.tabs` API.
- Save it again and verify only one post exists.
- Search for matching and missing posts.
- Close and reopen the popup document and verify the post remains.
- Restart Chromium with the same temporary profile and verify persistence.
- Create a folder and verify it survives a page reload.
- Fail on uncaught page errors.

Only the external favicon response is stubbed. The app, Chrome APIs, and IndexedDB
are real. The popup document runs in a browser tab for automation, with the article
kept active when saving. Toolbar popup focus, sizing, and dismissal still need a
manual Chrome check. This smoke test does not cover the entire QA checklist.

## Results

Screenshots and browser traces are written to `extension/test-results/`.
View the HTML report from `extension/`:

```sh
npx playwright show-report
```

The test deletes its temporary profile after it finishes. Reports and build output
are ignored by Git.
