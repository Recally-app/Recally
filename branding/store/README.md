# Chrome Web Store assets

- `icon-128.png`: 128 x 128 PNG with a 96 x 96 brand tile and transparent padding.
  Also copied to the manifest's 128px icon path.
- `01-saved-library.png`: 1280 x 800 screenshot showing saved posts, tags, and a pin.
- `02-folders.png`: 1280 x 800 screenshot showing a folder with saved posts.

The vector icon master reuses the existing Recally mark and colors. Screenshots
are captured from the production extension using fictional demo records in a
temporary Chromium profile. A full-bleed branded canvas places captions beside the actual popup, uniformly
scaled to 120%; no features are drawn into the captured UI. Both PNG screenshots
are full bleed and can be uploaded to the store listing.

## Regenerate

From `extension/`, after installing project dependencies:

```sh
npx playwright install chromium
npm run assets:store
```

The script rasterizes the checked-in vector icon, builds the extension, captures
the two views, and verifies all output dimensions. Regenerate after UI changes
are merged so the listing matches the exact release candidate.

## Listing copy

Name: Recally

Short description: Save and recall the articles and posts you read online.

Suggested description:

Save the page you are reading and find it again from your browser toolbar.
Recally keeps a local library of links with searchable titles and URLs, tags,
notes, folders, and pinned items for quick access. Export a JSON backup or import
a saved library from the settings menu.

This release works locally without an account. Cloud sync and a web dashboard
are not included. Keep backups of important saved content.

Before submission, add the public privacy-policy URL and support details and
complete the publisher's permission and data-use declarations. This PR supplies
assets; it does not submit or publish a store listing.

Requirements checked against:
https://developer.chrome.com/docs/webstore/images
