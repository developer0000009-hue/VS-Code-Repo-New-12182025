
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { DollarSignIcon } from '../icons/DollarSignIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';

interface RecordPaymentModalProps {
    studentId: string;
    studentName: string;
    onClose: () => void;
    onSuccess: () => void;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ studentId, studentName, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [method, setMethod] = useState('Digital Gateway');

    useEffect(() => {
        const fetchInvoices = async () => {
            const { data } = await supabase.rpc('get_payable_invoices_for_student', { p_student_id: studentId });
            if (data && data.length > 0) {
                setInvoices(data);
                setSelectedInvoiceId(data[0].id.toString());
                setAmount(data[0].amount_due.toString());
            }
        };
        fetchInvoices();
    }, [studentId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.rpc('record_fee_payment', {
                p_invoice_id: parseInt(selectedInvoiceId),
                p_amount: parseFloat(amount),
                p_method: method,
                p_reference: 'Admin Portal Manual Record'
            });
            if (error) throw error;
            setSuccess(true);
            setTimeout(onSuccess, 1500);
        } catch (err: any) {
            setError(err.message || "Protocol rejection by financial node.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in">
                <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl p-8 text-center border border-border">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircleIcon animate className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Payment Successful!</h3>
                    <p className="text-muted-foreground text-sm mb-6">Transaction ID: TXN-{Math.floor(Math.random()*1000000)}</p>
                    <button onClick={onClose} className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90">Done</button>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in" onClick={onClose}>
            <div 
                className="bg-card w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border-x border-t sm:border border-white/10 overflow-hidden flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-500" 
                onClick={e => e.stopPropagation()}
            >
                {success ? (
                    <div className="p-12 text-center space-y-6">
                        <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
                            <CheckCircleIcon className="w-10 h-10"/>
                        </div>
                        <h3 className="text-2xl font-black text-foreground">Payment Secured</h3>
                        <p className="text-muted-foreground text-sm">Transactional identity synchronized with master ledger.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col">
                        <div className="p-6 md:p-8 border-b border-border bg-muted/20 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Record Transaction</h3>
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1 truncate max-w-[250px]">Entity: {studentName}</p>
                            </div>
                            <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground"><XIcon className="w-5 h-5"/></button>
                        </div>

                        <div className="p-6 md:p-8 space-y-6">
                            {error && <div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-xs font-bold border border-red-500/20">{error}</div>}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Allocate to Ledger</label>
                                <select 
                                    value={selectedInvoiceId} 
                                    onChange={e => setSelectedInvoiceId(e.target.value)} 
                                    className="w-full p-4 rounded-2xl bg-muted/30 border border-border font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                >
                                    {invoices.map(inv => <option key={inv.id} value={inv.id}>{inv.description} (${inv.amount_due} due)</option>)}
                                    {invoices.length === 0 && <option disabled>No actionable invoices</option>}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Monetary Volume</label>
                                    <div className="relative">
                                        <DollarSignIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary"/>
                                        <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required className="w-full p-4 pl-11 rounded-2xl bg-muted/30 border border-border font-mono font-black text-sm outline-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Execution Channel</label>
                                    <select value={method} onChange={e => setMethod(e.target.value)} className="w-full p-4 rounded-2xl bg-muted/30 border border-border font-bold text-sm outline-none">
                                        <option>Digital Gateway</option><option>Cash Desk</option><option>Bank Draft</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 bg-muted/20 border-t border-border flex flex-col md:flex-row justify-end gap-4">
                            <button type="button" onClick={onClose} className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground order-2 md:order-1">Discard</button>
                            <button type="submit" disabled={loading || !selectedInvoiceId} className="w-full md:w-auto px-10 py-4 bg-primary text-white font-black text-xs rounded-2xl shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all transform active:scale-95 disabled:opacity-50 uppercase tracking-[0.2em] order-1 md:order-2">
                                {loading ? <Spinner size="sm" className="text-white" /> : 'Confirm Protocol'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default RecordPaymentModal;
