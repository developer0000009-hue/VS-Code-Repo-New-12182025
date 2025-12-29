
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { AdmissionApplication } from '../../types';
import Spinner from '../common/Spinner';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { EyeIcon } from '../icons/EyeIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { RefreshIcon } from '../icons/RefreshIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { PlusIcon } from '../icons/PlusIcon';
import PremiumAvatar from '../common/PremiumAvatar';

// --- Types ---

interface DocumentFile {
    id: number;
    file_name: string;
    storage_path: string;
    uploaded_at: string;
    file_size?: number;
    mime_type?: string;
}

interface RequirementWithDocs {
    id: number;
    admission_id: string;
    document_name: string;
    status: 'Pending' | 'Submitted' | 'Accepted' | 'Rejected' | 'Verified';
    is_mandatory: boolean;
    notes_for_parent: string;
    rejection_reason: string;
    applicant_name: string;
    profile_photo_url: string | null;
    admission_documents: DocumentFile[];
}

interface GroupedRequirementData {
    admissionId: string;
    applicantName: string;
    profilePhotoUrl: string | null;
    requirements: RequirementWithDocs[];
}

interface DocumentsTabProps {
    focusOnAdmissionId?: string | null;
    onClearFocus?: () => void;
}

// --- Sub-Components ---

