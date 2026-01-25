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
    async removeFolderFromPost(postId: string) {
        return activeProvider.removeFolderFromPost(postId);
    },

    // ==================== Pinned Tabs Operations ====================
    async getPinnedTabs(): Promise<Post[]> {
        return new Promise((resolve) => {
            chrome.storage.local.get(['pinnedTabs'], async (result) => {
                try {
                    const pinnedData = result.pinnedTabs || [];

                    // Handle old format (array of IDs) - migrate to new format
                    if (
                        Array.isArray(pinnedData) &&
                        pinnedData.length > 0 &&
                        typeof pinnedData[0] === 'string'
                    ) {
                        console.log(
                            'Migrating pinned tabs from old format (IDs) to new format (Posts)'
                        );
                        const allPosts = await activeProvider.getAllPosts();
                        const migratedPosts = allPosts.filter((p) =>
                            (pinnedData as string[]).includes(p.id)
                        );

                        // Save in new format
                        chrome.storage.local.set({ pinnedTabs: migratedPosts }, () => {
                            resolve(migratedPosts);
                        });
                    } else {
                        // Already in new format or empty
                        resolve(pinnedData as Post[]);
                    }
                } catch (error) {
                    console.error('Error in getPinnedTabs:', error);
                    resolve([]);
                }
            });
        });
    },

    async pinTab(postId: string): Promise<boolean> {
        const pinnedTabs = await this.getPinnedTabs();

        // Check if already pinned
        if (pinnedTabs.some((p) => p.id === postId)) {
            return true;
        }

        // Check limit
        if (pinnedTabs.length >= 5) {
            return false;
        }

        // Get the full Post object
        const post = await activeProvider
            .getAllPosts()
            .then((posts) => posts.find((p) => p.id === postId));

        if (!post) {
            return false;
        }

        // Add to pinned tabs
        const updatedPinnedTabs = [...pinnedTabs, post];
        return new Promise((resolve) => {
            chrome.storage.local.set({ pinnedTabs: updatedPinnedTabs }, () => {
                resolve(true);
            });
        });
    },

    async unpinTab(postId: string): Promise<void> {
        const pinnedTabs = await this.getPinnedTabs();
        const updatedPinnedTabs = pinnedTabs.filter((post) => post.id !== postId);
        return new Promise((resolve) => {
            chrome.storage.local.set({ pinnedTabs: updatedPinnedTabs }, () => {
                resolve();
            });
        });
    },

    async reorderPinnedTabs(newOrder: Post[]): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.local.set({ pinnedTabs: newOrder }, () => {
                resolve();
            });
        });
    },

    async isPinned(postId: string): Promise<boolean> {
        const pinnedTabs = await this.getPinnedTabs();
        return pinnedTabs.some((post) => post.id === postId);
    },

    // ==================== Import/Export Operations ====================
    async exportData(): Promise<string> {
        const posts = await this.getAllPosts();
        const folders = await this.getAllFolders();
        const pinnedTabs = await this.getPinnedTabs();

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
        try {
            const importData = JSON.parse(jsonString);

            // Validate the import data structure
            if (!importData.data || !importData.data.posts || !importData.data.folders) {
                throw new Error('Invalid import file format');
            }

            const { posts, folders, pinnedTabs = [] } = importData.data;

            if (mode === 'replace') {
                // Replace: Clear all existing data first
                await this.deleteAllPosts();

                // Clear all folders
                const existingFolders = await this.getAllFolders();
                for (const folder of existingFolders) {
                    await this.deleteFolder(folder.id, false);
                }

                // Clear pinned tabs
                await this.reorderPinnedTabs([]);
            }

            // Import posts first
            for (const post of posts) {
                await activeProvider.importPost(post);
            }

            // Import folders and validate post_ids reference existing posts
            const allPostIds = new Set((await this.getAllPosts()).map((p) => p.id));
            for (const folder of folders) {
                // Handle backward compatibility: convert old 'posts' array to 'post_ids'
                let postIds: string[] = [];
                if ('post_ids' in folder && Array.isArray(folder.post_ids)) {
                    postIds = folder.post_ids;
                } else if ('posts' in folder && Array.isArray(folder.posts)) {
                    // Old format: extract IDs from post objects
                    postIds = (folder as { posts: { id?: string }[] }).posts
                        .map((p) => p.id)
                        .filter((id): id is string => Boolean(id));
                }

                // Filter out invalid post_ids that don't exist in posts table
                const validPostIds = postIds.filter((id) => allPostIds.has(id));
                await activeProvider.importFolder({
                    ...folder,
                    post_ids: validPostIds,
                });
            }

            // Import pinned tabs (only valid post IDs)
            if (mode === 'merge') {
                // In merge mode, combine with existing pinned tabs
                const existingPinnedTabs = await this.getPinnedTabs();
                const allPosts = await this.getAllPosts();
                const validPostIds = new Set(allPosts.map((p) => p.id));

                // Convert old format (IDs) to new format (Posts) if needed
                const existingPosts = existingPinnedTabs;
                const importedPosts =
                    Array.isArray(pinnedTabs) && typeof pinnedTabs[0] === 'string'
                        ? allPosts.filter((p) => (pinnedTabs as string[]).includes(p.id))
                        : (pinnedTabs as Post[]);

                // Filter, deduplicate, and limit
                const seenIds = new Set<string>();
                const combinedPinned = [...existingPosts, ...importedPosts]
                    .filter((post) => {
                        if (!validPostIds.has(post.id) || seenIds.has(post.id)) {
                            return false;
                        }
                        seenIds.add(post.id);
                        return true;
                    })
                    .slice(0, 5); // Limit to 5

                await this.reorderPinnedTabs(combinedPinned);
            } else {
                // In replace mode, use imported pinned tabs
                const allPosts = await this.getAllPosts();
                const validPostIds = new Set(allPosts.map((p) => p.id));

                // Convert old format (IDs) to new format (Posts) if needed
                const importedPosts =
                    Array.isArray(pinnedTabs) && typeof pinnedTabs[0] === 'string'
                        ? allPosts.filter((p) => (pinnedTabs as string[]).includes(p.id))
                        : (pinnedTabs as Post[]).filter((post) => validPostIds.has(post.id));

                const validPinned = importedPosts.slice(0, 5);

                await this.reorderPinnedTabs(validPinned);
            }
        } catch (error) {
            console.error('Import failed:', error);
            throw error;
        }
    },
};
