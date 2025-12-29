import React, { useState, useEffect, useCallback } from 'react';
import { supabase, formatError } from '../services/supabase';
import { AdmissionApplication, AdmissionStatus } from '../types';
import Spinner from './common/Spinner';
import { XIcon } from './icons/XIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { SchoolIcon } from './icons/SchoolIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { EyeIcon } from './icons/EyeIcon';
import { ClockIcon } from './icons/ClockIcon';
import { FilterIcon } from './icons/FilterIcon';
import { UsersIcon } from './icons/UsersIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import AdmissionDetailsModal from './admin/AdmissionDetailsModal';

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

    const handleSendRequest = async () => {
        if (selectedDocs.length === 0) return alert("Select at least one document.");
        setLoading(true);
        try {
            const { error } = await supabase.rpc('admin_request_documents', {
                p_admission_id: admissionId,
                p_documents: selectedDocs,
                p_message: message
            });
            if (error) throw error;
            onSuccess();
        } catch (err: any) {
            alert(formatError(err) || "Failed to send request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[300] p-4" onClick={onClose}>
            <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-6 overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Request Verification</h3>
                    <button onClick={onClose}><XIcon className="w-5 h-5"/></button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Request specific documents from <strong>{applicantName}</strong>'s guardian.</p>
                
                <div className="space-y-2 mb-6">
                    {docOptions.map(doc => (
                        <label key={doc} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                            <input type="checkbox" checked={selectedDocs.includes(doc)} onChange={() => toggleDoc(doc)} className="rounded border-input text-primary focus:ring-primary w-4 h-4" />
                            <span className="text-sm font-medium">{doc}</span>
                        </label>
                    ))}
                </div>

                <div className="space-y-2 mb-6">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Additional Message</label>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Explain why these are needed..." className="w-full p-3 bg-muted/30 border border-input rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none h-24 resize-none shadow-inner" />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <button onClick={onClose} className="px-4 py-2 font-bold text-muted-foreground">Cancel</button>
                    <button onClick={handleSendRequest} disabled={loading || selectedDocs.length === 0} className="px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary/90 flex items-center gap-2">
                        {loading ? <Spinner size="sm" /> : "Send Request"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdmissionsTab: React.FC<{ branchId?: number | null }> = ({ branchId }) => {
    const [applicants, setApplicants] = useState<AdmissionApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [selectedAdmission, setSelectedAdmission] = useState<AdmissionApplication | null>(null);
    
    const fetchApplicants = useCallback(async () => {
        if (!branchId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setFetchError(null);
        try {
            const { data, error } = await supabase.rpc('get_admissions', { p_branch_id: branchId });
            if (error) throw error;
            setApplicants((data || []) as AdmissionApplication[]);
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
                    <h2 className="text-2xl md:text-3xl font-serif font-black text-foreground tracking-tight uppercase">Admission <span className="text-white/30 italic">Vault.</span></h2>
                    <p className="text-muted-foreground text-sm md:text-base mt-1">Institutional lifecycle management for enrollment nodes.</p>
                </div>
                <button 
                    onClick={fetchApplicants}
                    className="p-3 rounded-2xl bg-card border border-border text-muted-foreground hover:text-primary transition-all group"
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

            <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[500px] ring-1 ring-black/5">
                <div className="p-5 border-b border-border bg-muted/5 flex wrap gap-4 justify-between items-center backdrop-blur-md">
                    <div className="flex items-center gap-2 bg-background px-4 py-2.5 rounded-2xl border border-border shadow-inner">
                        <FilterIcon className="w-4 h-4 text-muted-foreground"/>
                        <select 
                            value={filterStatus} 
                            onChange={e => setFilterStatus(e.target.value)} 
                            className="bg-transparent text-[10px] font-black uppercase text-foreground focus:outline-none cursor-pointer tracking-widest"
                        >
                            <option value="All">GLOBAL ROSTER</option>
                            <option value="Pending Review">Pending Review</option>
                            <option value="Verified">Verified</option>
                            <option value="Approved">Admitted</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Registered">External Registry</option>
                        </select>
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">{filteredApps.length} Identities Active in Node</span>
                </div>

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-40 gap-6">
                        <Spinner size="lg" className="text-primary" />
                        <p className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] animate-pulse">Syncing Lifecycle Ledger</p>
                    </div>
                ) : filteredApps.length === 0 && !fetchError ? (
                    <div className="py-40 text-center flex flex-col items-center gap-6">
                         <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center border-2 border-dashed border-border/50">
                            <DocumentTextIcon className="w-10 h-10 text-muted-foreground/30" />
                         </div>
                         <div className="max-w-xs mx-auto">
                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground mb-2">Registry Idle</p>
                            <p className="text-xs text-muted-foreground leading-relaxed italic">
                                No records found for this branch. Verify an <strong>Admission Code</strong> in Quick Verification to import new nodes.
                            </p>
                         </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto w-full custom-scrollbar">
                        <table className="w-full text-left text-sm min-w-[900px]">
                            <thead className="bg-muted/30 text-[10px] font-black uppercase text-muted-foreground tracking-[0.25em] border-b border-border">
                                <tr>
                                    <th className="p-6 pl-10">Applicant Profile</th>
                                    <th className="p-6">Registry Date</th>
                                    <th className="p-6">Lifecycle Status</th>
                                    <th className="p-6 text-right pr-10">Audit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {filteredApps.map(app => (
                                    <tr 
                                        key={app.id} 
                                        className="hover:bg-primary/[0.02] transition-all group cursor-pointer"
                                        onClick={() => setSelectedAdmission(app)}
                                    >
                                        <td className="p-6 pl-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-500/10 text-indigo-400 font-black flex items-center justify-center text-lg border border-indigo-500/20 shadow-inner ring-4 ring-indigo-500/5">
                                                    {(app.applicant_name || 'A').charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors text-[15px]">{app.applicant_name}</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Grade {app.grade} Node</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 font-mono text-[11px] text-muted-foreground">
                                            {new Date(app.registered_at || app.submitted_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border tracking-widest shadow-sm transition-all ${statusColors[app.status] || statusColors['Registered']}`}>
                                                {formatStatus(app.status)}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right pr-10">
                                            <button className="p-3 rounded-2xl bg-white/[0.03] text-white/30 group-hover:text-primary group-hover:bg-primary/10 group-hover:border-primary/20 border border-transparent transition-all shadow-sm active:scale-90">
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