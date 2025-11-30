import React from 'react';

export type ConfirmModalType = 'info' | 'warning' | 'success' | 'error' | 'question';

interface ConfirmModalProps {
    isOpen: boolean;
    type?: ConfirmModalType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    denyText?: string;
    showCancel?: boolean;
    showDeny?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
    onDeny?: () => void;
    autoCloseDelay?: number; // Auto-close after X milliseconds (for success messages)
}

const typeIcons: Record<ConfirmModalType, string> = {
    info: '💡',
    warning: '⚠️',
    success: '✓',
    error: '✕',
    question: '?',
};

const typeColors: Record<ConfirmModalType, { bg: string; text: string; icon: string }> = {
    info: { 
        bg: 'bg-[#146FCF]', 
        text: 'text-[#146FCF]',
        icon: 'bg-[#146FCF]'
    },
    warning: { 
        bg: 'bg-[#F59E0B]', 
        text: 'text-[#F59E0B]',
        icon: 'bg-[#F59E0B]'
    },
    success: { 
        bg: 'bg-[#10B981]', 
        text: 'text-[#10B981]',
        icon: 'bg-[#10B981]'
    },
    error: { 
        bg: 'bg-[#DB2525]', 
        text: 'text-[#DB2525]',
        icon: 'bg-[#DB2525]'
    },
    question: { 
        bg: 'bg-[#146FCF]', 
        text: 'text-[#146FCF]',
        icon: 'bg-[#146FCF]'
    },
};

export default function ConfirmModal({
    isOpen,
    type = 'info',
    title,
    message,
    confirmText = 'OK',
    cancelText = 'Cancel',
    denyText = 'Delete',
    showCancel = false,
    showDeny = false,
    onConfirm,
    onCancel,
    onDeny,
    autoCloseDelay,
}: ConfirmModalProps) {
    const colors = typeColors[type];

    React.useEffect(() => {
        if (isOpen && autoCloseDelay) {
            const timer = setTimeout(() => {
                onConfirm();
            }, autoCloseDelay);

            return () => clearTimeout(timer);
        }
    }, [isOpen, autoCloseDelay, onConfirm]);

    if (!isOpen) return null;

    const handleBackdropClick = () => {
        if (onCancel) {
            onCancel();
        } else {
            onConfirm();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[10px] bg-black/30"
            onClick={handleBackdropClick}
        >
            <div
                className="w-[85%] max-w-md rounded-lg bg-[#1A1A1A] border-[1px] border-[rgba(255,255,255,.15)] p-5 shadow-xl shadow-black/30"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon and Title */}
                <div className="flex flex-col items-center text-center mb-4">
                    <div className={`w-14 h-14 rounded-full ${colors.icon} flex items-center justify-center mb-3 text-white text-2xl font-bold`}>
                        {typeIcons[type]}
                    </div>
                    <h2 className="text-white text-xl font-bold m-0">{title}</h2>
                </div>

                {/* Message */}
                <div className="mb-6">
                    <p className="text-[rgba(255,255,255,.7)] text-[14px] text-center leading-relaxed m-0">
                        {message}
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-2">
                    {showDeny && onDeny && (
                        <button
                            onClick={onDeny}
                            className="rounded w-full bg-[#DB2525] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#B91C1C] transition-colors"
                        >
                            {denyText}
                        </button>
                    )}
                    
                    <button
                        onClick={onConfirm}
                        className={`rounded w-full ${colors.bg} px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity`}
                    >
                        {confirmText}
                    </button>

                    {showCancel && onCancel && (
                        <button
                            onClick={onCancel}
                            className="rounded w-full bg-[rgba(255,255,255,.1)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[rgba(255,255,255,.15)] transition-colors"
                        >
                            {cancelText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

