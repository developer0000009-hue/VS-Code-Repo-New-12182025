
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, AdmissionApplication, Role } from '../../types';
import { BellIcon } from '../icons/BellIcon';
import ProfileDropdown from '../common/ProfileDropdown';
import { MenuIcon } from '../icons/MenuIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';

interface StudentHeaderProps {
    profile: UserProfile;
    onSignOut: () => void;
    onSwitchRole: () => void;
    onSelectRole?: (role: Role, isExisting?: boolean) => void; // Added for Add/Switch Role
    onMenuClick: () => void;
    pageTitle: string;
    // Props for parent view
    isParentView: boolean;
    allMyChildren: AdmissionApplication[];
    // Fix: Changed currentChildId from number to string to match UUID.
    currentChildId: string | null;
    // Fix: Changed admissionId from number to string.
    onSwitchStudent: (admissionId: string) => void;
    currentStudentName?: string | null;
}

const StudentSwitcher: React.FC<Omit<StudentHeaderProps, 'pageTitle' | 'onMenuClick' | 'onSignOut' | 'onSwitchRole' | 'onSelectRole'>> = (props) => {
    const { allMyChildren = [], currentChildId, onSwitchStudent, currentStudentName } = props;
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Even if 1 child, we might want to show context, but usually dropdown implies choice.
    // If only 1 child, we just show the name, no dropdown arrow.
    const hasMultiple = (allMyChildren || []).length > 1;
    // Fix: Type comparison now between string and string.
    const currentChild = (allMyChildren || []).find(c => c.id === currentChildId);

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => hasMultiple && setIsOpen(!isOpen)}
                disabled={!hasMultiple}
                className={`
                    flex items-center gap-3 pl-1 pr-4 py-1.5 rounded-full border transition-all duration-200
                    ${hasMultiple 
                        ? 'bg-card hover:bg-muted/50 border-border cursor-pointer shadow-sm hover:shadow-md' 
                        : 'bg-muted/30 border-transparent cursor-default'
                    }
                `}
            >
                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-sm">
                    <img 
                        className="w-full h-full rounded-full object-cover border-2 border-card" 
                        src={currentChild?.profile_photo_url || `https://api.dicebear.com/8.x/initials/svg?seed=${currentStudentName}`} 
                        alt={currentStudentName || ''} 
                    />
                 </div>
                 <div className="flex flex-col items-start mr-1">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider leading-none mb-0.5">Viewing As</span>
                    <span className="text-sm font-bold text-foreground leading-none">{currentStudentName || 'Select Child'}</span>
                 </div>
                {hasMultiple && (
                    <ChevronDownIcon className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-card rounded-xl shadow-xl border border-border z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5">
                    <div className="px-4 py-3 border-b border-border bg-muted/30">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Switch Student Profile</p>
                    </div>
                    <div className="p-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                        {allMyChildren.map(child => (
                            <button
                                key={child.id}
                                // Fix: child.id is already a string.
                                onClick={() => { onSwitchStudent(child.id); setIsOpen(false); }}
                                className={`w-full text-left flex items-center justify-between gap-3 p-2 rounded-lg transition-all group ${
                                    // Fix: String comparison.
                                    child.id === currentChildId ? 'bg-primary/10' : 'hover:bg-muted'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <img 
                                        className={`w-9 h-9 rounded-full border-2 ${// Fix: String comparison.
                                        child.id === currentChildId ? 'border-primary/20' : 'border-transparent'}`}
                                        src={child.profile_photo_url || `https://api.dicebear.com/8.x/initials/svg?seed=${child.applicant_name}`} 
                                        alt={child.applicant_name} 
                                    />
                                    <div>
                                        <p className={`text-sm font-semibold ${// Fix: String comparison.
                                        child.id === currentChildId ? 'text-primary' : 'text-foreground'}`}>{child.applicant_name}</p>
                                        <p className="text-xs text-muted-foreground">Grade {child.grade}</p>
                                    </div>
                                </div>
                                {// Fix: String comparison.
                                child.id === currentChildId && <CheckCircleIcon className="h-5 w-5 text-primary" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}


const StudentHeader: React.FC<StudentHeaderProps> = (props) => {
    const { profile, onSignOut, onSelectRole, onMenuClick, pageTitle, isParentView } = props;

    return (
        <header className="bg-card/80 backdrop-blur-md border-b border-border h-20 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-30 sticky top-0 transition-all">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                    <MenuIcon className="h-6 w-6" />
                </button>
                
                <h1 className="text-xl md:text-2xl font-serif font-bold text-foreground tracking-tight hidden sm:block">
                    {pageTitle}
                </h1>
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
                {/* Student Switcher (Only visible if viewing as Parent) */}
                {isParentView && (
                    <div className="hidden md:block">
                        <StudentSwitcher {...props} />
                    </div>
                )}

                <div className="h-8 w-px bg-border hidden md:block"></div>

                <div className="flex items-center gap-3">
                    <button className="relative p-2.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 group">
                        <BellIcon className="h-5 w-5 group-hover:animate-swing" />
                        <span className="absolute top-2.5 right-2.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-card animate-pulse"></span>
                    </button>
                    
                    {/* Enhanced Profile Dropdown with Role Switching Capabilities */}
                    <ProfileDropdown
                        profile={profile}
                        onSignOut={onSignOut}
                        onSelectRole={onSelectRole} // Vital for "Add Role" functionality
                    />
                </div>
            </div>
        </header>
    );
};

export default StudentHeader;
