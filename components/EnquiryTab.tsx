
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
import PremiumAvatar from './common/PremiumAvatar';
import { motion, AnimatePresence } from 'framer-motion';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const statusColors: Record<string, string> = {
  'ENQUIRY_ACTIVE': 'bg-blue-500/5 text-blue-400/80 border-blue-500/10',
  'ENQUIRY_VERIFIED': 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]',
  'ENQUIRY_IN_REVIEW': 'bg-purple-500/5 text-purple-400/80 border-purple-500/10',
  'ENQUIRY_CONTACTED': 'bg-amber-500/5 text-amber-400/80 border-amber-500/10',
  'ENQUIRY_REJECTED': 'bg-rose-500/5 text-rose-400/80 border-rose-500/10',
  'ENQUIRY_CONVERTED': 'bg-indigo-500/5 text-indigo-400/80 border-indigo-500/10',
};

const statusLabels: Record<string, string> = {
  'ENQUIRY_ACTIVE': 'Active',
  'ENQUIRY_VERIFIED': 'Verified',
  'ENQUIRY_IN_REVIEW': 'In Review',
  'ENQUIRY_CONTACTED': 'Contacted',
  'ENQUIRY_REJECTED': 'Rejected',
  'ENQUIRY_CONVERTED': 'Converted',
};

interface EnquiryTabProps {
    branchId?: number | null;
    onNavigate?: (component: string) => void;
}

