import React from 'react';
import { UserProfile, Role, SchoolBranch } from '../../types';
import ThemeSwitcher from '../common/ThemeSwitcher';
import { SearchIcon } from '../icons/SearchIcon';
import { BellIcon } from '../icons/BellIcon';
import ProfileDropdown from '../common/ProfileDropdown';

interface HeaderProps {
    profile: UserProfile;
    onSelectRole: (role: Role) => void;
    onSignOut: () => void;
    activeComponent: string;
    setActiveComponent: (component: string) => void;
    branches?: SchoolBranch[];
    currentBranchId?: number | null;
    onSwitchBranch?: (id: number) => void;
    schoolName?: string;
    isBranchAdmin?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
    profile, 
    onSelectRole, 
    onSignOut, 
    setActiveComponent,
    branches = [],
    currentBranchId,
    onSwitchBranch,
    isBranchAdmin = false
}) => {
    const currentBranch = branches.find(b => b.id === currentBranchId);
    return (
        <header className="sticky top-0 h-20 bg-card/70 backdrop-blur-xl border-b border-border/50 z-30">
            <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Left: Search & Branch */}
                    <div className="flex items-center gap-4">
                        <div className="hidden xl:flex items-center relative group">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input 
                                type="search" 
                                placeholder="Search anything..." 
                                className="w-80 pl-12 pr-4 py-3 text-sm font-medium rounded-full bg-muted/50 border border-transparent focus:bg-background focus:border-primary/20 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/70"
                            />
                        </div>
                        {branches.length > 0 && onSwitchBranch && (
                            <div className="relative group">
                                {isBranchAdmin ? (
                                     <div className="flex items-center gap-2 pl-3 pr-4 py-2 text-sm font-semibold text-foreground rounded-full bg-muted/50 border border-border">
                                        <span className="font-semibold text-foreground">{currentBranch?.name}</span>
                                        {currentBranch?.is_main_branch && <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded-full font-bold">HO</span>}
                                     </div>
                                ) : (
                                    <>
                                        <select
                                            value={currentBranchId || ''}
                                            onChange={(e) => onSwitchBranch(parseInt(e.target.value))}
                                            className="appearance-none bg-transparent pl-3 pr-8 py-2 text-sm font-semibold text-foreground focus:outline-none cursor-pointer hover:text-primary transition-colors"
                                        >
                                            {branches.map(b => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 9l4 4 4-4" /></svg>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Right: Actions & Profile */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <ThemeSwitcher />
                        
                        <button className="relative p-2.5 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200 group">
                            <BellIcon className="h-5 w-5 group-hover:animate-swing" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-card animate-pulse"></span>
                        </button>
                        
                        <div className="pl-1">
                            <ProfileDropdown
                                profile={profile}
                                onSignOut={onSignOut}
                                onSelectRole={onSelectRole}
                                onProfileClick={() => setActiveComponent('Profile')}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;