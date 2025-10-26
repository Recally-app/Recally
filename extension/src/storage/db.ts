import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Post } from '../../../shared';

export class RecallyDB extends Dexie {
    posts!: Table<Post>;

    constructor() {
        super('recally_db');
        this.version(1).stores({
            // id is primary key
            // canonical_url is unique to prevent duplicates
            // *tags creates a multi-entry index on tags[]
            posts: 'id, url, canonical_url, title, created_at, *tags',
        });
    }
}

export const db = new RecallyDB();
