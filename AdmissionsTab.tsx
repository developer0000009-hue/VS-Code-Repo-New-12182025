import React, { useState, useEffect, useCallback } from 'react';
import { supabase, formatError } from './services/supabase';
import { AdmissionApplication, AdmissionStatus } from './types';
import Spinner from './components/common/Spinner';
import { XIcon } from './components/icons/XIcon';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';
import { DocumentTextIcon } from './components/icons/DocumentTextIcon';
import { EyeIcon } from './components/icons/EyeIcon';
import { ClockIcon } from './components/icons/ClockIcon';
import { FilterIcon } from './components/icons/FilterIcon';
import { AlertTriangleIcon } from './components/icons/AlertTriangleIcon';
import { RefreshIcon } from './components/icons/RefreshIcon';
import AdmissionDetailsModal from './components/admin/AdmissionDetailsModal';
import PremiumAvatar from './components/common/PremiumAvatar';

const statusColors: Record<string, string> = {
  'Registered': 'bg-slate-500/10 text-slate-400 border-white/5',
  'Pending Review': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'Verified': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'Approved': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-black shadow-[0_0_10px_rgba(16,185,129,0.1)]',
  'Rejected': 'bg-rose-500/10 text-red-500 border-rose-500/20',
  'Cancelled': 'bg-zinc-500/10 text-zinc-500 border-white/5',
};

const formatStatus = (s: string) => s === 'Approved' ? 'Admitted' : s;

