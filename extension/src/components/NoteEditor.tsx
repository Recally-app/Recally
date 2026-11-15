import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface NoteEditorProps {
    title: string;
    url: string;
    value: string;
    onChange: (value: string) => void;
    onSave: (value: string) => Promise<void>;
    onClose: () => void;
}

export default function NoteEditor({
    title,
    url,
    value,
    onChange,
    onSave,
    onClose,
}: NoteEditorProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        const dialog = dialogRef.current;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        dialog?.showModal();
        return () => {
            dialog?.close();
            document.body.style.overflow = previousOverflow;
        };
    }, []);
    const save = async (event: React.FormEvent) => {
        event.preventDefault();
        if (isSaving) return;
        setIsSaving(true);
        setError('');
        try {
            await onSave(value);
            onClose();
        } catch {
            setError('Could not save note. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };
    return createPortal(
        <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            className="m-auto w-[calc(100%_-_32px)] max-w-[340px] max-h-[85vh] rounded-lg border border-white/20 bg-[#1a1a1a] p-4 text-white shadow-xl backdrop:bg-black/60"
            onCancel={(event) => {
                event.preventDefault();
                if (!isSaving) onClose();
            }}
            onClick={(event) => {
                const box = event.currentTarget.getBoundingClientRect();
                if (
                    event.target === event.currentTarget &&
                    !isSaving &&
                    (event.clientX < box.left ||
                        event.clientX > box.right ||
                        event.clientY < box.top ||
                        event.clientY > box.bottom)
                )
                    onClose();
            }}
        >
            <form onSubmit={save} className="flex max-h-[calc(85vh_-_32px)] min-h-0 flex-col gap-3">
                <div className="shrink-0">
                    <h2 id={titleId} className="text-sm font-semibold">
                        Edit note
                    </h2>
                    <p className="truncate text-xs text-white/80">{title}</p>
                    <p className="truncate text-[10px] text-white/60">{url}</p>
                </div>
                <textarea
                    aria-label="Note"
                    autoFocus
                    readOnly={isSaving}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="Type your note here..."
                    className="h-40 max-h-[40vh] min-h-0 w-full resize-none overflow-y-auto overscroll-contain rounded border border-white/20 bg-white/5 p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                {error && (
                    <p role="alert" className="text-xs text-red-300">
                        {error}
                    </p>
                )}
                <div className="flex shrink-0 gap-2">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex-1 rounded bg-[#146FCF] px-4 py-2 text-xs text-white disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                        type="button"
                        disabled={isSaving}
                        onClick={onClose}
                        className="rounded bg-white/10 px-4 py-2 text-xs text-white disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </dialog>,
        document.body
    );
}
