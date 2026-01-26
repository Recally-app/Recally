import type { Post } from '../models/post';
import type { Folder } from '../models/folder';

export interface SavePostResult {
    post: Post;
    wasDuplicate: boolean;
}

export interface SaveFolderResult {
    folder: Folder;
    wasDuplicate: boolean;
}

export interface StorageProvider {
    // Post operations
    savePost(
        url: string,
        title: string,
        tags?: string[],
        faviconUrl?: string
    ): Promise<SavePostResult>;
    updatePostTags(id: string, tags: string[]): Promise<Post>;
    updatePostNotes(id: string, notes: string): Promise<Post>;
    getAllPosts(): Promise<Post[]>;
    deletePost(id: string): Promise<void>;
    deleteAllPosts(): Promise<void>;
    searchPosts(query: string): Promise<Post[]>;

    // Folder operations
    saveFolder(name: string, color: string, postIds?: string[]): Promise<SaveFolderResult>;
    updateFolder(id: string, updates: Partial<Omit<Folder, 'id' | 'created_at'>>): Promise<Folder>;
    deleteFolder(id: string, deleteContainedPosts?: boolean): Promise<void>;
    getAllFolders(): Promise<Folder[]>;

    // Folder-Post operations
    addPostToFolder(folderId: string, postId: string): Promise<Folder>;
    removePostFromFolder(folderId: string, postId: string): Promise<Folder>;
    getPostsByFolderId(folderId: string): Promise<Post[]>;
    removePostFromAllFolders(postId: string): Promise<void>;

    // Pinned tabs operations
    getPinnedTabs(): Promise<Post[]>;
    pinTab(postId: string): Promise<boolean>;
    unpinTab(postId: string): Promise<void>;
    reorderPinnedTabs(newOrder: Post[]): Promise<void>;
    isPinned(postId: string): Promise<boolean>;

    // Import operations
    importPost(post: Post): Promise<void>;
    importFolder(folder: Folder): Promise<void>;
}
