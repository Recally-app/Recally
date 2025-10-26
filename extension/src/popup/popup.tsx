import React, { useState, useEffect } from 'react';
import logoSrc from '../assets/icon/recally-logo-primary.svg';
import { StorageManager } from '../storage/storageManager';
// In a real Vite project, you'd import the logo like this:
// import logoSrc from '../assets/icon/recally-logo-primary.svg';

// --- Dummy Data ---
// In a real app, this would come from props or an API.

// To test the empty state, use this instead:
// const dummyPosts = [];
// --------------------

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
    const [posts, setPosts] = useState<any[]>([]);
    const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'success', 'error'

    // This function replaces the `renderPosts` logic
    const fetchPosts = async () => {
        const allPosts = await StorageManager.getAllPosts();
        setPosts(allPosts);
    };

    // This replaces `DOMContentLoaded` and the initial `renderPosts()` call.
    // It runs once when the component first mounts.
    useEffect(() => {
        fetchPosts();
    }, []); // The empty array [] means "run this only once"

    // This replaces your `saveButton.addEventListener('click', ...)`
    const handleSaveClick = async () => {
        setSaveStatus('saving'); // Replaces saveButton.disabled = true and textContent

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.url || !tab?.title) throw new Error('Missing tab info');

            await StorageManager.savePost(tab.url, tab.title);

            setSaveStatus('success'); // Replaces textContent = 'Saved!' and classList.add
            await fetchPosts(); // Re-fetch posts to update the list
        } catch (error) {
            console.error('Save failed:', error);
            setSaveStatus('error'); // Replaces textContent = 'Failed to save' and classList.add
        }

        // Replaces the setTimeout to revert the button
        setTimeout(() => {
            setSaveStatus('idle');
        }, 1500);
    };

    // --- Logic for dynamic button text and styles ---

    const isSaving = saveStatus === 'saving';

    let buttonText = 'Save Current Tab';
    if (saveStatus === 'saving') buttonText = 'Saving...';
    if (saveStatus === 'success') buttonText = 'Saved!';
    if (saveStatus === 'error') buttonText = 'Failed to save';

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
        'disabled:cursor-not-allowed',
        saveStatus === 'error' ? 'bg-red-500' : 'bg-[#26405e]',
        saveStatus === 'success' ? 'animate-ping' : '', // Feedback animation
        isSaving ? 'opacity-70' : 'hover:bg-[#3a6ca1]',
    ].join(' ');

    return (
        <div className="h-[600px] w-[400px] overflow-auto bg-[#d8edfd] font-sans text-[#26405e]">
            <header className="flex items-center justify-between px-[14px] py-[6px]">
                <img src={logoSrc} alt="Recally logo" className="h-[50px] w-[200px]" />
                <button className={buttonClasses} onClick={handleSaveClick} disabled={isSaving}>
                    {buttonText}
                </button>
            </header>

            <h2 className="section-title mx-3 my-2 mb-5 border-b-2 border-[#26405e] pb-1 text-base font-bold">
                SAVED POSTS
            </h2>

            {/* This is the declarative part.
        React will automatically render the correct UI based on the `posts` state.
      */}
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
