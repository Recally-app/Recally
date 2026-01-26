import React, { useState, useEffect } from 'react';
import type { Post, Folder } from '../../../shared';
import { getHostname } from '../utils/urlUtils';

// Dynamic Folder Icon Component with Gradient
function FolderIconSVG({ color, className = '' }: { color: string; className?: string }) {
    const lighterColor = color;
    const darkerColor = adjustBrightness(color, -30);

    return (
        <svg
            width="21"
            height="17"
            viewBox="0 0 21 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2.27637 0C1.67263 0 1.09363 0.26722 0.666741 0.742912C0.239822 1.21856 0 1.86372 0 2.53643C0 5.74874 0 11.2513 0 14.4636C0 15.1363 0.239822 15.7814 0.666741 16.2571C1.09363 16.7328 1.67263 17 2.27637 17H18.7236C19.9808 17 21 15.8644 21 14.4636V6.16001C21 4.75919 19.9808 3.62358 18.7236 3.62358C15.8144 3.62358 11.1501 3.62358 11.1501 3.62358L9.02965 0H2.27637Z"
                fill={`url(#folder-gradient-manage-${color.replace('#', '')})`}
            />
            <defs>
                <linearGradient
                    id={`folder-gradient-manage-${color.replace('#', '')}`}
                    x1="10.5"
                    y1="0"
                    x2="10.5"
                    y2="17"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor={lighterColor} />
                    <stop offset="1" stopColor={darkerColor} />
                </linearGradient>
            </defs>
        </svg>
    );
}

function adjustBrightness(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

interface ManageTabsModalProps {
    folder: Folder | null;
    allPosts: Post[];
    isOpen: boolean;
    onClose: () => void;
    onSave: (selectedPostIds: string[]) => Promise<void>;
    mode: 'add' | 'remove';
}

export default function ManageTabsModal({
    folder,
    allPosts,
    isOpen,
    onClose,
    onSave,
    mode,
}: ManageTabsModalProps) {
    const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelectedPostIds(new Set());
            setSearchQuery('');
        }
    }, [isOpen]);

    if (!isOpen || !folder) return null;

    // Get posts to display based on mode
    const availablePosts =
        mode === 'add'
            ? allPosts.filter((post) => !folder.post_ids.includes(post.id))
            : allPosts.filter((post) => folder.post_ids.includes(post.id));

    // Filter posts by search query
    const filteredPosts = availablePosts.filter(
        (post) =>
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.url.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleTogglePost = (postId: string) => {
        const newSelected = new Set(selectedPostIds);
        if (newSelected.has(postId)) {
            newSelected.delete(postId);
        } else {
            newSelected.add(postId);
        }
        setSelectedPostIds(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedPostIds.size === filteredPosts.length) {
            setSelectedPostIds(new Set());
        } else {
            setSelectedPostIds(new Set(filteredPosts.map((p) => p.id)));
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(Array.from(selectedPostIds));
            onClose();
        } catch (err) {
            console.error('Failed to update tabs:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const modalTitle = mode === 'add' ? 'Add Tabs to Folder' : 'Remove Tabs from Folder';
    const buttonText =
        mode === 'add'
            ? `Add ${selectedPostIds.size} Tab${selectedPostIds.size !== 1 ? 's' : ''}`
            : `Remove ${selectedPostIds.size} Tab${selectedPostIds.size !== 1 ? 's' : ''}`;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[10px] bg-black/20"
            onClick={onClose}
        >
            <div
                className="w-[85%] max-w-md rounded-lg bg-[#1A1A1A] border-[1px] border-[rgba(255,255,255,.15)] p-4 shadow-xl shadow-black/30 max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded flex items-center justify-center">
                        <FolderIconSVG color={folder.color} className="w-6 h-5" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-white text-lg font-bold m-0">{modalTitle}</h2>
                        <p className="text-[rgba(255,255,255,.5)] text-xs m-0">{folder.name}</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-3">
                    <input
                        type="text"
                        placeholder="Search tabs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded border border-[rgba(255,255,255,.25)] bg-[rgba(255,255,255,.15)] px-3 py-2 text-sm text-[rgba(255,255,255,.9)] placeholder:text-[rgba(255,255,255,.5)] focus:outline-none focus:ring-1 focus:ring-[rgba(255,255,255,.25)]"
                    />
                </div>

                {/* Select All */}
                {filteredPosts.length > 0 && (
                    <div className="mb-2">
                        <button
                            onClick={handleSelectAll}
                            className="text-xs text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
                        >
                            {selectedPostIds.size === filteredPosts.length
                                ? 'Deselect All'
                                : 'Select All'}
                        </button>
                    </div>
                )}

                {/* Posts List */}
                <div className="flex-1 overflow-y-auto mb-4" style={{ maxHeight: '400px' }}>
                    {filteredPosts.length === 0 ? (
                        <div className="text-center text-[rgba(255,255,255,.5)] py-8">
                            {mode === 'add'
                                ? 'No tabs available to add'
                                : 'This folder has no tabs to remove'}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredPosts.map((post) => {
                                const website = getHostname(post.url) || 'unknown';
                                const isSelected = selectedPostIds.has(post.id);

                                return (
                                    <label
                                        key={post.id}
                                        className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                                            isSelected
                                                ? 'bg-[rgba(59,130,246,.2)] border border-[rgba(59,130,246,.5)]'
                                                : 'bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.1)] hover:bg-[rgba(255,255,255,.1)]'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleTogglePost(post.id)}
                                            className="w-4 h-4 rounded accent-[#3B82F6]"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-medium truncate m-0">
                                                {post.title}
                                            </p>
                                            <p className="text-[rgba(255,255,255,.4)] text-xs truncate m-0">
                                                {website}
                                            </p>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || selectedPostIds.size === 0}
                        className={`flex-1 rounded px-4 py-2 text-sm text-white font-semibold transition-colors disabled:opacity-50 ${
                            mode === 'add'
                                ? 'bg-[#26405e] hover:bg-[#3a6ca1]'
                                : 'bg-[#DC2626] hover:bg-[#B91C1C]'
                        }`}
                    >
                        {isSaving ? 'Saving...' : buttonText}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm text-white bg-[rgba(255,255,255,.1)] rounded hover:bg-[rgba(255,255,255,.2)] transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
