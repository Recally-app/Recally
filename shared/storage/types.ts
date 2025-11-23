import type { Post } from '../models/post';

export interface SavePostResult {
    post: Post;
    wasDuplicate: boolean;
}

export interface StorageProvider {
    savePost(
        url: string,
        title: string,
        tags?: string[],
        faviconUrl?: string
    ): Promise<SavePostResult>;
    updatePostTags(id: string, tags: string[]): Promise<Post>;
    getAllPosts(): Promise<Post[]>;
    deletePost(id: string): Promise<void>;
    deleteAllPosts(): Promise<void>;
    searchPosts(query: string): Promise<Post[]>;
}
