export interface Post {
    id: string;
    url: string;
    title: string;
    tags: string[];
    created_at: Date;
    updated_at: Date;
    notes?: string;
}
