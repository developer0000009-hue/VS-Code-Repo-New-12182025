
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { StudentFeeSummary, StudentFinanceDetails } from '../../types';
import Spinner from '../common/Spinner';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { DollarSignIcon } from '../icons/DollarSignIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { ReceiptIcon } from '../icons/ReceiptIcon';
import { ClockIcon } from '../icons/ClockIcon';
import RecordPaymentModal from './RecordPaymentModal';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ActivityIcon } from '../icons/ActivityIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { DownloadIcon } from '../icons/DownloadIcon';

const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: currency === 'USD' ? 'USD' : 'INR',
        minimumFractionDigits: 0
    }).format(amount || 0);
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
        <div className="space-y-10 animate-in fade-in slide-in-from-right-10 duration-700">
            {/* Context Breadcrumb */}
            <button onClick={onBack} className="flex items-center gap-3 text-[10px] font-black text-white/30 uppercase tracking-[0.4em] hover:text-primary transition-all group">
                <div className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover:border-primary/20"><ChevronLeftIcon className="w-4 h-4"/></div> Regression: Identity Directory
            </button>

            {/* Global Summary Ledger Card */}
            <div className="bg-[#0c0d12] border border-white/5 rounded-[3.5rem] p-10 md:p-16 shadow-[0_64px_128px_-24px_rgba(0,0,0,1)] relative overflow-hidden ring-1 ring-white/10">
                <div className="absolute top-0 right-0 p-20 opacity-[0.02] transform rotate-12"><DollarSignIcon className="w-96 h-96 text-primary" /></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                             <div className="w-[72px] h-[72px] rounded-[1.8rem] bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white text-3xl font-serif font-black shadow-2xl border-2 border-white/10">
                                {student.display_name.charAt(0)}
                             </div>
                             <div>
                                <h2 className="text-4xl md:text-5xl font-serif font-black text-white tracking-tighter uppercase leading-tight">{student.display_name}</h2>
                                <p className="text-sm font-bold text-white/30 uppercase tracking-[0.4em] mt-1.5">{student.class_name || 'BLOCK_UNASSIGNED'}</p>
                             </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-3 group">
                            <DownloadIcon className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" /> Export Statement
                        </button>
                        <button 
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="px-10 py-5 bg-primary text-primary-foreground font-black text-xs uppercase tracking-[0.4em] rounded-2xl shadow-2xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-3 transform active:scale-95 border border-white/10 ring-4 ring-primary/5"
                        >
                            <PlusIcon className="w-5 h-5" /> Sync Payment
                        </button>
                    </div>
                </div>

                <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-12 relative z-10 border-t border-white/[0.04] pt-12">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em]">Lifetime Billed</p>
                        {/* FIX: Handled 'student.currency' with fallback to resolve property access errors. */}
                        <p className="text-4xl font-black text-white font-mono tracking-tighter">{formatCurrency(student.total_billed, student.currency || 'INR')}</p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em]">Synchronized Capital</p>
                        {/* FIX: Handled 'student.currency' with fallback. */}
                        <p className="text-4xl font-black text-emerald-500 font-mono tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">{formatCurrency(student.total_paid, student.currency || 'INR')}</p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em]">Outstanding Liability</p>
                        {/* FIX: Handled 'student.currency' with fallback. */}
                        <p className={`text-4xl font-black font-mono tracking-tighter ${student.outstanding_balance > 0 ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'text-white/20'}`}>
                            {formatCurrency(student.outstanding_balance, student.currency || 'INR')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Ledger Timeline View */}
            <div className="bg-[#0c0d12] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-white/5">
                <div className="flex border-b border-white/5 bg-white/[0.01]">
                    <button 
                        onClick={() => setActiveSubTab('invoices')}
                        className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.4em] transition-all relative ${activeSubTab === 'invoices' ? 'text-primary' : 'text-white/20 hover:text-white/40'}`}
                    >
                        Pending Liability Slots
                        {activeSubTab === 'invoices' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-primary rounded-t-full shadow-[0_0_10px_rgba(var(--primary),0.8)]"></div>}
                    </button>
                    <button 
                        onClick={() => setActiveSubTab('payments')}
                        className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.4em] transition-all relative ${activeSubTab === 'payments' ? 'text-primary' : 'text-white/20 hover:text-white/40'}`}
                    >
                        Payment Synchronization Log
                        {activeSubTab === 'payments' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-primary rounded-t-full shadow-[0_0_10px_rgba(var(--primary),0.8)]"></div>}
                    </button>
                </div>

                <div className="p-10 min-h-[400px]">
                    {loading ? <div className="py-32 flex flex-col items-center justify-center gap-6"><Spinner size="lg" className="text-primary"/><p className="text-[10px] font-black uppercase text-white/10 tracking-[0.4em] animate-pulse">Syncing Ledger...</p></div> : (
                        <div className="space-y-4 animate-in fade-in duration-500">
                            {activeSubTab === 'invoices' ? (
                                (details?.invoices ?? []).length === 0 ? (
                                    <div className="py-20 text-center opacity-20"><ActivityIcon className="w-16 h-16 mx-auto mb-4" /><p className="font-serif italic text-lg uppercase tracking-widest">No active liabilities detected</p></div>
                                ) : (
                                    (details?.invoices ?? []).map(inv => (
                                        <div key={inv.id} className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-500 flex justify-between items-center group relative overflow-hidden">
                                            <div className="flex items-center gap-6 relative z-10">
                                                <div className="p-4 bg-black/40 rounded-2xl shadow-inner text-white/30 group-hover:text-primary transition-colors border border-white/5">
                                                    <ReceiptIcon className="w-6 h-6"/>
                                                </div>
                                                <div>
                                                    <p className="font-serif font-black text-white text-lg tracking-tight uppercase group-hover:text-primary transition-colors">{inv.description}</p>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2"><ClockIcon className="w-3.5 h-3.5 opacity-40"/> Limit: {new Date(inv.due_date).toLocaleDateString()}</span>
                                                        <div className="w-1 h-1 rounded-full bg-white/10"></div>
                                                        <span className="text-[10px] font-black text-white/10 uppercase tracking-widest">ID: {String(inv.id).padStart(6, '0')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-10 relative z-10">
                                                <div className="text-right">
                                                    {/* FIX: Handled 'student.currency' with fallback. */}
                                                    <p className="font-mono font-black text-white text-2xl tracking-tighter">{formatCurrency(inv.amount, student.currency || 'INR')}</p>
                                                    {/* FIX: Handled 'student.currency' with fallback. */}
                                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Paid: {formatCurrency(inv.amount_paid, student.currency || 'INR')}</p>
                                                </div>
                                                <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] border transition-all ${
                                                    inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-2xl' :
                                                    inv.status === 'Overdue' ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse' :
                                                    'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-xl'
                                                }`}>
                                                    {inv.status}
                                                </span>
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </div>
                                    ))
                                )
                            ) : (
                                (details?.payments ?? []).length === 0 ? (
                                     <div className="py-20 text-center opacity-20"><DollarSignIcon className="w-16 h-16 mx-auto mb-4" /><p className="font-serif italic text-lg uppercase tracking-widest">Registry ledger empty</p></div>
                                ) : (
                                    (details?.payments ?? []).map(p => (
                                        <div key={p.id} className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-500 flex justify-between items-center group relative overflow-hidden">
                                            <div className="flex items-center gap-6 relative z-10">
                                                <div className="p-4 bg-emerald-500/5 text-emerald-500 rounded-2xl shadow-inner border border-emerald-500/10 group-hover:scale-105 transition-transform duration-500">
                                                    <CheckCircleIcon className="w-6 h-6"/>
                                                </div>
                                                <div>
                                                    <p className="font-serif font-black text-white text-lg tracking-tight uppercase group-hover:text-emerald-400 transition-colors">Funds Synchronized</p>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] font-mono">{p.receipt_number}</p>
                                                        <div className="w-1 h-1 rounded-full bg-white/10"></div>
                                                        {/* FIX: Provided fallback for 'p.payment_method' to resolve access error on Payment type. */}
                                                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest italic">{p.payment_method || 'Other'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right relative z-10">
                                                {/* FIX: Handled 'student.currency' with fallback. */}
                                                <p className="font-mono font-black text-emerald-500 text-3xl tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">{formatCurrency(p.amount, student.currency || 'INR')}</p>
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-1.5 font-sans">{new Date(p.payment_date).toLocaleString().toUpperCase()}</p>
                                            </div>
                                             <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </div>
                                    ))
                                )
                            )}
                        </div>
                    )}
                </div>
                
                <div className="p-8 border-t border-white/5 bg-black/20 text-center">
                    <span className="text-[9px] font-black text-white/5 uppercase tracking-[0.6em] select-none">Institutional Financial Identity Ledger Node</span>
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
