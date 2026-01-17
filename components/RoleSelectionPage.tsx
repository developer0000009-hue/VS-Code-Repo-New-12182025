
import React, { useState, useEffect } from 'react';
import { Role, BuiltInRoles } from '../types';
import { ROLE_ICONS, ROLE_ORDER } from '../constants';
import { useRoles } from '../contexts/RoleContext';
import Spinner from './common/Spinner';
import { supabase } from '../services/supabase';
import { XIcon } from './icons/XIcon';
import { SchoolIcon } from './icons/SchoolIcon';
import { UsersIcon } from './icons/UsersIcon';
import { InfoIcon } from './icons/InfoIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';

interface RoleSelectionPageProps {
    onRoleSelect: (role: Role) => Promise<void> | void;
    onComplete: () => void;
}

const ROLE_META: Record<string, { label: string; description: string; color: string; gradient: string; shadow: string }> = {
    [BuiltInRoles.SCHOOL_ADMINISTRATION]: {
        label: 'School Administration',
        description: 'Govern institutional operations, multi-branch strategy, and global oversight.',
        color: 'text-purple-500',
        gradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
        shadow: 'group-hover:shadow-purple-500/20',
    },
    [BuiltInRoles.PRINCIPAL]: {
        label: 'Principal / Director',
        description: 'Lead academic excellence and oversee institutional growth and faculty development.',
        color: 'text-indigo-500',
        gradient: 'from-indigo-500/20 via-blue-500/10 to-transparent',
        shadow: 'group-hover:shadow-indigo-500/20',
    },
    [BuiltInRoles.HR_MANAGER]: {
        label: 'HR Management',
        description: 'Manage human capital, recruitment, and organizational compliance.',
        color: 'text-cyan-500',
        gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
        shadow: 'group-hover:shadow-cyan-500/20',
    },
    [BuiltInRoles.ACADEMIC_COORDINATOR]: {
        label: 'Academic Coordinator',
        description: 'Synchronize curriculum delivery and maintain pedagogical standards.',
        color: 'text-amber-500',
        gradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
        shadow: 'group-hover:shadow-amber-500/20',
    },
    [BuiltInRoles.ACCOUNTANT]: {
        label: 'Financial Controller',
        description: 'Oversee fiscal health, fee collections, and institutional financial reporting.',
        color: 'text-emerald-500',
        gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
        shadow: 'group-hover:shadow-emerald-500/20',
    },
    [BuiltInRoles.TEACHER]: {
        label: 'Faculty Member',
        description: 'Empower students, manage dynamic classrooms, and curate learning experiences.',
        color: 'text-blue-500',
        gradient: 'from-blue-500/20 via-cyan-500/10 to-transparent',
        shadow: 'group-hover:shadow-blue-500/20',
    },
    [BuiltInRoles.STUDENT]: {
        label: 'Student Portal',
        description: 'Access your academic timeline, assignments, and digital learning resources.',
        color: 'text-teal-500',
        gradient: 'from-teal-500/20 via-emerald-500/10 to-transparent',
        shadow: 'group-hover:shadow-teal-500/20',
    },
    [BuiltInRoles.PARENT_GUARDIAN]: {
        label: 'Parent / Guardian',
        description: 'Partner in your child\'s educational journey and manage family institutional needs.',
        color: 'text-rose-500',
        gradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
        shadow: 'group-hover:shadow-rose-500/20',
    },
    [BuiltInRoles.TRANSPORT_STAFF]: {
        label: 'Transport Operations',
        description: 'Manage logistical operations, routes, and student transit safety.',
        color: 'text-slate-500',
        gradient: 'from-slate-500/20 via-zinc-500/10 to-transparent',
        shadow: 'group-hover:shadow-slate-500/20',
    },
    [BuiltInRoles.ECOMMERCE_OPERATOR]: {
        label: 'E-commerce Operator',
        description: 'Administer the institutional storefront, inventory, and supply chain.',
        color: 'text-pink-500',
        gradient: 'from-pink-500/20 via-rose-500/10 to-transparent',
        shadow: 'group-hover:shadow-pink-500/20',
    },
};

