import React, { useState, useEffect } from 'react';
import { supabase, formatError } from '../../services/supabase';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { DollarSignIcon } from '../icons/DollarSignIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ReceiptIcon } from '../icons/ReceiptIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';

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
    const [method, setMethod] = useState('Online Transfer');
    const [receiptNo, setReceiptNo] = useState<string>('');

    useEffect(() => {
        const fetchInvoices = async () => {
            const { data, error } = await supabase.rpc('get_payable_invoices_for_student', { p_student_id: studentId });
            if (error) console.error(error);
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
            const { data, error } = await supabase.rpc('record_fee_payment', {
                p_invoice_id: parseInt(selectedInvoiceId),
                p_amount: parseFloat(amount),
                p_method: method,
                p_reference: 'Admin Direct Entry'
            });

            if (error) throw error;
            if (data && data.success) {
                setReceiptNo(data.receipt_number);
                setSuccess(true);
                setTimeout(() => {
                    onSuccess();
                }, 2000);
            } else {
                throw new Error(data?.message || "Protocol rejection by financial ledger.");
            }
        } catch (err: any) {
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-500" onClick={onClose}>
            <div 
                className="bg-[#0c0d12] w-full max-w-lg rounded-[3rem] shadow-[0_64px_128px_-24px_rgba(0,0,0,1)] border border-white/10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 ring-1 ring-white/10" 
                onClick={e => e.stopPropagation()}
            >
                {success ? (
                    <div className="p-16 text-center space-y-10 animate-in zoom-in-95 duration-700">
                        <div className="relative inline-block">
                             <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"></div>
                             <div className="relative w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto border border-emerald-500/20 shadow-inner">
                                <CheckCircleIcon animate className="w-12 h-12"/>
                             </div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-3xl font-serif font-black text-white uppercase tracking-tight">Funds Secured.</h3>
                            <p className="text-white/40 font-serif italic text-lg leading-relaxed">Identity ledger synchronized with the master billing node.</p>
                        </div>
                        <div className="bg-black/60 p-6 rounded-3xl border border-white/5 shadow-inner">
                             <p className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] mb-2">Receipt Token</p>
                             <p className="text-2xl font-mono font-black text-primary tracking-widest uppercase">{receiptNo}</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col">
                        <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center relative overflow-hidden group">
                            <div className="flex items-center gap-5 relative z-10">
                                <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner border border-primary/20">
                                    <DollarSignIcon className="w-6 h-6"/>
                                </div>
                                <div>
                                    <h3 className="text-xl font-serif font-black text-white uppercase tracking-tight">Sync Transaction</h3>
                                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mt-1">Entity: {studentName}</p>
                                </div>
                            </div>
                            <button type="button" onClick={onClose} className="p-2.5 rounded-full hover:bg-white/5 text-white/20 hover:text-white transition-all"><XIcon className="w-6 h-6"/></button>
                        </div>

                        <div className="p-10 space-y-8 bg-transparent">
                            {error && (
                                <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-start gap-4 animate-in shake">
                                    <AlertTriangleIcon className="w-6 h-6 text-red-500/60 mt-0.5" />
                                    <p className="text-xs font-black uppercase text-red-400 tracking-wider leading-relaxed">{error}</p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] ml-2">Allocate to Liability Slot</label>
                                <div className="relative group">
                                    <select 
                                        value={selectedInvoiceId} 
                                        onChange={e => setSelectedInvoiceId(e.target.value)} 
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-sm font-black text-white focus:ring-8 focus:ring-primary/5 focus:border-primary/40 outline-none appearance-none cursor-pointer shadow-inner uppercase tracking-wider"
                                    >
                                        {invoices.map(inv => <option key={inv.id} value={inv.id}>{inv.description} ({inv.amount_due} due)</option>)}
                                        {invoices.length === 0 && <option disabled>No actionable nodes found</option>}
                                    </select>
                                    <ReceiptIcon className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-hover:text-primary transition-colors pointer-events-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] ml-2">Volume</label>
                                    <div className="relative group">
                                        <DollarSignIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-60"/>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            value={amount} 
                                            onChange={e => setAmount(e.target.value)} 
                                            required 
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 pl-12 text-lg font-mono font-black text-white focus:ring-8 focus:ring-primary/5 focus:border-primary/40 outline-none shadow-inner" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] ml-2">Channel</label>
                                    <select value={method} onChange={e => setMethod(e.target.value)} className="w-full h-[66px] bg-black/40 border border-white/5 rounded-2xl px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white focus:ring-8 focus:ring-primary/5 focus:border-primary/40 outline-none shadow-inner appearance-none cursor-pointer">
                                        <option>Online Transfer</option>
                                        <option>Cash Vault</option>
                                        <option>Check Protocol</option>
                                        <option>Bank Draft</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 bg-white/[0.01] border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                            <button type="button" onClick={onClose} className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-white transition-all order-2 md:order-1">Abort Transaction</button>
                            <button 
                                type="submit" 
                                disabled={loading || !selectedInvoiceId || !amount} 
                                className="w-full md:w-auto px-12 py-5 bg-primary text-primary-foreground font-black text-[11px] uppercase tracking-[0.4em] rounded-[1.5rem] shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all transform active:scale-95 disabled:opacity-30 flex items-center justify-center gap-4 group order-1 md:order-2 ring-8 ring-primary/5"
                            >
                                {loading ? <Spinner size="sm" className="text-white" /> : <><ShieldCheckIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" /> Authorize & Seal</>}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default RecordPaymentModal;