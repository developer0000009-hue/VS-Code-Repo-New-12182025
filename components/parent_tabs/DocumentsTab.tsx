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
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { PlusIcon } from '../icons/PlusIcon';
import PremiumAvatar from '../common/PremiumAvatar';
import { motion, AnimatePresence } from 'framer-motion';

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

const DocumentCard: React.FC<{ 
    req: RequirementWithDocs; 
    onUpload: (file: File, reqId: number, admId: string) => Promise<void>;
}> = ({ req, onUpload }) => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const latestDoc = req.admission_documents?.[0];
    const isLocked = req.status === 'Verified';
    const isRejected = req.status === 'Rejected';
    const hasFile = !!latestDoc || req.status === 'Submitted';

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
        <motion.div 
            variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 }
            }}
            className={`relative rounded-[1.5rem] border transition-all duration-500 group overflow-hidden bg-slate-900/40 shadow-inner flex flex-col min-h-[320px] ${isLocked ? 'border-emerald-500/10' : isRejected ? 'border-rose-500/20' : 'border-white/5 hover:border-primary/20'}`}
        >
            {/* Subtle Inner Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none ${isLocked ? 'from-emerald-500/[0.03]' : ''}`}></div>
            
            <div className="p-7 md:p-8 flex flex-col h-full z-10">
                <div className="flex justify-between items-start mb-10">
                    <div className={`p-3.5 rounded-2xl shadow-inner transition-all duration-500 ${isLocked ? 'bg-emerald-500/10 text-emerald-400/80' : 'bg-white/5 text-white/20 group-hover:text-primary group-hover:bg-primary/10 border border-white/5'}`}>
                        <DocumentTextIcon className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-[0.15em] border backdrop-blur-md transition-colors duration-500 ${isLocked ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : isRejected ? 'text-rose-400 border-rose-500/20 bg-rose-500/5' : hasFile ? 'text-blue-400 border-blue-500/20 bg-blue-500/5' : 'text-white/20 border-white/5 bg-white/5'}`}>
                            {req.status}
                        </span>
                        {isLocked && <span className="text-[8px] font-medium text-white/20 uppercase tracking-widest">System Sealed</span>}
                    </div>
                </div>

                <div className="flex-grow">
                    <h4 className="font-sans font-bold text-white/90 text-[16px] mb-2 transition-colors uppercase tracking-tight leading-snug">{req.document_name}</h4>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{req.is_mandatory ? 'Institutional Requirement' : 'Supplemental Asset'}</p>
                    
                    {isRejected && (
                        <div className="mt-5 p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl animate-in slide-in-from-top-2">
                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                <AlertTriangleIcon className="w-3 h-3" /> Correction Needed
                            </p>
                            <p className="text-[12px] text-rose-200/50 italic leading-relaxed font-serif">"{req.rejection_reason}"</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-white/[0.03]">
                    {hasFile && !isRejected ? (
                        <button 
                            className="w-full h-11 flex items-center justify-center gap-3 rounded-xl text-[10px] font-bold bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/90 hover:bg-white/10 transition-all uppercase tracking-widest shadow-sm active:scale-[0.98]"
                        >
                            <EyeIcon className="w-4 h-4 opacity-40" /> Inspect Artifact
                        </button>
                    ) : (
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-full h-11 flex items-center justify-center gap-3 rounded-xl text-[10px] font-black text-white bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[1.02] active:shadow-primary/30 uppercase tracking-[0.15em] group/btn"
                        >
                            {isUploading ? <Spinner size="sm" className="text-white"/> : <><UploadIcon className="w-4 h-4 group-hover/btn:-translate-y-0.5 transition-transform duration-300" /> Secure Upload</>}
                        </button>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                </div>
            </div>
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </motion.div>
    );
};

const AlertTriangleIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
);

// --- Main Container ---

const DocumentsTab: React.FC<{ focusOnAdmissionId?: string | null; onClearFocus?: () => void }> = ({ focusOnAdmissionId }) => {
    const [loading, setLoading] = useState(true);
    const [groupedRequirements, setGroupedRequirements] = useState<Record<string, GroupedRequirementData>>({});
    const [expandedChildIds, setExpandedChildIds] = useState<Set<string>>(new Set());
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    const fetchData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const { data: ads, error: adsErr } = await supabase.rpc('get_my_children_profiles');
            if (adsErr) throw adsErr;

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

            if (isFirstLoad && !isSilent) {
                if (focusOnAdmissionId) {
                    setExpandedChildIds(new Set([focusOnAdmissionId]));
                } else if (Object.keys(grouped).length > 0) {
                    setExpandedChildIds(new Set([Object.keys(grouped)[0]]));
                }
                setIsFirstLoad(false);
            }

        } catch (err) {
            console.error("Registry Sync Fail", err);
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, [focusOnAdmissionId, isFirstLoad]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleUpload = async (file: File, reqId: number, admId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const filePath = `parent/${user.id}/adm-${admId}/req-${reqId}_${Date.now()}`;
        const { error: upErr } = await supabase.storage.from('guardian-documents').upload(filePath, file);
        if (upErr) throw upErr;

        setGroupedRequirements(prev => {
            const next = { ...prev };
            const group = next[admId];
            if (group) {
                const reqIndex = group.requirements.findIndex(r => r.id === reqId);
                if (reqIndex !== -1) {
                    group.requirements[reqIndex] = {
                        ...group.requirements[reqIndex],
                        status: 'Submitted'
                    };
                }
            }
            return next;
        });

        const { error: dbErr } = await supabase.rpc('parent_complete_document_upload', {
            p_requirement_id: reqId,
            p_admission_id: admId,
            p_file_name: file.name,
            p_storage_path: filePath,
            p_file_size: file.size,
            p_mime_type: file.type
        });
        
        if (dbErr) throw dbErr;
        fetchData(true);
    };

    const toggleChild = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedChildIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (loading && Object.keys(groupedRequirements).length === 0) return (
        <div className="flex flex-col items-center justify-center py-40 gap-6">
            <Spinner size="lg" className="text-primary"/>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 animate-pulse">Establishing Secure Context</p>
        </div>
    );

    const childIds = Object.keys(groupedRequirements);

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-32">
            
            {/* --- MASTER HEADER --- */}
            <div className="relative p-8 md:p-12 rounded-[2rem] border border-white/5 overflow-hidden">
                {/* Subtle Hero Wash */}
                <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
                
                <div className="relative z-10 max-w-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/10 shadow-inner">
                            <ShieldCheckIcon className="w-6 h-6"/>
                        </div>
                        <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em] border-l border-primary/20 pl-4">Institutional Integrity</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-serif font-black text-white/90 tracking-tighter uppercase leading-tight mb-6">
                        Verification <span className="text-white/20 italic">Vault.</span>
                    </h2>
                    <p className="text-white/40 text-[15px] leading-relaxed font-serif italic border-l border-white/10 pl-8 max-width-[90%]">
                        Central repository for verified credentials, academic records, and institutional proofs. Finalize node synchronization through secure artifact submission.
                    </p>
                </div>
            </div>

            {/* --- REGISTRY NODES --- */}
            <div className="space-y-8 px-2">
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
                            className={`group relative bg-[#0d1017]/60 backdrop-blur-xl border transition-all duration-700 rounded-[2.5rem] overflow-hidden shadow-2xl ${isExpanded ? 'border-primary/20 ring-1 ring-white/5 shadow-primary/5' : 'border-white/5 hover:border-white/10'}`}
                        >
                            <div 
                                className={`p-8 md:p-10 flex flex-col lg:flex-row justify-between items-center gap-8 cursor-pointer transition-all duration-500 ${isExpanded ? 'bg-white/[0.01]' : 'hover:bg-white/[0.01]'}`}
                                onClick={(e) => toggleChild(admId, e)}
                            >
                                <div className="flex items-center gap-8 w-full lg:w-auto">
                                    <div className="relative shrink-0">
                                        <div className={`absolute -inset-2 rounded-full blur-2xl opacity-10 transition-all duration-1000 ${isFullySealed ? 'bg-emerald-500' : 'bg-primary'}`}></div>
                                        <PremiumAvatar src={group.profilePhotoUrl} name={group.applicantName} size="sm" className={`shadow-xl border-2 transition-all duration-700 ${isFullySealed ? 'border-emerald-500/40' : 'border-white/10'}`} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-sans font-bold text-2xl md:text-3xl text-white/90 tracking-tight truncate leading-none mb-3 group-hover:text-primary transition-colors duration-500 uppercase">{group.applicantName}</h3>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 shadow-[0_0_8px_#10b981]"></div>
                                                <span className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-widest">Active Link</span>
                                            </div>
                                            <span className="text-[10px] font-mono font-medium text-white/10 uppercase tracking-widest bg-white/[0.03] px-2 py-0.5 rounded-md">ID_{admId.substring(0, 8).toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-10 w-full lg:w-auto">
                                    <div className="flex-grow lg:w-64 w-full">
                                        <div className="flex justify-between items-end mb-3 px-1">
                                            <span className="text-[10px] font-black uppercase text-white/20 tracking-[0.25em]">Integrity Level</span>
                                            <span className={`text-[12px] font-black tracking-widest ${isFullySealed ? 'text-emerald-500' : 'text-primary'}`}>{completion}% <span className="text-[8px] opacity-40 uppercase ml-0.5">Sealed</span></span>
                                        </div>
                                        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden p-[1px] border border-white/5 shadow-inner">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] relative overflow-hidden ${isFullySealed ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]'}`} 
                                                style={{ width: `${completion}%` }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div 
                                        className={`p-3.5 rounded-2xl transition-all duration-500 ${isExpanded ? 'rotate-180 bg-primary text-white shadow-xl' : 'text-white/20 bg-white/[0.03] border border-white/5'}`}
                                    >
                                        <ChevronDownIcon className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                            
                            {/* --- EXPANDED GRID --- */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-8 md:p-12 border-t border-white/[0.03] bg-black/20">
                                            <motion.div 
                                                initial="hidden"
                                                animate="visible"
                                                variants={{
                                                    visible: { transition: { staggerChildren: 0.05 } }
                                                }}
                                                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-full mx-auto"
                                            >
                                                {group.requirements.map(req => (
                                                    <DocumentCard 
                                                        key={req.id} 
                                                        req={req} 
                                                        onUpload={handleUpload} 
                                                    />
                                                ))}
                                                
                                                <motion.button 
                                                    variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                                                    className="rounded-[1.5rem] border-2 border-dashed border-white/5 hover:border-primary/40 hover:bg-primary/[0.01] transition-all duration-700 flex flex-col items-center justify-center p-10 bg-white/[0.01] group/plus cursor-pointer min-h-[320px] shadow-inner"
                                                >
                                                    <div className="w-16 h-16 rounded-2xl bg-white/[0.02] flex items-center justify-center mb-6 transition-all duration-700 group-hover/plus:scale-105 group-hover/plus:bg-primary/5 border border-white/5 shadow-xl relative overflow-hidden">
                                                        <PlusIcon className="w-7 h-7 text-white/10 group-hover/plus:text-primary transition-colors relative z-10" />
                                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/plus:opacity-100 transition-opacity"></div>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20 group-hover/plus:text-white/40 transition-colors">Attach Evidence</p>
                                                        <p className="text-[9px] text-white/5 mt-1 font-medium group-hover/plus:text-white/10 transition-colors">Supplemental Artifact Slot</p>
                                                    </div>
                                                </motion.button>
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {childIds.length === 0 && !loading && (
                <div className="p-24 text-center border-2 border-dashed border-white/5 rounded-[4rem] bg-black/10 animate-in zoom-in-95 duration-1000 shadow-2xl">
                    <div className="w-32 h-32 bg-white/[0.01] rounded-full flex items-center justify-center mx-auto mb-10 border border-white/5 shadow-inner group">
                        <DocumentTextIcon className="w-14 h-14 text-white/5 group-hover:text-primary/10 transition-colors duration-1000" />
                    </div>
                    <h3 className="text-2xl font-serif font-black text-white/60 uppercase tracking-tighter mb-4">Vault Dormant.</h3>
                    <p className="text-white/20 max-w-sm mx-auto font-serif italic text-lg leading-relaxed">No active institutional identities identified. Establish a node in the children directory to activate the secure vault.</p>
                </div>
            )}
            
            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.03); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(139, 92, 246, 0.2); }
            `}</style>
        </div>
    );
};

export default DocumentsTab;