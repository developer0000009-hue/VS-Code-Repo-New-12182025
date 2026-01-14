

import React from 'react';
import { Communication } from '../../types';
import { BellIcon } from '../icons/BellIcon';
import { MegaphoneIcon } from '../icons/MegaphoneIcon';

interface NotificationPopoverProps {
    notifications: Communication[];
    isOpen: boolean;
    onClose: () => void;
    onViewAll: () => void;
    isLoading: boolean;
}

const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
};

const NotificationPopover: React.FC<NotificationPopoverProps> = ({ notifications, isOpen, onClose, onViewAll, isLoading }) => {
    if (!isOpen) return null;

    return (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-card rounded-xl shadow-2xl border border-border origin-top-right z-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30 rounded-t-xl">
                <h3 className="font-bold text-sm text-foreground">Notifications</h3>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{notifications.length} New</span>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto">
                {isLoading ? (
                    <div className="p-6 text-center text-muted-foreground text-xs">Loading updates...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                        <BellIcon className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="text-sm text-muted-foreground">No new notifications</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-border/50">
                        {notifications.slice(0, 5).map((note) => (
                            <li key={note.id} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer" onClick={onViewAll}>
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-1">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                            <MegaphoneIcon className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-semibold text-foreground truncate">{note.sender_name || 'School Admin'}</p>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTimeAgo(note.sent_at)}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{note.subject}</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            
            <div className="p-2 border-t border-border bg-muted/30 rounded-b-xl">
                <button 
                    onClick={onViewAll}
                    className="w-full py-2 text-xs font-bold text-center text-primary hover:bg-background rounded-lg transition-colors"
                >
                    View All Messages
                </button>
            </div>
            
            {/* Click outside overlay */}
            <div className="fixed inset-0 z-[-1]" onClick={onClose}></div>
        </div>
    );
};

export default NotificationPopover;