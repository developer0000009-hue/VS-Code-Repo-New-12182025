import React, { useState, useEffect, useCallback } from 'react';
import { AdmissionApplication, DocumentRequirement } from '../../types';
import { XIcon } from '../icons/XIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { EyeIcon } from '../icons/EyeIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { FileTextIcon } from '../icons/FileTextIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { supabase, formatError } from '../../services/supabase';
import Spinner from '../common/Spinner';

interface AdmissionDetailsModalProps {
    admission: AdmissionApplication;
    onClose: () => void;
    onUpdate: () => void;
}

const AdmissionDetailsModal: React.FC<AdmissionDetailsModalProps> = ({ admission, onClose, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
    const [fetchingDocs, setFetchingDocs] = useState(true);
    const [actioningDocId, setActioningDocId] = useState<number | null>(null);

    // Additional Doc Request State
    const [isRequestingNew, setIsRequestingNew] = useState(false);
    const [newDocName, setNewDocName] = useState('');
    const [newDocMandatory, setNewDocMandatory] = useState(true);
    const [newDocNotes, setNewDocNotes] = useState('');

    const fetchRequirements = useCallback(async () => {
        setFetchingDocs(true);
        try {
            const { data, error } = await supabase
                .from('document_requirements')
                .select('*, admission_documents(*)')
                .eq('admission_id', admission.id)
                .order('is_mandatory', { ascending: false });
            
            if (error) throw error;
            setRequirements(data || []);
        } catch (err) {
            console.error("Vault Synchronization Failure:", err);
        } finally {
            setFetchingDocs(false);
        }
    }, [admission.id]);

    useEffect(() => {
        fetchRequirements();
    }, [fetchRequirements]);

    const handleVerifyDoc = async (docId: number) => {
        setActioningDocId(docId);
        try {
            const { error } = await supabase.rpc('admin_verify_document', {
                p_requirement_id: docId,
                p_status: 'Accepted'
            });
            if (error) throw error;
            await fetchRequirements();
        } catch (err: any) {
            alert(formatError(err));
        } finally {
            setActioningDocId(null);
        }
    };

    const handleRejectDoc = async (docId: number) => {
        const reason = prompt("Enter rejection reason for parent corrective action:");
        if (!reason) return;
        
        setActioningDocId(docId);
        try {
            const { error } = await supabase.rpc('admin_verify_document', {
                p_requirement_id: docId,
                p_status: 'Rejected',
                p_reason: reason
            });
            if (error) throw error;
            await fetchRequirements();
        } catch (err: any) {
            alert(formatError(err));
        } finally {
            setActioningDocId(null);
        }
    };

    const handleActionFile = async (path: string, download = false) => {
        try {
            const { data, error } = await supabase.storage
                .from('guardian-documents')
                .createSignedUrl(path, 3600);
            
            if (error) throw error;
            if (data?.signedUrl) {
                if (download) {
                    const link = document.createElement('a');
                    link.href = data.signedUrl;
                    link.download = path.split('/').pop() || 'document';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    window.open(data.signedUrl, '_blank');
                }
            }
        } catch (err: any) {
            alert("Secure Access Failed: " + formatError(err));
        }
    };

    const handleRequestNewDoc = async () => {
        if (!newDocName.trim()) return;
        setLoading(true);
        try {
            const { error } = await supabase.rpc('admin_request_additional_document', {
                p_admission_id: admission.id,
                p_document_name: newDocName,
                p_is_mandatory: newDocMandatory,
                p_notes: newDocNotes
            });
            if (error) throw error;
            setNewDocName('');
            setNewDocNotes('');
            setIsRequestingNew(false);
            await fetchRequirements();
        } catch (err: any) {
            alert(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    const mandatoryPending = requirements
        .filter(r => r.is_mandatory)
        .filter(r => {
            const s = (r.status || '').toUpperCase();
            return s !== 'ACCEPTED' && s !== 'VERIFIED';
        }).length;

    const canApprove = mandatoryPending === 0 && !fetchingDocs && requirements.length > 0;
    const isAlreadyApproved = admission.status === 'Approved';

    const handleFinalizeEnrollment = async () => {
        if (!canApprove) {
            alert("Validation Interrupted: Mandatory artifacts must be verified before identity seal.");
            return;
        }
        
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('admin_transition_admission', {
                p_admission_id: admission.id,
                p_next_status: 'Approved'
            });
            
            if (error) throw error;

            // Handle potential array response from PostgREST
            const response = Array.isArray(data) ? data[0] : data;

            if (response && response.success) {
                // 1. Sync local directory
                onUpdate();
                
                // 2. High-fidelity feedback
                alert("Identity Sealed Successfully! Student has been provisioned to the Active Directory.");
                
                // 3. Execution of Redirection Protocol
                onClose();
                window.location.hash = '#/Student Management';
            } else {
                alert(response?.message || "Enrollment protocol rejected by central registry.");
            }
        } catch (err: any) {
            console.error("Finalization Crash:", err);
            alert("Critical Protocol Failure: " + formatError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[300] p-4" onClick={onClose}>
            <div className="bg-[#0f1116] w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="p-8 border-b border-white/5 bg-card/40 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h3 className="text-2xl font-black text-white font-serif tracking-tight">Node Identity Review</h3>
                        <p className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em] mt-1">Artifact Trace: {admission.id.slice(0,12)}</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/50 hover:text-white transition-all"><XIcon className="w-6 h-6"/></button>
                </header>

                <div className="flex-grow overflow-y-auto custom-scrollbar p-8 space-y-10">
                    {/* 1. Identity Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div className="flex items-center gap-8">
                            <div className="w-24 h-24 rounded-[2rem] bg-indigo-500/10 text-indigo-400 font-black flex items-center justify-center text-4xl border border-indigo-500/20 shadow-inner">
                                {(admission.applicant_name || 'A').charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white tracking-tighter uppercase font-serif">{admission.applicant_name}</h2>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-[10px] font-black bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-lg border border-indigo-500/20 uppercase tracking-widest">Grade {admission.grade} Node</span>
                                    <div className="h-4 w-px bg-white/10"></div>
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{new Date(admission.submitted_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Request Additional Doc Trigger */}
                        <button 
                            onClick={() => setIsRequestingNew(!isRequestingNew)}
                            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                        >
                            <PlusIcon className="w-4 h-4"/> Request New Document
                        </button>
                    </div>

                    {/* 2. Additional Document Request Form (Injectable) */}
                    {isRequestingNew && (
                        <div className="p-8 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/20 animate-in slide-in-from-top-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Document Name</label>
                                        <input 
                                            value={newDocName}
                                            onChange={e => setNewDocName(e.target.value)}
                                            placeholder="e.g. Immunization Record"
                                            className="w-full p-4 rounded-2xl border border-white/5 bg-black/40 text-white text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
                                        />
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-black/20 rounded-2xl border border-white/5 cursor-pointer" onClick={() => setNewDocMandatory(!newDocMandatory)}>
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${newDocMandatory ? 'bg-indigo-500 border-indigo-500' : 'border-white/20'}`}>
                                            {newDocMandatory && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Mark as Mandatory</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Instructions for Parent</label>
                                    <textarea 
                                        value={newDocNotes}
                                        onChange={e => setNewDocNotes(e.target.value)}
                                        placeholder="Add notes about format or specific requirements..."
                                        className="w-full p-4 h-[116px] rounded-2xl border border-white/5 bg-black/40 text-white text-sm focus:border-indigo-500 outline-none resize-none transition-all font-medium"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setIsRequestingNew(false)} className="px-6 py-2 text-[10px] font-black text-white/30 uppercase tracking-widest">Discard</button>
                                <button onClick={handleRequestNewDoc} disabled={loading || !newDocName} className="px-10 py-3 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">Send Request</button>
                            </div>
                        </div>
                    )}

                    {/* 3. Verification Index Alert */}
                    {!isAlreadyApproved && (
                        <div className={`p-6 rounded-3xl border flex items-start gap-5 transition-all shadow-lg ${canApprove ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/5 border-amber-500/20 text-amber-500'}`}>
                            {fetchingDocs ? <Spinner size="sm" className="mt-1" /> : canApprove ? <CheckCircleIcon className="w-8 h-8 shrink-0" /> : <AlertTriangleIcon className="w-8 h-8 shrink-0" />}
                            <div>
                                <p className="text-sm font-black uppercase tracking-widest">
                                    {fetchingDocs ? 'Synchronizing Vault...' : canApprove ? 'Identity Seal Ready' : 'Verification Incomplete'}
                                </p>
                                <p className="text-xs font-medium opacity-70 mt-1 leading-relaxed max-w-lg italic font-serif">
                                    {fetchingDocs 
                                        ? 'Fetching document registry status from master node cluster.' 
                                        : canApprove 
                                            ? 'All mandatory artifacts verified. Node is cleared for student provisioning and system integration.' 
                                            : `Node requires ${mandatoryPending} mandatory document(s) to be audited before the identity seal can be finalized.`
                                    }
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 4. Documents Audit List */}
                    <section>
                        <h4 className="text-[10px] font-black uppercase text-white/30 tracking-[0.4em] mb-6 pl-1">Documentation Audit Registry</h4>
                        <div className="space-y-4">
                            {fetchingDocs ? (
                                <div className="py-20 flex flex-col items-center justify-center opacity-20"><Spinner size="lg"/><p className="text-[10px] font-black uppercase tracking-widest mt-4">Decrypting Ledger</p></div>
                            ) : (
                                requirements.map(req => {
                                    const file = req.admission_documents?.[0];
                                    const isLocked = req.status === 'Accepted' || req.status === 'Verified';
                                    const isRejected = req.status === 'Rejected';
                                    
                                    return (
                                        <div key={req.id} className={`p-6 rounded-[2rem] border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${isLocked ? 'bg-emerald-500/[0.02] border-emerald-500/20' : isRejected ? 'bg-rose-500/[0.02] border-rose-500/20' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}>
                                            <div className="flex items-center gap-5 min-w-0">
                                                <div className={`p-4 rounded-2xl shadow-inner border transition-all ${isLocked ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : isRejected ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-white/5 text-white/20 border-white/10'}`}>
                                                    <FileTextIcon className="w-6 h-6"/>
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <p className="font-black text-white text-base truncate uppercase tracking-tight leading-none">{req.document_name}</p>
                                                        {req.is_mandatory && <span className="text-[8px] font-black uppercase text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded shadow-sm">Mandatory</span>}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border shadow-sm ${
                                                            isLocked ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                                            isRejected ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                                                            'bg-white/5 text-white/30 border-white/10'
                                                        }`}>
                                                            {req.status}
                                                        </span>
                                                        {file && <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">{file.file_name.slice(-16)}</p>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 flex-shrink-0 w-full md:w-auto">
                                                {file ? (
                                                    <div className="flex gap-2 w-full">
                                                        <button 
                                                            onClick={() => handleActionFile(file.storage_path, false)}
                                                            className="flex-1 md:flex-none p-3.5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-2xl transition-all border border-white/10 shadow-xl"
                                                            title="View In Browser"
                                                        >
                                                            <EyeIcon className="w-5 h-5"/>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleActionFile(file.storage_path, true)}
                                                            className="flex-1 md:flex-none p-3.5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-emerald-400 rounded-2xl transition-all border border-white/10 shadow-xl"
                                                            title="Download Locally"
                                                        >
                                                            <DownloadIcon className="w-5 h-5"/>
                                                        </button>
                                                        <div className="w-px h-10 bg-white/5 mx-1 hidden md:block"></div>
                                                        {!isLocked && (
                                                            <div className="flex gap-2 animate-in fade-in flex-grow md:flex-grow-0">
                                                                <button 
                                                                    onClick={() => handleVerifyDoc(req.id)}
                                                                    disabled={actioningDocId === req.id}
                                                                    className="flex-1 md:flex-none px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-90 flex items-center justify-center gap-2"
                                                                >
                                                                    {actioningDocId === req.id ? <Spinner size="sm"/> : <><CheckCircleIcon className="w-4 h-4"/> Approve</>}
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleRejectDoc(req.id)}
                                                                    disabled={actioningDocId === req.id}
                                                                    className="flex-1 md:flex-none px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl transition-all shadow-xl shadow-rose-500/20 active:scale-90 flex items-center justify-center gap-2"
                                                                >
                                                                    {actioningDocId === req.id ? <Spinner size="sm"/> : <><XCircleIcon className="w-4 h-4"/> Reject</>}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-end w-full md:w-auto">
                                                        <span className="text-[10px] font-black uppercase text-white/10 tracking-[0.2em] px-4 py-2 bg-white/5 rounded-xl border border-dashed border-white/10">Identity Awaiting Sync</span>
                                                        <button onClick={() => handleRejectDoc(req.id)} className="text-[8px] font-black uppercase text-rose-500/40 hover:text-rose-500 mt-2 tracking-widest transition-colors">Issue Manual Rejection</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>
                </div>

                <footer className="p-8 border-t border-white/5 bg-card/40 flex flex-wrap justify-between items-center gap-4 flex-shrink-0">
                    <button 
                        onClick={onClose}
                        className="px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.4em] text-white/30 hover:text-white transition-colors"
                    >
                        Discard Protocol
                    </button>
                    
                    <div className="flex gap-4">
                        <div className="hidden xl:flex items-center gap-3 mr-4">
                             <div className={`w-2 h-2 rounded-full ${canApprove ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                             <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Governance Verification: {canApprove ? 'CLEARED' : 'PENDING'}</span>
                        </div>
                        <button 
                            onClick={handleFinalizeEnrollment}
                            disabled={loading || isAlreadyApproved || !canApprove}
                            className={`px-12 py-4 rounded-2xl flex items-center gap-3 transition-all font-black text-xs uppercase tracking-[0.2em] shadow-2xl ${canApprove ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30 active:scale-95' : 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5 grayscale pointer-events-none opacity-50'}`}
                        >
                            {loading ? <Spinner size="sm" className="text-white"/> : <><CheckCircleIcon className="w-5 h-5"/> Finalize Enrollment</>}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default AdmissionDetailsModal;