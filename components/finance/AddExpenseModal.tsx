import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase, formatError } from '../../services/supabase';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { BriefcaseIcon } from '../icons/BriefcaseIcon';
import { DollarSignIcon } from '../icons/DollarSignIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { SchoolIcon } from '../icons/SchoolIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { RefreshIcon } from '../icons/RefreshIcon';
import { SearchIcon } from '../icons/SearchIcon';
import { SchoolBranch } from '../../types';
import CustomSelect from '../common/CustomSelect';
import { motion, AnimatePresence } from 'framer-motion';

const EXPENSE_CATEGORIES = [
    'Salaries', 'Utilities', 'Transport', 'Lab & Supplies', 'Maintenance', 'Events', 'Marketing', 'Administrative', 'Other'
];

interface AddExpenseModalProps {
    onClose: () => void;
    onSave: () => void;
    branchId: number | null;
    branches?: SchoolBranch[];
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ onClose, onSave, branchId, branches: initialBranches = [] }) => {
    const [formData, setFormData] = useState({
        category: 'Utilities',
        amount: '',
        vendor_name: '',
        expense_date: new Date().toISOString().split('T')[0],
        description: '',
        payment_mode: 'Online Transfer',
    });
    
    const [internalBranchId, setInternalBranchId] = useState<string>(branchId?.toString() || '');
    const [localBranches, setLocalBranches] = useState<SchoolBranch[]>(initialBranches);
    const [loadingBranches, setLoadingBranches] = useState(false);
    
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchBranches = useCallback(async () => {
        setLoadingBranches(true);
        try {
            const { data, error } = await supabase.rpc('get_school_branches');
            if (!error && data) setLocalBranches(data);
        } finally {
            setLoadingBranches(false);
        }
    }, []);

    useEffect(() => {
        if (branchId === null && localBranches.length === 0) {
            fetchBranches();
        }
    }, [branchId, localBranches.length, fetchBranches]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const sizeLimit = 10 * 1024 * 1024;
            if (file.size > sizeLimit) {
                alert("Magnitude exceeds limits. Max 10MB.");
                return;
            }
            setInvoiceFile(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        let invoiceUrl: string | null = null;
        
        try {
            const effectiveBranchId = branchId || (internalBranchId ? parseInt(internalBranchId) : null);

            if (effectiveBranchId === null || isNaN(effectiveBranchId)) {
                throw new Error("Target Institutional Node is required.");
            }

            const numericAmount = parseFloat(formData.amount);
            if (isNaN(numericAmount) || numericAmount <= 0) {
                throw new Error("Please enter a valid amount.");
            }

            if (invoiceFile) {
                const filePath = `expense_vault/${Date.now()}_${invoiceFile.name}`;
                const { error: uploadError } = await supabase.storage.from('guardian-documents').upload(filePath, invoiceFile);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('guardian-documents').getPublicUrl(filePath);
                invoiceUrl = publicUrl;
            }
            
            const { error: insertError } = await supabase.from('school_expenses').insert({
                branch_id: effectiveBranchId,
                category: formData.category,
                amount: numericAmount,
                vendor_name: formData.vendor_name || 'CENTRAL_SUPPLY_NODE',
                expense_date: formData.expense_date,
                description: formData.description,
                payment_mode: formData.payment_mode,
                invoice_url: invoiceUrl,
                status: 'Approved'
            });
            
            if (insertError) throw insertError;
            
            onSave();
            onClose();
        } catch (err: any) {
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    const showBranchSelector = branchId === null || branchId === undefined;

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-500" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-[#0c0d12] w-full max-w-2xl rounded-[3.5rem] shadow-[0_80px_160px_-24px_rgba(0,0,0,1)] border border-white/10 flex flex-col overflow-hidden max-h-[95vh] ring-1 ring-white/10" 
                onClick={e => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <header className="p-10 border-b border-white/5 bg-white/[0.02] flex justify-between items-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none"></div>
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="p-4 bg-primary/10 rounded-2xl text-primary shadow-inner border border-primary/20 group-hover:rotate-6 transition-transform duration-700 ring-4 ring-primary/5">
                                <BriefcaseIcon className="w-8 h-8"/>
                            </div>
                            <div>
                                <h3 className="text-3xl font-serif font-black text-white uppercase tracking-tight leading-none">Record Expense</h3>
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mt-2">Institutional Artifact Archive</p>
                            </div>
                        </div>
                        <button type="button" onClick={onClose} className="p-3 rounded-full hover:bg-white/5 text-white/20 hover:text-white transition-all"><XIcon className="w-8 h-8"/></button>
                    </header>

                    <main className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-grow bg-transparent">
                        <AnimatePresence>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-6 bg-red-500/5 border border-red-500/20 rounded-3xl flex items-start gap-5 shadow-2xl relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
                                    <AlertTriangleIcon className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-1.5">Sync Error</p>
                                        <p className="text-xs font-bold text-red-200/70 leading-relaxed">{error}</p>
                                    </div>
                                    <button onClick={() => setError(null)} className="ml-auto text-white/20 hover:text-white"><XIcon className="w-4 h-4"/></button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Node Selector Section - Visible only if branchId is not fixed */}
                        {showBranchSelector && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-3">
                                        <SchoolIcon className="w-4 h-4 text-primary/60" />
                                        <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em]">Target Institutional Node</label>
                                    </div>
                                    {loadingBranches && <Spinner size="sm" className="text-primary"/>}
                                </div>
                                <div className="bg-black/20 p-1.5 rounded-[1.8rem] border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                                    <CustomSelect 
                                        options={localBranches.map(b => ({ value: b.id.toString(), label: b.name }))}
                                        value={internalBranchId}
                                        onChange={setInternalBranchId}
                                        placeholder="Choose a destination node..."
                                        searchable
                                        icon={<SearchIcon className="w-4 h-4" />}
                                        emptyState={
                                            <div className="p-8 text-center space-y-4">
                                                <p className="text-xs font-bold text-white/20 uppercase tracking-widest">No Active Nodes Detected</p>
                                                <button 
                                                    type="button"
                                                    onClick={fetchBranches}
                                                    className="px-6 py-2 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg border border-primary/20 hover:bg-primary/20 transition-all"
                                                >
                                                    <RefreshIcon className="w-3 h-3 inline mr-2" /> Sync Node Matrix
                                                </button>
                                            </div>
                                        }
                                    />
                                </div>
                            </div>
                        )}

                        {/* Entity Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] ml-2">Entity Arbiter / Vendor</label>
                                <div className="bg-black/20 p-1.5 rounded-2xl border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                                    <input 
                                        type="text" 
                                        name="vendor_name" 
                                        value={formData.vendor_name} 
                                        onChange={e => setFormData({...formData, vendor_name: e.target.value.toUpperCase()})} 
                                        className="w-full p-4 text-sm font-black text-white/80 bg-transparent outline-none uppercase tracking-wider placeholder:text-white/10" 
                                        placeholder="CENTRAL_SUPPLY_NODE"
                                    />
                                </div>
                             </div>
                             <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] ml-2">Registry Pulse Date</label>
                                <div className="bg-black/20 p-1.5 rounded-2xl border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] relative group">
                                    <CalendarIcon className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-focus-within:text-primary transition-colors"/>
                                    <input 
                                        type="date" 
                                        name="expense_date" 
                                        value={formData.expense_date} 
                                        onChange={e => setFormData({...formData, expense_date: e.target.value})} 
                                        required 
                                        className="w-full p-4 pr-12 text-sm font-black text-white bg-transparent outline-none cursor-pointer"
                                    />
                                </div>
                             </div>
                        </div>

                        {/* Amount & Category Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] ml-2">Center Node</label>
                                <div className="bg-black/20 p-1.5 rounded-2xl border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                                    <select 
                                        name="category" 
                                        value={formData.category} 
                                        onChange={e => setFormData({...formData, category: e.target.value})} 
                                        className="w-full p-4 text-sm font-black text-white/80 bg-transparent outline-none appearance-none cursor-pointer uppercase tracking-widest"
                                    >
                                        {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] ml-2">Volume</label>
                                <div className="bg-black/20 p-1.5 rounded-2xl border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] relative group">
                                    <DollarSignIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-60"/>
                                    <input 
                                        type="number" 
                                        name="amount" 
                                        value={formData.amount} 
                                        onChange={e => setFormData({...formData, amount: e.target.value})} 
                                        required 
                                        step="0.01"
                                        className="w-full p-4 pl-12 text-2xl font-mono font-black text-white bg-transparent outline-none" 
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] ml-2">Payload Description</label>
                            <div className="bg-black/20 p-1.5 rounded-[1.8rem] border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                                <textarea 
                                    name="description" 
                                    value={formData.description} 
                                    onChange={e => setFormData({...formData, description: e.target.value})} 
                                    required 
                                    rows={3} 
                                    className="w-full p-6 text-sm font-medium text-white/70 bg-transparent outline-none leading-relaxed font-serif italic placeholder:text-white/5" 
                                    placeholder="Describe the transaction rationale..."
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                             <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] ml-2">Artifact Archival</label>
                             <div 
                                className={`p-10 border-2 border-dashed rounded-[2.5rem] text-center cursor-pointer transition-all duration-700 bg-black/20 group/upload ${invoiceFile ? 'border-emerald-500/40 bg-emerald-500/[0.02]' : 'border-white/5 hover:border-primary/40 hover:bg-white/[0.01]'}`}
                                onClick={() => fileInputRef.current?.click()}
                             >
                                <div className={`p-4 rounded-2xl w-fit mx-auto mb-6 shadow-2xl transition-all duration-500 group-hover/upload:scale-110 group-hover/upload:rotate-3 ${invoiceFile ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-white/5 text-white/10 ring-1 ring-white/10'}`}>
                                    <UploadIcon className="w-8 h-8"/>
                                </div>
                                <p className={`text-xl font-serif font-black transition-colors ${invoiceFile ? 'text-white' : 'text-white/20'}`}>
                                    {invoiceFile ? invoiceFile.name.toUpperCase() : 'UPLOAD INVOICE ARTIFACT'}
                                </p>
                                <p className="text-[10px] text-white/10 mt-3 font-black uppercase tracking-[0.3em]">PDF / PNG / JPG • MAX 10MB</p>
                                <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" />
                             </div>
                        </div>
                    </main>

                    <footer className="p-10 border-t border-white/5 bg-black/40 flex flex-col md:flex-row justify-between items-center gap-8">
                        <button type="button" onClick={onClose} className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-white transition-all order-2 md:order-1">Abort Session</button>
                        <button 
                            type="submit" 
                            disabled={loading || !formData.amount || (showBranchSelector && !internalBranchId)} 
                            className="w-full md:w-auto px-16 py-6 bg-primary text-primary-foreground font-black text-xs uppercase tracking-[0.5em] rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(var(--primary),0.5)] hover:bg-primary/90 transition-all transform active:scale-95 disabled:opacity-30 flex items-center justify-center gap-5 ring-8 ring-primary/5"
                        >
                            {loading ? <Spinner size="sm" className="text-white" /> : <><ShieldCheckIcon className="w-5 h-5 group-hover:rotate-12 transition-transform duration-500" /> Confirm Entry</>}
                        </button>
                    </footer>
                </form>
            </motion.div>
        </div>
    );
};

export default AddExpenseModal;