# Recally privacy policy

Last updated: November 12, 2026

This policy describes the local-only Recally browser extension. Future account,
cloud-sync, or analytics features would require an updated policy and disclosures
before they are enabled.

## Information handled

When you choose to save a tab or capture open tabs into a folder, Recally reads
the relevant tab titles and URLs. It stores saved URLs, titles, tags, notes,
timestamps, folder memberships, and pinned-tab choices in your browser's local
IndexedDB storage. Display preferences are kept in local extension storage.
Imported backups may also contain historical favicon URL metadata. Recally does
not load those URLs or send them to an icon service.

Recally does not continuously record browsing history. Reading open-tab titles
and URLs supports actions you choose, such as saving a tab or saving all open
tabs into a folder.

## Use and disclosure

Recally uses this information to provide its save, organize, search, and recall
features. This version has no Recally server, account system, analytics, or
advertising SDK. The extension does not transmit your saved library, notes,
tags, or browsing activity to us or third parties. Site icons displayed in the
extension are bundled assets; opening your library makes no external favicon
requests.

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

Data stays in the browser profile where Recally is installed until you delete
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
