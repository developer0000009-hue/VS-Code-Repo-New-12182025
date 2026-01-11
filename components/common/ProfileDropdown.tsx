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
import { SwitchRoleIcon } from '../icons/SwitchRoleIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import PremiumAvatar from './PremiumAvatar';

interface ProfileDropdownProps {
    profile: UserProfile;
    onSignOut: () => void;
    onSelectRole?: (role: Role, isExisting?: boolean) => void;
    onProfileClick?: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ profile, onSignOut, onSelectRole, onProfileClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [processingRole, setProcessingRole] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { roles } = useRoles();
    
    const [completedRoles, setCompletedRoles] = useState<Set<string>>(new Set());
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

    /**
     * Identity Discovery Protocol
     * Scans institutional sub-profile registries to identify all established identities for the user.
     */
    const discoverIdentities = useCallback(async () => {
        if (!profile?.id) return;
        setCheckingRoles(true);
        try {
            // Channel 1: Primary Identity Probe (RPC)
            const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_completed_roles');
            
            // Channel 2: Targeted Redundancy Check (Explicit sub-profile table queries)
            // This ensures that even if the RPC result is stale, recently created profiles are caught.
            const [parentCheck, adminCheck] = await Promise.all([
                supabase.from('parent_profiles').select('user_id').eq('user_id', profile.id).maybeSingle(),
                supabase.from('school_admin_profiles').select('user_id').eq('user_id', profile.id).maybeSingle()
            ]);

            const found = new Set<string>();
            
            // Rule: Current active role is by definition authorized
            if (profile.role) found.add(profile.role);

            // Integrate RPC Results
            if (!rpcError && rpcData) {
                (rpcData as any[]).forEach(item => {
                    if (item.is_completed) found.add(item.role_name);
                });
            }

            // Integrate Redundancy Checks
            if (parentCheck.data) found.add(BuiltInRoles.PARENT_GUARDIAN);
            if (adminCheck.data) found.add(BuiltInRoles.SCHOOL_ADMINISTRATION);
            
            // Super Admin manual override
            if ((profile as any).is_super_admin) {
                found.add(BuiltInRoles.SUPER_ADMIN);
            }
            
            setCompletedRoles(found);
        } catch (e) {
            console.error("Critical Identity Discovery Failure:", e);
        } finally {
            setCheckingRoles(false);
        }
    }, [profile?.id, profile?.role, (profile as any).is_super_admin]);

