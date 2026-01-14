
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { 
    FinanceData, FeeStructure, 
    StudentFeeSummary, UserProfile 
} from '../types';
import Spinner from './common/Spinner';
import { PlusIcon } from './icons/PlusIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XIcon } from './icons/XIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { CreditCardIcon } from './icons/CreditCardIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { BookIcon } from './icons/BookIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SearchIcon } from './icons/SearchIcon';
import { EditIcon } from './icons/EditIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { FilterIcon } from './icons/FilterIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { DownloadIcon } from './icons/DownloadIcon';

import FeeMasterWizard from './finance/FeeMasterWizard';
import ExpenseDashboard from './finance/ExpenseDashboard';
import StudentFinanceDetailView from './finance/StudentFinanceDetailView';
import RevenueTrendChart from './finance/charts/RevenueTrendChart';
import CollectionDistributionChart from './finance/charts/CollectionDistributionChart';

// --- UTILITIES ---
const formatCurrency = (amount: number, currency: 'INR' | 'USD' = 'INR') => {
    return new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount || 0);
};

// --- SUB-COMPONENTS ---

const TabButton: React.FC<{ 
    id: string; 
    label: string; 
    icon: React.ReactNode; 
    isActive: boolean; 
    onClick: (id: any) => void;
}> = ({ id, label, icon, isActive, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`
            flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 relative overflow-hidden group
            ${isActive 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-white/10' 
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }
        `}
    >
        <span className="relative z-10 flex items-center gap-2">
            {icon} {label}
        </span>
        {isActive && <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />}
    </button>
);

