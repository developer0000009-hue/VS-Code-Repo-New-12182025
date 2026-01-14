
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, formatError } from '../../services/supabase';
import { StorageService, BUCKETS } from '../../services/storage';
import { DocumentRequirement } from '../../types';
import Spinner from '../common/Spinner';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { SearchIcon } from '../icons/SearchIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { XIcon } from '../icons/XIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { EyeIcon } from '../icons/EyeIcon';
import { TrashIcon } from '../icons/TrashIcon';

const CATEGORIES = ['General', 'Academic', 'Medical', 'Legal', 'Identification', 'Other'];

const StudentAddDocumentModal: React.FC<{ 
    admissionId: string; 
    onClose: () => void; 
    onSuccess: () => void; 
}> = ({ admissionId, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('General');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !name) return;
        setLoading(true);
        setError(null);

        try {
            // 1. Create a requirement slot
            const { data: reqData, error: reqError } = await supabase
                .from('document_requirements')
                .insert({
                    admission_id: admissionId,
                    document_name: name,
                    is_mandatory: false,
                    status: 'Submitted',
                    notes_for_parent: category // Storing category in notes
                })
                .select()
                .single();

            if (reqError) throw reqError;

            // 2. Upload file
            const path = `student_uploads/${admissionId}/${reqData.id}/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage.from(BUCKETS.DOCUMENTS).upload(path, file);
            if (uploadError) throw uploadError;

            // 3. Link document
            const { error: docError } = await supabase.from('admission_documents').insert({
                requirement_id: reqData.id,
                file_name: file.name,
                storage_path: path,
                file_size: file.size,
                mime_type: file.type
            });

            if (docError) throw docError;

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border flex justify-between items-center bg-muted/10">
                    <h3 className="font-bold text-lg text-foreground">Upload Document</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"><XIcon className="w-5 h-5"/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">{error}</div>}
                    
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">Document Name</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full p-3 bg-background border border-input rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="e.g. Science Project Certificate"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">Category</label>
                        <select 
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full p-3 bg-background border border-input rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">File</label>
                        <div 
                            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/20'}`}
                            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                className="hidden" 
                                onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                            />
                            <div className="flex flex-col items-center gap-2 pointer-events-none">
                                <div className="p-3 bg-primary/10 rounded-full text-primary">
                                    <UploadIcon className="w-6 h-6" />
                                </div>
                                {file ? (
                                    <div className="text-sm font-bold text-foreground">
                                        {file.name}
                                        <p className="text-xs text-muted-foreground font-normal mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-sm font-bold text-foreground">Click to upload or drag & drop</p>
                                        <p className="text-xs text-muted-foreground">PDF, JPG, PNG (Max 10MB)</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={loading || !file || !name}
                            className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Spinner size="sm" className="text-white"/> : <><PlusIcon className="w-4 h-4"/> Upload Document</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DocumentsTab: React.FC = () => {
    const [documents, setDocuments] = useState<DocumentRequirement[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [admissionId, setAdmissionId] = useState<string | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');

    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        try {
            // Get current student's admission ID
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: admission } = await supabase
                .from('admissions')
                .select('id')
                .eq('student_user_id', user.id)
                .maybeSingle();

            if (admission) {
                setAdmissionId(admission.id);
                const { data: docs } = await supabase
                    .from('document_requirements')
                    .select('*, admission_documents(*)')
                    .eq('admission_id', admission.id)
                    .order('created_at', { ascending: false });
                
                setDocuments(docs || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleView = async (path: string) => {
        try {
            const url = await StorageService.getSignedUrl(path);
            window.open(url, '_blank');
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDownload = async (path: string, name: string) => {
        try {
            const { data, error } = await supabase.storage.from(BUCKETS.DOCUMENTS).download(path);
            if (error) throw error;
            const url = window.URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (err: any) {
            alert(err.message);
        }
    };

    const filteredDocs = documents.filter(doc => {
        const matchesSearch = doc.document_name.toLowerCase().includes(search.toLowerCase());
        const category = doc.notes_for_parent || 'General';
        const matchesFilter = activeFilter === 'All' || category === activeFilter;
        return matchesSearch && matchesFilter;
    });

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) return <div className="flex justify-center p-20"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">My Documents</h2>
                    <p className="text-muted-foreground text-sm mt-1">Manage your academic records and certificates.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-grow md:w-64">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input 
                            type="text" 
                            placeholder="Search documents..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-card border border-input rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                        />
                    </div>
                    {admissionId && (
                        <button 
                            onClick={() => setIsUploadModalOpen(true)}
                            className="px-4 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2 whitespace-nowrap active:scale-95"
                        >
                            <PlusIcon className="w-4 h-4" /> Upload
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['All', ...CATEGORIES].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveFilter(cat)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${activeFilter === cat ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Documents Grid */}
            {filteredDocs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDocs.map(doc => {
                        const file = doc.admission_documents?.[0];
                        const isVerified = doc.status === 'Verified';
                        const isRejected = doc.status === 'Rejected';
                        
                        return (
                            <div key={doc.id} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2.5 rounded-lg ${isVerified ? 'bg-green-100 text-green-600' : isRejected ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'}`}>
                                        <DocumentTextIcon className="w-6 h-6" />
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${isVerified ? 'bg-green-50 text-green-700 border-green-200' : isRejected ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                        {doc.status}
                                    </span>
                                </div>
                                
                                <div className="flex-grow">
                                    <h3 className="font-bold text-foreground text-sm mb-1 line-clamp-2" title={doc.document_name}>{doc.document_name}</h3>
                                    <p className="text-xs text-muted-foreground font-medium">{doc.notes_for_parent || 'General'}</p>
                                    
                                    {isRejected && doc.rejection_reason && (
                                        <div className="mt-3 p-2 bg-red-50 text-red-600 text-xs rounded border border-red-100 italic">
                                            "{doc.rejection_reason}"
                                        </div>
                                    )}

                                    {file && (
                                        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                                            <ClockIcon className="w-3.5 h-3.5"/>
                                            <span>{new Date(file.uploaded_at).toLocaleDateString()}</span>
                                            <span>•</span>
                                            {/* Fix: Added a fallback to 0 to resolve type mismatch with formatSize parameter */}
                                            <span>{formatSize(file.file_size || 0)}</span>
                                        </div>
                                    )}
                                </div>
                                
                                {file ? (
                                    <div className="mt-5 pt-4 border-t border-border flex gap-2">
                                        <button 
                                            onClick={() => handleView(file.storage_path)}
                                            className="flex-1 py-2 rounded-lg bg-muted/50 hover:bg-muted text-xs font-bold text-foreground transition-colors flex items-center justify-center gap-2"
                                        >
                                            <EyeIcon className="w-3.5 h-3.5" /> View
                                        </button>
                                        <button 
                                            onClick={() => handleDownload(file.storage_path, file.file_name)}
                                            className="flex-1 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary transition-colors flex items-center justify-center gap-2"
                                        >
                                            <DownloadIcon className="w-3.5 h-3.5" /> Download
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-5 pt-4 border-t border-border text-center">
                                        <span className="text-xs text-amber-600 font-bold flex items-center justify-center gap-1">
                                            <AlertTriangleIcon className="w-3.5 h-3.5"/> Pending Upload
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 bg-muted/10 border-2 border-dashed border-border rounded-xl">
                    <DocumentTextIcon className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="font-bold text-foreground text-lg">No documents found</p>
                    <p className="text-muted-foreground text-sm mt-1">Upload certificates or academic records to keep them safe.</p>
                    {admissionId && (
                        <button onClick={() => setIsUploadModalOpen(true)} className="mt-6 text-primary font-bold text-sm hover:underline">
                            Upload First Document
                        </button>
                    )}
                </div>
            )}

            {isUploadModalOpen && admissionId && (
                <StudentAddDocumentModal 
                    admissionId={admissionId} 
                    onClose={() => setIsUploadModalOpen(false)} 
                    onSuccess={fetchDocuments} 
                />
            )}
        </div>
    );
};

export default DocumentsTab;
