import React, { useState, useEffect } from 'react';
import logoSrc from '../assets/icon/recally-logo-primary.svg';
import { StorageManager } from '../storage/storageManager';
import Dropdown from '../components/dropdown';

/**
 * A single saved post item.
 */
function SavedPostItem({ post, isHighlighted }: { post: any; isHighlighted?: boolean }) {
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

    const handleDeletePost = () => {
        StorageManager.deletePost(post.id);
    };

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
              <Dropdown >
                <button
                    onClick={handleDeletePost}
                    className="block w-full px-4 py-2 text-left  text-sm hover:rounded-md hover:bg-[#FDF5AA]"
                    role="menuitem"
                >
                    Delete
                </button>
                <button
                    onClick={()=>{}}
                    className="block w-full px-4 py-2 text-left  text-sm hover:rounded-md hover:bg-[#FDF5AA]"
                    role="menuitem"
                >
                    AI Summary
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

export default function PopupApp() {
    enum SaveStatus {
        Idle = 'idle',
        Saving = 'saving',
        Success = 'success',
        AlreadyExists = 'already_exists',
        Error = 'error',
    }

    const [posts, setPosts] = useState<any[]>([]);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>(SaveStatus.Idle);
    const [existingPostId, setExistingPostId] = useState<string | null>(null);

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

    // This function replaces the `renderPosts` logic
    const fetchPosts = async () => {
        const allPosts = await StorageManager.getAllPosts();
        setPosts(allPosts);
    };

    useEffect(() => {
        fetchPosts();
    }, []);

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

            <h2 className="section-title mx-3 my-2 mb-5 border-b-2 border-[#26405e] pb-1 text-base font-bold">
                SAVED POSTS
            </h2>

            <ul className="m-0 list-none flex flex-col gap-3 px-3">
                {posts.length === 0 ? (
                    <EmptyState />
                ) : (
                    posts.map((post: any) => (
                        <SavedPostItem
                            key={post.id}
                            post={post}
                            isHighlighted={existingPostId === post.id}
                        />
                    ))
                )}
            </ul>
        </div>
    );
}