const EnquiryTab: React.FC<EnquiryTabProps> = ({ branchId, onNavigate }) => {
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewingEnquiry, setViewingEnquiry] = useState<Enquiry | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    const fetchEnquiries = useCallback(async (isSilent = false) => {
        if (branchId === undefined) return;
        if (!isSilent) setLoading(true);
        setError(null);
        try {
            // FIX: Explicitly pass BigInt castable branchId to resolve RPC ambiguity
            const cleanBranchId = branchId === null ? null : Number(branchId);
            const { data, error: rpcError } = await supabase.rpc('get_all_enquiries_v2', { 
                p_branch_id: cleanBranchId 
            });
            
            if (rpcError) throw rpcError;
            const validData = (data || []).filter((e: Enquiry) => e.id && UUID_REGEX.test(String(e.id)));
            setEnquiries(validData || []);
        } catch (err: any) {
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => {
        fetchEnquiries();
    }, [fetchEnquiries]);

    const filteredEnquiries = useMemo(() => {
        return enquiries.filter(enq => {
            // FIX: When "All" is selected (empty filterStatus), exclude 'Converted' and 'Rejected' to keep the list focused on active tasks.
            if (!filterStatus) {
                if (enq.status === 'ENQUIRY_CONVERTED' || enq.status === 'ENQUIRY_REJECTED') return false;
            } else {
                if (enq.status !== filterStatus) return false;
            }

            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || 
                enq.applicant_name.toLowerCase().includes(searchLower) ||
                enq.parent_name.toLowerCase().includes(searchLower);
                
            return matchesSearch;
        });
    }, [enquiries, searchTerm, filterStatus]);

    const stats = useMemo(() => ({
        total: enquiries.length,
        verified: enquiries.filter(e => e.status === 'ENQUIRY_VERIFIED').length,
        converted: enquiries.filter(e => e.status === 'ENQUIRY_CONVERTED').length
    }), [enquiries]);

    return (
        <div className="space-y-10 md:space-y-14 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24 md:pb-12 max-w-[1600px] mx-auto px-4 md:px-0">
            
            {/* Header / Hero Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="max-w-2xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-0.5 w-8 bg-primary/40 rounded-full"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Administrative Console</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif font-extrabold text-white tracking-tighter leading-none mb-4 uppercase">
                        ENQUIRY <span className="text-white/30 italic">desk.</span>
                    </h2>
                    <p className="text-[15px] md:text-16px text-white/40 font-medium leading-relaxed font-sans max-w-lg italic">
                        Centralized operations for managing identity handshakes, enquiries, and institutional verifications.
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                        onClick={() => fetchEnquiries()}
                        className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-white/30 hover:text-white hover:border-white/10 transition-all active:scale-95"
                    >
                        <RefreshIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    {onNavigate && (
                        <button 
                            onClick={() => onNavigate('Code Verification')}
                            className="flex-grow md:flex-none h-12 md:h-14 px-8 bg-primary text-white font-bold text-[11px] uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95 border border-white/10 ring-4 ring-primary/5"
                        >
                            Start Verification
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Cards: Status Indicators */}
            <div className="overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                <div className="flex md:grid md:grid-cols-3 gap-6 min-w-max md:min-w-full">
                    <MetricCard title="Total Ledger" value={stats.total} icon={<MailIcon className="w-5 h-5"/>} color="text-blue-400" />
                    <MetricCard title="Verified Stream" value={stats.verified} icon={<ShieldCheckIcon className="w-5 h-5"/>} color="text-emerald-400" />
                    <MetricCard title="Promoted" value={stats.converted} icon={<CheckCircleIcon className="w-5 h-5"/>} color="text-indigo-400" />
                </div>
            </div>

            {error && (
                <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-3xl flex items-center justify-between shadow-sm animate-in shake">
                    <div className="flex items-center gap-4">
                        <AlertTriangleIcon className="w-6 h-6 text-red-500/60" />
                        <div>
                            <p className="text-[10px] font-black uppercase text-red-500/80 tracking-widest leading-none mb-1.5">Handshake Interrupted</p>
                            <p className="text-sm font-medium text-white/60">{error}</p>
                        </div>
                    </div>
                    <button onClick={() => fetchEnquiries()} className="px-6 py-2.5 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/90 active:scale-95 transition-all">Retry Protocol</button>
                </div>
            )}

            {/* Filter Hub */}
            <div className="flex flex-col lg:flex-row gap-6 justify-between items-center bg-white/[0.02] backdrop-blur-xl p-3 rounded-[2rem] border border-white/5">
                <div className="relative w-full lg:max-w-md group">
                    <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/10 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search identities or parent nodes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-3.5 bg-black/20 border border-white/5 rounded-2xl text-sm font-medium text-white placeholder:text-white/10 focus:bg-black/40 outline-none transition-all focus:ring-4 focus:ring-primary/5"
                    />
                </div>
                
                <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar w-full lg:w-auto shadow-inner">
                    {(['All', ...Object.keys(statusLabels)] as (keyof typeof statusLabels | 'All')[]).map(f => {
                        const label = f === 'All' ? 'Active Desk' : statusLabels[f as string];
                        const key = f === 'All' ? '' : f;
                        const isActive = filterStatus === key;
                        return (
                            <button 
                                key={f}
                                onClick={() => setFilterStatus(key)}
                                className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.25em] transition-all duration-300 whitespace-nowrap ${isActive ? 'bg-white/5 text-primary shadow-sm' : 'text-white/30 hover:text-white/50'}`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Desktop Registry Ledger */}
            <div className="hidden md:block bg-[#0c0d12] border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden ring-1 ring-white/5 relative">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                        <thead className="bg-white/[0.01] border-b border-white/[0.04] text-[10px] font-black uppercase text-white/20 tracking-[0.3em]">
                            <tr>
                                <th className="p-6 pl-10 font-black">Identity Node</th>
                                <th className="p-6 font-black">Placement</th>
                                <th className="p-6 font-black">Status Protocol</th>
                                <th className="p-6 font-black">Last Sync</th>
                                <th className="p-6 text-right pr-10 font-black">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {filteredEnquiries.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-32 text-center">
                                        <div className="flex flex-col items-center opacity-20">
                                            <ShieldCheckIcon className="w-16 h-16 mb-4" />
                                            <p className="text-[11px] font-black uppercase tracking-[0.4em]">Registry Silent</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredEnquiries.map(enq => (
                                    <tr 
                                        key={enq.id}
                                        onClick={() => setViewingEnquiry(enq)}
                                        className="group hover:bg-white/[0.015] transition-all duration-300 cursor-pointer"
                                    >
                                        <td className="p-5 pl-10">
                                            <div className="flex items-center gap-6">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/30 font-bold group-hover:text-primary group-hover:border-primary/20 transition-all">
                                                    {(enq.applicant_name || '?').charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[15px] font-bold text-white/80 group-hover:text-white transition-colors">{enq.applicant_name}</p>
                                                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-0.5">{enq.parent_name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className="px-3 py-1 rounded-lg bg-white/5 text-white/30 text-[10px] font-black uppercase tracking-widest border border-white/5">Grade {enq.grade}</span>
                                        </td>
                                        <td className="p-5">
                                            <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border transition-all ${statusColors[enq.status] || 'bg-white/5 text-white/20'}`}>
                                                {statusLabels[enq.status] || enq.status}
                                            </span>
                                        </td>
                                        <td className="p-5 font-mono text-[11px] text-white/20 uppercase tracking-tighter">
                                            {new Date(enq.updated_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="p-5 text-right pr-10">
                                            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="p-2.5 bg-white/5 rounded-xl text-white/30 hover:text-primary transition-colors border border-transparent hover:border-white/10">
                                                    <ChevronRightIcon className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Ledger: Identity Cards */}
            <div className="md:hidden space-y-4">
                {filteredEnquiries.map(enq => (
                    <div 
                        key={enq.id}
                        onClick={() => setViewingEnquiry(enq)}
                        className="bg-card p-6 rounded-[2rem] border border-white/5 active:scale-[0.98] transition-all shadow-xl"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 font-bold border border-white/5">
                                    {(enq.applicant_name || '?').charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-base leading-tight">{enq.applicant_name}</h4>
                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">Grade {enq.grade} Node</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border tracking-widest ${statusColors[enq.status]}`}>
                                {statusLabels[enq.status]}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-white/[0.03]">
                            <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{enq.parent_name}</span>
                            <span className="text-[10px] font-mono text-white/10">{new Date(enq.updated_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
                {filteredEnquiries.length === 0 && (
                    <div className="py-20 text-center opacity-20">
                        <p className="text-xs font-black uppercase tracking-widest">No nodes detected</p>
                    </div>
                )}
            </div>

            {/* Mobile Floating Action */}
            {onNavigate && (
                <div className="md:hidden fixed bottom-6 left-6 right-6 z-[100] animate-in slide-in-from-bottom-12 duration-700">
                    <button 
                        onClick={() => onNavigate('Code Verification')}
                        className="w-full h-14 bg-primary text-white font-black text-[12px] uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-primary/20 transition-all active:scale-95 border border-white/10 ring-4 ring-primary/5 flex items-center justify-center gap-3"
                    >
                        <KeyIcon className="w-5 h-5"/> Verify Node
                    </button>
                </div>
            )}

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

const MetricCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-[#0c0d12] p-7 md:p-8 rounded-[1.8rem] border border-white/5 flex flex-col justify-between h-40 md:h-44 w-64 md:w-full group hover:border-white/10 transition-colors">
        <div className="flex justify-between items-start">
            <div className={`p-2.5 rounded-xl bg-white/[0.02] border border-white/5 ${color} shadow-inner`}>
                {icon}
            </div>
            <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">Status Nom.</span>
        </div>
        <div>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mb-2">{title}</p>
            <h3 className="text-4xl md:text-5xl font-serif font-black text-white tracking-tighter leading-none">{value}</h3>
        </div>
    </div>
);

export default EnquiryTab;
