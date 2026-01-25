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
    }
}

export const db = new RecallyDB();
