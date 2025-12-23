import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { UserProfile, Role, BuiltInRoles } from '../../types';
import { LogoutIcon } from '../icons/LogoutIcon';
import { SettingsIcon } from '../icons/SettingsIcon';
import { useRoles } from '../../contexts/RoleContext';
import { ROLE_ICONS, ROLE_ORDER } from '../../constants';
import { PlusIcon } from '../icons/PlusIcon';
import { supabase } from '../../services/supabase';
import Spinner from './Spinner';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { UserIcon } from '../icons/UserIcon';

interface ProfileDropdownProps {
    profile: UserProfile;
    onSignOut: () => void;
    onSelectRole?: (role: Role, isExisting?: boolean) => void;
    onSwitchRole?: () => void;
    onProfileClick?: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ profile, onSignOut, onSelectRole, onProfileClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [processingRole, setProcessingRole] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { roles } = useRoles();
    
    const [existingRoles, setExistingRoles] = useState<Set<string>>(new Set());
    const [checkingRoles, setCheckingRoles] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const discoverIdentities = useCallback(async () => {
        if (!profile) return;
        setCheckingRoles(true);
        
        try {
            // Find all tables where this user has an entry
            const { data, error } = await supabase.rpc('get_user_completed_roles');
            
            if (!error && data) {
                const found = new Set<string>(data);
                // Always include current role just in case
                if (profile.role) found.add(profile.role);
                setExistingRoles(found);
            } else {
                 const found = new Set<string>();
                 if (profile.role) found.add(profile.role);
                 setExistingRoles(found);
            }
        } catch (e) {
            console.error("Identity discovery failed:", e);
        } finally {
            setCheckingRoles(false);
        }
    }, [profile]);

    useEffect(() => {
        if (isOpen) {
            discoverIdentities();
        }
    }, [isOpen, discoverIdentities]);

    const handleAction = async (actionRole: Role, isExisting: boolean) => {
        if (!onSelectRole) return;
        setProcessingRole(actionRole);
        try {
            await onSelectRole(actionRole, isExisting);
            setIsOpen(false);
        } finally {
            setProcessingRole(null);
        }
    };
    
