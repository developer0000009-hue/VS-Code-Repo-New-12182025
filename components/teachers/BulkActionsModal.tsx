
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { SchoolBranch, BulkImportResult } from '../../types';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { TransferIcon } from '../icons/TransferIcon';
import { BriefcaseIcon } from '../icons/BriefcaseIcon';
import { BookIcon } from '../icons/BookIcon';
import { FileSpreadsheetIcon } from '../icons/FileSpreadsheetIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { CommunicationIcon } from '../icons/CommunicationIcon';
import { MegaphoneIcon } from '../icons/MegaphoneIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { PlusIcon } from '../icons/PlusIcon';

export type BulkActionType = 'status' | 'department' | 'subject' | 'transfer' | 'import' | 'message';

interface BulkActionsModalProps {
    action: BulkActionType;
    selectedIds: string[]; // Teacher IDs
    onClose: () => void;
    onSuccess: () => void;
    branchId: number | null;
}

// Standard validation for early feedback
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Normalizes values extracted from CSV.
 * Handles Excel's scientific notation and strips invisible control characters.
 */
const normalizeCSVValue = (val: string): string => {
    if (!val) return "";
    let clean = val.trim().replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove hidden markers
    
    // Detect and fix Excel scientific notation (e.g. 9.1E+10 for phone numbers)
    if (/^[0-9.]+[eE]\+\d+$/.test(clean)) {
        try {
            return BigInt(Math.round(Number(clean))).toString();
        } catch (e) {
            return clean;
        }
    }
    return clean;
};

/**
 * Robust CSV row splitter that handles quoted strings and internal commas.
 */
const splitCSVRow = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i+1] === '"') { // Handle escaped quotes ""
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(normalizeCSVValue(current));
            current = "";
        } else {
            current += char;
        }
    }
    result.push(normalizeCSVValue(current));
    return result;
};

