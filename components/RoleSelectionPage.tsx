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
    onRoleSelect: (role: Role) => Promise<void> | void; // Changed to support Async
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
        color: 'text-emerald-500',
        gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
        shadow: 'group-hover:shadow-emerald-500/20',
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
        description: 'Coordinate student mobility, route efficiency, and real-time fleet safety.',
        color: 'text-amber-500',
        gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
        shadow: 'group-hover:shadow-amber-500/20',
    },
    [BuiltInRoles.ECOMMERCE_OPERATOR]: {
        label: 'Marketplace Lead',
        description: 'Oversee institutional inventory, digital sales, and campus supply chains.',
        color: 'text-indigo-500',
        gradient: 'from-indigo-500/20 via-violet-500/10 to-transparent',
        shadow: 'group-hover:shadow-indigo-500/20',
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

    const displayRoles = roles.filter(r => ROLE_META[r]);

    const handleRoleClick = (role: Role) => {
        if (selectedRole || createLoading || joinLoading) return;
        
        setSelectedRole(role);

        if (role === BuiltInRoles.SCHOOL_ADMINISTRATION) {
            // Subtle delay for feedback feel before showing decision modal
            setTimeout(() => {
                setIsSchoolAdminModalOpen(true);
                setSelectedRole(null);
            }, 300);
        } else {
             onRoleSelect(role);
        }
    };

    const handleCreateNewSchool = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (createLoading) return;
        setCreateLoading(true);
        try {
            // Wait for the parent to handle the database initialization
            await onRoleSelect(BuiltInRoles.SCHOOL_ADMINISTRATION);
            // On success, the parent component should handle the unmount/switch
        } catch (err) {
            // If it fails, restore the button so the user can try again
            setCreateLoading(false);
        }
    }

    const handleJoinBranch = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!invitationCode.trim() || joinLoading) return;

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
                setJoinError(data.message || 'Verification failed.');
                setJoinLoading(false);
            }
        } catch (err: any) {
            setJoinError(err.message || "Invitation error.");
            setJoinLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Spinner size="lg" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Initializing Identity Engine</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <header className="text-center mb-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <h1 className="text-4xl md:text-6xl font-serif font-black text-foreground tracking-tight mb-4">
                    Select Your Portal
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
                    Choose the correct identity to access your personalized institutional environment.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayRoles.map((name, idx) => {
                    const meta = ROLE_META[name];
                    const Icon = ROLE_ICONS[name];
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
                                    <h3 className={`text-2xl font-black tracking-tight transition-colors duration-300 ${isProcessing ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>
                                        {meta.label}
                                    </h3>
                                    <p className="text-sm text-muted-foreground font-medium leading-relaxed transition-colors group-hover:text-foreground/80">
                                        {meta.description}
                                    </p>
                                </div>

                                <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 text-primary">
                                    Initialize Portal <span className="text-lg leading-none">&rarr;</span>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {isSchoolAdminModalOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-center z-[100] p-4 animate-in fade-in duration-300" onClick={() => !createLoading && setIsSchoolAdminModalOpen(false)}>
                    <div className="bg-card w-full max-w-4xl rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col md:flex-row h-full min-h-[500px]">
                            
                            <button 
                                onClick={handleCreateNewSchool}
                                disabled={createLoading}
                                className="flex-1 p-12 text-center group relative overflow-hidden transition-all hover:bg-primary/5 disabled:opacity-50"
                            >
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner border border-primary/20">
                                        {createLoading ? <Spinner size="lg" className="text-primary"/> : <SchoolIcon className="w-12 h-12 text-primary" />}
                                    </div>
                                    <h3 className="text-3xl font-serif font-black text-foreground tracking-tight mb-4">Establish New School</h3>
                                    <p className="text-muted-foreground max-w-xs mx-auto text-sm font-medium leading-relaxed">
                                        Perfect for new institutional networks. Set up your headquarters and initial infrastructure.
                                    </p>
                                    <div className="mt-10 inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/25 hover:scale-105 transition-all">
                                        {createLoading ? 'Provisioning...' : 'Get Started'}
                                    </div>
                                </div>
                            </button>

                            <div className="w-px bg-border/60 self-stretch hidden md:block" />
                            <div className="h-px bg-border/60 self-stretch md:hidden" />

                            <div className="flex-1 p-12 text-center bg-muted/20 relative">
                                <div className="flex flex-col items-center">
                                    <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-8 shadow-inner border border-blue-500/20">
                                        <UsersIcon className="w-12 h-12 text-blue-600" />
                                    </div>
                                    <h3 className="text-3xl font-serif font-black text-foreground tracking-tight mb-4">Join Existing Group</h3>
                                    <p className="text-muted-foreground max-w-xs mx-auto text-sm font-medium leading-relaxed mb-10">
                                        Received an invitation? Enter your secure branch code below to link your account.
                                    </p>

                                    <div className="w-full max-w-xs space-y-4">
                                        <input 
                                            type="text"
                                            value={invitationCode}
                                            onChange={e => setInvitationCode(e.target.value.toUpperCase())}
                                            placeholder="INVITATION CODE"
                                            className="w-full px-6 py-4 bg-background border-2 border-border rounded-2xl text-center font-mono font-bold tracking-[0.2em] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                        />
                                        <button 
                                            onClick={handleJoinBranch}
                                            disabled={joinLoading || !invitationCode}
                                            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/25 hover:bg-blue-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {joinLoading ? <Spinner size="sm" className="text-white"/> : 'Verify & Access'}
                                        </button>
                                        {joinError && <p className="text-red-500 text-[10px] font-black uppercase tracking-wider animate-in fade-in duration-300 mt-2">{joinError}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleSelectionPage;
