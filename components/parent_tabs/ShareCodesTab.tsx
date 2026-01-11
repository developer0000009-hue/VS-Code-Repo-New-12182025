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
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { LockIcon } from '../icons/LockIcon';
import { EyeIcon } from '../icons/EyeIcon';
import { EyeOffIcon } from '../icons/EyeOffIcon';
import { CopyIcon } from '../icons/CopyIcon';
import PremiumAvatar from '../common/PremiumAvatar';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShareCodesTab() {
    const [codes, setCodes] = useState<ShareCode[]>([]);
    const [myApplications, setMyApplications] = useState<AdmissionApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [focusedPermitId, setFocusedPermitId] = useState<number | null>(null);
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

    useEffect(() => { 
        fetchData(); 
    }, [fetchData]);

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

            const generatedCode = typeof data === 'string' ? data : (data?.code || data?.p_code);
            
            await fetchData(true);
            
            if (generatedCode) {
                const { data: latestCodes } = await supabase.rpc('get_my_share_codes');
                if (latestCodes && Array.isArray(latestCodes) && latestCodes.length > 0) {
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

    const handleRevoke = async (id: number) => {
        if (!confirm("Terminate this access permit artifact? This operation is irreversible.")) return;
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
        navigator.clipboard.writeText(code).then(() => {
            setCopyFeedback(true);
            setTimeout(() => setCopyFeedback(false), 2000);
        });
    };

    const { activeCodes, inactiveCodes } = useMemo(() => {
        const sorted = [...codes].sort((a, b) => {
            const dateB = b.expires_at ? new Date(b.expires_at).getTime() : 0;
            const dateA = a.expires_at ? new Date(a.expires_at).getTime() : 0;
            return dateB - dateA;
        });
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
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 animate-pulse font-sans">Syncing Handshake Center</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-700 pb-32 font-sans">
            {/* --- MASTER HEADER SECTION --- */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 px-4">
                <div className="max-w-4xl space-y-5">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary border border-primary/20 shadow-inner">
                            <ShieldCheckIcon className="w-5 h-5"/>
                        </div>
                        <span className="text-[11px] font-bold uppercase text-primary tracking-[0.5em] pl-3 border-l border-white/10">Authorized Gateway</span>
                    </div>
                    <div>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight uppercase leading-none">
                            Digital <span className="text-white/40 italic font-light">Permits.</span>
                        </h2>
                        <p className="text-white/40 text-lg leading-relaxed font-serif italic max-w-2xl mt-4 border-l border-white/10 pl-8">
                            Provision temporary high-fidelity tokens for institutional verification and secure enrollment handshakes.
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => fetchData()} 
                    disabled={actionLoading}
                    className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] text-white/40 hover:text-white transition-all border border-white/10 group active:scale-95 shadow-2xl backdrop-blur-md no-print"
                >
                    <RefreshIcon className={`w-6 h-6 ${actionLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-8 rounded-[2.5rem] flex items-center gap-6 animate-in shake shadow-2xl ring-1 ring-red-500/20 mx-4">
                    <AlertTriangleIcon className="w-8 h-8 shrink-0" />
                    <div className="flex-1">
                        <p className="text-[11px] font-black uppercase tracking-widest mb-1 opacity-60">System Interrupt</p>
                        <p className="text-sm font-bold uppercase tracking-widest leading-relaxed">{error}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-stretch min-h-[800px] px-4">
                
                {/* --- 1. PROVISIONING HUB (Left) --- */}
                <div className="xl:col-span-4 flex flex-col group/panel">
                    <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 p-10 rounded-[2.8rem] shadow-2xl space-y-12 flex flex-col h-full ring-1 ring-white/5 relative overflow-hidden transition-all duration-500 group-hover/panel:border-primary/20">
                        <div className="absolute -top-32 -left-32 w-80 h-80 bg-primary/5 rounded-full blur-[120px] pointer-events-none opacity-40"></div>
                        
                        {/* Section A: Target Identity */}
                        <div className="space-y-8 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="w-9 h-9 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-black text-white/30 shadow-inner">01</div>
                                <h3 className="text-[12px] font-bold text-white/40 uppercase tracking-[0.2em]">Target Identity Node</h3>
                            </div>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-3">
                                {myApplications.map(app => (
                                    <button
                                        key={app.id} 
                                        onClick={() => setSelectedAdmissionId(app.id)}
                                        className={`w-full flex items-center gap-5 p-5 rounded-[2rem] border transition-all duration-300 group/item ${selectedAdmissionId === app.id ? 'bg-primary/10 border-primary ring-4 ring-primary/5 shadow-2xl' : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.05]'}`}
                                    >
                                        <PremiumAvatar src={app.profile_photo_url} name={app.applicant_name} size="xs" className="w-12 h-12 shadow-2xl" />
                                        <div className="text-left min-w-0 flex-grow">
                                            <p className={`font-bold text-base truncate transition-colors ${selectedAdmissionId === app.id ? 'text-white' : 'text-white/40 group-hover/item:text-white/60'}`}>{app.applicant_name}</p>
                                            <p className="text-[9px] text-white/20 font-bold uppercase mt-1 tracking-widest">Grade {app.grade} Node</p>
                                        </div>
                                        {selectedAdmissionId === app.id && <CheckCircleIcon className="w-5 h-5 text-primary animate-in zoom-in duration-300" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Section B: Protocol Scope */}
                        <div className="space-y-8 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="w-9 h-9 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-black text-white/30 shadow-inner">02</div>
                                <h3 className="text-[12px] font-bold text-white/40 uppercase tracking-[0.2em]">Access Protocol Scope</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { id: 'Enquiry', label: 'Enquiry Level', desc: 'Temporary metadata visibility only.', icon: <MailIcon className="w-5 h-5"/> },
                                    { id: 'Admission', label: 'Admission Level', desc: 'Full document vault & ledger access.', icon: <DocumentTextIcon className="w-5 h-5"/> }
                                ].map(type => (
                                    <button
                                        key={type.id} 
                                        onClick={() => setPermitType(type.id as ShareCodeType)}
                                        className={`p-6 rounded-[2.2rem] border transition-all duration-300 flex items-center gap-6 group/type ${permitType === type.id ? 'bg-primary/10 border-primary shadow-2xl ring-2 ring-primary/5' : 'bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03]'}`}
                                    >
                                        <div className={`p-3.5 rounded-xl transition-all duration-500 shadow-inner ${permitType === type.id ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 'bg-white/5 text-white/10'}`}>{type.icon}</div>
                                        <div className="text-left flex-grow">
                                            <h4 className={`text-[12px] font-bold uppercase tracking-widest ${permitType === type.id ? 'text-primary' : 'text-white/40 group/type:text-white/60'}`}>{type.label}</h4>
                                            <p className="text-[11px] text-white/20 mt-1 font-serif italic leading-relaxed">{type.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-auto pt-6 relative z-10">
                            <button 
                                onClick={handleGenerate} 
                                disabled={!isReadyToActivate || actionLoading}
                                className={`w-full h-14 rounded-[1.4rem] text-[11px] font-bold uppercase tracking-[0.4em] transition-all duration-300 flex items-center justify-center gap-4 shadow-2xl ${isReadyToActivate && !actionLoading ? 'bg-primary text-primary-foreground shadow-primary/30 hover:shadow-primary/50 transform hover:-translate-y-0.5 active:scale-95' : 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5'}`}
                            >
                                {actionLoading ? <Spinner size="sm" className="text-current" /> : 'Initialize Permit'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- 2. REGISTRY INDEX (Middle) --- */}
                <div className="xl:col-span-3 flex flex-col space-y-8 group/registry">
                    <div className="flex justify-between items-center px-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Registry Index</h3>
                        <div className="flex items-center gap-3">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                             <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">LIVE</span>
                        </div>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-[800px] custom-scrollbar pr-3 flex-grow">
                        {activeCodes.length === 0 ? (
                            <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center bg-white/[0.01] group-hover/registry:border-white/10 transition-colors">
                                <KeyIcon className="w-12 h-12 text-white/5 mb-6" />
                                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/10 italic">IDLE.</p>
                            </div>
                        ) : (
                            activeCodes.map(code => (
                                <button 
                                    key={code.id} 
                                    onClick={() => setFocusedPermitId(code.id)}
                                    className={`w-full text-left p-6 rounded-[2.2rem] border transition-all duration-500 group/artifact relative overflow-hidden ${focusedPermitId === code.id ? 'bg-slate-900 border-primary shadow-2xl z-10 scale-[1.02] ring-1 ring-primary/20' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                                >
                                    <div className="flex items-center gap-5 relative z-10">
                                        <div className="relative shrink-0">
                                            <PremiumAvatar src={code.profile_photo_url} name={code.applicant_name} size="xs" className="w-14 h-14 rounded-[1.2rem] shadow-xl border border-white/10" />
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#09090b] shadow-2xl"></div>
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className={`font-bold text-base text-white transition-colors duration-500 leading-tight mb-1 truncate ${focusedPermitId === code.id ? 'text-primary' : 'group-hover/artifact:text-primary'}`}>{code.applicant_name}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{code.code_type}</span>
                                                <span className="w-1 h-1 rounded-full bg-white/10"></span>
                                                <span className="text-[9px] font-mono text-white/10">ID_{code.id}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {focusedPermitId === code.id && (
                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.8)]"></div>
                                    )}
                                </button>
                            ))
                        )}

                        <div className="pt-8 border-t border-white/5 mt-auto">
                            <button 
                                onClick={() => setShowHistory(!showHistory)}
                                className={`w-full flex items-center justify-between px-8 py-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] transition-all group border border-white/5 ${showHistory ? 'border-primary/20 bg-primary/5' : ''}`}
                            >
                                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${showHistory ? 'text-primary' : 'text-white/20 group-hover:text-white/40'}`}>Registry Archives</span>
                                <ChevronDownIcon className={`w-4 h-4 transition-all duration-500 ${showHistory ? 'rotate-180 text-primary' : 'text-white/20'}`} />
                            </button>
                            
                            <AnimatePresence>
                                {showHistory && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mt-4 space-y-2 overflow-hidden"
                                    >
                                        {inactiveCodes.map(code => (
                                            <div key={code.id} className="flex items-center justify-between p-5 rounded-xl bg-white/[0.01] border border-white/5 opacity-40 hover:opacity-60 transition-all shadow-inner">
                                                <div className="flex items-center gap-4">
                                                    <PremiumAvatar src={code.profile_photo_url} name={code.applicant_name} size="xs" className="w-10 h-10 border border-white/5 grayscale" />
                                                    <p className="text-[11px] font-bold text-white uppercase tracking-wider truncate max-w-[120px]">{code.applicant_name}</p>
                                                </div>
                                                <span className="text-[11px] font-mono text-white/20 tracking-widest">{code.code}</span>
                                            </div>
                                        ))}
                                        {inactiveCodes.length === 0 && <p className="text-center py-8 text-[10px] font-bold text-white/5 uppercase tracking-widest">No archived records.</p>}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* --- 3. HERO PROTOCOL CARD (Right) --- */}
                <div className="xl:col-span-5 flex flex-col group/hero">
                    <div className="bg-[#0c0d12] border border-white/5 rounded-[3.5rem] flex flex-col shadow-[0_48px_96px_-24px_rgba(0,0,0,1)] relative overflow-hidden h-full ring-1 ring-white/10 transition-all duration-500 group-hover/hero:border-white/20">
                        
                        {/* Background Layering */}
                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-0" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)`, backgroundSize: '32px 32px' }}></div>

                        {focusedPermit ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="h-full flex flex-col relative z-10"
                            >
                                {/* Hero Header */}
                                <div className="p-10 md:p-12 pb-6 flex items-center justify-between relative">
                                    <div className="flex items-center gap-5">
                                        <PremiumAvatar src={focusedPermit.profile_photo_url} name={focusedPermit.applicant_name} size="sm" className="shadow-2xl border-2 border-white/10 rounded-2xl" />
                                        <div className="min-w-0">
                                            <h4 className="text-2xl font-bold text-white truncate leading-none uppercase tracking-tight mb-2">{focusedPermit.applicant_name}</h4>
                                            <p className="text-[11px] text-white/30 uppercase font-bold tracking-[0.2em]">Institutional Access Node</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-xl backdrop-blur-xl">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
                                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Authorized</span>
                                    </div>
                                </div>

                                {/* Main Token Area */}
                                <div className="px-10 md:px-12 flex-shrink-0">
                                    <div 
                                        className="bg-black/40 backdrop-blur-3xl border border-dashed border-white/10 rounded-[3rem] p-12 md:p-16 text-center group/token cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden ring-1 ring-white/5 shadow-2xl"
                                        onClick={() => handleCopy(focusedPermit.code)}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover/token:opacity-100 transition-opacity duration-1000"></div>
                                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] mb-10 relative z-10 group-hover/token:text-primary/40 transition-colors">Digital Permit Artifact</p>
                                        
                                        <div className="relative inline-block mb-10">
                                            <span className={`font-mono font-black text-5xl md:text-6xl tracking-[0.3em] transition-all duration-500 relative z-10 select-all block drop-shadow-2xl ${copyFeedback ? 'text-emerald-500 scale-105' : 'text-white group-hover/token:text-primary'}`}>
                                                {focusedPermit.code}
                                            </span>
                                            <div className={`absolute -inset-10 blur-[60px] opacity-10 transition-all duration-1000 ${copyFeedback ? 'bg-emerald-500 opacity-30' : 'bg-primary/20 group-hover/token:opacity-20'}`}></div>
                                        </div>

                                        <div className="flex items-center justify-center gap-3 relative z-10">
                                             <button 
                                                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${copyFeedback ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/30' : 'bg-white/5 hover:bg-white/10 text-white/40 hover:text-white border border-white/10'}`}
                                            >
                                                {copyFeedback ? <CheckCircleIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4"/>}
                                                {copyFeedback ? 'Copied' : 'Copy Artifact'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Security Metadata */}
                                <div className="p-10 md:p-12 flex-grow grid grid-cols-2 gap-x-10 gap-y-10 relative z-10">
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Protocol Sync</p>
                                        <p className="text-base font-bold text-white uppercase tracking-wider">{focusedPermit.code_type} Console</p>
                                    </div>
                                    <div className="space-y-1.5 text-right">
                                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Encryption</p>
                                        <p className="text-base font-bold text-white uppercase tracking-wider">AES-256-GCM</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Issued On</p>
                                        <p className="text-[15px] font-medium text-white/50 font-mono tracking-tighter uppercase">{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                    </div>
                                    <div className="space-y-1.5 text-right">
                                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Expiration</p>
                                        <p className="text-[15px] font-medium text-indigo-400/80 font-mono tracking-tighter uppercase">{new Date(focusedPermit.expires_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                    </div>
                                    
                                    <div className="col-span-full pt-8 flex flex-col gap-4 border-t border-white/5">
                                        <div className="flex items-center gap-4 text-[12px] text-white/20 font-medium italic group/dis">
                                            <ShieldCheckIcon className="w-5 h-5 opacity-30 group-hover/dis:text-emerald-500 transition-colors shrink-0" />
                                            <span className="leading-relaxed">Artifact integrity verified by Gurukul Institutional Matrix. Handshake node synchronized via secure tunnel.</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Destructive Control */}
                                <div className="p-8 md:p-10 border-t border-white/5 bg-black/20 flex flex-col sm:flex-row gap-4 shrink-0 z-20">
                                    <button 
                                        onClick={() => handleRevoke(focusedPermit.id)}
                                        disabled={actionLoading}
                                        className="flex-1 h-14 rounded-2xl border border-red-500/10 text-red-500/40 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-red-500 hover:text-white hover:border-red-500 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30 shadow-2xl"
                                    >
                                        {actionLoading ? <Spinner size="sm" className="text-current" /> : <><LockIcon className="w-4 h-4" /> Terminate Permit</>}
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-20 text-center relative">
                                <div className="absolute inset-0 bg-primary/5 rounded-full blur-[160px] animate-slow-pulse pointer-events-none"></div>
                                <div className="relative mb-16">
                                    <div className="absolute -inset-10 bg-white/5 rounded-full blur-[60px]"></div>
                                    <div className="w-28 h-28 rounded-[2.8rem] bg-white/[0.02] border border-white/10 flex items-center justify-center shadow-[0_0_80px_rgba(255,255,255,0.05)] relative z-10 transition-transform group-hover/hero:scale-105 duration-1000">
                                        <KeyIcon className="w-12 h-12 text-white/10" />
                                    </div>
                                </div>
                                <div className="space-y-6 relative z-10 max-w-xs">
                                    <h3 className="text-2xl font-bold uppercase tracking-[0.4em] text-white/20 leading-tight">Registry<br/>Standby</h3>
                                    <p className="text-base font-serif italic text-white/10 leading-relaxed">
                                        Select an active permit from the registry to inspect security context and handshake status.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .animate-slow-pulse { animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @keyframes pulse { 0%, 100% { opacity: 0.1; transform: scale(1); } 50% { opacity: 0.2; transform: scale(1.05); } }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(var(--primary), 0.5); }
            `}</style>
        </div>
    );
}
