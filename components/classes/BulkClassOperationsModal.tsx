
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { SchoolBranch, BulkImportResult } from '../../types';
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
    branchId?: number | null;
    academicYear: string;
}

/**
 * Robust CSV parser that handles quoted strings, escaped characters, and whitespace.
 */
const parseCSVLine = (line: string): string[] => {
    // Regex to split by comma but ignore commas inside double quotes
    const pattern = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
    const matches = line.match(pattern) || [];
    return matches.map(m => m.replace(/^"|"$/g, '').trim());
};

/**
 * Normalizes class names to match the system standard "Grade X - Y"
 * e.g. "Grade 1-A" -> "Grade 1 - A"
 */
const normalizeClassName = (name: string): string => {
    if (!name) return '';
    let processed = name.trim();
    // Ensure "Grade X - Y" format (consistent spacing around hyphen)
    processed = processed.replace(/Grade\s*(\d+)\s*-\s*([A-Z0-9]+)/i, (match, g, s) => {
        return `Grade ${g} - ${s.toUpperCase()}`;
    });
    // Fallback for simple "1-A" format
    processed = processed.replace(/^(\d+)\s*-\s*([A-Z0-9]+)$/i, (match, g, s) => {
        return `Grade ${g} - ${s.toUpperCase()}`;
    });
    return processed;
};

/**
 * Enhanced error formatter to provide specific debugging context for bulk failures and prevent [object Object].
 */