export const RequestDocumentsModal: React.FC<{
    admissionId: string;
    applicantName: string;
    onClose: () => void;
    onSuccess: () => void;
}> = ({ admissionId, applicantName, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const docOptions = [
        "Birth Certificate",
        "Previous School Transfer Certificate",
        "Passport / Identity Proof",
        "Immunization Records",
        "Recent Passport Photo"
    ];

    const toggleDoc = (doc: string) => {
        setSelectedDocs(prev => prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]);
    };

    const handleSelectAll = () => {
        if (selectedDocs.length === docOptions.length) setSelectedDocs([]);
        else setSelectedDocs(docOptions);
    };

    const handleSendRequest = async () => {
        if (selectedDocs.length === 0) {
            setStatus({ type: 'error', message: 'Selection Required: At least one document must be requested.' });
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            const { error } = await supabase.rpc('admin_request_documents', {
                p_admission_id: admissionId,
                p_documents: selectedDocs,
                p_message: message
            });

            if (error) throw error;

            setStatus({ type: 'success', message: 'Request Transmitted: Identity verification cycle initialized.' });
            
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1800);

        } catch (err: any) {
            setStatus({ type: 'error', message: `Uplink Failure: ${formatError(err)}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[400] p-4" onClick={onClose}>
            <div className="bg-[#0c0d12] w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-white/10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 ring-1 ring-white/5" onClick={e => e.stopPropagation()}>
                <div className="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                            <DocumentTextIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Request Artifacts</h3>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Verification Protocol</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all text-white/30 hover:text-white">
                        <XIcon className="w-5 h-5"/>
                    </button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-grow space-y-8">
                    {status && (
                        <div className={`p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2 border ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                            {status.type === 'success' ? <CheckCircleIcon className="w-6 h-6 shrink-0"/> : <AlertTriangleIcon className="w-6 h-6 shrink-0" />}
                            <p className="text-xs font-bold uppercase tracking-wide leading-relaxed">{status.message}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="flex justify-between items-end px-1">
                            <p className="text-xs font-serif italic text-white/40 leading-relaxed">
                                Request specific identities for <strong className="text-white not-italic">{applicantName}</strong>'s node.
                            </p>
                            <button onClick={handleSelectAll} className="text-[9px] font-black uppercase text-primary tracking-widest hover:underline">
                                {selectedDocs.length === docOptions.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {docOptions.map(doc => {
                                const isSelected = selectedDocs.includes(doc);
                                return (
                                    <label 
                                        key={doc} 
                                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${isSelected ? 'bg-primary/10 border-primary ring-2 ring-primary/5' : 'bg-white/[0.02] border-white/10 hover:border-white/10'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary border-primary' : 'bg-black/20 border-white/10 group-hover:border-primary/40'}`}>
                                            {isSelected && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <span className={`text-[11px] font-bold uppercase tracking-tight transition-colors ${isSelected ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`}>{doc}</span>
                                        <input type="checkbox" checked={isSelected} onChange={() => toggleDoc(doc)} className="hidden" />
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em] ml-1">Context / Message</label>
                        <textarea 
                            value={message} 
                            onChange={e => setMessage(e.target.value)} 
                            placeholder="Explain the protocol necessity..." 
                            className="w-full p-5 bg-white/[0.02] border border-white/10 rounded-[1.8rem] text-sm text-white focus:border-primary/50 focus:ring-8 focus:ring-primary/5 outline-none h-28 resize-none shadow-inner transition-all font-serif italic" 
                        />
                    </div>
                </div>

                <div className="px-8 py-6 border-t border-white/5 bg-white/[0.01] flex flex-col sm:flex-row justify-end items-center gap-4">
                    <button 
                        onClick={onClose} 
                        className="w-full sm:w-auto px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-white transition-all order-2 sm:order-1"
                    >
                        Abort
                    </button>
                    <button 
                        onClick={handleSendRequest} 
                        disabled={loading || selectedDocs.length === 0} 
                        className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 transform active:scale-95 shadow-2xl order-1 sm:order-2 ${loading || selectedDocs.length === 0 ? 'bg-white/5 text-white/10 cursor-not-allowed grayscale' : 'bg-primary text-white shadow-primary/20 hover:bg-primary/90'}`}
                    >
                        {loading ? <Spinner size="sm" className="text-white" /> : <><ClockIcon className="w-4 h-4"/> Dispatch Request</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdmissionsTab: React.FC<{ branchId?: string | null }> = ({ branchId }) => {
    const [applicants, setApplicants] = useState<AdmissionApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [selectedAdmission, setSelectedAdmission] = useState<AdmissionApplication | null>(null);
    
    const fetchApplicants = useCallback(async () => {
        if (branchId === undefined) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setFetchError(null);
        try {
            const { data, error } = await supabase.rpc('get_admissions', { p_branch_id: branchId });
            if (error) throw error;
            
            const admissionOnlyRoster = (data || []).filter((a: any) => 
                !['Enquiry Active', 'ENQUIRY_ACTIVE', 'ENQUIRY_VERIFIED', 'ENQUIRY_IN_PROGRESS', 'CONVERTED'].includes(a.status)
            );
            setApplicants(admissionOnlyRoster as AdmissionApplication[]);
        } catch (err) {
            console.error("Fetch failure:", err);
            setFetchError(formatError(err));
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => { fetchApplicants(); }, [fetchApplicants]);

    const filteredApps = (applicants || []).filter(app => 
        filterStatus === 'All' || app.status === filterStatus
    );

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-serif font-black text-white tracking-tight uppercase">Admission <span className="text-white/30 italic">Vault.</span></h2>
                    <p className="text-white/40 text-sm md:text-base mt-1 italic font-serif leading-relaxed">Institutional lifecycle management for enrollment nodes.</p>
                </div>
                <button 
                    onClick={fetchApplicants}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/30 hover:text-primary transition-all group"
                >
                    <RefreshIcon className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'}`} />
                </button>
            </div>

            {fetchError && (
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center justify-between shadow-xl animate-in shake">
                    <div className="flex items-center gap-4">
                        <AlertTriangleIcon className="w-8 h-8 text-red-500 shrink-0" />
                        <div>
                            <p className="text-xs font-black uppercase text-red-500 tracking-widest">Fetch Failure</p>
                            <p className="text-sm font-bold text-red-200/70 mt-1">{fetchError}</p>
                        </div>
                    </div>
                    <button onClick={fetchApplicants} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95">Retry Protocol</button>
                </div>
            )}

            <div className="bg-[#0a0a0c] border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col min-h-[500px] ring-1 ring-white/5">
                <div className="p-6 border-b border-white/5 bg-white/[0.01] flex wrap gap-4 justify-between items-center backdrop-blur-md">
                    <div className="flex items-center gap-2 bg-black/40 px-4 py-2.5 rounded-2xl border border-white/5 shadow-inner">
                        <FilterIcon className="w-4 h-4 text-white/20"/>
                        <select 
                            value={filterStatus} 
                            onChange={e => setFilterStatus(e.target.value)} 
                            className="bg-transparent text-[10px] font-black uppercase text-white/60 focus:outline-none cursor-pointer tracking-[0.2em]"
                        >
                            <option value="All">GLOBAL ROSTER</option>
                            <option value="Pending Review">Pending Review</option>
                            <option value="Verified">Verified</option>
                            <option value="Approved">Admitted</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Registered">External Registry</option>
                        </select>
                    </div>
                    <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">{filteredApps.length} Identities Active in Node</span>
                </div>

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-40 gap-6">
                        <Spinner size="lg" className="text-primary" />
                        <p className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] animate-pulse">Syncing Lifecycle Ledger</p>
                    </div>
                ) : filteredApps.length === 0 && !fetchError ? (
                    <div className="py-40 text-center flex flex-col items-center gap-6">
                         <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border-2 border-dashed border-white/10">
                            <DocumentTextIcon className="w-10 h-10 text-white/10" />
                         </div>
                         <div className="max-w-xs mx-auto">
                            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40 mb-2">Registry Idle</p>
                            <p className="text-xs text-white/20 leading-relaxed italic font-serif">
                                No records found for this branch. Verify an <strong className="text-white/60">Admission Code</strong> in Quick Verification to import new nodes.
                            </p>
                         </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto w-full custom-scrollbar">
                        <table className="w-full text-left text-sm min-w-[900px]">
                            <thead className="bg-white/[0.02] text-[10px] font-black uppercase text-white/20 tracking-[0.3em] border-b border-white/5">
                                <tr>
                                    <th className="p-8 pl-10">Applicant Profile</th>
                                    <th className="p-8">Registry Date</th>
                                    <th className="p-8">Lifecycle Status</th>
                                    <th className="p-8 text-right pr-10">Audit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredApps.map(app => (
                                    <tr 
                                        key={app.id} 
                                        className="hover:bg-white/[0.01] transition-all group cursor-pointer"
                                        onClick={() => setSelectedAdmission(app)}
                                    >
                                        <td className="p-8 pl-10">
                                            <div className="flex items-center gap-6">
                                                <PremiumAvatar src={app.profile_photo_url} name={app.applicant_name} size="xs" className="group-hover:scale-105 transition-transform duration-500" />
                                                <div className="min-w-0">
                                                    <p className="font-serif font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors text-[16px]">{app.applicant_name}</p>
                                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">Grade {app.grade} Node</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8 font-mono text-[11px] text-white/30">
                                            {new Date(app.registered_at || app.submitted_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                                        </td>
                                        <td className="p-8">
                                            <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border tracking-widest shadow-sm transition-all ${statusColors[app.status] || statusColors['Registered']}`}>
                                                {formatStatus(app.status)}
                                            </span>
                                        </td>
                                        <td className="p-8 text-right pr-10">
                                            <button className="p-3.5 rounded-2xl bg-white/[0.03] text-white/20 group-hover:text-primary group-hover:bg-primary/10 group-hover:border-primary/20 border border-transparent transition-all shadow-sm active:scale-90">
                                                <EyeIcon className="w-5 h-5"/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedAdmission && (
                <AdmissionDetailsModal 
                    admission={selectedAdmission}
                    onClose={() => setSelectedAdmission(null)}
                    onUpdate={() => {
                        fetchApplicants();
                    }}
                />
            )}
        </div>
    );
};

export default AdmissionsTab;