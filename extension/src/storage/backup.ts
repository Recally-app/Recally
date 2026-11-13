import type { Post, Folder } from '../../../shared';
import type { BackupData } from '../../../shared/models/backup';

function record(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Invalid backup: expected an object');
    }
    return value as Record<string, unknown>;
}

function text(value: unknown): string {
    if (typeof value !== 'string' || !value.trim()) {
        throw new Error('Invalid backup: missing text field');
    }
    return value;
}

function date(value: unknown): string {
    const result = text(value);
    if (!Number.isFinite(Date.parse(result))) throw new Error('Invalid backup: invalid date');
    return result;
}

function array(value: unknown): unknown[] {
    if (!Array.isArray(value)) throw new Error('Invalid backup: expected an array');
    return value;
}

function url(value: unknown): string {
    const result = text(value);
    const parsed = new URL(result);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid backup: only HTTP and HTTPS URLs are supported');
    }
    return result;
}

function uniqueIds(items: { id: string }[]): void {
    if (new Set(items.map((item) => item.id)).size !== items.length) {
        throw new Error('Invalid backup: duplicate IDs');
    }
}

export function parseBackup(json: string): BackupData {
    const backup = record(JSON.parse(json));
    if (backup.version !== undefined && backup.version !== '1.0.0') {
        throw new Error('Unsupported backup version');
    }
    const data = record(backup.data);
    const posts: Post[] = array(data.posts).map((value) => {
        const post = record(value);
        if (post.notes !== undefined && typeof post.notes !== 'string') {
            throw new Error('Invalid backup: notes must be text');
        }
        if (post.favicon_url !== undefined && typeof post.favicon_url !== 'string') {
            throw new Error('Invalid backup: favicon must be text');
        }
        return {
            id: text(post.id),
            url: url(post.url),
            canonical_url: url(post.canonical_url),
            title: text(post.title),
            tags: array(post.tags).map(text),
            created_at: date(post.created_at),
            updated_at: date(post.updated_at),
            ...(typeof post.notes === 'string' ? { notes: post.notes } : {}),
            ...(typeof post.favicon_url === 'string' ? { favicon_url: post.favicon_url } : {}),
        };
    });
    const folders: Folder[] = array(data.folders).map((value) => {
        const folder = record(value);
        const color = text(folder.color);
        if (!/^#[\da-f]{6}$/i.test(color)) throw new Error('Invalid backup: invalid folder color');
        if (
            folder.order !== undefined &&
            (typeof folder.order !== 'number' || !Number.isFinite(folder.order))
        ) {
            throw new Error('Invalid backup: invalid folder order');
        }
        const ids =
            folder.post_ids === undefined
                ? array(folder.posts).map((post) => text(record(post).id))
                : array(folder.post_ids).map(text);
        return {
            id: text(folder.id),
            name: text(folder.name),
            color,
            post_ids: [...new Set(ids)],
            created_at: date(folder.created_at),
            updated_at: date(folder.updated_at),
            ...(typeof folder.order === 'number' ? { order: folder.order } : {}),
        };
    });
    const pinnedTabs = array(data.pinnedTabs ?? []).map((value) =>
        typeof value === 'string' ? text(value) : text(record(value).id)
    );
    uniqueIds(posts);
    uniqueIds(folders);
    return { posts, folders, pinnedTabs: [...new Set(pinnedTabs)] };
}
