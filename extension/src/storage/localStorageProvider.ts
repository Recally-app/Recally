import { db } from './db';
import type { Post, Folder } from '../../../shared';
import type { StorageProvider, SavePostResult, SaveFolderResult } from '../../../shared/';
import { v4 as uuidv4 } from 'uuid';
import { getUserPreferences } from './userPreferences';

/**
 * Canonicalizes a URL for duplicate detection by:
 * - Converting to lowercase
 * - Optionally removing tracking parameters (based on user preference)
 * - Keeping original protocol
 * - Removing trailing slashes
 * - Removing www subdomain
 */
async function canonicalizeUrl(url: string): Promise<string> {
    try {
        const urlObj = new URL(url);
        const preferences = await getUserPreferences();

        // Convert to lowercase
        urlObj.hostname = urlObj.hostname.toLowerCase();

        // Remove www subdomain
        if (urlObj.hostname.startsWith('www.')) {
            urlObj.hostname = urlObj.hostname.substring(4);
        }

        // Keep original protocol (don't force HTTPS)

        // Remove tracking parameters only if user preference is enabled
        if (preferences.removeTrackingParams) {
            const trackingParams = [
                'utm_source',
                'utm_medium',
                'utm_campaign',
                'utm_term',
                'utm_content',
                'fbclid',
                'gclid',
                'msclkid',
                'twclid',
                'li_fat_id',
                'ref',
                'source',
                'campaign',
                'medium',
                'content',
                'affiliate_id',
                'affiliate',
                'partner',
                'promo',
                'mc_cid',
                'mc_eid', // Mailchimp
                'hsCtaTracking', // HubSpot
                'igshid', // Instagram
                'si', // Snapchat
                'ncid', // Netflix
                'cmpid', // Various platforms
                'cid',
                'pid',
                'aid', // Generic affiliate IDs
                'click_id',
                'clickid',
                'click',
                'session_id',
                'sessionid',
                'sid',
                'timestamp',
                'time',
                't',
                'from',
                'via',
                'share',
                'position',
                'rank',
                'page',
                'sort',
                'order',
                'filter',
                'debug',
                'test',
                'preview',
            ];

            trackingParams.forEach((param) => {
                urlObj.searchParams.delete(param);
            });

            // If all search params were removed and there were search params originally,
            // ensure the URL still has a valid structure
            if (urlObj.search === '?' && urlObj.searchParams.size === 0) {
                urlObj.search = '';
            }
        }

        // Remove trailing slash from pathname (except for root)
        if (urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
            urlObj.pathname = urlObj.pathname.slice(0, -1);
        }

        // Remove empty hash
        if (urlObj.hash === '#') {
            urlObj.hash = '';
        }

        return urlObj.toString();
    } catch (error) {
        // If URL parsing fails, return normalized version of original
        console.warn('Failed to parse URL for canonicalization:', url, error);
        return url.toLowerCase().trim();
    }
}

async function normalizePinnedOrder(): Promise<void> {
    const rows = await db.pinned_tabs.orderBy('order').toArray();
    await db.pinned_tabs.bulkPut(
        rows.map((row, index) => ({
            ...row,
            order: index,
        }))
    );
}

/**
 * LocalStorageProvider
 * Stores all posts in the local Dexie database (IndexedDB).
 * Implements the shared StorageProvider interface.
 */
