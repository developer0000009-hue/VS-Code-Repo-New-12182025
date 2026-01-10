import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, formatError } from '../../services/supabase';
import { ShareCode, AdmissionApplication, ShareCodeType } from '../../types';
import Spinner from '../common/Spinner';
import { KeyIcon } from '../icons/KeyIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { RefreshIcon } from '../icons/RefreshIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { MailIcon } from '../icons/MailIcon';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { FileTextIcon } from '../icons/FileTextIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { LockIcon } from '../icons/LockIcon';
import { EyeIcon } from '../icons/EyeIcon';
import { EyeOffIcon } from '../icons/EyeOffIcon';
import { CopyIcon } from '../icons/CopyIcon';
import PremiumAvatar from '../common/PremiumAvatar';

export default function ShareCodesTab() {
    const [codes, setCodes] = useState<ShareCode[]>([]);
    const [myApplications, setMyApplications] = useState<AdmissionApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [focusedPermitId, setFocusedPermitId] = useState<string | null>(null);
    const [copyFeedback, setCopyFeedback] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // Provisioning Flow State
    const [selectedAdmissionId, setSelectedAdmissionId] = useState<string>('');
    const [permitType, setPermitType] = useState<ShareCodeType | null>(null);

    const fetchData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        setError(null);
        try {
            const [appsRes, codesRes] = await Promise.all([
                supabase.rpc('get_my_children_profiles'),
                supabase.rpc('get_my_share_codes')
            ]);

            if (appsRes.error) throw appsRes.error;
            if (codesRes.error) throw codesRes.error;

            const appsData = appsRes.data || [];
            const codesData = codesRes.data || [];

            setMyApplications(appsData);
            setCodes(codesData);
            
            if (!selectedAdmissionId && appsData.length > 0) {
                setSelectedAdmissionId(appsData[0].id);
            }
        } catch (err: any) {
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    }, [selectedAdmissionId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleGenerate = async () => {
        if (!selectedAdmissionId || !permitType || actionLoading) return;

        setActionLoading(true);
        setError(null);
        
        try {
            const { data, error: rpcError } = await supabase.rpc('generate_admission_share_code', {
                p_admission_id: selectedAdmissionId, 
                p_purpose: 'Institutional Handshake',
                p_code_type: permitType, 
            });

            if (rpcError) throw rpcError;

            // Handle both string and object responses from RPC
            const generatedCode = typeof data === 'string' ? data : (data?.code || data?.p_code);
            
            await fetchData(true);
            
            // Auto-focus the newly created code
            if (generatedCode) {
                const { data: latestCodes } = await supabase.rpc('get_my_share_codes');
                if (latestCodes && latestCodes.length > 0) {
                    const newPermit = latestCodes.find((c: any) => c.code === generatedCode);
                    if (newPermit) setFocusedPermitId(newPermit.id);
                }
            }
            setPermitType(null); 
        } catch (err: any) {
            setError(formatError(err));
        } finally {
            setActionLoading(false);
        }
    };

    const handleRevoke = async (id: string) => {
        if (!confirm("Terminate this permit immediately? It will be decommissioned from all registries and portals.")) return;
        setActionLoading(true);
        setError(null);
        try {
            const { error: rpcError } = await supabase.rpc('revoke_my_share_code', { p_code_id: id });
            if (rpcError) throw rpcError;
            
            await fetchData(true);
            setFocusedPermitId(null);
        } catch (err: any) {
            setError(formatError(err));
        } finally {
            setActionLoading(false);
        }
    };

    const handleCopy = (code: string) => {
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    };

    const { activeCodes, inactiveCodes } = useMemo(() => {
        const sorted = [...codes].sort((a, b) => new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime());
        return {
            activeCodes: sorted.filter(c => c.status === 'Active'),
            inactiveCodes: sorted.filter(c => c.status !== 'Active')
        };
    }, [codes]);

    const focusedPermit = useMemo(() => 
        codes.find(c => c.id === focusedPermitId), 
    [codes, focusedPermitId]);

    const isReadyToActivate = !!(selectedAdmissionId && permitType);

    if (loading && codes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
                <Spinner size="lg" className="text-primary"/>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 animate-pulse">Syncing Cryptographic Vault</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1700px] mx-auto space-y-12 animate-in fade-in duration-1000 pb-32">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
                <div className="max-w-4xl space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20 shadow-inner">
                            <ShieldCheckIcon className="w-5 h-5"/>
                        </div>
                        <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em] pl-2 border-l border-primary/20">Security Access Module</span>
                    </div>
                    <h2 className="text-[clamp(40px,4vw,60px)] font-serif font-black text-white tracking-tighter leading-none uppercase">
                        DIGITAL <span className="text-white/30 font-normal italic lowercase">permits.</span>
                    </h2>
                    <p className="text-white/40 text-[18px] leading-relaxed font-serif italic max-w-2xl border-l border-white/5 pl-8">
                        Provision temporary high-fidelity access tokens for institutional verification and secure enrolment handshakes.
                    </p>
                </div>
                <button 
                    onClick={() => fetchData()} 
                    disabled={actionLoading}
                    className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] text-white/40 hover:text-white transition-all border border-white/5 group active:scale-95 shadow-2xl disabled:opacity-50"
                >
                    <RefreshIcon className={`w-6 h-6 ${actionLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-8 rounded-[2.5rem] flex items-center gap-6 animate-in shake shadow-2xl ring-1 ring-red-500/20">
                    <AlertTriangleIcon className="w-8 h-8 shrink-0" />
                    <div className="flex-1">
                        <p className="text-[11px] font-black uppercase tracking-widest mb-1 opacity-60">Protocol Interruption</p>
                        <p className="text-sm font-bold uppercase tracking-widest leading-relaxed">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="p-2 hover:bg-red-500/10 rounded-full transition-colors"><XCircleIcon className="w-6 h-6"/></button>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch min-h-[800px]">
                
                {/* --- LEFT: PROVISIONING WIZARD --- */}
                <div className="xl:col-span-4 flex flex-col">
                    <div className="bg-[#0a0a0c]/80 backdrop-blur-3xl border border-white/5 p-10 rounded-[3.5rem] shadow-2xl space-y-12 flex flex-col h-full ring-1 ring-white/5 relative overflow-hidden">
                        <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none opacity-40"></div>
                        
                        {/* Step 1: Select Node */}
                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/40 shadow-inner">01</div>
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Target Identity Node</label>
                            </div>
                            <div className="space-y-2.5 max-h-[350px] overflow-y-auto custom-scrollbar pr-3">
                                {myApplications.length === 0 ? (
                                    <div className="py-12 text-center text-white/20 border border-dashed border-white/5 rounded-3xl">
                                        <p className="text-[10px] font-black uppercase tracking-widest">No Active Nodes</p>
                                    </div>
                                ) : myApplications.map(app => (
                                    <button
                                        key={app.id} 
                                        onClick={() => setSelectedAdmissionId(app.id)}
                                        className={`w-full flex items-center gap-5 p-5 rounded-[2rem] border transition-all duration-500 group/item ${selectedAdmissionId === app.id ? 'bg-primary/10 border-primary ring-4 ring-primary/5 shadow-xl' : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'}`}
                                    >
                                        <PremiumAvatar src={app.profile_photo_url} name={app.applicant_name} size="xs" className="w-12 h-12 shadow-lg" />
                                        <div className="text-left min-w-0 flex-grow">
                                            <p className={`font-serif font-black text-base truncate transition-colors ${selectedAdmissionId === app.id ? 'text-white' : 'text-white/40 group-hover/item:text-white/60'}`}>{app.applicant_name}</p>
                                            <p className="text-[8px] text-white/20 font-black uppercase mt-1 tracking-[0.2em]">Grade {app.grade} Cluster</p>
                                        </div>
                                        {selectedAdmissionId === app.id && <CheckCircleIcon className="w-5 h-5 text-primary animate-in zoom-in duration-300" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Step 2: Define Scope */}
                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/40 shadow-inner">02</div>
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Access Protocol Scope</label>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { id: 'Enquiry', label: 'Enquiry Level', desc: 'Temporary metadata visibility only.', icon: <MailIcon className="w-5 h-5"/> },
                                    { id: 'Admission', label: 'Admission Level', desc: 'Full document vault & ledger access.', icon: <DocumentTextIcon className="w-5 h-5"/> }
                                ].map(type => (
                                    <button
                                        key={type.id} 
                                        onClick={() => setPermitType(type.id as ShareCodeType)}
                                        className={`p-7 rounded-[2.5rem] border transition-all duration-500 flex items-center gap-6 group/type ${permitType === type.id ? 'bg-primary/10 border-primary shadow-2xl ring-2 ring-primary/5' : 'bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.02]'}`}
                                    >
                                        <div className={`p-4 rounded-2xl transition-all duration-700 shadow-inner ${permitType === type.id ? 'bg-primary text-white scale-110 rotate-3' : 'bg-white/5 text-white/10 group-hover:type:text-white/30'}`}>{type.icon}</div>
                                        <div className="text-left flex-grow">
                                            <h4 className={`text-sm font-black uppercase tracking-widest ${permitType === type.id ? 'text-primary' : 'text-white/50 group-hover:type:text-white/70'}`}>{type.label}</h4>
                                            <p className="text-[11px] text-white/20 mt-1.5 font-serif italic leading-relaxed">{type.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-auto pt-6 relative z-10">
                            <button 
                                onClick={handleGenerate} 
                                disabled={!isReadyToActivate || actionLoading}
                                className={`w-full py-6 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.5em] transition-all duration-500 flex items-center justify-center gap-4 shadow-2xl ${isReadyToActivate && !actionLoading ? 'bg-primary text-white shadow-primary/25 hover:bg-primary/90 transform hover:-translate-y-1 active:scale-95' : 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5'}`}
                            >
                                {actionLoading ? <Spinner size="sm" className="text-current" /> : 'INITIALIZE PERMIT'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- MIDDLE: ARTIFACT REGISTRY --- */}
                <div className="xl:col-span-3 flex flex-col space-y-8">
                    <div className="flex justify-between items-center px-4">
                        <h3 className="text-xl font-serif font-black text-white tracking-tighter uppercase leading-none">ARTIFACT <span className="text-white/20 italic">registry.</span></h3>
                        <div className="flex items-center gap-3">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                             <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{activeCodes.length} LIVE</span>
                        </div>
                    </div>

                    <div className="space-y-4 overflow-y-auto max-h-[850px] custom-scrollbar pr-3 flex-grow">
                        {activeCodes.length === 0 ? (
                            <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3.5rem] opacity-30 flex flex-col items-center justify-center bg-black/20">
                                <KeyIcon className="w-12 h-12 mx-auto mb-8 text-white/20" />
                                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white italic">IDLE.</p>
                            </div>
                        ) : (
                            activeCodes.map(code => (
                                <button 
                                    key={code.id} 
                                    onClick={() => setFocusedPermitId(code.id)}
                                    className={`w-full text-left p-7 rounded-[2.5rem] border transition-all duration-700 group relative overflow-hidden ${focusedPermitId === code.id ? 'bg-[#14161d] border-primary shadow-2xl z-10 scale-[1.02]' : 'bg-[#0a0a0c]/60 border-white/5 border-white/10'}`}
                                >
                                    <div className="flex items-center gap-5 relative z-10">
                                        <div className="relative shrink-0">
                                            <PremiumAvatar src={code.profile_photo_url} name={code.applicant_name} size="xs" className="w-14 h-14 shadow-xl border border-white/10" />
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-[#0c0d12] shadow-lg animate-pulse"></div>
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className={`font-serif font-black text-lg text-white transition-colors duration-700 leading-tight mb-1 truncate ${focusedPermitId === code.id ? 'text-primary' : 'group-hover:text-primary'}`}>{code.applicant_name}</h4>
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{code.code_type} SCOPE</p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}

                        <div className="pt-10 border-t border-white/5 mt-auto">
                            <button 
                                onClick={() => setShowHistory(!showHistory)}
                                className={`w-full flex items-center justify-between px-8 py-5 rounded-[2rem] bg-white/[0.02] hover:bg-white/[0.05] transition-all group border border-white/5 ${showHistory ? 'border-primary/20 bg-primary/5' : ''}`}
                            >
                                <span className={`text-[10px] font-black uppercase tracking-[0.3em] transition-colors ${showHistory ? 'text-primary' : 'text-white/20 group-hover:text-white/40'}`}>Registry Archives</span>
                                <ChevronDownIcon className={`w-5 h-5 transition-all duration-500 ${showHistory ? 'rotate-180 text-primary' : 'text-white/20'}`} />
                            </button>
                            
                            {showHistory && (
                                <div className="mt-5 space-y-3 animate-in slide-in-from-top-4 duration-500">
                                    {inactiveCodes.map(code => (
                                        <div key={code.id} className="flex items-center justify-between p-6 rounded-[1.8rem] bg-black/60 border border-white/5 opacity-40 grayscale hover:grayscale-0 hover:opacity-70 transition-all shadow-inner">
                                            <div className="flex items-center gap-4">
                                                <PremiumAvatar src={code.profile_photo_url} name={code.applicant_name} size="xs" className="w-10 h-10 border border-white/5" />
                                                <div>
                                                    <p className="text-[10px] font-black text-white uppercase tracking-wider truncate max-w-[120px]">{code.applicant_name}</p>
                                                    <p className="text-[8px] font-bold text-white/20 uppercase mt-0.5 tracking-tighter">{code.status}</p>
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-mono font-black text-white/30 tracking-widest">{code.code}</span>
                                        </div>
                                    ))}
                                    {inactiveCodes.length === 0 && <p className="text-center py-10 text-[10px] font-black text-white/10 uppercase tracking-[0.4em] border border-dashed border-white/5 rounded-3xl">No records.</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- RIGHT: THE PERMIT CARD --- */}
                <div className="xl:col-span-5 flex flex-col">
                    <div className="bg-[#0F1116] border border-white/5 rounded-[2.5rem] flex flex-col shadow-[0_12px_30px_rgba(0,0,0,0.45)] relative overflow-hidden h-full ring-1 ring-white/5">
                        
                        {focusedPermit ? (
                            <div className="h-full flex flex-col animate-in fade-in duration-700 relative">
                                {/* Header Section */}
                                <div className="p-8 pb-6 flex items-center justify-between z-20">
                                    <div className="flex items-center gap-4">
                                        <PremiumAvatar 
                                            src={focusedPermit.profile_photo_url} 
                                            name={focusedPermit.applicant_name} 
                                            size="sm" 
                                            className="shadow-xl border border-white/10" 
                                        />
                                        <div className="min-w-0">
                                            <h4 className="text-[15px] font-semibold text-white truncate leading-tight uppercase tracking-tight">{focusedPermit.applicant_name}</h4>
                                            <p className="text-[11px] text-[#9AA3B2] uppercase font-bold tracking-widest mt-1">Grade Node Owner</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shadow-sm animate-in zoom-in-95">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"></div>
                                        <span className="text-[10px] font-black text-[#22C55E] uppercase tracking-widest">Active</span>
                                    </div>
                                </div>

                                {/* Main Permit Code Section (Dominant) */}
                                <div className="px-8 flex-shrink-0">
                                    <div 
                                        className="bg-[#141726] border border-dashed border-white/10 rounded-2xl p-10 md:p-14 text-center group cursor-pointer active:scale-95 transition-all relative overflow-hidden ring-1 ring-inset ring-white/5"
                                        onClick={() => handleCopy(focusedPermit.code)}
                                    >
                                        <p className="text-[11px] font-black text-[#9AA3B2] uppercase tracking-[0.4em] mb-8 relative z-10">Access Permit Code</p>
                                        
                                        <div className="relative inline-block">
                                            <span className={`font-mono font-black text-[38px] md:text-[46px] tracking-[0.25em] transition-all duration-700 relative z-10 select-all block ${copyFeedback ? 'text-[#22C55E] scale-110' : 'text-[#F2F4F8] group-hover:text-primary'}`}>
                                                {focusedPermit.code}
                                            </span>
                                            <div className={`absolute inset-0 blur-[60px] opacity-10 transition-opacity duration-1000 ${copyFeedback ? 'bg-[#22C55E] opacity-40' : 'bg-primary/20 group-hover:opacity-40'}`}></div>
                                        </div>

                                        <div className="mt-10 flex items-center justify-center gap-3 relative z-10">
                                             <button 
                                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${copyFeedback ? 'bg-[#22C55E] text-white shadow-lg' : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/5'}`}
                                            >
                                                {copyFeedback ? <CheckCircleIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4"/>}
                                                {copyFeedback ? 'Copied Artifact' : 'Copy Access Code'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Metadata Grid */}
                                <div className="p-8 md:p-10 flex-grow grid grid-cols-2 gap-x-10 gap-y-8 relative z-10">
                                    <div className="space-y-1.5">
                                        <p className="text-[11px] font-black text-[#9AA3B2] uppercase tracking-[0.2em]">Permit Mode</p>
                                        <p className="text-sm font-medium text-[#F2F4F8] uppercase tracking-wide">{focusedPermit.code_type} Verification</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[11px] font-black text-[#9AA3B2] uppercase tracking-[0.2em]">Data Scope</p>
                                        <p className="text-sm font-medium text-[#F2F4F8] uppercase tracking-wide">{focusedPermit.code_type === 'Admission' ? 'Vault Access' : 'Enquiry Context'}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[11px] font-black text-[#9AA3B2] uppercase tracking-[0.2em]">Issued On</p>
                                        <p className="text-sm font-medium text-[#F2F4F8]">{new Date().toLocaleDateString(undefined, { dateStyle: 'medium'})}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[11px] font-black text-[#9AA3B2] uppercase tracking-[0.2em]">Expiry Date</p>
                                        <p className="text-sm font-medium text-[#F2F4F8]">{new Date(focusedPermit.expires_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                    </div>
                                    
                                    <div className="col-span-full pt-4 flex flex-col gap-3">
                                        <div className="flex items-center gap-2 text-[11px] text-[#6B7280] font-medium italic">
                                            <ShieldCheckIcon className="w-4 h-4 opacity-50" />
                                            <span>Token encrypted using AES-256 protocol.</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-[#6B7280] font-medium italic">
                                            <ClockIcon className="w-4 h-4 opacity-50" />
                                            <span>Artifact auto-expires in 7 days or upon redemption.</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-[#6B7280] font-medium italic">
                                            <FileTextIcon className="w-4 h-4 opacity-50" />
                                            <span>Logged & auditable institutional artifact.</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="p-8 border-t border-white/5 bg-[#0A0A0E] flex flex-col sm:flex-row gap-4 shrink-0">
                                    <button 
                                        onClick={() => handleRevoke(focusedPermit.id)}
                                        disabled={actionLoading}
                                        className="flex-1 py-4 rounded-xl border border-[#EF4444]/20 text-[#EF4444] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#EF4444] hover:text-white transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-30"
                                    >
                                        {actionLoading ? <Spinner size="sm" className="text-current" /> : <><LockIcon className="w-4 h-4" /> Decommission Permit</>}
                                    </button>
                                </div>
                                
                                {/* Background Matrix Decorative */}
                                <div className="absolute inset-0 opacity-[0.02] pointer-events-none font-mono text-[8px] p-2 leading-none break-all select-none z-0">
                                    {Array.from({length: 30}).map((_,i) => <div key={i} className="mb-1">0x{Math.random().toString(16).slice(2, 24)}</div>)}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-30 relative">
                                <div className="absolute inset-0 bg-primary/5 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
                                <div className="relative mb-12">
                                    <div className="absolute -inset-4 bg-white/5 rounded-full blur-2xl animate-spin-slow"></div>
                                    <KeyIcon className="w-24 h-24 text-white/40 relative z-10" />
                                </div>
                                <h3 className="text-3xl font-black uppercase tracking-[0.6em] text-white relative z-10 leading-none">Registry Standby</h3>
                                <p className="text-lg mt-8 font-serif italic text-white/60 max-w-sm leading-relaxed relative z-10">
                                    Select an artifact from the registry to inspect security context and operational handshake status.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .animate-spin-slow {
                    animation: spin 15s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
