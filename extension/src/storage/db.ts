import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Post, Folder } from '../../../shared';

interface PinnedTabRow {
    post_id: string;
    order: number;
}

export class RecallyDB extends Dexie {
    posts!: Table<Post>;
    folders!: Table<Folder>;
    pinned_tabs!: Table<PinnedTabRow>;

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

        // Version 3: Folders store full Post objects (deprecated approach)
        this.version(3).stores({
            posts: 'id, url, canonical_url, title, created_at, *tags',
            folders: 'id, name, created_at, order',
        });

        // Version 4: Fix data consistency - folders now store post IDs, not full objects
        this.version(4)
            .stores({
                posts: 'id, url, canonical_url, title, created_at, *tags',
                folders: 'id, name, created_at, order, *post_ids',
            })
            .upgrade(async (tx) => {
                try {
                    const folders = await tx.table('folders').toArray();

                    for (const folder of folders) {
                        let postIds: string[] = [];

                        if ('posts' in folder && Array.isArray(folder.posts)) {
                            postIds = folder.posts
                                .map((p: { id?: string }) => p.id)
                                .filter((id): id is string => Boolean(id));
                        } else if ('post_ids' in folder && Array.isArray(folder.post_ids)) {
                            postIds = folder.post_ids;
                        }

                        await tx.table('folders').update(folder.id, {
                            post_ids: postIds,
                        });
                    }
                } catch (error) {
                    console.error('Migration error (v3->v4):', error);
                }
            });

        // Version 5: Add pinned tabs table, migrate from chrome.storage.local
        this.version(5)
            .stores({
                posts: 'id, url, canonical_url, title, created_at, *tags',
                folders: 'id, name, created_at, order, *post_ids',
                pinned_tabs: 'post_id, order',
            })
            .upgrade(async (tx) => {
                try {
                    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
                        return;
                    }

                    const pinnedIds = await new Promise<string[]>((resolve) => {
                        chrome.storage.local.get(['pinnedTabs'], (result) => {
                            const pinnedData = result.pinnedTabs || [];
                            let ids: string[] = [];

                            if (Array.isArray(pinnedData) && pinnedData.length > 0) {
                                if (typeof pinnedData[0] === 'string') {
                                    ids = pinnedData as string[];
                                } else if (typeof pinnedData[0] === 'object') {
                                    ids = (pinnedData as Post[])
                                        .map((post) => post.id)
                                        .filter((id): id is string => Boolean(id));
                                }
                            }

                            resolve(ids);
                        });
                    });

                    if (pinnedIds.length === 0) {
                        return;
                    }

                    const posts = await tx.table('posts').toArray();
                    const validPostIds = new Set(posts.map((post) => post.id));
                    const uniqueIds = Array.from(new Set(pinnedIds)).filter((id) =>
                        validPostIds.has(id)
                    );

                    if (uniqueIds.length === 0) {
                        return;
                    }

                    await tx.table('pinned_tabs').bulkPut(
                        uniqueIds.map((id, index) => ({
                            post_id: id,
                            order: index,
                        }))
                    );

                    chrome.storage.local.set({ pinnedTabs: [] });
                } catch (error) {
                    console.error('Migration error (v4->v5):', error);
                }
            });
    }
}

export const db = new RecallyDB();