export const LocalStorageProvider: StorageProvider = {
    async savePost(
        url: string,
        title: string,
        tags: string[] = [],
        faviconUrl?: string
    ): Promise<SavePostResult> {
        const canonicalUrl = await canonicalizeUrl(url);
        const now = new Date().toISOString();

        const existingPost = await db.posts.where('canonical_url').equals(canonicalUrl).first();

        if (existingPost) {
            // Don't update existing post, just return it
            // This allows the UI to show feedback and scroll to the existing post
            return {
                post: existingPost,
                wasDuplicate: true,
            };
        } else {
            // Create new post
            const post: Post = {
                id: uuidv4(),
                url, // Store original URL
                canonical_url: canonicalUrl, // Store canonicalized URL for duplicate detection
                title,
                tags,
                created_at: now,
                updated_at: now,
                ...(faviconUrl && { favicon_url: faviconUrl }), // Store favicon URL from tab if available
            };

            await db.posts.put(post);
            return {
                post,
                wasDuplicate: false,
            };
        }
    },

    async updatePostTags(id: string, tags: string[]): Promise<Post> {
        const post = await db.posts.get(id);
        if (!post) {
            throw new Error(`Post with id ${id} not found`);
        }

        const updatedPost: Post = {
            ...post,
            tags,
            updated_at: new Date().toISOString(),
        };

        await db.posts.put(updatedPost);
        return updatedPost;
    },

    async updatePostNotes(id: string, notes: string): Promise<Post> {
        const post = await db.posts.get(id);
        if (!post) {
            throw new Error(`Post with id ${id} not found`);
        }

        const updatedPost: Post = {
            ...post,
            notes,
            updated_at: new Date().toISOString(),
        };

        await db.posts.put(updatedPost);
        return updatedPost;
    },

    async getAllPosts(): Promise<Post[]> {
        return db.posts.orderBy('created_at').reverse().toArray();
    },

    async deletePost(id: string): Promise<void> {
        await db.pinned_tabs.delete(id);
        await this.removePostFromAllFolders(id);
        await db.posts.delete(id);
    },

    async deleteAllPosts(): Promise<void> {
        await db.posts.clear();
        await db.pinned_tabs.clear();
        const folders = await db.folders.toArray();
        await Promise.all(
            folders.map((folder) => {
                if (folder.post_ids.length === 0) {
                    return Promise.resolve();
                }

                const updatedFolder: Folder = {
                    ...folder,
                    post_ids: [],
                    updated_at: new Date().toISOString(),
                };

                return db.folders.put(updatedFolder);
            })
        );
    },

    async searchPosts(query: string): Promise<Post[]> {
        const q = query.toLowerCase();
        const preferences = await getUserPreferences();
        const all = await db.posts.toArray();

        return all.filter((p) => {
            // Always search title and tags
            const titleMatch = p.title.toLowerCase().includes(q);

            // Use URL or canonical URL based on preference
            const urlToSearch = preferences.removeTrackingParams ? p.canonical_url : p.url;
            const urlMatch = urlToSearch.toLowerCase().includes(q);

            return titleMatch || urlMatch;
        });
    },

    // ==================== Folder Operations ====================

    async saveFolder(
        name: string,
        color: string,
        postIds: string[] = []
    ): Promise<SaveFolderResult> {
        const trimmedName = name.trim();

        if (!trimmedName) {
            throw new Error('Folder name cannot be empty');
        }

        const existingFolder = await db.folders.where('name').equalsIgnoreCase(trimmedName).first();

        if (existingFolder) {
            return {
                folder: existingFolder,
                wasDuplicate: true,
            };
        }

        const uniquePostIds = Array.from(new Set(postIds));
        const validPostIds = await Promise.all(
            uniquePostIds.map(async (postId) => {
                const post = await db.posts.get(postId);
                return post ? postId : null;
            })
        );

        const now = new Date().toISOString();
        const folder: Folder = {
            id: uuidv4(),
            name: trimmedName,
            color,
            post_ids: validPostIds.filter((id): id is string => id !== null),
            created_at: now,
            updated_at: now,
            order: Date.now(),
        };

        await db.folders.put(folder);
        return {
            folder,
            wasDuplicate: false,
        };
    },

    async updateFolder(
        id: string,
        updates: Partial<Omit<Folder, 'id' | 'created_at'>>
    ): Promise<Folder> {
        const folder = await db.folders.get(id);
        if (!folder) {
            throw new Error(`Folder with id ${id} not found`);
        }

        // If name is being updated, check for duplicates
        if (updates.name && updates.name.trim() !== folder.name) {
            const duplicate = await db.folders
                .where('name')
                .equalsIgnoreCase(updates.name.trim())
                .first();

            if (duplicate && duplicate.id !== id) {
                throw new Error('A folder with this name already exists');
            }
        }

        const updatedFolder: Folder = {
            ...folder,
            ...updates,
            name: updates.name?.trim() || folder.name,
            updated_at: new Date().toISOString(),
        };

        await db.folders.put(updatedFolder);
        return updatedFolder;
    },

    async deleteFolder(id: string, deleteContainedPosts: boolean = false): Promise<void> {
        const folder = await db.folders.get(id);
        if (!folder) {
            throw new Error(`Folder with id ${id} not found`);
        }

        if (deleteContainedPosts && folder.post_ids.length > 0) {
            const postIdSet = new Set(folder.post_ids);
            const allFolders = await db.folders.toArray();

            await Promise.all(
                allFolders.map((existingFolder) => {
                    if (!existingFolder.post_ids.some((postId) => postIdSet.has(postId))) {
                        return Promise.resolve();
                    }

                    const updatedFolder: Folder = {
                        ...existingFolder,
                        post_ids: existingFolder.post_ids.filter(
                            (postId) => !postIdSet.has(postId)
                        ),
                        updated_at: new Date().toISOString(),
                    };

                    return db.folders.put(updatedFolder);
                })
            );

            await Promise.all(folder.post_ids.map((postId) => db.posts.delete(postId)));
        }

        await db.folders.delete(id);
    },

    async getAllFolders(): Promise<Folder[]> {
        return db.folders.orderBy('order').toArray();
    },

    // ==================== Folder-Post Operations ====================

    async addPostToFolder(folderId: string, postId: string): Promise<Folder> {
        const folder = await db.folders.get(folderId);
        if (!folder) {
            throw new Error(`Folder with id ${folderId} not found`);
        }

        const post = await db.posts.get(postId);
        if (!post) {
            throw new Error(`Post with id ${postId} not found`);
        }

        if (folder.post_ids.includes(postId)) {
            return folder;
        }

        const updatedFolder: Folder = {
            ...folder,
            post_ids: [...folder.post_ids, postId],
            updated_at: new Date().toISOString(),
        };

        await db.folders.put(updatedFolder);
        return updatedFolder;
    },

    async removePostFromFolder(folderId: string, postId: string): Promise<Folder> {
        const folder = await db.folders.get(folderId);
        if (!folder) {
            throw new Error(`Folder with id ${folderId} not found`);
        }

        const updatedFolder: Folder = {
            ...folder,
            post_ids: folder.post_ids.filter((id) => id !== postId),
            updated_at: new Date().toISOString(),
        };

        await db.folders.put(updatedFolder);
        return updatedFolder;
    },

    async getPostsByFolderId(folderId: string): Promise<Post[]> {
        const folder = await db.folders.get(folderId);
        if (!folder) {
            throw new Error(`Folder with id ${folderId} not found`);
        }

        const posts = await Promise.all(folder.post_ids.map((postId) => db.posts.get(postId)));

        return posts.filter((post): post is Post => post !== undefined);
    },

    async removePostFromAllFolders(postId: string): Promise<void> {
        const allFolders = await db.folders.toArray();
        const foldersWithPost = allFolders.filter((folder) => folder.post_ids.includes(postId));

        await Promise.all(
            foldersWithPost.map((folder) => this.removePostFromFolder(folder.id, postId))
        );
    },

    // ==================== Pinned Tabs Operations ====================

    async getPinnedTabs(): Promise<Post[]> {
        const rows = await db.pinned_tabs.orderBy('order').toArray();
        if (rows.length === 0) {
            return [];
        }

        const ids = rows.map((row) => row.post_id);
        const posts = await db.posts.bulkGet(ids);
        const missingIds: string[] = [];
        const orderedPosts: Post[] = [];

        posts.forEach((post, index) => {
            if (post) {
                orderedPosts.push(post);
            } else {
                missingIds.push(ids[index]);
            }
        });

        if (missingIds.length > 0) {
            await db.pinned_tabs.bulkDelete(missingIds);
            await normalizePinnedOrder();
        }

        return orderedPosts;
    },

    async pinTab(postId: string): Promise<boolean> {
        const existing = await db.pinned_tabs.get(postId);
        if (existing) {
            return true;
        }

        const post = await db.posts.get(postId);
        if (!post) {
            return false;
        }

        const count = await db.pinned_tabs.count();
        if (count >= 5) {
            return false;
        }

        const last = await db.pinned_tabs.orderBy('order').last();
        const nextOrder = last ? last.order + 1 : 0;

        await db.pinned_tabs.put({ post_id: postId, order: nextOrder });
        return true;
    },

    async unpinTab(postId: string): Promise<void> {
        await db.pinned_tabs.delete(postId);
        await normalizePinnedOrder();
    },

    async reorderPinnedTabs(newOrder: Post[]): Promise<void> {
        const orderedIds = newOrder.map((post) => post.id);
        const existing = await db.pinned_tabs.toArray();
        const existingIds = existing.map((row) => row.post_id);
        const idsToDelete = existingIds.filter((id) => !orderedIds.includes(id));

        if (idsToDelete.length > 0) {
            await db.pinned_tabs.bulkDelete(idsToDelete);
        }

        await db.pinned_tabs.bulkPut(
            orderedIds.map((id, index) => ({
                post_id: id,
                order: index,
            }))
        );
    },

    async isPinned(postId: string): Promise<boolean> {
        const existing = await db.pinned_tabs.get(postId);
        return Boolean(existing);
    },

    // ==================== Import Operations ====================

    async importPost(post: Post): Promise<void> {
        // Import post as-is, preserving IDs and timestamps
        await db.posts.put(post);
    },

    async importFolder(folder: Folder): Promise<void> {
        // Import folder as-is, preserving IDs and timestamps
        await db.folders.put(folder);
    },
};
