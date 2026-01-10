
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

    const discoverIdentities = useCallback(async () => {
        if (!profile?.id) return;
        setCheckingRoles(true);
        try {
            const { data, error } = await supabase.rpc('get_user_completed_roles');
            if (!error && data) {
                const found = new Set<string>();
                (data as any[]).forEach(item => {
                    if (item.is_completed) found.add(item.role_name);
                });
                if (profile.role) found.add(profile.role);
                setCompletedRoles(found);
            }
        } catch (e) {
            console.error("Identity Discovery failed:", e);
        } finally {
            setCheckingRoles(false);
        }
    }, [profile?.id, profile?.role]);

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
    
    const switchableIdentities = useMemo(() => roles
        .filter(r => completedRoles.has(r))
        .sort((a, b) => {
            if (a === profile.role) return -1;
            if (b === profile.role) return 1;
            return ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b);
        }), [roles, completedRoles, profile.role]);
    
    const creatableIdentities = useMemo(() => roles
        .filter(r => !completedRoles.has(r) && r !== BuiltInRoles.SUPER_ADMIN), 
    [roles, completedRoles]);

    return (
        <div className="relative z-50" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className={`flex items-center gap-3 pl-1 pr-3 py-1 rounded-full transition-all group ${isOpen ? 'bg-muted shadow-inner' : 'hover:bg-muted/50'}`}>
                <div className="relative">
                    <img className="h-9 w-9 rounded-full object-cover border-2 border-background shadow-sm" src={`https://api.dicebear.com/8.x/initials/svg?seed=${profile.display_name}&backgroundColor=b6e3f4,c0aede,d1d4f9`} alt="Avatar" />
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-background rounded-full z-10 shadow-sm"></div>
                </div>
                <div className="hidden md:flex flex-col items-start text-left mr-1">
                    <span className="text-xs font-bold text-foreground leading-tight max-w-[100px] truncate">{profile.display_name}</span>
                    <span className="text-[10px] font-medium text-muted-foreground max-w-[100px] truncate uppercase tracking-wider">{profile.role || 'Provisioning'}</span>
                </div>
                <ChevronDownIcon className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180 text-primary' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-[#13151b] rounded-2xl shadow-2xl border border-white/5 origin-top-right ring-1 ring-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex flex-col">
                        <div className="p-6 flex items-center gap-4 border-b border-white/5 bg-white/[0.01]">
                             <img className="h-14 w-14 rounded-2xl object-cover shadow-xl border border-white/10" src={`https://api.dicebear.com/8.x/initials/svg?seed=${profile.display_name}`} alt="Avatar" />
                             <div className="min-w-0">
                                 <p className="font-serif font-black text-white text-lg truncate leading-tight">{profile.display_name}</p>
                                 <p className="text-[11px] text-white/30 truncate mt-0.5">{profile.email}</p>
                             </div>
                        </div>
                        <div className="p-2 border-b border-white/5">
                             <button onClick={() => { onProfileClick?.(); setIsOpen(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl text-xs font-black text-white/70 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest group">
                                 <SettingsIcon className="w-4 h-4 text-white/20 group-hover:text-primary transition-colors" /> Node Management
                             </button>
                        </div>
                        <div className="flex-grow max-h-[420px] overflow-y-auto custom-scrollbar">
                            {checkingRoles ? (
                                <div className="py-16 flex flex-col items-center justify-center gap-4"><Spinner size="md" className="text-primary" /><p className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em]">Recalling Identities</p></div>
                            ) : (
                                <>
                                    {switchableIdentities.length > 0 && onSelectRole && (
                                        <div className="p-3">
                                            <p className="px-4 py-3 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-2">
                                                <SwitchRoleIcon className="w-3 h-3"/> Authorized Scopes
                                            </p>
                                            {switchableIdentities.map(roleName => {
                                                const Icon = ROLE_ICONS[roleName] || UserIcon;
                                                const isCurrent = roleName === profile.role;
                                                return (
                                                    <button key={roleName} onClick={() => !isCurrent && handleAction(roleName, true)} className={`w-full flex items-center p-3 rounded-xl text-sm transition-all mb-1 ${isCurrent ? 'bg-primary/5 cursor-default' : 'hover:bg-white/5'}`}>
                                                        <div className={`p-2.5 rounded-xl mr-4 transition-all duration-500 ${isCurrent ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-white/20'}`}><Icon className="w-5 h-5"/></div>
                                                        <div className="flex-grow text-left">
                                                            <span className={`block text-xs font-black uppercase tracking-wider ${isCurrent ? 'text-primary' : 'text-white/60'}`}>{roleName}</span>
                                                            {isCurrent && <span className="block text-[9px] text-emerald-500 font-black uppercase tracking-[0.2em] mt-0.5">Primary Session</span>}
                                                        </div>
                                                        {processingRole === roleName ? <Spinner size="sm" /> : isCurrent && <CheckCircleIcon className="w-5 h-5 text-primary" />}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                    {creatableIdentities.length > 0 && onSelectRole && (
                                        <div className="p-3 mt-1 pt-4 border-t border-white/5">
                                             <p className="px-4 py-3 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-2">
                                                 <PlusIcon className="w-3 h-3"/> Register New Scope
                                             </p>
                                             {creatableIdentities.map(roleName => {
                                                 const Icon = ROLE_ICONS[roleName] || UserIcon;
                                                 return (
                                                     <button key={roleName} onClick={() => handleAction(roleName, false)} className="w-full flex items-center p-3 rounded-xl hover:bg-white/5 transition-all group/item mb-1">
                                                         <div className={`p-2.5 rounded-xl transition-colors bg-white/5 text-white/20 mr-4 group-hover/item:text-primary group-hover/item:bg-primary/10 border border-transparent`}><Icon className="w-5 h-5" /></div>
                                                         <span className="text-xs font-black text-white/60 uppercase tracking-wider group-hover/item:text-white">
                                                            Onboard as {roleName}
                                                         </span>
                                                         {processingRole === roleName ? <Spinner size="sm" className="ml-auto" /> : <ChevronRightIcon className="w-4 h-4 ml-auto text-white/10 group-hover/item:translate-x-1 transition-all" />}
                                                     </button>
                                                 )
                                             })}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="p-4 bg-black/40 border-t border-white/5">
                             <button onClick={onSignOut} className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl text-[11px] font-black text-red-500 hover:bg-red-500 hover:text-white transition-all uppercase tracking-[0.25em] shadow-lg active:scale-[0.98]">
                                 <LogoutIcon className="w-5 h-5" /> Terminate Node Session
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;
