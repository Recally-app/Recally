import React, { useState, useEffect } from 'react';
import dotsHorizontalIcon from '../assets/icon/3-dots-horizontal.svg';
import editIcon from '../assets/icon/edit-icon.svg';
import deleteIcon from '../assets/icon/delete-icon.svg';
import pinIcon from '../assets/icon/pin-icon.svg';
import noteIcon from '../assets/icon/note-icon.svg';
import Dropdown from './dropdown';

interface CompactPostItemProps {
    post: any;
    onDelete: () => void;
    onClick: () => void;
    onAddTags?: () => void;
    onSaveNote?: (note: string) => Promise<void>;
    onPinToggle?: () => void;
    isPinned?: boolean;
}

function CompactPostItem({ 
    post, 
    onDelete, 
    onClick, 
    onAddTags, 
    onSaveNote, 
    onPinToggle, 
    isPinned = false 
}: CompactPostItemProps) {
    const website = new URL(post.url).hostname.replace('www.', '');
    
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [noteValue, setNoteValue] = useState(post.notes || '');
    const [isSaving, setIsSaving] = useState(false);

    // Sync noteValue when post.notes changes
    useEffect(() => {
        setNoteValue(post.notes || '');
    }, [post.notes]);
    
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
            return '';
        }
    }

    const [faviconUrl, setFaviconUrl] = useState<string>('');

    useEffect(() => {
        let objectUrl: string | null = null;

        (async () => {
            const resolved = await getFaviconUrl();
            setFaviconUrl(resolved);

            if (resolved.startsWith('blob:')) {
                objectUrl = resolved;
            }
        })();

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
                objectUrl = null;
            }
        };
    }, [post.url, post.favicon_url]);

    return (
        <li
            className="relative flex items-center justify-between gap-2 border-[1px] border-[rgba(255,255,255,.1)] rounded-md px-2 py-1.5 text-white transition-all cursor-pointer hover:bg-[rgba(255,255,255,.15)] bg-[rgba(0,0,0,.2)]"
            data-post-id={post.id}
        >
            {/* Pinned Badge */}
            {isPinned && (
                <div className="absolute top-1 right-1 flex items-center justify-center">
                    <img 
                        src={pinIcon} 
                        alt="Pinned" 
                        className="w-2.5 h-2.5 opacity-60"
                        title="This tab is pinned"
                    />
                </div>
            )}

            {/* Left Side: Favicon + Title */}
            <div
                className="flex items-center gap-2 overflow-hidden flex-1 min-w-0"
                onClick={onClick}
                title={`${post.title}\n${post.url}`}
            >
                {/* Favicon */}
                <div className="h-5 w-5 flex-shrink-0 rounded flex items-center justify-center overflow-hidden">
                    {faviconUrl ? (
                        <img
                            src={faviconUrl}
                            alt={`${website} favicon`}
                            className="w-full h-full object-contain"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                    ) : (
                        <div className="w-full h-full rounded bg-[rgba(255,255,255,.1)]" />
                    )}
                </div>

                {/* Title - Single Line */}
                <h3 className="m-0 truncate text-[11px] font-regular leading-tight flex-1 min-w-0">
                    {post.title}
                </h3>
            </div>

            {/* Right Side: Note Button + Dropdown Menu */}
            <div className="flex items-center gap-1 flex-shrink-0">
                {/* Note Button */}
                {onSaveNote && (
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditingNote(true);
                                setNoteValue(post.notes || '');
                            }}
                            className={`relative group p-1 rounded transition-all hover:bg-white/10 flex-shrink-0 ${
                                post.notes ? 'bg-white/0' : ''
                            } ${isEditingNote ? 'bg-white/10' : ''}`}
                        >
                            <img src={noteIcon} alt="Note" className="w-[14px] h-[14px] flex-shrink-0" />
                            {/* Badge indicator when note exists */}
                            {post.notes && (
                                <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                            )}
                            {/* Note Preview Tooltip (only show when NOT editing) */}
                            {!isEditingNote && (
                                <div className="absolute top-full right-0 mt-2 w-[280px] p-2 bg-[#1a1a1a] border border-[rgba(255,255,255,.15)] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <img src={noteIcon} alt="Note" className="w-6 h-6" />
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className="text-[12px] font-semibold text-white m-0 truncate">{website}</p>
                                            <p className="text-[8px] text-[rgba(255,255,255,.2)] m-0 mr-20 truncate">{post.url}</p>
                                        </div>
                                    </div>
                                    <hr className="mt-0 mb-2 mx-1 border-[1.2px] rounded-full border-[rgba(255,255,255,.1)] flex-shrink-0" />
                                    {post.notes ? (
                                        <div className="text-[12px] text-white/90 whitespace-pre-wrap break-words max-h-[200px] overflow-y-auto text-left px-2">
                                            {post.notes}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic m-0">Click to add a note</p>
                                    )}
                                </div>
                            )}
                        </button>
                        
                        {/* Note Editor Popup */}
                        {isEditingNote && (
                            <>
                                {/* Backdrop to close on click outside */}
                                <div 
                                    className="fixed inset-0 z-40 bg-black/50" 
                                    onClick={() => setIsEditingNote(false)}
                                />
                                <div 
                                    className="absolute top-full right-0 mt-2 p-2 bg-[#1a1a1a] border border-[rgba(255,255,255,.15)] rounded-lg shadow-xl z-50 w-[280px]"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <img src={noteIcon} alt="Note" className="w-6 h-6" />
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className="text-[12px] font-semibold text-white m-0 truncate">{website}</p>
                                            <p className="text-[8px] text-[rgba(255,255,255,.2)] m-0 mr-20 truncate">{post.url}</p>
                                        </div>
                                    </div>
                                    <hr className="mt-0 mb-3 mx-1 border-[1.2px] rounded-full border-[rgba(255,255,255,.1)] flex-shrink-0" />
                                    <textarea
                                        value={noteValue}
                                        onChange={(e) => setNoteValue(e.target.value)}
                                        placeholder="Type your note here..."
                                        className="w-full min-h-[120px] p-2 bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.1)] rounded text-white text-xs resize-none focus:outline-none focus:border-[rgba(255,255,255,.3)]"
                                        autoFocus
                                    />
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={async () => {
                                                setIsSaving(true);
                                                await onSaveNote(noteValue);
                                                setIsSaving(false);
                                                setIsEditingNote(false);
                                            }}
                                            disabled={isSaving}
                                            className="rounded w-full bg-[linear-gradient(to_bottom_right,#146FCF,#0A3869)] px-4 py-2 text-xs text-white 
                                            hover:bg-[linear-gradient(to_bottom_right,#146FCF,#146FCF)] transition-colors disabled:opacity-50"
                                        >
                                            {isSaving ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            onClick={() => setIsEditingNote(false)}
                                            disabled={isSaving}
                                            className="px-3 py-2 bg-[rgba(255,255,255,.1)] text-white text-xs font-semibold rounded hover:bg-[#db2525] transition-colors disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Dropdown Menu */}
                <Dropdown panelClassName="!w-[130px]"> 
                    {onAddTags && (
                        <button
                            onClick={onAddTags}
                            className="block w-full px-4 py-2 text-left text-[14px] flex items-center gap-2 transition-colors hover:bg-white/10"
                            role="menuitem"
                        >
                            <img src={editIcon} alt="Edit" className="w-[13px] h-[13px]" />
                            Edit tab
                        </button>
                    )}

                    {onPinToggle && (
                        <button
                            onClick={onPinToggle}
                            className="block w-full px-4 py-2 text-left text-[14px] flex items-center gap-2 transition-colors hover:bg-white/10"
                            role="menuitem"
                        >
                            <img src={pinIcon} alt="Pin" className="w-[13px] h-[13px]" />
                            {isPinned ? 'Unpin Tab' : 'Pin Tab'}
                        </button>
                    )}
                    
                    {(onAddTags || onPinToggle) && (
                        <hr className="my-0 mx-4 border-[1.2px] rounded-full border-[rgba(255,255,255,.1)] flex-shrink-0" />
                    )}
                    
                    <button
                        onClick={onDelete}
                        className="block w-full px-4 py-2 text-left text-[14px] flex items-center gap-2 text-[#DB2525] transition-colors hover:bg-white/10"
                        role="menuitem"
                    >
                        <img src={deleteIcon} alt="Delete" className="w-[13px] h-[13px]" />
                        Remove
                    </button>
                </Dropdown>
            </div>
        </li>
    );
}

export default CompactPostItem;

