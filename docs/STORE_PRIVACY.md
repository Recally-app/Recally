# Chrome Web Store privacy declarations

Use these declarations for the local-only release after this PR is merged and
the final package has been checked. The publisher must complete and certify the
dashboard entries for the exact uploaded package.

## Single purpose

Save, organize, and find web links selected by the user in a local browser library.

## Permissions

- `tabs`: read the titles and URLs of tabs the user chooses to save, including
  the explicit capture-all-open-tabs action, and open saved links.
- `storage`: persist local extension preferences such as view mode and size.
- No host permissions or remotely hosted executable code are used.

## Data handling

Disclose saved website URLs and titles as browsing activity/website information,
and notes and tags as user-provided content in the dashboard's applicable fields.
Processing is local. No collection for advertising, analytics, resale, or transfer
to a Recally backend is performed. Do not state that the extension handles no
user data merely because storage is local.

The packaged UI uses bundled icons, including for old imported records with
external favicon URLs. It does not contact DuckDuckGo or saved websites to render
the library. User-initiated opening of a saved link is an ordinary browser visit.

## Public policy URL

After merge into `dev`, use:

https://github.com/Recally-app/Recally/blob/dev/PRIVACY.md

Before submission, open that URL while signed out and verify it is accessible and
matches the released behavior. During PR review, use the file on the PR's branch;
the `dev` URL does not contain the policy until the PR is merged.