    const handleSignOutClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onSignOut();
        setIsOpen(false);
    };
    
    const internalRoles: string[] = [
        BuiltInRoles.PRINCIPAL, 
        BuiltInRoles.HR_MANAGER, 
        BuiltInRoles.ACADEMIC_COORDINATOR,
        BuiltInRoles.BRANCH_ADMIN
    ];
    
    const switchableIdentities = useMemo(() => roles
        .filter(r => existingRoles.has(r))
        .sort((a, b) => {
            if (a === profile.role) return -1;
            if (b === profile.role) return 1;
            const indexA = ROLE_ORDER.indexOf(a);
            const indexB = ROLE_ORDER.indexOf(b);
            if (indexA > -1 && indexB > -1) return indexA - indexB;
            return a.localeCompare(b);
        }), [roles, existingRoles, profile.role]);
    
    const creatableIdentities = useMemo(() => roles
        .filter(r => !existingRoles.has(r) && !internalRoles.includes(r)), 
    [roles, existingRoles, internalRoles]);

    return (
        <div className="relative z-50" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className={`flex items-center gap-3 pl-1 pr-3 py-1 rounded-full transition-all duration-300 group ${isOpen ? 'bg-muted shadow-inner border-border' : 'hover:bg-muted/50'}`}
            >
                <div className="relative">
                    <img 
                        className="h-9 w-9 rounded-full object-cover border-2 border-background shadow-sm" 
                        src={`https://api.dicebear.com/8.x/initials/svg?seed=${profile.display_name}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                        alt="Avatar" 
                    />
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-background rounded-full z-10 shadow-sm"></div>
                </div>
                
                <div className="hidden md:flex flex-col items-start text-left mr-1">
                    <span className="text-xs font-bold text-foreground leading-tight max-w-[100px] truncate">{profile.display_name}</span>
                    <span className="text-[10px] font-medium text-muted-foreground max-w-[100px] truncate uppercase tracking-wider">{profile.role || 'Portal Access'}</span>
                </div>
                
                <ChevronDownIcon className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'group-hover:text-foreground'}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-card rounded-2xl shadow-2xl border border-border origin-top-right ring-1 ring-black/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex flex-col">
                        {/* Current User Header */}
                        <div className="p-5 flex items-center gap-4 bg-muted/20 border-b border-border">
                             <img className="h-12 w-12 rounded-full object-cover shadow-md border-2 border-background" src={`https://api.dicebear.com/8.x/initials/svg?seed=${profile.display_name}&backgroundColor=b6e3f4,c0aede,d1d4f9`} alt="Avatar" />
                             <div className="min-w-0">
                                 <p className="font-bold text-foreground truncate leading-tight">{profile.display_name}</p>
                                 <p className="text-xs text-muted-foreground truncate mt-0.5">{profile.email}</p>
                                 <div className="mt-2"><span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">{profile.role}</span></div>
                             </div>
                        </div>
                        
                        <div className="p-2 border-b border-border">
                             <button onClick={() => { onProfileClick?.(); setIsOpen(false); }} className="w-full flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-all">
                                 <SettingsIcon className="w-4 h-4 text-muted-foreground" /> Manage My Credentials
                             </button>
                        </div>

                        <div className="flex-grow max-h-[400px] overflow-y-auto custom-scrollbar">
                            {checkingRoles ? <div className="py-12 flex flex-col items-center justify-center gap-3"><Spinner /><p className="text-[10px] font-black uppercase text-muted-foreground animate-pulse">Mapping Identities...</p></div> : (
                                <>
                                    {/* Profiles established in the system */}
                                    {switchableIdentities.length > 0 && onSelectRole && (
                                        <div className="p-2">
                                            <p className="px-3 py-2 text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">Switch Active Identity</p>
                                            {switchableIdentities.map(role => {
                                                const Icon = ROLE_ICONS[role] || UserIcon;
                                                const isCurrent = role === profile.role;
                                                const isProcessing = processingRole === role;
                                                
                                                return (
                                                    <button 
                                                        key={role} 
                                                        onClick={() => !isCurrent && !processingRole && handleAction(role, true)} 
                                                        disabled={isCurrent || !!processingRole} 
                                                        className={`w-full flex items-center p-3 rounded-xl text-sm transition-all group/item ${isCurrent ? 'bg-primary/5 cursor-default' : 'hover:bg-muted'} ${processingRole && !isProcessing ? 'opacity-30' : ''}`}
                                                    >
                                                        <div className={`p-2 rounded-lg transition-all mr-3 ${isCurrent ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground group-hover/item:bg-background group-hover/item:text-primary shadow-inner'}`}>
                                                             <Icon className="w-5 h-5"/>
                                                        </div>
                                                        <div className="flex-grow text-left">
                                                            <span className={`block transition-colors ${isCurrent ? 'font-black text-primary' : 'font-bold text-foreground group-hover/item:text-primary'}`}>{role}</span>
                                                            {isCurrent && <span className="block text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Active</span>}
                                                        </div>
                                                        {isProcessing ? <Spinner size="sm" className="text-primary" /> : isCurrent && <CheckCircleIcon className="w-5 h-5 text-primary" />}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {/* Roles available for initialization */}
                                    {creatableIdentities.length > 0 && onSelectRole && (
                                        <div className="p-2 mt-2 pt-4 border-t border-border/60">
                                             <p className="px-3 py-2 text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">Initialize New Profile</p>
                                             {creatableIdentities.map(role => {
                                                 const Icon = ROLE_ICONS[role] || UserIcon;
                                                 const isProcessing = processingRole === role;
                                                 
                                                 return (
                                                     <button 
                                                        key={role} 
                                                        onClick={() => !processingRole && handleAction(role, false)} 
                                                        disabled={!!processingRole}
                                                        className={`w-full flex items-center p-3 rounded-xl text-sm hover:bg-muted transition-all group/item ${processingRole && !isProcessing ? 'opacity-30' : ''}`}
                                                     >
                                                         <div className="p-2 rounded-lg bg-muted text-muted-foreground transition-all mr-3 group-hover/item:bg-indigo-500/10 group-hover/item:text-indigo-500 shadow-inner">
                                                             <Icon className="w-5 h-5" />
                                                         </div>
                                                         <span className="font-bold text-foreground group-hover/item:text-indigo-500">{`Create ${role} Profile`}</span>
                                                         {isProcessing ? <Spinner size="sm" className="ml-auto text-indigo-500" /> : <PlusIcon className="w-4 h-4 ml-auto text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity" />}
                                                     </button>
                                                 )
                                             })}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="p-3 bg-muted/10 border-t border-border">
                             <button onClick={handleSignOutClick} className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-black text-red-500 hover:bg-red-500/10 transition-all uppercase tracking-widest">
                                 <LogoutIcon className="w-5 h-5"/> Terminate Session
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;