import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ROLE_ICONS } from '../constants';
import ThemeSwitcher from './common/ThemeSwitcher';
import ConfirmationModal from './common/ConfirmationModal';

interface UserDashboardProps {
    profile: UserProfile;
    onSignOut: () => void;
    onSwitchRole: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ profile, onSignOut, onSwitchRole }) => {
    const Icon = profile.role ? ROLE_ICONS[profile.role] : null;
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative">
            <div className="absolute top-4 right-4">
                <ThemeSwitcher />
            </div>

            <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-2xl text-center">
                
                <div className="mb-6">
                    {Icon && (
                        <div className="w-24 h-24 bg-muted/50 rounded-full mx-auto flex items-center justify-center border-4 border-primary">
                             <Icon className="w-12 h-12 text-primary" />
                        </div>
                    )}
                </div>

                <h1 className="text-3xl font-bold text-card-foreground mb-2">Welcome, {profile.display_name}!</h1>
                <p className="text-muted-foreground mb-4">You are logged in as a</p>
                <p className="bg-primary/20 text-primary font-medium py-2 px-4 rounded-lg inline-block text-lg mb-8">
                    {profile.role}
                </p>
                
                <div className="text-left border-t border-border pt-6 space-y-4">
                     <div>
                        <p className="text-muted-foreground text-sm font-medium">Email</p>
                        <p className="text-card-foreground text-lg">{profile.email}</p>
                     </div>
                     {profile.phone && (
                        <div>
                            <p className="text-muted-foreground text-sm font-medium">Phone</p>
                            <p className="text-card-foreground text-lg">{profile.phone}</p>
                        </div>
                     )}
                </div>
                
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                     <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:ring-ring transition-colors"
                    >
                        Switch Role
                    </button>
                    <button
                        onClick={onSignOut}
                        className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:ring-ring transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
             <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={onSwitchRole}
                title="Confirm Identity Switch"
                message="Are you sure you want to switch your active portal role? Your existing profile data for each role is securely retained and will be available as soon as you switch back."
                confirmText="Yes, Switch Role"
            />
        </div>
    );
};

export default UserDashboard;
