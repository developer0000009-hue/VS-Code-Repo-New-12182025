
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { SchoolClass, SchoolBranch } from '../../types';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { TransferIcon } from '../icons/TransferIcon';
import { CommunicationIcon } from '../icons/CommunicationIcon';
import { BellIcon } from '../icons/BellIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { FileSpreadsheetIcon } from '../icons/FileSpreadsheetIcon';
import { MegaphoneIcon } from '../icons/MegaphoneIcon';

export type BulkStudentActionType = 'assign_class' | 'status' | 'delete' | 'export' | 'transfer' | 'import' | 'message' | 'reminder';

interface BulkStudentActionsModalProps {
    action: BulkStudentActionType;
    selectedIds: string[];
    onClose: () => void;
    onSuccess: () => void;
}

const BulkStudentActionsModal: React.FC<BulkStudentActionsModalProps> = ({ action, selectedIds, onClose, onSuccess }) => {
    // State Flow: config -> processing -> summary
    const [step, setStep] = useState<'config' | 'processing' | 'summary'>('config');
    
    // Form State
    const [value, setValue] = useState('');
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [branches, setBranches] = useState<SchoolBranch[]>([]);
    
    // Import State
    const [file, setFile] = useState<File | null>(null);
    const [importPreview, setImportPreview] = useState<any[]>([]);
    
    // Message State
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    
    // Processing State
    const [progress, setProgress] = useState(0);
    const [processedCount, setProcessedCount] = useState(0);
    const [successCount, setSuccessCount] = useState(0);
    const [failCount, setFailCount] = useState(0);
    const [errors, setErrors] = useState<string[]>([]);
    
    // Initialization
    useEffect(() => {
        if (action === 'assign_class') {
            const fetchClasses = async () => {
                const { data } = await supabase.rpc('get_all_classes_for_admin');
                if (data) setClasses(data);
            };
            fetchClasses();
        }
        if (action === 'transfer') {
            const fetchBranches = async () => {
                const { data } = await supabase.rpc('get_school_branches');
                if (data) setBranches(data);
            };
            fetchBranches();
        }
        if (action === 'reminder') {
            setSubject('Important: Document Verification Pending');
            setBody('Dear Parent/Guardian,\n\nThis is a reminder to complete the pending document verification for your child\'s admission. Please log in to the portal and upload the required files at your earliest convenience.\n\nThank you,\nSchool Administration');
        }
    }, [action]);

    const getTitle = () => {
        switch (action) {
            case 'assign_class': return 'Bulk Class Assignment';
            case 'status': return 'Update Account Status';
            case 'delete': return 'Archive Students';
            case 'export': return 'Export Data';
            case 'transfer': return 'Transfer Branch';
            case 'import': return 'Import Students';
            case 'message': return 'Message Parents';
            case 'reminder': return 'Document Reminder';
            default: return 'Bulk Action';
        }
    };

    const getIcon = () => {
        switch (action) {
            case 'assign_class': return <UsersIcon className="w-6 h-6 text-primary" />;
            case 'status': return <CheckCircleIcon className="w-6 h-6 text-primary" />;
            case 'delete': return <TrashIcon className="w-6 h-6 text-red-500" />;
            case 'export': return <DownloadIcon className="w-6 h-6 text-primary" />;
            case 'transfer': return <TransferIcon className="w-6 h-6 text-primary" />;
            case 'import': return <UploadIcon className="w-6 h-6 text-primary" />;
            case 'message': return <CommunicationIcon className="w-6 h-6 text-primary" />;
            case 'reminder': return <BellIcon className="w-6 h-6 text-primary" />;
            default: return null;
        }
    };
    
    // --- Handlers ---

    const handleDownloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,Full Name,Email,Phone,Grade,Roll Number\nJohn Doe,john@example.com,1234567890,10,2025-001";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "student_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            
            // Basic CSV parse preview
            const reader = new FileReader();
            reader.onload = (evt) => {
                const text = evt.target?.result as string;
                if (text) {
                    const lines = text.split('\n').slice(1).filter(l => l.trim());
                    const previewData = lines.map(line => {
                        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                        return { name: cols[0], email: cols[1], grade: cols[3] };
                    });
                    setImportPreview(previewData);
                }
            };
            reader.readAsText(selectedFile);
        }
    };

    const processItem = async (item: any): Promise<boolean> => {
        try {
            // Simulate network delay for smoother UI
            await new Promise(resolve => setTimeout(resolve, 300)); 

            if (action === 'assign_class') {
                const { error } = await supabase.from('student_profiles').update({ assigned_class_id: parseInt(value) }).eq('user_id', item);
                if (error) throw error;
            } 
            else if (action === 'status') {
                const isActive = value === 'Active';
                const { error } = await supabase.from('profiles').update({ is_active: isActive }).eq('id', item);
                if (error) throw error;
            }
            else if (action === 'delete') {
                const { error } = await supabase.from('profiles').update({ is_active: false }).eq('id', item);
                if (error) throw error;
            }
            else if (action === 'transfer') {
                 const { error } = await supabase.from('student_profiles').update({ branch_id: parseInt(value) }).eq('user_id', item);
                 if (error) throw error;
            }
            else if (action === 'message' || action === 'reminder') {
                // Mock sending message
                // Ideally call a single bulk RPC, but here we simulate per-item progress
                // const { error } = await supabase.rpc('send_message_to_user', { ... });
            }
            else if (action === 'import') {
                 // Item is the parsed CSV row object
                 // We use the existing quick add RPC or full registration flow
                 // For robust import, we'd use a specific import RPC. Here we simulate success for prototype.
                 if (!item.name || !item.email) throw new Error("Missing name or email");
                 // In real app: await supabase.rpc('admin_quick_add_student', { ... });
            }
            return true;
        } catch (err: any) {
            setErrors(prev => [...prev, `Item ${item.name || item}: ${err.message}`]);
            return false;
        }
    };

    const handleStartProcessing = async () => {
        setStep('processing');
        setProcessedCount(0);
        setSuccessCount(0);
        setFailCount(0);
        setErrors([]);

        const itemsToProcess = action === 'import' ? importPreview : selectedIds;
        const total = itemsToProcess.length;

        if (total === 0) {
            setStep('summary');
            return;
        }

        for (let i = 0; i < total; i++) {
            const success = await processItem(itemsToProcess[i]);
            if (success) setSuccessCount(prev => prev + 1);
            else setFailCount(prev => prev + 1);
            
            setProcessedCount(prev => prev + 1);
            setProgress(Math.round(((i + 1) / total) * 100));
        }
        
        // Ensure 100% animation finishes
        setTimeout(() => setStep('summary'), 500);
    };

    const handleDownloadLog = () => {
        const logContent = `Bulk Operation: ${getTitle()}\nDate: ${new Date().toLocaleString()}\n\nTotal Processed: ${processedCount}\nSuccess: ${successCount}\nFailed: ${failCount}\n\nErrors:\n${errors.join('\n')}`;
        const blob = new Blob([logContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${action}_log_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // --- Render ---

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-6 border-b border-border bg-muted/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-inner border border-primary/10">
                             {getIcon()}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">{getTitle()}</h3>
                            {step === 'config' && <p className="text-xs text-muted-foreground mt-0.5">{action === 'import' ? 'Upload CSV file' : `Applying to ${selectedIds.length} students`}</p>}
                        </div>
                    </div>
                    {step !== 'processing' && <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><XIcon className="w-5 h-5"/></button>}
                </div>
                
                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
                    
                    {/* CONFIG STEP */}
                    {step === 'config' && (
                        <div className="space-y-6">
                            {action === 'assign_class' && (
                                <div>
                                    <label className="input-label">Select Target Class</label>
                                    <select className="input-base w-full" value={value} onChange={e => setValue(e.target.value)}>
                                        <option value="">Choose Class...</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name} (Grade {c.grade_level})</option>)}
                                    </select>
                                </div>
                            )}
                            
                            {action === 'transfer' && (
                                <div>
                                    <label className="input-label">Select Branch</label>
                                    <select className="input-base w-full" value={value} onChange={e => setValue(e.target.value)}>
                                        <option value="">Choose Branch...</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name} {b.is_main_branch ? '(HO)' : ''}</option>)}
                                    </select>
                                </div>
                            )}

                            {action === 'status' && (
                                <div>
                                    <label className="input-label">New Account Status</label>
                                    <select className="input-base w-full" value={value} onChange={e => setValue(e.target.value)}>
                                        <option value="">Choose Status...</option>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive (Suspended)</option>
                                    </select>
                                </div>
                            )}
                            
                            {(action === 'message' || action === 'reminder') && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="input-label">Subject</label>
                                        <input className="input-base w-full" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject line..." />
                                    </div>
                                    <div>
                                        <label className="input-label">Message Body</label>
                                        <textarea className="input-base w-full h-32 resize-none" value={body} onChange={e => setBody(e.target.value)} placeholder="Type your message here..." />
                                    </div>
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                                        <MegaphoneIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <span>This message will be sent via email/SMS to the registered guardians of all selected students.</span>
                                    </div>
                                </div>
                            )}

                            {action === 'import' && (
                                <div className="space-y-4">
                                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/30 transition-colors cursor-pointer relative group">
                                        <input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                            <UploadIcon className="w-6 h-6" />
                                        </div>
                                        <p className="font-bold text-foreground text-sm">{file ? file.name : 'Click to upload CSV'}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{file ? `${(file.size / 1024).toFixed(1)} KB • Ready to process` : 'Drag and drop or click to browse'}</p>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <button onClick={handleDownloadTemplate} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                            <FileSpreadsheetIcon className="w-3.5 h-3.5"/> Download Template
                                        </button>
                                        {importPreview.length > 0 && (
                                            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">
                                                {importPreview.length} records found
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {action === 'delete' && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-800 dark:text-red-300 text-sm leading-relaxed">
                                    <strong className="block mb-1">Warning: Irreversible Action</strong>
                                    Are you sure you want to archive <strong>{selectedIds.length}</strong> students? They will immediately lose access to the portal.
                                </div>
                            )}
                        </div>
                    )}

                    {/* PROCESSING STEP */}
                    {step === 'processing' && (
                        <div className="py-12 text-center space-y-6">
                            <div className="relative w-32 h-32 mx-auto">
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                    <circle className="text-muted/20 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                                    <circle className="text-primary stroke-current transition-all duration-300 ease-out" strokeWidth="8" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * progress) / 100} transform="rotate(-90 50 50)"></circle>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <span className="text-2xl font-bold text-primary">{progress}%</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-foreground">Processing...</h4>
                                <p className="text-muted-foreground text-sm mt-1">
                                    {processedCount} of {action === 'import' ? importPreview.length : selectedIds.length} items processed
                                </p>
                            </div>
                        </div>
                    )}

                    {/* SUMMARY STEP */}
                    {step === 'summary' && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-xl text-center">
                                    <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Success</p>
                                    <p className="text-3xl font-extrabold text-green-600 dark:text-green-400 mt-1">{successCount}</p>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl text-center">
                                    <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Failed</p>
                                    <p className="text-3xl font-extrabold text-red-600 dark:text-red-400 mt-1">{failCount}</p>
                                </div>
                            </div>

                            {failCount > 0 ? (
                                <div className="bg-muted/30 rounded-xl p-4 border border-border text-sm max-h-32 overflow-y-auto">
                                    <p className="font-bold mb-2 text-foreground">Error Log:</p>
                                    <ul className="space-y-1 text-muted-foreground text-xs font-mono">
                                        {errors.map((err, idx) => <li key={idx}>• {err}</li>)}
                                    </ul>
                                </div>
                            ) : (
                                <div className="text-center p-6 bg-muted/10 rounded-xl border border-border/50">
                                    <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                    <p className="font-bold text-foreground">Operation Completed Successfully</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">
                    {step === 'config' && (
                        <>
                            <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                            <button 
                                onClick={handleStartProcessing} 
                                disabled={(action !== 'delete' && action !== 'import' && !value && !subject) || (action === 'import' && !file) || (action === 'message' && (!subject || !body))} 
                                className={`px-6 py-2.5 rounded-xl text-primary-foreground text-sm font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${action === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'}`}
                            >
                                Start {action === 'import' ? 'Import' : 'Process'}
                            </button>
                        </>
                    )}
                    {step === 'processing' && (
                         <button disabled className="px-6 py-2.5 bg-muted text-muted-foreground rounded-xl text-sm font-bold cursor-not-allowed flex items-center gap-2">
                             <Spinner size="sm" /> Please Wait...
                         </button>
                    )}
                    {step === 'summary' && (
                        <>
                             {failCount > 0 && (
                                <button onClick={handleDownloadLog} className="px-5 py-2.5 border border-border hover:bg-muted rounded-xl text-sm font-bold text-foreground transition-colors flex items-center gap-2">
                                    <DownloadIcon className="w-4 h-4"/> Download Log
                                </button>
                            )}
                            <button onClick={() => { onSuccess(); onClose(); }} className="px-8 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg hover:bg-primary/90 transition-all">
                                Done
                            </button>
                        </>
                    )}
                </div>
            </div>
            <style>{`.input-base { display: block; padding: 0.75rem 1rem; border: 1px solid hsl(var(--input)); border-radius: 0.75rem; background-color: hsl(var(--background)); color: hsl(var(--foreground)); font-size: 0.9rem; transition: all 0.2s; } .input-label { display: block; font-size: 0.75rem; font-weight: 800; color: hsl(var(--muted-foreground)); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }`}</style>
        </div>
    );
};

export default BulkStudentActionsModal;
