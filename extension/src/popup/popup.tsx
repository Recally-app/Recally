import React, { useState, useEffect } from 'react';
import logoSrc from '../assets/icon/recally-logo-primary.svg';
import { StorageManager } from '../storage/storageManager';

/**
 * A single saved post item.
 */
function SavedPostItem({ post }: { post: any }) {
    const website = new URL(post.url).hostname.replace('www.', '');
    // Format tags
    const tagsText = post.tags?.length ? `Tags: ${post.tags.join(', ')}` : '';

    return (
        <li className="flex items-center gap-3 rounded-[18px] bg-[#26405e] p-3 text-white">
            {/* Post Thumbnail */}
            <div className="h-8 w-8 flex-shrink-0 rounded bg-[#a5b9ce]"></div>

            {/* Post Info */}
            <div className="flex flex-col overflow-hidden">
                <p className="m-0 truncate text-xs opacity-80">{website}</p>
                <h3 className="m-0 truncate font-semibold leading-tight my-[2px]">{post.title}</h3>
                {tagsText && <p className="m-0 truncate text-xs opacity-90">{tagsText}</p>}
            </div>
        </li>
    );
}

/**
 * Message shown when there are no saved posts.
 */
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
        Error = 'error',
    }

    const [posts, setPosts] = useState<any[]>([]);
    const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'success', 'error'

    const buttonTextMap: Record<SaveStatus, string> = {
        [SaveStatus.Idle]: 'Save Current Tab',
        [SaveStatus.Saving]: 'Saving...',
        [SaveStatus.Success]: 'Saved!',
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
        setSaveStatus('saving');
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.url || !tab?.title) {
            console.error('Save failed: could not retrieve tab url or title');
            setSaveStatus('error');
        } else {
            await StorageManager.savePost(tab.url, tab.title);
            setSaveStatus('success');
        }

        await fetchPosts();
        setTimeout(() => {
            setSaveStatus('idle');
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
        saveStatus === 'error' ? 'bg-red-500' : 'bg-[#26405e]',
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
                        // Using post.url as a key. If you have a unique ID, use that.
                        <SavedPostItem key={post.url} post={post} />
                    ))
                )}
            </ul>
        </div>
    );
}