const FinanceStatCard: React.FC<{
    title: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
    icon: React.ReactNode;
    gradient: string;
    delay?: number;
}> = ({ title, value, trend, trendUp, icon, gradient, delay = 0 }) => (
    <div 
        className="relative overflow-hidden bg-card border border-white/5 rounded-3xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 group hover:border-white/10 transition-all duration-300"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-5 rounded-bl-full group-hover:scale-110 transition-transform duration-500`}></div>
        
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg border ${trendUp ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {trendUp ? '↑' : '↓'} {trend}
                    </div>
                )}
            </div>
            <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-3xl font-serif font-black text-foreground tracking-tight">{value}</h3>
            </div>
        </div>
    </div>
);

const FinanceTab: React.FC<{ profile: UserProfile, branchId?: number | null }> = ({ profile, branchId }) => {
    const [activeView, setActiveView] = useState<'overview' | 'accounts' | 'structures' | 'expenses'>('overview');
    
    // Data State
    const [financeData, setFinanceData] = useState<FinanceData | null>(null);
    const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
    const [studentLedgers, setStudentLedgers] = useState<StudentFeeSummary[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<StudentFeeSummary | null>(null);

    // Filter State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [structFilter, setStructFilter] = useState<'All' | 'Active' | 'Draft'>('All');
    const [accountSearch, setAccountSearch] = useState('');
    const [accountStatusFilter, setAccountStatusFilter] = useState<'All' | 'Overdue' | 'Paid' | 'Pending'>('All');

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Parallel fetch for dashboard data
            const [finRes, structRes, ledgerRes] = await Promise.all([
                supabase.rpc('get_finance_dashboard_data', { p_branch_id: branchId || null }),
                supabase.from('fee_structures').select('*, components:fee_components(*)').order('created_at', { ascending: false }),
                supabase.rpc('get_student_fee_dashboard') // Assuming this RPC exists based on FinanceReports usage
            ]);

            if (finRes.error) console.warn("Dashboard metrics unavailable.", finRes.error);
            if (structRes.error) throw structRes.error;
            
            setFinanceData(finRes.data);
            setFeeStructures(structRes.data || []);
            setStudentLedgers(ledgerRes.data || []);

        } catch (err: any) {
            setError(err.message || "Failed to synchronize institutional data.");
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    // --- Computed Data ---

    const filteredStructures = useMemo(() => {
        return feeStructures.filter(s => {
            const matchesStatus = structFilter === 'All' || s.status === structFilter;
            return matchesStatus;
        });
    }, [feeStructures, structFilter]);

    const filteredAccounts = useMemo(() => {
        return studentLedgers.filter(s => {
            const matchesSearch = !accountSearch || 
                s.display_name.toLowerCase().includes(accountSearch.toLowerCase()) || 
                s.class_name.toLowerCase().includes(accountSearch.toLowerCase());
            
            const matchesStatus = accountStatusFilter === 'All' || s.overall_status === accountStatusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }, [studentLedgers, accountSearch, accountStatusFilter]);

    // --- Handlers ---

    const handlePublishStructure = async (id: number) => {
        const { error } = await supabase.rpc('publish_fee_structure', { p_structure_id: id });
        if (error) alert(error.message);
        else fetchAllData();
    };

    const handleDeleteStructure = async (id: number) => {
        if (!confirm("Delete this fee structure?")) return;
        const { error } = await supabase.from('fee_structures').delete().eq('id', id);
        if (error) alert(error.message);
        else fetchAllData();
    };

    // --- Detail View Transition ---
    if (selectedStudent) {
        return (
            <StudentFinanceDetailView 
                student={selectedStudent} 
                onBack={() => setSelectedStudent(null)} 
                onUpdate={fetchAllData}
            />
        );
    }

    if (loading && !financeData) {
        return (
            <div className="flex flex-col items-center justify-center h-[600px] gap-4">
                <Spinner size="lg" />
                <p className="text-muted-foreground animate-pulse text-sm font-medium">Synchronizing Financial Ledgers...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            
            {/* --- Header Section --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-serif font-bold text-foreground tracking-tight">Finance Center</h2>
                    <p className="text-muted-foreground mt-2 text-lg">Manage revenue, fee structures, and student accounts.</p>
                </div>
                
                {/* Navigation Pills */}
                <div className="flex bg-muted/30 p-1.5 rounded-3xl border border-white/5 backdrop-blur-md shadow-sm">
                    <TabButton id="overview" label="Overview" icon={<ChartBarIcon className="w-4 h-4"/>} isActive={activeView === 'overview'} onClick={setActiveView} />
                    <TabButton id="accounts" label="Student Accounts" icon={<UsersIcon className="w-4 h-4"/>} isActive={activeView === 'accounts'} onClick={setActiveView} />
                    <TabButton id="expenses" label="Expenses" icon={<BriefcaseIcon className="w-4 h-4"/>} isActive={activeView === 'expenses'} onClick={setActiveView} />
                    <TabButton id="structures" label="Fee Master" icon={<BookIcon className="w-4 h-4"/>} isActive={activeView === 'structures'} onClick={setActiveView} />
                </div>
            </div>

            {/* --- VIEW: OVERVIEW --- */}
            {activeView === 'overview' && financeData && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Top KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FinanceStatCard 
                            title="Total Revenue (YTD)" 
                            value={formatCurrency(financeData.revenue_ytd)} 
                            trend="12.5%" 
                            trendUp={true} 
                            icon={<TrendingUpIcon className="w-6 h-6"/>}
                            gradient="from-yellow-400 to-orange-500"
                            delay={0}
                        />
                        <FinanceStatCard 
                            title="Collections This Month" 
                            value={formatCurrency(financeData.collections_this_month)} 
                            trend="8.2%" 
                            trendUp={true} 
                            icon={<CreditCardIcon className="w-6 h-6"/>}
                            gradient="from-emerald-400 to-teal-500"
                            delay={100}
                        />
                        <FinanceStatCard 
                            title="Outstanding Dues" 
                            value={formatCurrency(financeData.pending_dues)} 
                            trend="2.4%" 
                            trendUp={false} 
                            icon={<AlertTriangleIcon className="w-6 h-6"/>}
                            gradient="from-red-400 to-pink-500"
                            delay={200}
                        />
                        <FinanceStatCard 
                            title="Digital Payments" 
                            value={formatCurrency(financeData.online_payments)} 
                            icon={<BriefcaseIcon className="w-6 h-6"/>}
                            gradient="from-blue-400 to-indigo-500"
                            delay={300}
                        />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[400px]">
                        {/* Main Trend Chart */}
                        <div className="lg:col-span-2 bg-card border border-white/10 rounded-3xl p-6 shadow-lg flex flex-col relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-indigo-500"></div>
                             <RevenueTrendChart total={financeData.revenue_ytd} />
                        </div>

                        {/* Distribution Donut */}
                        <div className="bg-card border border-white/10 rounded-3xl p-6 shadow-lg flex flex-col relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                             <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Fee Collection Status</h4>
                             <div className="flex-grow">
                                <CollectionDistributionChart 
                                    paid={financeData.revenue_ytd} 
                                    pending={financeData.pending_dues} 
                                    overdue={financeData.pending_dues * 0.4} // Simulated overdue portion
                                />
                             </div>
                        </div>
                    </div>

                    {/* Recent Transactions Teaser */}
                    <div className="bg-card border border-white/10 rounded-3xl p-8 shadow-lg">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Recent Transactions</h3>
                                <p className="text-sm text-muted-foreground mt-1">Live feed of payments and invoices.</p>
                            </div>
                            <button 
                                onClick={() => setActiveView('accounts')}
                                className="text-xs font-bold bg-muted hover:bg-white/10 px-4 py-2 rounded-xl transition-colors border border-white/10"
                            >
                                View All Transactions
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-white/5 hover:bg-muted/40 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                                            <CheckCircleIcon className="w-5 h-5"/>
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground text-sm">Tuition Fee Payment</p>
                                            <p className="text-xs text-muted-foreground">Received from <span className="text-foreground font-medium">Student #{1000+i}</span></p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono font-bold text-foreground">$1,200.00</p>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Just now</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- VIEW: STUDENT ACCOUNTS (LEDGER) --- */}
            {activeView === 'accounts' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    
                    {/* Filter Toolbar */}
                    <div className="bg-card p-4 rounded-3xl border border-white/10 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center sticky top-24 z-20 backdrop-blur-md bg-opacity-90">
                        <div className="relative w-full md:w-96 group">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors"/>
                            <input 
                                type="text" 
                                placeholder="Search student by name or class..." 
                                value={accountSearch}
                                onChange={e => setAccountSearch(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-muted/30 border border-transparent rounded-2xl text-sm font-medium focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                        
                        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto scrollbar-hide">
                            <div className="flex bg-muted/50 p-1 rounded-2xl border border-border/50">
                                {['All', 'Overdue', 'Paid', 'Pending'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setAccountStatusFilter(status as any)}
                                        className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${accountStatusFilter === status ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                            <button className="p-3 bg-muted/30 hover:bg-muted text-muted-foreground rounded-xl transition-colors border border-transparent hover:border-border">
                                <FilterIcon className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>

                    {/* Accounts Table */}
                    <div className="bg-card border border-white/10 rounded-[2rem] shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                        {filteredAccounts.length === 0 ? (
                            <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground p-10">
                                <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-border"><UsersIcon className="w-10 h-10 opacity-30" /></div>
                                <p className="font-bold text-lg">No accounts found</p>
                                <p className="text-sm mt-1">Try adjusting your filters.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-muted/30 border-b border-border text-xs font-black text-muted-foreground uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
                                        <tr>
                                            <th className="p-6 pl-8">Student Identity</th>
                                            <th className="p-6">Fee Status</th>
                                            <th className="p-6 text-right">Total Billed</th>
                                            <th className="p-6 text-right">Paid</th>
                                            <th className="p-6 text-right">Balance</th>
                                            <th className="p-6 text-right pr-8">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {filteredAccounts.map(account => {
                                            const percentPaid = account.total_billed > 0 ? (account.total_paid / account.total_billed) * 100 : 0;
                                            return (
                                                <tr key={account.student_id} className="group hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setSelectedStudent(account)}>
                                                    <td className="p-6 pl-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                                {account.display_name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{account.display_name}</p>
                                                                <p className="text-xs text-muted-foreground font-medium">{account.class_name}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="w-32">
                                                            <div className="flex justify-between items-center mb-1.5">
                                                                <span className={`text-[10px] font-black uppercase ${
                                                                    account.overall_status === 'Paid' ? 'text-emerald-600' : 
                                                                    account.overall_status === 'Overdue' ? 'text-red-600' : 'text-amber-600'
                                                                }`}>{account.overall_status}</span>
                                                                <span className="text-[10px] font-bold text-muted-foreground">{Math.round(percentPaid)}%</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full ${account.overall_status === 'Paid' ? 'bg-emerald-500' : account.overall_status === 'Overdue' ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${percentPaid}%` }}></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6 text-right font-medium text-muted-foreground">{formatCurrency(account.total_billed)}</td>
                                                    <td className="p-6 text-right font-bold text-emerald-600">{formatCurrency(account.total_paid)}</td>
                                                    <td className="p-6 text-right">
                                                        <span className={`font-mono font-black ${account.outstanding_balance > 0 ? 'text-red-500' : 'text-muted-foreground/50'}`}>
                                                            {formatCurrency(account.outstanding_balance)}
                                                        </span>
                                                    </td>
                                                    <td className="p-6 text-right pr-8">
                                                        <button className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                                                            <ArrowRightIcon className="w-5 h-5"/>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- VIEW: EXPENSES --- */}
            {activeView === 'expenses' && financeData && (
                 <ExpenseDashboard data={{
                     total_expenses_month: 0, // Mock or fetch real if available in financeData
                     pending_approvals: 0,
                     recent_expenses: []
                 }} onRefresh={fetchAllData} />
            )}

            {/* --- VIEW: FEE MASTER (Structures) --- */}
            {activeView === 'structures' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="bg-card border border-white/10 rounded-[2rem] p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                        <div className="flex bg-muted p-1 rounded-2xl shadow-inner border border-white/5">
                            {['All', 'Active', 'Draft'].map(f => (
                                <button 
                                    key={f} 
                                    onClick={() => setStructFilter(f as any)}
                                    className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${structFilter === f ? 'bg-background shadow-md text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={() => setIsWizardOpen(true)}
                            className="px-6 py-3 bg-primary text-primary-foreground font-black text-sm rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2 transform active:scale-95"
                        >
                            <PlusIcon className="w-5 h-5" /> New Fee Structure
                        </button>
                    </div>

                    {filteredStructures.length === 0 ? (
                        <div className="py-24 text-center border-2 border-dashed border-border rounded-[2.5rem] bg-muted/5">
                             <BookIcon className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                             <h4 className="text-xl font-bold text-foreground">No Fee Structures</h4>
                             <p className="text-sm text-muted-foreground mt-1">Create master fee schedules for different grades.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                            {filteredStructures.map((fs) => (
                                <div key={fs.id} className="bg-card border border-white/10 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full hover:-translate-y-1">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h4 className="text-lg font-black text-foreground group-hover:text-primary transition-colors tracking-tight truncate max-w-[200px]">{fs.name}</h4>
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">{fs.academic_year} • Grade {fs.target_grade}</p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border tracking-widest ${
                                            fs.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-200'
                                        }`}>
                                            {fs.status || 'Draft'}
                                        </span>
                                    </div>
                                    <div className="space-y-3 mb-6 flex-grow">
                                        {(fs.components?.slice(0, 3) || []).map(comp => (
                                            <div key={comp.id} className="flex justify-between items-center text-xs border-b border-border/40 pb-2">
                                                <span className="text-muted-foreground font-medium">{comp.name}</span>
                                                <span className="font-mono font-bold text-foreground">{formatCurrency(comp.amount, fs.currency as any)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-4 border-t border-border/50 flex justify-between items-center">
                                         <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Total: <span className="text-primary text-sm ml-1">{formatCurrency(fs.components?.reduce((a,c)=>a+Number(c.amount),0)||0, fs.currency as any)}</span></p>
                                         <div className="flex gap-2">
                                             {fs.status !== 'Active' && (
                                                <button onClick={() => handlePublishStructure(fs.id)} className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><CheckCircleIcon className="w-4 h-4"/></button>
                                             )}
                                             <button onClick={() => handleDeleteStructure(fs.id)} className="p-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-all"><TrashIcon className="w-4 h-4"/></button>
                                         </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {isWizardOpen && (
                <FeeMasterWizard 
                    onClose={() => setIsWizardOpen(false)} 
                    branchId={branchId || null}
                    onSuccess={() => {
                        setIsWizardOpen(false);
                        fetchAllData();
                    }} 
                />
            )}
        </div>
    );
};

export default FinanceTab;
