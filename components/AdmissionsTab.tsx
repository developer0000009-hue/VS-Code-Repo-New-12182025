
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, formatError } from '../services/supabase';
import { AdmissionApplication } from '../types';
import Spinner from './common/Spinner';
import { XIcon } from './icons/XIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { EyeIcon } from './icons/EyeIcon';
import { ClockIcon } from './icons/ClockIcon';
import { FilterIcon } from './icons/FilterIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import AdmissionDetailsModal from './admin/AdmissionDetailsModal';
import PremiumAvatar from './common/PremiumAvatar';
import { motion, AnimatePresence } from 'framer-motion';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS_CONFIG: Record<string, { label: string; style: string; dot: string }> = {
  'Registered': { label: 'Registered', style: 'text-slate-400 bg-slate-400/5 border-slate-400/10', dot: 'bg-slate-500' },
  'Pending Review': { label: 'Pending Review', style: 'text-amber-400 bg-amber-400/5 border-amber-400/10', dot: 'bg-amber-500' },
  'Verified': { label: 'Verified', style: 'text-indigo-400 bg-indigo-400/5 border-indigo-400/10', dot: 'bg-indigo-500' },
  'Approved': { label: 'Cleared', style: 'text-emerald-400 bg-emerald-400/5 border-emerald-400/10', dot: 'bg-emerald-500' },
  'Enrolled': { label: 'Enrolled', style: 'text-teal-400 bg-teal-400/5 border-teal-400/10', dot: 'bg-teal-500' },
  'Rejected': { label: 'Rejected', style: 'text-rose-400 bg-rose-400/5 border-rose-400/10', dot: 'bg-rose-500' },
  'Cancelled': { label: 'Cancelled', style: 'text-zinc-500 bg-zinc-500/5 border-zinc-500/10', dot: 'bg-zinc-600' },
};

// --- Custom Components ---

const StatusPill = ({ status }: { status: string }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['Registered'];
    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${config.style} backdrop-blur-sm transition-all duration-300`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shadow-[0_0_8px_rgba(0,0,0,0.3)]`} />
            {config.label}
        </span>
    );
};

