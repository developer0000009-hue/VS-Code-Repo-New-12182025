
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, formatError } from '../../services/supabase';
import { AdmissionApplication } from '../../types';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { UserIcon } from '../icons/UserIcon';
import { MailIcon } from '../icons/MailIcon';
import { PhoneIcon } from '../icons/PhoneIcon';
import { FileTextIcon } from '../icons/FileTextIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { EyeIcon } from '../icons/EyeIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { StorageService, BUCKETS } from '../../services/storage';

interface AdmissionDetailsModalProps {
    admission: AdmissionApplication;
    onClose: () => void;
    onUpdate: () => void;
}

const AdmissionDetailsModal: React.FC<AdmissionDetailsModalProps> = ({ admission, onClose, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [docs, setDocs] = useState<any[]>([]);
    const [finalizeState, setFinalizeState] = useState<'idle' | 'processing' | 'success'>('idle');
    const [provisionedData, setProvisionedData] = useState<{ student_id: string; student_id_number: string } | null>(null);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    const fetchDocs = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('document_requirements')
                .select('*, admission_documents(*)')
                .eq('admission_id', admission.id);
            if (error) throw error;
            if (isMounted.current) setDocs(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, [admission.id]);

    useEffect(() => {
        fetchDocs();
    }, [fetchDocs]);

    const handleDownload = async (doc: any) => {
        const file = doc.admission_documents?.[0];
        if (!file?.storage_path) return;

        setDownloadingId(doc.id);
        try {
            const { data, error } = await supabase.storage.from(BUCKETS.DOCUMENTS).download(file.storage_path);
            if (error) throw error;
            
            const url = window.URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.file_name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error("Download error:", err);
            alert("Download failed: " + (err.message || "File access denied."));
        } finally {
            if (isMounted.current) setDownloadingId(null);
        }
    };

    const handleFinalize = async () => {
        setFinalizeState('processing');
        try {
            // Call the enhanced RPC
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
                    // Allow UI to show success state briefly before updating parent list
                    setTimeout(() => {
                        onUpdate(); 
                    }, 1500);
                }
            } else {
                throw new Error(data?.message || "Protocol rejection by enrollment engine.");
            }
        } catch (err: any) { 
            console.error("Enrollment Error:", err);
            alert("Enrollment Failed: " + (err.message || "Database transaction error.")); 
            if (isMounted.current) setFinalizeState('idle'); 
        }
    };

    const handleVerifyDoc = async (docId: number) => {
        try {
            await supabase.from('document_requirements').update({ status: 'Verified' }).eq('id', docId);
            fetchDocs();
        } catch (e) { console.error(e); }
    };

    const handleRejectDoc = async (docId: number) => {
        const reason = prompt("Enter rejection reason:");
        if(!reason) return;
        try {
             await supabase.from('document_requirements').update({ status: 'Rejected', rejection_reason: reason }).eq('id', docId);
             fetchDocs();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-in fade-in">
            <div className="bg-[#0f1115] w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-white/10 flex flex-col max-h-[90vh] overflow-hidden relative ring-1 ring-white/5" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                            {admission.applicant_name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">{admission.applicant_name}</h2>
                            <p className="text-sm text-white/40 font-medium uppercase tracking-widest mt-1">Grade {admission.grade} • {admission.application_number || 'PENDING'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-full hover:bg-white/5 text-white/30 hover:text-white transition-colors"><XIcon className="w-6 h-6"/></button>
                </div>

                <div className="flex-grow overflow-y-auto p-8 custom-scrollbar space-y-8">
                    {/* Status Banner */}
                    {finalizeState === 'success' && (
                        <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4 animate-in zoom-in">
                            <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
                            <div>
                                <h3 className="text-lg font-bold text-emerald-500">Enrollment Complete</h3>
                                <p className="text-emerald-500/60 text-sm">Student ID: <span className="font-mono font-bold text-emerald-400">{provisionedData?.student_id_number}</span></p>
                            </div>
                        </div>
                    )}

                    {/* Applicant Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase text-white/20 tracking-[0.3em] mb-4">Applicant Data</h3>
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
                                <div className="flex items-center gap-4">
                                    <UserIcon className="w-5 h-5 text-white/20"/>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-white/30">Parent Name</p>
                                        <p className="text-white font-medium">{admission.parent_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <MailIcon className="w-5 h-5 text-white/20"/>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-white/30">Contact Email</p>
                                        <p className="text-white font-medium">{admission.parent_email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <PhoneIcon className="w-5 h-5 text-white/20"/>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-white/30">Contact Phone</p>
                                        <p className="text-white font-medium">{admission.parent_phone}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase text-white/20 tracking-[0.3em] mb-4">Documentation</h3>
                            <div className="space-y-3">
                                {loading ? <Spinner /> : docs.length === 0 ? <p className="text-white/20 text-sm italic">No documents requested.</p> : docs.map(doc => (
                                    <div key={doc.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl group hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${doc.status === 'Verified' ? 'bg-emerald-500/10 text-emerald-500' : doc.status === 'Rejected' ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-white/30'}`}>
                                                <FileTextIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{doc.document_name}</p>
                                                <p className={`text-[10px] uppercase font-bold ${doc.status === 'Verified' ? 'text-emerald-500' : doc.status === 'Rejected' ? 'text-red-500' : 'text-white/30'}`}>{doc.status}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {doc.admission_documents?.[0]?.storage_path ? (
                                                <>
                                                    <button 
                                                        onClick={() => StorageService.getSignedUrl(doc.admission_documents[0].storage_path).then(url => window.open(url, '_blank'))} 
                                                        className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
                                                        title="View"
                                                    >
                                                        <EyeIcon className="w-4 h-4"/>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDownload(doc)} 
                                                        disabled={downloadingId === doc.id}
                                                        className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-primary transition-colors disabled:opacity-50"
                                                        title="Download"
                                                    >
                                                        {downloadingId === doc.id ? <Spinner size="sm" className="text-primary"/> : <DownloadIcon className="w-4 h-4"/>}
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-[10px] font-bold text-white/20 italic pr-2">Pending Upload</span>
                                            )}
                                            
                                            {doc.status !== 'Verified' && doc.admission_documents?.length > 0 && (
                                                <div className="w-px h-6 bg-white/10 mx-1"></div>
                                            )}

                                            {doc.status !== 'Verified' && doc.admission_documents?.length > 0 && (
                                                <>
                                                    <button onClick={() => handleVerifyDoc(doc.id)} className="p-2 hover:bg-emerald-500/20 rounded-lg text-emerald-500 hover:text-emerald-400" title="Verify"><CheckCircleIcon className="w-4 h-4"/></button>
                                                    <button onClick={() => handleRejectDoc(doc.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 hover:text-red-400" title="Reject"><XIcon className="w-4 h-4"/></button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-white/5 bg-white/[0.02] flex justify-end gap-4">
                     {admission.status !== 'Approved' && admission.status !== 'Enrolled' && finalizeState !== 'success' && (
                         <button 
                            onClick={handleFinalize} 
                            disabled={finalizeState === 'processing'}
                            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {finalizeState === 'processing' ? <Spinner size="sm" className="text-white"/> : <><ShieldCheckIcon className="w-5 h-5 group-hover:scale-110 transition-transform"/> Approve & Enroll</>}
                         </button>
                     )}
                     {(admission.status === 'Approved' || admission.status === 'Enrolled' || finalizeState === 'success') && (
                         <button onClick={onClose} className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-2xl transition-all">
                             Close
                         </button>
                     )}
                </div>
            </div>
        </div>
    );
};

export default AdmissionDetailsModal;