const RoleSelectionPage: React.FC<RoleSelectionPageProps> = ({ onRoleSelect, onComplete }) => {
    const { roles, loading } = useRoles();
    const [isSchoolAdminModalOpen, setIsSchoolAdminModalOpen] = useState(false);
    const [joinLoading, setJoinLoading] = useState(false);
    const [joinSuccess, setJoinSuccess] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);
    const [invitationCode, setInvitationCode] = useState('');
    const [selectedRole, setSelectedRole] = useState<string | null>(null);

    // Filter roles based on the metadata we have defined
    const displayRoles = roles.filter(r => ROLE_META[r]);

    const handleRoleClick = (role: Role) => {
        if (selectedRole || createLoading || joinLoading) return;
        
        setSelectedRole(role);

        if (role === BuiltInRoles.SCHOOL_ADMINISTRATION) {
            setTimeout(() => {
                setIsSchoolAdminModalOpen(true);
                setSelectedRole(null);
            }, 300);
        } else {
             Promise.resolve(onRoleSelect(role)).catch(() => setSelectedRole(null));
        }
    };

    const handleCreateNewSchool = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (createLoading) return;
        setCreateLoading(true);
        try {
            await onRoleSelect(BuiltInRoles.SCHOOL_ADMINISTRATION);
        } catch (err) {
            setCreateLoading(false);
        }
    }

    const handleJoinBranch = async (e: React.MouseEvent) => {
        e.preventDefault();
        const code = invitationCode.trim().toUpperCase();
        
        if (code.length < 8 || joinLoading) return;

        setJoinLoading(true);
        setJoinError(null);
        
        try {
            const { data, error } = await supabase.rpc('verify_and_link_branch_admin', { 
                p_invitation_code: code 
            });
            
            if (error) throw error;
            
            if (data.success) {
                setJoinSuccess(true);
                setInvitationCode('');
                setTimeout(() => {
                    onComplete();
                }, 1500);
            } else {
                setJoinError(data.message || 'The Access Key provided is invalid, expired, or not authorized for this identity.');
                setJoinLoading(false);
            }
        } catch (err: any) {
            setJoinError(err.message || "An unexpected error occurred during institutional verification.");
            setJoinLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Spinner size="lg" />
                <p className="text-xs font-black uppercase text-muted-foreground animate-pulse tracking-[0.2em]">Recalling Identity Matrix</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1600px] mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <header className="text-center mb-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <h1 className="text-4xl md:text-6xl font-serif font-black text-foreground tracking-tight mb-4">
                    Select Your Portal
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
                    Access your personalized institutional environment or initialize a new node.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                {displayRoles.map((name, idx) => {
                    const meta = ROLE_META[name];
                    const Icon = ROLE_ICONS[name] || UsersIcon;
                    const isProcessing = selectedRole === name;
                    const isFaded = selectedRole && selectedRole !== name;

                    return (
                        <button
                            key={name}
                            onClick={() => handleRoleClick(name)}
                            disabled={!!selectedRole || createLoading}
                            aria-pressed={isProcessing}
                            style={{ animationDelay: `${idx * 100}ms` }}
                            className={`
                                group relative flex flex-col items-start text-left p-8 rounded-[2.5rem] border-2 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden animate-in fade-in slide-in-from-bottom-10
                                ${isProcessing 
                                    ? 'border-primary ring-4 ring-primary/10 bg-card scale-[0.98] shadow-2xl z-10' 
                                    : isFaded 
                                        ? 'opacity-30 scale-95 grayscale' 
                                        : 'bg-card/60 backdrop-blur-xl border-white/5 hover:border-primary/40 hover:shadow-2xl hover:-translate-y-2'
                                }
                            `}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                            
                            <div className="relative z-10 w-full">
                                <div className={`
                                    w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-inner transition-all duration-500 group-hover:scale-110 group-hover:rotate-3
                                    ${isProcessing ? 'bg-primary text-white shadow-lg' : `bg-muted/80 ${meta.color} group-hover:bg-white dark:group-hover:bg-black group-hover:shadow-md`}
                                `}>
                                    {isProcessing ? <Spinner size="sm" className="text-white" /> : <Icon className="w-8 h-8" />}
                                </div>

                                <div className="space-y-3">
                                    <h3 className={`text-xl font-black tracking-tight transition-colors duration-300 ${isProcessing ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>
                                        {meta.label}
                                    </h3>
                                    <p className="text-xs text-muted-foreground font-medium leading-relaxed transition-colors group-hover:text-foreground/80">
                                        {meta.description}
                                    </p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {isSchoolAdminModalOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-center z-[100] p-4 animate-in fade-in duration-300" onClick={() => !createLoading && !joinLoading && setIsSchoolAdminModalOpen(false)}>
                    <div className="bg-card w-full max-w-4xl rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col md:flex-row h-full min-h-[500px]">
                            
                            <button 
                                onClick={handleCreateNewSchool}
                                disabled={createLoading || joinLoading}
                                className="flex-1 p-12 text-center group relative overflow-hidden transition-all hover:bg-primary/5 disabled:opacity-50"
                            >
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner border border-primary/20">
                                        {createLoading ? <Spinner size="lg" className="text-primary"/> : <SchoolIcon className="w-12 h-12 text-primary" />}
                                    </div>
                                    <h3 className="text-3xl font-serif font-black text-foreground tracking-tight mb-4">Establish New School</h3>
                                    <p className="text-muted-foreground max-w-xs mx-auto text-sm font-medium leading-relaxed">
                                        Initialize a head office and set up global academic infrastructure.
                                    </p>
                                    <div className={`mt-10 inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-xl transition-all ${createLoading ? 'bg-primary/70 animate-pulse cursor-wait' : 'bg-primary hover:scale-105 shadow-primary/25'}`}>
                                        {createLoading ? 'Provisioning Hub...' : 'Get Started'}
                                    </div>
                                </div>
                            </button>

                            <div className="w-px bg-border/60 self-stretch hidden md:block" />
                            <div className="h-px bg-border/60 self-stretch md:hidden" />

                            <div className="flex-1 p-12 text-center bg-muted/20 relative flex flex-col">
                                <div className="flex flex-col items-center flex-grow">
                                    <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mb-8 shadow-inner border border-indigo-500/20">
                                        {joinSuccess ? <CheckCircleIcon className="w-12 h-12 text-emerald-500 animate-in zoom-in" /> : <ShieldCheckIcon className="w-12 h-12 text-indigo-600" />}
                                    </div>
                                    <h3 className="text-3xl font-serif font-black text-foreground tracking-tight mb-4">Join Existing Group</h3>
                                    
                                    {joinSuccess ? (
                                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            <p className="text-emerald-600 font-bold text-lg mb-2">Handshake Secured!</p>
                                            <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-xs mx-auto">
                                                Linking your identity to the branch node. Initializing workstation...
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-muted-foreground max-w-xs mx-auto text-sm font-medium leading-relaxed mb-10">
                                                Use a branch access key provided by your institution administrator. <span className="text-primary font-bold">This is not a student enrollment code.</span>
                                            </p>

                                            <div className="w-full max-w-xs space-y-4">
                                                <div className="relative group">
                                                    <input 
                                                        type="text"
                                                        value={invitationCode}
                                                        onChange={e => setInvitationCode(e.target.value.toUpperCase())}
                                                        disabled={joinLoading}
                                                        placeholder="ENTER ACCESS KEY"
                                                        className="w-full px-6 py-4 bg-background border-2 border-border rounded-2xl text-center font-mono font-black tracking-[0.2em] text-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-50 placeholder:text-muted-foreground/30 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
                                                    />
                                                </div>
                                                
                                                <button 
                                                    onClick={handleJoinBranch}
                                                    disabled={joinLoading || invitationCode.length < 8}
                                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/25 hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 disabled:grayscale"
                                                >
                                                    {joinLoading ? <Spinner size="sm" className="text-white"/> : 'Verify & Access Node'}
                                                </button>
                                                
                                                <div className="flex flex-col gap-3">
                                                    {joinError && (
                                                        <p className="text-red-500 text-[10px] font-black uppercase tracking-wider animate-in shake duration-300 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                                            {joinError}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center justify-center gap-2 text-muted-foreground/40 group/help cursor-help">
                                                        <InfoIcon className="w-3.5 h-3.5 group-hover/help:text-indigo-500 transition-colors" />
                                                        <span className="text-[9px] font-bold uppercase tracking-widest group-hover/help:text-muted-foreground transition-colors">Access protocol help</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                
                                <p className="text-[9px] text-muted-foreground/30 uppercase tracking-[0.3em] mt-8 font-black text-center">
                                    Institutional Handshake Gateway
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleSelectionPage;
