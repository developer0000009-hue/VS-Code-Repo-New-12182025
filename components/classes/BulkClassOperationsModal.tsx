
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { SchoolClass, SchoolBranch, BulkImportResult } from '../../types';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { FileSpreadsheetIcon } from '../icons/FileSpreadsheetIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { BookIcon } from '../icons/BookIcon';
import { SchoolIcon } from '../icons/SchoolIcon';
import { TeacherIcon } from '../icons/TeacherIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';

export type BulkClassActionType = 'create_classes' | 'assign_teachers' | 'map_subjects' | 'assign_students';

interface BulkClassOperationsModalProps {
    onClose: () => void;
    onSuccess: () => void;
    branchId?: string | null;
    academicYear: string;
}

const parseCSVLine = (line: string): string[] => {
    const pattern = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
    const matches = line.match(pattern) || [];
    return matches.map(m => m.replace(/^"|"$/g, '').trim());
};

const normalizeClassName = (name: string): string => {
    if (!name) return '';
    let processed = name.trim();
    processed = processed.replace(/Grade\s*(\d+)\s*-\s*([A-Z0-9]+)/i, (match, g, s) => { return `Grade ${g} - ${s.toUpperCase()}`; });
    processed = processed.replace(/^(\d+)\s*-\s*([A-Z0-9]+)$/i, (match, g, s) => { return `Grade ${g} - ${s.toUpperCase()}`; });
    return processed;
};

const formatError = (err: any): string => {
    if (!err) return "An unknown error occurred.";
    if (typeof err === 'string') return (err === "[object Object]" || err === "{}") ? "Mapping protocol failed." : err;
    if (typeof err === 'object') {
        let context = "";
        if (err.row || err.row_index) context += `Row ${err.row || err.row_index}: `;
        const message = err.message || err.error_description || err.details?.message || err.details || err.hint;
        if (message && typeof message === 'string' && !message.includes("[object Object]")) return context ? `${context}${message}` : message;
    }
    return "The system could not find the specified record or mapping.";
};

