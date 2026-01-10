
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, formatError } from '../services/supabase';
import { Enquiry, EnquiryStatus } from '../types';
import Spinner from './common/Spinner';
import EnquiryDetailsModal from './EnquiryDetailsModal';
import { SearchIcon } from './icons/SearchIcon';
import { KeyIcon } from './icons/KeyIcon';
import { MailIcon } from './icons/MailIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ClockIcon } from './icons/ClockIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { FilterIcon } from './icons/FilterIcon';
import { UsersIcon } from './icons/UsersIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';

const statusColors: Record<string, string> = {
  'ENQUIRY_ACTIVE': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'ENQUIRY_VERIFIED': 'bg-teal-500/20 text-teal-400 border-teal-500/30 font-black shadow-[0_0_15px_rgba(45,212,191,0.1)]',
  'ENQUIRY_IN_PROGRESS': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'CONVERTED': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const statusLabels: Record<string, string> = {
  'ENQUIRY_ACTIVE': 'Active',
  'ENQUIRY_VERIFIED': 'Verified',
  'ENQUIRY_IN_PROGRESS': 'In Review',
  'CONVERTED': 'Converted',
};

type SortableKeys = 'applicant_name' | 'grade' | 'status' | 'updated_at';

interface EnquiryTabProps {
    branchId?: string | null;
    onNavigate?: (component: string) => void;
}

const StatBox: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string; desc: string }> = ({ title, value, icon, color, desc }) => (
    <div className="bg-[#0d0f14]/80 backdrop-blur-3xl border border-white/5 p-10 rounded-[3rem] shadow-2xl hover:shadow-primary/10 transition-all duration-700 group overflow-hidden relative ring-1 ring-white/5">
        <div className={`absolute -right-8 -top-8 w-48 h-48 ${color} opacity-[0.03] rounded-full blur-[100px] group-hover:opacity-[0.08] transition-opacity duration-1000`}></div>
        <div className="flex justify-between items-start relative z-10">
            <div className={`p-4 rounded-[1.25rem] bg-white/5 text-white/30 ring-1 ring-white/10 shadow-inner group-hover:scale-110 group-hover:text-primary transition-all duration-700`}>
                {icon}
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{desc}</div>
        </div>
        <div className="mt-12 relative z-10">
            <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">{title}</p>
            <h3 className="text-6xl font-serif font-black text-white tracking-tighter leading-none">{value}</h3>
        </div>
    </div>
);

