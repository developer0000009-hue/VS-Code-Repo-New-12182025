
import React from 'react';
import { UserProfile, Role } from '../../types';
import ThemeSwitcher from '../common/ThemeSwitcher';
import { BellIcon } from '../icons/BellIcon';
import { SchoolIcon } from '../icons/SchoolIcon';
import ProfileDropdown from '../common/ProfileDropdown';

interface HeaderProps {
    profile: UserProfile;
    onSwitchRole: () => void;
    onSignOut: () => void;
    onProfileClick: () => void;
    onSelectRole?: (role: Role, isExisting?: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ profile, onSwitchRole, onSignOut, onProfileClick, onSelectRole }) => {
    return (
        <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center flex-shrink-0">
                        <SchoolIcon className="h-8 w-8 text-primary" />
                        <span className="font-bold text-lg ml-3 hidden sm:block">Transport Portal</span>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4">
                        <ThemeSwitcher />
                        <button className="p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
                            <BellIcon className="h-5 w-5" />
                        </button>
                        
                        <ProfileDropdown
                            profile={profile}
                            onSignOut={onSignOut}
                            onProfileClick={onProfileClick}
                            onSelectRole={onSelectRole}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
