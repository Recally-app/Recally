import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Post, Folder } from '../../../shared';

export class RecallyDB extends Dexie {
    posts!: Table<Post>;
    folders!: Table<Folder>;

    constructor() {
        super('recally_db');
        
        // Version 1: Initial schema
        this.version(1).stores({
            // id is primary key
            // canonical_url is unique to prevent duplicates
            // *tags creates a multi-entry index on tags[]
            posts: 'id, url, canonical_url, title, created_at, *tags',
        });

        // Version 2: Add folders table
        this.version(2).stores({
            posts: 'id, url, canonical_url, title, created_at, *tags',
            folders: 'id, name, created_at, order',
        });

        // Version 3: Folders now store full Post objects instead of IDs
        // No schema change needed as Dexie stores objects as JSON
        // But we increment version for migration purposes
        this.version(3).stores({
            posts: 'id, url, canonical_url, title, created_at, *tags',
            folders: 'id, name, created_at, order',
        }).upgrade(async (tx) => {
            // Migration: Convert post_ids to posts array
            // This will run once for existing users
            try {
                const folders = await tx.table('folders').toArray();
                const posts = await tx.table('posts').toArray();
                
                for (const folder of folders) {
                    // Initialize with empty posts array if neither field exists
                    if (!('posts' in folder) && !('post_ids' in folder)) {
                        await tx.table('folders').update(folder.id, {
                            posts: [],
                        });
                    }
                    // If folder has post_ids (old structure), convert to posts
                    else if ('post_ids' in folder && Array.isArray(folder.post_ids)) {
                        const postIds = folder.post_ids as string[];
                        const folderPosts = posts.filter(p => postIds.includes(p.id));
                        
                        // Create a clean folder object without post_ids
                        const { post_ids, ...folderWithoutPostIds } = folder as any;
                        
                        // Update folder with new structure
                        await tx.table('folders').update(folder.id, {
                            ...folderWithoutPostIds,
                            posts: folderPosts,
                        });
                    }
                    // If folder already has posts array, leave it
                    else if ('posts' in folder && Array.isArray(folder.posts)) {
                        // Already in new format, do nothing
                    }
                }
            } catch (error) {
                console.error('Migration error:', error);
                // Don't throw - allow the app to continue even if migration fails
            }
        });
    }
}

export const db = new RecallyDB();