const WorkflowFilterDropdown: React.FC<{ 
    value: string; 
    onChange: (val: string) => void;
    options: string[];
}> = ({ value, onChange, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (opt: string) => {
        onChange(opt);
        setIsOpen(false);
    };

    return (
        <div className="relative z-50" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-300 group
                    ${isOpen 
                        ? 'bg-[#1e293b] border-white/20 text-white shadow-xl' 
                        : 'bg-white/[0.03] border-white/5 text-white/60 hover:bg-white/[0.06] hover:text-white'
                    }
                `}
            >
                <FilterIcon className={`w-4 h-4 transition-colors ${isOpen ? 'text-violet-400' : 'text-white/40 group-hover:text-white'}`} />
                <span className="text-xs font-bold uppercase tracking-widest min-w-[100px] text-left">
                    {value === 'All' ? 'Active Workflow' : value}
                </span>
                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-violet-400' : 'text-white/20'}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-0 mt-3 w-64 p-2 bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] overflow-hidden z-[100] ring-1 ring-white/5"
                    >
                        <div className="flex flex-col gap-1 max-h-[320px] overflow-y-auto custom-scrollbar">
                            {options.map((opt) => {
                                const isActive = value === opt;
                                const label = opt === 'All' ? 'Active Workflow' : opt;
                                return (
                                    <button
                                        key={opt}
                                        onClick={() => handleSelect(opt)}
                                        className={`
                                            w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200
                                            flex items-center justify-between group
                                            ${isActive 
                                                ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20' 
                                                : 'text-white/50 hover:bg-white/[0.04] hover:text-white border border-transparent'
                                            }
                                        `}
                                    >
                                        {label}
                                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.5)]"></div>}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[400] p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-[#0c0d12] w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-white/10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 ring-1 ring-white/5" onClick={e => e.stopPropagation()}>
                <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary border border-primary/20 shadow-inner">
                            <DocumentTextIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Request Artifacts</h3>
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">Verification Protocol</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-white/5 rounded-full transition-all text-white/30 hover:text-white group">
                        <XIcon className="w-5 h-5 transition-transform group-hover:rotate-90"/>
                    </button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-grow space-y-8 bg-[#0c0d12]">
                    {status && (
                        <div className={`p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2 border ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                            {status.type === 'success' ? <CheckCircleIcon className="w-6 h-6 shrink-0"/> : <AlertTriangleIcon className="w-6 h-6 shrink-0" />}
                            <p className="text-xs font-bold uppercase tracking-wide leading-relaxed">{status.message}</p>
                        </div>
                    )}

                    <div className="space-y-5">
                        <div className="flex justify-between items-end px-1">
                            <p className="text-xs font-medium text-white/40 leading-relaxed font-serif italic">
                                Request specific identities for <strong className="text-white/80 not-italic font-sans">{applicantName}</strong>'s node.
                            </p>
                            <button onClick={handleSelectAll} className="text-[10px] font-black uppercase text-primary tracking-widest hover:text-primary/80 transition-colors">
                                {selectedDocs.length === docOptions.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                            {docOptions.map(doc => {
                                const isSelected = selectedDocs.includes(doc);
                                return (
                                    <label 
                                        key={doc} 
                                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${isSelected ? 'bg-primary/5 border-primary/40' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary border-primary' : 'bg-transparent border-white/20 group-hover:border-primary/50'}`}>
                                            {isSelected && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${isSelected ? 'text-white' : 'text-white/40 group-hover:text-white/70'}`}>{doc}</span>
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
                            className="w-full p-5 bg-white/[0.02] border border-white/10 rounded-[1.5rem] text-sm text-white/80 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 outline-none h-32 resize-none shadow-inner transition-all placeholder:text-white/10" 
                        />
                    </div>
                </div>

                <div className="px-8 py-6 border-t border-white/5 bg-white/[0.01] flex flex-col sm:flex-row justify-end items-center gap-4">
                    <button 
                        onClick={onClose} 
                        className="w-full sm:w-auto px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-white transition-all order-2 sm:order-1 hover:bg-white/5 rounded-xl"
                    >
                        Abort
                    </button>
                    <button 
                        onClick={handleSendRequest} 
                        disabled={loading || selectedDocs.length === 0} 
                        className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-3 transform active:scale-95 shadow-xl order-1 sm:order-2 ${loading || selectedDocs.length === 0 ? 'bg-white/5 text-white/10 cursor-not-allowed grayscale border border-white/5' : 'bg-primary text-white shadow-primary/20 hover:bg-primary/90 border border-primary/20'}`}
                    >
                        {loading ? <Spinner size="sm" className="text-white" /> : <><ClockIcon className="w-4 h-4"/> Dispatch Request</>}
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
            const { data, error } = await supabase.rpc('get_admissions_v2', { p_branch_id: branchId });
            if (error) throw error;
            
            const validData = (data || []).filter((a: any) => a.id && UUID_REGEX.test(String(a.id)));

            const admissionOnlyRoster = validData.filter((a: any) => 
                !['ENQUIRY_ACTIVE', 'ENQUIRY_VERIFIED', 'ENQUIRY_IN_REVIEW', 'ENQUIRY_CONTACTED', 'ENQUIRY_CONVERTED'].includes(a.status)
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

    const filteredApps = (applicants || []).filter(app => {
        if (filterStatus === 'All') {
            return app.status !== 'Enrolled'; 
        }
        return app.status === filterStatus;
    });

    return (
        <div className="space-y-10 md:space-y-14 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-32 max-w-[1800px] mx-auto px-6 md:px-10 pt-6">
            
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
                <div className="space-y-6 max-w-4xl">
                    <div className="flex items-center gap-4">
                        <div className="h-0.5 w-10 bg-violet-500/50 rounded-full"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-violet-400">Institutional Governance</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-serif font-black text-white tracking-tighter uppercase leading-[0.9]">
                        Admission <span className="text-white/20 italic font-medium">Vault.</span>
                    </h2>
                    <p className="text-[15px] md:text-lg text-white/40 font-medium leading-relaxed font-serif italic border-l-2 border-white/5 pl-8 max-w-2xl">
                        Institutional lifecycle management for enrollment identities and admission workflows. All actions are logged and institutionally auditable.
                    </p>
                </div>
                <button 
                    onClick={fetchApplicants}
                    disabled={loading}
                    className="p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5 text-white/30 hover:text-white hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 group active:scale-95 shadow-2xl"
                >
                    <RefreshIcon className={`w-6 h-6 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
                </button>
            </div>

            {fetchError && (
                <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-[2.5rem] flex items-center justify-between shadow-xl animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-red-500/10 rounded-2xl text-red-500"><AlertTriangleIcon className="w-6 h-6" /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-red-500 tracking-[0.3em]">Protocol Error</p>
                            <p className="text-sm font-medium text-red-200/60 mt-1 max-w-xl">{fetchError}</p>
                        </div>
                    </div>
                    <button onClick={fetchApplicants} className="px-8 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all border border-red-500/20">Retry Sync</button>
                </div>
            )}

            <div className="bg-[#0a0a0c] border border-white/5 rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col min-h-[600px] ring-1 ring-white/5 relative group">
                {/* Subtle Gradient Glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/[0.015] via-transparent to-emerald-500/[0.015] pointer-events-none group-hover:opacity-100 transition-opacity duration-1000"></div>

                {/* Filter Bar */}
                <div className="p-8 md:p-10 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row gap-8 justify-between items-center backdrop-blur-3xl sticky top-0 z-20">
                    <WorkflowFilterDropdown 
                        value={filterStatus} 
                        onChange={setFilterStatus} 
                        options={['All', 'Pending Review', 'Verified', 'Approved', 'Enrolled', 'Rejected']} 
                    />
                    <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.02] border border-white/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse"></span>
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">{filteredApps.length} Records</span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-grow relative bg-[#0a0a0c]">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col justify-center items-center gap-8">
                            <Spinner size="lg" className="text-violet-500/50" />
                            <p className="text-[10px] font-black uppercase text-white/10 tracking-[0.5em] animate-pulse">Synchronizing Ledger</p>
                        </div>
                    ) : filteredApps.length === 0 && !fetchError ? (
                        <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-8 animate-in fade-in duration-700">
                             <div className="w-32 h-32 bg-white/[0.01] rounded-[3rem] flex items-center justify-center mb-10 border border-white/5 shadow-inner">
                                <DocumentTextIcon className="w-12 h-12 text-white/5" />
                             </div>
                             <h3 className="text-2xl font-serif font-black text-white/80 tracking-tight uppercase mb-4">Registry Idle</h3>
                             <p className="text-white/30 max-w-sm text-sm font-medium leading-relaxed">
                                No enrollment records match the current workflow. Adjust filters or initiate a new admission sequence.
                             </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto w-full custom-scrollbar h-full">
                            <table className="w-full text-left text-sm min-w-[1000px]">
                                <thead className="bg-[#0f1115] border-b border-white/5 text-[10px] font-black uppercase text-white/20 tracking-[0.3em] sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="p-10 pl-14">Applicant Identity</th>
                                        <th className="p-10">Registry Timestamp</th>
                                        <th className="p-10">Governance Status</th>
                                        <th className="p-10 text-right pr-14">Audit Controls</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredApps.map((app, idx) => (
                                        <tr 
                                            key={app.id} 
                                            className="hover:bg-white/[0.015] transition-all duration-300 group cursor-pointer relative overflow-hidden"
                                            onClick={() => setSelectedAdmission(app)}
                                            style={{ animationDelay: `${idx * 50}ms` }}
                                        >
                                            <td className="p-10 pl-14 relative z-10">
                                                <div className="flex items-center gap-8">
                                                    <PremiumAvatar src={app.profile_photo_url} name={app.applicant_name} size="sm" className="w-16 h-16 rounded-[1.2rem] shadow-2xl border border-white/5 group-hover:scale-105 transition-transform duration-500" />
                                                    <div className="min-w-0">
                                                        <p className="font-serif font-black text-white text-xl uppercase tracking-tight group-hover:text-violet-300 transition-colors duration-300 truncate">{app.applicant_name}</p>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] bg-white/5 px-2 py-0.5 rounded border border-white/5">Grade {app.grade}</span>
                                                            {app.application_number && <span className="text-[9px] font-mono text-white/10 uppercase tracking-widest">{app.application_number}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-10 relative z-10">
                                                <div className="flex items-center gap-3 text-[11px] font-mono font-bold text-white/30 uppercase tracking-widest">
                                                    <ClockIcon className="w-3.5 h-3.5 opacity-40" />
                                                    {new Date(app.registered_at || app.submitted_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                                                </div>
                                            </td>
                                            <td className="p-10 relative z-10">
                                                <StatusPill status={app.status} />
                                            </td>
                                            <td className="p-10 text-right pr-14 relative z-10">
                                                <button className="p-4 rounded-[1.2rem] bg-white/[0.02] text-white/20 hover:text-white hover:bg-white/[0.08] border border-white/5 hover:border-white/10 transition-all shadow-lg active:scale-95 group/btn">
                                                    <EyeIcon className="w-5 h-5 group-hover/btn:scale-110 transition-transform"/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
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
