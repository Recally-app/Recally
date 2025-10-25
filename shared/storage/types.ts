import type { Post } from '../models/post';

export interface StorageProvider {
  savePost(url: string, title: string, tags?: string[]): Promise<Post>;
  getAllPosts(): Promise<Post[]>;
  deletePost(id: string): Promise<void>;
  searchPosts(query: string): Promise<Post[]>;
}