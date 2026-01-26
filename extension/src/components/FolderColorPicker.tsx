import React from 'react';

interface FolderColorPickerProps {
    selectedColor: string;
    onColorSelect: (color: string) => void;
}

// Predefined color palette matching the design
const FOLDER_COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1', // Indigo
    '#14B8A6', // Teal
    '#A855F7', // Violet
];

// Helper function to adjust color brightness
function adjustBrightness(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

export default function FolderColorPicker({ selectedColor, onColorSelect }: FolderColorPickerProps) {
    return (
        <div className="grid grid-cols-6 gap-2 p-2">
            {FOLDER_COLORS.map((color) => {
                const darkerColor = adjustBrightness(color, -30);
                return (
                    <button
                        key={color}
                        type="button"
                        onClick={() => onColorSelect(color)}
                        className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${
                            selectedColor === color
                                ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1a1a]'
                                : 'hover:ring-1 hover:ring-white/50'
                        }`}
                        style={{ 
                            background: `linear-gradient(to bottom, ${color}, ${darkerColor})`
                        }}
                        title={color}
                        aria-label={`Select color ${color}`}
                    />
                );
            })}
        </div>
    );
}

export { FOLDER_COLORS };

