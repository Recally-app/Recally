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
    savePost(url: string, title: string, tags?: string[], faviconUrl?: string): Promise<SavePostResult>;
    updatePostTags(id: string, tags: string[]): Promise<Post>;
    updatePostNotes(id: string, notes: string): Promise<Post>;
    getAllPosts(): Promise<Post[]>;
    deletePost(id: string): Promise<void>;
    deleteAllPosts(): Promise<void>;
    searchPosts(query: string): Promise<Post[]>;
    saveFolder(name: string, color: string, postIds?: string[]): Promise<SaveFolderResult>;
    updateFolder(id: string, updates: Partial<Omit<Folder, 'id' | 'created_at'>>): Promise<Folder>;
    deleteFolder(id: string, deleteContainedPosts?: boolean): Promise<void>;
    getAllFolders(): Promise<Folder[]>;
    addPostToFolder(folderId: string, postId: string): Promise<Folder>;
    removePostFromFolder(folderId: string, postId: string): Promise<Folder>;
    getPostsByFolderId(folderId: string): Promise<Post[]>;
    removeFolderFromPost(postId: string): Promise<void>;
}
//# sourceMappingURL=types.d.ts.map