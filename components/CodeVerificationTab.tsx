
import React, { useState } from 'react';
import { supabase, formatError } from '../services/supabase';
import { EnquiryService } from '../services/enquiry';
import { AdmissionService } from '../services/admission';
import { VerifiedShareCodeData } from '../types';
import { useServiceStatus } from '../hooks/useServiceStatus';
import { verificationService } from '../services/verificationService';
import Spinner from './common/Spinner';
import { KeyIcon } from './icons/KeyIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { UsersIcon } from './icons/UsersIcon';
import { RotateCcwIcon } from './icons/RotateCcwIcon';
import { ClockIcon } from './icons/ClockIcon';

interface CodeVerificationTabProps {
    branchId?: string | null;
    onNavigate?: (component: string) => void;
}

const CodeVerificationTab: React.FC<CodeVerificationTabProps> = ({ branchId, onNavigate }) => {
    // Service status management
    const {
        serviceStatus,
        pendingCount,
        getNextRetryCountdown,
        checkServiceHealth,
        isServiceOnline
    } = useServiceStatus();

    const [code, setCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verificationResult, setVerificationResult] = useState<VerifiedShareCodeData & { id?: string } | null>(null);
    const [syncSuccess, setSyncSuccess] = useState(false);
    const [queuedForOffline, setQueuedForOffline] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const resetState = () => {
        setError(null);
        setVerificationResult(null);
        setSyncSuccess(false);
        setQueuedForOffline(false);
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanCode = code.replace(/\s+/g, '').toUpperCase();
        if (!cleanCode) return;

        // If service is offline, queue the verification instead
        if (!isServiceOnline) {
            try {
                const queueResult = await verificationService.queueVerification({
                    code: cleanCode,
                    code_type: 'Enquiry', // Default to Enquiry, could be enhanced to detect type
                    admission_id: '', // Will be filled when processed
                    applicant_name: 'Unknown', // Will be filled when processed
                    grade: 'Unknown' // Will be filled when processed
                });

                if (queueResult.success) {
                    setQueuedForOffline(true);
                    setCode('');
                    return;
                } else {
                    setError(queueResult.error || 'Failed to queue verification');
                    return;
                }
            } catch (err: any) {
                setError(formatError(err));
                return;
            }
        }

        setVerifying(true);
        setError(null);
        setVerificationResult(null);

        try {
            // Step 1: Pure Validation RPC
            const { data, error: rpcError } = await supabase.rpc('admin_verify_share_code', {
                p_code: cleanCode
            });

            if (rpcError) throw rpcError;

            if (data && data.found) {
                setVerificationResult(data);
            } else {
                setError("Verification Failed: The code could not be processed due to a configuration mismatch.");
            }
        } catch (err: any) {
            setError(formatError(err));
        } finally {
            setVerifying(false);
        }
    };
    
    const handleProcess = async () => {
        if (!verificationResult) return;
        setProcessing(true);
        setError(null);

        try {
            // Step 2: Import Record (sets branch_id for enquiries)
            const { data: importData, error: impError } = await supabase.rpc('admin_import_record_from_share_code', {
                p_admission_id: verificationResult.admission_id,
                p_code_type: verificationResult.code_type,
                p_branch_id: branchId || null
            });

            if (impError) throw impError;

            // Step 3: Domain-Specific Processing
            if (verificationResult.code_type === 'Enquiry') {
                const result = await EnquiryService.processEnquiryVerification(verificationResult.enquiry_id);
                if (result.success) {
                    setSyncSuccess(true);
                    onNavigate?.('Enquiries');
                }
            } else {
                // Admission Verification Flow
                const result = await AdmissionService.processAdmissionVerification(verificationResult.admission_id);
                if (result.success) {
                    setSyncSuccess(true);
                    onNavigate?.('Admissions');
                }
            }
        } catch (err: any) {
            setError(formatError(err));
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-16 py-12 animate-in fade-in duration-1000 pb-32">
            <div className="text-center relative">
                <div className="relative inline-block mb-8">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
                    <div className="relative w-24 h-24 bg-[#101218] rounded-[2.5rem] border border-white/10 flex items-center justify-center shadow-2xl ring-1 ring-white/5">
                        <ShieldCheckIcon className="w-12 h-12 text-primary" />
                    </div>
                </div>
                <h2 className="text-5xl md:text-7xl font-serif font-black text-white tracking-tighter uppercase mb-4">Access <span className="text-white/20 italic">Verification.</span></h2>
                <p className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto font-medium italic">Validate identity credentials and synchronize institutional records.</p>
            </div>

            <div className="max-w-2xl mx-auto px-4">
                <form onSubmit={handleVerify} className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
                        <KeyIcon className="h-8 w-8" />
                    </div>
                    <input
                        type="text"
                        placeholder={isServiceOnline ? "ENTER ACCESS KEY" : "SERVICE OFFLINE - VERIFICATION QUEUED"}
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        disabled={verifying || syncSuccess || !isServiceOnline}
                        className={`w-full bg-[#0d0f14]/80 backdrop-blur-3xl border-2 rounded-[3rem] pl-20 pr-44 py-8 text-3xl font-mono font-black tracking-[0.4em] outline-none transition-all shadow-2xl ${
                            isServiceOnline
                                ? 'border-white/5 focus:ring-[15px] focus:ring-primary/5 focus:border-primary/50 text-white'
                                : 'border-slate-500/30 bg-slate-500/10 text-slate-400/60'
                        }`}
                    />
                    <button
                        type="submit"
                        disabled={verifying || !code.trim() || syncSuccess || !isServiceOnline}
                        className={`absolute right-4 top-4 bottom-4 font-black px-10 rounded-[2.2rem] shadow-xl transition-all active:scale-95 disabled:opacity-50 ${
                            isServiceOnline
                                ? 'bg-primary text-white hover:bg-primary/90'
                                : 'bg-slate-600/20 text-slate-400/50 cursor-not-allowed'
                        }`}
                    >
                        {verifying ? <Spinner size="sm" className="text-white" /> : (isServiceOnline ? 'Validate' : 'Offline')}
                    </button>
                </form>

                {/* Offline Status Indicator */}
                {!isServiceOnline && (
                    <div className="mt-6 p-6 bg-slate-500/5 border border-slate-500/20 rounded-[2rem] text-center">
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                            <span className="text-slate-400 text-sm font-black uppercase tracking-widest">Verification Service Offline</span>
                        </div>
                        <p className="text-slate-400/80 text-sm leading-relaxed">
                            Codes entered now will be automatically queued and processed when the service returns online.
                            {pendingCount > 0 && ` You have ${pendingCount} verification${pendingCount > 1 ? 's' : ''} queued.`}
                        </p>
                    </div>
                )}

                <div className="mt-8 min-h-[100px]">
                    {queuedForOffline && (
                        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-8 py-6 rounded-[2rem] text-sm font-bold flex items-center gap-4 animate-in zoom-in-95 backdrop-blur-xl">
                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-inner">
                                <ClockIcon className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Verification Queued</p>
                                <p className="text-base font-serif italic">Code will be processed automatically when service returns online.</p>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-8 py-6 rounded-[2.5rem] text-sm font-bold flex flex-col gap-4 animate-in shake ring-1 ring-red-500/30 shadow-2xl backdrop-blur-xl">
                            <div className="flex items-start gap-6">
                                <div className="p-3.5 bg-red-500/10 rounded-[1.25rem] shrink-0 border border-red-500/20 shadow-inner">
                                    <AlertTriangleIcon className="w-6 h-6 flex-shrink-0" />
                                </div>
                                <div className="space-y-2 py-1 text-left">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Verification Failed</p>
                                    <p className="leading-relaxed text-red-200/90 font-serif italic text-base">{error}</p>
                                    {error.includes("Verification temporarily unavailable") && (
                                        <p className="text-[9px] font-bold text-red-300/70 mt-2">Please contact your system administrator to resolve this issue.</p>
                                    )}
                                </div>
                            </div>
                            {retryCount < 3 && !error.includes("Verification temporarily unavailable") ? (
                                <button
                                    onClick={() => {
                                        setRetryCount(prev => prev + 1);
                                        resetState();
                                    }}
                                    className="self-end flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                                >
                                    <RotateCcwIcon className="w-3.5 h-3.5"/> Retry Verification ({3 - retryCount} attempts left)
                                </button>
                            ) : retryCount >= 3 && !error.includes("Verification temporarily unavailable") ? (
                                <p className="text-[9px] font-bold text-red-300/70 self-end">Maximum retry attempts reached. Please try again later or contact support.</p>
                            ) : null}
                        </div>
                    )}
                    {syncSuccess && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-8 py-6 rounded-[2rem] text-sm font-bold flex items-center gap-4 animate-in zoom-in-95 backdrop-blur-xl">
                            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-inner">
                                <CheckCircleIcon className="w-6 h-6" /> 
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Synchronization Complete</p>
                                <p className="text-base font-serif italic">Identity record updated. Redirecting to workspace...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {verificationResult && !error && !syncSuccess && (
                <div className="bg-[#0c0e14] border border-white/5 rounded-[4rem] p-12 md:p-16 shadow-2xl animate-in slide-in-from-bottom-12 duration-1000 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
                        <UsersIcon className="w-64 h-64 text-white" />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                        <div className="space-y-12">
                             <div className="space-y-1.5">
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.25em]">Verified Identity</p>
                                <p className="text-4xl md:text-5xl font-serif font-black text-white leading-tight uppercase truncate">{verificationResult.applicant_name}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1.5">
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.25em]">Academic Level</p>
                                    <p className="text-xl font-bold text-white">Grade {verificationResult.grade}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.25em]">Verification Domain</p>
                                    <p className="text-xl font-black text-primary uppercase tracking-widest">{verificationResult.code_type}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col justify-center gap-6">
                             <button onClick={handleProcess} disabled={processing} className="w-full py-7 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-[0.4em] rounded-[2.2rem] shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 ring-4 ring-primary/10">
                                 {processing ? <Spinner size="sm" className="text-white"/> : `SYNC AS ${verificationResult.code_type.toUpperCase()}`}
                             </button>
                             <div className="flex items-center justify-center gap-4 text-white/20">
                                 <div className="h-px bg-white/5 flex-grow"></div>
                                 <p className="text-[9px] font-black uppercase tracking-[0.3em]">Ready for Domain Sync</p>
                                 <div className="h-px bg-white/5 flex-grow"></div>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CodeVerificationTab;
