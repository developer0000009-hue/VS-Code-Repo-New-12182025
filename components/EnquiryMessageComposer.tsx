import React, { useState, useRef, useCallback } from 'react';
import { LocalSendIcon } from './icons/LocalSendIcon';

interface EnquiryMessageComposerProps {
    onSendMessage: (message: string) => Promise<void>;
    loading: boolean;
}

const EnquiryMessageComposer: React.FC<EnquiryMessageComposerProps> = ({ onSendMessage, loading }) => {
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmedMessage = message.trim();
        if (!trimmedMessage || loading) return;

        try {
            await onSendMessage(trimmedMessage);
            setMessage('');
            textareaRef.current?.focus();
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    }, [message, loading, onSendMessage]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    const adjustTextareaHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
        adjustTextareaHeight();
    }, [adjustTextareaHeight]);

    return (
        <div className="p-6 md:p-10 lg:p-14 border-t border-white/5 bg-[#0a0a0c]/98 backdrop-blur-3xl shrink-0">
            <form onSubmit={handleSend} className="flex gap-4 md:gap-8 items-end max-w-5xl mx-auto group">
                <div className="flex-grow relative">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="TYPE PAYLOAD..."
                        className="w-full p-4 md:p-8 lg:p-10 rounded-[1.5rem] md:rounded-[3.5rem] bg-white/[0.02] border border-white/10 text-white placeholder:text-white/5 outline-none resize-none font-serif text-lg md:text-xl lg:text-2xl shadow-inner focus:bg-white/[0.04] focus:border-primary/40 transition-all duration-500 custom-scrollbar min-h-[60px] max-h-[200px]"
                        rows={1}
                        disabled={loading}
                        aria-label="Compose message"
                    />
                    <div className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 pointer-events-none hidden sm:block">
                        <span className="text-[9px] font-black text-primary/40 uppercase tracking-[0.4em]">Uplink Terminal</span>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={!message.trim() || loading}
                    className="w-14 h-14 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-primary text-white rounded-2xl md:rounded-[3rem] lg:rounded-[4rem] flex items-center justify-center shadow-[0_32px_64px_-12px_rgba(var(--primary),0.5)] transform active:scale-90 transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-[#0a0a0c]"
                    aria-label="Send message"
                >
                    {loading ? (
                        <div className="w-6 h-6 md:w-10 md:h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