const BulkClassOperationsModal: React.FC<BulkClassOperationsModalProps> = ({ onClose, onSuccess, branchId, academicYear }) => {
    const [step, setStep] = useState<'select' | 'upload' | 'processing' | 'summary'>('select');
    const [action, setAction] = useState<BulkClassActionType | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });
    const [isProcessing, setIsProcessing] = useState(false);
    const [contextError, setContextError] = useState<string | null>(null);

    useEffect(() => { if (action === 'create_classes' && !branchId) setContextError("No branch is selected."); else setContextError(null); }, [action, branchId]);

    const handleDownloadTemplate = () => {
        if (!action) return;
        const templates = { create_classes: "Grade,Section,Class Name,Capacity\n10,A,Grade 10 - A,30", assign_teachers: "Class Name,Teacher Email\nGrade 10 - A,teacher@school.com", map_subjects: "Class Name,Official Subject Code\nGrade 10 - A,CBSE-10-MAT", assign_students: "Student Email,Class Name\nstudent1@school.com,Grade 10 - A" };
        const content = templates[action as keyof typeof templates] || "";
        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${action}_template.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]; setFile(selectedFile);
            const reader = new FileReader();
            reader.onload = (evt) => {
                const text = evt.target?.result as string;
                if (text) {
                    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
                    if (lines.length < 2) { setContextError("The uploaded CSV file is empty."); return; }
                    const data = lines.slice(1).map((line) => {
                        const cols = parseCSVLine(line);
                        if (cols.length === 0 || (cols.length === 1 && !cols[0])) return null;
                        if (action === 'create_classes') return { grade: cols[0]?.trim(), section: cols[1]?.trim(), name: normalizeClassName(cols[2] || `Grade ${cols[0]} - ${cols[1]}`), capacity: parseInt(cols[3]) || 30 };
                        if (action === 'assign_teachers') return { class_name: normalizeClassName(cols[0]), teacher_email: cols[1]?.trim() };
                        if (action === 'map_subjects') return { class_name: normalizeClassName(cols[0]), subject_code: cols[1]?.trim() };
                        if (action === 'assign_students') return { student_email: cols[0]?.trim(), class_name: normalizeClassName(cols[1]) };
                        return null;
                    }).filter(Boolean);
                    setPreviewData(data); setContextError(null);
                }
            };
            reader.readAsText(selectedFile);
        }
    };

    const processBatch = async () => {
        if (contextError || !action || previewData.length === 0) return;
        setIsProcessing(true); setStep('processing'); setProgress(15);
        try {
            const rpcParams: any = {};
            if (action === 'create_classes') { rpcParams.p_classes = previewData; rpcParams.p_branch_id = branchId; rpcParams.p_academic_year = academicYear; }
            else if (action === 'assign_teachers') rpcParams.p_assignments = previewData;
            else if (action === 'assign_students') rpcParams.p_enrollments = previewData;
            else if (action === 'map_subjects') rpcParams.p_mappings = previewData;
            const rpcMap: Record<BulkClassActionType, string> = { create_classes: 'bulk_create_classes', assign_teachers: 'bulk_assign_class_teachers', map_subjects: 'bulk_map_subjects_to_classes', assign_students: 'bulk_enroll_students_to_classes' };
            setProgress(40);
            const { data, error } = await supabase.rpc(rpcMap[action], rpcParams);
            if (error) throw error;
            setProgress(100);
            setResults({ success: data.success_count ?? (data.success || 0), failed: data.failure_count ?? (data.failed || 0), errors: (data.errors || []).map((e: any) => formatError(e)) });
            setTimeout(() => setStep('summary'), 400);
        } catch (err: any) { setResults({ success: 0, failed: previewData.length, errors: [formatError(err)] }); setStep('summary'); } finally { setIsProcessing(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200"><div className="bg-card w-full max-w-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-black/5" onClick={e => e.stopPropagation()}><div className="p-8 border-b border-border bg-muted/10 flex justify-between items-center relative z-20"><div className="flex items-center gap-4"><div className="p-3 bg-primary/10 rounded-xl text-primary shadow-inner"><UploadIcon className="w-6 h-6"/></div><div><h3 className="font-bold text-xl text-foreground tracking-tight">{action ? action.replace('_', ' ').toUpperCase() : 'Bulk Operations'}</h3><p className="text-xs text-muted-foreground font-medium mt-0.5">{step === 'select' ? 'Choose an action' : 'Process step'}</p></div></div>{step !== 'processing' && <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"><XIcon className="w-6 h-6"/></button>}</div><div className="p-8 overflow-y-auto custom-scrollbar flex-grow bg-background">{step === 'select' && (<div className="grid grid-cols-1 md:grid-cols-2 gap-5">{[{ id: 'create_classes', label: 'Create Classes', color: 'bg-blue-500' }, { id: 'assign_teachers', label: 'Assign Teachers', color: 'bg-purple-500' }, { id: 'assign_students', label: 'Enroll Students', color: 'bg-emerald-500' }, { id: 'map_subjects', label: 'Map Subjects', color: 'bg-amber-500' }].map(opt => (<button key={opt.id} onClick={() => { setAction(opt.id as BulkClassActionType); setStep('upload'); }} className="flex flex-col items-center p-6 rounded-2xl border border-border/60 bg-card hover:border-primary/50 hover:bg-muted/30 transition-all group text-center h-full shadow-sm"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform ${opt.color}`}>...</div><h4 className="font-bold text-foreground text-sm">{opt.label}</h4></button>))}</div>)}{step === 'upload' && (<div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">{contextError && (<div className="flex items-center justify-center gap-3 text-red-600 bg-red-500/10 p-4 rounded-xl border border-red-500/20"><AlertTriangleIcon className="w-6 h-6 flex-shrink-0"/><span className="text-sm font-bold">{contextError}</span></div>)}<div className="border-2 border-dashed border-border rounded-3xl p-10 text-center hover:bg-muted/20 transition-colors relative cursor-pointer bg-muted/5"><input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" /><div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4"><UploadIcon className="w-8 h-8" /></div><p className="font-bold text-foreground text-lg">{file ? file.name : `Upload Mapping File`}</p></div><div className="flex justify-between items-center"><button onClick={handleDownloadTemplate} className="text-xs font-bold text-primary hover:underline flex items-center gap-1"><FileSpreadsheetIcon className="w-3.5 h-3.5"/> Template</button>{previewData.length > 0 && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">{previewData.length} records detected</span>}</div></div>)}{step === 'processing' && (<div className="py-16 text-center space-y-8"><div className="relative w-40 h-40 mx-auto"><svg className="w-full h-full" viewBox="0 0 100 100"><circle className="text-muted/20 stroke-current" strokeWidth="6" cx="50" cy="50" r="44" fill="transparent"></circle><circle className="text-primary stroke-current" strokeWidth="6" strokeLinecap="round" cx="50" cy="50" r="44" fill="transparent" strokeDasharray="276.46" strokeDashoffset={276.46 - (276.46 * progress) / 100} transform="rotate(-90 50 50)"></circle></svg><div className="absolute inset-0 flex items-center justify-center"><span className="text-4xl font-black text-foreground">{progress}%</span></div></div><h4 className="text-lg font-bold text-foreground">Mapping Data...</h4></div>)}{step === 'summary' && (<div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 text-center py-6"><div className="grid grid-cols-2 gap-6"><div className="p-6 bg-green-50/5 border border-green-500/20 rounded-2xl flex flex-col items-center justify-center min-h-[140px]"><p className="text-4xl font-black text-green-600 tracking-tight">{results.success}</p><p className="text-xs font-bold text-green-700 uppercase tracking-wider mt-1">Successful</p></div><div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl flex flex-col items-center justify-center min-h-[140px]"><p className="text-4xl font-black text-red-600 tracking-tight">{results.failed}</p><p className="text-xs font-bold text-red-700 uppercase tracking-wider mt-1">Failed</p></div></div>{results.errors.length > 0 && (<div className="text-left bg-muted/30 p-5 rounded-2xl border border-border text-sm max-h-64 overflow-y-auto"><p className="font-bold mb-3 text-foreground flex items-center gap-2"><AlertTriangleIcon className="w-4 h-4 text-amber-600" /> Errors:</p><ul className="space-y-2 text-muted-foreground text-xs font-mono">{results.errors.map((err, idx) => (<li key={idx} className="pb-2 border-b border-border/50 last:border-0 last:pb-0 flex items-start gap-2"><span className="text-red-500 mt-0.5 shrink-0">•</span><span>{err}</span></li>))}</ul></div>)}</div>)}</div><div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">{step === 'upload' && (<><button onClick={() => setStep('select')} className="px-6 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-background">Back</button><button onClick={processBatch} disabled={!file || isProcessing || !!contextError} className="px-8 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg active:scale-95 text-sm">{isProcessing ? <Spinner size="sm"/> : 'Start Mapping'}</button></>)}{step === 'summary' && (<button onClick={() => { onSuccess(); onClose(); }} className="px-10 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg">Complete & Finish</button>)}</div></div></div>
    );
};

export default BulkClassOperationsModal;
