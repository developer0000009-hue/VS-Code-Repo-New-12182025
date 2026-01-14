
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdmissionApplication, DocumentRequirement } from '../../types';
import { XIcon } from '../icons/XIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { FileTextIcon } from '../icons/FileTextIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { GraduationCapIcon } from '../icons/GraduationCapIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { supabase, formatError } from '../../services/supabase';
import Spinner from '../common/Spinner';
import { RequestDocumentsModal } from '../AdmissionsTab';
import PremiumAvatar from '../common/PremiumAvatar';
import { GoogleGenAI } from '@google/genai';
import { motion } from 'framer-motion';

interface AdmissionDetailsModalProps {
    admission: AdmissionApplication;
    onClose: () => void;
    onUpdate: () => void;
}

const AdmissionDetailsModal: React.FC<AdmissionDetailsModalProps> = ({ admission, onClose, onUpdate }) => {
    const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [activeView, setActiveView] = useState<'artifacts' | 'audit'>('artifacts');
    const [actioningId, setActioningId] = useState<number | null>(null);
    const [scanningId, setScanningId] = useState<number | null>(null);
    const [finalizeState, setFinalizeState] = useState<'idle' | 'processing' | 'success'>('idle');
    const [provisionedData, setProvisionedData] = useState<{ student_id: string; student_id_number?: string } | null>(null);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    
    const isMounted = useRef(true);

    const fetchRegistry = useCallback(async (isSilent = false) => {
        if (!isSilent) setFetching(true);
        try {
            // Initialize document slots if they don't exist
            await supabase.rpc('parent_initialize_vault_slots', { p_admission_id: admission.id });

            const [reqsRes, logsRes] = await Promise.all([
                supabase
                    .from('document_requirements')
                    .select(`*, admission_documents (id, file_name, storage_path, uploaded_at, file_size, mime_type)`)
                    .eq('admission_id', admission.id)
                    .order('is_mandatory', { ascending: false }),
                supabase
                    .from('admission_audit_logs')
                    .select('*')
                    .eq('admission_id', admission.id)
                    .order('created_at', { ascending: false })
            ]);
            
            if (reqsRes.error) throw reqsRes.error;
            
            if (isMounted.current) {
                setRequirements(reqsRes.data || []);
                setAuditLogs(logsRes.data || []);
            }
        } catch (err) {
            console.error("Governance Sync Failure:", formatError(err));
        } finally {
            if (isMounted.current) setFetching(false);
        }
    }, [admission.id]);

    useEffect(() => {
        isMounted.current = true;
        fetchRegistry();
        return () => { isMounted.current = false; };
    }, [fetchRegistry]);

    const handleVerify = async (reqId: number, status: 'Verified' | 'Rejected') => {
        setActioningId(reqId);
        try {
            const { data: authData } = await supabase.auth.getUser();
            if (!authData.user) throw new Error("Security handshake failed: Admin session invalid.");
            const user = authData.user;

            const currentReq = requirements.find(r => r.id === reqId);
            const prevStatus = currentReq?.status || 'Pending';

            const { error: updateError } = await supabase
                .from('document_requirements')
                .update({ 
                    status: status as any, 
                    rejection_reason: status === 'Rejected' ? prompt("Define Rejection Reason for Record Log:") : null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', reqId);
            
            if (updateError) throw updateError;
            
            await supabase.from('admission_audit_logs').insert({
                admission_id: admission.id,
                item_type: 'ARTIFACT_VERIFICATION',
                previous_status: prevStatus,
                new_status: status,
                details: { 
                    action: 'document_audit', 
                    requirement_id: reqId, 
                    document_name: currentReq?.document_name,
                    outcome: status
                },
                changed_by: user.id,
                changed_by_name: user.user_metadata?.display_name || 'Institutional Auditor'
            });

            if (isMounted.current) {
                await fetchRegistry(true);
                onUpdate(); 
            }
        } catch (err) { 
            alert("Protocol Failure: " + formatError(err)); 
        } finally { 
            if (isMounted.current) setActioningId(null); 
        }
    };

    const handleView = async (path: string) => {
        try {
            const { data, error } = await supabase.storage.from('guardian-documents').createSignedUrl(path, 3600);
            if (error) throw error;
            window.open(data.signedUrl, '_blank');
        } catch (e) { alert("Access Denied: Could not resolve artifact path."); }
    };

    const handleFinalize = async () => {
        setFinalizeState('processing');
        try {
            const { data, error } = await supabase.rpc('admin_finalize_enrollment', { 
                p_admission_id: admission.id 
            });
            
            if (error) throw error;
            
            if (data && data.success) {
                if (isMounted.current) {
                    setProvisionedData({ 
                        student_id: data.student_id,
                        student_id_number: data.student_id_number
                    });
                    setFinalizeState('success');
                    onUpdate();
                }
            } else {
                throw new Error(data?.message || "Protocol rejection.");
            }
        } catch (err) { 
            alert("Enrollment Blocked: " + formatError(err)); 
            if (isMounted.current) setFinalizeState('idle'); 
        }
    };

    const handleAIScan = async (reqId: number) => {
        const req = requirements.find(r => r.id === reqId);
        const file = req?.admission_documents?.[0];
        if (!file) return;

        setScanningId(reqId);
        try {
            const { data: signedData, error: urlError } = await supabase.storage
                .from('guardian-documents')
                .createSignedUrl(file.storage_path, 300);
            
            if (urlError) throw urlError;

            const response = await fetch(signedData.signedUrl);
            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(blob);
            });

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const aiResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [
                    {
                        text: `Perform an institutional audit on this artifact: ${req.document_name}. 
                        1. Verify if the document matches the applicant: ${admission.applicant_name}.
                        2. Verify if the document is relevant for Grade ${admission.grade} enrollment.
                        3. Identify any signs of forgery.
                        Output: JSON format {"verified": boolean, "confidence": number, "summary": string}.`
                    },
                    {
                        inlineData: {
                            mimeType: blob.type || 'image/jpeg',
                            data: base64
                        }
                    }
                ]
            });

            const resultText = aiResponse.text || '{}';
            const jsonStr = resultText.replace(/```json|```/g, '').trim();
            const result = JSON.parse(jsonStr);
            
            if (result.verified && result.confidence > 0.8) {
                await handleVerify(reqId, 'Verified');
                alert(`AI Audit Passed: ${result.summary}`);
            } else {
                alert(`AI Flagged Concern: ${result.summary}. Manual inspection required.`);
            }

        } catch (err: any) {
            alert("AI Protocol Error: " + formatError(err));
        } finally {
            if (isMounted.current) setScanningId(null);
        }
    };

    const mandatoryPending = requirements.filter(r => r.is_mandatory && r.status !== 'Verified').length;
    const isCleared = (requirements.length > 0 && mandatoryPending === 0) || admission.status === 'Approved';

    return (
        <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-2xl flex items-center justify-center z-[500] animate-in fade-in duration-300 font-sans" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full md:max-w-[1400px] md:h-[92vh] bg-[#0A0A0A] md:rounded-[24px] border border-white/10 shadow-2xl flex flex-col overflow-hidden relative ring-1 ring-white/5"
                onClick={e => e.stopPropagation()}
            >
                {/* --- HEADER --- */}
                <header className="px-6 py-6 md:px-10 md:py-8 border-b border-white/5 bg-[#0C0C0C] flex flex-col md:flex-row justify-between md:items-center gap-6 relative z-20">
                    <div className="flex items-start gap-6">
                         <div className="relative group">
                             <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
                             <PremiumAvatar 
                                src={admission.profile_photo_url} 
                                name={admission.applicant_name} 
                                size="lg" 
                                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl shadow-2xl relative z-10"
                            />
                         </div>
                         <div>
                             <div className="flex items-center gap-3 mb-1">
                                 <span className="px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Applicant</span>
                                 <div className="w-1 h-1 rounded-full bg-white/10"></div>
                                 <span className="text-[10px] font-mono text-white/30 tracking-widest">{admission.application_number || 'ID_PENDING'}</span>
                             </div>
                             <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight leading-none mb-2">{admission.applicant_name}</h1>
                             <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-white/40">
                                 <span className="flex items-center gap-1.5"><GraduationCapIcon className="w-3.5 h-3.5"/> Grade {admission.grade}</span>
                                 <span className="w-px h-3 bg-white/10"></span>
                                 <span className="flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5"/> Applied {new Date(admission.submitted_at).toLocaleDateString()}</span>
                                 <span className="w-px h-3 bg-white/10"></span>
                                 <span className="flex items-center gap-1.5 text-indigo-400"><ClockIcon className="w-3.5 h-3.5"/> {admission.status}</span>
                             </div>
                         </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 w-full md:w-auto">
                            <button 
                                onClick={() => setActiveView('artifacts')}
                                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'artifacts' ? 'bg-white/10 text-white shadow-sm' : 'text-white/30 hover:text-white/60'}`}
                            >
                                Artifacts
                            </button>
                            <button 
                                onClick={() => setActiveView('audit')}
                                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'audit' ? 'bg-white/10 text-white shadow-sm' : 'text-white/30 hover:text-white/60'}`}
                            >
                                Audit Log
                            </button>
                        </div>
                        <button onClick={onClose} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/30 hover:text-white transition-all border border-white/5"><XIcon className="w-5 h-5"/></button>
                    </div>
                </header>

                {/* --- MAIN CONTENT --- */}
                <div className="flex-grow overflow-hidden relative bg-[#050505]">
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`, backgroundSize: '32px 32px' }}></div>
                    
                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-6 md:p-10">
                        {finalizeState === 'success' ? (
                             <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in zoom-in-95 duration-700">
                                <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-[0_0_60px_rgba(16,185,129,0.2)]">
                                    <CheckCircleIcon className="w-10 h-10 text-emerald-500" />
                                </div>
                                <div className="text-center space-y-4">
                                    <h2 className="text-4xl font-serif font-black text-white tracking-tight">Identity Provisioned</h2>
                                    <p className="text-white/40 max-w-md mx-auto text-sm leading-relaxed font-medium">
                                        The admission cycle is complete. A new student record has been created in the Directory.
                                    </p>
                                </div>
                                
                                <div className="flex flex-col gap-2 w-full max-w-sm">
                                    {provisionedData?.student_id_number && (
                                        <div className="bg-[#111] px-6 py-5 rounded-2xl border border-white/10 flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-all">
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Student ID</span>
                                            <span className="text-xl font-mono font-bold text-emerald-400 tracking-widest">{provisionedData.student_id_number}</span>
                                        </div>
                                    )}
                                </div>

                                <button onClick={() => { onUpdate(); onClose(); }} className="mt-4 px-10 py-4 bg-white text-black text-xs font-black uppercase tracking-[0.2em] rounded-xl hover:bg-white/90 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
                                    Close Console
                                </button>
                             </div>
                        ) : activeView === 'artifacts' ? (
                            <div className="max-w-7xl mx-auto space-y-10">
                                <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Verification Vault</h3>
                                        <p className="text-xs text-white/30 mt-1">Required compliance documents for admission clearance.</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsRequestModalOpen(true)} 
                                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest flex items-center gap-2 transition-colors"
                                    >
                                        <PlusIcon className="w-3.5 h-3.5"/> Request Doc
                                    </button>
                                </div>

                                {fetching ? (
                                    <div className="py-20 flex justify-center"><Spinner size="lg" className="text-white/20"/></div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {requirements.map((req) => {
                                            const file = req.admission_documents?.[0];
                                            const isVerified = req.status === 'Verified';
                                            const isRejected = req.status === 'Rejected';
                                            const isScanning = scanningId === req.id;

                                            return (
                                                <motion.div 
                                                    layout
                                                    key={req.id} 
                                                    className={`
                                                        group relative p-6 rounded-2xl border transition-all duration-300 flex flex-col h-[280px]
                                                        ${isVerified ? 'bg-[#0A100D] border-emerald-500/20' : isRejected ? 'bg-[#120505] border-red-500/20' : 'bg-[#0E0E10] border-white/5 hover:border-white/10 hover:bg-[#121214]'}
                                                    `}
                                                >
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div className={`p-3 rounded-xl ${isVerified ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-white/30'}`}>
                                                            <FileTextIcon className="w-6 h-6"/>
                                                        </div>
                                                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                                                            isVerified ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' : 
                                                            isRejected ? 'bg-red-500/5 text-red-500 border-red-500/20' : 
                                                            'bg-white/5 text-white/30 border-white/5'
                                                        }`}>
                                                            {req.is_mandatory && !isVerified ? 'Mandatory' : req.status}
                                                        </span>
                                                    </div>

                                                    <div className="flex-grow">
                                                        <h4 className="text-sm font-bold text-white mb-1 line-clamp-2 leading-relaxed" title={req.document_name}>{req.document_name}</h4>
                                                        <p className="text-[10px] text-white/30">
                                                            {file ? `Uploaded ${new Date(file.uploaded_at).toLocaleDateString()}` : 'Awaiting Upload'}
                                                        </p>
                                                        {isRejected && <p className="mt-3 text-[10px] text-red-400 leading-relaxed bg-red-500/5 p-2 rounded border border-red-500/10">"{req.rejection_reason}"</p>}
                                                    </div>

                                                    <div className="mt-auto pt-4 border-t border-white/5 grid grid-cols-2 gap-2 opacity-100 md:opacity-40 md:group-hover:opacity-100 transition-opacity">
                                                        {file ? (
                                                            <>
                                                                <button onClick={() => handleView(file.storage_path)} className="py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-white transition-colors">View</button>
                                                                {isVerified ? (
                                                                     <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/5 rounded-lg border border-emerald-500/10 cursor-default">
                                                                         <CheckCircleIcon className="w-3 h-3"/> Locked
                                                                     </div>
                                                                ) : (
                                                                     <div className="flex gap-1">
                                                                        <button onClick={() => handleVerify(req.id, 'Verified')} disabled={!!actioningId} className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg flex items-center justify-center transition-colors"><CheckCircleIcon className="w-4 h-4"/></button>
                                                                        <button onClick={() => handleVerify(req.id, 'Rejected')} disabled={!!actioningId} className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg flex items-center justify-center transition-colors"><XCircleIcon className="w-4 h-4"/></button>
                                                                     </div>
                                                                )}
                                                                {!isVerified && (
                                                                     <button onClick={() => handleAIScan(req.id)} disabled={isScanning} className="col-span-2 py-2 text-[9px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-1.5 transition-colors">
                                                                         {isScanning ? <Spinner size="sm" className="text-current"/> : <><SparklesIcon className="w-3 h-3"/> AI Analysis</>}
                                                                     </button>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className="col-span-2 py-2 text-center text-[10px] font-bold text-white/20 italic">
                                                                Pending Parent Action
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-right-8 duration-500">
                                <div className="border-l-2 border-white/10 pl-8 space-y-10 py-4">
                                    {auditLogs.length === 0 ? <p className="text-white/20 text-sm">No events recorded.</p> : auditLogs.map((log) => (
                                        <div key={log.id} className="relative group">
                                            <div className="absolute -left-[39px] top-1 w-4 h-4 rounded-full bg-[#0A0A0A] border-2 border-white/20 group-hover:border-indigo-500 transition-colors shadow-sm"></div>
                                            <div className="bg-[#111] p-5 rounded-2xl border border-white/5 transition-all hover:border-white/10">
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border ${
                                                        log.item_type === 'ENROLLMENT_FINALIZED' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                                                        log.item_type === 'ARTIFACT_VERIFICATION' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                                                        'text-white/40 bg-white/5 border-white/5'
                                                    }`}>
                                                        {log.item_type.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-white/30">{new Date(log.created_at).toLocaleString()}</span>
                                                </div>
                                                <p className="text-sm text-white/80 leading-relaxed font-medium">
                                                    {log.item_type === 'ENROLLMENT_FINALIZED' 
                                                        ? 'Student successfully enrolled and profile created.' 
                                                        : `Status updated from ${log.previous_status} to ${log.new_status}`}
                                                </p>
                                                {log.details && (
                                                    <div className="mt-3 p-3 bg-black/40 rounded-xl text-xs font-mono text-white/50 border border-white/5">
                                                        {JSON.stringify(log.details, null, 2)}
                                                    </div>
                                                )}
                                                <div className="mt-3 flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold text-white/60">
                                                        {(log.changed_by_name || 'Sys').charAt(0)}
                                                    </div>
                                                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-wide">{log.changed_by_name || 'System'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- FOOTER --- */}
                {finalizeState !== 'success' && (
                    <footer className="px-6 py-4 md:px-10 md:py-6 bg-[#0C0C0C] border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 z-50">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className={`p-2 rounded-full ${isCleared ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                {isCleared ? <CheckCircleIcon className="w-5 h-5"/> : <AlertTriangleIcon className="w-5 h-5"/>}
                            </div>
                            <div>
                                <p className={`text-xs font-bold uppercase tracking-wider ${isCleared ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {isCleared ? 'Cleared for Enrollment' : 'Pending Clearance'}
                                </p>
                                <p className="text-[10px] text-white/30 font-medium mt-0.5">
                                    {isCleared ? 'All mandatory artifacts verified.' : `${mandatoryPending} mandatory items remaining.`}
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={handleFinalize}
                            disabled={!isCleared || finalizeState !== 'idle'}
                            className={`
                                w-full md:w-auto px-8 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3
                                ${isCleared 
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_30px_rgba(5,150,105,0.3)] hover:shadow-[0_0_40px_rgba(5,150,105,0.5)] transform hover:-translate-y-0.5 active:scale-95' 
                                    : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'}
                            `}
                        >
                            {finalizeState === 'processing' ? <Spinner size="sm" className="text-current"/> : <><GraduationCapIcon className="w-4 h-4"/> Finalize Enrollment</>}
                        </button>
                    </footer>
                )}
            </motion.div>

             {isRequestModalOpen && (
                <RequestDocumentsModal 
                    admissionId={admission.id} applicantName={admission.applicant_name}
                    onClose={() => setIsRequestModalOpen(false)}
                    onSuccess={() => { setIsRequestModalOpen(false); fetchRegistry(true); }}
                />
            )}
        </div>
    );
};

export default AdmissionDetailsModal;
