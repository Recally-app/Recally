export interface Post {
    id: string;
    url: string; // Original URL
    canonical_url: string; // Canonicalized URL for duplicate detection
    title: string;
    tags: string[];
    created_at: string;
    updated_at: string;
    notes?: string;
    favicon_url?: string; // Favicon URL from the tab
}
