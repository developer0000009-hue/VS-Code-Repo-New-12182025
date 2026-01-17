import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, formatError } from './services/supabase';
import { 
    FinanceData, FeeStructure, 
    StudentFeeSummary, UserProfile, SchoolBranch
} from './types';
import Spinner from './components/common/Spinner';
import { PlusIcon } from './components/icons/PlusIcon';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';
import { TrendingUpIcon } from './components/icons/TrendingUpIcon';
import { CreditCardIcon } from './components/icons/CreditCardIcon';
import { UsersIcon } from './components/icons/UsersIcon';
import { ChartBarIcon } from './components/icons/ChartBarIcon';
import { BookIcon } from './components/icons/BookIcon';
import { SearchIcon } from './components/icons/SearchIcon';
import { EditIcon } from './components/icons/EditIcon';
import { AlertTriangleIcon } from './components/icons/AlertTriangleIcon';
import { BriefcaseIcon } from './components/icons/BriefcaseIcon';
import { ArrowRightIcon } from './components/icons/ArrowRightIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { GoogleGenAI } from '@google/genai';

import FeeMasterWizard from './components/finance/FeeMasterWizard';
import ExpenseDashboard from './components/finance/ExpenseDashboard';
import StudentFinanceDetailView from './components/finance/StudentFinanceDetailView';
import RevenueTrendChart from './components/finance/charts/RevenueTrendChart';
import CollectionDistributionChart from './components/finance/charts/CollectionDistributionChart';
import { StatsSkeleton, ListSkeleton } from './components/common/Skeleton';

const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: currency === 'USD' ? 'USD' : 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount || 0);
};

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
            flex items-center gap-3 px-10 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 relative overflow-hidden group
            ${isActive 
                ? 'bg-primary text-white shadow-[0_12px_40px_rgba(var(--primary),0.3)] ring-1 ring-white/20 scale-105 z-10' 
                : 'text-white/20 hover:text-white/50 hover:bg-white/5'
            }
        `}
    >
        <span className="relative z-10 flex items-center gap-3">
            {icon} {label}
        </span>
    </button>
);

const FinanceStatCard: React.FC<{
    title: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
    icon: React.ReactNode;
    color: string;
}> = ({ title, value, icon, trend, trendUp, color }) => (
    <div className="relative overflow-hidden bg-[#0c0d12] border border-white/5 rounded-[2.8rem] p-10 shadow-2xl group hover:border-primary/20 transition-all duration-500">
        <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-[0.03] rounded-bl-full group-hover:scale-110 transition-transform duration-1000`}></div>
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-12">
                <div className={`p-4 rounded-2xl bg-white/5 text-white/30 border border-white/10 group-hover:text-primary transition-colors`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${trendUp ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]'}`}>
                        {trendUp ? '↑' : '↓'} {trend}
                    </div>
                )}
            </div>
            <div>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-4">{title}</p>
                <h3 className="text-5xl font-serif font-black text-white tracking-tighter leading-none">{value}</h3>
            </div>
        </div>
    </div>
);

