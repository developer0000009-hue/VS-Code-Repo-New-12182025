
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
// Fix: Removed undefined export 'StudentInvoiceDetails' from types import.
import { StudentFeeSummary, StudentFinanceDetails, Payment } from '../../types';
import Spinner from '../common/Spinner';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { DollarSignIcon } from '../icons/DollarSignIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { ReceiptIcon } from '../icons/ReceiptIcon';
import { ClockIcon } from '../icons/ClockIcon';
import RecordPaymentModal from './RecordPaymentModal';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
};

interface StudentFinanceDetailViewProps {
    student: StudentFeeSummary;
    onBack: () => void;
    onUpdate: () => void;
}

const StudentFinanceDetailView: React.FC<StudentFinanceDetailViewProps> = ({ student, onBack, onUpdate }) => {
    const [details, setDetails] = useState<StudentFinanceDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'payments'>('invoices');

    const fetchDetails = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_student_finance_details', { p_student_id: student.student_id });
            if (error) throw error;
            setDetails(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [student.student_id]);

    useEffect(() => { fetchDetails(); }, [fetchDetails]);

    const handlePaymentSuccess = () => {
        setIsPaymentModalOpen(false);
        fetchDetails();
        onUpdate();
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-500">
            {/* Header / Summary Card */}
            <div className="bg-card border border-border rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden ring-1 ring-black/5">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03]"><DollarSignIcon className="w-64 h-64 text-primary" /></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8">
                    <div className="space-y-4">
                        <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
                            <ChevronLeftIcon className="w-4 h-4"/> Back to Directory
                        </button>
                        <div>
                            <h2 className="text-4xl font-black text-foreground tracking-tight">{student.display_name}</h2>
                            <p className="text-lg font-bold text-muted-foreground mt-1">{student.class_name} • Student Account Ledger</p>
                        </div>
                    </div>
                    <div className="flex gap-3 self-end">
                        <button 
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="px-8 py-3.5 bg-primary text-primary-foreground font-black text-sm rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <PlusIcon className="w-5 h-5" /> Record Payment
                        </button>
                    </div>
                </div>

                <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 relative z-10 border-t border-border/50 pt-8">
                    <div className="text-center md:text-left">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Lifetime Billed</p>
                        <p className="text-3xl font-black text-foreground font-mono mt-1">{formatCurrency(student.total_billed)}</p>
                    </div>
                    <div className="text-center md:text-left">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Collected</p>
                        <p className="text-3xl font-black text-emerald-500 font-mono mt-1">{formatCurrency(student.total_paid)}</p>
                    </div>
                    <div className="text-center md:text-left">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Balance Outstanding</p>
                        <p className={`text-3xl font-black font-mono mt-1 ${student.outstanding_balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {formatCurrency(student.outstanding_balance)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Detailed Lists */}
            <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
                <div className="flex border-b border-border bg-muted/5">
                    <button 
                        onClick={() => setActiveSubTab('invoices')}
                        className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'invoices' ? 'bg-background text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Pending & Paid Invoices
                    </button>
                    <button 
                        onClick={() => setActiveSubTab('payments')}
                        className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'payments' ? 'bg-background text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Payment History
                    </button>
                </div>

                <div className="p-8">
                    {loading ? <div className="py-20 flex justify-center"><Spinner size="lg"/></div> : (
                        <div className="space-y-4">
                            {activeSubTab === 'invoices' ? (
                                (details?.invoices ?? []).map(inv => (
                                    <div key={inv.id} className="p-5 rounded-2xl border border-border/60 bg-muted/10 hover:bg-muted/30 transition-all flex justify-between items-center group">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-card rounded-xl shadow-sm text-muted-foreground group-hover:text-primary transition-colors">
                                                <ReceiptIcon className="w-5 h-5"/>
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground text-sm">{inv.description}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><ClockIcon className="w-3 h-3"/> Due: {new Date(inv.due_date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="font-mono font-black text-foreground">{formatCurrency(inv.amount)}</p>
                                                <p className="text-[10px] font-bold text-emerald-500 uppercase">Paid: {formatCurrency(inv.amount_paid)}</p>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                inv.status === 'Overdue' ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' :
                                                'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                                {inv.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                (details?.payments ?? []).map(p => (
                                    <div key={p.id} className="p-5 rounded-2xl border border-border/60 bg-muted/10 hover:bg-muted/30 transition-all flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl shadow-sm">
                                                <CheckCircleIcon className="w-5 h-5"/>
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground text-sm">Funds Received</p>
                                                <p className="text-xs text-muted-foreground mt-0.5 font-mono">{p.receipt_number}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono font-black text-emerald-600 text-lg">{formatCurrency(p.amount)}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(p.payment_date).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                            {(activeSubTab === 'invoices' && (details?.invoices?.length ?? 0) === 0) && <p className="text-center py-20 text-muted-foreground italic">No invoices found for this account.</p>}
                            {(activeSubTab === 'payments' && (details?.payments?.length ?? 0) === 0) && <p className="text-center py-20 text-muted-foreground italic">No payments have been recorded yet.</p>}
                        </div>
                    )}
                </div>
            </div>

            {isPaymentModalOpen && (
                <RecordPaymentModal 
                    studentId={student.student_id}
                    studentName={student.display_name}
                    onClose={() => setIsPaymentModalOpen(false)}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
};

export default StudentFinanceDetailView;