    useEffect(() => {
        if (isOpen) discoverIdentities();
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
    
    // Logic Gate: Identify contexts where user profile ALREADY exists
    const authorizedScopes = useMemo(() => roles
        .filter(r => completedRoles.has(r))
        .sort((a, b) => {
            if (a === profile.role) return -1;
            if (b === profile.role) return 1;
            return ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b);
        }), [roles, completedRoles, profile.role]);
    
    // Logic Gate: Identify available paths user has NOT yet onboarded to
    const registerableScopes = useMemo(() => roles
        .filter(r => 
            !completedRoles.has(r) && 
            r !== profile.role && 
            r !== BuiltInRoles.SUPER_ADMIN
        ), 
    [roles, completedRoles, profile.role]);

    return (
        <div className="relative z-50" ref={dropdownRef}>
            {/* Control Node Trigger */}
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className={`flex items-center gap-3 pl-1 pr-3 py-1 rounded-full transition-all group ${isOpen ? 'bg-white/5 shadow-inner' : 'hover:bg-white/5'}`}
            >
                <div className="relative">
                    <PremiumAvatar 
                        src={profile.profile_photo_url} 
                        name={profile.display_name} 
                        size="xs" 
                        className="w-8 h-8 rounded-full border-2 border-background shadow-lg"
                    />
                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 border-2 border-[#08090a] rounded-full z-10 shadow-sm"></div>
                </div>
                <div className="hidden md:flex flex-col items-start text-left mr-1">
                    <span className="text-xs font-bold text-white leading-tight max-w-[120px] truncate">{profile.display_name}</span>
                    <span className="text-[9px] font-black text-white/30 max-w-[120px] truncate uppercase tracking-widest leading-none mt-0.5">{profile.role || 'Provisioning'}</span>
                </div>
                <ChevronDownIcon className={`h-3 w-3 text-white/20 transition-transform duration-500 ${isOpen ? 'rotate-180 text-primary opacity-100' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-80 bg-[#0d0f14] rounded-[2.8rem] shadow-[0_48px_128px_-24px_rgba(0,0,0,1)] border border-white/5 origin-top-right ring-1 ring-white/10 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-500 backdrop-blur-3xl">
                    <div className="flex flex-col">
                        {/* Identity Header */}
                        <div className="p-8 pb-6 flex items-center gap-5 border-b border-white/5 bg-white/[0.01]">
                             <PremiumAvatar 
                                src={profile.profile_photo_url} 
                                name={profile.display_name} 
                                size="sm" 
                                className="w-14 h-14 rounded-2xl shadow-2xl border border-white/10"
                             />
                             <div className="min-w-0">
                                 <p className="font-serif font-black text-white text-lg truncate leading-tight uppercase tracking-tight">{profile.display_name}</p>
                                 <p className="text-[11px] text-white/30 truncate mt-1.5 font-medium tracking-tight opacity-60">{profile.email}</p>
                             </div>
                        </div>

                        {/* Node Control Strip */}
                        <div className="p-2 border-b border-white/5 bg-black/20">
                             <button onClick={() => { onProfileClick?.(); setIsOpen(false); }} className="w-full flex items-center gap-3 p-4 rounded-2xl text-[10px] font-black text-white/40 hover:text-white hover:bg-white/5 transition-all uppercase tracking-[0.4em] group">
                                 <SettingsIcon className="w-4 h-4 text-white/10 group-hover:text-primary transition-colors" /> Node Management
                             </button>
                        </div>

                        {/* Discovery Workspace */}
                        <div className="flex-grow max-h-[480px] overflow-y-auto custom-scrollbar">
                            {checkingRoles ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-6">
                                    <Spinner size="md" className="text-primary" />
                                    <p className="text-[9px] font-black uppercase text-white/10 tracking-[0.5em] animate-pulse">Syncing Matrix</p>
                                </div>
                            ) : (
                                <>
                                    {/* AUTHORIZED NODES (Switchable Contexts) */}
                                    {authorizedScopes.length > 0 && (
                                        <div className="p-4 pt-6">
                                            <p className="px-5 py-3 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-2">
                                                <SwitchRoleIcon className="w-3.5 h-3.5 opacity-40"/> Authorized Scopes
                                            </p>
                                            <div className="space-y-2 mt-1">
                                                {authorizedScopes.map(roleName => {
                                                    const Icon = ROLE_ICONS[roleName] || UserIcon;
                                                    const isCurrent = roleName === profile.role;
                                                    return (
                                                        <button 
                                                            key={roleName} 
                                                            disabled={processingRole !== null}
                                                            onClick={() => !isCurrent && handleAction(roleName, true)} 
                                                            className={`w-full flex items-center p-4 rounded-[2rem] text-sm transition-all relative overflow-hidden group/item border ${isCurrent ? 'bg-primary/10 border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.05)] cursor-default' : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10 active:scale-[0.98]'}`}
                                                        >
                                                            <div className={`p-2.5 rounded-xl mr-5 transition-all duration-700 shadow-inner ${isCurrent ? 'bg-primary text-white shadow-primary/20' : 'bg-black/40 text-white/20 group-hover/item:text-white/40'}`}>
                                                                <Icon className="w-5 h-5"/>
                                                            </div>
                                                            <div className="flex-grow text-left">
                                                                <span className={`block text-[11px] font-black uppercase tracking-[0.15em] ${isCurrent ? 'text-primary' : 'text-white/50 group-hover/item:text-white/80 transition-colors'}`}>{roleName}</span>
                                                                {isCurrent && (
                                                                    <div className="flex items-center gap-2 mt-1 animate-in fade-in slide-in-from-left-2 duration-700">
                                                                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                                                                        <span className="block text-[9px] text-emerald-500 font-black uppercase tracking-[0.2em]">Primary Session</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {processingRole === roleName ? (
                                                                <Spinner size="sm" className="text-primary" />
                                                            ) : isCurrent ? (
                                                                <CheckCircleIcon className="w-5 h-5 text-primary shadow-2xl" />
                                                            ) : (
                                                                <div className="w-5 h-5 rounded-full border border-white/5 group-hover/item:border-white/20 transition-all"></div>
                                                            )}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* UNLINKED SCOPES (Provisioning Paths) */}
                                    {registerableScopes.length > 0 && (
                                        <div className="p-4 pt-2 border-t border-white/5 mt-4 bg-black/40 pb-6">
                                             <p className="px-5 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-2">
                                                 <PlusIcon className="w-3.5 h-3.5 opacity-40"/> Register New Scope
                                             </p>
                                             <div className="space-y-1.5">
                                                {registerableScopes.map(roleName => {
                                                    const Icon = ROLE_ICONS[roleName] || UserIcon;
                                                    return (
                                                        <button 
                                                            key={roleName} 
                                                            disabled={processingRole !== null}
                                                            onClick={() => handleAction(roleName, false)} 
                                                            className="w-full flex items-center p-4 rounded-2xl bg-white/[0.01] hover:bg-white/[0.04] transition-all group/item active:scale-[0.98] border border-transparent hover:border-white/5"
                                                        >
                                                            <div className="p-2.5 rounded-xl bg-black/20 text-white/10 mr-5 group-hover/item:bg-primary/10 group-hover/item:text-primary transition-all duration-500 shadow-inner">
                                                                <Icon className="w-5 h-5" />
                                                            </div>
                                                            <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.1em] group-hover/item:text-white transition-colors">
                                                                Onboard as {roleName}
                                                            </span>
                                                            {processingRole === roleName ? (
                                                                <Spinner size="sm" className="ml-auto" />
                                                            ) : (
                                                                <ChevronRightIcon className="w-4 h-4 ml-auto text-white/5 group-hover/item:text-primary group-hover/item:translate-x-1 transition-all" />
                                                            )}
                                                        </button>
                                                    )
                                                })}
                                             </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Termination Footer */}
                        <div className="p-6 bg-black border-t border-white/5 shadow-[0_-12px_24px_rgba(0,0,0,0.4)]">
                             <button 
                                onClick={onSignOut} 
                                className="w-full h-14 flex items-center justify-center gap-4 p-4 rounded-[1.6rem] text-[10px] font-black text-red-500 bg-red-500/5 hover:bg-red-600 hover:text-white transition-all uppercase tracking-[0.4em] active:scale-97 group/logout shadow-2xl"
                             >
                                 <LogoutIcon className="w-5 h-5 transition-transform group-hover/logout:-translate-x-1" /> Terminate Node Session
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;