import React, { useState, useEffect } from 'react';
import logoSrc from '../assets/icon/recally-logo-primary.svg';
import recallyIcon from '../assets/icon/recally_icon.svg';
import searchIcon from '../assets/icon/search_icon.svg';
import dotsHorizontalIcon from '../assets/icon/3-dots-horizontal.svg';
import editIcon from '../assets/icon/edit-icon.svg';
import deleteIcon from '../assets/icon/delete-icon.svg';
import pinIcon from '../assets/icon/pin-icon.svg';
import noteIcon from '../assets/icon/note-icon.svg';
import listIcon from '../assets/icon/list-icon.svg';
import folderIcon from '../assets/icon/folder-icon.svg';
import { isSupportedUrl } from '../utils/urlUtils';
import { StorageManager } from '../storage/storageManager';
import Dropdown from '../components/dropdown';
import SavedFolderItem from '../components/SavedFolderItem';
import CompactPostItem from '../components/CompactPostItem';
import CreateFolderModal from '../components/CreateFolderModal';
import EditFolderModal from '../components/EditFolderModal';
import ManageTabsModal from '../components/ManageTabsModal';
import PinnedTabsBar from '../components/PinnedTabsBar';
import ConfirmModal, { type ConfirmModalType } from '../components/ConfirmModal';
import type { Folder, Post } from '../../../shared';

