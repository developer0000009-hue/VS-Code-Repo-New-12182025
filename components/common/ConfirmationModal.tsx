import React, { useEffect } from 'react';
import Spinner from './Spinner';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    loading = false
}) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[100] p-4 animate-in fade-in duration-300"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8 w-full max-w-md m-4 transform animate-in fade-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-destructive/5 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <div className="text-center">
                    <h2 className="text-2xl font-bold text-card-foreground mb-3">{title}</h2>
                    <p className="text-muted-foreground mb-8 leading-relaxed">{message}</p>
                </div>
                
                <div className="flex flex-col-reverse sm:flex-row justify-center gap-4">
                    <button 
                        onClick={onClose} 
                        disabled={loading}
                        className="w-full sm:w-auto h-[48px] px-8 py-3 rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={onConfirm} 
                        disabled={loading}
                        className="w-full sm:w-auto h-[48px] px-8 py-3 rounded-xl text-sm font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-all flex items-center justify-center shadow-lg shadow-destructive/20 disabled:opacity-50 min-w-[120px]"
                    >
                        {loading ? <Spinner size="sm"/> : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;