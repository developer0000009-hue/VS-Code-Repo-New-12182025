
import React, { useState, useEffect } from 'react';
import { Role, BuiltInRoles } from '../types';
import { ROLE_ICONS } from '../constants';
import { useRoles } from '../contexts/RoleContext';
import Spinner from './common/Spinner';
import { supabase } from '../services/supabase';
import { XIcon } from './icons/XIcon';
import { SchoolIcon } from './icons/SchoolIcon';
import { UsersIcon } from './icons/UsersIcon';

interface RoleSelectionPageProps {
    onRoleSelect: (role: Role) => void;
    onComplete: () => void;
}

const ROLE_META: Record<string, { label: string; description: string; color: string; gradient: string; shadow: string }> = {
    [BuiltInRoles.SCHOOL_ADMINISTRATION]: {
        label: 'School Administration',
        description: 'Manage institution, branches, staff, and overall operations.',
        color: 'text-purple-600 dark:text-purple-400',
        gradient: 'from-purple-500/10 to-indigo-500/10',
        shadow: 'hover:shadow-purple-500/20',
    },
    [BuiltInRoles.TEACHER]: {
        label: 'Teacher',
        description: 'Manage classes, attendance, grading, and course materials.',
        color: 'text-blue-600 dark:text-blue-400',
        gradient: 'from-blue-500/10 to-cyan-500/10',
        shadow: 'hover:shadow-blue-500/20',
    },
    [BuiltInRoles.STUDENT]: {
        label: 'Student',
        description: 'Access your portal for grades, timetable, and assignments.',
        color: 'text-emerald-600 dark:text-emerald-400',
        gradient: 'from-emerald-500/10 to-teal-500/10',
        shadow: 'hover:shadow-emerald-500/20',
    },
    [BuiltInRoles.PARENT_GUARDIAN]: {
        label: 'Parent / Guardian',
        description: 'Monitor child progress, fees, and communicate with school.',
        color: 'text-rose-600 dark:text-rose-400',
        gradient: 'from-rose-500/10 to-pink-500/10',
        shadow: 'hover:shadow-rose-500/20',
    },
    [BuiltInRoles.TRANSPORT_STAFF]: {
        label: 'Transport Staff',
        description: 'Manage routes, vehicle tracking, and student pickup/drop.',
        color: 'text-amber-600 dark:text-amber-400',
        gradient: 'from-amber-500/10 to-orange-500/10',
        shadow: 'hover:shadow-amber-500/20',
    },
    [BuiltInRoles.ECOMMERCE_OPERATOR]: {
        label: 'E-commerce Operator',
        description: 'Manage school store, inventory, uniform, and book sales.',
        color: 'text-indigo-600 dark:text-indigo-400',
        gradient: 'from-indigo-500/10 to-violet-500/10',
        shadow: 'hover:shadow-indigo-500/20',
    },
};

