import React, { useState, useEffect, useRef } from 'react';
import type { Folder } from '../../../shared';
import FolderColorPicker from './FolderColorPicker';

// Dynamic Folder Icon Component with Gradient
function FolderIconSVG({ color, className = '' }: { color: string; className?: string }) {
    const lighterColor = color;
    const darkerColor = adjustBrightness(color, -30);
    
    return (
        <svg width="21" height="17" viewBox="0 0 21 17" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path 
                fillRule="evenodd" 
                clipRule="evenodd" 
                d="M2.27637 0C1.67263 0 1.09363 0.26722 0.666741 0.742912C0.239822 1.21856 0 1.86372 0 2.53643C0 5.74874 0 11.2513 0 14.4636C0 15.1363 0.239822 15.7814 0.666741 16.2571C1.09363 16.7328 1.67263 17 2.27637 17H18.7236C19.9808 17 21 15.8644 21 14.4636V6.16001C21 4.75919 19.9808 3.62358 18.7236 3.62358C15.8144 3.62358 11.1501 3.62358 11.1501 3.62358L9.02965 0H2.27637Z" 
                fill={`url(#folder-gradient-edit-${color.replace('#', '')})`}
            />
            <defs>
                <linearGradient 
                    id={`folder-gradient-edit-${color.replace('#', '')}`} 
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

function adjustBrightness(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

interface EditFolderModalProps {
    folder: Folder | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, color: string) => Promise<void>;
    existingFolderNames?: string[];
}

export default function EditFolderModal({
    folder,
    isOpen,
    onClose,
    onSave,
    existingFolderNames = [],
}: EditFolderModalProps) {
    const [folderName, setFolderName] = useState('');
    const [selectedColor, setSelectedColor] = useState('#3B82F6');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && folder) {
            setFolderName(folder.name);
            setSelectedColor(folder.color);
            setError('');
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, folder]);

    const handleSave = async () => {
        const trimmedName = folderName.trim();
        
        if (!trimmedName) {
            setError('Folder name cannot be empty');
            return;
        }

        // Check for duplicate names (excluding current folder)
        if (
            folder &&
            trimmedName.toLowerCase() !== folder.name.toLowerCase() &&
            existingFolderNames.some(name => name?.toLowerCase() === trimmedName.toLowerCase())
        ) {
            setError('A folder with this name already exists');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            await onSave(trimmedName, selectedColor);
            onClose();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update folder';
            setError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isSaving) {
            handleSave();
        }
    };

    if (!isOpen || !folder) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[10px] bg-black/20"
            onClick={onClose}
        >
            <div
                className="w-[85%] max-w-md rounded-lg bg-[#1A1A1A] border-[1px] border-[rgba(255,255,255,.15)] p-4 shadow-xl shadow-black/30"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded flex items-center justify-center">
                        <FolderIconSVG color={selectedColor} className="w-6 h-5" />
                    </div>
                    <h2 className="text-white text-lg font-bold m-0">Edit Folder</h2>
                </div>

                {/* Folder Name Input */}
                <div className="mb-4">
                    <label className="block text-[13px] text-[rgba(255,255,255,.5)] mb-2">
                        Folder Name:
                    </label>
                    <input
                        ref={inputRef}
                        type="text"
                        value={folderName}
                        onChange={(e) => {
                            setFolderName(e.target.value);
                            setError('');
                        }}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter folder name..."
                        className="w-full rounded border border-[rgba(255,255,255,.25)] bg-[rgba(255,255,255,.15)] px-3 py-2 text-[rgba(255,255,255,.9)] placeholder:text-[rgba(255,255,255,.5)] focus:outline-none focus:ring-1 focus:ring-[rgba(255,255,255,.25)]"
                    />
                    {error && (
                        <p className="mt-2 text-xs text-red-400">{error}</p>
                    )}
                </div>

                {/* Color Picker */}
                <div className="mb-4">
                    <label className="block text-[13px] text-[rgba(255,255,255,.5)] mb-2">
                        Folder Color:
                    </label>
                    <FolderColorPicker
                        selectedColor={selectedColor}
                        onColorSelect={setSelectedColor}
                    />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="rounded w-full bg-[linear-gradient(to_bottom_right,#146FCF,#0A3869)] px-4 py-2 text-sm text-white 
                        hover:bg-[linear-gradient(to_bottom_right,#146FCF,#146FCF)]"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="rounded px-4 py-2 text-sm text-white bg-[rgba(255,255,255,.1)] hover:bg-[#db2525] hover:text-white disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