const EnquiryTab: React.FC<EnquiryTabProps> = ({ branchId, onNavigate }) => {
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewingEnquiry, setViewingEnquiry] = useState<Enquiry | null>(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' }>({ key: 'updated_at', direction: 'descending' });

    const fetchEnquiries = useCallback(async (isSilent = false) => {
        if (branchId === undefined) {
            setLoading(false);
            return;
        }
        
        if (!isSilent) setLoading(true);
        setError(null);
        try {
            const { data, error: rpcError } = await supabase.rpc('get_all_enquiries', { 
                p_branch_id: branchId 
            });
            
            if (rpcError) throw rpcError;
            setEnquiries(data || []);
        } catch (err: any) {
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => {
        fetchEnquiries();

        const channel = supabase.channel(`enquiries-desk-sync-${branchId || 'master'}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries' }, (payload) => {
                const record = payload.new as any || payload.old as any;
                if (branchId === null || branchId === undefined || record.branch_id === branchId) {
                    fetchEnquiries(true);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchEnquiries, branchId]);
    
    const processedEnquiries = useMemo(() => {
        let data = enquiries.filter(enq => {
            const matchesStatus = !filterStatus || enq.status === filterStatus;
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || 
                enq.applicant_name.toLowerCase().includes(searchLower) ||
                (enq.parent_name || '').toLowerCase().includes(searchLower);
            return matchesStatus && matchesSearch;
        });

        data.sort((a, b) => {
            const aVal = a[sortConfig.key] || '';
            const bVal = b[sortConfig.key] || '';
            const factor = sortConfig.direction === 'ascending' ? 1 : -1;
            if (aVal < bVal) return -1 * factor;
            if (aVal > bVal) return 1 * factor;
            return 0;
        });
        
        return data;
    }, [enquiries, searchTerm, filterStatus, sortConfig]);

    const stats = useMemo(() => ({
        total: enquiries.length,
        verified: enquiries.filter(e => e.status === 'ENQUIRY_VERIFIED').length,
        converted: enquiries.filter(e => e.status === 'CONVERTED').length
    }), [enquiries]);

    const handleSort = (key: SortableKeys) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending'
        }));
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-32">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
                <div className="max-w-3xl space-y-4">
                    <div className="flex items-center gap-3">
                         <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20 shadow-inner">
                            <SparklesIcon className="w-5 h-5"/>
                         </div>
                         <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em] pl-2 border-l border-primary/20">Operational Intelligence</span>
                    </div>
                    <h2 className="text-[clamp(40px,4vw,64px)] font-serif font-black text-white tracking-tighter uppercase leading-[0.9]">
                        ENQUIRY <span className="text-white/30 italic lowercase">desk.</span>
                    </h2>
                    <p className="text-white/40 text-[18px] leading-relaxed font-serif italic border-l border-white/5 pl-8">
                        Centralized workspace for managing inbound identity handshakes and verified institutional leads.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => fetchEnquiries()} 
                        disabled={loading}
                        className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] text-white/40 hover:text-white transition-all border border-white/5 group active:scale-95 shadow-2xl"
                    >
                        <RefreshIcon className={`w-6 h-6 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`}/>
                    </button>
                    {onNavigate && (
                        <button 
                            onClick={() => onNavigate('Code Verification')}
                            className="px-8 py-5 bg-primary text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 transform hover:-translate-y-1 active:scale-95 ring-4 ring-primary/10"
                        >
                            <KeyIcon className="w-5 h-5" /> Start Verification
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center justify-between shadow-xl animate-in shake">
                    <div className="flex items-center gap-4">
                        <AlertTriangleIcon className="w-8 h-8 text-red-500 shrink-0" />
                        <div>
                            <p className="text-xs font-black uppercase text-red-500 tracking-widest">Sync Failure</p>
                            <p className="text-sm font-bold text-red-200/70 mt-1">{error}</p>
                        </div>
                    </div>
                    <button onClick={() => fetchEnquiries()} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95">Retry Sync</button>
                </div>
            )}

            {/* Stats Deck */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StatBox title="Total Ledger" value={stats.total} icon={<MailIcon className="w-7 h-7"/>} color="bg-blue-500" desc="Total Nodes" />
                <StatBox title="Verified Stream" value={stats.verified} icon={<ShieldCheckIcon className="h-7 w-7"/>} color="bg-teal-500" desc="Clearance Active" />
                <StatBox title="PROMOTED" value={stats.converted} icon={<CheckCircleIcon className="h-7 w-7"/>} color="bg-emerald-500" desc="Converted nodes" />
            </div>
            
            {/* Filter Hub */}
            <div className="flex flex-col xl:flex-row gap-8 justify-between items-center bg-[#0d0f14]/80 backdrop-blur-3xl p-6 rounded-[2.8rem] border border-white/5 shadow-2xl ring-1 ring-white/5">
                <div className="relative w-full md:max-w-xl group">
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-white/10 group-focus-within:text-primary transition-colors duration-500" />
                    <input
                        type="text"
                        placeholder="SEARCH IDENTITIES OR PARENT NODES..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-16 pr-6 py-5 bg-black/40 border border-white/5 rounded-3xl text-[14px] font-bold text-white focus:bg-black/60 focus:border-primary/50 outline-none transition-all placeholder:text-white/5 tracking-wider"
                    />
                </div>
                
                <div className="flex bg-black/60 p-2 rounded-[1.8rem] border border-white/5 overflow-x-auto no-scrollbar w-full xl:w-auto shadow-inner">
                    {['All', 'ENQUIRY_VERIFIED', 'ENQUIRY_IN_PROGRESS', 'CONVERTED'].map(f => (
                        <button 
                            key={f}
                            onClick={() => setFilterStatus(f === 'All' ? '' : f)}
                            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-700 whitespace-nowrap ${
                                (filterStatus === f || (f === 'All' && !filterStatus)) 
                                ? 'bg-[#1a1d24] text-primary shadow-2xl ring-1 ring-white/10 scale-[1.05] z-10' 
                                : 'text-white/20 hover:text-white/40'
                            }`}
                        >
                            {statusLabels[f] || f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Desktop Registry Table */}
            <div className="bg-[#0a0a0c]/80 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] shadow-[0_64px_128px_-24px_rgba(0,0,0,1)] overflow-hidden flex flex-col min-h-[600px] ring-1 ring-white/5 relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/[0.01] to-transparent pointer-events-none"></div>
                
                {loading && enquiries.length === 0 ? (
                    <div className="flex flex-col justify-center items-center py-48 gap-8">
                        <Spinner size="lg" className="text-primary" />
                        <p className="text-[11px] font-black uppercase text-white/20 tracking-[0.5em] animate-pulse">Syncing Lifecycle Protocol</p>
                    </div>
                ) : processedEnquiries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-48 text-center px-12 animate-in fade-in duration-1000">
                        <div className="w-32 h-32 bg-white/[0.01] rounded-[3rem] flex items-center justify-center mb-10 border border-white/5 shadow-inner">
                            <KeyIcon className="h-14 w-14 text-white/10" />
                        </div>
                        <h3 className="text-3xl font-serif font-black text-white uppercase tracking-tighter leading-none mb-6">Desk <span className="text-white/20 italic">Standby.</span></h3>
                        <p className="text-white/30 max-w-sm mx-auto font-serif italic text-lg leading-relaxed">
                            Verified enquiries from the <strong className="text-primary">Verification Center</strong> will appear here upon authorization.
                        </p>
                        {onNavigate && (
                            <button 
                                onClick={() => onNavigate('Code Verification')}
                                className="mt-12 px-10 py-4 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all border border-white/5"
                            >
                                Enter Verification Center
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-[#0f1115]/90 border-b border-white/5 text-[10px] font-black uppercase text-white/20 tracking-[0.3em] sticky top-0 z-20 backdrop-blur-3xl">
                                <tr>
                                    <th className="p-10 pl-12 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('applicant_name')}>Identity Node</th>
                                    <th className="p-10">Placement Context</th>
                                    <th className="p-10">Lifecycle Status</th>
                                    <th className="p-10 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('updated_at')}>Registry Pulse</th>
                                    <th className="p-10 text-right pr-12">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 relative z-10">
                                {processedEnquiries.map((enq, idx) => (
                                    <tr 
                                        key={enq.id} 
                                        onClick={() => setViewingEnquiry(enq)} 
                                        style={{ animationDelay: `${idx * 40}ms` }}
                                        className="group hover:bg-white/[0.015] transition-all duration-500 cursor-pointer relative overflow-hidden animate-in fade-in slide-in-from-bottom-2"
                                    >
                                        <td className="p-10 pl-12">
                                            <div className="flex items-center gap-8">
                                                <div className="relative shrink-0">
                                                    <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-700"></div>
                                                    <div className="w-[68px] h-[68px] rounded-[1.8rem] bg-gradient-to-br from-indigo-500/10 to-purple-600/10 flex items-center justify-center text-indigo-400 font-serif font-black text-2xl shadow-inner border border-white/5 group-hover:scale-110 group-hover:rotate-2 transition-all duration-700 relative z-10">
                                                        {(enq.applicant_name || '?').charAt(0)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xl font-serif font-black text-white group-hover:text-primary transition-colors duration-500 uppercase tracking-tight leading-tight mb-2">{enq.applicant_name}</div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">{enq.parent_name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-10">
                                            <div className="flex flex-col gap-2">
                                                <span className="inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase bg-white/5 text-white/30 border border-white/5 tracking-[0.1em] w-fit shadow-sm">
                                                    Grade {enq.grade}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-10">
                                            <div className="relative inline-block group/status">
                                                <span className={`px-5 py-2.5 inline-flex text-[10px] font-black uppercase tracking-[0.25em] rounded-2xl border shadow-2xl transition-all duration-1000 ${statusColors[enq.status] || 'bg-white/5 text-white/20 border-white/5'}`}>
                                                    {statusLabels[enq.status] || enq.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-10">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-white/40 uppercase tracking-widest">
                                                    <ClockIcon className="w-3.5 h-3.5 opacity-40 group-hover:rotate-12 transition-transform" />
                                                    {new Date(enq.updated_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-10 text-right pr-12">
                                            <button className="p-5 rounded-[1.5rem] bg-white/5 text-white/10 group-hover:text-primary group-hover:bg-primary/10 border border-transparent group-hover:border-primary/20 transition-all shadow-2xl active:scale-90 group-hover:shadow-primary/5">
                                                <ChevronRightIcon className="w-6 h-6 group-hover:translate-x-1 transition-transform"/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {viewingEnquiry && (
                <EnquiryDetailsModal 
                    enquiry={viewingEnquiry} 
                    currentBranchId={branchId}
                    onClose={() => setViewingEnquiry(null)} 
                    onUpdate={() => {
                        fetchEnquiries(true);
                    }}
                    onNavigate={onNavigate}
                />
            )}
        </div>
    );
};

export default EnquiryTab;
