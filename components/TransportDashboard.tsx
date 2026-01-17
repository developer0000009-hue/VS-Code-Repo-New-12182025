
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { UserProfile, Role } from '../types';
import Header from './transport/Header';
import { ProfileCreationPage } from './ProfileCreationPage';
import MyRouteTab from './transport_tabs/MyRouteTab';
import NotificationsTab from './transport_tabs/NotificationsTab';

// Icons
import { TransportIcon } from './icons/TransportIcon';
import { CommunicationIcon } from './icons/CommunicationIcon';

interface TransportDashboardProps {
    profile: UserProfile;
    onSignOut: () => void;
    onSwitchRole: () => void;
    onSelectRole?: (role: Role, isExisting?: boolean) => void;
}

const navItems = [
    { id: 'My Route', label: 'My Route', icon: <TransportIcon className="w-5 h-5" /> },
    { id: 'Notifications', label: 'Notifications', icon: <CommunicationIcon className="w-5 h-5" /> },
];

const TransportDashboard: React.FC<TransportDashboardProps> = ({ profile, onSignOut, onSwitchRole, onSelectRole }) => {
    const [activeComponent, setActiveComponent] = useState('My Route');

    const handleProfileUpdate = () => {
        // For simplicity, we can just reload the page to get the new route info
        window.location.reload();
    };

    const components: { [key: string]: React.ReactNode } = {
        'My Route': <MyRouteTab />,
        'Notifications': <NotificationsTab />,
        'My Profile': <ProfileCreationPage 
                            profile={profile} 
                            role={profile.role!} 
                            onComplete={handleProfileUpdate}
                            onBack={() => {}} 
                            showBackButton={false} 
                        />,
    };

    const renderComponent = () => {
        return components[activeComponent] || <MyRouteTab />;
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header 
                profile={profile}
                onSwitchRole={onSwitchRole}
                onSignOut={onSignOut}
                onProfileClick={() => setActiveComponent('My Profile')}
                onSelectRole={onSelectRole}
            />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeComponent !== 'My Profile' && (
                     <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
                        <nav className="flex space-x-1 bg-muted p-1 rounded-xl border border-border min-w-max" aria-label="Tabs">
                            {navItems.map(item => {
                                const isActive = activeComponent === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveComponent(item.id)}
                                        className={`
                                            flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ease-in-out
                                            ${isActive 
                                                ? 'bg-card text-primary shadow-sm' 
                                                : 'text-muted-foreground hover:text-foreground'
                                            }
                                        `}
                                        aria-current={isActive ? 'page' : undefined}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                )}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                    {renderComponent()}
                </div>
            </main>
        </div>
    );
};

export default TransportDashboard;
