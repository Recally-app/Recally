import localSiteIcon from '../assets/icon/recally_icon.svg';
import { parseUrl } from './urlUtils';

export function getFaviconUrl(url: string, storedFaviconUrl?: string): string {
    if (storedFaviconUrl) return storedFaviconUrl;

    const parsed = parseUrl(url);
    if (!parsed || !['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) {
        return localSiteIcon;
    }

    // Send only the hostname, never paths or queries, to the DuckDuckGo fallback.
    return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(parsed.hostname)}.ico`;
}
