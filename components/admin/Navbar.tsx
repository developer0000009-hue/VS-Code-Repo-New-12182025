import React, { useState } from 'react';
import { MenuIcon } from '../icons/MenuIcon';
import { XIcon } from '../icons/XIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { BellIcon } from '../icons/BellIcon';
import { SchoolIcon } from '../icons/SchoolIcon';
import { LocationIcon } from '../icons/LocationIcon';
import ThemeSwitcher from '../common/ThemeSwitcher';
import ProfileDropdown from '../common/ProfileDropdown';
import { UserProfile, Role, SchoolBranch } from '../../types';
import { MenuGroup } from './AdminMenuConfig';

interface NavbarProps {
    activeComponent: string;
    setActiveComponent: (component: string) => void;
    isBranchAdmin: boolean;
    isHeadOfficeAdmin: boolean;
    profile: UserProfile;
    onSelectRole: (role: Role, isExisting?: boolean) => void;
    onSignOut: () => void;
    branches: SchoolBranch[];
    currentBranchId: number | null;
    onSwitchBranch: (id: number) => void;
    menuGroups: MenuGroup[];
}

const Navbar: React.FC<NavbarProps> = ({ 
    activeComponent, 
    setActiveComponent, 
    isBranchAdmin, 
    profile,
    onSelectRole,
    onSignOut,
    branches,
    currentBranchId,
    onSwitchBranch,
    menuGroups
}) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const currentBranch = branches.find(b => b.id === currentBranchId);

    return (
        <>
            <nav className="h-16 md:h-20 px-4 md:px-8 bg-card/80 backdrop-blur-xl border-b border-border/40 sticky top-0 z-40 flex items-center justify-between transition-all">
                <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 -ml-2 text-muted-foreground hover:bg-muted rounded-xl transition-colors">
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    
                    <div className="h-8 w-px bg-border/60 mx-1 hidden lg:block"></div>
                    
                    {currentBranch && (
                        <div className="flex items-center gap-2 group cursor-pointer overflow-hidden max-w-[150px] md:max-w-none">
                            <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-500 hidden sm:block">
                                <LocationIcon className="w-3.5 h-3.5" />
                            </div>
                            <select
                                value={currentBranchId || ''}
                                onChange={(e) => onSwitchBranch(parseInt(e.target.value))}
                                className="appearance-none bg-transparent py-1 text-xs md:text-sm font-black text-foreground focus:outline-none cursor-pointer hover:text-primary transition-colors truncate"
                            >
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                            {!isBranchAdmin && <ChevronDownIcon className="w-3 h-3 opacity-30 group-hover:opacity-100 hidden sm:block"/>}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <div className="hidden sm:block">
                        <ThemeSwitcher />
                    </div>
                    <button className="relative p-2 rounded-xl text-muted-foreground hover:bg-muted transition-all group">
                        <BellIcon className="h-5 w-5" />
                        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                    </button>
                    <ProfileDropdown 
                        profile={profile} 
                        onSignOut={onSignOut} 
                        onSelectRole={onSelectRole} 
                        onProfileClick={() => setActiveComponent('Profile')} 
                    />
                </div>
            </nav>

            {/* Mobile Drawer */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[100] lg:hidden animate-in fade-in">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
                    <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-card border-r border-border shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
                        <div className="p-5 border-b border-border flex justify-between items-center bg-muted/10">
                             <div className="flex items-center gap-3">
                                <SchoolIcon className="h-6 w-6 text-primary" />
                                <span className="font-black text-foreground uppercase tracking-widest text-xs">Admin Menu</span>
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground"><XIcon className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
                            {menuGroups.map((group) => (
                                <div key={group.id} className="space-y-2">
                                    <p className="px-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{group.title}</p>
                                    <div className="space-y-1">
                                        {group.items.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => { setActiveComponent(item.id); setIsMobileMenuOpen(false); }}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeComponent === item.id ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:bg-muted'}`}
                                            >
                                                {item.icon}
                                                <span>{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;