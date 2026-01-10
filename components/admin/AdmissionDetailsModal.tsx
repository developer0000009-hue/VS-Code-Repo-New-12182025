import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdmissionApplication, DocumentRequirement, TimelineItem } from '../../types';
import { XIcon } from '../icons/XIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { EyeIcon } from '../icons/EyeIcon';
import { FileTextIcon } from '../icons/FileTextIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { GraduationCapIcon } from '../icons/GraduationCapIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { KeyIcon } from '../icons/KeyIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { HistoryIcon } from '../icons/HistoryIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { supabase, formatError } from '../../services/supabase';
import Spinner from '../common/Spinner';
import { RequestDocumentsModal } from '../AdmissionsTab';
import PremiumAvatar from '../common/PremiumAvatar';

interface AdmissionDetailsModalProps {
    admission: AdmissionApplication;
    onClose: () => void;
    onUpdate: () => void;
}

const AdmissionDetailsModal: React.FC<AdmissionDetailsModalProps> = ({ admission, onClose, onUpdate }) => {
    const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [activeView, setActiveView] = useState<'audit' | 'history'>('audit');
    const [actioningId, setActioningId] = useState<string | null>(null);
    const [finalizeState, setFinalizeState] = useState<'idle' | 'processing' | 'success'>('idle');
    const [provisionedData, setProvisionedData] = useState<{ student_id: string; student_id_number?: string } | null>(null);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [downloadingPath, setDownloadingPath] = useState<string | null>(null);
    const isMounted = useRef(true);

    const fetchRegistry = useCallback(async (isSilent = false) => {
        if (!isSilent) setFetching(true);
        try {
            await supabase.rpc('parent_initialize_vault_slots', { p_admission_id: admission.id });
            const [reqsRes, logsRes] = await Promise.all([
                supabase.from('document_requirements').select(`*, admission_documents (id, file_name, storage_path, uploaded_at)`).eq('admission_id', admission.id).order('is_mandatory', { ascending: false }),
                supabase.from('admission_audit_logs').select('*').eq('admission_id', admission.id).order('created_at', { ascending: false })
            ]);
            if (reqsRes.error) throw reqsRes.error;
            if (isMounted.current) { setRequirements(reqsRes.data || []); setAuditLogs(logsRes.data || []); }
        } catch (err) { console.error("Governance Sync Failure:", formatError(err)); }
        finally { if (isMounted.current) setFetching(false); }
    }, [admission.id]);

    useEffect(() => {
        isMounted.current = true; fetchRegistry();
        return () => { isMounted.current = false; };
    }, [fetchRegistry]);

    const handleVerify = async (reqId: string, status: 'Verified' | 'Rejected') => {
        setActioningId(reqId);
        try {
            const { data: authData } = await supabase.auth.getUser();
            if (!authData.user) throw new Error("Security handshake failed: Admin session invalid.");
            const user = authData.user;
            const currentReq = requirements.find(r => r.id === reqId);
            const prevStatus = currentReq?.status || 'Pending';
            const { error: updateError } = await supabase.from('document_requirements').update({ status: status as any, rejection_reason: status === 'Rejected' ? prompt("Define Rejection Reason:") : null, updated_at: new Date().toISOString() }).eq('id', reqId);
            if (updateError) throw updateError;
            await supabase.from('admission_audit_logs').insert({ admission_id: admission.id, item_type: 'ARTIFACT_VERIFICATION', previous_status: prevStatus, new_status: status, details: { action: 'document_audit', requirement_id: reqId, document_name: currentReq?.document_name, outcome: status }, changed_by: user.id, changed_by_name: user.user_metadata?.display_name || 'Institutional Auditor' });
            if (isMounted.current) { await fetchRegistry(true); onUpdate(); }
        } catch (err) { alert("Protocol Failure: " + formatError(err)); }
        finally { if (isMounted.current) setActioningId(null); }
    };

    const handleView = async (path: string) => {
        try {
            const { data, error } = await supabase.storage.from('guardian-documents').createSignedUrl(path, 3600);
            if (error) throw error;
            window.open(data.signedUrl, '_blank');
        } catch (e) { alert("Protocol Failure: Could not resolve artifact path."); }
    };

    const handleDownload = async (path: string, fileName: string) => {
        setDownloadingPath(path);
        try {
            const { data, error } = await supabase.storage.from('guardian-documents').download(path);
            if (error) throw error;
            const blob = new Blob([data], { type: data.type });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a);
        } catch (err) { alert("Protocol Failure: Asset retrieval timed out."); }
        finally { setDownloadingPath(null); }
    };

    const mandatoryPending = requirements.filter(r => r.is_mandatory && r.status !== 'Verified').length;
    const isCleared = requirements.length > 0 && mandatoryPending === 0;

    const handleFinalize = async () => {
        setFinalizeState('processing');
        try {
            const { data, error } = await supabase.rpc('admin_transition_admission', { p_admission_id: admission.id, p_next_status: 'Approved' });
            if (error) throw error;
            const isSuccess = data.success === true || (data.student_id && !data.error);
            if (!isSuccess) throw new Error(data.message || "Protocol rejection.");
            if (isMounted.current) { setProvisionedData({ student_id: data.student_id, student_id_number: data.student_id_number }); setFinalizeState('success'); onUpdate(); }
        } catch (err) { alert("Enrollment Protocol Blocked: " + formatError(err)); if (isMounted.current) setFinalizeState('idle'); }
    };

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center z-[300] p-0 sm:p-6" onClick={onClose}>
            <div className="bg-[#090a0f] w-full h-full sm:h-[95vh] sm:max-w-7xl sm:rounded-[3.5rem] shadow-[0_64px_128px_-24px_rgba(0,0,0,1)] border-0 sm:border border-white/10 flex flex-col relative ring-1 ring-white/5 animate-in zoom-in-95 duration-500 overflow-hidden" onClick={e => e.stopPropagation()}>
                <header className="px-8 md:px-12 py-5 md:py-6 border-b border-white/5 bg-[#0f1116]/90 backdrop-blur-xl flex flex-wrap justify-between items-center z-40 relative flex-shrink-0"><div className="space-y-1.5"><div className="flex items-center gap-4 flex-wrap"><h3 className="text-lg md:text-xl font-serif font-black text-white tracking-widest uppercase">Identity Review</h3><div className="h-4 w-px bg-white/10 hidden sm:block"></div><span className="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm">Admission Scope</span></div><p className="text-[9px] font-mono font-bold text-white/10 uppercase tracking-[0.2em] flex items-center gap-2"><KeyIcon className="w-3 h-3" /> TRACE: {String(admission.id).substring(0, 18).toUpperCase()}...</p></div><div className="flex items-center gap-3 mt-4 sm:mt-0"><button onClick={() => setActiveView(activeView === 'audit' ? 'history' : 'audit')} className="p-2.5 px-5 rounded-xl bg-white/5 hover:bg-white/10 text-white/30 hover:text-white transition-all flex items-center gap-2 font-black text-[8px] uppercase tracking-widest border border-white/5 shadow-inner"><HistoryIcon className="w-3.5 h-3.5"/> {activeView === 'history' ? 'View Registry' : 'Security Trace'}</button><button onClick={onClose} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/30 hover:text-white transition-all transform active:scale-90 border border-white/5"><XIcon className="w-5 h-5"/></button></div></header>
                <div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-12 space-y-10 bg-background relative z-30">{finalizeState === 'success' ? (<div className="h-full flex flex-col items-center justify-center space-y-8 animate-in zoom-in-95 duration-1000"><div className="relative"><div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"></div><CheckCircleIcon className="w-24 h-24 text-emerald-500 relative z-10 animate-in zoom-in-50" /></div><div className="text-center space-y-3"><h2 className="text-4xl md:text-5xl font-serif font-black text-white tracking-tighter uppercase leading-none">Protocol <span className="text-white/20 italic">Finalized.</span></h2><p className="text-white/40 text-lg font-serif italic">Identity node integrated successfully.</p>{provisionedData?.student_id_number && (<div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-2xl"><p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Generated Institutional ID</p><p className="text-2xl font-mono font-black text-primary tracking-widest">{provisionedData.student_id_number}</p></div>)}</div><button onClick={() => { onUpdate(); onClose(); }} className="px-12 py-4 bg-white text-black font-black text-[10px] uppercase tracking-[0.5em] rounded-xl hover:bg-white/90 transition-all active:scale-95">Return to Console</button></div>) : activeView === 'history' ? (<div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right-12 duration-700"><div className="flex items-center gap-3 border-b border-white/5 pb-3"><div className="p-2 bg-primary/10 rounded-xl text-primary shadow-inner border border-primary/20"><HistoryIcon className="w-5 h-5"/></div><h3 className="text-lg font-black text-white uppercase tracking-tighter">Identity Trace Ledger</h3></div><div className="relative border-l-2 border-white/5 ml-4 space-y-10 py-2">{auditLogs.length === 0 ? <p className="text-white/10 italic p-8">No security events found.</p> : auditLogs.map(log => (<div key={log.id} className="relative pl-10 group"><div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-[#090a0f] border-2 border-primary z-10"></div><div className="bg-[#101218] border border-white/5 p-6 rounded-[2rem]"><div className="flex justify-between items-start mb-2"><h4 className="font-bold text-white text-sm uppercase tracking-wider">{log.item_type}</h4><span className="text-[9px] font-mono text-white/20 uppercase">{new Date(log.created_at).toLocaleString()}</span></div><p className="text-xs text-white/40 italic font-serif">Status update: <span className="text-primary font-bold">{log.new_status}</span></p></div></div>))}</div></div>) : (<><div className="flex flex-col md:flex-row items-center gap-8 bg-[#0c0d12] p-8 md:p-10 rounded-[3rem] border border-white/5 relative overflow-hidden group"><div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none opacity-40"></div><PremiumAvatar src={admission.profile_photo_url} name={admission.applicant_name} size="lg" className="ring-[10px] ring-white/[0.01] border-4 border-[#0c0d12] shadow-2xl group-hover:scale-105 transition-transform duration-700"/><div className="flex-grow text-center md:text-left space-y-4"><h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-black text-white tracking-tighter uppercase leading-none drop-shadow-2xl">{admission.applicant_name}</h2><div className="flex flex-wrap justify-center md:justify-start items-center gap-3 text-[9px] font-black text-white/30 uppercase tracking-[0.3em]"><span className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-xl border border-white/5"><ShieldCheckIcon className="w-3.5 h-3.5 text-primary opacity-60"/> Grade {admission.grade} Node</span><span className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-xl border border-white/5"><CalendarIcon className="w-3.5 h-3.5 text-white/20"/> Registered: {new Date(admission.submitted_at).toLocaleDateString()}</span></div></div></div><div className="space-y-6"><div className="flex flex-col sm:flex-row justify-between items-end gap-4 border-b border-white/5 pb-5"><div className="space-y-1.5"><h4 className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em]">Artifact Compliance Registry</h4><p className="text-[10px] text-white/15 font-medium italic">Resolving artifact clearance for identity sealing protocol.</p></div><button onClick={() => setIsRequestModalOpen(true)} className="px-6 py-2.5 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 border border-primary/20 shadow-xl active:scale-95"><PlusIcon className="w-3.5 h-3.5"/> New Artifact Request</button></div>{fetching ? (<div className="py-24 text-center flex flex-col items-center gap-4"><Spinner size="lg" className="text-primary"/><p className="text-[9px] font-black uppercase text-white/20 tracking-[0.4em] animate-pulse">Syncing Lifecycle...</p></div>) : (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">{requirements.map(req => { const file = req.admission_documents?.[0]; const isVerified = req.status === 'Verified'; const isRejected = req.status === 'Rejected'; return (<div key={req.id} className={`p-6 rounded-[2rem] border transition-all duration-500 bg-[#101218]/60 backdrop-blur-md flex flex-col group ${isVerified ? 'border-emerald-500/20 bg-emerald-500/[0.02]' : isRejected ? 'border-rose-500/20 bg-rose-500/[0.02]' : 'border-white/5 hover:border-white/10'}`}><div className="flex justify-between items-start mb-5"><div className={`p-3 rounded-xl transition-all duration-500 shadow-inner ${isVerified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-white/20 border border-white/5'}`}><FileTextIcon className="w-6 h-6"/></div><span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-lg border tracking-widest ${isVerified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]' : isRejected ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>{req.status}</span></div><div className="flex-grow"><h5 className="text-base font-black text-white uppercase tracking-tight mb-1.5 group-hover:text-primary transition-colors">{req.document_name}</h5>{isRejected && req.rejection_reason && (<div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl mb-4 text-[10px] text-rose-300/80 italic leading-relaxed">"{req.rejection_reason}"</div>)}<p className="text-[10px] text-white/20 italic mb-5 flex items-center gap-2">{file ? <CheckCircleIcon className="w-3 h-3 text-emerald-500/40" /> : <div className="w-1 h-1 rounded-full bg-white/10" />}{file ? "Synced" : "Awaiting Protocol Sync"}</p></div><div className="flex gap-2">{file ? (<><button onClick={() => handleView(file.storage_path)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/5 text-[8px] font-black text-white/50 hover:text-white uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 group/inspect"><EyeIcon className="w-3.5 h-3.5 group-hover/inspect:scale-110 transition-transform"/> Inspect</button><button onClick={() => handleDownload(file.storage_path, file.file_name)} disabled={downloadingPath === file.storage_path} className="px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-white/30 hover:text-primary transition-all shadow-md">{downloadingPath === file.storage_path ? <Spinner size="sm" /> : <DownloadIcon className="w-3.5 h-3.5"/>}</button>{!isVerified && (<div className="flex gap-2"><button onClick={() => handleVerify(req.id, 'Verified')} disabled={actioningId === req.id} className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all">{actioningId === req.id ? <Spinner size="sm"/> : <CheckCircleIcon className="w-4 h-4"/>}</button><button onClick={() => handleVerify(req.id, 'Rejected')} disabled={actioningId === req.id} className="p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-red-500/20 border border-rose-500/20 transition-all">{actioningId === req.id ? <Spinner size="sm"/> : <XCircleIcon className="w-4 h-4"/>}</button></div>)}</>) : (<div className="w-full py-3 border-2 border-dashed border-white/5 rounded-2xl text-center text-[8px] font-black text-white/10 uppercase tracking-[0.2em] italic">Handshake Pending</div>)}</div></div>) })}</div>)}</div></>)}</div>{finalizeState !== 'success' && (<footer className="px-10 py-8 bg-[#0d0e14] border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6 z-50 relative shadow-[0_-16px_48px_rgba(0,0,0,0.5)] flex-shrink-0"><div className="flex items-center gap-6"><div className={`w-3.5 h-3.5 rounded-full transition-all duration-1000 ${isCleared ? 'bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]' : 'bg-white/5'}`}></div><div className="space-y-0.5"><span className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em] leading-none">Governance Protocol</span><h5 className={`text-base font-black uppercase tracking-tight transition-colors duration-1000 ${isCleared ? 'text-emerald-500' : 'text-white/40'}`}>{isCleared ? 'CLEARED FOR ENROLLMENT' : 'PENDING ARTIFACT CLEARANCE'}</h5></div></div><button onClick={handleFinalize} disabled={!isCleared || finalizeState !== 'idle'} className={`w-full md:w-auto px-12 h-16 rounded-[2rem] flex items-center justify-center gap-4 font-black text-[11px] uppercase tracking-[0.3em] transition-all duration-700 shadow-2xl ${isCleared ? 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED] hover:scale-105 active:scale-95 shadow-[#8B5CF6]/30' : 'bg-white/5 text-white/5 cursor-not-allowed grayscale border border-white/5'}`}><GraduationCapIcon className="w-6 h-6 opacity-60" /><span>{finalizeState === 'processing' ? 'PROCESSING IDENTITY...' : 'FINALIZE ENROLLMENT'}</span></button></footer>)}</div>{isRequestModalOpen && (<RequestDocumentsModal admissionId={admission.id} applicantName={admission.applicant_name} onClose={() => setIsRequestModalOpen(false)} onSuccess={() => { setIsRequestModalOpen(false); fetchRegistry(true); }} />)}</div>
    );
};

export default AdmissionDetailsModal;