import { LocalStorageProvider } from './localStorageProvider';
import type { StorageProvider } from '../../../shared/';

/**
 * For MVP, StorageManager delegates everything
 * to the LocalStorageProvider (Dexie-based).
 */
const activeProvider: StorageProvider = LocalStorageProvider;

export const StorageManager = {
    async savePost(url: string, title: string, tags: string[] = [], faviconUrl?: string) {
        return activeProvider.savePost(url, title, tags, faviconUrl);
    },
    async updatePostTags(id: string, tags: string[]) {
        return activeProvider.updatePostTags(id, tags);
    },
    async getAllPosts() {
        return activeProvider.getAllPosts();
    },
    async deletePost(id: string) {
        return activeProvider.deletePost(id);
    },
    async deleteAllPosts() {
        return activeProvider.deleteAllPosts();
    },
    async searchPosts(query: string) {
        return activeProvider.searchPosts(query);
    },
};