const formatError = (err: any): string => {
    if (!err) return "An unknown error occurred.";
    if (typeof err === 'string') {
         return (err === "[object Object]" || err === "{}") ? "Mapping protocol failed." : err;
    }
    
    // Handle specific object structures returned from DB functions
    if (typeof err === 'object') {
        let context = "";
        if (err.row) context += `Row ${err.row}: `;
        if (err.row_index) context += `Row ${err.row_index}: `;
        if (err.subject_code) context += `Subject [${err.subject_code}] `;
        if (err.class_name) context += `Class [${err.class_name}] `;
        if (err.teacher_email) context += `Teacher [${err.teacher_email}] `;
        if (err.student_email) context += `Student [${err.student_email}] `;
        
        const message = err.message || err.error_description || err.details?.message || err.details || err.hint;
        if (message && typeof message === 'string' && !message.includes("[object Object]")) {
            return context ? `${context}${message}` : message;
        }
        
        // If message is an object, try to unpack it
        if (typeof message === 'object' && message?.message && typeof message.message === 'string') {
             return context ? `${context}${message.message}` : message.message;
        }
    }

    try {
        const json = JSON.stringify(err);
        if (json && json !== '{}' && json !== '[]' && !json.includes("[object Object]")) return json;
    } catch { }
    
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

    useEffect(() => {
        if (action === 'create_classes' && !branchId) {
            setContextError("No branch is selected. Please select an active branch context before proceeding.");
        } else {
            setContextError(null);
        }
    }, [action, branchId]);

    // --- Templates ---
    const getTemplate = (type: BulkClassActionType) => {
        switch (type) {
            case 'create_classes':
                return "Grade,Section,Class Name,Capacity\n10,A,Grade 10 - A,30\n10,B,Grade 10 - B,30";
            case 'assign_teachers':
                return "Class Name,Teacher Email\nGrade 10 - A,teacher@school.com\nGrade 10 - B,teacher2@school.com";
            case 'map_subjects':
                return "Class Name,Official Subject Code\nGrade 10 - A,CBSE-10-MAT\nGrade 10 - A,CBSE-10-ENG";
            case 'assign_students':
                return "Student Email,Class Name\nstudent1@school.com,Grade 10 - A\nstudent2@school.com,Grade 10 - B";
            default:
                return "";
        }
    };

    const handleDownloadTemplate = () => {
        if (!action) return;
        const content = getTemplate(action);
        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${action}_template.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            
            const reader = new FileReader();
            reader.onload = (evt) => {
                const text = evt.target?.result as string;
                if (text) {
                    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
                    if (lines.length < 2) {
                        setContextError("The uploaded CSV file is empty or missing required data rows.");
                        return;
                    }

                    // Map rows to JSON based on action with strict whitespace trimming and naming normalization
                    const data = lines.slice(1).map((line) => {
                        const cols = parseCSVLine(line);
                        if (cols.length === 0 || (cols.length === 1 && !cols[0])) return null;

                        if (action === 'create_classes') {
                            return { 
                                grade: cols[0]?.trim(), 
                                section: cols[1]?.trim(), 
                                name: normalizeClassName(cols[2] || `Grade ${cols[0]} - ${cols[1]}`), 
                                capacity: parseInt(cols[3]) || 30 
                            };
                        }
                        if (action === 'assign_teachers') {
                            return { class_name: normalizeClassName(cols[0]), teacher_email: cols[1]?.trim() };
                        }
                        if (action === 'map_subjects') {
                            return { class_name: normalizeClassName(cols[0]), subject_code: cols[1]?.trim() };
                        }
                        if (action === 'assign_students') {
                            return { student_email: cols[0]?.trim(), class_name: normalizeClassName(cols[1]) };
                        }
                        return null;
                    }).filter(Boolean);

                    setPreviewData(data);
                    setContextError(null);
                }
            };
            reader.readAsText(selectedFile);
        }
    };

    const processBatch = async () => {
        if (contextError || !action || previewData.length === 0) return;
        
        setIsProcessing(true);
        setStep('processing');
        setProgress(15);
        setResults({ success: 0, failed: 0, errors: [] });

        try {
            const rpcParams: any = {};
            if (action === 'create_classes') {
                rpcParams.p_classes = previewData;
                rpcParams.p_branch_id = branchId;
                rpcParams.p_academic_year = academicYear;
            } else if (action === 'assign_teachers') {
                rpcParams.p_assignments = previewData;
            } else if (action === 'assign_students') {
                rpcParams.p_enrollments = previewData;
            } else if (action === 'map_subjects') {
                rpcParams.p_mappings = previewData;
            }

            const rpcMap: Record<BulkClassActionType, string> = {
                'create_classes': 'bulk_create_classes',
                'assign_teachers': 'bulk_assign_class_teachers',
                'map_subjects': 'bulk_map_subjects_to_classes',
                'assign_students': 'bulk_enroll_students_to_classes'
            };

            setProgress(40);
            const { data, error } = await supabase.rpc(rpcMap[action], rpcParams);
            
            if (error) throw error;
            
            setProgress(100);
            
            // Map consistent response keys from bulk RPCs, guard against null data
            const success = data?.success_count ?? (data?.success || 0);
            const failed = data?.failure_count ?? (data?.failed || 0);
            const rawErrors = data?.errors || [];

            setResults({
                success,
                failed,
                errors: rawErrors.map((e: any) => formatError(e))
            });
            
            setTimeout(() => setStep('summary'), 400);

        } catch (err: any) {
            console.error("Batch processing error:", err);
            setResults({ 
                success: 0, 
                failed: previewData.length, 
                errors: [formatError(err)] 
            });
            setStep('summary');
        } finally {
            setIsProcessing(false);
        }
    };

    const getTitle = () => {
        switch (action) {
            case 'create_classes': return 'Bulk Create Classes';
            case 'assign_teachers': return 'Bulk Assign Teachers';
            case 'map_subjects': return 'Bulk Map Subjects';
            case 'assign_students': return 'Bulk Enroll Students';
            default: return 'Bulk Operations';
        }
    };

    const getIcon = () => {
        switch (action) {
            case 'create_classes': return <SchoolIcon className="w-6 h-6 text-primary" />;
            case 'assign_teachers': return <TeacherIcon className="w-6 h-6 text-primary" />;
            case 'map_subjects': return <BookIcon className="w-6 h-6 text-primary" />;
            case 'assign_students': return <UsersIcon className="w-6 h-6 text-primary" />;
            default: return <UploadIcon className="w-6 h-6 text-primary" />;
        }
    };
    
    const renderSelectStep = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                    { id: 'create_classes', label: 'Create Classes', desc: 'Add grades and sections', icon: <SchoolIcon className="w-6 h-6"/>, color: 'bg-blue-500' },
                    { id: 'assign_teachers', label: 'Assign Teachers', desc: 'Link faculty to sections', icon: <TeacherIcon className="w-6 h-6"/>, color: 'bg-purple-500' },
                    { id: 'assign_students', label: 'Enroll Students', desc: 'Bulk student rostering', icon: <UsersIcon className="w-6 h-6"/>, color: 'bg-emerald-500' },
                    { id: 'map_subjects', label: 'Map Subjects', desc: 'Link curriculum to classes', icon: <BookIcon className="w-6 h-6"/>, color: 'bg-amber-500' },
                ].map(opt => (
                    <button 
                        key={opt.id}
                        onClick={() => { setAction(opt.id as BulkClassActionType); setStep('upload'); }}
                        className="flex flex-col items-center p-6 rounded-2xl border border-border/60 bg-card hover:border-primary/50 hover:bg-muted/30 transition-all group text-center h-full shadow-sm hover:shadow-md"
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 ${opt.color}`}>
                            {opt.icon}
                        </div>
                        <h4 className="font-bold text-foreground text-sm">{opt.label}</h4>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">{opt.desc}</p>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderUploadStep = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-5 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex items-start gap-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                     <FileSpreadsheetIcon className="w-6 h-6"/>
                </div>
                <div className="flex-grow text-left">
                    <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300">Format Requirements</h4>
                    <p className="text-xs text-blue-700/80 dark:text-blue-400/80 mt-1 mb-3 leading-relaxed">
                        Important: Class Names are auto-normalized to <strong>Grade X - Y</strong>. Ensure your CSV values (e.g. "1-A") correspond to existing grades and sections.
                    </p>
                    <button onClick={handleDownloadTemplate} className="text-xs bg-white dark:bg-black/20 border border-blue-200 dark:border-blue-800/50 px-4 py-2 rounded-lg font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors flex items-center gap-2 shadow-sm">
                        <DownloadIcon className="w-3.5 h-3.5"/> Download CSV Template
                    </button>
                </div>
            </div>

            {contextError && (
                <div className="flex items-center justify-center gap-3 text-red-600 bg-red-500/10 p-4 rounded-xl border border-red-500/20 animate-in fade-in">
                    <AlertTriangleIcon className="w-6 h-6 flex-shrink-0"/>
                    <span className="text-sm font-bold">{contextError}</span>
                </div>
            )}

            <div className="border-2 border-dashed border-border rounded-3xl p-10 text-center hover:bg-muted/20 transition-colors relative group cursor-pointer bg-muted/5">
                <input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/10">
                    <UploadIcon className="w-8 h-8" />
                </div>
                <p className="font-bold text-foreground text-lg">
                    {file ? file.name : `Upload Mapping File`}
                </p>
                <p className="text-sm text-muted-foreground mt-1 font-medium">{file ? `${(file.size / 1024).toFixed(1)} KB • Ready` : 'Click to select or drop CSV'}</p>
            </div>
            
            {previewData.length > 0 && (
                 <div className="flex items-center justify-center gap-2 text-green-600 bg-green-500/10 py-2 rounded-lg border border-green-500/20 animate-in fade-in slide-in-from-bottom-2">
                     <CheckCircleIcon className="w-4 h-4"/>
                     <span className="text-xs font-bold">{previewData.length} valid records detected</span>
                 </div>
            )}
        </div>
    );

    const renderSummaryStep = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 text-center py-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-2xl flex flex-col items-center justify-center min-h-[140px]">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 mb-3 flex items-center justify-center">
                        <CheckCircleIcon className="w-6 h-6"/>
                    </div>
                    <p className="text-4xl font-black text-green-600 dark:text-green-400 tracking-tight">{results.success}</p>
                    <p className="text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider mt-1">Successful</p>
                </div>
                <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl flex flex-col items-center justify-center min-h-[140px]">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 mb-3 flex items-center justify-center">
                        <AlertTriangleIcon className="w-6 h-6"/>
                    </div>
                    <p className="text-4xl font-black text-red-600 dark:text-red-400 tracking-tight">{results.failed}</p>
                    <p className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wider mt-1">Failed</p>
                </div>
            </div>

            {results.errors.length > 0 ? (
                <div className="text-left bg-muted/30 p-5 rounded-2xl border border-border text-sm max-h-64 overflow-y-auto custom-scrollbar">
                    <p className="font-bold mb-3 text-foreground flex items-center gap-2">
                        <AlertTriangleIcon className="w-4 h-4 text-amber-600" />
                        Detailed Error Log:
                    </p>
                    <ul className="space-y-2 text-muted-foreground text-xs font-mono">
                        {results.errors.map((err, idx) => (
                            <li key={idx} className="pb-2 border-b border-border/50 last:border-0 last:pb-0 flex items-start gap-2">
                                <span className="text-red-500 mt-0.5 shrink-0">•</span> 
                                <span>{err}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : results.success > 0 ? (
                <div className="text-center p-8 bg-green-500/5 rounded-2xl border border-green-500/10">
                    <CheckCircleIcon className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p className="font-bold text-green-700 dark:text-green-400 text-lg">Bulk Operation Completed</p>
                </div>
            ) : null}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-black/5" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b border-border bg-muted/10 flex justify-between items-center relative z-20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary shadow-inner">
                             {action ? getIcon() : <UploadIcon className="w-6 h-6"/>}
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-foreground tracking-tight">{action ? getTitle() : 'Institutional Tools'}</h3>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                {step === 'select' ? 'Choose an action' : step === 'upload' ? 'Upload data source' : step === 'processing' ? 'Running batch...' : 'Operation Summary'}
                            </p>
                        </div>
                    </div>
                    {step !== 'processing' && <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"><XIcon className="w-6 h-6"/></button>}
                </div>
                <div className="p-8 overflow-y-auto custom-scrollbar flex-grow bg-background">
                    {step === 'select' && renderSelectStep()}
                    {step === 'upload' && renderUploadStep()}
                    {step === 'processing' && (
                        <div className="py-16 text-center space-y-8">
                            <div className="relative w-40 h-40 mx-auto">
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                    <circle className="text-muted/20 stroke-current" strokeWidth="6" cx="50" cy="50" r="44" fill="transparent"></circle>
                                    <circle className="text-primary stroke-current transition-all duration-300" strokeWidth="6" strokeLinecap="round" cx="50" cy="50" r="44" fill="transparent" strokeDasharray="276.46" strokeDashoffset={276.46 - (276.46 * progress) / 100} transform="rotate(-90 50 50)"></circle>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-4xl font-black text-foreground">{progress}%</span>
                                </div>
                            </div>
                            <h4 className="text-lg font-bold text-foreground">Mapping Data...</h4>
                        </div>
                    )}
                    {step === 'summary' && renderSummaryStep()}
                </div>
                <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">
                    {step === 'upload' && (
                        <>
                            <button onClick={() => { setStep('select'); setFile(null); setPreviewData([]); setAction(null); }} className="px-6 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-background transition-colors border border-transparent hover:border-border">Back</button>
                            <button onClick={processBatch} disabled={!file || isProcessing || !!contextError} className="px-8 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 text-sm">{isProcessing ? <Spinner size="sm"/> : 'Start Mapping'}</button>
                        </>
                    )}
                    {step === 'summary' && (
                        <button onClick={() => { onSuccess(); onClose(); }} className="px-10 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all active:scale-95">Complete & Finish</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkClassOperationsModal;
