import React, { useState, useRef } from 'react';
import PinnedTabPill from './PinnedTabPill';
import type { Post } from '../../../shared';

interface PinnedTabsBarProps {
    pinnedTabIds: Post[];
    posts: Post[];
    onUnpin: (postId: string) => void;
    onReorder: (newOrder: Post[]) => void;
    onTabClick: (url: string) => void;
}

export default function PinnedTabsBar({
    pinnedTabIds,
    posts,
    onUnpin,
    onReorder,
    onTabClick,
}: PinnedTabsBarProps) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle wheel event to scroll horizontally
    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (containerRef.current) {
            e.preventDefault();
            containerRef.current.scrollLeft += e.deltaY;
        }
    };

    // Pinned tabs now already contain full Post objects
    const pinnedPosts = pinnedTabIds;

    const handleDragStart = (index: number) => (e: React.DragEvent) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
    };

    const handleDragOver = (index: number) => (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };

    const handleDrop = (dropIndex: number) => (e: React.DragEvent) => {
        e.preventDefault();
        
        if (draggedIndex === null || draggedIndex === dropIndex) {
            return;
        }

        // Create new order
        const newOrder = [...pinnedPosts];
        const [draggedPost] = newOrder.splice(draggedIndex, 1);
        if (draggedPost !== undefined) {
            newOrder.splice(dropIndex, 0, draggedPost);
        }

        // Call onReorder with full Post objects
        onReorder(newOrder);

        // Reset drag state
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    // Empty state
    if (pinnedPosts.length === 0) {
        return (
            <div className="bg-[rgba(0,0,0,.4)] rounded-full p-1 w-full h-[24px] 
                flex items-center justify-center transition-all duration-300">
                <span className="text-[9px] text-white opacity-30 italic animate-pulse">
                    Pin tabs for quick access
                </span>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef}
            onWheel={handleWheel}
            className="bg-[rgba(0,0,0,.01)] rounded-full p-1 w-full h-[24px] 
            flex items-center gap-1.5 overflow-x-auto overflow-y-hidden transition-all duration-300
            scrollbar-hide"
        >
            {pinnedPosts.map((post, index) => (
                <div
                    key={post.id}
                    className={`transition-all duration-200 ${
                        dragOverIndex === index && draggedIndex !== index
                            ? 'scale-110'
                            : 'scale-100'
                    }`}
                >
                    <PinnedTabPill
                        post={post}
                        onClick={() => onTabClick(post.url)}
                        onRemove={() => onUnpin(post.id)}
                        onDragStart={handleDragStart(index)}
                        onDragOver={handleDragOver(index)}
                        onDrop={handleDrop(index)}
                        onDragEnd={handleDragEnd}
                        isDragging={draggedIndex === index}
                    />
                </div>
            ))}
        </div>
    );
}

