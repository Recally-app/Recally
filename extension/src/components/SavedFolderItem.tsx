import React, { useState } from 'react';
import type { Folder, Post } from '../../../shared';
import editIcon from '../assets/icon/edit-icon.svg';
import deleteIcon from '../assets/icon/delete-icon.svg';
import openIcon from '../assets/icon/open-icon.svg';
import addIcon from '../assets/icon/add-icon.svg';
import removeIcon from '../assets/icon/remove-icon.svg';
import Dropdown from './dropdown';

// Dynamic Folder Icon Component with Gradient
function FolderIconSVG({ color, className = '' }: { color: string; className?: string }) {
    // Create a lighter shade for the gradient top
    const lighterColor = color;
    // Create a darker shade for the gradient bottom
    const darkerColor = adjustBrightness(color, -30);
    
    return (
        <svg width="21" height="17" viewBox="0 0 21 17" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path 
                fillRule="evenodd" 
                clipRule="evenodd" 
                d="M2.27637 0C1.67263 0 1.09363 0.26722 0.666741 0.742912C0.239822 1.21856 0 1.86372 0 2.53643C0 5.74874 0 11.2513 0 14.4636C0 15.1363 0.239822 15.7814 0.666741 16.2571C1.09363 16.7328 1.67263 17 2.27637 17H18.7236C19.9808 17 21 15.8644 21 14.4636V6.16001C21 4.75919 19.9808 3.62358 18.7236 3.62358C15.8144 3.62358 11.1501 3.62358 11.1501 3.62358L9.02965 0H2.27637Z" 
                fill={`url(#folder-gradient-${color.replace('#', '')})`}
            />
            <defs>
                <linearGradient 
                    id={`folder-gradient-${color.replace('#', '')}`} 
                    x1="10.5" 
                    y1="0" 
                    x2="10.5" 
                    y2="17" 
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor={lighterColor}/>
                    <stop offset="1" stopColor={darkerColor}/>
                </linearGradient>
            </defs>
        </svg>
    );
}

