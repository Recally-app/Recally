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
    migrations!: Table<{ id: string }>;

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
                                .filter((id: string | undefined): id is string => Boolean(id));
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

        // Version 5 adds the table. Chrome storage reads must happen after the
        // upgrade commits so IndexedDB cannot auto-commit while we await Chrome.
        this.version(5).stores({
            posts: 'id, url, canonical_url, title, created_at, *tags',
            folders: 'id, name, created_at, order, *post_ids',
            pinned_tabs: 'post_id, order',
        });

        // A durable marker prevents a cleanup retry (or another popup) from
        // replaying recovered pins after the user has subsequently changed them.
        this.version(6).stores({ migrations: 'id' });

        // Run on every open, including profiles whose old v5 upgrade swallowed
        // a migration failure. A pending legacy value triggers recovery or cleanup.
        this.on(
            'ready',
            async (readyDb) => {
                const migrationDb = readyDb as RecallyDB;
                if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
                try {
                    const { pinnedTabs } = await chrome.storage.local.get(['pinnedTabs']);
                    if (!Array.isArray(pinnedTabs) || pinnedTabs.length === 0) return;
                    const legacyIds = pinnedTabs
                        .map((value: unknown) =>
                            typeof value === 'string'
                                ? value
                                : value && typeof value === 'object' && 'id' in value
                                  ? value.id
                                  : undefined
                        )
                        .filter((id): id is string => typeof id === 'string' && id.length > 0);

                    await migrationDb.transaction(
                        'rw',
                        migrationDb.posts,
                        migrationDb.pinned_tabs,
                        migrationDb.migrations,
                        async () => {
                            if (await migrationDb.migrations.get('legacy-pins')) return;
                            const posts = await migrationDb.posts.toArray();
                            const validIds = new Set(posts.map((post) => post.id));
                            const existing = await migrationDb.pinned_tabs
                                .orderBy('order')
                                .toArray();
                            const ids = [
                                ...new Set([...existing.map((row) => row.post_id), ...legacyIds]),
                            ]
                                .filter((id) => validIds.has(id))
                                .slice(0, 5);
                            await migrationDb.pinned_tabs.clear();
                            await migrationDb.pinned_tabs.bulkPut(
                                ids.map((post_id, order) => ({ post_id, order }))
                            );
                            await migrationDb.migrations.put({ id: 'legacy-pins' });
                        }
                    );
                    // Clear only after the transaction commits. Retrying after a storage
                    // failure retries cleanup only once the completion marker exists.
                    await chrome.storage.local.set({ pinnedTabs: [] });
                } catch (error) {
                    // Pins can retry on the next open; a recovery failure must
                    // not make unrelated posts and folders inaccessible.
                    console.warn('Legacy pin recovery will retry on next open:', error);
                }
            },
            true
        );
    }
}

export const db = new RecallyDB();
