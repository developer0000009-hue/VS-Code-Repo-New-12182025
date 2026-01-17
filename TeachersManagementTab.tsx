import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './services/supabase';
import { TeacherExtended, UserProfile } from './types';
import Spinner from './components/common/Spinner';
import { TeacherIcon } from './components/icons/TeacherIcon';
import { SearchIcon } from './components/icons/SearchIcon';
import { EditIcon } from './components/icons/EditIcon';
import { PlusIcon } from './components/icons/PlusIcon';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';
import { BriefcaseIcon } from './components/icons/BriefcaseIcon';
import { GridIcon } from './components/icons/GridIcon';
import { FilterIcon } from './components/icons/FilterIcon';
import { XIcon } from './components/icons/XIcon';
import { MoreHorizontalIcon } from './components/icons/MoreHorizontalIcon';
import { MailIcon } from './components/icons/MailIcon';
import { PhoneIcon } from './components/icons/PhoneIcon';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { TrashIcon } from './components/icons/TrashIcon';
import { ChevronLeftIcon } from './components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from './components/icons/ChevronRightIcon';
import { ChevronDownIcon } from './components/icons/ChevronDownIcon';
import { UsersIcon } from './components/icons/UsersIcon';
import AddTeacherModal from './components/AddTeacherModal';
import TeacherDetailModal from './components/TeacherDetailModal';
import BulkActionsModal, { BulkActionType } from './components/teachers/BulkActionsModal';
import DepartmentsTab from './components/teachers/DepartmentsTab';
import { TransferIcon } from './components/icons/TransferIcon';
import { BookIcon } from './components/icons/BookIcon';
import { UploadIcon } from './components/icons/UploadIcon';
import { CommunicationIcon } from './components/icons/CommunicationIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { WorkflowIcon } from './components/icons/WorkflowIcon';
import TeacherAiAuditModal from './components/teachers/TeacherAiAuditModal';
import TeacherWorkflowGuide from './components/teachers/TeacherWorkflowGuide';
import PremiumAvatar from './components/common/PremiumAvatar';

type QuickFilterType = 'All' | 'Active' | 'New Joinees' | 'Pending Verification' | 'On Leave' | 'Inactive';

const KPICard: React.FC<{ 
    title: string; 
    value: number | string; 
    icon: React.ReactNode; 
    colorClass?: string; 
    trend?: string;
    onClick?: () => void;
}> = ({ title, value, icon, colorClass = "bg-primary text-white", trend, onClick }) => (
    <div 
        onClick={onClick}
        className={`bg-[#0d0f14] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl hover:border-white/20 transition-all duration-500 group relative overflow-hidden ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}`}
    >
        <div className="flex justify-between items-start relative z-10">
            <div>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-8">{title}</p>
                <h3 className="text-5xl font-serif font-black text-white tracking-tighter leading-none">{value}</h3>
                {trend && <p className="text-[11px] text-emerald-500 mt-4 font-black uppercase tracking-widest">{trend}</p>}
            </div>
            <div className={`p-4 rounded-2xl shadow-inner border border-white/5 group-hover:scale-110 transition-all duration-700 ${colorClass}`}>
                {icon}
            </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
    </div>
);

interface TeachersManagementTabProps {
    profile: UserProfile;
    branchId: number | null;
}

