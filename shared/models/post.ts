export interface Post {
    id: string;
    url: string;
    title: string;
    tags: string[];
    created_at: string;
    updated_at: string;
    notes?: string;
}
