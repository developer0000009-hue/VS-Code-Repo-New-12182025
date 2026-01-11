import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, Role, Communication } from '../../types';
import { supabase } from '../../services/supabase';
import ThemeSwitcher from '../common/ThemeSwitcher';
import { BellIcon } from '../icons/BellIcon';
import { SchoolIcon } from '../icons/SchoolIcon';
import ProfileDropdown from '../common/ProfileDropdown';
import NotificationPopover from '../common/NotificationPopover';

interface HeaderProps {
    profile: UserProfile;
    onSelectRole: (role: Role, isExisting?: boolean) => void;
    onSignOut: () => void;
    onProfileClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ profile, onSelectRole, onSignOut, onProfileClick }) => {
    const [notifications, setNotifications] = useState<Communication[]>([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const notifButtonRef = useRef<HTMLButtonElement>(null);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_my_messages');
            
            if (error) {
                console.warn("RPC: get_my_messages protocol fail.", error.message);
                setNotifications([]);
                return;
            }

            if (data && Array.isArray(data)) {
                const mappedData = data.map((item: any) => ({
                    ...item,
                    id: item.message_id || item.id
                }));
                setNotifications(mappedData);
            } else {
                setNotifications([]);
            }
        } catch (err) {
            console.error("Critical identity broadcast failure:", err);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        
        const channel = supabase
            .channel('public:communications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'communications' }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchNotifications]);

    const toggleNotifications = () => {
        setIsNotifOpen(!isNotifOpen);
    };

    return (
        <header className="bg-[#08090a]/90 backdrop-blur-xl border-b border-white/[0.03] h-20 md:h-24 sticky top-0 z-40 transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
                <div className="flex items-center justify-between h-full">
                    <div className="flex items-center flex-shrink-0 cursor-pointer group" onClick={() => window.location.hash = '#/'}>
                        <div className="p-2.5 bg-primary/10 rounded-xl transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-105 border border-primary/20">
                            <SchoolIcon className="h-6 w-6 text-primary" />
                        </div>
                        <span className="font-serif font-black text-2xl ml-4 hidden sm:block tracking-tight text-white uppercase group-hover:text-primary transition-colors">Gurukul</span>
                    </div>
                    
                    <div className="flex items-center gap-4 sm:gap-6 relative">
                        <ThemeSwitcher />
                        
                        <div className="relative">
                            <button 
                                ref={notifButtonRef}
                                onClick={toggleNotifications}
                                className={`p-3 rounded-xl transition-all relative ${isNotifOpen ? 'bg-primary/10 text-primary border border-primary/20' : 'text-white/30 hover:text-white hover:bg-white/5 border border-transparent'}`}
                                aria-label="Notifications"
                            >
                                <BellIcon className="h-5.5 w-5.5" />
                                {notifications.length > 0 && (
                                    <span className="absolute top-2.5 right-2.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#08090a] animate-pulse"></span>
                                )}
                            </button>
                            
                            <NotificationPopover 
                                isOpen={isNotifOpen}
                                onClose={() => setIsNotifOpen(false)}
                                onViewAll={() => setIsNotifOpen(false)}
                                notifications={notifications}
                                isLoading={loading}
                            />
                        </div>
                        
                        <div className="h-10 w-px bg-white/5 mx-1 hidden md:block"></div>
                        
                        <ProfileDropdown
                            profile={profile}
                            onSignOut={onSignOut}
                            onSelectRole={onSelectRole}
                            onProfileClick={onProfileClick}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;