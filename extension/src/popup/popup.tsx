import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import logoSrc from '../assets/icon/recally-logo-primary.svg';
import { StorageManager } from '../storage/storageManager';
import Dropdown from '../components/dropdown';

/**
 * A single saved post item.
 */
function SavedPostItem({
    post,
    isHighlighted,
    onDelete,
    onAddTags,
}: {
    post: any;
    isHighlighted?: boolean;
    onDelete: () => void;
    onAddTags: () => void;
}) {
    const website = new URL(post.url).hostname.replace('www.', '');
    // Format tags
    const tagsText = post.tags?.length ? `Tags: ${post.tags.join(', ')}` : '';

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
            console.warn('⚠️ Favicon fetch failed:', err);
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
            className={`relative flex items-center justify-between gap-3 rounded-[18px] p-3 text-white transition-all duration-500 cursor-pointer hover:shadow-md hover:scale-[1.02] hover:z-10 ${
                isHighlighted
                    ? 'bg-blue-500 shadow-lg scale-105'
                    : 'bg-[#26405e] hover:bg-[#3a6ca1]'
            }`}
            data-post-id={post.id}
        >
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
                    <p className="m-0 truncate text-xs opacity-80">{website}</p>
                    <h3 className="m-0 truncate font-semibold leading-tight my-[2px]">
                        {post.title}
                    </h3>
                    {tagsText && <p className="m-0 truncate text-xs opacity-90">{tagsText}</p>}
                </div>
            </div>
            <div>
                <Dropdown>
                    <button
                        onClick={onAddTags}
                        className="block w-full px-4 py-2 text-left text-sm"
                        role="menuitem"
                    >
                        Add tag(s)
                    </button>
                    <button
                        onClick={onDelete}
                        className="block w-full px-4 py-2 text-left text-sm"
                        role="menuitem"
                    >
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

/**
 * Get the 5 most recently used tags from all posts
 */
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
    post: any | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (tags: string[]) => Promise<void>;
    allPosts: any[];
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
        <div className="fixed inset-0 z-50 flex items-center justify-center " onClick={onClose}>
            <div
                className="w-[95%] max-w-md rounded-lg bg-[#26405e] p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="mb-4 text-lg font-bold text-white">Add Tags</h3>

                {/* Website - Read-only display */}
                <div className="mb-3">
                    <label className="mb-1 block text-sm font-semibold text-white">Website</label>
                    <div className="group relative">
                        <p className="rounded border border-gray-500 bg-white px-3 py-2 text-gray-600 cursor-not-allowed">
                            {website}
                        </p>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                </div>

                {/* Title - Read-only display */}
                <div className="mb-3">
                    <label className="mb-1 block text-sm font-semibold text-white">Title</label>
                    <div className="group relative">
                        <p className="rounded border border-gray-500 bg-white px-3 py-2 text-gray-600 cursor-not-allowed">
                            {post.title}
                        </p>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                </div>

                {/* Tags - Editable input */}
                <div className="mb-4">
                    <label className="mb-1 block text-sm font-semibold text-white">Tags</label>
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
                        className="w-full rounded border border-[#26405e] bg-white px-3 py-2 text-[#26405e] placeholder:text-[#26405e] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#26405e]"
                    />
                    <p className="mt-1 text-xs text-white opacity-70">Separate tags with commas</p>

                    {/* Tag Suggestions */}
                    {recentTags.length > 0 && (
                        <div className="mt-3">
                            <p className="mb-2 text-xs text-white opacity-70">Recent tags:</p>
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
                                            className={`rounded-full px-3 py-1 text-xs transition-colors ${
                                                isSelected
                                                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                                    : 'bg-white text-[#26405e] hover:bg-[#3a6ca1] hover:text-white cursor-pointer'
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

                {/* Buttons */}
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="rounded px-4 py-2 text-sm text-white hover:bg-[#26405e] hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleTagAdded}
                        className="rounded bg-[#26405e] px-4 py-2 text-sm text-white hover:bg-[#3a6ca1]"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function PopupApp() {
    enum SaveStatus {
        Idle = 'idle',
        Saving = 'saving',
        Success = 'success',
        AlreadyExists = 'already_exists',
        Error = 'error',
    }

    const [posts, setPosts] = useState<any[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [saveStatus, setSaveStatus] = useState<SaveStatus>(SaveStatus.Idle);
    const [existingPostId, setExistingPostId] = useState<string | null>(null);
    const [tagEditModalOpen, setTagEditModalOpen] = useState<boolean>(false);
    const [selectedPostForTags, setSelectedPostForTags] = useState<any | null>(null);

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

    useEffect(() => {
        fetchPosts();
    }, []);

    // Filter posts based on search query using StorageManager
    useEffect(() => {
        const performSearch = async () => {
            if (!searchQuery.trim()) {
                setFilteredPosts(posts);
                return;
            }

            const filtered = await StorageManager.searchPosts(searchQuery);
            setFilteredPosts(filtered);
        };

        performSearch();
    }, [searchQuery, posts]);

    const handleSaveClick = async () => {
        setSaveStatus(SaveStatus.Saving);
        setExistingPostId(null);

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.url || !tab?.title) {
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

    const handleAddTags = (post: any) => {
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
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: 'Could not update tags. Please try again.',
                confirmButtonColor: '#26405e',
            });
        }
    };

    const handleDeletePost = async (postId: string) => {
        const result = await Swal.fire({
            title: 'Delete saved tab?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            width: '80%',
            background: '#d8edfd',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#26405e',
            confirmButtonText: 'Yes, delete it!',
            focusCancel: true,
            customClass: {
                icon: 'big-success-icon',
            },
        });

        if (result.isConfirmed) {
            try {
                await StorageManager.deletePost(postId);
                setPosts((prev) => prev.filter((p) => p.id !== postId));
            } catch (err) {
                console.error('Failed to delete post:', err);

                Swal.fire({
                    icon: 'error',
                    title: 'Deletion Failed',
                    text: 'Could not delete Post. Please try again.',
                    confirmButtonColor: '#26405e',
                });
            }
        }
    };

    const handleDeleteAllPosts = async () => {
        const result = await Swal.fire({
            title: 'Are you sure you want to delete all posts?',
            text: 'You will loose all your data!',
            icon: 'warning',
            width: '80%',
            background: '#d8edfd',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#26405e',
            confirmButtonText: 'Yes, delete it!',
            focusCancel: true,
            customClass: {
                icon: 'big-success-icon',
            },
        });

        if (result.isConfirmed) {
            try {
                await StorageManager.deleteAllPosts();
                await fetchPosts();
            } catch (err) {
                console.error('Failed to delete all posts:', err);

                Swal.fire({
                    icon: 'error',
                    title: 'Deletion Failed',
                    text: 'Could not posts. Please try again.',
                    confirmButtonColor: '#26405e',
                });
            }
        }
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
        <div className="h-[600px] w-[400px] overflow-auto bg-[#d8edfd] font-sans text-[#26405e]">
            <header className="flex items-center justify-between px-[14px] py-[6px]">
                <img src={logoSrc} alt="Recally logo" className="h-[50px] w-[200px]" />
                <button className={buttonClasses} onClick={handleSaveClick} disabled={notIdle}>
                    {buttonText}
                </button>
            </header>

            {/* Search Bar */}
            <div className="mx-3 my-2 mb-2">
                <input
                    type="text"
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#26405e] bg-white text-[#26405e] placeholder:text-[#26405e] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#26405e] focus:border-transparent"
                />
            </div>

            <h2 className="section-title mx-3 my-2 mb-5 border-b-2 border-[#26405e] pb-1 text-base font-bold">
                SAVED POSTS
            </h2>
            <ul className="m-0 list-none flex flex-col gap-3 px-3">
                {filteredPosts.length === 0 ? (
                    searchQuery.trim() ? (
                        <div className="mt-10 text-center text-[#26405e] opacity-70">
                            <p>No posts found matching "{searchQuery}"</p>
                        </div>
                    ) : (
                        <EmptyState />
                    )
                ) : (
                    filteredPosts.map((post: any) => (
                        <SavedPostItem
                            key={post.id}
                            post={post}
                            isHighlighted={existingPostId === post.id}
                            onDelete={() => handleDeletePost(post.id)}
                            onAddTags={() => handleAddTags(post)}
                        />
                    ))
                )}
            </ul>

            {/* TODO: Move this to settings icon*/}
            <div className="absolute bottom-0 left-0 right-0 border-t bg-white p-3">
                <button
                    onClick={handleDeleteAllPosts}
                    className="w-full py-2 bg-red-600 text-white rounded-md"
                >
                    Delete all posts
                </button>
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
        </div>
    );
}
