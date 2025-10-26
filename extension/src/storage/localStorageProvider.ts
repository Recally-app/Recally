import { db } from './db';
import type { Post } from '../../../shared';
import type { StorageProvider } from '../../../shared/';
import { v4 as uuidv4 } from 'uuid';

/**
 * LocalStorageProvider
 * Stores all posts in the local Dexie database (IndexedDB).
 * Implements the shared StorageProvider interface.
 */
export const LocalStorageProvider: StorageProvider = {
    async savePost(url: string, title: string, tags: string[] = []): Promise<Post> {
        const now = new Date().toISOString();

        const post: Post = {
            id: uuidv4(),
            url,
            title,
            tags,
            created_at: now,
            updated_at: now,
        };

        await db.posts.put(post);
        return post;
    },

    async getAllPosts(): Promise<Post[]> {
        return db.posts.orderBy('created_at').reverse().toArray();
    },

    async deletePost(id: string): Promise<void> {
        await db.posts.delete(id);
    },

    async searchPosts(query: string): Promise<Post[]> {
        const q = query.toLowerCase();
        const all = await db.posts.toArray();
        return all.filter(
            (p) =>
                p.title.toLowerCase().includes(q) ||
                p.url.toLowerCase().includes(q) ||
                (p.tags && p.tags.some((tag) => tag.toLowerCase().includes(q)))
        );
    },
};