const StatusIndicator: React.FC<{ status: string }> = ({ status }) => {
    const config = {
        'Accepted': { 
            color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', 
            icon: <CheckCircleIcon className="w-3 h-3"/>, 
            label: 'Verified' 
        },
        'Verified': { 
            color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', 
            icon: <CheckCircleIcon className="w-3 h-3"/>, 
            label: 'Verified' 
        },
        'Submitted': { 
            color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20', 
            icon: <ClockIcon className="w-3 h-3 animate-pulse"/>, 
            label: 'Reviewing' 
        },
        'Pending': { 
            color: 'text-white/30 bg-white/5 border-white/10', 
            icon: <div className="w-1.5 h-1.5 rounded-full bg-white/20" />, 
            label: 'Required' 
        },
        'Rejected': { 
            color: 'text-rose-400 bg-rose-400/10 border-rose-400/20', 
            icon: <XCircleIcon className="w-3 h-3"/>, 
            label: 'Correction' 
        },
    };
    const style = config[status as keyof typeof config] || config['Pending'];

    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border backdrop-blur-sm transition-all duration-300 ${style.color}`}>
            {style.icon}
            {style.label}
        </span>
    );
};

const DocumentCard: React.FC<{ 
    req: RequirementWithDocs; 
    onUpload: (file: File, reqId: number, admId: string) => Promise<void>;
}> = ({ req, onUpload }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const latestDoc = req.admission_documents && req.admission_documents.length > 0 
        ? [...req.admission_documents].sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())[0] 
        : null;

    const version = req.admission_documents?.length || 0;
    const isLocked = req.status === 'Accepted' || req.status === 'Verified';
    const isRejected = req.status === 'Rejected';
    const hasFile = !!latestDoc;

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setIsUploading(true);
        try {
            await onUpload(file, req.id, req.admission_id);
        } catch (err: any) {
            alert("Handshake Failure: " + err.message);
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = ''; 
        }
    };

    const handleView = async (download = false) => {
        if (!latestDoc) return;
        setActionLoading(true);
        try {
            const { data, error } = await supabase.storage
                .from('guardian-documents')
                .createSignedUrl(latestDoc.storage_path, 3600);
            
            if (error) throw error;
            if (data) {
                if (download) {
                    const link = document.createElement('a');
                    link.href = data.signedUrl;
                    link.download = latestDoc.file_name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    window.open(data.signedUrl, '_blank');
                }
            }
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className={`relative rounded-2xl border transition-all duration-300 group overflow-hidden bg-[#12141a] flex flex-col h-full min-h-[300px] ${isLocked ? 'border-emerald-500/20 bg-emerald-500/[0.02]' : isRejected ? 'border-rose-500/20 bg-rose-500/[0.02]' : 'border-white/5 hover:border-primary/20 shadow-md hover:shadow-xl'}`}>
            <div className={`absolute top-0 left-0 w-full h-1 transition-colors duration-300 ${isLocked ? 'bg-emerald-500' : isRejected ? 'bg-rose-500' : hasFile ? 'bg-indigo-500' : 'bg-white/5'}`}></div>

            <div className="p-5 flex flex-col h-full relative z-10">
                <div className="flex justify-between items-start mb-5">
                    <div className={`p-2.5 rounded-lg shadow-inner transition-all duration-300 ${isLocked ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/20 group-hover:text-primary group-hover:bg-primary/10 border border-white/5'}`}>
                        <DocumentTextIcon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                        <StatusIndicator status={req.status} />
                        {req.is_mandatory && !hasFile && (
                            <span className="text-[8px] font-black uppercase text-rose-500 tracking-wider">Mandatory</span>
                        )}
                    </div>
                </div>

                <div className="flex-grow">
                    <h4 className="font-sans font-black text-white text-base mb-1.5 tracking-tight group-hover:text-primary transition-colors uppercase leading-tight">{req.document_name}</h4>
                    
                    {isRejected && req.rejection_reason && (
                        <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-3 mb-3 animate-in slide-in-from-top-1">
                             <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <AlertTriangleIcon className="w-3 h-3"/> Correction Required
                             </p>
                             <p className="text-[11px] text-rose-200/50 font-medium italic">"{req.rejection_reason}"</p>
                        </div>
                    )}

                    {hasFile && !isUploading && (
                        <div className="mt-3 p-4 rounded-xl bg-black/40 border border-white/5 animate-in fade-in zoom-in-95 group-hover:border-white/10 transition-colors">
                            <p className="text-[10px] font-medium text-white/80 truncate font-mono">{latestDoc.file_name}</p>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                                <p className="text-[9px] text-white/30 font-mono uppercase">{new Date(latestDoc.uploaded_at).toLocaleDateString()}</p>
                                <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">v1.{version}</p>
                            </div>
                        </div>
                    )}
                    
                    {!hasFile && !isUploading && (
                         <p className="text-[12px] text-white/20 font-serif italic leading-relaxed mt-2">
                            Awaiting institutional asset synchronization.
                         </p>
                    )}

                    {isUploading && (
                        <div className="mt-3 py-6 flex flex-col items-center justify-center bg-primary/5 rounded-xl border border-primary/10 animate-pulse">
                            <Spinner size="sm" className="text-primary mb-2"/>
                            <p className="text-[9px] font-black uppercase text-primary tracking-widest">Syncing Asset</p>
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex gap-3">
                    {hasFile ? (
                        <>
                            <button 
                                onClick={() => handleView(false)} 
                                disabled={actionLoading || isUploading} 
                                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-[10px] font-black bg-[#1a1d24] border border-white/5 text-white/50 hover:text-white hover:bg-[#252832] transition-all uppercase tracking-widest active:scale-[0.98]"
                            >
                                {actionLoading ? <Spinner size="sm"/> : <><EyeIcon className="w-3.5 h-3.5" /> View</>}
                            </button>
                            <button 
                                onClick={() => handleView(true)} 
                                disabled={actionLoading || isUploading} 
                                className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/5 border border-white/5 text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all active:scale-[0.95]"
                                title="Download"
                            >
                                <DownloadIcon className="w-4 h-4" />
                            </button>
                            {!isLocked && (
                                <button 
                                    onClick={() => fileInputRef.current?.click()} 
                                    disabled={isUploading}
                                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-white/30 hover:text-primary hover:bg-primary/10 transition-all active:scale-[0.95]"
                                    title="Replace"
                                >
                                    <RefreshIcon className={`w-4 h-4 ${isUploading ? 'animate-spin' : ''}`} />
                                </button>
                            )}
                        </>
                    ) : (
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            disabled={isUploading}
                            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-[10px] font-black text-white bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98] uppercase tracking-[0.1em]"
                        >
                            {isUploading ? <Spinner size="sm" className="text-white"/> : <><UploadIcon className="w-4 h-4" /> Upload</>}
                        </button>
                    )}
                </div>
            </div>
            
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png" />
        </div>
    );
};

// --- Main Tab ---

const DocumentsTab: React.FC<DocumentsTabProps> = ({ focusOnAdmissionId, onClearFocus }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [groupedRequirements, setGroupedRequirements] = useState<Record<string, GroupedRequirementData>>({});
    const [expandedChildIds, setExpandedChildIds] = useState<Set<string>>(new Set());
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: admissions, error: admErr } = await supabase.rpc('get_my_children_profiles');
            if (admErr) throw admErr;
            const ads = (admissions || []) as AdmissionApplication[];
            if (ads.length > 0) {
                await Promise.all(ads.map(child => supabase.rpc('parent_initialize_vault_slots', { p_admission_id: child.id })));
            }
            const { data: reqs, error: rpcError } = await supabase.rpc('parent_get_document_requirements');
            if (rpcError) throw rpcError;
            const grouped: Record<string, GroupedRequirementData> = {};
            (reqs as RequirementWithDocs[]).forEach(req => {
                if (!grouped[req.admission_id]) {
                    grouped[req.admission_id] = { admissionId: req.admission_id, applicantName: req.applicant_name, profilePhotoUrl: req.profile_photo_url, requirements: [] };
                }
                grouped[req.admission_id].requirements.push(req);
            });
            setGroupedRequirements(grouped);
            if (focusOnAdmissionId) {
                setExpandedChildIds(new Set([focusOnAdmissionId]));
            } else if (Object.keys(grouped).length > 0 && expandedChildIds.size === 0) {
                 setExpandedChildIds(new Set([Object.keys(grouped)[0]]));
            }
        } catch (err: any) {
            setError(err.message || "Institutional synchronization protocol failure.");
        } finally {
            setLoading(false);
        }
    }, [focusOnAdmissionId]);

    useEffect(() => { fetchData(); }, [fetchData, refreshTrigger]);
    useEffect(() => { return () => { if (onClearFocus) onClearFocus(); }; }, [onClearFocus]);

    const handleUpload = async (file: File, reqId: number, admId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Terminal Unauthorized.");
        const fileExt = file.name.split('.').pop();
        const filePath = `parent/${user.id}/adm-${admId}/req-${reqId}_${Date.now()}.${fileExt}`;
        try {
            const { error: uploadError } = await supabase.storage.from('guardian-documents').upload(filePath, file, { upsert: true, contentType: file.type });
            if (uploadError) throw uploadError;
            const { error: dbError } = await supabase.rpc('parent_complete_document_upload', { p_requirement_id: reqId, p_admission_id: admId, p_file_name: file.name, p_storage_path: filePath, p_file_size: file.size, p_mime_type: file.type });
            if (dbError) throw dbError;
            setRefreshTrigger(prev => prev + 1);
        } catch (e: any) { throw e; }
    };

    if (loading && Object.keys(groupedRequirements).length === 0 && !error) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
                <Spinner size="lg" className="text-primary"/>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 animate-pulse">Establishing Secure Hub</p>
            </div>
        );
    }
    
    if (error) return (
        <div className="max-w-[800px] mx-auto py-16 px-4">
            <div className="p-12 text-center bg-[#0d0a0a] border border-rose-500/20 rounded-3xl animate-in shake shadow-xl ring-1 ring-white/5">
                <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner ring-1 ring-rose-500/30">
                    <AlertTriangleIcon className="w-10 h-10"/>
                </div>
                <h3 className="text-3xl font-serif font-black text-white mb-4 uppercase tracking-tighter">Sync Interrupted</h3>
                <p className="text-white/40 text-lg leading-relaxed mb-10 font-serif italic">{error}</p>
                <button onClick={() => fetchData()} className="px-10 py-4 bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] uppercase tracking-[0.4em] rounded-xl shadow-2xl transition-all active:scale-95 transform hover:-translate-y-1">Retry Handshake</button>
            </div>
        </div>
    );

    const admissionIds = Object.keys(groupedRequirements);

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-32">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="max-w-3xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary shadow-inner border border-primary/20">
                            <ShieldCheckIcon className="w-5 h-5"/>
                        </div>
                        <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em]">Document Integrity Node</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-serif font-black text-white tracking-tighter leading-none mb-4 uppercase">Verification <span className="text-white/30 italic">Vault.</span></h2>
                    <p className="text-white/40 text-sm md:text-base font-medium leading-relaxed font-serif italic border-l-2 border-white/10 pl-6 ml-2">
                        Institutional identity repository. Linking mandatory enrollment assets required to activate student nodes.
                    </p>
                </div>
            </div>

            <div className="space-y-8">
                {admissionIds.map(admId => {
                    const group = groupedRequirements[admId];
                    const isExpanded = expandedChildIds.has(admId);
                    const verifiedCount = group.requirements.filter(r => r.status === 'Accepted' || r.status === 'Verified').length;
                    const totalCount = group.requirements.length;
                    const completion = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;
                    
                    return (
                        <div key={admId} className={`group bg-[#0d0f14] border transition-all duration-500 rounded-[2rem] overflow-hidden ${isExpanded ? 'border-primary/40 shadow-2xl scale-[1.01]' : 'border-white/5 hover:border-primary/20 shadow-md'}`}>
                            <div 
                                className={`p-6 md:p-8 flex flex-col xl:flex-row justify-between items-center gap-8 cursor-pointer transition-all ${isExpanded ? 'bg-white/[0.03]' : 'hover:bg-white/[0.01]'}`}
                                onClick={() => setExpandedChildIds(prev => { const n = new Set(prev); if (n.has(admId)) n.delete(admId); else n.add(admId); return n; })}
                            >
                                <div className="flex items-center gap-6 w-full xl:w-auto">
                                    <div className="relative">
                                        <PremiumAvatar src={group.profilePhotoUrl} name={group.applicantName} size="sm" statusColor={completion === 100 ? 'bg-emerald-500' : 'bg-primary'} className="group-hover:scale-105 transition-transform duration-500" />
                                        {completion === 100 && (
                                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-md shadow-lg border-2 border-[#0d0f14]">
                                                <CheckCircleIcon className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-serif font-black text-2xl md:text-3xl text-white tracking-tighter truncate leading-none mb-2 group-hover:text-primary transition-colors duration-500 uppercase">{group.applicantName}</h3>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="text-[9px] font-black uppercase text-white/30 tracking-widest bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">Operational</span>
                                            <span className="text-[10px] font-mono font-bold text-white/20 tracking-tighter uppercase">ID: HUB_ADM_{admId.substring(0, 4).toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-8 w-full xl:w-auto">
                                    <div className="flex-grow sm:w-56">
                                        <div className="flex justify-between items-end mb-2.5 px-1">
                                            <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">Integrity Index</span>
                                            <span className={`text-[10px] font-black tracking-widest ${completion === 100 ? 'text-emerald-500' : 'text-primary'}`}>{completion}% Verified</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden shadow-inner ring-1 ring-white/5 p-[1px]">
                                            <div className={`h-full rounded-full transition-all duration-1000 ease-out ${completion === 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]'}`} style={{ width: `${completion}%` }}></div>
                                        </div>
                                    </div>
                                    <div className={`p-3 rounded-xl transition-all duration-500 ${isExpanded ? 'rotate-180 bg-primary/10 text-primary border border-primary/20' : 'text-white/20 bg-white/5 border border-white/5 shadow-inner'}`}>
                                        <ChevronDownIcon className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                            
                            {isExpanded && (
                                <div className="p-6 md:p-10 lg:p-14 border-t border-white/5 bg-[#08090a] animate-in slide-in-from-top-4 duration-700">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 max-w-[1600px] mx-auto">
                                        {group.requirements.map(req => (
                                            <DocumentCard key={req.id} req={req} onUpload={handleUpload} />
                                        ))}
                                        <button className="relative rounded-2xl border-2 border-dashed border-white/5 hover:border-primary/30 transition-all duration-300 group overflow-hidden bg-white/[0.01] flex flex-col items-center justify-center p-6 min-h-[300px] cursor-pointer hover:bg-white/[0.02]">
                                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500 shadow-inner">
                                                <PlusIcon className="w-6 h-6 text-white/20 group-hover:text-primary transition-colors" />
                                            </div>
                                            <p className="font-sans font-black text-white/20 text-sm group-hover:text-white/40 transition-colors uppercase tracking-tight">Supplemental Asset</p>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/10 mt-2 group-hover:text-primary/60 transition-colors">Optional node</p>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DocumentsTab;
