import React, { useState } from 'react';
import logoSrc from '../assets/icon/recally-logo-primary.svg';
// In a real Vite project, you'd import the logo like this:
// import logoSrc from '../assets/icon/recally-logo-primary.svg';

// --- Dummy Data ---
// In a real app, this would come from props or an API.
const dummyPosts = [
  {
    id: 1,
    website: 'reddit.com',
    title: 'A fascinating discussion on r/reactjs',
    tags: '#react, #javascript',
  },
  {
    id: 2,
    website: 'stackoverflow.com',
    title: 'How to fix "An import path can only end with a .tsx..."',
    tags: '#typescript, #error',
  },
];
// To test the empty state, use this instead:
// const dummyPosts = [];
// --------------------

/**
 * A single saved post item.
 */
function SavedPostItem({ post }: { post: any }) {
  return (
    <li
      className="flex items-center gap-3 rounded-[18px] bg-[#26405e] p-3 text-white"
    >
      {/* Post Thumbnail */}
      <div className="h-8 w-8 flex-shrink-0 rounded bg-[#a5b9ce]"></div>

      {/* Post Info */}
      <div className="flex flex-col overflow-hidden">
        <p className="m-0 truncate text-xs opacity-80">{post.website}</p>
        <h3 className="m-0 truncate font-semibold leading-tight my-[2px]">{post.title}</h3>
        <p className="m-0 truncate text-xs opacity-90">{post.tags}</p>
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

/**
 * The main popup component.
 */
export default function PopupApp() {
  // 'idle', 'success', 'error'
  const [saveState, setSaveState] = useState('idle');
  const [posts, setPosts] = useState(dummyPosts);

  const handleSaveClick = () => {
    // 1. Set state to loading (optional)
    setSaveState('loading');

    // 2. Simulate saving
    // In a real app, you'd send a message to your content/background script
    try {
      // --- Simulate success ---
      // Your save logic here...
      console.log('Saving tab...');
      
      // On success:
      setSaveState('success');

      // --- Simulate error ---
      // throw new Error("Failed to save");

    } catch (error) {
      // On error:
      setSaveState('error');
    }

    // 3. Reset button state after a moment
    setTimeout(() => {
      setSaveState('idle');
    }, 1500); // Reset after 1.5 seconds
  };

  // Dynamically set button classes based on state
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
    saveState === 'error' ? 'bg-red-500' : 'bg-[#26405e]', // Error state
    saveState === 'success' ? 'animate-ping' : '', // Simple pulse effect
    saveState === 'loading' ? 'opacity-70' : 'hover:bg-[#3a6ca1]',
  ].join(' ');
  
  // Note: The original 'pulse' animation was a quick "throb". 
  // Tailwind's 'animate-pulse' is a skeleton loading shimmer.
  // I've used 'animate-ping' for a simple "success" feedback.
  // For the exact throb, you'd need to add custom keyframes to tailwind.config.js.

  return (
    <div className="h-[600px] w-[400px] overflow-auto bg-[#d8edfd] font-sans text-[#26405e]">
      <header className="flex items-center justify-between px-[14px] py-[6px]">
        <img
          // Use the imported logoSrc here
          src={logoSrc}
          alt="Recally logo"
          className="h-[50px] w-[200px]"
        />
        <button
          className={buttonClasses}
          onClick={handleSaveClick}
          disabled={saveState === 'loading'}
        >
          {saveState === 'success' ? 'Saved!' : 'Save Current Tab'}
        </button>
      </header>

      <h2 className="section-title mx-3 my-2 mb-5 border-b-2 border-[#26405e] pb-1 text-base font-bold">
        SAVED POSTS
      </h2>

      {/* Conditionally render list or empty state */}
      {posts.length > 0 ? (
        <ul className="m-0 list-none flex flex-col gap-3 px-3">
          {posts.map((post) => (
            <SavedPostItem key={post.id} post={post} />
          ))}
        </ul>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}