const TeachersManagementTab: React.FC<TeachersManagementTabProps> = ({ profile, branchId }) => {
    const [activeTab, setActiveTab] = useState<'directory' | 'departments'>('directory');
    const [teachers, setTeachers] = useState<TeacherExtended[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [quickFilter, setQuickFilter] = useState<QuickFilterType>('All');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<TeacherExtended | null>(null);
    const [bulkAction, setBulkAction] = useState<BulkActionType | null>(null);
    const [isAiAuditOpen, setIsAiAuditOpen] = useState(false); 
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    const fetchTeachers = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_all_teachers_for_admin');
        if (!error && data) {
            setTeachers(data.map((t: any) => ({
                ...t, 
                dailyStatus: Math.random() > 0.8 ? 'Absent' : 'Present',
                details: { ...t, employment_status: t.employment_status || (t.is_active ? 'Active' : 'Inactive') }
            })));
        }
        setLoading(false);
        setSelectedIds(new Set());
    }, []);

    useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

    const filteredTeachers = useMemo(() => {
        return (teachers || []).filter(t => {
            const matchesBranch = !branchId || t.details?.branch_id === branchId;
            if (!matchesBranch) return false;
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || t.display_name.toLowerCase().includes(searchLower) || t.email.toLowerCase().includes(searchLower);
            let matchesQuick = true;
            if (quickFilter === 'Active') matchesQuick = t.is_active;
            if (quickFilter === 'Pending Verification') matchesQuick = t.details?.employment_status === 'Pending Verification';
            if (quickFilter === 'Inactive') matchesQuick = !t.is_active;
            return matchesSearch && matchesQuick;
        });
    }, [teachers, searchTerm, quickFilter, branchId]);

    const stats = useMemo(() => ({
        total: filteredTeachers.length,
        active: filteredTeachers.filter(t => t.is_active).length,
        departments: new Set(filteredTeachers.map(t => t.details?.department).filter(Boolean)).size,
        pending: filteredTeachers.filter(t => t.details?.employment_status === 'Pending Verification').length
    }), [filteredTeachers]);

    const paginatedTeachers = filteredTeachers.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage);
    // FIX: Explicitly calculated totalPages based on filtered data to solve "Cannot find name totalPages" errors in pagination controls.
    const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / itemsPerPage));

    return (
        <div className="space-y-12 animate-in fade-in duration-1000 pb-40 max-w-[1700px] mx-auto">
            {/* --- STATS TOP TIER --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <KPICard title="Total Faculty" value={stats.total} icon={<UsersIcon className="w-8 h-8" />} colorClass="bg-primary/10 text-primary" trend="+2 this month" />
                <KPICard title="Active Teachers" value={stats.active} icon={<CheckCircleIcon className="w-8 h-8" />} colorClass="bg-emerald-500/10 text-emerald-500" />
                <KPICard title="Departments" value={stats.departments} icon={<GridIcon className="w-8 h-8" />} colorClass="bg-amber-500/10 text-amber-500" />
                <KPICard title="Pending Verification" value={stats.pending} icon={<BriefcaseIcon className="w-8 h-8" />} colorClass="bg-purple-500/10 text-purple-500" onClick={() => setQuickFilter('Pending Verification')} />
            </div>

            {/* --- ACTION BAR --- */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
                <div className="flex p-1.5 bg-[#12141c]/60 rounded-2xl border border-white/5 backdrop-blur-md shadow-2xl">
                    <button onClick={() => setActiveTab('directory')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.3em] transition-all ${activeTab === 'directory' ? 'bg-card text-white shadow-xl ring-1 ring-white/10' : 'text-white/20 hover:text-white/40'}`}>Faculty Directory</button>
                    <button onClick={() => setActiveTab('departments')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.3em] transition-all ${activeTab === 'departments' ? 'bg-card text-white shadow-xl ring-1 ring-white/10' : 'text-white/20 hover:text-white/40'}`}>Departments</button>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                    <button onClick={() => setIsGuideOpen(true)} className="flex-grow md:flex-none h-14 px-8 bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] rounded-[1.2rem] text-[10px] font-black uppercase text-white/40 hover:text-white transition-all flex items-center justify-center gap-3 tracking-[0.2em] shadow-xl">
                        <WorkflowIcon className="w-5 h-5 opacity-40" /> Process Guide
                    </button>
                    <button onClick={() => setIsAiAuditOpen(true)} className="flex-grow md:flex-none h-14 px-8 bg-[#1f1b2e] border border-violet-500/20 hover:bg-violet-900/20 rounded-[1.2rem] text-[10px] font-black uppercase text-violet-400 hover:text-violet-300 transition-all flex items-center justify-center gap-3 tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(139,92,246,0.2)]">
                        <SparklesIcon className="w-5 h-5" /> AI Audit
                    </button>
                </div>
            </div>

            {activeTab === 'departments' ? <DepartmentsTab teachers={teachers} branchId={branchId} /> : (
                <>
                    {/* --- SEARCH & QUICK FILTERS --- */}
                    <div className="bg-[#0d0f14]/80 backdrop-blur-3xl p-3 rounded-[2.8rem] border border-white/5 shadow-2xl space-y-3">
                        <div className="flex flex-col lg:flex-row gap-4 items-center">
                            <div className="relative flex-grow w-full group">
                                <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/10 group-focus-within:text-primary transition-colors duration-500" />
                                <input 
                                    type="text" 
                                    placeholder="SEARCH BY NAME, EMAIL, ID, SUBJECT..." 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value.toUpperCase())}
                                    className="w-full pl-16 pr-6 py-5 bg-black/40 border border-white/5 rounded-3xl text-[14px] font-bold text-white focus:bg-black/60 focus:border-primary/50 outline-none transition-all placeholder:text-white/5 tracking-wider"
                                />
                            </div>
                            <div className="flex gap-2 w-full lg:w-auto">
                                <button className="h-[60px] px-8 rounded-2xl bg-white/[0.02] border border-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-all flex items-center gap-3"><FilterIcon className="w-5 h-5" /> Filters</button>
                                <button onClick={() => setBulkAction('import')} className="h-[60px] px-8 rounded-2xl bg-white/[0.02] border border-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-all flex items-center gap-3"><UploadIcon className="w-5 h-5" /> Import</button>
                                <button onClick={() => setIsAddModalOpen(true)} className="h-[60px] px-10 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-3"><PlusIcon className="w-5 h-5" /> Add Teacher</button>
                            </div>
                        </div>
                        <div className="px-5 py-3 bg-black/20 border-t border-white/5 rounded-b-[2rem] overflow-x-auto no-scrollbar flex items-center gap-4">
                            {(['All', 'Active', 'New Joinees', 'Pending Verification', 'On Leave', 'Inactive'] as QuickFilterType[]).map(f => (
                                <button 
                                    key={f} onClick={() => setQuickFilter(f)}
                                    className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.25em] transition-all ${quickFilter === f ? 'bg-white text-black shadow-2xl' : 'text-white/20 hover:text-white/50'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* --- THE LEDGER --- */}
                    <div className="bg-[#0a0a0c] border border-white/5 rounded-[3.5rem] shadow-3xl overflow-hidden ring-1 ring-white/10 relative">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                                <thead className="bg-[#0f1115]/80 border-b border-white/5 text-[10px] font-black uppercase text-white/20 tracking-[0.4em] sticky top-0 z-20 backdrop-blur-3xl">
                                    <tr>
                                        <th className="p-8 pl-12 w-10"><input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-black/40 text-primary focus:ring-primary/20" /></th>
                                        <th className="p-10">Faculty Member ↑</th>
                                        <th className="p-10">Contact</th>
                                        <th className="p-10">Emp ID</th>
                                        <th className="p-10">Dept</th>
                                        <th className="p-10 text-center">Daily Status</th>
                                        <th className="p-10 text-center">Status</th>
                                        <th className="p-10 text-right pr-12">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {loading ? (
                                        <tr><td colSpan={8} className="p-40 text-center"><Spinner size="lg" className="text-primary" /><p className="text-[10px] font-black uppercase text-white/10 tracking-[0.5em] mt-8 animate-pulse">Synchronizing Ledger</p></td></tr>
                                    ) : paginatedTeachers.length === 0 ? (
                                        <tr><td colSpan={8} className="p-40 text-center text-white/10 uppercase font-black tracking-[0.4em] italic">No active nodes detected</td></tr>
                                    ) : (
                                        paginatedTeachers.map(teacher => (
                                            <tr key={teacher.id} className="hover:bg-white/[0.015] group transition-all duration-500 cursor-pointer" onClick={() => setSelectedTeacher(teacher)}>
                                                <td className="p-8 pl-12" onClick={e => e.stopPropagation()}><input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-black/40 text-primary focus:ring-primary/20" /></td>
                                                <td className="p-8">
                                                    <div className="flex items-center gap-6">
                                                        <div className="relative">
                                                            <PremiumAvatar src={teacher.details?.profile_picture_url} name={teacher.display_name} size="xs" className="w-11 h-11 rounded-xl shadow-2xl border border-white/5 group-hover:scale-105 transition-transform" />
                                                            <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0a0a0c] ${teacher.dailyStatus === 'Present' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500'}`} />
                                                        </div>
                                                        <div>
                                                            <p className="font-serif font-black text-white text-[16px] group-hover:text-primary transition-colors uppercase tracking-tight leading-none mb-2">{teacher.display_name}</p>
                                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{teacher.details?.designation || 'FACULTY'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <div className="space-y-1.5">
                                                        <p className="text-[13px] font-bold text-white/50 flex items-center gap-2 lowercase"><MailIcon className="w-3.5 h-3.5 opacity-40"/> {teacher.email}</p>
                                                        <p className="text-[13px] font-bold text-white/30 flex items-center gap-2"><PhoneIcon className="w-3.5 h-3.5 opacity-40"/> {teacher.phone || 'NO_LINK'}</p>
                                                    </div>
                                                </td>
                                                <td className="p-8 font-mono text-[11px] text-white/20 uppercase tracking-widest">{teacher.details?.employee_id || '—'}</td>
                                                <td className="p-8">
                                                    <span className="px-3 py-1 bg-white/5 border border-white/5 text-white/40 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm">{teacher.details?.department || 'GENERAL'}</span>
                                                </td>
                                                <td className="p-8 text-center">
                                                    <div className="flex justify-center">
                                                        <div className={`w-3 h-3 rounded-full border-2 border-white/10 ${teacher.dailyStatus === 'Present' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500'}`}></div>
                                                    </div>
                                                </td>
                                                <td className="p-8 text-center">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-2xl transition-all ${teacher.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                        {teacher.is_active ? 'Active' : 'Offline'}
                                                    </span>
                                                </td>
                                                <td className="p-8 text-right pr-12">
                                                    <button className="p-3.5 rounded-2xl bg-white/[0.02] text-white/10 group-hover:text-primary transition-all shadow-xl active:scale-90"><MoreHorizontalIcon className="w-5 h-5"/></button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-8 border-t border-white/5 bg-[#0a0a0c]/80 flex justify-between items-center z-10 backdrop-blur-md">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Sequence <span className="text-white/60">{currentPage}</span> of {totalPages}</span>
                            <div className="flex gap-3">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-4 rounded-2xl border border-white/5 bg-white/5 text-white/40 hover:text-white transition-all active:scale-90 disabled:opacity-20 shadow-xl"><ChevronLeftIcon className="w-5 h-5"/></button>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-4 rounded-2xl border border-white/5 bg-white/5 text-white/40 hover:text-white transition-all active:scale-90 disabled:opacity-20 shadow-xl"><ChevronRightIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {isAddModalOpen && <AddTeacherModal onClose={() => setIsAddModalOpen(false)} onSuccess={fetchTeachers} branchId={branchId} />}
            {selectedTeacher && <TeacherDetailModal teacher={selectedTeacher} onClose={() => setSelectedTeacher(null)} onUpdate={fetchTeachers} />}
            {bulkAction && <BulkActionsModal action={bulkAction} selectedIds={Array.from(selectedIds)} onClose={() => setBulkAction(null)} onSuccess={fetchTeachers} branchId={branchId} />}
            {isAiAuditOpen && <TeacherAiAuditModal onClose={() => setIsAiAuditOpen(false)} />}
            {isGuideOpen && <TeacherWorkflowGuide onClose={() => setIsGuideOpen(false)} />}
        </div>
    );
};

export default TeachersManagementTab;