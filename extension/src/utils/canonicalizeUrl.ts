// Only parameters whose purpose is attribution are removed. Parameters such as
// page, sort, filter, ref, and id can change the resource and must be preserved.
const TRACKING_PARAMS = new Set([
    'fbclid',
    'gclid',
    'dclid',
    'msclkid',
    'twclid',
    'li_fat_id',
    'mc_cid',
    'mc_eid',
    'hsctatracking',
    'igshid',
    'srsltid',
]);

// Timestamp matching is scoped to known YouTube video routes. Generic time
// parameters elsewhere may identify a report, historical view, or other resource.
function removeVideoTimestamp(parsed: URL): void {
    const youtubeHosts = ['youtube.com', 'm.youtube.com', 'music.youtube.com'];
    const isYoutubeVideo =
        youtubeHosts.includes(parsed.hostname) &&
        ((parsed.pathname === '/watch' && Boolean(parsed.searchParams.get('v'))) ||
            /^\/(embed|shorts|live)\/[^/]+\/?$/.test(parsed.pathname));
    const isShortLink = parsed.hostname === 'youtu.be' && /^\/[^/]+\/?$/.test(parsed.pathname);
    const isPrivateEmbed =
        parsed.hostname === 'youtube-nocookie.com' && /^\/embed\/[^/]+\/?$/.test(parsed.pathname);
    if (!isYoutubeVideo && !isShortLink && !isPrivateEmbed) return;

    for (const key of ['t', 'start', 'time_continue']) parsed.searchParams.delete(key);
    if (/^#t=(?:\d+(?:h|m|s)?)+$/.test(parsed.hash)) parsed.hash = '';
}

export function canonicalizeUrl(url: string, removeTrackingParams = true): string {
    try {
        const parsed = new URL(url);
        if (parsed.hostname.startsWith('www.')) parsed.hostname = parsed.hostname.slice(4);
        removeVideoTimestamp(parsed);
        if (removeTrackingParams) {
            const keys: string[] = [];
            parsed.searchParams.forEach((_value, key) => keys.push(key));
            for (const key of keys) {
                if (/^utm_/i.test(key) || TRACKING_PARAMS.has(key.toLowerCase())) {
                    parsed.searchParams.delete(key);
                }
            }
        }
        if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
            parsed.pathname = parsed.pathname.slice(0, -1);
        }
        if (parsed.hash === '#') parsed.hash = '';
        return parsed.toString();
    } catch {
        return url.trim();
    }
}