// Helper function to adjust color brightness
function adjustBrightness(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

interface SavedFolderItemProps {
    folder: Folder;
    posts: Post[];
    onDelete: () => void;
    onEdit: () => void;
    onOpenAllTabs: () => void;
    onAddTab: () => void;
    onAddCurrentTab: () => void;
    onRemoveTab: () => void;
    onChangeColor: () => void;
    onPostClick: (url: string) => void;
    renderPostItem: (post: Post) => React.ReactNode;
}

function SavedFolderItem({
    folder,
    posts,
    onDelete,
    onEdit,
    onOpenAllTabs,
    onAddTab,
    onAddCurrentTab,
    onRemoveTab,
    onChangeColor,
    renderPostItem,
}: SavedFolderItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <li className="folder-item">
            {/* Unified Folder Container */}
            <div
                className={`relative border-[1px] border-[rgba(255,255,255,.15)] rounded-[10px] text-white transition-all duration-300 ${
                    isExpanded
                        ? 'bg-[rgba(0,0,0,.3)] shadow-lg'
                        : 'bg-[rgba(0,0,0,.3)]'
                }`}
            >
                {/* Folder Header */}
                <div
                    className={`relative flex items-center justify-between gap-3 p-3 cursor-pointer hover:bg-[rgba(255,255,255,.1)] transition-colors ${
                        isExpanded ? 'rounded-t-[10px]' : 'rounded-[10px]'
                    }`}
                >
                    {/* Left Side: Expand/Collapse + Folder Info */}
                    <div
                        className="flex items-center gap-3 flex-1 overflow-hidden"
                        onClick={toggleExpanded}
                    >
                        {/* Expand/Collapse Icon */}
                        <button
                            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-all"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded();
                            }}
                        >
                            <svg
                                className={`w-4 h-4 text-white transition-transform ${
                                    isExpanded ? 'rotate-90' : ''
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </button>

                        {/* Folder Icon with Gradient */}
                        <div className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center">
                            <FolderIconSVG color={folder.color} className="w-6 h-5" />
                        </div>

                        {/* Folder Info */}
                        <div className="flex flex-col overflow-hidden flex-1">
                            <h3 className="m-0 truncate font-semibold leading-tight my-[2px]">
                                {folder.name}
                            </h3>
                            <p className="m-0 text-[9px] opacity-50">
                                {posts.length} {posts.length === 1 ? 'TAB' : 'TABS'}
                            </p>
                        </div>
                    </div>

                {/* Right Side: Add Current Tab Button + Dropdown Menu */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Add Current Tab Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddCurrentTab();
                        }}
                        className="p-2 rounded-lg transition-all hover:bg-white/10 flex-shrink-0"
                        title="Add current tab to folder"
                    >
                        <img src={addIcon} alt="Add Current Tab" className="w-[14px] h-[14px] opacity-40" />
                    </button>

                    <Dropdown panelClassName="!w-[160px]">
                        <button
                            onClick={onOpenAllTabs}
                            className="block w-full px-4 py-2 text-left text-[14px] flex items-center gap-2 transition-colors hover:bg-white/10"
                            role="menuitem"
                        >
                            <img src={openIcon} alt="Open All Tabs" className="w-[13px] h-[13px] flex-shrink-0" />
                            Open All Tabs
                        </button>

                        <button
                            onClick={onAddTab}
                            className="block w-full px-4 py-2 text-left text-[14px] flex items-center gap-2 transition-colors hover:bg-white/10"
                            role="menuitem"
                        >
                            <img src={addIcon} alt="Add Tab" className="w-[13px] h-[13px]" />
                            Add Tab
                            
                        </button>

                        <button
                            onClick={onRemoveTab}
                            className="block w-full px-4 py-2 text-left text-[14px] flex items-center gap-2 text-[#DB2525] transition-colors hover:bg-white/10"
                            role="menuitem"
                        >
                            <img src={removeIcon} alt="Remove Tabs" className="w-[13px] h-[13px]" />
                            Remove Tabs
                        </button>

                        <button
                            onClick={onChangeColor}
                            className="block w-full px-4 py-2 text-left text-[14px] flex items-center gap-2 transition-colors hover:bg-white/10"
                            role="menuitem"
                        >
                            <div 
                                className="w-[13px] h-[13px] rounded-full flex-shrink-0"
                                style={{
                                    background: `linear-gradient(to bottom, ${folder.color}, ${adjustBrightness(folder.color, -30)})`
                                }}
                            />
                            Color
                        </button>

                        <hr className="my-0 mx-4 border-[1.2px] rounded-full border-[rgba(255,255,255,.1)] flex-shrink-0" />

                        <button
                            onClick={onEdit}
                            className="block w-full px-4 py-2 text-left text-[14px] flex items-center gap-2 transition-colors hover:bg-white/10"
                            role="menuitem"
                        >
                            <img src={editIcon} alt="Edit" className="w-[13px] h-[13px]" />
                            Edit Folder
                        </button>

                        <button
                            onClick={onDelete}
                            className="block w-full px-4 py-2 text-left text-[14px] flex items-center gap-2 text-[#DB2525] transition-colors hover:bg-white/10"
                            role="menuitem"
                        >
                            <img src={deleteIcon} alt="Delete" className="w-[13px] h-[13px]" />
                            Delete Folder
                        </button>
                        </Dropdown>
                    </div>
                </div>

                {/* Folder Contents - Expanded View */}
                {isExpanded && (
                    <div className="folder-contents pr-3 py-2 pb-3 relative bg-[rgba(0,0,0,0)]">
                        {/* Vertical Thread Line - Aligned with folder icon */}
                        <div 
                            className="absolute left-[24px] top-0 bottom-2 w-[2px] rounded-full opacity-70"
                            style={{ 
                                background: `linear-gradient(to bottom, ${folder.color}, ${adjustBrightness(folder.color, -30)})`
                            }}
                        />
                        
                        <div className="pl-12">
                            {posts.length === 0 ? (
                                <div className="text-center text-white/50 text-sm py-4">
                                    <p>This folder is empty</p>
                                    <button
                                        onClick={onAddTab}
                                        className="mt-2 px-3 py-1 bg-[#26405e] text-white text-xs rounded hover:bg-[#3a6ca1] transition-colors"
                                    >
                                        Add Tab
                                    </button>
                                </div>
                            ) : (
                                <ul className="m-0 list-none flex flex-col gap-1">
                                    {posts.map((post) => (
                                        <React.Fragment key={post.id}>
                                            {renderPostItem(post)}
                                        </React.Fragment>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </li>
    );
}

export default SavedFolderItem;

