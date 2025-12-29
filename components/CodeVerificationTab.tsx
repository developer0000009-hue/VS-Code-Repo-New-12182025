
import React, { useState, useEffect } from 'react';
import { supabase, formatError } from '../services/supabase';
import { VerifiedShareCodeData } from '../types';
import Spinner from './common/Spinner';
import { KeyIcon } from './icons/KeyIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XIcon } from './icons/XIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { LockIcon } from './icons/LockIcon';
import { UsersIcon } from './icons/UsersIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface InfoRowProps {
    label: string;
    value: string | null | undefined;
    valueClassName?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, valueClassName = "text-foreground font-medium" }) => (
    <div>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1.5 opacity-60">{label}</p>
        <p className={`text-sm ${valueClassName}`}>{value || '—'}</p>
    </div>
);

interface CodeVerificationTabProps {
    branchId?: number | null;
    onNavigate?: (component: string) => void;
}

const CodeVerificationTab: React.FC<CodeVerificationTabProps> = ({ branchId, onNavigate }) => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verifiedData, setVerifiedData] = useState<VerifiedShareCodeData & { vault_access?: boolean } | null>(null);
    const [importSuccessMessage, setImportSuccessMessage] = useState<React.ReactNode | null>(null);

    useEffect(() => {
        setVerifiedData(null);
        setImportSuccessMessage(null);
        setError(null);
    }, [branchId]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanCode = code.trim().toUpperCase();
        if (!cleanCode) return;
        
        setLoading(true);
        setError(null);
        setVerifiedData(null);
        setImportSuccessMessage(null);

        try {
            const { data, error: rpcError } = await supabase.rpc('admin_verify_share_code', { 
                p_code: cleanCode 
            });

            if (rpcError) throw rpcError;
            
            const result = Array.isArray(data) ? data[0] : data;

            if (!result || result.error || !result.found) {
                const rawError = result?.error;
                setError(rawError === 'CRYPTOGRAPHIC_TOKEN_NOT_FOUND' 
                    ? "Cryptographic token not found or decommissioned." 
                    : formatError(rawError || "Handshake sequence failed to resolve token."));
            } else {
                setVerifiedData({
                    ...result,
                    vault_access: result.code_type === 'Admission'
                });
                setError(null);
            }
        } catch (err: any) {
            console.error("RPC Protocol Error:", err);
            setError(`Handshake Failed: ${formatError(err)}`);
        } finally {
            setLoading(false);
        }
    };
    
    const handleImport = async () => {
        if (!verifiedData) return;
        if (!branchId) {
            setError("BRANCH CONTEXT MISSING: Node selection mandatory before synchronization.");
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const { error: rpcError } = await supabase.rpc('admin_import_record_from_share_code', { 
                p_admission_id: verifiedData.admission_id,
                p_code_type: verifiedData.code_type,
                p_branch_id: branchId
            });

            if (rpcError) throw rpcError;

            const targetModule = verifiedData.code_type === 'Admission' ? 'Admissions' : 'Enquiries';

            setImportSuccessMessage(
                <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left bg-emerald-500/10 p-6 rounded-[2.5rem] border border-emerald-500/20 shadow-xl animate-in zoom-in-95">
                    <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-500/30">
                        <CheckCircleIcon className="w-8 h-8" />
                    </div>
                    <div className="flex flex-col gap-3">
                        <div>
                            <p className="font-black text-emerald-600 uppercase tracking-widest text-xs">Identity Integrated</p>
                            <p className="text-sm text-muted-foreground mt-1 font-medium leading-relaxed">
                                Payload for <strong>{verifiedData.applicant_name}</strong> integrated into the system node.
                            </p>
                        </div>
                        {onNavigate && (
                            <button 
                                onClick={() => onNavigate(targetModule)}
                                className="flex items-center gap-2 text-[10px] font-black text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest bg-emerald-500/5 px-4 py-2 rounded-xl border border-emerald-500/10 w-fit"
                            >
                                Open {targetModule} {verifiedData.code_type === 'Admission' ? 'Vault' : 'Desk'} <ChevronRightIcon className="w-3 h-3"/>
                            </button>
                        )}
                    </div>
                </div>
            );
            setVerifiedData(null); 
            setCode('');
        } catch (err: any) {
            setError(`Import Protocol Failure: ${formatError(err)}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 py-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-40">
            
            <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner ring-1 ring-primary/5 transform rotate-3 hover:rotate-0 transition-transform duration-700 group">
                    <ShieldCheckIcon className="w-12 h-12 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <h2 className="text-5xl font-serif font-black text-foreground tracking-tighter uppercase">Quick Verification</h2>
                <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed font-medium italic">
                    Resolve high-fidelity identity handshakes using secure cryptographic tokens.
                </p>
            </div>

            <div className="max-w-xl mx-auto relative">
                <form onSubmit={handleVerify} className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                        <KeyIcon className="h-6 w-6" />
                    </div>
                    <input
                        type="text"
                        placeholder="ENTER PERMIT KEY"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="w-full bg-card border-2 border-border/60 hover:border-primary/40 rounded-[2rem] pl-16 pr-36 py-6 text-2xl font-mono font-black tracking-[0.2em] focus:ring-8 focus:ring-primary/5 focus:border-primary outline-none transition-all shadow-2xl shadow-black/5 uppercase placeholder:text-muted-foreground/10 text-foreground"
                        autoFocus
                    />
                    <button 
                        type="submit" 
                        disabled={loading || !code.trim()}
                        className="absolute right-3 top-3 bottom-3 bg-primary hover:bg-primary/90 text-primary-foreground font-black px-8 rounded-2xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center gap-3 uppercase tracking-widest text-xs"
                    >
                        {loading && !verifiedData ? <Spinner size="sm" className="text-current" /> : <>Verify Access</>}
                    </button>
                </form>

                <div className="mt-8 space-y-4">
                    {!branchId && (
                        <div className="bg-amber-500/5 border border-amber-500/20 text-amber-700 dark:text-amber-400 px-8 py-5 rounded-3xl text-sm font-bold flex items-center justify-center gap-4 animate-in slide-in-from-top-2 text-center shadow-xl">
                            <AlertTriangleIcon className="w-6 h-6 flex-shrink-0 animate-pulse" />
                            <span className="leading-relaxed uppercase tracking-wide">Workstation Locked: Branch context required.</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-8 py-5 rounded-3xl text-sm font-bold flex items-center justify-center gap-4 animate-in shake duration-500 text-center shadow-xl">
                            <XCircleIcon className="w-6 h-6 flex-shrink-0" /> <span className="uppercase tracking-wide">{error}</span>
                        </div>
                    )}
                    
                    {importSuccessMessage && (
                        <div className="animate-in fade-in slide-in-from-top-4 flex justify-center">
                            {importSuccessMessage}
                        </div>
                    )}
                </div>
            </div>

            {verifiedData && (
                <div className="animate-in slide-in-from-bottom-12 duration-700 fade-in">
                    <div className="bg-card border border-border rounded-[3rem] overflow-hidden shadow-3xl ring-1 ring-black/10 relative">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500"></div>
                        
                        <div className="p-10 md:p-14 grid grid-cols-1 md:grid-cols-2 gap-16 relative">
                            <div className="space-y-8">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-black text-sm border border-blue-500/20 shadow-inner">
                                        {(verifiedData.applicant_name || 'A').charAt(0)}
                                    </div>
                                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Scoped Payload</h4>
                                </div>
                                <div className="space-y-6 pl-4 border-l-2 border-white/5 ml-6">
                                    <InfoRow label="Subject Identity" value={verifiedData.applicant_name} valueClassName="text-3xl font-serif font-black text-foreground tracking-tighter uppercase" />
                                    <div className="grid grid-cols-2 gap-8">
                                        <InfoRow label="Grade Placement" value={`Grade ${verifiedData.grade}`} valueClassName="text-lg font-black text-indigo-400"/>
                                        <InfoRow label="Permit Scope" value={verifiedData.code_type} valueClassName={`text-sm font-black uppercase ${verifiedData.code_type === 'Admission' ? 'text-purple-400' : 'text-blue-400'}`}/>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="flex items-center gap-4 mb-4">
                                     <div className="w-12 h-12 rounded-2xl bg-purple-50/10 text-purple-400 flex items-center justify-center font-black text-sm border border-purple-500/20 shadow-inner">
                                        <UsersIcon className="w-6 h-6"/>
                                    </div>
                                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Guardian Arbiter</h4>
                                </div>
                                <div className="space-y-6 pl-4 border-l-2 border-white/5 ml-6">
                                    <InfoRow label="Primary Arbiter" value={verifiedData.parent_name} valueClassName="text-2xl font-bold text-foreground tracking-tight" />
                                    <InfoRow label="Contact Line" value={verifiedData.parent_phone} />
                                </div>
                            </div>
                        </div>

                        {!verifiedData.vault_access && (
                            <div className="mx-10 mb-10 p-8 rounded-[2rem] bg-[#0d0f14] border border-white/5 flex flex-col items-center justify-center text-center group">
                                <LockIcon className="w-8 h-8 text-white/20 mb-4 group-hover:text-primary transition-colors" />
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Vault Access Restricted</p>
                                <p className="text-xs text-white/20 mt-2 max-w-sm italic leading-relaxed">This is an Enquiry-scoped permit. Full document synchronization is only available via Admission-scoped permits.</p>
                            </div>
                        )}

                        <div className="bg-muted/30 px-10 py-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-8 backdrop-blur-xl">
                             <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl text-[10px] font-mono font-black uppercase tracking-[0.2em] shadow-inner border border-white/5 ${verifiedData.vault_access ? 'text-purple-400 bg-purple-500/5' : 'text-blue-400 bg-blue-500/5'}`}>
                                    {verifiedData.code_type} PROTOCOL
                                </div>
                                <div className="h-6 w-px bg-border hidden sm:block"></div>
                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircleIcon className="w-4 h-4 text-emerald-500" /> Integrity Confirmed
                                </span>
                            </div>

                            <button
                                onClick={handleImport}
                                disabled={!branchId || loading}
                                className={`
                                    px-14 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] text-white shadow-2xl transition-all flex items-center gap-4 transform active:scale-95
                                    ${!branchId ? 'bg-muted text-white/10' : 'bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-indigo-500/30 hover:-translate-y-1'}
                                `}
                            >
                                {loading ? <Spinner size="sm" className="text-white"/> : <><ShieldCheckIcon className="w-6 h-6"/> Integrate Identity</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CodeVerificationTab;
