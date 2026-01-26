import React, { useState, useEffect, useRef } from 'react';
import { FolderIcon } from './FolderIcon';
import FolderColorPicker, { FOLDER_COLORS } from './FolderColorPicker';

interface CreateFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, color: string, addAllOpenTabs?: boolean) => Promise<void>;
    existingFolderNames?: string[];
}

export default function CreateFolderModal({
    isOpen,
    onClose,
    onSave,
    existingFolderNames = [],
}: CreateFolderModalProps) {
    const [folderName, setFolderName] = useState('');
    const [selectedColor, setSelectedColor] = useState<string>(FOLDER_COLORS[0] ?? '#3B82F6');
    const [addAllOpenTabs, setAddAllOpenTabs] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setFolderName('');
            setSelectedColor(FOLDER_COLORS[0] ?? '#3B82F6');
            setAddAllOpenTabs(false);
            setError('');
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    const handleSave = async () => {
        const trimmedName = folderName.trim();
        
        if (!trimmedName) {
            setError('Folder name cannot be empty');
            return;
        }

        // Check for duplicate names
        if (existingFolderNames.some(name => name?.toLowerCase() === trimmedName.toLowerCase())) {
            setError('A folder with this name already exists');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            await onSave(trimmedName, selectedColor, addAllOpenTabs);
            onClose();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create folder';
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

    if (!isOpen) return null;

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
                        <FolderIcon color={selectedColor} className="w-6 h-5" />
                    </div>
                    <h2 className="text-white text-lg font-bold m-0">Create New Folder</h2>
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

                {/* Add All Open Tabs Option */}
                <div className="mb-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={addAllOpenTabs}
                            onChange={(e) => setAddAllOpenTabs(e.target.checked)}
                            className="w-4 h-4 rounded border-[rgba(255,255,255,.25)] bg-[rgba(255,255,255,.15)] text-[#146FCF] focus:ring-1 focus:ring-[rgba(255,255,255,.25)] cursor-pointer"
                        />
                        <span className="text-[13px] text-[rgba(255,255,255,.7)] group-hover:text-[rgba(255,255,255,.9)] transition-colors">
                            Add all currently open tabs to this folder
                        </span>
                    </label>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="rounded w-full bg-[linear-gradient(to_bottom_right,#146FCF,#0A3869)] px-4 py-2 text-sm text-white 
                        hover:bg-[linear-gradient(to_bottom_right,#146FCF,#146FCF)]"
                    >
                        {isSaving ? 'Creating...' : 'Create Folder'}
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

