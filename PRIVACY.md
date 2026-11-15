# Recally privacy policy

Last updated: November 15, 2026

This policy describes the Recally browser extension with a locally stored library. Future account,
cloud-sync, or analytics features would require an updated policy and disclosures
before they are enabled.

## Information handled

When you choose to save a tab or capture open tabs into a folder, Recally reads
the relevant tab titles, URLs, and available favicon URLs. It stores saved URLs, titles, tags, notes,
timestamps, folder memberships, and pinned-tab choices in your browser's local
IndexedDB storage. Display preferences are kept in local extension storage.
Favicon URLs are also stored when available and may be included in imported
backups. Recally loads these URLs to display site icons, as described below.

Recally does not continuously record browsing history. Reading open-tab titles
and URLs supports actions you choose, such as saving a tab or saving all open
tabs into a folder.

## Use and disclosure

Recally uses this information to provide its save, organize, search, and recall
features. This version has no Recally server, account system, analytics, or
advertising SDK. Recally does not upload your library, notes, or tags to a Recally server.

To display site-specific icons in lists, folders, and pins, Recally first uses
the stored favicon URL, when present. This can contact the saved website or
another image provider, including a provider specified in an imported backup.
That provider receives the requested favicon URL and your IP address while
handling the request; its own privacy practices apply.

When no favicon URL is stored, Recally requests favicons from DuckDuckGo at `https://icons.duckduckgo.com/ip3/<hostname>.ico`.
Opening or browsing your library can trigger these requests. DuckDuckGo receives
the saved website's hostname (including any subdomain) and your IP address while
handling the request. Recally does not include the saved URL's path, query,
fragment, title, notes, or tags in DuckDuckGo fallback requests, and sets no-referrer on these
images. These requests are subject to [DuckDuckGo's privacy policy](https://duckduckgo.com/privacy).
All favicon images use no-referrer. Recally uses a bundled icon if a favicon
cannot be loaded. Only import backups you trust, as their favicon URLs can
trigger requests when displayed.

Choosing to open a saved link navigates your browser to that website. That visit
is subject to the website's own privacy practices and your browser settings.
Chrome Web Store installation and browser services are governed by Google's
policies, separately from Recally.

We do not sell user data or use it for advertising. Recally's use of information
complies with the Chrome Web Store User Data Policy, including its Limited Use
requirements, and is limited to the extension's disclosed functionality.

## Permissions

- `tabs`: read titles and URLs for tab-saving actions, including capturing open
  tabs into a folder, and open saved links.
- `storage`: retain local display and user preferences.

Recally requests no host permissions, injects no content scripts, and does not
read page bodies, passwords, cookies, or form contents.

## Storage, backups, and deletion

Your saved library stays in the browser profile where Recally is installed until you delete
it or the browser removes extension data. Recally does not sync this data across
devices. Local browser storage is not a substitute for a backup.

You can delete saved posts and folders using the extension's controls. Removing
the extension removes its local extension data under Chrome's normal uninstall
behavior. Export creates a JSON file containing your saved library. That file is
not encrypted by Recally and remains wherever you save or copy it; delete exported
copies separately when no longer needed. Only import backups you trust.

## Contact and changes

Questions or privacy requests can be sent through
[the Recally issue tracker](https://github.com/Recally-app/Recally/issues).
Do not include private URLs, notes, or backups in a public issue. Requests that
require private information can begin with a general request for a private
contact method. We cannot retrieve or erase browser-local data remotely.

Changes to this policy will be published here with an updated date.