/* A single saved post item. */
/*------------------------------------------------------------------------------------------------------------------------------------- */
function SavedPostItem({
    post,
    isHighlighted,
    onDelete,
    onAddTags,
    onSaveNote,
    onPinToggle,
    isPinned,
}: {
    post: Post;
    isHighlighted?: boolean;
    onDelete: () => void;
    onAddTags: () => void;
    onSaveNote: (note: string) => Promise<void>;
    onPinToggle: () => void;
    isPinned: boolean;
}) {
    const website = new URL(post.url).hostname.replace('www.', '');

    const [isEditingNote, setIsEditingNote] = useState(false);
    const [noteValue, setNoteValue] = useState(post.notes || '');
    const [isSaving, setIsSaving] = useState(false);

    // Sync noteValue when post.notes changes
    useEffect(() => {
        setNoteValue(post.notes || '');
    }, [post.notes]);

    const handleClickedSavedPost = () => {
        chrome.tabs.create({ url: post.url });
    };

    // Use stored favicon or fallback to Google's service
    async function getFaviconUrl(): Promise<string> {
        try {
            if (post.favicon_url) return post.favicon_url;

            const { hostname } = new URL(post.url);
            const ddgUrl = `https://icons.duckduckgo.com/ip3/${hostname}.ico`;

            const res = await fetch(ddgUrl);
            if (!res.ok) throw new Error(`favicon not found for ${hostname}`);

            const blob = await res.blob();
            return URL.createObjectURL(blob);
        } catch (err) {
            console.warn('Favicon fetch failed:', err);
            return ''; // later return default image
        }
    }

    const [faviconUrl, setFaviconUrl] = useState<string>('');

    useEffect(() => {
        let objectUrl: string | null = null;

        (async () => {
            const resolved = await getFaviconUrl();
            setFaviconUrl(resolved);

            // Track it so we can clean up later
            if (resolved.startsWith('blob:')) {
                objectUrl = resolved;
            }
        })();

        // Cleanup for blobs
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
                objectUrl = null;
            }
        };
    }, [post.url, post.favicon_url]);

    return (
        <li
            className={`relative flex items-center justify-between gap-3 border-[1px] border-[rgba(255,255,255,.15)] rounded-[10px] p-3 text-white transition-all duration-500 cursor-pointer hover:shadow-md hover:z-10 ${
                isHighlighted
                    ? 'bg-[rgba(255,255,255,.1)] shadow-lg'
                    : 'bg-[rgba(0,0,0,.3)] hover:bg-[rgba(255,255,255,.2)]'
            }`}
            data-post-id={post.id}
        >
            {/* Pinned Badge */}
            {isPinned && (
                <div className="absolute top-2 right-2 flex items-center justify-center">
                    <img
                        src={pinIcon}
                        alt="Pinned"
                        className="w-3 h-3 opacity-60"
                        title="This tab is pinned"
                    />
                </div>
            )}
            {/* Post Thumbnail */}
            <div
                className="flex items-center gap-3 overflow-hidden"
                data-post-id={post.id}
                onClick={handleClickedSavedPost}
                title={`Click to open: ${post.title}`}
            >
                <div className="h-8 w-8 flex-shrink-0 rounded flex items-center justify-center overflow-hidden">
                    {faviconUrl ? (
                        <img
                            src={faviconUrl}
                            alt={`${website} favicon`}
                            className="w-full h-full object-contain"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                    ) : (
                        <div className="w-full h-full rounded" />
                    )}
                </div>

                {/* Post Info */}
                <div className="flex flex-col overflow-hidden text-ellipsis">
                    <h3 className="m-0 truncate font-semibold leading-tight my-[2px]">
                        {post.title}
                    </h3>
                    <p className="m-0 truncate text-[9px] opacity-50 mr-20">{post.url}</p>

                    {post.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {post.tags.map((tag: string, index: number) => (
                                <span
                                    key={index}
                                    className="px-2 py-0.3 text-[9px] bg-[rgba(255,255,255,.15)] text-white 
                                    rounded-full border border-[rgba(255,255,255,.2)]"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                {/* Note Button */}
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditingNote(true);
                            setNoteValue(post.notes || '');
                        }}
                        className={`relative group p-2 rounded-lg transition-all hover:bg-white/10 flex-shrink-0 ${
                            post.notes ? 'bg-white/0' : ''
                        } ${isEditingNote ? 'bg-white/10' : ''}`}
                    >
                        <img
                            src={noteIcon}
                            alt="Note"
                            className="w-[18px] h-[18px] flex-shrink-0"
                        />
                        {/* Badge indicator when note exists */}
                        {post.notes && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-400 rounded-full"></span>
                        )}
                        {/* Note Preview Tooltip (only show when NOT editing) */}
                        {!isEditingNote && (
                            <div className="absolute top-full right-0 mt-2 w-[280px] p-2 bg-[#1a1a1a] border border-[rgba(255,255,255,.15)] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                <div className="flex items-center gap-2 mb-2">
                                    <img src={noteIcon} alt="Note" className="w-6 h-6" />
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-[12px] font-semibold text-white m-0 truncate">
                                            {website}
                                        </p>
                                        <p className="text-[8px] text-[rgba(255,255,255,.2)] m-0 mr-20 truncate">
                                            {post.url}
                                        </p>
                                    </div>
                                </div>
                                <hr className="mt-0 mb-2 mx-1 border-[1.2px] rounded-full border-[rgba(255,255,255,.1)] flex-shrink-0" />
                                {post.notes ? (
                                    <div className="text-[12px] text-white/90 whitespace-pre-wrap break-words max-h-[200px] overflow-y-auto text-left px-2">
                                        {post.notes}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic m-0">
                                        Click to add a note
                                    </p>
                                )}
                            </div>
                        )}
                    </button>

                    {/* Note Editor Popup */}
                    {isEditingNote && (
                        <>
                            {/* Backdrop to close on click outside */}
                            <div
                                className="fixed inset-0 z-40 bg-black/50"
                                onClick={() => setIsEditingNote(false)}
                            />
                            <div
                                className="absolute top-full right-0 mt-2 p-2 bg-[#1a1a1a] border border-[rgba(255,255,255,.15)] rounded-lg shadow-xl z-50 w-[280px]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <img src={noteIcon} alt="Note" className="w-6 h-6" />
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-[12px] font-semibold text-white m-0 truncate">
                                            {website}
                                        </p>
                                        <p className="text-[8px] text-[rgba(255,255,255,.2)] m-0 mr-20 truncate">
                                            {post.url}
                                        </p>
                                    </div>
                                </div>
                                <hr className="mt-0 mb-3 mx-1 border-[1.2px] rounded-full border-[rgba(255,255,255,.1)] flex-shrink-0" />
                                <textarea
                                    value={noteValue}
                                    onChange={(e) => setNoteValue(e.target.value)}
                                    placeholder="Type your note here..."
                                    className="w-full min-h-[120px] p-2 bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.1)] rounded text-white text-xs resize-none focus:outline-none focus:border-[rgba(255,255,255,.3)]"
                                    autoFocus
                                />
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={async () => {
                                            setIsSaving(true);
                                            await onSaveNote(noteValue);
                                            setIsSaving(false);
                                            setIsEditingNote(false);
                                        }}
                                        disabled={isSaving}
                                        className="rounded w-full bg-[linear-gradient(to_bottom_right,#146FCF,#0A3869)] px-4 py-2 text-xs text-white 
                                        hover:bg-[linear-gradient(to_bottom_right,#146FCF,#146FCF)] transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => setIsEditingNote(false)}
                                        disabled={isSaving}
                                        className="px-3 py-2 bg-[rgba(255,255,255,.1)] text-white text-xs font-semibold rounded hover:bg-[#db2525] transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <Dropdown panelClassName="!w-[130px]">
                    <button
                        onClick={onAddTags}
                        className="block w-full px-4 py-2 text-left text-[14px] flex items-center gap-2 transition-colors hover:bg-white/10"
                        role="menuitem"
                    >
                        <img src={editIcon} alt="Edit" className="w-[13px] h-[13px]" />
                        Edit tab
                    </button>

                    <button
                        onClick={onPinToggle}
                        className="block w-full px-4 py-2 text-left text-[14px] flex items-center gap-2 transition-colors hover:bg-white/10"
                        role="menuitem"
                    >
                        <img src={pinIcon} alt="Pin" className="w-[13px] h-[13px]" />
                        {isPinned ? 'Unpin Tab' : 'Pin Tab'}
                    </button>
                    <hr className="my-0 mx-4 border-[1.2px] rounded-full border-[rgba(255,255,255,.1)] flex-shrink-0" />
                    <button
                        onClick={onDelete}
                        className="block w-full px-4 py-2 text-left text-[14px] flex items-center gap-2 text-[#DB2525] transition-colors hover:bg-white/10"
                        role="menuitem"
                    >
                        <img src={deleteIcon} alt="Delete" className="w-[13px] h-[13px]" />
                        Delete
                    </button>
                </Dropdown>
            </div>
        </li>
    );
}

function EmptyState() {
    return (
        <div className="mt-10 text-center text-[#26405e] opacity-70">
            <p>No posts saved yet.</p>
            <p>Click "Save Current Tab" to get started!</p>
        </div>
    );
}

/* Get the 5 most recently used tags from all posts */
/*------------------------------------------------------------------------------------------------------------------------------------- */
function getRecentTags(posts: any[]): string[] {
    const tagUsage: Map<string, string> = new Map(); // tag -> most recent updated_at

    posts.forEach((post) => {
        if (post.tags && Array.isArray(post.tags)) {
            post.tags.forEach((tag: string) => {
                const trimmedTag = tag.trim();
                if (trimmedTag) {
                    const existingDate = tagUsage.get(trimmedTag);
                    // Use the most recent updated_at for this tag
                    if (!existingDate || post.updated_at > existingDate) {
                        tagUsage.set(trimmedTag, post.updated_at);
                    }
                }
            });
        }
    });

    return Array.from(tagUsage.entries())
        .sort((a, b) => b[1].localeCompare(a[1]))
        .slice(0, 5)
        .map(([tag, _date]: [string, string]) => tag);
}

function TagEditModal({
    post,
    isOpen,
    onClose,
    onSave,
    allPosts,
}: {
    post: Post | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (tags: string[]) => Promise<void>;
    allPosts: Post[];
}) {
    const [tagsInput, setTagsInput] = useState<string>('');
    const tagInputRef = React.useRef<HTMLInputElement>(null);
    const recentTags = getRecentTags(allPosts);

    useEffect(() => {
        if (isOpen && post) {
            setTagsInput(post.tags?.join(', ') || '');
            // Focus the input after a short delay to ensure modal is rendered
            setTimeout(() => {
                tagInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, post]);

    const handleTagAdded = async () => {
        if (!post) return;

        // Parse tags: split by comma, trim, and filter out empty strings
        const tags = Array.from(
            new Set(
                tagsInput
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter((tag) => tag.length > 0)
            )
        );

        await onSave(tags);
        onClose();
    };

    const handleTagSuggestionClick = (tag: string) => {
        const currentTags = tagsInput
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t.length > 0);

        // Don't add if tag already exists
        if (currentTags.includes(tag)) {
            return;
        }

        const newTags = [...currentTags, tag];
        const newValue = newTags.join(', ');
        setTagsInput(newValue);
        setTimeout(() => {
            const input = tagInputRef.current;
            if (input) {
                input.focus();
                input.setSelectionRange(newValue.length, newValue.length);
            }
        }, 0);
    };

    if (!isOpen || !post) return null;

    const website = new URL(post.url).hostname.replace('www.', '');

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[10px] bg-black/50"
            onClick={onClose}
        >
            <div
                className="w-[85%] max-w-md rounded-lg bg-[#1A1A1A] border-[1px] border-[rgba(255,255,255,.15)] p-4 shadow-xl shadow-black/30"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Website - Read-only display */}
                <div className="mb-3">
                    <div className="flex items-center gap-3">
                        <label className="block text-[13px] text-[rgba(255,255,255,.5)] mb-0 pr-3">
                            Name:
                        </label>
                        <p
                            className="rounded border border-[rgba(255,255,255,.25)] bg-[rgba(255,255,255,.15)] 
                        px-3 py-1 text-[rgba(255,255,255,.9)] cursor-not-allowed mb-0 w-full h-[30px]"
                        >
                            {website}
                        </p>
                    </div>
                </div>

                {/* Title - Read-only display */}
                <div className="mb-3">
                    <div className="flex items-center gap-3">
                        <label className="block text-[13px] text-[rgba(255,255,255,.5)] mb-0 pr-7">
                            Url:
                        </label>
                        <p
                            className="rounded border border-[rgba(255,255,255,.25)] bg-[rgba(255,255,255,.15)] 
                        px-3 py-1 text-[rgba(255,255,255,.9)] cursor-not-allowed mb-0 w-full h-[30px] truncate"
                        >
                            {post.url}
                        </p>
                    </div>
                </div>

                {/* Tags - Editable input */}
                <div className="mb-4">
                    <div className="flex items-center gap-3">
                        <label className="mb-1 block text-[13px] text-[rgba(255,255,255,.5)] pr-5">
                            Tags:
                        </label>
                        <div className="flex flex-col w-full p-2 border-[2px] border-[rgba(255,255,255,.25)] rounded-lg">
                            <input
                                ref={tagInputRef}
                                type="text"
                                value={tagsInput}
                                onChange={(e) => setTagsInput(e.target.value)}
                                placeholder="tag1, tag2, tag3"
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck="false"
                                className="w-full rounded border border-[rgba(255,255,255,.25)] bg-[rgba(255,255,255,.15)] 
                                px-3 py-1 text-[rgba(255,255,255,.9)] placeholder:text-[rgba(255,255,255,.9)] placeholder:opacity-50 focus:outline-none 
                                focus:ring-1 focus:ring-[rgba(255,255,255,.25)]"
                            />
                            <p className="mt-1 text-xs text-white opacity-25">
                                Separate tags with commas
                            </p>

                            {/* Tag Suggestions */}
                            {recentTags.length > 0 && (
                                <div className="mt-3">
                                    <p className="mb-2 text-xs text-white opacity-70">
                                        Recent tags:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {recentTags.map((tag) => {
                                            const currentTags = tagsInput
                                                .split(',')
                                                .map((t) => t.trim())
                                                .filter((t) => t.length > 0);
                                            const isSelected = currentTags.includes(tag);

                                            return (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => handleTagSuggestionClick(tag)}
                                                    disabled={isSelected}
                                                    className={`rounded-full px-3 py-[1px] text-[10px] transition-colors ${
                                                        isSelected
                                                            ? 'bg-[#738017] border-[1px] border-[rgba(255,255,255,.25)] text-gray-300 cursor-not-allowed'
                                                            : 'bg-[rgba(255,255,255,.2)] border-[1px] border-[rgba(255,255,255,.25)] text-[#ffffff] hover:bg-[#3a6ca1] hover:text-white cursor-pointer'
                                                    }`}
                                                >
                                                    {tag}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2">
                    <button
                        onClick={handleTagAdded}
                        className="rounded w-full bg-[linear-gradient(to_bottom_right,#146FCF,#0A3869)] px-4 py-2 text-sm text-white 
                        hover:bg-[linear-gradient(to_bottom_right,#146FCF,#146FCF)]"
                    >
                        Save
                    </button>
                    <button
                        onClick={onClose}
                        className="rounded px-4 py-2 text-sm text-white bg-[rgba(255,255,255,.1)] hover:bg-[#db2525] hover:text-white"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

/* Delete Confirmation Modal */
/*------------------------------------------------------------------------------------------------------------------------------------- */
function DeleteConfirmModal({
    onClose,
    onConfirm,
}: {
    onClose: () => void;
    onConfirm: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[10px] bg-black/50"
            onClick={onClose}
        >
            <div
                className="w-[320px] rounded-lg bg-[#1A1A1A] border border-[rgba(255,255,255,.15)] p-6 shadow-xl shadow-black/30"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-white text-lg font-bold mb-2 text-center">Delete Saved Tab</h2>
                <p className="text-white/80 text-sm mb-6 text-center">
                    You wont be able to revert this.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-6 py-2 bg-[#DB2525] text-white text-sm font-semibold rounded-lg hover:bg-[#B91C1C] transition-colors"
                    >
                        Delete
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-2 bg-[#4B5563] text-white text-sm font-semibold rounded-lg hover:bg-[#6B7280] transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

/* Settings Modal */
/*------------------------------------------------------------------------------------------------------------------------------------- */
function SettingsModal({
    onClose,
    sortBy,
    onSortByChange,
    sortReversed,
    onToggleReverse,
    onExport,
    onImport,
}: {
    onClose: () => void;
    sortBy: 'name' | 'date';
    onSortByChange: (sortBy: 'name' | 'date') => void;
    sortReversed: boolean;
    onToggleReverse: () => void;
    onExport: () => void;
    onImport: (mode: 'merge' | 'replace') => void;
}) {
    const [showImportDropdown, setShowImportDropdown] = React.useState(false);

    return (
        <div className="fixed inset-0 z-50 backdrop-blur-[10px] bg-black/50" onClick={onClose}>
            <div
                className="absolute top-[46px] left-[14px] w-[90%] rounded-lg bg-[#1A1A1A] border 
                border-[rgba(255,255,255,.15)] p-4 shadow-xl shadow-black/50"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 mb-4">
                    <img src={recallyIcon} alt="Settings" className="w-7 h-7" />
                    <h2 className="text-white text-[20px] font-bold">Settings</h2>
                </div>

                {/* Sort By Section */}
                <div className="flex items-center gap-2 mb-4">
                    <label className="text-white/60 text-base text-[14px] pr-1">Sort By:</label>
                    <div
                        className="flex items-center gap-2 bg-[rgba(255,255,255,.1)] rounded-full p-1 
                    border border-[rgba(255,255,255,.15)] w-[240px] h-[38px]"
                    >
                        <button
                            onClick={() => onSortByChange('name')}
                            className={`px-4 py-1 rounded-full text-[13px] font-medium transition-all ${
                                sortBy === 'name'
                                    ? 'bg-[#2563EB] text-white'
                                    : 'text-white/60 hover:text-white'
                            }`}
                        >
                            Name
                        </button>
                        <button
                            onClick={() => onSortByChange('date')}
                            className={`px-4 py-1 rounded-full text-[12px] font-medium transition-all ${
                                sortBy === 'date'
                                    ? 'bg-[#2563EB] text-white'
                                    : 'text-white/60 hover:text-white'
                            }`}
                        >
                            Date Modified
                        </button>
                        <button
                            onClick={onToggleReverse}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                                sortReversed
                                    ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
                                    : 'bg-[#4B5563] hover:bg-[#6B7280]'
                            }`}
                            title={sortReversed ? 'Sort Ascending' : 'Sort Descending'}
                        >
                            <svg
                                className={`w-4 h-4 text-white transition-transform ${sortReversed ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Data Section */}
                <div className="flex items-center gap-2">
                    <label className="text-white/60 text-base text-[14px] pr-5">Data:</label>
                    <div
                        className="flex items-center gap-2 bg-[rgba(255,255,255,.1)] rounded-full p-1 
                    border border-[rgba(255,255,255,.15)] w-[240px] h-[38px]"
                    >
                        {/* Export Button */}
                        <button
                            onClick={onExport}
                            className="w-[110px] px-4 py-1 bg-[rgba(0,0,0,.4)] rounded-full text-[13px] font-medium text-white/80 hover:text-white 
                            hover:bg-[rgba(255,255,255,.1)] transition-all justify-center"
                        >
                            Export
                        </button>

                        {/* Import Button with Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowImportDropdown(!showImportDropdown)}
                                className="w-[110px] flex items-center gap-1 px-4 py-1  bg-[rgba(0,0,0,.4)] rounded-full text-[13px] 
                                font-medium text-white/80 hover:text-white hover:bg-[rgba(255,255,255,.1)] transition-all justify-center"
                            >
                                Import
                                <svg
                                    className={`w-3 h-3 transition-transform ${showImportDropdown ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {showImportDropdown && (
                                <>
                                    {/* Backdrop to close dropdown */}
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowImportDropdown(false)}
                                    />
                                    <div className="absolute top-full mt-2 right-0 w-[120px] bg-[#1A1A1A] border border-[rgba(255,255,255,.15)] rounded-lg shadow-xl z-50 overflow-hidden">
                                        <button
                                            onClick={() => {
                                                setShowImportDropdown(false);
                                                onImport('merge');
                                            }}
                                            className="w-full px-4 py-2 text-left text-[13px] text-white/80 hover:bg-[rgba(255,255,255,.1)] hover:text-white transition-colors"
                                        >
                                            Merge
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowImportDropdown(false);
                                                onImport('replace');
                                            }}
                                            className="w-full px-4 py-2 text-left text-[13px] text-white/80 hover:bg-[rgba(255,255,255,.1)] hover:text-white transition-colors"
                                        >
                                            Replace
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* Popup App */
/*------------------------------------------------------------------------------------------------------------------------------------- */
export default function PopupApp() {
    enum SaveStatus {
        Idle = 'idle',
        Saving = 'saving',
        Success = 'success',
        AlreadyExists = 'already_exists',
        Error = 'error',
    }

    type ViewMode = 'list' | 'folder';

    const [posts, setPosts] = useState<any[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [saveStatus, setSaveStatus] = useState<SaveStatus>(SaveStatus.Idle);
    const [existingPostId, setExistingPostId] = useState<string | null>(null);
    const [tagEditModalOpen, setTagEditModalOpen] = useState<boolean>(false);
    const [selectedPostForTags, setSelectedPostForTags] = useState<any | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [postToDelete, setPostToDelete] = useState<string | null>(null);
    const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
    const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
    const [sortReversed, setSortReversed] = useState<boolean>(false);
    const [popupHeight, setPopupHeight] = useState<number>(240);
    const [isResizing, setIsResizing] = useState<boolean>(false);

    // Folder state
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [folders, setFolders] = useState<Folder[]>([]);
    const [filteredFolders, setFilteredFolders] = useState<Folder[]>([]);
    const [createFolderModalOpen, setCreateFolderModalOpen] = useState<boolean>(false);
    const [editFolderModalOpen, setEditFolderModalOpen] = useState<boolean>(false);
    const [manageTabsModalOpen, setManageTabsModalOpen] = useState<boolean>(false);
    const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
    const [manageTabsMode, setManageTabsMode] = useState<'add' | 'remove'>('add');

    // Pinned tabs state
    const [pinnedTabIds, setPinnedTabIds] = useState<Post[]>([]);

    // Confirm modal state
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: ConfirmModalType;
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        denyText?: string;
        showCancel?: boolean;
        showDeny?: boolean;
        onConfirm: () => void;
        onCancel?: () => void;
        onDeny?: () => void;
        autoCloseDelay?: number;
    }>({
        isOpen: false,
        type: 'info',
        title: '',
        message: '',
        onConfirm: () => {},
    });

    const showConfirmModal = (config: Omit<typeof confirmModal, 'isOpen'>) => {
        setConfirmModal({ ...config, isOpen: true });
    };

    const closeConfirmModal = () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    };

    const buttonTextMap: Record<SaveStatus, string> = {
        [SaveStatus.Idle]: 'Save Current Tab',
        [SaveStatus.Saving]: 'Saving...',
        [SaveStatus.Success]: 'Saved!',
        [SaveStatus.AlreadyExists]: 'Already saved!',
        [SaveStatus.Error]: 'Failed to save',
    };

    const buttonText = buttonTextMap[saveStatus];
    const isSaving = saveStatus === SaveStatus.Saving;
    const notIdle = saveStatus !== SaveStatus.Idle;

    const fetchPosts = async () => {
        const allPosts = await StorageManager.getAllPosts();
        setPosts(allPosts);
        setFilteredPosts(allPosts);
    };

    const fetchFolders = async () => {
        try {
            const allFolders = await StorageManager.getAllFolders();
            setFolders(allFolders);
            setFilteredFolders(allFolders);
        } catch (error) {
            console.error('Error fetching folders:', error);
            setFolders([]);
            setFilteredFolders([]);
        }
    };

    const fetchPinnedTabs = async () => {
        try {
            const pinned = await StorageManager.getPinnedTabs();
            // Ensure pinned is always an array
            setPinnedTabIds(Array.isArray(pinned) ? pinned : []);
        } catch (error) {
            console.error('Error fetching pinned tabs:', error);
            setPinnedTabIds([]);
        }
    };

    useEffect(() => {
        fetchPosts();
        fetchFolders();
        fetchPinnedTabs();

        // Load saved popup height and view mode
        chrome.storage.local.get(['popupHeight', 'viewMode'], (result) => {
            if (result.popupHeight) {
                setPopupHeight(result.popupHeight);
            }
            if (result.viewMode) {
                setViewMode(result.viewMode as ViewMode);
            }
        });
    }, []);

    // Helper function to change view mode and persist it
    const changeViewMode = (mode: ViewMode) => {
        setViewMode(mode);
        chrome.storage.local.set({ viewMode: mode });
    };

    // Filter posts and folders based on search query
    useEffect(() => {
        const performSearch = async () => {
            // Filter posts
            let filteredPostsResult = posts;

            if (searchQuery.trim()) {
                filteredPostsResult = await StorageManager.searchPosts(searchQuery);
            }

            // Apply sorting to posts
            const sortedPosts = [...filteredPostsResult].sort((a, b) => {
                if (sortBy === 'name') {
                    const comparison = a.title.localeCompare(b.title);
                    return sortReversed ? -comparison : comparison;
                } else {
                    // Sort by date (created_at or updated_at)
                    const dateA = new Date(a.updated_at || a.created_at).getTime();
                    const dateB = new Date(b.updated_at || b.created_at).getTime();
                    const comparison = dateB - dateA; // Most recent first by default
                    return sortReversed ? -comparison : comparison;
                }
            });

            setFilteredPosts(sortedPosts);

            // Filter folders (by name only)
            let filteredFoldersResult = folders;

            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                filteredFoldersResult = folders.filter((folder) =>
                    folder.name.toLowerCase().includes(query)
                );
            }

            // Apply sorting to folders
            const sortedFolders = [...filteredFoldersResult].sort((a, b) => {
                if (sortBy === 'name') {
                    const comparison = a.name.localeCompare(b.name);
                    return sortReversed ? -comparison : comparison;
                } else {
                    // Sort by date (updated_at or created_at)
                    const dateA = new Date(a.updated_at || a.created_at).getTime();
                    const dateB = new Date(b.updated_at || b.created_at).getTime();
                    const comparison = dateB - dateA; // Most recent first by default
                    return sortReversed ? -comparison : comparison;
                }
            });

            setFilteredFolders(sortedFolders);
        };

        performSearch();
    }, [searchQuery, posts, folders, sortBy, sortReversed]);

    // Handle resize drag
    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);

        const startY = e.clientY;
        const startHeight = popupHeight;
        let currentHeight = startHeight;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaY = moveEvent.clientY - startY;
            const newHeight = Math.max(240, Math.min(600, startHeight + deltaY));
            currentHeight = newHeight;
            setPopupHeight(newHeight);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            // Save the current height
            chrome.storage.local.set({ popupHeight: currentHeight });
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleSaveClick = async () => {
        setSaveStatus(SaveStatus.Saving);
        setExistingPostId(null);

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.url || !tab?.title || !isSupportedUrl(tab.url)) {
            console.error('Save failed: could not retrieve tab url or title');
            setSaveStatus(SaveStatus.Error);
        } else {
            try {
                // Get favicon from tab
                const faviconUrl = tab.favIconUrl || undefined;
                const result = await StorageManager.savePost(tab.url, tab.title, [], faviconUrl);

                if (result.wasDuplicate) {
                    setSaveStatus(SaveStatus.AlreadyExists);
                    setExistingPostId(result.post.id);
                    // Clear search to ensure duplicate post is visible
                    setSearchQuery('');

                    // Scroll to the existing post and highlight it
                    setTimeout(() => {
                        const postElement = document.querySelector(
                            `[data-post-id="${result.post.id}"]`
                        );
                        if (postElement) {
                            // Hybrid approach: instant scroll if more than 50 posts, smooth otherwise
                            const totalPosts = posts.length;
                            const scrollBehavior = totalPosts > 50 ? 'auto' : 'smooth';

                            postElement.scrollIntoView({
                                behavior: scrollBehavior,
                                block: 'center',
                            });
                            postElement.classList.add('highlight-existing');

                            // Remove highlight after animation
                            setTimeout(() => {
                                postElement.classList.remove('highlight-existing');
                            }, 2000);
                        }
                    }, 100);
                } else {
                    setSaveStatus(SaveStatus.Success);
                }
            } catch (error) {
                console.error('Save failed:', error);
                setSaveStatus(SaveStatus.Error);
            }
        }

        await fetchPosts();
        setTimeout(() => {
            setSaveStatus(SaveStatus.Idle);
            setExistingPostId(null);
        }, 1500);
    };

    const handleAddTags = (post: Post) => {
        setSelectedPostForTags(post);
        setTagEditModalOpen(true);
    };

    const handleSaveTags = async (tags: string[]) => {
        if (!selectedPostForTags) return;

        try {
            await StorageManager.updatePostTags(selectedPostForTags.id, tags);
            await fetchPosts();
        } catch (error) {
            console.error('Failed to update tags:', error);
            showConfirmModal({
                type: 'error',
                title: 'Update Failed',
                message: 'Could not update tags. Please try again.',
                confirmText: 'OK',
                onConfirm: closeConfirmModal,
            });
        }
    };

    const handleSaveNote = async (postId: string, noteText: string) => {
        try {
            await StorageManager.updatePostNotes(postId, noteText);
            await fetchPosts();
        } catch (error) {
            console.error('Failed to update note:', error);
            showConfirmModal({
                type: 'error',
                title: 'Update Failed',
                message: 'Could not update note. Please try again.',
                confirmText: 'OK',
                onConfirm: closeConfirmModal,
            });
        }
    };

    const handleDeletePost = (postId: string) => {
        setPostToDelete(postId);
        setDeleteModalOpen(true);
    };

    const confirmDeletePost = async () => {
        if (!postToDelete) return;

        try {
            // Check if post is pinned and unpin it
            const isPinned = await StorageManager.isPinned(postToDelete);
            if (isPinned) {
                await StorageManager.unpinTab(postToDelete);
                await fetchPinnedTabs();
            }

            await StorageManager.deletePost(postToDelete);
            setPosts((prev) => prev.filter((p) => p.id !== postToDelete));
            setDeleteModalOpen(false);
            setPostToDelete(null);
        } catch (err) {
            console.error('Failed to delete post:', err);
            setDeleteModalOpen(false);
            setPostToDelete(null);

            showConfirmModal({
                type: 'error',
                title: 'Deletion Failed',
                message: 'Could not delete Post. Please try again.',
                confirmText: 'OK',
                onConfirm: closeConfirmModal,
            });
        }
    };

    const handleDeleteAllPosts = async () => {
        showConfirmModal({
            type: 'warning',
            title: 'Delete All Posts?',
            message: 'You will lose all your data! This cannot be undone.',
            confirmText: 'Yes, delete all!',
            cancelText: 'Cancel',
            showCancel: true,
            onConfirm: async () => {
                closeConfirmModal();
                try {
                    await StorageManager.deleteAllPosts();
                    // Clear all pinned tabs since all posts are deleted
                    await StorageManager.reorderPinnedTabs([]);
                    await fetchPosts();
                    await fetchPinnedTabs();
                } catch (err) {
                    console.error('Failed to delete all posts:', err);
                    showConfirmModal({
                        type: 'error',
                        title: 'Deletion Failed',
                        message: 'Could not delete posts. Please try again.',
                        confirmText: 'OK',
                        onConfirm: closeConfirmModal,
                    });
                }
            },
            onCancel: closeConfirmModal,
        });
    };

    // ==================== Folder Handlers ====================

    const handleCreateFolder = async (name: string, color: string, addAllOpenTabs?: boolean) => {
        try {
            let postIds: string[] = [];

            // If user wants to add all open tabs, get them first
            if (addAllOpenTabs) {
                const tabs = await chrome.tabs.query({ currentWindow: true });
                const validTabs = tabs.filter((tab) => tab.url && isSupportedUrl(tab.url));

                // Save each tab as a post if not already saved
                const savedPosts = await Promise.all(
                    validTabs.map(async (tab) => {
                        if (tab.url && tab.title) {
                            const result = await StorageManager.savePost(
                                tab.url,
                                tab.title,
                                [],
                                tab.favIconUrl
                            );
                            return result.post.id;
                        }
                        return null;
                    })
                );

                const uniqueIds = new Set(savedPosts.filter((id): id is string => id !== null));
                postIds = Array.from(uniqueIds);

                // Refresh posts list if we added any
                if (postIds.length > 0) {
                    await fetchPosts();
                }
            }

            const result = await StorageManager.saveFolder(name, color, postIds);
            if (result.wasDuplicate) {
                showConfirmModal({
                    type: 'info',
                    title: 'Folder Already Exists',
                    message: `A folder named "${name}" already exists.`,
                    confirmText: 'OK',
                    onConfirm: closeConfirmModal,
                });
            } else if (addAllOpenTabs && postIds.length > 0) {
                showConfirmModal({
                    type: 'success',
                    title: 'Folder Created',
                    message: `Folder "${name}" created with ${postIds.length} tab${postIds.length === 1 ? '' : 's'}.`,
                    confirmText: 'OK',
                    onConfirm: closeConfirmModal,
                    autoCloseDelay: 2000,
                });
            }
            await fetchFolders();
        } catch (error) {
            console.error('Failed to create folder:', error);
            showConfirmModal({
                type: 'error',
                title: 'Creation Failed',
                message: 'Could not create folder. Please try again.',
                confirmText: 'OK',
                onConfirm: closeConfirmModal,
            });
        }
    };

    const handleEditFolder = async (name: string, color: string) => {
        if (!selectedFolder) return;

        try {
            await StorageManager.updateFolder(selectedFolder.id, { name, color });
            await fetchFolders();
        } catch (error) {
            console.error('Failed to update folder:', error);
            showConfirmModal({
                type: 'error',
                title: 'Update Failed',
                message: 'Could not update folder. Please try again.',
                confirmText: 'OK',
                onConfirm: closeConfirmModal,
            });
        }
    };

    const handleDeleteFolder = async (folderId: string) => {
        showConfirmModal({
            type: 'warning',
            title: 'Delete Folder',
            message:
                'Do you want to delete the folder only or also delete all tabs inside? Deleting tabs will remove them from all folders and lists.',
            confirmText: 'Delete Folder Only',
            denyText: 'Delete Folder & Tabs',
            cancelText: 'Cancel',
            showCancel: true,
            showDeny: true,
            onConfirm: async () => {
                closeConfirmModal();
                // Delete folder only
                try {
                    await StorageManager.deleteFolder(folderId, false);
                    await fetchFolders();
                } catch (error) {
                    console.error('Failed to delete folder:', error);
                    showConfirmModal({
                        type: 'error',
                        title: 'Deletion Failed',
                        message: 'Could not delete folder. Please try again.',
                        confirmText: 'OK',
                        onConfirm: closeConfirmModal,
                    });
                }
            },
            onDeny: async () => {
                closeConfirmModal();
                showConfirmModal({
                    type: 'warning',
                    title: 'Delete Folder & Tabs',
                    message:
                        'This will delete the tabs in this folder everywhere (all folders and lists). This cannot be undone.',
                    confirmText: 'Delete Everywhere',
                    cancelText: 'Cancel',
                    showCancel: true,
                    onConfirm: async () => {
                        closeConfirmModal();
                        try {
                            const folder = folders.find((f) => f.id === folderId);
                            if (folder) {
                                const folderPosts =
                                    await StorageManager.getPostsByFolderId(folderId);
                                for (const post of folderPosts) {
                                    const isPinned = await StorageManager.isPinned(post.id);
                                    if (isPinned) {
                                        await StorageManager.unpinTab(post.id);
                                    }
                                }
                            }

                            await StorageManager.deleteFolder(folderId, true);
                            await fetchFolders();
                            await fetchPosts();
                            await fetchPinnedTabs();
                        } catch (error) {
                            console.error('Failed to delete folder and posts:', error);
                            showConfirmModal({
                                type: 'error',
                                title: 'Deletion Failed',
                                message: 'Could not delete folder and tabs. Please try again.',
                                confirmText: 'OK',
                                onConfirm: closeConfirmModal,
                            });
                        }
                    },
                    onCancel: closeConfirmModal,
                });
            },
            onCancel: closeConfirmModal,
        });
    };

    const handleOpenAllTabsInFolder = async (folderId: string) => {
        try {
            const posts = await StorageManager.getPostsByFolderId(folderId);

            if (posts.length === 0) {
                showConfirmModal({
                    type: 'info',
                    title: 'Folder is Empty',
                    message: 'This folder has no tabs to open.',
                    confirmText: 'OK',
                    onConfirm: closeConfirmModal,
                });
                return;
            }

            // Open all tabs
            for (let i = 0; i < posts.length; i++) {
                const post = posts[i];
                if (post) {
                    await chrome.tabs.create({
                        url: post.url,
                        active: i === 0, // Make first tab active
                    });
                }
            }
        } catch (error) {
            console.error('Failed to open tabs:', error);
            showConfirmModal({
                type: 'error',
                title: 'Failed to Open Tabs',
                message: 'Could not open tabs. Please try again.',
                confirmText: 'OK',
                onConfirm: closeConfirmModal,
            });
        }
    };

    const handleAddTabsToFolder = async (postIds: string[]) => {
        if (!selectedFolder) return;

        try {
            for (const postId of postIds) {
                await StorageManager.addPostToFolder(selectedFolder.id, postId);
            }
            await fetchFolders();
        } catch (error) {
            console.error('Failed to add tabs to folder:', error);
            showConfirmModal({
                type: 'error',
                title: 'Failed to Add Tabs',
                message: 'Could not add tabs to folder. Please try again.',
                confirmText: 'OK',
                onConfirm: closeConfirmModal,
            });
        }
    };

    const handleRemoveTabsFromFolder = async (postIds: string[]) => {
        if (!selectedFolder) return;

        try {
            for (const postId of postIds) {
                await StorageManager.removePostFromFolder(selectedFolder.id, postId);
            }
            await fetchFolders();
        } catch (error) {
            console.error('Failed to remove tabs from folder:', error);
            showConfirmModal({
                type: 'error',
                title: 'Failed to Remove Tabs',
                message: 'Could not remove tabs from folder. Please try again.',
                confirmText: 'OK',
                onConfirm: closeConfirmModal,
            });
        }
    };

    const handleChangeColor = async (color: string) => {
        if (!selectedFolder) return;

        try {
            await StorageManager.updateFolder(selectedFolder.id, { color });
            await fetchFolders();
            // Close the manage tabs modal and show a simple confirmation
            setManageTabsModalOpen(false);
        } catch (error) {
            console.error('Failed to change folder color:', error);
        }
    };

    // ==================== Pinned Tabs Handlers ====================

    const handlePinTab = async (postId: string) => {
        try {
            const success = await StorageManager.pinTab(postId);
            if (!success) {
                showConfirmModal({
                    type: 'info',
                    title: 'Maximum Pins Reached',
                    message: 'You can only pin up to 5 tabs at a time.',
                    confirmText: 'OK',
                    onConfirm: closeConfirmModal,
                });
            }
            await fetchPinnedTabs();
        } catch (error) {
            console.error('Failed to pin tab:', error);
        }
    };

    const handleUnpinTab = async (postId: string) => {
        try {
            await StorageManager.unpinTab(postId);
            await fetchPinnedTabs();
        } catch (error) {
            console.error('Failed to unpin tab:', error);
        }
    };

    const handleReorderPinnedTabs = async (newOrder: Post[]) => {
        try {
            await StorageManager.reorderPinnedTabs(newOrder);
            await fetchPinnedTabs();
        } catch (error) {
            console.error('Failed to reorder pinned tabs:', error);
        }
    };

    // ==================== Import/Export Handlers ====================

    const handleExportData = async () => {
        try {
            const jsonData = await StorageManager.exportData();
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // Create a temporary download link
            const a = document.createElement('a');
            a.href = url;
            a.download = `recally-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showConfirmModal({
                type: 'success',
                title: 'Export Successful',
                message: 'Your data has been exported successfully.',
                confirmText: 'OK',
                onConfirm: closeConfirmModal,
            });
        } catch (error) {
            console.error('Export failed:', error);
            showConfirmModal({
                type: 'error',
                title: 'Export Failed',
                message: 'Could not export data. Please try again.',
                confirmText: 'OK',
                onConfirm: closeConfirmModal,
            });
        }
    };

    const handleImportData = async (mode: 'merge' | 'replace') => {
        // Create a file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];

            if (!file) return;

            try {
                const text = await file.text();

                // Show confirmation dialog
                showConfirmModal({
                    type: 'warning',
                    title: mode === 'merge' ? 'Merge Data?' : 'Replace All Data?',
                    message:
                        mode === 'merge'
                            ? 'This will add the imported data to your existing data.'
                            : 'This will delete all your current data and replace it with the imported data. This cannot be undone!',
                    confirmText: mode === 'merge' ? 'Merge' : 'Replace All',
                    cancelText: 'Cancel',
                    showCancel: true,
                    onConfirm: async () => {
                        closeConfirmModal();
                        try {
                            // Perform the import
                            await StorageManager.importData(text, mode);

                            // Refresh all data
                            await fetchPosts();
                            await fetchFolders();
                            await fetchPinnedTabs();

                            showConfirmModal({
                                type: 'success',
                                title: 'Import Successful',
                                message: `Your data has been ${mode === 'merge' ? 'merged' : 'replaced'} successfully.`,
                                confirmText: 'OK',
                                onConfirm: closeConfirmModal,
                            });
                        } catch (importError) {
                            console.error('Import failed:', importError);
                            showConfirmModal({
                                type: 'error',
                                title: 'Import Failed',
                                message:
                                    importError instanceof Error
                                        ? importError.message
                                        : 'Could not import data. Please check the file format.',
                                confirmText: 'OK',
                                onConfirm: closeConfirmModal,
                            });
                        }
                    },
                    onCancel: closeConfirmModal,
                });
            } catch (error) {
                console.error('Import failed:', error);
                showConfirmModal({
                    type: 'error',
                    title: 'Import Failed',
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Could not import data. Please check the file format.',
                    confirmText: 'OK',
                    onConfirm: closeConfirmModal,
                });
            }
        };

        // Trigger file picker
        input.click();
    };

    const buttonClasses = [
        'rounded-full',
        'border-none',
        'px-[14px]',
        'py-[6px]',
        'text-[13px]',
        'text-white',
        'cursor-pointer',
        'transition-all',
        'duration-300',
        'ease-in-out',
        'hover:shadow-md',
        'hover:-translate-y-px',
        'disabled:opacity-50',
        saveStatus === SaveStatus.Error ? 'bg-red-500' : 'bg-[#26405e]',
        isSaving ? 'opacity-70' : 'hover:bg-[#3a6ca1]',
    ].join(' ');

    return (
        <>
            <div
                className="w-[380px] bg-[radial-gradient(circle_at_top_left,#202020,#1A1A1A)]
            font-sans text-[#26405e] rounded-[0px] relative flex flex-col"
                style={{ height: `${popupHeight}px` }}
            >
                {/* Fixed Header */}
                <header className="flex items-center justify-between mx-[14px] my-[4px] mb-0 flex-shrink-0">
                    {/* Recally Button */}
                    <button
                        onClick={() => setSettingsModalOpen(true)}
                        className={`min-w-[30px] min-h-[30px] max-w-[38px] max-h-[38px] p-[5px] bg-[radial-gradient(circle_at_top_left,#002C5A,#1F2B37)]  
                    rounded-full flex items-center justify-center border-[rgba(255,255,255,.15)] border-[1px]
                    hover:bg-[radial-gradient(circle_at_top_left,#293f57,#27476b)] ${
                        settingsModalOpen ? 'relative z-[60]' : ''
                    }`}
                    >
                        <img src={recallyIcon} alt="Recally icon" className="w-[16px] h-[16px]" />
                    </button>

                    {/* Search Bar */}
                    <div className="mx-2 my-2 mb-2 relative w-fill">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                            {/* Search Icon SVG */}
                            <img src={searchIcon} alt="Search icon" className="w-[16px] h-[16px]" />
                        </span>
                        <input
                            type="text"
                            placeholder="Search posts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-[220px] p-1 pl-10 rounded-[19px] border border-[rgba(255,255,255,.25)] 
                        bg-[rgba(0,0,0,.15)] text-[rgba(255,255,255,.8)] placeholder:text-[rgba(255,255,255,.5)] 
                        placeholder:opacity-50 focus:outline-none focus:ring-1 focus:ring-[rgba(255,255,255,.5)] focus:border-transparent text-[14px]"
                        />
                    </div>

                    {/* Save Tab Button (List View) / Create Folder Button (Folder View) */}
                    <div className="flex items-center gap-2"></div>
                    {viewMode === 'list' ? (
                        <button
                            className="w-[100px] p-1 bg-[radial-gradient(circle_at_top_left,#0A4582,#002C5A)] 
                        text-white rounded-[19px] flex items-center justify-center border-[rgba(255,255,255,.15)] border-[1px] 
                        hover:bg-[radial-gradient(circle_at_top_left,#0A4582,#0A4582)] 
                        text-[14px] font-regular"
                            onClick={handleSaveClick}
                            disabled={notIdle}
                        >
                            Save Tab
                        </button>
                    ) : (
                        <button
                            onClick={() => setCreateFolderModalOpen(true)}
                            className="w-[100px] p-1 bg-[radial-gradient(circle_at_top_left,#5c990b,#b8d419)] 
                        text-white rounded-[19px] flex items-center justify-center border-[rgba(255,255,255,.15)] border-[1px] 
                        hover:bg-[radial-gradient(circle_at_top_left,#b8d419,#b8d419)] 
                        text-[14px] font-regular"
                            title="Create New Folder"
                        >
                            + Folder
                        </button>
                    )}
                </header>

                <hr className="mt-0 mb-2 mx-3 border-[1.2px] rounded-full border-[rgba(255,255,255,.1)] flex-shrink-0" />

                {/* Pinned tabs Bar 01 and List and Folder */}
                <div className="mx-3 mb-2 flex items-center gap-1.5">
                    <PinnedTabsBar
                        pinnedTabIds={pinnedTabIds}
                        posts={posts}
                        onUnpin={handleUnpinTab}
                        onReorder={handleReorderPinnedTabs}
                        onTabClick={(url) => chrome.tabs.create({ url })}
                    />

                    {/* List View Button */}
                    <button
                        onClick={() => changeViewMode('list')}
                        className={`min-w-[24px] min-h-[24px] max-w-[24px] max-h-[24px] rounded-full flex items-center justify-center transition-all ${
                            viewMode === 'list'
                                ? ''
                                : 'bg-[rgba(255,255,255,.25)] hover:bg-[rgba(255,255,255,.35)]'
                        }`}
                        style={
                            viewMode === 'list'
                                ? {
                                      background: 'linear-gradient(to bottom, #146FCF, #0A3869)',
                                  }
                                : {}
                        }
                        title="List View"
                    >
                        <img
                            src={listIcon}
                            alt="List Button"
                            className={`size-[10px] m-1 ${viewMode === 'list' ? 'opacity-80' : 'opacity-50'}`}
                        />
                    </button>

                    {/* Folder View Button */}
                    <button
                        onClick={() => changeViewMode('folder')}
                        className={`min-w-[24px] min-h-[24px] max-w-[24px] max-h-[24px] rounded-full flex items-center justify-center transition-all ${
                            viewMode === 'folder'
                                ? ''
                                : 'bg-[rgba(255,255,255,.25)] hover:bg-[rgba(255,255,255,.35)]'
                        }`}
                        style={
                            viewMode === 'folder'
                                ? {
                                      background:
                                          'linear-gradient(to bottom,rgb(184, 212, 25),rgb(92, 153, 11))',
                                  }
                                : {}
                        }
                        title="Folder View"
                    >
                        <img
                            src={folderIcon}
                            alt="Folder Button"
                            className={`size-[15px] m-1 ${viewMode === 'folder' ? 'opacity-80' : 'opacity-50'}`}
                        />
                    </button>
                </div>

                {/* Scrollable List Area Only */}
                <div
                    className="scrollable-list flex-1 overflow-y-scroll overflow-x-hidden mx-3"
                    style={
                        {
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
                            paddingRight: '12px',
                        } as React.CSSProperties
                    }
                >
                    {/* List View */}
                    {viewMode === 'list' && (
                        <ul className="m-0 list-none flex flex-col gap-2">
                            {filteredPosts.length === 0 ? (
                                searchQuery.trim() ? (
                                    <div className="mt-10 text-center text-[rgba(255,255,255,.5)] opacity-70">
                                        <p>No posts found matching "{searchQuery}"</p>
                                    </div>
                                ) : (
                                    <EmptyState />
                                )
                            ) : (
                                filteredPosts.map((post: Post) => {
                                    const isPinned = pinnedTabIds.some((p) => p.id === post.id);
                                    return (
                                        <SavedPostItem
                                            key={post.id}
                                            post={post}
                                            isHighlighted={existingPostId === post.id}
                                            onDelete={() => handleDeletePost(post.id)}
                                            onAddTags={() => handleAddTags(post)}
                                            onSaveNote={(noteText) =>
                                                handleSaveNote(post.id, noteText)
                                            }
                                            onPinToggle={() => {
                                                if (isPinned) {
                                                    handleUnpinTab(post.id);
                                                } else {
                                                    handlePinTab(post.id);
                                                }
                                            }}
                                            isPinned={isPinned}
                                        />
                                    );
                                })
                            )}
                        </ul>
                    )}

                    {/* Folder View */}
                    {viewMode === 'folder' && (
                        <ul className="m-0 list-none flex flex-col gap-2">
                            {filteredFolders.length === 0 ? (
                                searchQuery.trim() ? (
                                    <div className="mt-10 text-center text-[rgba(255,255,255,.5)] opacity-70">
                                        <p>No folders found matching "{searchQuery}"</p>
                                    </div>
                                ) : folders.length === 0 ? (
                                    <div className="mt-10 text-center text-[rgba(255,255,255,.5)] opacity-70">
                                        <p>No folders yet.</p>
                                        <button
                                            onClick={() => setCreateFolderModalOpen(true)}
                                            className="mt-2 px-4 py-2 bg-[#26405e] text-white text-sm rounded-full hover:bg-[#3a6ca1] transition-colors"
                                        >
                                            Create Your First Folder
                                        </button>
                                    </div>
                                ) : null
                            ) : (
                                filteredFolders.map((folder) => {
                                    return (
                                        <SavedFolderItem
                                            key={folder.id}
                                            folder={folder}
                                            onDelete={() => handleDeleteFolder(folder.id)}
                                            onEdit={() => {
                                                setSelectedFolder(folder);
                                                setEditFolderModalOpen(true);
                                            }}
                                            onOpenAllTabs={() =>
                                                handleOpenAllTabsInFolder(folder.id)
                                            }
                                            onAddTab={() => {
                                                setSelectedFolder(folder);
                                                setManageTabsMode('add');
                                                setManageTabsModalOpen(true);
                                            }}
                                            onAddCurrentTab={async () => {
                                                // Add current tab to this folder
                                                try {
                                                    const [tab] = await chrome.tabs.query({
                                                        active: true,
                                                        currentWindow: true,
                                                    });
                                                    if (!tab?.url || !tab?.title) {
                                                        console.error(
                                                            'Could not get current tab info'
                                                        );
                                                        return;
                                                    }

                                                    // Save the post first (if not already saved)
                                                    const result = await StorageManager.savePost(
                                                        tab.url,
                                                        tab.title,
                                                        [],
                                                        tab.favIconUrl
                                                    );

                                                    // Add to folder
                                                    await StorageManager.addPostToFolder(
                                                        folder.id,
                                                        result.post.id
                                                    );
                                                    await fetchFolders();
                                                    await fetchPosts();

                                                    /***  Show success notification
                                            showConfirmModal({
                                                type: 'success',
                                                title: 'Tab Added',
                                                message: `Added "${tab.title}" to "${folder.name}"`,
                                                confirmText: 'OK',
                                                onConfirm: closeConfirmModal,
                                                autoCloseDelay: 2000,
                                            });*/
                                                } catch (error) {
                                                    console.error(
                                                        'Failed to add current tab to folder:',
                                                        error
                                                    );
                                                    showConfirmModal({
                                                        type: 'error',
                                                        title: 'Failed to Add Tab',
                                                        message:
                                                            'Could not add tab to folder. Please try again.',
                                                        confirmText: 'OK',
                                                        onConfirm: closeConfirmModal,
                                                    });
                                                }
                                            }}
                                            onRemoveTab={() => {
                                                setSelectedFolder(folder);
                                                setManageTabsMode('remove');
                                                setManageTabsModalOpen(true);
                                            }}
                                            onChangeColor={() => {
                                                setSelectedFolder(folder);
                                                setEditFolderModalOpen(true);
                                            }}
                                            onPostClick={(url) => chrome.tabs.create({ url })}
                                            renderPostItem={(post) => {
                                                const isPinned = pinnedTabIds.some(
                                                    (p: Post) => p.id === post.id
                                                );
                                                return (
                                                    <CompactPostItem
                                                        key={post.id}
                                                        post={post}
                                                        onClick={() =>
                                                            chrome.tabs.create({ url: post.url })
                                                        }
                                                        onDelete={async () => {
                                                            // Remove post from folder
                                                            await StorageManager.removePostFromFolder(
                                                                folder.id,
                                                                post.id
                                                            );
                                                            await fetchFolders();
                                                        }}
                                                        onAddTags={() => handleAddTags(post)}
                                                        onSaveNote={(noteText) =>
                                                            handleSaveNote(post.id, noteText)
                                                        }
                                                        onPinToggle={() => {
                                                            if (isPinned) {
                                                                handleUnpinTab(post.id);
                                                            } else {
                                                                handlePinTab(post.id);
                                                            }
                                                        }}
                                                        isPinned={isPinned}
                                                    />
                                                );
                                            }}
                                        />
                                    );
                                })
                            )}
                        </ul>
                    )}
                </div>

                {/* Resize Handle - Fixed at bottom */}
                <div
                    className={`resize-handle ${isResizing ? 'resizing' : ''}`}
                    onMouseDown={handleResizeStart}
                    title="Drag to resize"
                    style={{
                        width: '100%',
                        height: '30px',
                        background: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'ns-resize',
                        flexShrink: 0,
                    }}
                >
                    <img
                        src={dotsHorizontalIcon}
                        alt="Resize handle"
                        className="resize-handle-indicator"
                        style={{
                            width: '24px',
                            height: '24px',
                            opacity: 0.5,
                            transition: 'opacity 0.2s ease',
                        }}
                    />
                </div>

                <TagEditModal
                    post={selectedPostForTags}
                    isOpen={tagEditModalOpen}
                    onClose={() => {
                        setTagEditModalOpen(false);
                        setSelectedPostForTags(null);
                    }}
                    onSave={handleSaveTags}
                    allPosts={posts}
                />

                {deleteModalOpen && (
                    <DeleteConfirmModal
                        onClose={() => {
                            setDeleteModalOpen(false);
                            setPostToDelete(null);
                        }}
                        onConfirm={confirmDeletePost}
                    />
                )}

                {settingsModalOpen && (
                    <SettingsModal
                        onClose={() => setSettingsModalOpen(false)}
                        sortBy={sortBy}
                        onSortByChange={setSortBy}
                        sortReversed={sortReversed}
                        onToggleReverse={() => setSortReversed(!sortReversed)}
                        onExport={handleExportData}
                        onImport={handleImportData}
                    />
                )}

                {/* Folder Modals */}
                <CreateFolderModal
                    isOpen={createFolderModalOpen}
                    onClose={() => setCreateFolderModalOpen(false)}
                    onSave={handleCreateFolder}
                    existingFolderNames={folders.map((f) => f.name)}
                />

                <EditFolderModal
                    folder={selectedFolder}
                    isOpen={editFolderModalOpen}
                    onClose={() => {
                        setEditFolderModalOpen(false);
                        setSelectedFolder(null);
                    }}
                    onSave={handleEditFolder}
                    existingFolderNames={folders
                        .filter((f) => f.id !== selectedFolder?.id)
                        .map((f) => f.name)}
                />

                <ManageTabsModal
                    folder={selectedFolder}
                    allPosts={posts}
                    isOpen={manageTabsModalOpen}
                    onClose={() => {
                        setManageTabsModalOpen(false);
                        setSelectedFolder(null);
                    }}
                    onSave={
                        manageTabsMode === 'add'
                            ? handleAddTabsToFolder
                            : handleRemoveTabsFromFolder
                    }
                    mode={manageTabsMode}
                />

                {/* Confirm Modal */}
                {confirmModal.isOpen && (
                    <ConfirmModal
                        isOpen={true}
                        type={confirmModal.type}
                        title={confirmModal.title}
                        message={confirmModal.message}
                        {...(confirmModal.confirmText && { confirmText: confirmModal.confirmText })}
                        {...(confirmModal.cancelText && { cancelText: confirmModal.cancelText })}
                        {...(confirmModal.denyText && { denyText: confirmModal.denyText })}
                        {...(confirmModal.showCancel !== undefined && {
                            showCancel: confirmModal.showCancel,
                        })}
                        {...(confirmModal.showDeny !== undefined && {
                            showDeny: confirmModal.showDeny,
                        })}
                        onConfirm={confirmModal.onConfirm}
                        {...(confirmModal.onCancel && { onCancel: confirmModal.onCancel })}
                        {...(confirmModal.onDeny && { onDeny: confirmModal.onDeny })}
                        {...(confirmModal.autoCloseDelay && {
                            autoCloseDelay: confirmModal.autoCloseDelay,
                        })}
                    />
                )}
            </div>
        </>
    );
}
