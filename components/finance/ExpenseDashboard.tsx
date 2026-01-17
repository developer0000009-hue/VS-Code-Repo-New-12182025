import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase, formatError } from '../../services/supabase';
import { ExpenseDashboardData, Expense, SchoolBranch } from '../../types';
import { PlusIcon } from '../icons/PlusIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { BriefcaseIcon } from '../icons/BriefcaseIcon';
import Spinner from '../common/Spinner';
import AddExpenseModal from './AddExpenseModal';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { FilterIcon } from '../icons/FilterIcon';
import { SearchIcon } from '../icons/SearchIcon';
import { BuildingIcon } from '../icons/BuildingIcon';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { DollarSignIcon } from '../icons/DollarSignIcon';
import { ClockIcon } from '../icons/ClockIcon';

const EXPENSE_CATEGORIES = [
    'Salaries', 'Utilities', 'Transport', 'Lab & Supplies', 'Maintenance', 'Events', 'Marketing', 'Administrative', 'Other'
];

interface ExpenseDashboardProps {
    data: ExpenseDashboardData;
    onRefresh: () => void;
    branchId: number | null;
    branches: SchoolBranch[];
}

const ExpenseDashboard: React.FC<ExpenseDashboardProps> = ({ onRefresh, branchId, branches }) => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [updatingStatus, setUpdatingStatus] = useState<Record<number, boolean>>({});
    
    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase.from('school_expenses').select('*');
            
            // Contextual Scoping
            if (branchId !== null) {
                query = query.eq('branch_id', branchId);
            }

            const { data, error } = await query.order('expense_date', { ascending: false });
            if (error) throw error;
            setExpenses(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

    const stats = useMemo(() => {
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const monthExpenses = expenses.filter(e => {
            const d = new Date(e.expense_date);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        });
        
        return {
            totalMonth: monthExpenses.reduce((acc, e) => acc + Number(e.amount), 0),
            pending: expenses.filter(e => e.status === 'Pending').length,
            topCategory: 'Salaries' // Mock for now
        };
    }, [expenses]);

    const filteredExpenses = useMemo(() => {
        return expenses.filter(exp => {
            const matchesSearch = searchTerm === '' || 
                exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exp.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === 'All' || exp.category === filterCategory;
            const matchesStatus = filterStatus === 'All' || exp.status === filterStatus;
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [expenses, searchTerm, filterCategory, filterStatus]);

    const handleStatusUpdate = async (expenseId: number, newStatus: string) => {
        setUpdatingStatus(prev => ({ ...prev, [expenseId]: true }));
        try {
            const { error } = await supabase.from('school_expenses').update({ status: newStatus }).eq('id', expenseId);
            if (error) throw error;
            fetchExpenses();
            onRefresh();
        } catch (err: any) {
            alert(`Status synchronization failed: ${formatError(err)}`);
        } finally {
            setUpdatingStatus(prev => ({ ...prev, [expenseId]: false }));
        }
    };
    
    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                         <div className="p-2 bg-red-500/10 rounded-xl text-red-500 border border-red-500/20 shadow-inner">
                            <TrendingUpIcon className="w-5 h-5"/>
                         </div>
                         <span className="text-[10px] font-black uppercase text-red-500 tracking-[0.4em] pl-2 border-l border-red-500/20">Operational Burn Rate</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif font-black text-white tracking-tighter uppercase leading-none">Institutional <span className="text-white/20 italic">Spend.</span></h2>
                    <p className="text-lg text-white/40 font-serif italic max-w-lg leading-relaxed border-l-2 border-white/5 pl-8">Monitor fiscal health and institutional liquidity through managed operational expenditures.</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                     <button onClick={() => setIsAddModalOpen(true)} className="flex-grow md:flex-none h-14 px-10 bg-primary text-white font-black text-[11px] uppercase tracking-[0.4em] rounded-[1.5rem] shadow-2xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-4 active:scale-95 ring-8 ring-primary/5">
                        <PlusIcon className="w-5 h-5" /> Provision Expense
                     </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="bg-[#0c0d12] p-10 rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] transform rotate-12 group-hover:scale-110 transition-transform duration-1000"><DollarSignIcon className="w-40 h-40 text-primary" /></div>
                    <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-8">Periodic Burn (Month)</h3>
                    <p className="text-5xl font-black text-white font-mono tracking-tighter">${stats.totalMonth.toLocaleString()}</p>
                </div>
                 <div className="bg-[#0c0d12] p-10 rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] transform -rotate-12 group-hover:scale-110 transition-transform duration-1000"><ClockIcon className="w-40 h-40 text-amber-500" /></div>
                    <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-8">Pending Resolution</h3>
                    <p className={`text-5xl font-black font-mono tracking-tighter ${stats.pending > 0 ? 'text-amber-500' : 'text-white/20'}`}>{stats.pending}</p>
                </div>
                 <div className="bg-[#0c0d12] p-10 rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] transform rotate-12 group-hover:scale-110 transition-transform duration-1000"><BuildingIcon className="w-40 h-40 text-indigo-500" /></div>
                    <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-8">Dominant Center</h3>
                    <p className="text-3xl font-black text-white uppercase tracking-tight font-serif">{stats.topCategory}</p>
                </div>
            </div>

            <div className="bg-[#0a0a0c] border border-white/10 rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,1)] overflow-hidden flex flex-col min-h-[600px] ring-1 ring-white/5 relative">
                <div className="p-8 border-b border-white/5 bg-white/[0.01] backdrop-blur-xl flex flex-col md:flex-row gap-8 justify-between items-center sticky top-0 z-20">
                    <div className="relative w-full md:max-w-md group">
                        <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/10 group-focus-within:text-primary transition-colors"/>
                        <input 
                            type="text" 
                            placeholder="SEARCH VENDOR OR PAYLOAD..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value.toUpperCase())} 
                            className="w-full pl-16 pr-8 py-4 bg-black/40 border border-white/5 rounded-2xl text-[12px] font-black text-white focus:bg-black/60 focus:border-primary/50 outline-none transition-all placeholder:text-white/5 tracking-widest"
                        />
                    </div>
                    <div className="flex bg-black/40 p-2 rounded-[1.8rem] border border-white/5 shadow-inner">
                        <select 
                            value={filterCategory} 
                            onChange={e => setFilterCategory(e.target.value)} 
                            className="bg-transparent text-[10px] font-black uppercase text-white/40 focus:outline-none cursor-pointer tracking-widest px-6 appearance-none hover:text-white transition-colors"
                        >
                            <option value="All">All Centers</option>
                            {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
                        </select>
                        <div className="w-px h-8 bg-white/5 self-center"></div>
                         <select 
                            value={filterStatus} 
                            onChange={e => setFilterStatus(e.target.value)} 
                            className="bg-transparent text-[10px] font-black uppercase text-white/40 focus:outline-none cursor-pointer tracking-widest px-6 appearance-none hover:text-white transition-colors"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Synchronized</option>
                            <option value="Rejected">Redacted</option>
                        </select>
                    </div>
                </div>
                
                <div className="overflow-x-auto flex-grow custom-scrollbar">
                     <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                        <thead className="text-[9px] font-black uppercase text-white/20 tracking-[0.4em] bg-white/[0.01] border-b border-white/5">
                            <tr>
                                <th className="p-10 pl-12">Registry Pulse</th>
                                <th className="p-10">Center Node</th>
                                <th className="p-10">Payload Context</th>
                                <th className="p-10">Arbiter / Vendor</th>
                                <th className="p-10 text-right">Volume</th>
                                <th className="p-10 text-center">Governance</th>
                                <th className="p-10 text-center pr-12">Protocols</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                             {loading ? (
                                 <tr><td colSpan={7} className="p-40 text-center"><Spinner size="lg" className="text-primary"/><p className="text-[11px] font-black uppercase text-white/10 tracking-[0.5em] mt-8 animate-pulse">Establishing Ledger Context...</p></td></tr>
                             ) : filteredExpenses.length > 0 ? filteredExpenses.map(exp => {
                                 const isUpdating = updatingStatus[exp.id];
                                 return (
                                 <tr key={exp.id} className="hover:bg-white/[0.01] group transition-all duration-500">
                                     <td className="p-10 pl-12 font-mono text-[11px] text-white/30">{new Date(exp.expense_date).toLocaleDateString().toUpperCase()}</td>
                                     <td className="p-10">
                                        <span className="px-4 py-1.5 bg-white/5 text-white/40 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">{exp.category}</span>
                                     </td>
                                     <td className="p-10">
                                        <p className="text-[15px] font-serif font-black text-white group-hover:text-primary transition-colors tracking-tight truncate max-w-[250px]">{exp.description}</p>
                                     </td>
                                     <td className="p-10">
                                        <p className="text-[13px] font-bold text-white/50">{exp.vendor_name || 'CENTRAL_NODE'}</p>
                                     </td>
                                     <td className="p-10 text-right font-mono font-black text-lg text-white/90">${Number(exp.amount).toLocaleString()}</td>
                                     <td className="p-10 text-center">
                                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                                            exp.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                            exp.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                            'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                                        }`}>
                                            {exp.status === 'Approved' ? 'Synchronized' : exp.status === 'Rejected' ? 'Redacted' : 'Pending'}
                                        </span>
                                     </td>
                                     <td className="p-10 text-center pr-12">
                                         {exp.status === 'Pending' ? (
                                             <div className="flex justify-center items-center gap-3">
                                                 <button disabled={isUpdating} onClick={() => handleStatusUpdate(exp.id, 'Approved')} className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-xl active:scale-90" title="Synchronize">
                                                     {isUpdating ? <Spinner size="sm"/> : <CheckCircleIcon className="w-4 h-4"/>}
                                                 </button>
                                                 <button disabled={isUpdating} onClick={() => handleStatusUpdate(exp.id, 'Rejected')} className="p-3 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-xl active:scale-90" title="Redact">
                                                      {isUpdating ? <Spinner size="sm"/> : <XCircleIcon className="w-4 h-4"/>}
                                                 </button>
                                             </div>
                                         ) : exp.invoice_url ? (
                                              <a href={exp.invoice_url} target="_blank" rel="noopener noreferrer" className="inline-flex p-4 rounded-2xl bg-white/5 text-white/20 border border-white/5 hover:text-primary group-hover:border-primary/20 transition-all shadow-2xl">
                                                 <DownloadIcon className="w-5 h-5"/>
                                             </a>
                                         ) : <div className="text-[10px] text-white/5 font-black uppercase tracking-widest">Protocol Sealed</div>}
                                     </td>
                                 </tr>
                             )}) : (
                                 <tr><td colSpan={7} className="p-40 text-center text-white/10 italic text-lg uppercase tracking-widest font-serif">No transaction nodes detected for current filter</td></tr>
                             )}
                        </tbody>
                     </table>
                </div>
            </div>

            {isAddModalOpen && <AddExpenseModal branches={branches} branchId={branchId} onClose={() => setIsAddModalOpen(false)} onSave={() => { fetchExpenses(); onRefresh(); }} />}
        </div>
    );
};

export default ExpenseDashboard;