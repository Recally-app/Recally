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
    'igshid',
    'srsltid',
]);

export function canonicalizeUrl(url: string, removeTrackingParams = true): string {
    try {
        const parsed = new URL(url);
        if (parsed.hostname.startsWith('www.')) parsed.hostname = parsed.hostname.slice(4);
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
