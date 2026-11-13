# Saved URL matching

Duplicate detection preserves parameters that can change page content, including
`page`, `sort`, `filter`, `ref`, and `id`. Path case, HTTP versus HTTPS, and hash
routes also remain distinct. Only UTM parameters and explicit advertising/campaign
click IDs are removed when tracking-parameter removal is enabled.

Original saved URLs are never rewritten. Existing rows are compared using their
original URL and the current preference, so old cached canonical URLs cannot
silently prevent saving another page. This performs a local scan per save; an
indexed migration can optimize it later without deleting existing records.

The lookup and insert run in a single read/write transaction. Concurrent saves of
the same tab, including bulk folder capture, therefore cannot both insert it.

Run `npm run test:storage` from `extension/` for regression coverage.
