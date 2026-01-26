export function parseUrl(url: string): URL | null {
    try {
        return new URL(url);
    } catch {
        return null;
    }
}

export function getHostname(url: string): string {
    const parsed = parseUrl(url);
    if (!parsed) {
        return '';
    }

    return parsed.hostname.replace(/^www\./, '');
}

export function isSupportedUrl(url: string): boolean {
    const parsed = parseUrl(url);
    if (!parsed) {
        return false;
    }

    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
}