const BulkActionsModal: React.FC<BulkActionsModalProps> = ({ action, selectedIds, onClose, onSuccess, branchId }) => {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'config' | 'processing' | 'summary'>('config');
    const [value, setValue] = useState('');
    const [branches, setBranches] = useState<SchoolBranch[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [importStats, setImportStats] = useState<{
        success_count: number;
        failure_count: number;
        errors: { row: number; name: string; issue: string }[];
    } | null>(null);
    const [previewCount, setPreviewCount] = useState(0);

    useEffect(() => {
        if (action === 'transfer') {
            const fetchBranches = async () => {
                const { data } = await supabase.rpc('get_school_branches');
                if (data) setBranches(data);
            };
            fetchBranches();
        }
    }, [action]);

    const processBatch = async () => {
        if (action === 'import') {
            await handleImport();
            return;
        }

        setLoading(true);
        try {
            let updates: any = {};
            if (action === 'status') updates.employment_status = value;
            if (action === 'department') updates.department = value;
            if (action === 'subject') updates.subject = value;
            if (action === 'transfer') updates.branch_id = value;

            const { error } = await supabase.rpc('bulk_update_teacher_profiles', {
                p_teacher_ids: selectedIds,
                p_updates: updates
            });

            if (error) throw error;
            onSuccess();
            onClose();
        } catch (err: any) {
            alert(`Bulk update failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    const handleImport = async () => {
        if (!file) return;
        setStep('processing');
        setLoading(true);
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            if (!text) { setLoading(false); setStep('config'); return; }
            
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            if (lines.length < 2) {
                alert("The CSV file must contain a header row and at least one data row.");
                setLoading(false);
                setStep('config');
                return;
            }

            const dataRows = lines.slice(1);
            const records: any[] = [];
            const localErrors: any[] = [];

            dataRows.forEach((line, index) => {
                const cols = splitCSVRow(line);
                const rowNum = index + 2;

                // Expected CSV: Full Name, Email, Phone, Department, Designation, Status, Subject, Exp
                const [name, email, phone, dept, desig, status, subject, exp] = cols;

                if (!name || !email) {
                    localErrors.push({ row: rowNum, name: name || 'N/A', issue: 'Missing required field (Name or Email)' });
                    return;
                }
                
                if (!EMAIL_REGEX.test(email)) {
                    localErrors.push({ row: rowNum, name: name, issue: `Malformed email: ${email}` });
                    return;
                }

                records.push({
                    row_index: rowNum, 
                    display_name: name,
                    email: email,
                    phone: phone || null,
                    department: dept || null,
                    designation: desig || 'Teacher',
                    subject: subject || null,
                    experience_years: exp && !isNaN(parseInt(exp)) ? parseInt(exp) : null,
                    employment_status: status || 'Active'
                });
            });

            try {
                 const { data, error } = await supabase.rpc('bulk_import_teachers', { 
                    p_records: records,
                    p_branch_id: branchId
                 });
                 
                 if (error) throw error;
                 
                 // Guard against null data from RPC
                 const dataObj = data || { success_count: 0, failure_count: 0, errors: [] };
                 
                 // Map server errors robustly, handling multiple possible key names (error, message, issue)
                 const serverErrors = (dataObj.errors || []).map((err: any) => ({
                     row: err.row || err.row_index || 0,
                     name: err.name || err.display_name || 'Teacher',
                     issue: err.error || err.message || err.issue || 'Database constraint violation'
                 }));

                 const allErrors = [...localErrors, ...serverErrors].sort((a, b) => a.row - b.row);
                 
                 setImportStats({
                     success_count: dataObj.success_count || 0,
                     failure_count: (dataObj.failure_count || 0) + localErrors.length,
                     errors: allErrors
                 });
                 
                 setStep('summary');
            } catch (err: any) {
                console.error("Import RPC failed:", err);
                alert(`Import failed: ${err.message || "An unexpected error occurred during processing."}`);
                setStep('config');
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setImportStats(null);
            
            // Simple preview to verify row count
            const reader = new FileReader();
            reader.onload = (evt) => {
                const text = evt.target?.result as string;
                if (text) {
                    const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
                    setPreviewCount(Math.max(0, lines.length - 1));
                }
            };
            reader.readAsText(selectedFile);
        }
    };

    const handleDownloadTemplate = () => {
        const headers = "Full Name,Email,Phone,Department,Designation,Status,Subject,Experience(Yrs)";
        const example = "\nJohn Doe,john.doe@school.com,919876543210,Mathematics,Senior Teacher,Active,Algebra,8";
        const csvContent = "data:text/csv;charset=utf-8," + headers + example;
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", "teacher_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-6 border-b border-border bg-muted/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                             {action === 'import' ? <FileSpreadsheetIcon className="w-6 h-6"/> : getIcon(action)}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">
                                {action === 'import' ? 'Import Faculty Directory' : 'Bulk Action'}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {step === 'summary' ? 'Operation finalized' : 'Please configure the batch details'}
                            </p>
                        </div>
                    </div>
                    {step !== 'processing' && (
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                            <XIcon className="w-5 h-5"/>
                        </button>
                    )}
                </div>
                
                {/* Body Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-grow bg-background/50">
                    
                    {step === 'config' && action === 'import' && (
                        <div className="space-y-6">
                            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-start gap-4">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                                     <DownloadIcon className="w-5 h-5"/>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300">Requirement Checklist</h4>
                                    <p className="text-xs text-blue-700/80 dark:text-blue-400/80 mt-1 leading-relaxed">
                                        Use our standard template for best results. Mandatory fields: <strong>Full Name</strong> and <strong>Email</strong>. Existing emails will be updated.
                                    </p>
                                    <button onClick={handleDownloadTemplate} className="mt-3 text-xs font-bold text-blue-600 hover:underline">Download Template (.csv)</button>
                                </div>
                            </div>

                            <div className="border-2 border-dashed border-border rounded-2xl p-10 text-center hover:bg-muted/30 transition-colors cursor-pointer relative group">
                                <input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-primary/10">
                                    <UploadIcon className="w-8 h-8" />
                                </div>
                                <p className="font-bold text-foreground text-lg">{file ? file.name : 'Select CSV Source'}</p>
                                <p className="text-sm text-muted-foreground mt-1">{file ? `${(file.size / 1024).toFixed(1)} KB • Ready` : 'Click to select or drop file here'}</p>
                            </div>
                            
                            {previewCount > 0 && (
                                <div className="flex items-center justify-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in slide-in-from-top-2">
                                    <CheckCircleIcon className="w-4 h-4 text-emerald-600"/>
                                    <span className="text-xs font-bold text-emerald-700">{previewCount} faculty records detected in file.</span>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="py-16 text-center space-y-6">
                            <Spinner size="lg" className="text-primary mx-auto" />
                            <div className="animate-pulse">
                                <h4 className="text-lg font-bold text-foreground tracking-tight">Syncing Data with Secure Server</h4>
                                <p className="text-sm text-muted-foreground mt-1 italic">Building faculty profiles and configuring access...</p>
                            </div>
                        </div>
                    )}

                    {step === 'summary' && importStats && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-card border border-border p-4 rounded-xl text-center shadow-sm">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Rows</p>
                                    <p className="text-2xl font-black text-foreground mt-1">{importStats.success_count + importStats.failure_count}</p>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl text-center shadow-sm">
                                    <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Successful</p>
                                    <p className="text-2xl font-black text-emerald-600 mt-1">{importStats.success_count}</p>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-4 rounded-xl text-center shadow-sm">
                                    <p className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Failed</p>
                                    <p className="text-2xl font-black text-red-600 mt-1">{importStats.failure_count}</p>
                                </div>
                            </div>

                            {importStats.errors.length > 0 ? (
                                <div className="border border-border rounded-2xl overflow-hidden shadow-lg bg-card">
                                    <div className="bg-muted/50 p-3 border-b border-border flex items-center gap-2">
                                        <AlertTriangleIcon className="w-4 h-4 text-amber-500"/>
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Detailed Error Report</span>
                                    </div>
                                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-muted/30 sticky top-0 z-10">
                                                <tr className="border-b border-border">
                                                    <th className="p-3 font-bold text-muted-foreground w-16">Row</th>
                                                    <th className="p-3 font-bold text-muted-foreground w-1/3">Identifier</th>
                                                    <th className="p-3 font-bold text-muted-foreground">Failure Reason</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/40">
                                                {importStats.errors.map((err, idx) => (
                                                    <tr key={idx} className="hover:bg-muted/20 group transition-colors">
                                                        <td className="p-3 font-mono text-muted-foreground group-hover:text-foreground">{err.row}</td>
                                                        <td className="p-3 font-bold text-foreground/80 truncate" title={err.name}>{err.name}</td>
                                                        <td className="p-3 text-red-600 font-semibold leading-relaxed">{err.issue}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-12 text-center bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                                    <CheckCircleIcon className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                                    <h4 className="text-lg font-bold text-emerald-700">Import Perfected!</h4>
                                    <p className="text-sm text-emerald-600/80">All records were successfully imported and access portals initialized.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">
                    {step === 'config' && (
                        <>
                            <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all">
                                Cancel
                            </button>
                            <button 
                                onClick={handleImport} 
                                disabled={!file || loading}
                                className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <Spinner size="sm" className="text-current"/> : 'Start Import Process'}
                            </button>
                        </>
                    )}
                    
                    {step === 'summary' && (
                        <button onClick={() => { onSuccess(); onClose(); }} className="px-10 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all active:scale-95">
                            Close & Refresh List
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper for dynamic icon retrieval
const getIcon = (type: string) => {
    switch (type) {
        case 'status': return <CheckCircleIcon className="w-6 h-6" />;
        case 'department': return <BriefcaseIcon className="w-6 h-6" />;
        case 'subject': return <BookIcon className="w-6 h-6" />;
        case 'transfer': return <TransferIcon className="w-6 h-6" />;
        case 'message': return <CommunicationIcon className="w-6 h-6" />;
        default: return <PlusIcon className="w-6 h-6" />;
    }
};

export default BulkActionsModal;
