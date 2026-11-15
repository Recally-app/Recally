import type { Post } from './post';
import type { Folder } from './folder';

export interface BackupData {
    posts: Post[];
    folders: Folder[];
    pinnedTabs: string[];
}