const FinanceTab: React.FC<{ profile: UserProfile, branchId?: number | null, branches: SchoolBranch[] }> = ({ profile, branchId, branches }) => {
    const [activeView, setActiveView] = useState<'overview' | 'accounts' | 'expenses' | 'master'>('overview');
    const [financeData, setFinanceData] = useState<FinanceData | null>(null);
    const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
    const [studentLedgers, setStudentLedgers] = useState<StudentFeeSummary[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<StudentFeeSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [accountSearch, setAccountSearch] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const bid = (branchId === undefined || branchId === null) ? null : Number(branchId);
            const rpcParams = { p_branch_id: bid };

            let structQuery = supabase.from('fee_structures')
                .select('*, components:fee_components(*)')
                .order('created_at', { ascending: false });

            if (bid !== null) {
                structQuery = structQuery.eq('branch_id', bid);
            }

            const [finRes, structRes, ledgerRes] = await Promise.all([
                supabase.rpc('get_finance_dashboard_data', rpcParams),
                structQuery,
                supabase.rpc('get_student_fee_summary_all', rpcParams) 
            ]);

            if (finRes.error) throw finRes.error;
            if (structRes.error) throw structRes.error;
            if (ledgerRes.error) throw ledgerRes.error;

            setFinanceData(finRes.data || { revenue_ytd: 0, pending_dues: 0, collections_this_month: 0, online_payments: 0 });
            setFeeStructures(structRes.data || []);
            setStudentLedgers(Array.isArray(ledgerRes.data) ? ledgerRes.data : []);
            
        } catch (err: any) {
            console.error("Finance Registry Sync Failure:", err);
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const runFinancialOracle = async () => {
        if (!financeData) return;
        setIsAnalyzing(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Act as an institutional CFO. Analyze these school stats: Revenue YTD: ${financeData.revenue_ytd}, Pending Dues: ${financeData.pending_dues}, Online Sync Rate: ${financeData.online_payments}. Provide a 25-word strategic insight on institutional liquidity and collection risk. Use professional, architectural tone.`;
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: prompt
            });
            setAiInsight(response.text || "Synchronizing insights...");
        } catch (e) {
            setAiInsight("AI context currently unavailable.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const filteredAccounts = useMemo(() => {
        return studentLedgers.filter(s => 
            !accountSearch || 
            s.display_name.toLowerCase().includes(accountSearch.toLowerCase()) || 
            (s.class_name && s.class_name.toLowerCase().includes(accountSearch.toLowerCase()))
        );
    }, [studentLedgers, accountSearch]);

    if (selectedStudent) {
        return (
            <StudentFinanceDetailView 
                student={selectedStudent} 
                onBack={() => setSelectedStudent(null)} 
                onUpdate={fetchAllData}
            />
        );
    }

    return (
        <div className="space-y-20 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
                <div>
                    <h2 className="text-[clamp(40px,5vw,72px)] font-serif font-black text-white tracking-tighter uppercase leading-[0.85]">
                        FINANCE <span className="text-white/20 italic lowercase">center.</span>
                    </h2>
                    <p className="text-white/40 mt-6 text-2xl font-serif italic border-l-2 border-white/5 pl-8 max-w-xl">
                        Node Economy & Institutional Burn Rate Monitor.
                    </p>
                </div>
                
                <div className="flex bg-[#12141c]/60 p-2 rounded-[2.5rem] border border-white/5 backdrop-blur-md shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] ring-1 ring-white/5">
                    <TabButton id="overview" label="Overview" icon={<ChartBarIcon className="w-4 h-4"/>} isActive={activeView === 'overview'} onClick={setActiveView} />
                    <TabButton id="accounts" label="Accounts" icon={<UsersIcon className="w-4 h-4"/>} isActive={activeView === 'accounts'} onClick={setActiveView} />
                    <TabButton id="expenses" label="Expenses" icon={<BriefcaseIcon className="w-4 h-4"/>} isActive={activeView === 'expenses'} onClick={setActiveView} />
                    <TabButton id="master" label="Master" icon={<BookIcon className="w-4 h-4"/>} isActive={activeView === 'master'} onClick={setActiveView} />
                </div>
            </div>

            {loading ? (
                <div className="space-y-12">
                    <StatsSkeleton />
                    <ListSkeleton rows={8} />
                </div>
            ) : error ? (
                <div className="p-20 text-center flex flex-col items-center gap-6">
                    <div className="p-5 bg-red-500/10 rounded-3xl border border-red-500/20 text-red-500">
                        <AlertTriangleIcon className="w-10 h-10" />
                    </div>
                    <h3 className="text-3xl font-serif font-black text-white uppercase tracking-tight">Sync Protocol Fault</h3>
                    <p className="text-white/40 max-w-lg leading-relaxed font-serif italic">{error}</p>
                    {error.includes("does not exist") && (
                        <p className="text-amber-500 text-xs font-bold uppercase tracking-widest bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20 animate-pulse">Action Required: Apply v23.1.3 SQL Migration in Supabase SQL Editor.</p>
                    )}
                    <button onClick={() => fetchAllData()} className="px-10 py-4 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/90 transition-all">Retry Handshake</button>
                </div>
            ) : (
                <>
                    {/* --- OVERVIEW VIEW --- */}
                    {/* FIX: Changed 'activeTab' to 'activeView' to match the state variable name and resolve the 'Cannot find name' error. */}
                    {activeView === 'overview' && financeData && (
                        <div className="space-y-16 animate-in fade-in duration-1000">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <FinanceStatCard 
                                    title="Revenue (YTD)" 
                                    value={formatCurrency(financeData.revenue_ytd)} 
                                    trend="+12.5%" 
                                    trendUp={true} 
                                    icon={<TrendingUpIcon className="w-8 h-8"/>}
                                    color="bg-primary"
                                />
                                <FinanceStatCard 
                                    title="Pending Ledger" 
                                    value={formatCurrency(financeData.pending_dues)} 
                                    trend="2.4%" 
                                    trendUp={false} 
                                    icon={<AlertTriangleIcon className="w-8 h-8"/>}
                                    color="bg-red-500"
                                />
                                 <FinanceStatCard 
                                    title="Digital Stream" 
                                    value={formatCurrency(financeData.online_payments)} 
                                    icon={<CreditCardIcon className="w-8 h-8"/>}
                                    color="bg-emerald-500"
                                />
                                <FinanceStatCard 
                                    title="Institutional Burn" 
                                    value={formatCurrency(0)} 
                                    icon={<BriefcaseIcon className="w-8 h-8"/>}
                                    color="bg-violet-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
                                <div className="lg:col-span-8 space-y-10">
                                     <div className="bg-[#0c0d12] border border-white/5 rounded-[4rem] p-16 shadow-[0_64px_128px_-24px_rgba(0,0,0,1)] relative overflow-hidden h-[540px] ring-1 ring-white/10">
                                          <RevenueTrendChart total={financeData.revenue_ytd} />
                                     </div>
                                     
                                     {/* AI Financial Oracle */}
                                     <div className="bg-primary/5 border border-primary/20 rounded-[3.5rem] p-12 relative overflow-hidden group shadow-2xl">
                                         <div className="absolute top-0 right-0 p-16 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"><SparklesIcon className="w-48 h-48 text-primary" /></div>
                                         <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                                            <div className="space-y-5 max-w-3xl">
                                                <h4 className="text-2xl font-serif font-black text-white uppercase tracking-tight flex items-center gap-4">
                                                    <SparklesIcon className="w-8 h-8 text-primary animate-pulse" /> Financial Oracle
                                                </h4>
                                                {aiInsight ? (
                                                    <p className="text-2xl text-white/80 leading-relaxed font-serif italic">"{aiInsight}"</p>
                                                ) : (
                                                    <p className="text-lg text-white/30 font-medium font-serif italic">Consult the institutional core to synthesize liquidity trends and collection risks.</p>
                                                )}
                                            </div>
                                            <button 
                                                onClick={runFinancialOracle}
                                                disabled={isAnalyzing}
                                                className="px-12 py-6 bg-primary text-white font-black text-xs uppercase tracking-[0.4em] rounded-2xl shadow-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-primary/20 ring-8 ring-primary/5 whitespace-nowrap"
                                            >
                                                {isAnalyzing ? <Spinner size="sm" className="text-white"/> : 'Sync Intelligence'}
                                            </button>
                                         </div>
                                     </div>
                                </div>
                                
                                <div className="lg:col-span-4 bg-[#0c0d12] border border-white/5 rounded-[4rem] p-16 shadow-[0_64px_128px_-24px_rgba(0,0,0,1)] flex flex-col relative overflow-hidden h-[740px] ring-1 ring-white/10">
                                     <div className="absolute top-0 right-0 p-16 opacity-[0.01]"><ChartBarIcon className="w-64 h-64 text-primary"/></div>
                                     <div className="relative z-10 h-full flex flex-col">
                                         <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mb-16">Collection Integrity</h4>
                                         <CollectionDistributionChart 
                                            paid={financeData.revenue_ytd} 
                                            pending={financeData.pending_dues} 
                                            overdue={financeData.pending_dues * 0.3} 
                                         />
                                     </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- ACCOUNTS VIEW --- */}
                    {activeView === 'accounts' && (
                        <div className="space-y-10 animate-in fade-in duration-700">
                            <div className="flex flex-col md:flex-row gap-8 justify-between items-center bg-[#0d0f14]/80 p-5 rounded-[2.8rem] border border-white/5 backdrop-blur-xl ring-1 ring-white/5 shadow-3xl">
                                <div className="relative w-full md:max-w-2xl group">
                                    <SearchIcon className="absolute left-8 top-1/2 -translate-y-1/2 h-6 w-6 text-white/10 group-focus-within:text-primary transition-colors duration-500"/>
                                    <input 
                                        type="text" 
                                        placeholder="SEARCH IDENTITY NODE OR CLASS BLOCK..." 
                                        value={accountSearch}
                                        onChange={e => setAccountSearch(e.target.value.toUpperCase())}
                                        className="w-full pl-20 pr-10 py-6 bg-black/40 border border-white/5 rounded-3xl text-[16px] font-black text-white focus:bg-black/60 outline-none uppercase tracking-[0.2em] shadow-inner placeholder:text-white/5 transition-all"
                                    />
                                </div>
                                <div className="flex gap-6">
                                     <button className="px-10 py-5 bg-white/5 hover:bg-white/10 text-white/30 border border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95">Export Ledger</button>
                                </div>
                            </div>

                            <div className="bg-[#0a0a0c] border border-white/10 rounded-[4rem] shadow-[0_64px_128px_-24px_rgba(0,0,0,1)] overflow-hidden min-h-[600px] ring-1 ring-white/10 relative">
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/[0.01] to-transparent pointer-events-none"></div>
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                                        <thead className="bg-[#0f1115]/90 border-b border-white/[0.06] text-[10px] font-black text-white/20 uppercase tracking-[0.5em] sticky top-0 z-10 backdrop-blur-3xl">
                                            <tr>
                                                <th className="p-12 pl-16 font-black">Identity Node</th>
                                                <th className="p-12">Integrity Score</th>
                                                <th className="p-12 text-right">Lifetime Billed</th>
                                                <th className="p-12 text-right">Synchronized</th>
                                                <th className="p-12 text-right pr-16">Operations</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.04] relative z-10">
                                            {filteredAccounts.map((account, idx) => {
                                                const percentPaid = account.total_billed > 0 ? (account.total_paid / account.total_billed) * 100 : 0;
                                                return (
                                                    <tr key={account.student_id} className="group hover:bg-white/[0.015] transition-all duration-700 cursor-pointer" onClick={() => setSelectedStudent(account)}>
                                                        <td className="p-12 pl-16">
                                                            <div className="flex items-center gap-8">
                                                                <div className="w-[84px] h-[84px] rounded-[2.2rem] bg-gradient-to-br from-indigo-500/10 to-purple-600/10 flex items-center justify-center text-indigo-400 font-serif font-black text-3xl border border-white/5 shadow-2xl group-hover:scale-110 transition-transform duration-1000 group-hover:rotate-2">
                                                                    {account.display_name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-serif font-black text-white text-[22px] group-hover:text-primary transition-colors uppercase tracking-tight leading-none mb-3">{account.display_name}</p>
                                                                    <p className="text-[11px] text-white/20 font-black uppercase tracking-[0.4em]">{account.class_name || 'UNASSIGNED_CONTEXT'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-12">
                                                            <div className="w-64">
                                                                <div className="flex justify-between items-center mb-4">
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${percentPaid >= 100 ? 'text-emerald-500' : 'text-white/40'}`}>{account.overall_status}</span>
                                                                    <span className="text-[11px] font-mono font-bold text-white/30">{Math.round(percentPaid)}%</span>
                                                                </div>
                                                                <div className="h-2 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5 p-0.5 shadow-inner">
                                                                    <div className={`h-full rounded-full transition-all duration-2000 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[0_0_15px_rgba(var(--primary),0.5)] bg-primary`} style={{ width: `${percentPaid}%` }}></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-12 text-right font-mono font-black text-2xl text-white/20 tracking-tighter">{formatCurrency(account.total_billed, account.currency || 'INR')}</td>
                                                        <td className="p-12 text-right">
                                                            <p className="font-mono font-black text-4xl text-emerald-500 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)] tracking-tighter">{formatCurrency(account.total_paid, account.currency || 'INR')}</p>
                                                            <p className="text-[9px] font-black text-white/10 uppercase tracking-widest mt-2">Capital Finalized</p>
                                                        </td>
                                                        <td className="p-12 text-right pr-16">
                                                            <button className="p-6 rounded-[2rem] bg-white/[0.03] text-white/10 group-hover:text-primary group-hover:bg-primary/10 border border-transparent group-hover:border-primary/20 transition-all shadow-3xl active:scale-90 group-hover:shadow-primary/5">
                                                                <ArrowRightIcon className="w-8 h-8 group-hover:translate-x-1 transition-transform"/>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {filteredAccounts.length === 0 && (
                                                <tr><td colSpan={5} className="p-60 text-center text-white/5 uppercase font-black tracking-[0.8em] italic text-2xl">No Active Ledger Context</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- EXPENSES VIEW --- */}
                    {activeView === 'expenses' && (
                         <ExpenseDashboard branches={branches} branchId={branchId || null} data={{ total_expenses_month: 0, pending_approvals: 0, recent_expenses: [] }} onRefresh={fetchAllData} />
                    )}

                    {/* --- MASTER ARCHITECT VIEW --- */}
                    {activeView === 'master' && (
                        <div className="space-y-16 animate-in fade-in duration-700">
                            <div className="bg-[#0c0d12] p-12 md:p-20 rounded-[4rem] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-16 shadow-[0_64px_128px_-24px_rgba(0,0,0,1)] ring-1 ring-white/10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-24 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000 group-hover:opacity-[0.06]"><SparklesIcon className="w-64 h-64 text-primary" /></div>
                                <div className="space-y-5 relative z-10">
                                    <h3 className="text-5xl font-serif font-black text-white uppercase tracking-tight">Master Architect</h3>
                                    <p className="text-xl text-white/20 font-medium tracking-[0.2em] uppercase max-w-2xl leading-relaxed">Configure global institutional billing nodes and multi-tenant fee structures.</p>
                                </div>
                                <button 
                                    onClick={() => setIsWizardOpen(true)}
                                    className="px-16 py-8 bg-primary text-white font-black text-sm uppercase tracking-[0.5em] rounded-[2.5rem] shadow-[0_48px_96px_-16px_rgba(var(--primary),0.6)] hover:bg-primary/90 transition-all flex items-center gap-6 transform hover:-translate-y-2 active:scale-95 border border-white/10 ring-[12px] ring-primary/5 relative z-10"
                                >
                                    <PlusIcon className="w-8 h-8" /> Provision Structure
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-12">
                                {feeStructures.map((fs) => (
                                    <div key={fs.id} className="bg-[#0c0d12] border border-white/10 rounded-[4.5rem] p-16 shadow-[0_64px_128px_-24px_rgba(0,0,0,1)] border border-primary/10 hover:border-primary/40 transition-all duration-1000 flex flex-col h-full group ring-1 ring-white/10 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-16 opacity-[0.01] pointer-events-none group-hover:opacity-[0.04] transition-opacity duration-1000"><BookIcon className="w-56 h-56 text-white"/></div>
                                        <div className="flex justify-between items-start mb-16 relative z-10">
                                            <div>
                                                <h4 className="text-4xl font-serif font-black text-white group-hover:text-primary transition-colors tracking-tight uppercase leading-none">{fs.name}</h4>
                                                <div className="flex items-center gap-4 mt-6">
                                                    <span className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em]">{fs.academic_year} Context</span>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                                                    <span className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em]">Grade {fs.target_grade}</span>
                                                </div>
                                            </div>
                                            <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${fs.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-2xl' : 'bg-white/5 text-white/20 border-white/10'}`}>{fs.status}</span>
                                        </div>
                                        
                                        <div className="space-y-8 mb-16 flex-grow relative z-10">
                                            {(fs.components || []).slice(0, 4).map((comp: any) => (
                                                <div key={comp.id} className="flex justify-between items-center border-b border-white/[0.04] pb-8">
                                                    <div className="space-y-1.5">
                                                        <span className="text-white/60 font-black uppercase tracking-[0.2em] text-[13px] block">{comp.name}</span>
                                                        <span className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em]">{comp.frequency} Cycle</span>
                                                    </div>
                                                    <span className="font-mono font-black text-white text-2xl tracking-tighter">{formatCurrency(comp.amount, fs.currency)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div className="pt-12 border-t border-white/[0.08] flex justify-between items-end mt-auto relative z-10">
                                             <div>
                                                <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] mb-3">Global Valuation (Annual)</p>
                                                <span className="text-5xl font-black text-primary font-mono tracking-tighter drop-shadow-[0_0_20px_rgba(var(--primary),0.3)]">{formatCurrency(fs.components?.reduce((a,c)=>a+Number(c.amount),0)||0, fs.currency)}</span>
                                             </div>
                                             <button className="p-5 bg-white/5 text-white/20 rounded-2xl hover:text-white hover:bg-white/10 transition-all shadow-3xl border border-transparent hover:border-white/10 active:scale-90"><EditIcon className="w-8 h-8"/></button>
                                        </div>
                                    </div>
                                ))}
                                {feeStructures.length === 0 && (
                                     <div className="col-span-full py-60 text-center flex flex-col items-center justify-center animate-in fade-in duration-1000 opacity-10 hover:opacity-20 transition-opacity grayscale group">
                                        <div className="w-48 h-48 rounded-[3.5rem] border-[3px] border-dashed border-white/20 flex items-center justify-center mb-12 bg-white/[0.01] group-hover:rotate-6 transition-all duration-1000">
                                            <BookIcon className="w-24 h-24 text-white" />
                                        </div>
                                        <p className="font-serif italic text-5xl uppercase tracking-[0.4em] text-white">Vault Registry Empty</p>
                                        <p className="text-[12px] font-black uppercase tracking-[0.8em] text-white mt-8">Initialize node protocols to populate ledger</p>
                                     </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
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