
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { UploadIcon } from '../icons/UploadIcon';

const EXPENSE_CATEGORIES = [
    'Salaries', 'Utilities', 'Transport', 'Lab & Supplies', 'Maintenance', 'Events', 'Marketing', 'Administrative', 'Other'
];

const PAYMENT_MODES = ['Cash', 'Cheque', 'Online Transfer', 'Credit Card', 'Debit Card'];

interface AddExpenseModalProps {
    onClose: () => void;
    onSave: () => void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        category: 'Utilities',
        amount: '',
        vendor_name: '',
        expense_date: new Date().toISOString().split('T')[0],
        description: '',
        payment_mode: 'Online Transfer',
    });
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFileChange = (files: FileList | null) => {
        if (files && files[0]) {
            setInvoiceFile(files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        let invoiceUrl: string | null = null;
        try {
            if (invoiceFile) {
                const fileExt = invoiceFile.name.split('.').pop();
                const filePath = `public/${Date.now()}-${invoiceFile.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('expense-invoices')
                    .upload(filePath, invoiceFile);

                if (uploadError) throw uploadError;
                
                const { data } = supabase.storage.from('expense-invoices').getPublicUrl(filePath);
                invoiceUrl = data.publicUrl;
            }
            
            const { error: rpcError } = await supabase.rpc('add_school_expense', {
                p_category: formData.category,
                p_amount: parseFloat(formData.amount),
                p_vendor_name: formData.vendor_name,
                p_expense_date: formData.expense_date,
                p_description: formData.description,
                p_invoice_url: invoiceUrl,
                p_payment_mode: formData.payment_mode,
                p_branch_id: null // Assuming head office context for now
            });
            
            if (rpcError) throw rpcError;
            
            onSave();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card w-full max-w-2xl rounded-2xl shadow-xl border border-border flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <header className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                        <h3 className="text-lg font-bold text-foreground">Record New Expense</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-muted"><XIcon className="w-5 h-5"/></button>
                    </header>

                    <main className="p-6 space-y-5 overflow-y-auto">
                        {error && <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">{error}</div>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div><label className="input-label">Category</label><select name="category" value={formData.category} onChange={handleChange} className="input-base w-full">{EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                            <div><label className="input-label">Amount</label><input type="number" name="amount" value={formData.amount} onChange={handleChange} required className="input-base w-full" placeholder="0.00"/></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                             <div><label className="input-label">Vendor (Optional)</label><input type="text" name="vendor_name" value={formData.vendor_name} onChange={handleChange} className="input-base w-full" placeholder="Enter new or existing vendor"/></div>
                             <div><label className="input-label">Expense Date</label><input type="date" name="expense_date" value={formData.expense_date} onChange={handleChange} required className="input-base w-full"/></div>
                        </div>
                        <div><label className="input-label">Description</label><textarea name="description" value={formData.description} onChange={handleChange} required rows={2} className="input-base w-full" placeholder="Describe the expense..."/></div>
                        <div><label className="input-label">Payment Mode</label><select name="payment_mode" value={formData.payment_mode} onChange={handleChange} className="input-base w-full">{PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}</select></div>
                        
                        <div>
                             <label className="input-label">Attach Bill/Invoice (Optional)</label>
                             <div 
                                onDragEnter={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFileChange(e.dataTransfer.files); }}
                                className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                                onClick={() => fileInputRef.current?.click()}
                             >
                                <UploadIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2"/>
                                <p className="font-semibold text-foreground text-sm">{invoiceFile ? invoiceFile.name : 'Drag & drop or click to upload'}</p>
                                <p className="text-xs text-muted-foreground">PDF, PNG, JPG up to 5MB</p>
                                <input type="file" ref={fileInputRef} onChange={e => handleFileChange(e.target.files)} className="hidden" />
                             </div>
                        </div>
                    </main>

                    <footer className="p-6 border-t border-border flex justify-end gap-3 bg-muted/20">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary min-w-[120px]">
                            {loading ? <Spinner size="sm" /> : 'Save Expense'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default AddExpenseModal;
