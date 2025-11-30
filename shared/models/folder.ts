import type { Post } from './post';

export interface Folder {
    id: string;
    name: string;
    color: string;  // Hex color code (e.g., '#3B82F6')
    posts: Post[];  // Array of full Post objects contained in this folder
    created_at: string;
    updated_at: string;
    order?: number;  // For custom ordering (lower number = higher priority)
}

