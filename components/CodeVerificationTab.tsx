import React, { useState, useEffect, useRef } from 'react';
import { supabase, formatError } from '../services/supabase';
import { EnquiryService } from '../services/enquiry';
import { VerifiedShareCodeData } from '../types';
import Spinner from './common/Spinner';
import { KeyIcon } from './icons/KeyIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { LockIcon } from './icons/LockIcon';
import { UsersIcon } from './icons/UsersIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { ActivityIcon } from './icons/ActivityIcon';
import { PhoneIcon } from './icons/PhoneIcon';

interface InfoRowProps {
    label: string;
    value: string | null | undefined;
    valueClassName?: string;
    subLabel?: string;
}

const TechnicalInfoRow: React.FC<InfoRowProps> = ({ label, value, valueClassName = "text-white font-bold", subLabel }) => (
    <div className="space-y-1.5 group/row">
        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.25em] group-hover/row:text-primary/60 transition-colors">{label}</p>
        <div className="flex flex-col">
            <p className={`text-base md:text-lg leading-tight truncate ${valueClassName}`}>{value || '—'}</p>
            {subLabel && <p className="text-[9px] text-white/20 uppercase font-bold mt-1 tracking-widest">{subLabel}</p>}
        </div>
    </div>
);

interface CodeVerificationTabProps {
    branchId?: number | null;
    onNavigate?: (component: string) => void;
}

const CodeVerificationTab: React.FC<CodeVerificationTabProps> = ({ branchId, onNavigate }) => {
    const [code, setCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verifiedData, setVerifiedData] = useState<VerifiedShareCodeData & { id?: number } | null>(null);
    const [importSuccess, setImportSuccess] = useState(false);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        // Standardize: Remove all whitespace and handle formatting
        const cleanCode = code.replace(/\s+/g, '').toUpperCase();
        if (!cleanCode) return;
        
        setVerifying(true);
        setError(null);
        setVerifiedData(null);

        try {
            // Step 1: Verify token context and retrieve node metadata
            const { data, error: rpcError } = await supabase.rpc('admin_verify_share_code', { 
                p_code: cleanCode 
            });

            if (rpcError) throw rpcError;
            
            if (data && data.found) {
                setVerifiedData(data);
            } else {
                setError(data?.error || "Invalid or expired protocol token.");
            }
        } catch (err: any) {
            console.error("Identity Handshake Error:", err);
            setError(formatError(err));
        } finally {
            setVerifying(false);
        }
    };
    
    const handleImport = async () => {
        if (!verifiedData) return;

        setLoading(true);
        setError(null);
        
        try {
            const branchToLink = branchId === undefined || branchId === null ? null : branchId;
            
            // ARCHITECTURE FIX: Use unified ID-based RPC for all code types.
            // This bypasses the redundant string lookups that cause 'invalid token' errors.
            const { data, error: impError } = await supabase.rpc('admin_import_record_from_share_code', {
                p_admission_id: verifiedData.admission_id,
                p_code_type: verifiedData.code_type,
                p_branch_id: branchToLink,
                p_code_id: verifiedData.id
            });

            if (impError) throw impError;
            
            if (data && data.success) {
                setImportSuccess(true);
                const targetTab = verifiedData.code_type === 'Enquiry' ? 'Enquiries' : 'Admissions';
                setTimeout(() => onNavigate?.(targetTab), 1500);
            } else {
                throw new Error(data?.message || "Import protocol rejected by node.");
            }
        } catch (err: any) {
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-16 py-12 animate-in fade-in duration-1000">
            <div className="text-center relative">
                <div className="relative inline-block mb-8">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
                    <div className="relative w-24 h-24 bg-[#101218] rounded-[2.5rem] border border-white/10 flex items-center justify-center shadow-2xl">
                        <ShieldCheckIcon className="w-12 h-12 text-primary" />
                    </div>
                </div>
                <h2 className="text-5xl md:text-7xl font-serif font-black text-white tracking-tighter uppercase mb-4">Quick <span className="text-white/20 italic">Verification.</span></h2>
                <p className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto font-medium italic">Resolve identity handshakes using secure cryptographic tokens.</p>
            </div>

            <div className="max-w-2xl mx-auto px-4">
                <form onSubmit={handleVerify} className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
                        <KeyIcon className="h-8 w-8" />
                    </div>
                    <input
                        type="text"
                        placeholder="ENTER PROTOCOL KEY"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        disabled={verifying || importSuccess}
                        className="w-full bg-[#0d0f14]/80 backdrop-blur-3xl border-2 border-white/5 rounded-[3rem] pl-20 pr-44 py-8 text-3xl font-mono font-black tracking-[0.4em] focus:ring-[15px] focus:ring-primary/5 focus:border-primary/50 outline-none text-white transition-all shadow-2xl uppercase"
                    />
                    <button 
                        type="submit" 
                        disabled={verifying || !code.trim() || importSuccess}
                        className="absolute right-4 top-4 bottom-4 bg-primary text-white font-black px-10 rounded-[2.2rem] shadow-xl hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {verifying ? <Spinner size="sm" className="text-white" /> : 'Initialize'}
                    </button>
                </form>

                <div className="mt-8">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-8 py-6 rounded-[2rem] text-sm font-bold flex items-center gap-5 animate-in shake">
                            <AlertTriangleIcon className="w-6 h-6 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    {importSuccess && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-8 py-6 rounded-[2rem] text-sm font-bold flex items-center gap-4 animate-in zoom-in-95">
                            <CheckCircleIcon className="w-6 h-6" /> 
                            <span>Node Identity Synchronized. Redirecting...</span>
                        </div>
                    )}
                </div>
            </div>

            {verifiedData && !error && !importSuccess && (
                <div className="bg-[#0c0e14] border border-white/5 rounded-[4rem] p-16 shadow-2xl animate-in slide-in-from-bottom-12 duration-1000 ring-1 ring-white/5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-12">
                            <TechnicalInfoRow label="Subject Identity" value={verifiedData.applicant_name} valueClassName="text-4xl font-serif font-black text-white uppercase" />
                            <div className="grid grid-cols-2 gap-8">
                                <TechnicalInfoRow label="Grade Level" value={`Grade ${verifiedData.grade}`} />
                                <TechnicalInfoRow label="Token Type" value={verifiedData.code_type} valueClassName="text-primary font-black uppercase" />
                            </div>
                        </div>
                        <div className="flex flex-col justify-center">
                             <button onClick={handleImport} disabled={loading} className="w-full py-6 bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-[0.4em] rounded-[2rem] shadow-2xl shadow-primary/20 transition-all transform active:scale-95 group">
                                 {loading ? <Spinner size="sm" className="text-white"/> : (
                                    <div className="flex items-center justify-center gap-4">
                                        <span>Synchronize as {verifiedData.code_type}</span>
                                        <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                 )}
                             </button>
                             <p className="text-[10px] text-white/20 text-center mt-6 font-bold uppercase tracking-widest leading-relaxed">
                                Proceeding will bind this identity node to your current branch context.
                             </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CodeVerificationTab;