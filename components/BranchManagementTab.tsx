import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { SchoolBranch, SchoolAdminProfileData } from '../types';
import Spinner from './common/Spinner';
import { SchoolIcon } from './icons/SchoolIcon';
import { PlusIcon } from './icons/PlusIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { CopyIcon } from './icons/CopyIcon';
import { KeyIcon } from './icons/KeyIcon';
import { ClockIcon } from './icons/ClockIcon';
import { EyeIcon } from './icons/EyeIcon';
import { EyeOffIcon } from './icons/EyeOffIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { XIcon } from './icons/XIcon';
import { BranchCreationPage } from './BranchCreationPage';
import ConfirmationModal from './common/ConfirmationModal';

interface BranchInvitation {
    code: string;
    expires_at: string;
    is_revoked: boolean;
}

const BranchCard: React.FC<{ 
    branch: SchoolBranch, 
    invitation?: BranchInvitation,
    isGenerating: boolean,
    onEdit: () => void, 
    onDelete: () => void,
    onGenerate: () => void,
    onRevoke: () => void 
}> = ({ branch, invitation, isGenerating, onEdit, onDelete, onGenerate, onRevoke }) => {
    const [copied, setCopied] = useState(false);
    const [revealed, setRevealed] = useState(false);

    const isExpired = invitation ? new Date(invitation.expires_at) < new Date() : false;
    const isActive = invitation && !invitation.is_revoked && !isExpired;
    // Normalized check for 'Active' or 'Linked' status
    const isLinked = branch.status === 'Linked' || branch.status === 'Active';

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!invitation) return;
        // Fix: Use navigator.clipboard instead of undefined 'labels'
        navigator.clipboard.writeText(invitation.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="group relative bg-card border border-border/60 hover:border-primary/40 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 flex flex-col min-h-[460px] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div className={`p-4 rounded-2xl shadow-inner transition-all duration-500 ${
                    isLinked ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 
                    branch.is_main_branch ? 'bg-primary text-white shadow-primary/20' : 
                    'bg-muted text-muted-foreground'
                }`}>
                    <SchoolIcon className="w-8 h-8"/>
                </div>
                <div className="flex gap-2">
                    <button onClick={onEdit} className="p-3 bg-muted/50 hover:bg-muted rounded-xl text-muted-foreground hover:text-primary transition-all shadow-sm"><EditIcon className="w-4 h-4" /></button>
                    {!branch.is_main_branch && <button onClick={onDelete} className="p-3 bg-red-500/10 hover:bg-red-500 rounded-xl text-red-500 hover:text-white transition-all shadow-sm"><TrashIcon className="w-4 h-4" /></button>}
                </div>
            </div>

            <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-2xl font-black text-foreground tracking-tight truncate uppercase font-serif">{branch.name}</h3>
                    {isLinked && <CheckCircleIcon className="w-5 h-5 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />}
                </div>
                <p className="text-sm text-muted-foreground font-bold flex items-center gap-1.5 uppercase tracking-widest text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30"></span>
                    {branch.city}, {branch.state}
                </p>
            </div>

            {/* Access Protocol Vault Area */}
            <div className="bg-[#0c0d12] rounded-3xl p-6 border border-white/5 space-y-5 flex-grow flex flex-col justify-center shadow-inner relative overflow-hidden group/vault">
                <div className="flex justify-between items-center relative z-10">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Access Protocol Vault</span>
                    {isActive ? (
                        <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Provisioned</span>
                    ) : isLinked ? (
                        <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Synchronized</span>
                    ) : (
                        <span className="text-[9px] font-bold text-white/20 bg-white/5 px-2 py-0.5 rounded-full border border-white/5 uppercase">Idle</span>
                    )}
                </div>

                {isActive ? (
                    <div className="space-y-4 animate-in fade-in duration-500 relative z-10">
                        <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/10 shadow-2xl group/key">
                            <span className="font-mono font-black text-primary tracking-[0.3em] text-lg select-all">
                                {revealed ? invitation.code : '••••••••••••'}
                            </span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setRevealed(!revealed)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
                                    {revealed ? <EyeOffIcon className="w-4 h-4"/> : <EyeIcon className="w-4 h-4"/>}
                                </button>
                                <button 
                                    onClick={handleCopy}
                                    className={`p-2.5 rounded-xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white/5 hover:bg-primary/20 text-white/40 hover:text-primary'}`}
                                >
                                    {copied ? <CheckCircleIcon className="w-4 h-4 animate-in zoom-in"/> : <CopyIcon className="w-4 h-4"/>}
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                    <ClockIcon className="w-3.5 h-3.5 opacity-50"/>
                                    Exp: {new Date(invitation.expires_at).toLocaleDateString()}
                                </div>
                                <button onClick={onRevoke} className="text-[9px] font-black text-red-500/60 hover:text-red-500 uppercase tracking-widest transition-colors">Revoke Key</button>
                            </div>
                        </div>
                    </div>
                ) : isLinked ? (
                    <div className="py-4 text-center space-y-5 animate-in zoom-in-95 duration-500 relative z-10">
                        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-[1.5rem] flex items-center justify-center mx-auto ring-8 ring-emerald-500/5 shadow-inner">
                            <ShieldCheckIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-white uppercase tracking-widest">Connection Active</p>
                            <p className="text-[10px] text-white/30 mt-1 uppercase font-bold tracking-widest">Identity Verified & Synced</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 py-2 relative z-10">
                        {isExpired && (
                            <div className="text-center p-3 bg-red-500/5 rounded-xl border border-red-500/10 mb-2 animate-in fade-in">
                                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center justify-center gap-2"><AlertTriangleIcon className="w-3 h-3"/> Protocol Expired</p>
                            </div>
                        )}
                        <button 
                            onClick={onGenerate} 
                            disabled={isGenerating}
                            className="w-full py-5 bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:transform-none transform active:scale-95 group/btn"
                        >
                            {isGenerating ? <Spinner size="sm" className="text-white"/> : <><KeyIcon className="w-5 h-5 group-hover/btn:rotate-12 transition-transform"/> Provision Access</>}
                        </button>
                        <p className="text-[10px] text-white/30 text-center font-bold uppercase tracking-widest px-4 leading-relaxed">Single Use Protocol • 7 Day Expiry</p>
                    </div>
                )}
                {/* Decorative Matrix Background */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none font-mono text-[8px] p-2 leading-none break-all select-none">
                    {Array.from({length: 40}).map((_,i) => <div key={i} className="mb-1">0x{Math.random().toString(16).slice(2, 24)}</div>)}
                </div>
            </div>

            {/* Connectivity Pipeline Stepper */}
            <div className="mt-8 pt-8 border-t border-border/50 flex flex-col gap-6">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em]">Connectivity Pipeline</span>
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-1.5">
                            {[1, 2, 3].map(i => {
                                const stepActive = isLinked ? true : (isActive ? i <= 2 : i <= 1);
                                return (
                                    <div key={i} className={`w-7 h-7 rounded-lg border-2 border-card flex items-center justify-center text-[10px] font-black transition-all duration-500 shadow-sm ${stepActive ? 'bg-primary text-white scale-110 z-10' : 'bg-muted text-muted-foreground/30'}`}>
                                        {isLinked && i === 3 ? '✓' : i}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 h-1.5 w-full bg-muted/40 rounded-full overflow-hidden p-0.5 shadow-inner">
                    <div className={`flex-1 rounded-full transition-all duration-700 bg-primary/80`}></div>
                    <div className={`flex-1 rounded-full transition-all duration-700 ${isActive || isLinked ? 'bg-primary/80' : 'bg-transparent'}`}></div>
                    <div className={`flex-1 rounded-full transition-all duration-700 ${isLinked ? 'bg-primary/80 shadow-[0_0_10px_rgba(var(--primary),0.5)]' : 'bg-transparent'}`}></div>
                </div>

                <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <UsersIcon className="w-4 h-4 opacity-40"/>
                        Synchronized Staff
                    </span>
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">{isLinked ? 'Synchronized' : isActive ? 'Authentication' : 'Provisioning'}</span>
                </div>
            </div>
        </div>
    );
};

interface BranchManagementTabProps {
    isHeadOfficeAdmin: boolean;
    branches: SchoolBranch[];
    isLoading: boolean;
    error: string | null;
    onBranchUpdate: (updatedBranch?: SchoolBranch, isDelete?: boolean) => void;
    onSelectBranch: (id: number) => void;
    schoolProfile: SchoolAdminProfileData | null;
}

export const BranchManagementTab: React.FC<BranchManagementTabProps> = ({ isHeadOfficeAdmin, branches, onBranchUpdate, schoolProfile }) => {
    const [invitations, setInvitations] = useState<Record<number, BranchInvitation>>({});
    const [generatingMap, setGeneratingMap] = useState<Record<number, boolean>>({});
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [branchToEdit, setBranchToEdit] = useState<SchoolBranch | null>(null);
    const [branchToDelete, setBranchToDelete] = useState<SchoolBranch | null>(null);

    const fetchInvitations = useCallback(async () => {
        // Fetch only active, non-redeemed invitations
        const { data, error } = await supabase
            .from('school_branch_invitations')
            .select('branch_id, code, expires_at, is_revoked')
            .eq('is_revoked', false)
            .is('redeemed_at', null);
        
        if (!error && data) {
            const map: Record<number, BranchInvitation> = {};
            data.forEach(inv => map[inv.branch_id] = inv);
            setInvitations(map);
        }
    }, []);

    useEffect(() => { 
        fetchInvitations(); 
    }, [fetchInvitations, branches]);

    const handleGenerateKey = async (branchId: number) => {
        setGeneratingMap(prev => ({ ...prev, [branchId]: true }));
        try {
            const { data, error } = await supabase.rpc('generate_branch_access_key', { 
                p_branch_id: branchId 
            });
            
            if (error) throw error;
            
            if (data && data.success) {
                await fetchInvitations();
                onBranchUpdate(); 
            } else {
                throw new Error(data?.message || 'Access allocation protocol error.');
            }
        } catch (e: any) {
            alert(`Link Protocol Error: ${e.message}`);
        } finally {
            setGeneratingMap(prev => ({ ...prev, [branchId]: false }));
        }
    };

    const handleRevokeKey = async (branchId: number) => {
        try {
            const { error } = await supabase.rpc('revoke_branch_access_key', { p_branch_id: branchId });
            if (error) throw error;
            await fetchInvitations();
            onBranchUpdate();
        } catch (e: any) {
            alert(`Revocation Failure: ${e.message}`);
        }
    };

    const handleDelete = async () => {
        if (!branchToDelete) return;
        try {
            const { error } = await supabase.rpc('delete_school_branch', { p_branch_id: branchToDelete.id });
            if (error) throw error;
            onBranchUpdate(branchToDelete, true);
            setBranchToDelete(null);
        } catch (e: any) {
            alert(`Deletion Failed: ${e.message}`);
        }
    };

    const activeSyncs = branches.filter(b => b.status === 'Linked' || b.status === 'Active').length;

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-40">
            {/* Enterprise Header with Telemetry */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 bg-card border border-border p-8 md:p-10 rounded-[3rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none"><ShieldCheckIcon className="w-64 h-64 text-foreground" /></div>
                <div className="relative z-10 flex-grow">
                    <h2 className="text-4xl md:text-5xl font-serif font-black text-foreground tracking-tight leading-none uppercase">Institutional Network</h2>
                    <p className="text-muted-foreground mt-4 text-lg font-medium max-w-2xl leading-relaxed">Centralized telemetry for satellite campuses. All portal access keys are AES-256 encrypted, time-bound, and single-use.</p>
                    
                    <div className="flex flex-wrap items-center gap-8 mt-10">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.25em]">Connected Nodes</span>
                            <span className="text-3xl font-black text-primary mt-1">{branches.length} <span className="text-sm font-bold text-muted-foreground/50 tracking-normal ml-1">/ {branches.length} Cap.</span></span>
                        </div>
                        <div className="w-px h-10 bg-border hidden sm:block"></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.25em]">Live Sync Active</span>
                            <span className="text-3xl font-black text-emerald-500 mt-1">{activeSyncs} <span className="text-sm font-bold text-muted-foreground/50 tracking-normal ml-1">Nodes</span></span>
                        </div>
                        <div className="w-px h-10 bg-border hidden sm:block"></div>
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.25em]">Encryption Level</span>
                            <span className="text-3xl font-black text-foreground mt-1">256-BIT <span className="text-sm font-bold text-emerald-500 tracking-normal ml-1 uppercase">Safe</span></span>
                        </div>
                    </div>
                </div>
                {isHeadOfficeAdmin && (
                    <button 
                        onClick={() => { setBranchToEdit(null); setIsCreateModalOpen(true); }}
                        className="relative z-10 px-10 py-5 bg-primary text-white font-black text-xs uppercase tracking-[0.25em] rounded-2xl shadow-2xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-3 transform hover:-translate-y-1 active:scale-95 group"
                    >
                        <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300"/> Expand Network
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {branches.map(branch => (
                    <BranchCard 
                        key={branch.id} 
                        branch={branch}
                        invitation={invitations[branch.id]}
                        isGenerating={!!generatingMap[branch.id]}
                        onEdit={() => { setBranchToEdit(branch); setIsCreateModalOpen(true); }}
                        onDelete={() => setBranchToDelete(branch)}
                        onGenerate={() => handleGenerateKey(branch.id)}
                        onRevoke={() => handleRevokeKey(branch.id)}
                    />
                ))}
            </div>

            {/* Modal for Branch Creation/Editing */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="bg-background w-full max-w-4xl rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[95vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b border-border bg-card/40 flex justify-between items-center">
                            <h3 className="text-2xl font-black text-foreground tracking-tight uppercase font-serif">{branchToEdit ? 'Configure Node' : 'Initialize New Node'}</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 rounded-full hover:bg-muted text-muted-foreground"><XIcon className="w-5 h-5"/></button>
                        </div>
                        <div className="overflow-y-auto flex-grow p-4 md:p-10">
                            <BranchCreationPage 
                                profile={branchToEdit ? undefined : (schoolProfile?.user_id ? { id: schoolProfile.user_id } as any : undefined)} 
                                onNext={() => { setIsCreateModalOpen(false); onBranchUpdate(); }} 
                            />
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal 
                isOpen={!!branchToDelete}
                onClose={() => setBranchToDelete(null)}
                onConfirm={handleDelete}
                title="Decommission Node"
                message={`Warning: You are about to decommission the "${branchToDelete?.name}" node. This action terminates all synchronized data pipelines for this campus.`}
                confirmText="Confirm Decommission"
                loading={false}
            />
        </div>
    );
};