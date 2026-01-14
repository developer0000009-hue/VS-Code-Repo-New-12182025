
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { StudentInvoice, InvoiceStatus } from '../../types';
import Spinner from '../common/Spinner';
import { FinanceIcon } from '../icons/FinanceIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';

interface FeesTabProps {
    studentId: string | null;
}

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-start gap-4 transition-transform hover:-translate-y-1 duration-300">
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${color} text-white shadow-md`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-semibold text-muted-foreground">{title}</p>
            <p className="text-3xl font-extrabold text-foreground mt-1">
                 ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
        </div>
    </div>
);

const statusConfig: { [key in InvoiceStatus]: { text: string; bg: string; border: string; } } = {
    'Paid': { text: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-800' },
    'Pending': { text: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800' },
    'Overdue': { text: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800' },
    'Partial': { text: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800' },
};

const PaymentModal: React.FC<{ invoice: StudentInvoice, onClose: () => void }> = ({ invoice, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handlePay = async () => {
        setLoading(true);
        // Simulate payment process
        await new Promise(resolve => setTimeout(resolve, 2000));
        setLoading(false);
        setSuccess(true);
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in">
                <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl p-8 text-center border border-border">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                        <CheckCircleIcon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Payment Successful!</h3>
                    <p className="text-muted-foreground text-sm mb-6">Transaction ID: TXN-{Math.floor(Math.random()*1000000)}</p>
                    <button onClick={onClose} className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90">Done</button>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border animate-in zoom-in-95">
                <div className="p-6 border-b border-border bg-muted/20">
                    <h3 className="text-lg font-bold">Confirm Payment</h3>
                    <p className="text-sm text-muted-foreground">{invoice.description}</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm font-medium">Amount Due</span>
                        <span className="text-xl font-bold font-mono">${(invoice.amount - (invoice.amount_paid || 0)).toFixed(2)}</span>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm border border-blue-100 dark:border-blue-800">
                        Secure gateway connecting...
                    </div>
                </div>
                <div className="p-6 border-t border-border bg-muted/20 flex gap-3">
                    <button onClick={onClose} disabled={loading} className="flex-1 py-3 font-bold text-sm bg-background border border-border rounded-xl hover:bg-muted transition-colors">Cancel</button>
                    <button onClick={handlePay} disabled={loading} className="flex-1 py-3 font-bold text-sm bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 flex items-center justify-center gap-2 shadow-lg">
                        {loading ? <Spinner size="sm" className="text-current"/> : 'Pay Securely'}
                    </button>
                </div>
            </div>
        </div>
    )
}

const FeesTab: React.FC<FeesTabProps> = ({ studentId }) => {
    const [invoices, setInvoices] = useState<StudentInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [payingInvoice, setPayingInvoice] = useState<StudentInvoice | null>(null);

    const fetchInvoices = useCallback(async () => {
        if (!studentId) {
            setLoading(false);
            setError("No student selected.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.rpc('get_student_invoices', { p_student_id: studentId });
            if (error) throw error;
            setInvoices(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [studentId]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const financialSummary = useMemo(() => {
        const totalDue = invoices
            .filter(inv => inv.status !== 'Paid')
            .reduce((sum, inv) => sum + (inv.amount - (inv.amount_paid || 0)), 0);
        
        const overdue = invoices
            .filter(inv => inv.status === 'Overdue')
            .reduce((sum, inv) => sum + (inv.amount - (inv.amount_paid || 0)), 0);
        
        return { totalDue, overdue };
    }, [invoices]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-foreground">Fees & Payments</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard title="Total Outstanding" value={financialSummary.totalDue} icon={<FinanceIcon className="w-6 h-6" />} color="bg-amber-500" />
                <StatCard title="Amount Overdue" value={financialSummary.overdue} icon={<ClockIcon className="w-6 h-6" />} color="bg-red-500" />
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/20">
                    <h3 className="font-bold text-foreground text-lg">Invoice History</h3>
                </div>
                 {loading ? <div className="flex justify-center p-12"><Spinner size="lg" /></div> : 
                 error ? <p className="text-center text-destructive p-8 bg-destructive/5 m-4 rounded-xl">{error}</p> :
                 invoices.length === 0 ? (
                    <div className="text-center py-16">
                        <FinanceIcon className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                        <p className="font-semibold text-foreground text-lg">No invoices found.</p>
                        <p className="text-sm text-muted-foreground mt-1">Your payment history will appear here.</p>
                    </div>
                 ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted/30 text-left font-bold text-muted-foreground uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="p-5">Due Date</th>
                                    <th className="p-5">Description</th>
                                    <th className="p-5 text-right">Amount</th>
                                    <th className="p-5 text-center">Status</th>
                                    <th className="p-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {invoices.map(inv => {
                                    const config = statusConfig[inv.status];
                                    const isPayable = inv.status !== 'Paid';
                                    
                                    return (
                                        <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-5 font-medium text-foreground">{new Date(inv.due_date).toLocaleDateString()}</td>
                                            <td className="p-5 text-muted-foreground">{inv.description}</td>
                                            <td className="p-5 text-right">
                                                <p className="font-mono font-bold text-foreground">${inv.amount.toFixed(2)}</p>
                                            </td>
                                            <td className="p-5 text-center">
                                                <span className={`px-3 py-1 text-xs font-extrabold rounded-full uppercase tracking-wide border ${config.bg} ${config.text} ${config.border}`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="p-5 text-right">
                                                <div className="flex justify-end items-center gap-3">
                                                    <button className="text-muted-foreground hover:text-primary transition-colors font-medium flex items-center gap-1 text-xs">
                                                        <DownloadIcon className="w-4 h-4" /> Invoice
                                                    </button>
                                                    {isPayable && (
                                                        <button 
                                                            onClick={() => setPayingInvoice(inv)}
                                                            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5"
                                                        >
                                                            Pay Now
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                 )}
            </div>
            
            {payingInvoice && <PaymentModal invoice={payingInvoice} onClose={() => setPayingInvoice(null)} />}
        </div>
    );
};

export default FeesTab;
