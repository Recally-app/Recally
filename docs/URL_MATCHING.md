# Saved URL matching

Duplicate detection preserves parameters that can change page content, including
`page`, `sort`, `filter`, `ref`, and `id`. Path case, HTTP versus HTTPS, and hash
routes also remain distinct. Only UTM parameters and explicit advertising/campaign
click IDs are removed when tracking-parameter removal is enabled. This includes
`mc_cid`, `mc_eid`, `hsCtaTracking`, and `igshid` (case-insensitive).

Ambiguous names such as `ref`, `source`, `content`, `from`, `cid`, `pid`, `aid`,
`si`, `ncid`, and `cmpid` remain intact: they can identify content rather than
attribution. Generic `time`, `timestamp`, and `t` parameters remain intact on
unrecognized sites.

YouTube video links ignore `t`, `start`, `time_continue`, and timestamp-only
`#t=` fragments for matching, regardless of the tracking-removal preference.
This applies to watch, embed, shorts, and live video routes on youtube.com,
www.youtube.com, m.youtube.com, and music.youtube.com, short links on youtu.be,
and embeds on youtube-nocookie.com (including www). Other parameters, video IDs,
playlist context, and non-timestamp fragments remain distinct. Equivalent links
using different hosts or URL formats are not merged by this rule.
See [YouTube player parameters](https://developers.google.com/youtube/player_parameters)
for the `start` parameter.

This changes duplicate matching only: a saved video retains its original URL,
including any timestamp. It does not force playback to start at the beginning.

Original saved URLs are never rewritten. Existing rows are compared using their
original URL and the current preference, so old cached canonical URLs cannot
silently prevent saving another page. This performs a local scan per save; an
indexed migration can optimize it later without deleting existing records.

The lookup and insert run in a single read/write transaction. Concurrent saves of
the same tab, including bulk folder capture, therefore cannot both insert it.

Run `npm run test:storage` from `extension/` for regression coverage.
