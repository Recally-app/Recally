import { parseBackup } from './backup';
import { LocalStorageProvider } from './localStorageProvider';
import type { StorageProvider } from '../../../shared/';
import type { Post } from '../../../shared/';

/**
 * For MVP, StorageManager delegates everything
 * to the LocalStorageProvider (Dexie-based).
 */
const activeProvider: StorageProvider = LocalStorageProvider;

export const StorageManager = {
    // ==================== Post Operations ====================
    async savePost(url: string, title: string, tags: string[] = [], faviconUrl?: string) {
        return activeProvider.savePost(url, title, tags, faviconUrl);
    },
    async updatePostTags(id: string, tags: string[]) {
        return activeProvider.updatePostTags(id, tags);
    },
    async updatePostNotes(id: string, notes: string) {
        return activeProvider.updatePostNotes(id, notes);
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

    // ==================== Folder Operations ====================
    async saveFolder(name: string, color: string, postIds?: string[]) {
        return activeProvider.saveFolder(name, color, postIds);
    },
    async updateFolder(id: string, updates: Parameters<StorageProvider['updateFolder']>[1]) {
        return activeProvider.updateFolder(id, updates);
    },
    async deleteFolder(id: string, deleteContainedPosts?: boolean) {
        return activeProvider.deleteFolder(id, deleteContainedPosts);
    },
    async getAllFolders() {
        return activeProvider.getAllFolders();
    },

    // ==================== Folder-Post Operations ====================
    async addPostToFolder(folderId: string, postId: string) {
        return activeProvider.addPostToFolder(folderId, postId);
    },
    async removePostFromFolder(folderId: string, postId: string) {
        return activeProvider.removePostFromFolder(folderId, postId);
    },
    async getPostsByFolderId(folderId: string) {
        return activeProvider.getPostsByFolderId(folderId);
    },
    async removePostFromAllFolders(postId: string) {
        return activeProvider.removePostFromAllFolders(postId);
    },

    // ==================== Pinned Tabs Operations ====================
    async getPinnedTabs(): Promise<Post[]> {
        return activeProvider.getPinnedTabs();
    },

    async pinTab(postId: string): Promise<boolean> {
        return activeProvider.pinTab(postId);
    },

    async unpinTab(postId: string): Promise<void> {
        return activeProvider.unpinTab(postId);
    },

    async reorderPinnedTabs(newOrder: Post[]): Promise<void> {
        return activeProvider.reorderPinnedTabs(newOrder);
    },

    async isPinned(postId: string): Promise<boolean> {
        return activeProvider.isPinned(postId);
    },

    // ==================== Import/Export Operations ====================
    async exportData(): Promise<string> {
        const posts = await this.getAllPosts();
        const folders = await this.getAllFolders();
        const pinnedTabs = (await this.getPinnedTabs()).map((post) => post.id);

        const exportData = {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            data: {
                posts,
                folders,
                pinnedTabs,
            },
        };

        return JSON.stringify(exportData, null, 2);
    },

    async importData(jsonString: string, mode: 'merge' | 'replace'): Promise<void> {
        if (mode !== 'merge' && mode !== 'replace') throw new Error('Invalid import mode');
        const data = parseBackup(jsonString);
        await activeProvider.importData(data, mode);
    },
};
