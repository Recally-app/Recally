import { useEffect, useState } from 'react';

type AddResult = 'added' | 'already-added' | 'error';
export function useFolderAddFeedback(onAdd: () => Promise<AddResult>) {
    const [addStatus, setAddStatus] = useState<'idle' | 'adding' | AddResult>('idle');
    useEffect(() => {
        if (addStatus === 'idle' || addStatus === 'adding') return;
        const timer = setTimeout(() => setAddStatus('idle'), 3000);
        return () => clearTimeout(timer);
    }, [addStatus]);
    const addCurrentTab = async () => {
        if (addStatus === 'adding') return;
        setAddStatus('adding');
        try {
            setAddStatus(await onAdd());
        } catch {
            setAddStatus('error');
        }
    };
    return { addStatus, addCurrentTab };
}
