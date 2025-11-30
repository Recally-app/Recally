import React, { useState } from 'react';

interface PinnedTabPillProps {
    post: {
        id: string;
        title: string;
        url: string;
        favicon_url?: string;
    };
    onClick: () => void;
    onRemove: () => void;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    isDragging?: boolean;
}

export default function PinnedTabPill({
    post,
    onClick,
    onRemove,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    isDragging = false,
}: PinnedTabPillProps) {
    const [isHovered, setIsHovered] = useState(false);
    const website = new URL(post.url).hostname.replace('www.', '');

    // Get favicon URL
    const faviconUrl = post.favicon_url || `https://icons.duckduckgo.com/ip3/${new URL(post.url).hostname}.ico`;

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`relative flex items-center gap-1.5 px-2 py-1 rounded-full 
                bg-[rgba(255,255,255,.15)] hover:bg-[rgba(255,255,255,.25)] 
                border border-[rgba(255,255,255,.2)] cursor-grab active:cursor-grabbing
                transition-all duration-200 ease-in-out flex-shrink-0 max-w-[80px] h-[20px]
                hover:shadow-md hover:scale-105
                ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}`}
            title={`${post.title} - ${post.url}`}
        >
            {/* Favicon */}
            <img
                src={faviconUrl}
                alt={website}
                className="w-3 h-3 flex-shrink-0 rounded-sm"
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                }}
            />

            {/* Title (clickable) */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
                className="flex-1 text-[10px] text-white truncate text-left font-medium"
            >
                {post.title}
            </button>

            {/* Remove button (visible on hover) - appears on the right */}
            {isHovered && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="flex-shrink-0 ml-auto flex items-center justify-center 
                        transition-opacity duration-150 hover:opacity-70"
                    title="Unpin tab"
                >
                    <svg 
                        className="w-2.5 h-2.5 text-white opacity-80" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={3} 
                            d="M6 18L18 6M6 6l12 12" 
                        />
                    </svg>
                </button>
            )}
        </div>
    );
}