const RoleSelectionPage: React.FC<RoleSelectionPageProps> = ({ onRoleSelect, onComplete }) => {
    const { roles, loading } = useRoles();
    const [isSchoolAdminModalOpen, setIsSchoolAdminModalOpen] = useState(false);
    const [joinLoading, setJoinLoading] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);
    const [invitationCode, setInvitationCode] = useState('');
    const [selectedRole, setSelectedRole] = useState<string | null>(null);

    // Watchdog to prevent infinite loading state
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (createLoading) {
            timer = setTimeout(() => {
                if (createLoading) {
                    console.warn("Watchdog: Resetting stuck creation state.");
                    setCreateLoading(false);
                }
            }, 8000);
        }
        return () => clearTimeout(timer);
    }, [createLoading]);

    const publicRoles: string[] = [
        BuiltInRoles.SCHOOL_ADMINISTRATION,
        BuiltInRoles.TEACHER,
        BuiltInRoles.STUDENT,
        BuiltInRoles.PARENT_GUARDIAN,
        BuiltInRoles.TRANSPORT_STAFF,
        BuiltInRoles.ECOMMERCE_OPERATOR
    ];

    const displayRoles = roles.filter(r => publicRoles.includes(r));

    const handleRoleClick = async (role: Role) => {
        if (selectedRole || createLoading || joinLoading) return;
        
        setSelectedRole(role);

        if (role === BuiltInRoles.SCHOOL_ADMINISTRATION) {
            setTimeout(() => {
                setIsSchoolAdminModalOpen(true);
                setSelectedRole(null);
            }, 250);
        } else {
             onRoleSelect(role);
        }
    };

    const handleCreateNewSchool = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (createLoading) return;
        
        setCreateLoading(true);
        try {
            await onRoleSelect(BuiltInRoles.SCHOOL_ADMINISTRATION);
        } catch (err) {
            console.error("New School Creation Trigger Failed:", err);
            setCreateLoading(false);
        }
    }

    const handleJoinBranch = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!invitationCode.trim() || joinLoading) {
            setJoinError("Please enter your invitation code.");
            return;
        }

        setJoinLoading(true);
        setJoinError(null);
        
        try {
            const { data, error } = await supabase.rpc('verify_and_link_branch_admin', { 
                p_invitation_code: invitationCode.trim().toUpperCase() 
            });
            
            if (error) throw error;
            
            if (data.success) {
                onComplete();
            } else {
                setJoinError(data.message || 'Invalid or expired invitation code.');
                setJoinLoading(false);
            }
        } catch (err: any) {
            setJoinError(err.message || "Invitation verification failed.");
            setJoinLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background">
                <Spinner size="lg" />
                <p className="text-muted-foreground animate-pulse font-medium">Synchronizing access portals...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-background">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] bg-purple-50/5 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-7xl mx-auto text-center z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="mb-12">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-extrabold text-foreground mb-6 tracking-tight drop-shadow-sm">
                        Select Your Portal
                    </h1>
                    <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        Welcome to the digital campus. Choose your profile below to access your personalized tools.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                    {displayRoles.map((name) => {
                        const Icon = ROLE_ICONS[name];
                        const meta = ROLE_META[name] || { 
                            label: name, 
                            description: 'Access your dashboard.', 
                            color: 'text-foreground', 
                            gradient: 'from-gray-500/5 to-slate-500/5',
                            shadow: 'hover:shadow-lg'
                        };
                        const isSelected = selectedRole === name;
                        const isDisabled = (!!selectedRole && !isSelected) || createLoading || joinLoading;

                        return (
                            <button
                                key={name}
                                type="button"
                                onClick={() => handleRoleClick(name)}
                                disabled={isDisabled}
                                className={`
                                    group relative flex flex-col items-start text-left h-full min-h-[240px] p-8 rounded-[2rem]
                                    bg-card/60 backdrop-blur-md border border-border/50
                                    transition-all duration-300 ease-out
                                    ${meta.shadow} hover:-translate-y-2
                                    focus:outline-none focus:ring-4 focus:ring-primary/20
                                    ${isSelected ? 'ring-2 ring-primary border-primary scale-[0.98] bg-card z-10 shadow-xl' : ''}
                                    ${isDisabled ? 'opacity-40 scale-95 grayscale cursor-not-allowed' : 'cursor-pointer'}
                                `}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem]`} />
                                
                                <div className="relative z-10 flex flex-col h-full w-full">
                                    <div className="flex justify-between items-start w-full mb-6">
                                        <div className={`p-4 rounded-2xl bg-background shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${meta.color}`}>
                                            {Icon ? <Icon className="w-10 h-10" /> : <div className="w-10 h-10 bg-muted rounded-full" />}
                                        </div>
                                        {isSelected && (
                                            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-border">
                                                <Spinner size="sm" className="text-primary" />
                                                <span className="text-xs font-bold text-primary animate-pulse">Entering...</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-auto">
                                        <h3 className={`text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors ${isSelected ? 'text-primary' : ''}`}>
                                            {meta.label}
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors font-medium">
                                            {meta.description}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Setup Administration Flow Modal */}
            {isSchoolAdminModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-50 p-4 animate-in fade-in duration-300" onClick={() => !createLoading && setIsSchoolAdminModalOpen(false)}>
                    <div className="bg-card w-full max-w-4xl rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden transform transition-all scale-100 ring-1 ring-black/5" onClick={e => e.stopPropagation()}>
                        <header className="p-8 pb-4 flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-serif font-extrabold text-foreground tracking-tight">Setup Administration</h2>
                                <p className="text-muted-foreground text-base mt-2">Choose how you want to initialize your admin access.</p>
                            </div>
                            <button onClick={() => !createLoading && setIsSchoolAdminModalOpen(false)} className="p-2.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
                                <XIcon className="w-6 h-6"/>
                            </button>
                        </header>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/60">
                            {/* Option 1: Create New School */}
                            <button 
                                onClick={handleCreateNewSchool} 
                                disabled={createLoading}
                                className="p-12 text-center hover:bg-muted/30 transition-all group flex flex-col items-center h-full relative overflow-hidden disabled:opacity-70 disabled:cursor-wait"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-inner border border-primary/20">
                                        {createLoading ? <Spinner size="lg" className="text-primary" /> : <SchoolIcon className="w-12 h-12 text-primary"/>}
                                    </div>
                                    <h3 className="text-2xl font-bold text-foreground mb-4">Create New School</h3>
                                    <p className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                                        Set up a brand new institution profile. You will be the <strong>Super Administrator</strong> for the head office.
                                    </p>
                                    <div className="mt-10 inline-flex items-center gap-2 text-xs font-black text-primary uppercase tracking-[0.2em] group-hover:gap-3 transition-all">
                                        {createLoading ? 'INITIALIZING...' : <>GET STARTED <span>&rarr;</span></>}
                                    </div>
                                </div>
                            </button>
                            
                            {/* Option 2: Join Existing Branch */}
                            <div className="p-12 text-center bg-muted/5 flex flex-col items-center h-full relative overflow-hidden">
                                <div className="relative z-10 w-full flex flex-col items-center">
                                    <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-8 shadow-inner border border-blue-500/20">
                                        <UsersIcon className="w-12 h-12 text-blue-600"/>
                                    </div>
                                    <h3 className="text-2xl font-bold text-foreground mb-4">Join as Branch Admin</h3>
                                    <p className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-relaxed mb-8">
                                        If your Head Office has invited you via email, select this to link your account to an existing branch.
                                    </p>
                                    
                                    <div className="w-full max-w-xs space-y-3">
                                        <input 
                                            type="text"
                                            value={invitationCode}
                                            onChange={(e) => setInvitationCode(e.target.value)}
                                            placeholder="Enter Invitation Code"
                                            disabled={joinLoading || createLoading}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-center font-mono font-bold tracking-widest focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all uppercase placeholder:text-muted-foreground/30 placeholder:normal-case"
                                        />
                                        <button
                                            onClick={handleJoinBranch}
                                            disabled={joinLoading || createLoading}
                                            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-blue-500/40 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {joinLoading ? <Spinner size="sm" className="text-white"/> : 'Verify & Join Branch'}
                                        </button>
                                    </div>
                                    
                                    {joinError && (
                                        <div className="mt-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-xs font-bold rounded-lg border border-red-100 dark:border-red-800 w-full max-w-xs animate-in slide-in-from-bottom-2">
                                            {joinError}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <footer className="p-6 bg-muted/20 border-t border-border/40 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.1em]">
                                Requires a managed institution account • <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-primary hover:underline">Billing Docs</a>
                            </p>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleSelectionPage;
