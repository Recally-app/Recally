import type { Post } from '../models/post';

export interface SavePostResult {
    post: Post;
    wasDuplicate: boolean;
}

export interface StorageProvider {
    savePost(url: string, title: string, tags?: string[], faviconUrl?: string): Promise<SavePostResult>;
    getAllPosts(): Promise<Post[]>;
    deletePost(id: string): Promise<void>;
    searchPosts(query: string): Promise<Post[]>;
}
