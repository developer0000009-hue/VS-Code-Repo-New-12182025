
import React, { useState, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { ExpenseDashboardData, Expense } from '../../types';
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

const EXPENSE_CATEGORIES = [
    'Salaries', 'Utilities', 'Transport', 'Lab & Supplies', 'Maintenance', 'Events', 'Marketing', 'Administrative', 'Other'
];

interface ExpenseDashboardProps {
    data: ExpenseDashboardData;
    onRefresh: () => void;
}

const ExpenseDashboard: React.FC<ExpenseDashboardProps> = ({ data, onRefresh }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [updatingStatus, setUpdatingStatus] = useState<Record<number, boolean>>({});
    
    const filteredExpenses = useMemo(() => {
        return (data.recent_expenses || []).filter(exp => {
            const matchesSearch = searchTerm === '' || 
                exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exp.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === 'All' || exp.category === filterCategory;
            const matchesStatus = filterStatus === 'All' || exp.status === filterStatus;
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [data.recent_expenses, searchTerm, filterCategory, filterStatus]);

    const handleStatusUpdate = async (expenseId: number, newStatus: 'Approved' | 'Rejected') => {
        setUpdatingStatus(prev => ({ ...prev, [expenseId]: true }));
        try {
            const { error } = await supabase.rpc('update_expense_status', {
                p_expense_id: expenseId,
                p_new_status: newStatus
            });
            if (error) throw error;
            onRefresh();
        } catch (err: any) {
            alert(`Failed to update status: ${err.message}`);
        } finally {
            setUpdatingStatus(prev => ({ ...prev, [expenseId]: false }));
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-foreground">Expense Management</h3>
                    <p className="text-sm text-muted-foreground">Track and manage all school expenditures.</p>
                </div>
                <div className="flex items-center gap-2">
                     <button onClick={() => alert('Feature coming soon!')} className="btn-secondary text-xs"><BuildingIcon className="w-4 h-4"/> Manage Vendors</button>
                     <button onClick={() => alert('Feature coming soon!')} className="btn-secondary text-xs"><DownloadIcon className="w-4 h-4"/> Export Report</button>
                     <button onClick={() => setIsAddModalOpen(true)} className="btn-primary text-sm"><PlusIcon className="w-4 h-4"/> Add Expense</button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Expenses (This Month)</h3>
                    <p className="text-3xl font-black text-foreground mt-2">${data.total_expenses_month.toLocaleString()}</p>
                </div>
                 <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Pending Approvals</h3>
                    <p className="text-3xl font-black text-foreground mt-2">{data.pending_approvals}</p>
                </div>
                 <div className="bg-card p-6 rounded-xl border border-border shadow-sm col-span-1 lg:col-span-2">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Quick Actions</h3>
                    <div className="mt-4 flex items-center gap-4">
                        <p className="text-sm text-muted-foreground">This section will contain quick insights or actions.</p>
                    </div>
                </div>
            </div>

            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                    <div className="relative w-full md:w-1/3">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                        <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-background border border-input rounded-lg text-sm"/>
                    </div>
                    <div className="flex items-center gap-2">
                        <FilterIcon className="w-4 h-4 text-muted-foreground"/>
                        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="py-2 bg-background border border-input rounded-lg text-sm">
                            <option value="All">All Categories</option>
                            {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                         <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="py-2 bg-background border border-input rounded-lg text-sm">
                            <option value="All">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                </div>
                
                <div className="overflow-x-auto mt-4">
                     <table className="min-w-full text-sm">
                        <thead className="text-xs uppercase text-muted-foreground bg-muted/50">
                            <tr>
                                <th className="p-3">Date</th>
                                <th className="p-3">Category</th>
                                <th className="p-3">Description</th>
                                <th className="p-3">Vendor</th>
                                <th className="p-3 text-right">Amount</th>
                                <th className="p-3 text-center">Status</th>
                                <th className="p-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                             {filteredExpenses.length > 0 ? filteredExpenses.map(exp => {
                                 const isUpdating = updatingStatus[exp.id];
                                 return (
                                 <tr key={exp.id} className="hover:bg-muted/30">
                                     <td className="p-3 whitespace-nowrap">{new Date(exp.expense_date).toLocaleDateString()}</td>
                                     <td className="p-3"><span className="px-2 py-1 bg-muted rounded text-xs font-semibold">{exp.category}</span></td>
                                     <td className="p-3">{exp.description}</td>
                                     <td className="p-3">{exp.vendor_name}</td>
                                     <td className="p-3 text-right font-semibold">${exp.amount.toLocaleString()}</td>
                                     <td className="p-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-bold ${exp.status === 'Approved' ? 'bg-green-100 text-green-700' : exp.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{exp.status}</span></td>
                                     <td className="p-3 text-center">
                                         {exp.status === 'Pending' ? (
                                             <div className="flex justify-center items-center gap-2">
                                                 <button disabled={isUpdating} onClick={() => handleStatusUpdate(exp.id, 'Approved')} className="p-1.5 rounded-md bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50">
                                                     {isUpdating ? <Spinner size="sm"/> : <CheckCircleIcon className="w-4 h-4"/>}
                                                 </button>
                                                 <button disabled={isUpdating} onClick={() => handleStatusUpdate(exp.id, 'Rejected')} className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50">
                                                      {isUpdating ? <Spinner size="sm"/> : <XCircleIcon className="w-4 h-4"/>}
                                                 </button>
                                             </div>
                                         ) : exp.invoice_url ? (
                                              <a href={exp.invoice_url} target="_blank" rel="noopener noreferrer" className="inline-block p-1.5 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200">
                                                 <DownloadIcon className="w-4 h-4"/>
                                             </a>
                                         ) : null}
                                     </td>
                                 </tr>
                             )}) : (
                                 <tr><td colSpan={7} className="text-center p-8 text-muted-foreground">No expenses match your filters.</td></tr>
                             )}
                        </tbody>
                     </table>
                </div>
            </div>

            {isAddModalOpen && <AddExpenseModal onClose={() => setIsAddModalOpen(false)} onSave={onRefresh} />}
        </div>
    );
};

export default ExpenseDashboard;
