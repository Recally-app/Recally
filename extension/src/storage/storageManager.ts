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
    async getPinnedTabIds(): Promise<string[]> {
        return new Promise((resolve) => {
            chrome.storage.local.get(['pinnedTabs'], (result) => {
                try {
                    const pinnedData = result.pinnedTabs || [];
                    let pinnedIds: string[] = [];

                    if (Array.isArray(pinnedData) && pinnedData.length > 0) {
                        if (typeof pinnedData[0] === 'string') {
                            pinnedIds = pinnedData as string[];
                        } else if (typeof pinnedData[0] === 'object') {
                            pinnedIds = (pinnedData as Post[])
                                .map((post) => post.id)
                                .filter((id): id is string => Boolean(id));
                        }
                    }

                    // Normalize storage to IDs if needed
                    if (!Array.isArray(pinnedData) || typeof pinnedData[0] !== 'string') {
                        chrome.storage.local.set({ pinnedTabs: pinnedIds }, () => {
                            resolve(pinnedIds);
                        });
                    } else {
                        resolve(pinnedIds);
                    }
                } catch (error) {
                    console.error('Error in getPinnedTabIds:', error);
                    resolve([]);
                }
            });
        });
    },

    async setPinnedTabIds(ids: string[]): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.local.set({ pinnedTabs: ids }, () => {
                resolve();
            });
        });
    },

    async getPinnedTabs(): Promise<Post[]> {
        try {
            const pinnedIds = await this.getPinnedTabIds();
            if (pinnedIds.length === 0) {
                return [];
            }

            const allPosts = await activeProvider.getAllPosts();
            const postsById = new Map(allPosts.map((post) => [post.id, post]));
            const orderedPosts = pinnedIds
                .map((id) => postsById.get(id))
                .filter((post): post is Post => Boolean(post));

            if (orderedPosts.length !== pinnedIds.length) {
                await this.setPinnedTabIds(orderedPosts.map((post) => post.id));
            }

            return orderedPosts;
        } catch (error) {
            console.error('Error in getPinnedTabs:', error);
            return [];
        }
    },

    async pinTab(postId: string): Promise<boolean> {
        const pinnedIds = await this.getPinnedTabIds();

        // Check if already pinned
        if (pinnedIds.includes(postId)) {
            return true;
        }

        // Check limit
        if (pinnedIds.length >= 5) {
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
        const updatedPinnedIds = [...pinnedIds, post.id];
        await this.setPinnedTabIds(updatedPinnedIds);
        return true;
    },

    async unpinTab(postId: string): Promise<void> {
        const pinnedIds = await this.getPinnedTabIds();
        const updatedPinnedIds = pinnedIds.filter((id) => id !== postId);
        await this.setPinnedTabIds(updatedPinnedIds);
    },

    async reorderPinnedTabs(newOrder: Post[]): Promise<void> {
        const orderedIds = newOrder.map((post) => post.id);
        await this.setPinnedTabIds(orderedIds);
    },

    async isPinned(postId: string): Promise<boolean> {
        const pinnedIds = await this.getPinnedTabIds();
        return pinnedIds.includes(postId);
    },

    // ==================== Import/Export Operations ====================
    async exportData(): Promise<string> {
        const posts = await this.getAllPosts();
        const folders = await this.getAllFolders();
        const pinnedTabs = await this.getPinnedTabIds();

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
            const allPosts = await this.getAllPosts();
            const validPostIds = new Set(allPosts.map((p) => p.id));

            const normalizePinnedIds = (): string[] => {
                if (!Array.isArray(pinnedTabs) || pinnedTabs.length === 0) {
                    return [];
                }

                if (typeof pinnedTabs[0] === 'string') {
                    return pinnedTabs as string[];
                }

                if (typeof pinnedTabs[0] === 'object') {
                    return (pinnedTabs as Post[])
                        .map((post) => post.id)
                        .filter((id): id is string => Boolean(id));
                }

                return [];
            };

            const importedIds = normalizePinnedIds();

            if (mode === 'merge') {
                const existingPinnedIds = await this.getPinnedTabIds();
                const seenIds = new Set<string>();
                const combinedIds = [...existingPinnedIds, ...importedIds]
                    .filter((id) => {
                        if (!validPostIds.has(id) || seenIds.has(id)) {
                            return false;
                        }
                        seenIds.add(id);
                        return true;
                    })
                    .slice(0, 5);

                await this.setPinnedTabIds(combinedIds);
            } else {
                const validPinnedIds = importedIds
                    .filter((id) => validPostIds.has(id))
                    .slice(0, 5);

                await this.setPinnedTabIds(validPinnedIds);
            }
        } catch (error) {
            console.error('Import failed:', error);
            throw error;
        }
    },
};
