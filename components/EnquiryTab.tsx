
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { Enquiry, EnquiryStatus } from '../types';
import Spinner from './common/Spinner';
import EnquiryDetailsModal from './EnquiryDetailsModal';
import { SearchIcon } from './icons/SearchIcon';
import { KeyIcon } from './icons/KeyIcon';
import { MailIcon } from './icons/MailIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ClockIcon } from './icons/ClockIcon';
import { FilterIcon } from './icons/FilterIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { RefreshIcon } from './icons/RefreshIcon';

const statusColors: { [key in EnquiryStatus]: string } = {
  'New': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  'Contacted': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  'In Review': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
  'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
};

type SortableKeys = 'applicant_name' | 'grade' | 'status' | 'received_at';

interface EnquiryTabProps {
    branchId?: number | null;
    onNavigate?: (component: string) => void;
}

const KPICard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${color} text-white shadow-md`}>
            {icon}
        </div>
        <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-black text-foreground mt-0.5">{value}</p>
        </div>
    </div>
);

const EnquiryTab: React.FC<EnquiryTabProps> = ({ branchId, onNavigate }) => {
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewingEnquiry, setViewingEnquiry] = useState<Enquiry | null>(null);
    
    // State for interactivity
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<EnquiryStatus | ''>('');
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' }>({ key: 'received_at', direction: 'descending' });

    const fetchEnquiries = useCallback(async () => {
        if (!branchId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.rpc('get_all_enquiries', { p_branch_id: branchId });
            if (error) throw error;
            setEnquiries(data || []);
        } catch (err: any) {
            setError(`Failed to fetch enquiries: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => {
        fetchEnquiries();
    }, [fetchEnquiries]);
    
    const processedEnquiries = useMemo(() => {
        let filteredData = [...enquiries];

        if (filterStatus) {
            filteredData = filteredData.filter(enq => enq.status === filterStatus);
        }

        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            filteredData = filteredData.filter(enq =>
                enq.applicant_name.toLowerCase().includes(lowercasedFilter) ||
                (enq.parent_name || '').toLowerCase().includes(lowercasedFilter)
            );
        }

        if (sortConfig) {
            filteredData.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        
        return filteredData;
    }, [enquiries, searchTerm, filterStatus, sortConfig]);

    const stats = useMemo(() => ({
        total: enquiries.length,
        new: enquiries.filter(e => e.status === 'New').length,
        inReview: enquiries.filter(e => e.status === 'In Review' || e.status === 'Contacted').length,
        completed: enquiries.filter(e => e.status === 'Completed').length
    }), [enquiries]);

    const requestSort = (key: SortableKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const SortIcon: React.FC<{ direction: 'ascending' | 'descending' | null }> = ({ direction }) => {
        if (!direction) return <svg className="w-3 h-3 ml-1 text-muted-foreground/30" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>;
        return (
            <svg className={`w-3 h-3 ml-1 text-primary transition-transform ${direction === 'ascending' ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
        );
    };

    const SortableHeader: React.FC<{ label: string; sortKey: SortableKeys }> = ({ label, sortKey }) => (
        <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors group select-none" onClick={() => requestSort(sortKey)}>
            <div className="flex items-center">
                {label}
                <SortIcon direction={sortConfig.key === sortKey ? sortConfig.direction : null} />
            </div>
        </th>
    );

    const renderContent = () => {
        if (!branchId) return <div className="text-center py-20 text-muted-foreground bg-muted/10 rounded-2xl border-2 border-dashed border-border">Select a branch to view enquiries.</div>;
        if (loading) return <div className="flex justify-center p-20"><Spinner size="lg" /></div>;
        if (error) return <div className="text-center text-red-500 py-10 bg-red-500/10 rounded-xl border border-red-500/20">{error}</div>;
        
        if (enquiries.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-card border-2 border-dashed border-border rounded-3xl animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <KeyIcon className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">No Active Enquiries</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
                        To see student enquiries here, verify the <strong>Share Code</strong> provided by the parent in the Verification tab.
                    </p>
                    <div className="p-5 bg-muted/30 rounded-xl border border-border/50 max-w-sm w-full text-left">
                        <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-3">Quick Import Protocol</p>
                        <ol className="text-sm space-y-2 text-foreground/80 list-decimal list-inside">
                            <li>Navigate to <strong>Quick Verification</strong>.</li>
                            <li>Enter the "Enquiry Code" shared by parent.</li>
                            <li>Review and click <strong>Integrate Identity</strong>.</li>
                        </ol>
                        <div className="flex flex-col gap-2 mt-6">
                            <button onClick={() => onNavigate && onNavigate('Code Verification')} className="w-full py-3 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                                Go to Verification
                            </button>
                            <button onClick={fetchEnquiries} className="w-full py-3 bg-card border border-border rounded-xl text-xs font-bold hover:bg-muted transition-all flex items-center justify-center gap-2">
                                <RefreshIcon className="w-3.5 h-3.5" /> Re-sync Registry
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        if (processedEnquiries.length === 0) return (
            <div className="text-center py-20 bg-muted/10 rounded-2xl border-2 border-dashed border-border">
                <p className="text-muted-foreground font-medium">No enquiries match your current filters.</p>
                <button onClick={() => { setSearchTerm(''); setFilterStatus(''); }} className="mt-4 text-primary text-sm font-bold hover:underline">Clear Filters</button>
            </div>
        );

        return (
            <div className="overflow-hidden rounded-2xl border border-border shadow-sm bg-card">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/30">
                            <tr>
                                <SortableHeader label="Applicant" sortKey="applicant_name" />
                                <SortableHeader label="Grade" sortKey="grade" />
                                <SortableHeader label="Status" sortKey="status" />
                                <SortableHeader label="Received" sortKey="received_at" />
                                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50 bg-card">
                            {processedEnquiries.map((enq) => {
                                const isCompleted = enq.status === 'Completed';
                                return (
                                <tr key={enq.id} onClick={() => setViewingEnquiry(enq)} className={`transition-colors cursor-pointer group ${isCompleted ? 'bg-muted/5 opacity-80 hover:bg-muted/20' : 'hover:bg-muted/40'}`}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                                {(enq.applicant_name || '?').charAt(0)}
                                            </div>
                                            <div>
                                                <div className={`text-sm font-bold ${isCompleted ? 'text-muted-foreground' : 'text-foreground'}`}>{enq.applicant_name}</div>
                                                <div className="text-xs text-muted-foreground">{enq.parent_name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-muted text-foreground border border-border">
                                            Grade {enq.grade}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 inline-flex text-[10px] font-bold uppercase tracking-wide rounded-full border ${statusColors[enq.status]}`}>
                                            {enq.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                        {new Date(enq.received_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-muted-foreground hover:text-primary p-2 rounded-full hover:bg-primary/10 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header & Stats */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-foreground tracking-tight">Inquiry Desk</h2>
                    <p className="text-muted-foreground mt-2 text-lg">Manage incoming student interest and initial communications.</p>
                </div>
                <button onClick={fetchEnquiries} className="p-3 rounded-xl bg-card border border-border hover:bg-muted text-muted-foreground transition-all shadow-sm group">
                    <RefreshIcon className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'}`}/>
                </button>
            </div>

            {enquiries.length > 0 && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard title="Total Enquiries" value={stats.total} icon={<MailIcon className="w-6 h-6"/>} color="bg-blue-500" />
                    <KPICard title="New / Unread" value={stats.new} icon={<MegaphoneIcon className="w-6 h-6"/>} color="bg-purple-500" />
                    <KPICard title="In Discussion" value={stats.inReview} icon={<ClockIcon className="w-6 h-6"/>} color="bg-amber-500" />
                    <KPICard title="Converted" value={stats.completed} icon={<CheckCircleIcon className="w-6 h-6"/>} color="bg-emerald-500" />
                </div>
            )}
            
            {/* Controls */}
            {enquiries.length > 0 && (
                 <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-sm">
                    <div className="relative w-full md:w-96 group">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search applicant or parent..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-background border border-input rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                        />
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl border border-border/50">
                            <button onClick={() => setFilterStatus('')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterStatus === '' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>All</button>
                            <button onClick={() => setFilterStatus('New')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterStatus === 'New' ? 'bg-background shadow-sm text-purple-600' : 'text-muted-foreground hover:text-foreground'}`}>New</button>
                            <button onClick={() => setFilterStatus('Contacted')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterStatus === 'Contacted' ? 'bg-background shadow-sm text-amber-600' : 'text-muted-foreground hover:text-foreground'}`}>Active</button>
                        </div>
                        <div className="h-8 w-px bg-border/60 hidden md:block"></div>
                         <select 
                            value={filterStatus} 
                            onChange={(e) => setFilterStatus(e.target.value as EnquiryStatus | '')} 
                            className="bg-background border border-input rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer hidden md:block"
                        >
                            <option value="">More Filters</option>
                            <option value="In Review">In Review</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                </div>
            )}

            {renderContent()}

            {viewingEnquiry && (
                <EnquiryDetailsModal 
                    enquiry={viewingEnquiry} 
                    currentBranchId={branchId}
                    onClose={() => setViewingEnquiry(null)} 
                    onUpdate={fetchEnquiries} 
                    onNavigate={onNavigate} 
                />
            )}
        </div>
    );
};

export default EnquiryTab;
