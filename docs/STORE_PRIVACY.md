# Chrome Web Store privacy declarations

Use these declarations for the release with a locally stored library after this PR is merged and
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
Library storage and search are local. No collection for advertising, analytics, resale, or transfer
to a Recally backend is performed. Do not state that the extension handles no
user data merely because storage is local.

The UI loads stored favicon URLs first, which can contact saved websites or
other image providers, including providers specified in imported backups. The
provider receives the favicon URL and the user’s IP address. When no favicon URL
is stored, the UI requests site icons from DuckDuckGo using saved website hostnames,
including subdomains. Disclose this external transmission in the dashboard's
applicable data-handling fields: DuckDuckGo receives the hostname and the user's
IP address while handling requests. Full saved URL paths, queries, titles,
notes, and tags are not included in DuckDuckGo fallback requests. Images use no-referrer.
Favicon URLs are captured when saving tabs and included in local library data.
Unavailable icons use a bundled fallback.
User-initiated opening of a saved link is an ordinary browser visit.

## Public policy URL

After merge into `dev`, use:

https://github.com/Recally-app/Recally/blob/dev/PRIVACY.md

Before submission, open that URL while signed out and verify it is accessible and
matches the released behavior. During PR review, use the file on the PR's branch;
the `dev` URL does not contain the policy until the PR is merged.
