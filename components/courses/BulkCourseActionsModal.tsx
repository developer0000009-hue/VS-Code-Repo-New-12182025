
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { UserProfile } from '../../types';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { FileSpreadsheetIcon } from '../icons/FileSpreadsheetIcon';
import { BookIcon } from '../icons/BookIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';

export type BulkCourseActionType = 'status' | 'assign_teacher' | 'delete' | 'export' | 'import' | 'archive' | 'deactivate' | 'curriculum_upload';

interface BulkCourseActionsModalProps {
    action: BulkCourseActionType;
    selectedIds: number[];
    onClose: () => void;
    onSuccess: () => void;
    branchId?: number | null;
}

interface BulkImportResult {
    success_count: number;
    failure_count: number;
    errors: { row_index: number; title: string; error: string; }[];
}

/**
 * Robust regex-based CSV splitter to handle quoted fields containing commas.
 */
const splitCSVRow = (line: string): string[] => {
    const pattern = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
    const matches = line.match(pattern) || [];
    return matches.map(m => m.replace(/^"|"$/g, '').trim());
};

const BulkCourseActionsModal: React.FC<BulkCourseActionsModalProps> = ({ action, selectedIds, onClose, onSuccess, branchId }) => {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'upload' | 'processing' | 'summary'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [importStats, setImportStats] = useState<BulkImportResult | null>(null);

    const getTitle = () => {
        if (action === 'import') return 'Bulk Import Courses';
        return 'Bulk Action';
    };

    const getIcon = () => {
        if (action === 'import') return <UploadIcon className="w-6 h-6 text-primary" />;
        return <BookIcon className="w-6 h-6 text-primary" />;
    };
    
    const handleDownloadTemplate = () => {
        const headers = ['title', 'code', 'grade_level', 'description', 'category', 'credits', 'department'];
        const exampleRow = ['Intro to Algebra', 'MATH-101', '9', 'Fundamental concepts of algebra.', 'Core', '3', 'Mathematics'];
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + exampleRow.join(',');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', 'course_import_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setImportStats(null);
            
            const reader = new FileReader();
            reader.onload = (evt) => {
                const text = evt.target?.result as string;
                if (text) {
                    const allLines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
                    if (allLines.length < 2) return;

                    // Normalize headers to lowercase and trim to ensure matching
                    const headers = allLines[0].split(',').map(h => h.trim().toLowerCase());
                    const data = allLines.slice(1).map((line, index) => {
                        const values = splitCSVRow(line);
                        const obj: any = { row_index: index + 2 };
                        headers.forEach((header, i) => {
                            if (header) obj[header] = values[i] || null;
                        });
                        return obj;
                    });
                    
                    // Critical: Filter out rows without a title immediately to prevent DB NOT NULL constraint errors
                    setPreviewData(data.filter(row => row.title && row.title.trim().length > 0));
                }
            };
            reader.readAsText(selectedFile);
        }
    };
    
    const handleImport = async () => {
        if (!file || previewData.length === 0) return;
        setStep('processing');
        setLoading(true);
        
        try {
            const { data, error } = await supabase.rpc('bulk_import_courses', { 
                p_courses: previewData,
                p_branch_id: branchId 
            });
            if (error) throw error;
            setImportStats(data);
        } catch (err: any) {
            setImportStats({ 
                success_count: 0, 
                failure_count: previewData.length, 
                errors: [{ error: err.message || "Failed to process records.", row_index: 0, title: 'Import Process Error' }] 
            });
        } finally {
            setLoading(false);
            setStep('summary');
        }
    };

    if (step === 'summary' && importStats) {
         return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in" onClick={onClose}>
                <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-border bg-muted/10 text-center"><h3 className="text-xl font-bold text-foreground">Import Summary</h3></div>
                    <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-muted/50 p-4 rounded-xl text-center border border-border"><p className="text-[10px] font-bold text-muted-foreground uppercase">Total</p><p className="text-3xl font-extrabold text-foreground mt-1">{importStats.success_count + importStats.failure_count}</p></div>
                            <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20 text-center"><p className="text-[10px] font-bold text-green-700 uppercase">Successful</p><p className="text-3xl font-extrabold text-green-600 mt-1">{importStats.success_count}</p></div>
                            <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-center"><p className="text-[10px] font-bold text-red-700 uppercase">Failed</p><p className="text-3xl font-extrabold text-red-600 mt-1">{importStats.failure_count}</p></div>
                        </div>
                        {importStats.errors.length > 0 && (
                            <div className="border border-red-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-red-50 p-3 border-b border-red-100 flex items-center gap-2"><AlertTriangleIcon className="w-4 h-4 text-red-600"/><span className="text-xs font-bold text-red-800 uppercase">Issue Log</span></div>
                                <div className="max-h-60 overflow-y-auto bg-white"><table className="w-full text-left text-xs"><thead className="bg-red-50/50 sticky top-0"><tr className="border-b border-red-100"><th className="p-3 font-semibold text-red-700 w-16">Row</th><th className="p-3 font-semibold text-red-700 w-1/3">Course Title</th><th className="p-3 font-semibold text-red-700">Issue</th></tr></thead><tbody className="divide-y divide-red-100">{importStats.errors.map((err, idx) => (<tr key={idx} className="hover:bg-red-50/30"><td className="p-3 font-mono text-muted-foreground">{err.row_index}</td><td className="p-3 font-medium text-foreground">{err.title}</td><td className="p-3 text-red-600">{err.error}</td></tr>))}</tbody></table></div>
                            </div>
                        )}
                    </div>
                    <div className="p-6 border-t border-border bg-muted/10 flex justify-end"><button onClick={() => { onSuccess(); onClose(); }} className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg">Done</button></div>
                </div>
            </div>
         );
    }
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-card w-full max-w-xl rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border bg-muted/10 flex justify-between items-center">
                    <div className="flex items-center gap-3"><div className="p-2.5 bg-primary/10 rounded-xl text-primary">{getIcon()}</div><div><h3 className="font-bold text-lg leading-tight">{getTitle()}</h3></div></div>
                    <button onClick={onClose}><XIcon className="w-5 h-5 text-muted-foreground"/></button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/30 relative group bg-muted/5 cursor-pointer">
                        <input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3"><UploadIcon className="w-7 h-7" /></div>
                        <p className="font-bold text-foreground text-sm">{file ? file.name : 'Choose CSV File'}</p>
                        <p className="text-xs text-muted-foreground mt-1">Drag and drop or click to browse</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <button onClick={handleDownloadTemplate} className="text-xs font-bold text-primary hover:underline flex items-center gap-1"><FileSpreadsheetIcon className="w-3.5 h-3.5"/> Download Template</button>
                        {previewData.length > 0 && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">{previewData.length} valid rows detected</span>}
                    </div>
                </div>

                <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted">Cancel</button>
                    <button onClick={handleImport} disabled={!file || loading} className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50">
                        {loading ? <Spinner size="sm"/> : 'Start Import'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkCourseActionsModal;
