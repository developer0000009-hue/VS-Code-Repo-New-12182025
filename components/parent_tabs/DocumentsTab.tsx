
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, formatError } from '../../services/supabase';
import { StorageService, BUCKETS } from '../../services/storage';
import { UserProfile, DocumentRequirement as RequirementWithDocs, AdmissionApplication } from '../../types';
import Spinner from '../common/Spinner';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { EyeIcon } from '../icons/EyeIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import PremiumAvatar from '../common/PremiumAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from '../icons/XIcon';
import { PaperClipIcon } from '../icons/PaperClipIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { FileTextIcon } from '../icons/FileTextIcon';

// --- Types ---
interface GroupedRequirementData {
    admissionId: string;
    applicantName: string;
    profilePhotoUrl: string | null;
    grade: string;
    requirements: RequirementWithDocs[];
}

interface DocumentsTabProps {
    profile: UserProfile;
    focusOnAdmissionId?: string | null;
    onClearFocus: () => void;
    setActiveComponent?: (id: string) => void;
}

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// --- Sub-Components ---

const CollapsibleDocumentCard: React.FC<{ 
    req: RequirementWithDocs; 
    onUpload: (file: File, reqId: number, admId: string, onProgress: (progress: number) => void) => Promise<void>;
}> = ({ req, onUpload }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isVerified = req.status === 'Verified';
    const isRejected = req.status === 'Rejected';
    const hasSubmission = (req.admission_documents && req.admission_documents.length > 0) || req.status === 'Submitted';
    const docFile = req.admission_documents?.[0];

    const toggleExpand = () => setIsExpanded(!isExpanded);

    const handleFileSelect = async (files: FileList | null) => {
        if (!files?.length || uploadProgress !== null) return;
        const selectedFile = files[0];
        if (selectedFile.size > 10 * 1024 * 1024) { 
            setError("File size exceeds 10MB limit.");
            return;
        }

        setError(null);
        setUploadProgress(0);
        try {
            await onUpload(selectedFile, req.id, req.admission_id, (progress) => setUploadProgress(progress));
        } catch (err: any) {
            setError(formatError(err));
        } finally {
            setUploadProgress(null);
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files);
        }
    };

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!docFile?.storage_path) return;
        setIsDownloading(true);
        try {
            const { data, error } = await supabase.storage.from(BUCKETS.DOCUMENTS).download(docFile.storage_path);
            if (error) throw error;
            const url = window.URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = docFile.file_name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert("Download failed. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleView = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!docFile?.storage_path) return;
        try {
            const url = await StorageService.getSignedUrl(docFile.storage_path);
            window.open(url, '_blank');
        } catch (err) {
            alert("Unable to open file preview.");
        }
    };

    return (
        <motion.div 
            layout
            className={`group relative rounded-[2rem] border transition-all duration-300 overflow-hidden ${
                isVerified 
                    ? 'bg-emerald-950/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]' 
                    : isRejected 
                        ? 'bg-red-950/10 border-red-500/20' 
                        : 'bg-[#13151a] border-white/5 hover:border-white/10 hover:bg-[#16181d]'
            }`}
        >
            {/* --- Header --- */}
            <div 
                onClick={toggleExpand}
                className="p-5 flex items-center justify-between cursor-pointer"
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl transition-colors ${
                        isVerified ? 'bg-emerald-500/10 text-emerald-400' : 
                        isRejected ? 'bg-red-500/10 text-red-400' : 
                        hasSubmission ? 'bg-blue-500/10 text-blue-400' :
                        'bg-white/5 text-white/30'
                    }`}>
                        {isVerified ? <CheckCircleIcon className="w-5 h-5" /> : 
                         isRejected ? <AlertTriangleIcon className="w-5 h-5" /> :
                         <DocumentTextIcon className="w-5 h-5" />}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white leading-tight">{req.document_name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            {req.is_mandatory && <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">MANDATORY</span>}
                            {docFile && <span className="text-[9px] font-mono text-white/30">{formatFileSize(docFile.file_size || 0)}</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Primary Action Buttons (Visible if uploaded) */}
                    {hasSubmission && !isRejected && (
                        <div className="flex items-center gap-1 mr-2">
                             <button 
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className="p-2 rounded-lg text-white/30 hover:text-primary hover:bg-white/5 transition-colors"
                                title="Download"
                             >
                                 {isDownloading ? <Spinner size="sm"/> : <DownloadIcon className="w-4 h-4"/>}
                             </button>
                             <button 
                                onClick={handleView}
                                className="p-2 rounded-lg text-white/30 hover:text-primary hover:bg-white/5 transition-colors"
                                title="Preview"
                             >
                                 <EyeIcon className="w-4 h-4"/>
                             </button>
                        </div>
                    )}
                    
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                        isVerified ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        isRejected ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                        hasSubmission ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                        'bg-white/5 border-white/10 text-white/30'
                    }`}>
                        {uploadProgress !== null ? 'Uploading...' : req.status}
                    </div>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDownIcon className="w-4 h-4 text-white/20 group-hover:text-white/50" />
                    </motion.div>
                </div>
            </div>

            {/* --- Expanded Content --- */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                        className="border-t border-white/5 bg-black/20"
                    >
                        <div className="p-6 pt-4">
                            {isRejected && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                    <p className="text-[9px] font-black uppercase text-red-500 mb-1">Attention Needed</p>
                                    <p className="text-xs text-red-300/80 font-medium leading-relaxed">{req.rejection_reason || 'Document does not meet criteria.'}</p>
                                </div>
                            )}

                            {hasSubmission && docFile && !isRejected ? (
                                <div className="space-y-4">
                                     <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="p-2 bg-black/40 rounded-xl text-white/40 border border-white/5">
                                            {docFile.mime_type?.includes('pdf') ? <FileTextIcon className="w-4 h-4"/> : <PaperClipIcon className="w-4 h-4"/>}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-white/80 font-bold truncate" title={docFile.file_name}>{docFile.file_name}</p>
                                            <p className="text-[9px] text-white/30 font-mono mt-0.5 uppercase tracking-wider">{new Date(docFile.uploaded_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    {!isVerified && (
                                        <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 rounded-xl border border-dashed border-white/10 text-xs font-bold text-white/40 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all">Replace File</button>
                                    )}
                                </div>
                            ) : (
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                    onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
                                    onDrop={handleDrop}
                                    className={`
                                        relative h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300
                                        ${isDragOver ? 'border-primary bg-primary/5' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'}
                                    `}
                                >
                                    <div className={`p-2.5 rounded-full ${isDragOver ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/30'} transition-colors`}>
                                        <UploadIcon className="w-5 h-5" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[11px] font-bold text-white/60 uppercase tracking-wider">Click or Drop to Upload</p>
                                        <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-1">Max 10MB</p>
                                    </div>
                                </div>
                            )}

                            {uploadProgress !== null && (
                                <div className="mt-4 relative h-8 w-full bg-black/40 rounded-xl overflow-hidden border border-white/5">
                                    <motion.div 
                                        className="absolute top-0 left-0 bottom-0 bg-primary/20"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${uploadProgress}%` }}
                                        transition={{ duration: 0.2 }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-primary uppercase tracking-widest">
                                        Encrypting & Uploading {uploadProgress.toFixed(0)}%
                                    </div>
                                </div>
                            )}
                            
                            {error && (
                                 <p className="text-[10px] text-red-400 font-bold mt-3 text-center bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>
                            )}
                            <input ref={fileInputRef} type="file" className="hidden" onChange={e => handleFileSelect(e.target.files)} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const DocumentsTab: React.FC<DocumentsTabProps> = ({ profile, focusOnAdmissionId, onClearFocus, setActiveComponent }) => {
    const [loading, setLoading] = useState(true);
    const [groupedData, setGroupedData] = useState<Record<string, GroupedRequirementData>>({});
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        setError(null);
        try {
            await supabase.rpc('parent_initialize_vault_slots_all');
            const { data: children, error: childError } = await supabase.rpc('get_my_children_profiles');
            if (childError) throw childError;
            const { data: reqs, error: reqsErr } = await supabase.rpc('parent_get_document_requirements', { p_user_id: profile.id });
            if (reqsErr) throw reqsErr;

            const grouped: Record<string, GroupedRequirementData> = {};
            
            (children || []).forEach((child: AdmissionApplication) => {
                grouped[child.id] = {
                    admissionId: child.id,
                    applicantName: child.applicant_name,
                    profilePhotoUrl: child.profile_photo_url,
                    grade: child.grade,
                    requirements: []
                };
            });

            (reqs || []).forEach((req: RequirementWithDocs) => {
                if (grouped[req.admission_id]) {
                    grouped[req.admission_id].requirements.push(req);
                }
            });

            // Sort requirements
            Object.values(grouped).forEach(group => {
                group.requirements.sort((a, b) => {
                    if (a.is_mandatory && !b.is_mandatory) return -1;
                    if (!a.is_mandatory && b.is_mandatory) return 1;
                    return a.document_name.localeCompare(b.document_name);
                });
            });

            setGroupedData(grouped);
            
            if (!isSilent) {
                if (focusOnAdmissionId && grouped[focusOnAdmissionId]) {
                    setExpandedIds(new Set([focusOnAdmissionId]));
                    onClearFocus();
                } else if (Object.keys(grouped).length > 0 && expandedIds.size === 0) {
                    setExpandedIds(new Set([Object.keys(grouped)[0]]));
                }
            }
        } catch (err: any) {
            setError(formatError(err));
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, [profile.id, focusOnAdmissionId, onClearFocus, expandedIds.size]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleUpload = async (file: File, reqId: number, admId: string, onProgress: (progress: number) => void) => {
        if (!profile.id) throw new Error("Identity context missing.");
        
        // Simulating upload progress for better UX
        const interval = setInterval(() => {
           onProgress(Math.random() * 50 + 20); 
        }, 300);

        try {
            const path = StorageService.getDocumentPath(profile.id, admId, reqId, file.name);
            const { error: upErr } = await supabase.storage.from(BUCKETS.DOCUMENTS).upload(path, file, { upsert: true });
            
            clearInterval(interval);
            onProgress(100);

            if (upErr) throw upErr;

            const { error: dbErr } = await supabase.rpc('parent_complete_document_upload', {
                p_requirement_id: reqId,
                p_admission_id: admId,
                p_file_name: file.name,
                p_storage_path: path,
                p_file_size: file.size,
                p_mime_type: file.type
            });
            
            if (dbErr) throw dbErr;
            
            await new Promise(resolve => setTimeout(resolve, 500)); 
            await fetchData(true);
        } catch (error) {
            clearInterval(interval);
            throw error;
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (loading) return (
        <div className="py-40 flex flex-col items-center justify-center gap-6">
            <Spinner size="lg" className="text-primary"/>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 animate-pulse">Synchronizing Security Vault</p>
        </div>
    );
    
    if (error) return <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center font-bold">{error}</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700">
            {/* Module Header */}
            <div className="relative p-10 md:p-16 rounded-[3rem] bg-[#0c0e12] border border-white/5 overflow-hidden shadow-2xl ring-1 ring-white/5">
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none opacity-40"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]"><ShieldCheckIcon className="w-6 h-6"/></div>
                        <span className="text-[11px] font-black uppercase text-emerald-500 tracking-[0.4em] drop-shadow-sm">Integrity Center</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif font-black text-white tracking-tighter uppercase leading-none">Artifact <span className="text-white/20 italic">Vault.</span></h2>
                    <p className="text-white/40 text-lg font-serif italic border-l border-white/10 pl-8 max-w-lg leading-relaxed mt-6">
                        Finalize institutional identity synchronization by providing verified artifacts for enrollment nodes.
                    </p>
                </div>
            </div>

            {/* Students List */}
            <div className="space-y-8 px-2">
                {Object.keys(groupedData).map(admId => {
                    const node = groupedData[admId];
                    const isExpanded = expandedIds.has(admId);
                    const verifiedCount = node.requirements.filter(r => r.status === 'Verified').length;
                    const total = node.requirements.length;
                    const percent = total > 0 ? Math.round((verifiedCount / total) * 100) : 0;

                    return (
                        <motion.div layout key={admId} className={`group bg-[#0f1116] border transition-all duration-700 rounded-[3rem] overflow-hidden shadow-xl ${isExpanded ? 'border-primary/20 ring-1 ring-primary/5 shadow-2xl shadow-primary/5' : 'border-white/5 hover:border-white/10'}`}>
                            {/* Student Header */}
                            <header className="p-8 flex flex-col md:flex-row items-center justify-between cursor-pointer gap-6 relative" onClick={() => toggleExpand(admId)}>
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                                <div className="flex items-center gap-6 w-full md:w-auto relative z-10">
                                    <PremiumAvatar src={node.profilePhotoUrl} name={node.applicantName} size="sm" className="shadow-2xl border border-white/10 w-16 h-16 rounded-2xl" />
                                    <div>
                                        <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors tracking-tight">{node.applicantName}</h3>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Grade {node.grade}</span>
                                            {total === 0 && <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-white/20 font-bold uppercase tracking-wider">Empty Node</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end relative z-10">
                                    <div className="flex items-center gap-6">
                                        <div className="w-36 text-right">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Vault Sync</span>
                                                <span className={`text-sm font-black ${percent === 100 ? 'text-emerald-500' : 'text-primary'}`}>{percent}%</span>
                                            </div>
                                            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5"><div className={`h-full rounded-full transition-all duration-1000 ease-out ${percent === 100 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]'}`} style={{width: `${percent}%`}}></div></div>
                                        </div>
                                    </div>
                                    <div className={`p-4 rounded-full bg-white/5 border border-white/10 transition-all duration-500 ${isExpanded ? 'rotate-180 bg-primary/10 text-primary border-primary/20' : 'text-white/30 group-hover:text-white group-hover:bg-white/10'}`}>
                                        <ChevronDownIcon className="w-5 h-5"/>
                                    </div>
                                </div>
                            </header>

                            {/* Collapsible Content */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.section 
                                        initial={{ height: 0, opacity: 0 }} 
                                        animate={{ height: 'auto', opacity: 1 }} 
                                        exit={{ height: 0, opacity: 0 }} 
                                        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }} 
                                        className="overflow-hidden bg-[#0a0c10]/50 shadow-inner"
                                    >
                                        <div className="p-8 md:p-10 border-t border-white/[0.04]">
                                            {node.requirements.length === 0 ? (
                                                <div className="text-center py-16 text-white/20 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center">
                                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4"><DocumentTextIcon className="w-8 h-8 opacity-40"/></div>
                                                    <p className="font-bold text-sm uppercase tracking-widest mb-1">Vault Empty</p>
                                                    <p className="text-xs opacity-50">Upload a custom document to initialize.</p>
                                                </div>
                                            ) : (
                                                <motion.div 
                                                    initial="hidden" 
                                                    animate="visible" 
                                                    variants={{ visible: { transition: { staggerChildren: 0.06 } } }} 
                                                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                                                >
                                                    {node.requirements.map(req => (
                                                        <CollapsibleDocumentCard key={req.id} req={req} onUpload={handleUpload} />
                                                    ))}
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.section>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
            
             {Object.keys(groupedData).length === 0 && !loading && (
                <div className="py-32 text-center border-2 border-dashed border-white/10 rounded-[4rem] shadow-2xl flex flex-col items-center bg-[#0c0d12]">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-inner"><DocumentTextIcon className="w-10 h-10 text-white/20" /></div>
                    <h3 className="text-xl font-bold text-white/60">No Active Enrollments</h3>
                    <p className="text-white/20 max-w-sm mx-auto mt-2 text-sm leading-relaxed">No active institutional identities linked to this profile. Register a child to activate the document vault.</p>
                    <button
                        onClick={() => setActiveComponent?.('My Children')}
                        className="mt-8 px-10 py-4 bg-primary text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 group transform hover:-translate-y-1 active:scale-95"
                    >
                        <PlusIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                        Register a Child
                    </button>
                </div>
            )}
        </div>
    );
};

export default DocumentsTab;
