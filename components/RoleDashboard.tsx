
import React from 'react';
import { UserProfile, Role } from '../types';
import ThemeSwitcher from './common/ThemeSwitcher';
import { supabase } from '../services/supabase';
import { ProfileCreationPage } from './ProfileCreationPage';
import { BellIcon } from './icons/BellIcon';
import ProfileDropdown from './common/ProfileDropdown';

interface RoleDashboardProps {
    profile: UserProfile;
    onSignOut: () => void;
    onSelectRole: (role: Role, isExisting?: boolean) => void;
    onProfileUpdate: () => void;
}

const RoleDashboard: React.FC<RoleDashboardProps> = ({ profile, onSignOut, onSelectRole, onProfileUpdate }) => {

    return (
        <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">{profile.role} Dashboard</h1>
                        <p className="text-muted-foreground mt-1">Welcome, {profile.display_name}.</p>
                    </div>
                     <div className="flex items-center gap-2 sm:gap-4">
                        <ThemeSwitcher />
                         <button className="p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
                            <BellIcon className="h-5 w-5" />
                        </button>
                        <ProfileDropdown
                            profile={profile}
                            onSelectRole={onSelectRole}
                            onSignOut={onSignOut}
                        />
                    </div>
                </header>

                <div className="bg-card shadow-lg rounded-xl p-6">
                    <ProfileCreationPage 
                        profile={profile} 
                        role={profile.role!} 
                        onComplete={onProfileUpdate}
                        onBack={() => {
                            // Not applicable for this dashboard as there's no previous step
                        }} 
                        showBackButton={false} 
                    />
                </div>
            </div>
        </div>
    );
};

export default RoleDashboard;
