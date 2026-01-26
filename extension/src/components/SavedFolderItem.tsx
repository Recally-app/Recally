import React, { useState, useEffect } from 'react';
import type { Folder, Post } from '../../../shared';
import { StorageManager } from '../storage/storageManager';
import { adjustBrightness } from '../utils/colorUtils';
import { FolderIcon } from './FolderIcon';
import editIcon from '../assets/icon/edit-icon.svg';
import deleteIcon from '../assets/icon/delete-icon.svg';
import openIcon from '../assets/icon/open-icon.svg';
import addIcon from '../assets/icon/add-icon.svg';
import removeIcon from '../assets/icon/remove-icon.svg';
import Dropdown from './dropdown';

interface SavedFolderItemProps {
    folder: Folder;
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
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);

    useEffect(() => {
        if (isExpanded) {
            setIsLoadingPosts(true);
            StorageManager.getPostsByFolderId(folder.id)
                .then(setPosts)
                .catch((err) => {
                    console.error('Failed to load folder posts:', err);
                    setPosts([]);
                })
                .finally(() => setIsLoadingPosts(false));
        }
    }, [isExpanded, folder.id]);

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <li className="folder-item">
            {/* Unified Folder Container */}
            <div
                className={`relative border-[1px] border-[rgba(255,255,255,.15)] rounded-[10px] text-white transition-all duration-300 ${
                    isExpanded ? 'bg-[rgba(0,0,0,.3)] shadow-lg' : 'bg-[rgba(0,0,0,.3)]'
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
                            <FolderIcon color={folder.color} className="w-6 h-5" />
                        </div>

                        {/* Folder Info */}
                        <div className="flex flex-col overflow-hidden flex-1">
                            <h3 className="m-0 truncate font-semibold leading-tight my-[2px]">
                                {folder.name}
                            </h3>
                            <p className="m-0 text-[9px] opacity-50">
                                {folder.post_ids.length}{' '}
                                {folder.post_ids.length === 1 ? 'TAB' : 'TABS'}
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
                            <img
                                src={addIcon}
                                alt="Add Current Tab"
                                className="w-[14px] h-[14px] opacity-40"
                            />
                        </button>

                        <Dropdown panelClassName="!w-[160px]">
                            <button
                                onClick={onOpenAllTabs}
                                className="block w-full px-4 py-2 text-left text-[14px] flex items-center gap-2 transition-colors hover:bg-white/10"
                                role="menuitem"
                            >
                                <img
                                    src={openIcon}
                                    alt="Open All Tabs"
                                    className="w-[13px] h-[13px] flex-shrink-0"
                                />
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
                                <img
                                    src={removeIcon}
                                    alt="Remove Tabs"
                                    className="w-[13px] h-[13px]"
                                />
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
                                        background: `linear-gradient(to bottom, ${folder.color}, ${adjustBrightness(folder.color, -30)})`,
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
                                background: `linear-gradient(to bottom, ${folder.color}, ${adjustBrightness(folder.color, -30)})`,
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
