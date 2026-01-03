import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { StorageService, BUCKETS } from '../../services/storage';
import { AdmissionApplication } from '../../types';
import Spinner from '../common/Spinner';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { EyeIcon } from '../icons/EyeIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { RefreshIcon } from '../icons/RefreshIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { PlusIcon } from '../icons/PlusIcon';
import PremiumAvatar from '../common/PremiumAvatar';

// --- Internal Types ---

interface DocumentFile {
    id: number;
    file_name: string;
    storage_path: string;
    uploaded_at: string;
}

interface RequirementWithDocs {
    id: number;
    admission_id: string;
    document_name: string;
    status: 'Pending' | 'Submitted' | 'Verified' | 'Rejected';
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

// --- Sub-Components ---

const IntegritySeal = () => (
    <div className="absolute -right-4 -bottom-4 opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity duration-1000">
        <ShieldCheckIcon className="w-48 h-48 text-emerald-500 rotate-12" />
    </div>
);

const DocumentCard: React.FC<{ 
    req: RequirementWithDocs; 
    onUpload: (file: File, reqId: number, admId: string) => Promise<void>;
}> = ({ req, onUpload }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const latestDoc = req.admission_documents?.[0];
    const isLocked = req.status === 'Verified';
    const isRejected = req.status === 'Rejected';
    const hasFile = !!latestDoc;

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setIsUploading(true);
        try {
            await onUpload(e.target.files[0], req.id, req.admission_id);
        } catch (err: any) {
            console.error("Sync Failure", err);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={`relative rounded-3xl border transition-all duration-500 group overflow-hidden bg-[#111318] flex flex-col min-h-[240px] ${isLocked ? 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : isRejected ? 'border-rose-500/30' : 'border-white/5 hover:border-primary/30'}`}>
            <div className="p-6 flex flex-col h-full z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-2xl shadow-inner transition-all duration-500 ${isLocked ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/20 group-hover:text-primary group-hover:bg-primary/10 border border-white/5'}`}>
                        <DocumentTextIcon className="w-6 h-6" />
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border backdrop-blur-md ${isLocked ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : isRejected ? 'text-rose-400 border-rose-500/20 bg-rose-500/5' : 'text-white/30 border-white/10 bg-white/5'}`}>
                        {req.status}
                    </span>
                </div>

                <div className="flex-grow">
                    <h4 className="font-serif font-black text-white text-base mb-1 group-hover:text-primary transition-colors uppercase tracking-tight">{req.document_name}</h4>
                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{req.is_mandatory ? 'Mandatory Artifact' : 'Supplemental'}</p>
                    
                    {isRejected && (
                        <div className="mt-4 p-3 bg-rose-500/5 border border-rose-500/10 rounded-2xl animate-pulse">
                            <p className="text-[9px] font-black text-rose-400 uppercase mb-1">Correction Required</p>
                            <p className="text-[11px] text-rose-200/50 italic leading-relaxed">"{req.rejection_reason}"</p>
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex gap-2">
                    {hasFile ? (
                        <button 
                            disabled={actionLoading || isUploading}
                            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-[10px] font-black bg-white/5 border border-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest"
                        >
                            <EyeIcon className="w-4 h-4" /> View
                        </button>
                    ) : (
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-[10px] font-black text-white bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 uppercase tracking-widest"
                        >
                            {isUploading ? <Spinner size="sm" className="text-white"/> : <><UploadIcon className="w-4 h-4" /> Upload</>}
                        </button>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                </div>
            </div>
        </div>
    );
};

// --- Main Container ---

const DocumentsTab: React.FC<{ focusOnAdmissionId?: string | null; onClearFocus?: () => void }> = ({ focusOnAdmissionId, onClearFocus }) => {
    const [loading, setLoading] = useState(true);
    const [groupedRequirements, setGroupedRequirements] = useState<Record<string, GroupedRequirementData>>({});
    const [expandedChildIds, setExpandedChildIds] = useState<Set<string>>(new Set());

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: ads, error: adsErr } = await supabase.rpc('get_my_children_profiles');
            if (adsErr) throw adsErr;

            // Batch initialize slots to ensure no child is left behind
            if (ads?.length) {
                await Promise.all(ads.map((child: any) => 
                    supabase.rpc('parent_initialize_vault_slots', { p_admission_id: child.id })
                ));
            }

            const { data: reqs, error: rpcError } = await supabase.rpc('parent_get_document_requirements');
            if (rpcError) throw rpcError;

            const grouped: Record<string, GroupedRequirementData> = {};
            (reqs || []).forEach((req: RequirementWithDocs) => {
                if (!grouped[req.admission_id]) {
                    grouped[req.admission_id] = {
                        admissionId: req.admission_id,
                        applicantName: req.applicant_name,
                        profilePhotoUrl: req.profile_photo_url,
                        requirements: []
                    };
                }
                grouped[req.admission_id].requirements.push(req);
            });

            setGroupedRequirements(grouped);

            if (focusOnAdmissionId) {
                setExpandedChildIds(new Set([focusOnAdmissionId]));
            } else if (Object.keys(grouped).length > 0 && expandedChildIds.size === 0) {
                setExpandedChildIds(new Set([Object.keys(grouped)[0]]));
            }

        } catch (err) {
            console.error("Registry Sync Fail", err);
        } finally {
            setLoading(false);
        }
    }, [focusOnAdmissionId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleUpload = async (file: File, reqId: number, admId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User authentication required');

        const filePath = `parent/${user.id}/adm-${admId}/req-${reqId}_${Date.now()}`;

        try {
            // Use StorageService for consistent bucket handling
            await StorageService.upload(BUCKETS.GUARDIAN_DOCUMENTS, filePath, file);

            const { error: dbErr } = await supabase.rpc('parent_complete_document_upload', {
                p_requirement_id: reqId,
                p_admission_id: admId,
                p_file_name: file.name,
                p_storage_path: filePath,
                p_file_size: file.size,
                p_mime_type: file.type
            });
            if (dbErr) throw dbErr;

            fetchData();
        } catch (error: any) {
            console.error("Document upload failed:", error);
            throw new Error(error.message || 'Failed to upload document. Please try again.');
        }
    };

    const toggleChild = (id: string) => {
        setExpandedChildIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-40 gap-6">
            <Spinner size="lg" className="text-primary"/>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 animate-pulse">Syncing Lifecycle Ledger</p>
        </div>
    );

    const childIds = Object.keys(groupedRequirements);

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-1000 pb-32">
            
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-2">
                <div className="max-w-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary border border-primary/20 shadow-inner">
                            <ShieldCheckIcon className="w-5 h-5"/>
                        </div>
                        <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em]">Identity Resilience Module</span>
                    </div>
                    <h2 className="text-[clamp(32px,3.5vw,48px)] font-serif font-black text-white tracking-tighter leading-none mb-6 uppercase">
                        Verification <span className="text-white/30 italic">Vault.</span>
                    </h2>
                    <p className="text-white/40 text-[16px] leading-relaxed font-serif italic border-l border-white/10 pl-8 ml-2">
                        Institutional identity repository. Linking mandatory enrollment assets required to activate and seal student nodes.
                    </p>
                </div>
                
                <div className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-[2rem] border border-white/5">
                     <span className="text-[10px] font-black uppercase text-white/20 tracking-widest px-4 border-r border-white/5">Active Nodes</span>
                     <span className="text-2xl font-black text-white px-2">{childIds.length}</span>
                </div>
            </div>

            {/* --- REGISTRY NODES --- */}
            <div className="space-y-6">
                {childIds.map(admId => {
                    const group = groupedRequirements[admId];
                    const isExpanded = expandedChildIds.has(admId);
                    const verifiedCount = group.requirements.filter(r => r.status === 'Verified').length;
                    const totalCount = group.requirements.length;
                    const completion = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;
                    const isFullySealed = completion === 100;

                    return (
                        <div 
                            key={admId} 
                            className={`group relative bg-[#0d0f14] border transition-all duration-700 rounded-[2.5rem] overflow-hidden ${isExpanded ? 'border-primary/30 shadow-2xl shadow-black/60 scale-[1.01]' : 'border-white/5 hover:border-primary/20 shadow-lg'}`}
                        >
                            {isFullySealed && <IntegritySeal />}

                            <div 
                                className={`p-8 md:p-10 flex flex-col lg:flex-row justify-between items-center gap-8 cursor-pointer transition-all duration-500 ${isExpanded ? 'bg-white/[0.03]' : 'hover:bg-white/[0.01]'}`}
                                onClick={() => toggleChild(admId)}
                            >
                                <div className="flex items-center gap-8 w-full lg:w-auto">
                                    <div className="relative">
                                        <PremiumAvatar src={group.profilePhotoUrl} name={group.applicantName} size="sm" className={`shadow-2xl border-2 transition-all duration-700 ${isFullySealed ? 'border-emerald-500 shadow-emerald-500/20 scale-110' : 'border-white/10'}`} />
                                        {isFullySealed && (
                                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-xl shadow-xl animate-in zoom-in duration-500">
                                                <ShieldCheckIcon className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-serif font-black text-3xl text-white tracking-tighter truncate leading-none mb-3 group-hover:text-primary transition-colors duration-500 uppercase">{group.applicantName}</h3>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Operational</span>
                                            </div>
                                            <span className="text-[10px] font-mono font-bold text-white/10 uppercase tracking-widest">HUB_ADM_{admId.substring(0, 8).toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-10 w-full lg:w-auto">
                                    <div className="flex-grow lg:w-64 w-full">
                                        <div className="flex justify-between items-end mb-3 px-1">
                                            <span className="text-[10px] font-black uppercase text-white/20 tracking-[0.2em]">Integrity Index</span>
                                            <span className={`text-[12px] font-black tracking-widest ${isFullySealed ? 'text-emerald-400' : 'text-primary'}`}>{completion}% <span className="text-[8px] opacity-40">Sealed</span></span>
                                        </div>
                                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden p-[2px] border border-white/5 ring-1 ring-black/50">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${isFullySealed ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]'}`} 
                                                style={{ width: `${completion}%` }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`p-4 rounded-2xl transition-all duration-700 ${isExpanded ? 'rotate-180 bg-primary/10 text-primary border border-primary/20 shadow-inner' : 'text-white/10 bg-white/[0.02] border border-white/5'}`}>
                                        <ChevronDownIcon className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                            
                            {/* --- EXPANDED GRID --- */}
                            {isExpanded && (
                                <div className="p-8 md:p-14 border-t border-white/5 bg-black/20 animate-in slide-in-from-top-4 duration-700">
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-[1400px] mx-auto">
                                        {group.requirements.map(req => (
                                            <DocumentCard 
                                                key={req.id} 
                                                req={req} 
                                                onUpload={handleUpload} 
                                            />
                                        ))}
                                        
                                        <div className="rounded-[2.5rem] border-2 border-dashed border-white/5 hover:border-primary/20 transition-all duration-500 flex flex-col items-center justify-center p-10 bg-white/[0.01] hover:bg-white/[0.03] group/plus cursor-pointer min-h-[240px]">
                                            <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6 group-hover/plus:scale-110 group-hover/plus:bg-primary/10 transition-all duration-700 shadow-inner border border-white/5">
                                                <PlusIcon className="w-8 h-8 text-white/10 group-hover/plus:text-primary transition-colors" />
                                            </div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/10 group-hover/plus:text-white/30 transition-colors text-center">Supplemental Artifact Sync</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {childIds.length === 0 && (
                <div className="p-24 text-center border-2 border-dashed border-white/5 rounded-[4rem] bg-black/20 animate-in zoom-in-95 duration-1000">
                    <div className="w-32 h-32 bg-white/[0.02] rounded-[3rem] flex items-center justify-center mx-auto mb-10 border border-white/10 shadow-inner ring-1 ring-white/5">
                        <DocumentTextIcon className="w-14 h-14 text-white/10" />
                    </div>
                    <h3 className="text-3xl font-serif font-black text-white uppercase tracking-tighter">Vault Dormant.</h3>
                    <p className="text-white/30 max-w-sm mx-auto mt-6 font-serif italic text-lg leading-relaxed">No active sibling nodes identified in the familial registry. Provision a node in the children tab to activate its vault.</p>
                </div>
            )}
            
            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(var(--primary), 0.5); }
            `}</style>
        </div>
    );
};

export default DocumentsTab;
