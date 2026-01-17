import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { TeacherExtended, UserProfile } from '../types';
import Spinner from './common/Spinner';
import { TeacherIcon } from './icons/TeacherIcon';
import { SearchIcon } from './icons/SearchIcon';
import { EditIcon } from './icons/EditIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { GridIcon } from './icons/GridIcon';
import { FilterIcon } from './icons/FilterIcon';
import { XIcon } from './icons/XIcon';
import { MoreHorizontalIcon } from './icons/MoreHorizontalIcon';
import { MailIcon } from './icons/MailIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { UsersIcon } from './icons/UsersIcon';
import AddTeacherModal from './AddTeacherModal';
import TeacherDetailModal from './TeacherDetailModal';
import BulkActionsModal, { BulkActionType } from './teachers/BulkActionsModal';
import DepartmentsTab from './teachers/DepartmentsTab';
import { TransferIcon } from './icons/TransferIcon';
import { BookIcon } from './icons/BookIcon';
import { UploadIcon } from './icons/UploadIcon';
import { CommunicationIcon } from './icons/CommunicationIcon';
import { ClockIcon } from './icons/ClockIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { WorkflowIcon } from './icons/WorkflowIcon';
import TeacherAiAuditModal from './teachers/TeacherAiAuditModal';
import TeacherWorkflowGuide from './teachers/TeacherWorkflowGuide';

type QuickFilterType = 'All' | 'Active' | 'New Joinees' | 'Pending Verification' | 'On Leave' | 'Inactive';

interface FilterState {
    department: string;
    designation: string;
    employmentType: string;
    joiningYear: string;
}

const INITIAL_FILTERS: FilterState = {
    department: '',
    designation: '',
    employmentType: '',
    joiningYear: '',
};

const KPICard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; colorClass?: string; trend?: string }> = ({ title, value, icon, colorClass = "text-primary bg-primary/10", trend }) => (
    <div className="bg-card hover:bg-card/80 p-5 rounded-2xl shadow-sm border border-border flex items-start justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group">
        <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
            <p className="text-3xl font-extrabold text-foreground tracking-tight">{value}</p>
            {trend && <p className="text-[10px] text-emerald-600 mt-1 font-semibold">{trend}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorClass} transition-transform group-hover:scale-110 shadow-inner`}>
            {icon}
        </div>
    </div>
);

const getRandomStatus = () => {
    const r = Math.random();
    if (r > 0.9) return 'Absent';
    if (r > 0.8) return 'Late';
    return 'Present';
};

interface TeachersManagementTabProps {
    profile: UserProfile;
    branchId: number | null;
}

const TeachersManagementTab: React.FC<TeachersManagementTabProps> = ({ profile, branchId }) => {
    const [activeTab, setActiveTab] = useState<'directory' | 'departments'>('directory');
    const [teachers, setTeachers] = useState<TeacherExtended[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [quickFilter, setQuickFilter] = useState<QuickFilterType>('All');
    const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<TeacherExtended | null>(null);
    const [bulkAction, setBulkAction] = useState<BulkActionType | null>(null);
    const [isAiAuditOpen, setIsAiAuditOpen] = useState(false); 
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    const fetchTeachers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: rpcError } = await supabase.rpc('get_all_teachers_for_admin');
            if (rpcError) throw rpcError;
            
            const mappedTeachers: TeacherExtended[] = (data || []).map((t: any) => ({
                id: t.id,
                email: t.email,
                display_name: t.display_name,
                phone: t.phone,
                role: 'Teacher',
                is_active: t.is_active,
                profile_completed: true,
                created_at: t.created_at,
                details: {
                    subject: t.subject,
                    qualification: t.qualification,
                    experience_years: t.experience_years,
                    date_of_joining: t.date_of_joining,
                    bio: t.bio,
                    specializations: t.specializations,
                    profile_picture_url: t.profile_picture_url,
                    gender: t.gender,
                    date_of_birth: t.date_of_birth,
                    department: t.department,
                    designation: t.designation,
                    employee_id: t.employee_id,
                    employment_type: t.employment_type,
                    employment_status: t.employment_status || (t.is_active ? 'Active' : 'Inactive'),
                    branch_id: t.branch_id
                },
                dailyStatus: getRandomStatus() 
            }));
            setTeachers(mappedTeachers);
        } catch (err: any) {
            setError(`Failed to load teachers: ${err.message}`);
        } finally {
            setLoading(false);
            setSelectedIds(new Set());
        }
    }, []);

    useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

    const departments = useMemo(() => Array.from(new Set((teachers || []).map(t => t.details?.department).filter(Boolean))), [teachers]);
    const designations = useMemo(() => Array.from(new Set((teachers || []).map(t => t.details?.designation).filter(Boolean))), [teachers]);
    const years = useMemo(() => Array.from(new Set((teachers || []).map(t => t.details?.date_of_joining ? new Date(t.details.date_of_joining).getFullYear().toString() : '').filter(Boolean))).sort().reverse(), [teachers]);

    const filteredTeachers = useMemo(() => {
        return (teachers || []).filter(t => {
            const matchesBranch = !branchId || t.details?.branch_id === branchId;
            if (!matchesBranch) return false;
            const searchLower = searchTerm.toLowerCase();
            
            const displayName = t.display_name || '';
            const email = t.email || '';
            const employeeId = t.details?.employee_id || '';
            const phone = t.phone || '';
            const subject = t.details?.subject || '';
            const department = t.details?.department || '';

            const matchesSearch = !searchTerm || 
                displayName.toLowerCase().includes(searchLower) || 
                email.toLowerCase().includes(searchLower) || 
                employeeId.toLowerCase().includes(searchLower) || 
                phone.includes(searchLower) || 
                subject.toLowerCase().includes(searchLower) || 
                department.toLowerCase().includes(searchLower);

            let matchesQuickFilter = true;
            if (quickFilter === 'Active') matchesQuickFilter = t.is_active && t.details?.employment_status !== 'Pending Verification';
            if (quickFilter === 'Pending Verification') matchesQuickFilter = t.details?.employment_status === 'Pending Verification';
            if (quickFilter === 'On Leave') matchesQuickFilter = t.details?.employment_status === 'On Leave';
            if (quickFilter === 'Inactive') matchesQuickFilter = !t.is_active || t.details?.employment_status === 'Resigned' || t.details?.employment_status === 'Suspended';
            if (quickFilter === 'New Joinees') {
                const joinYear = t.details?.date_of_joining ? new Date(t.details.date_of_joining).getFullYear() : 0;
                const currentYear = new Date().getFullYear();
                matchesQuickFilter = joinYear === currentYear;
            }
            const matchesDepartment = !filters.department || t.details?.department === filters.department;
            const matchesDesignation = !filters.designation || t.details?.designation === filters.designation;
            const matchesType = !filters.employmentType || t.details?.employment_type === filters.employmentType;
            const matchesYear = !filters.joiningYear || (t.details?.date_of_joining && new Date(t.details.date_of_joining).getFullYear().toString() === filters.joiningYear);
            return matchesSearch && matchesQuickFilter && matchesDepartment && matchesDesignation && matchesType && matchesYear;
        });
    }, [teachers, searchTerm, quickFilter, filters, branchId]);

    const sortedTeachers = useMemo(() => {
        const sorted = [...filteredTeachers];
        sorted.sort((a, b) => {
            let aValue: any = '';
            let bValue: any = '';
            switch (sortConfig.key) {
                case 'name': aValue = a.display_name || ''; bValue = b.display_name || ''; break;
                case 'joining_date': aValue = new Date(a.details?.date_of_joining || 0).getTime(); bValue = new Date(b.details?.date_of_joining || 0).getTime(); break;
                case 'status': aValue = a.details?.employment_status || ''; bValue = b.details?.employment_status || ''; break;
                case 'department': aValue = a.details?.department || ''; bValue = b.details?.department || ''; break;
                default: return 0;
            }
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [filteredTeachers, sortConfig]);

    const totalPages = Math.max(1, Math.ceil(sortedTeachers.length / itemsPerPage));
    const paginatedTeachers = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedTeachers.slice(start, start + itemsPerPage);
    }, [sortedTeachers, currentPage, itemsPerPage]);

    const handleSort = (key: string) => setSortConfig(current => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }));

    const handleSelectAll = () => {
        const pageIds = paginatedTeachers.map(t => t.id);
        const allOnPageSelected = pageIds.every(id => selectedIds.has(id));
        
        const newSet = new Set(selectedIds);
        if (allOnPageSelected) {
            pageIds.forEach(id => newSet.delete(id));
        } else {
            pageIds.forEach(id => newSet.add(id));
        }
        setSelectedIds(newSet);
    };

    const handleSelectRow = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleExport = () => {
        const dataToExport = selectedIds.size > 0 ? sortedTeachers.filter(t => selectedIds.has(t.id)) : sortedTeachers;
        const csvContent = "data:text/csv;charset=utf-8,Name,Email,Phone,Employee ID,Department,Designation,Status\n" + dataToExport.map(t => `"${t.display_name || ''}","${t.email || ''}","${t.phone || ''}","${t.details?.employee_id || ''}","${t.details?.department || ''}","${t.details?.designation || ''}","${t.details?.employment_status || ''}"`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "teachers_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleBulkAction = (type: BulkActionType) => { if (selectedIds.size > 0 || type === 'import') setBulkAction(type); };

    const stats = useMemo(() => ({
        total: filteredTeachers.length,
        active: filteredTeachers.filter(t => t.is_active && t.details?.employment_status !== 'Pending Verification').length,
        departments: new Set(filteredTeachers.map(t => t.details?.department).filter(Boolean)).size,
        pending: filteredTeachers.filter(t => t.details?.employment_status === 'Pending Verification').length
    }), [filteredTeachers]);

    const StatusBadge = ({ status }: { status?: string }) => {
        let styles = 'bg-gray-100 text-gray-600 border-gray-200';
        let icon = null;
        if (status === 'Active') { styles = 'bg-emerald-50 text-emerald-700 border-emerald-200'; icon = <CheckCircleIcon className="w-3 h-3"/>; }
        else if (status === 'Pending Verification') { styles = 'bg-amber-50 text-amber-700 border-amber-200'; icon = <ClockIcon className="w-3 h-3"/>; }
        else if (status === 'On Leave') { styles = 'bg-blue-50 text-blue-700 border-blue-200'; }
        else if (status === 'Suspended' || status === 'Resigned') { styles = 'bg-red-50 text-red-700 border-red-200'; }
        return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${styles}`}>{icon} {status || 'Unknown'}</span>;
    };

    const AttendanceBadge = ({ status }: { status?: string }) => {
        if (status === 'Present') return <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-green-100" title="Present Today"></span>;
        if (status === 'Absent') return <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-100" title="Absent Today"></span>;
        if (status === 'Late') return <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-100" title="Late Arrival"></span>;
        return <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-300"></span>;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Total Faculty" value={stats.total} icon={<TeacherIcon className="h-6 w-6" />} colorClass="bg-indigo-500 text-white" trend="+2 this month" />
                <KPICard title="Active Teachers" value={stats.active} icon={<CheckCircleIcon className="h-6 w-6" />} colorClass="bg-emerald-500 text-white" />
                <KPICard title="Departments" value={stats.departments} icon={<GridIcon className="h-6 w-6" />} colorClass="bg-amber-500 text-white" />
                <KPICard title="Pending Verification" value={stats.pending} icon={<BriefcaseIcon className="h-6 w-6" />} colorClass="bg-purple-500 text-white" trend={stats.pending > 0 ? "Action Required" : undefined} />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div className="flex space-x-1 bg-muted p-1 rounded-xl border border-border w-fit shadow-sm">
                    <button onClick={() => setActiveTab('directory')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'directory' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>Faculty Directory</button>
                    <button onClick={() => setActiveTab('departments')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'departments' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>Departments</button>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsGuideOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-background text-foreground font-bold text-sm rounded-xl hover:bg-muted transition-colors border border-border"><WorkflowIcon className="w-4 h-4 text-muted-foreground" /> Process Guide</button>
                    <button onClick={() => setIsAiAuditOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300 font-bold text-sm rounded-xl hover:bg-violet-200 dark:hover:bg-violet-900/40 transition-colors border border-violet-200 dark:border-violet-800"><SparklesIcon className="w-4 h-4" /> AI Audit</button>
                </div>
            </div>

            {activeTab === 'departments' ? <DepartmentsTab teachers={teachers} branchId={branchId} /> : (
                <>
                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden transition-all duration-300">
                        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/10">
                            <div className="relative w-full md:max-w-lg group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors"><SearchIcon className="h-5 w-5" /></div>
                                <input type="text" placeholder="Search by Name, Email, ID, Subject..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-input rounded-xl leading-5 bg-background placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" />
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border transition-all ${showAdvancedFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-background border-input hover:bg-muted text-foreground'}`}><FilterIcon className="w-4 h-4" /> Filters</button>
                                <button onClick={() => setBulkAction('import')} className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border bg-background border-input hover:bg-muted text-foreground"><UploadIcon className="w-4 h-4"/> Import</button>
                                <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:-translate-y-0.5"><PlusIcon className="w-4 h-4"/> Add Teacher</button>
                            </div>
                        </div>
                        <div className="px-4 py-3 bg-background border-b border-border overflow-x-auto flex items-center gap-2 scrollbar-hide">
                            {(['All', 'Active', 'New Joinees', 'Pending Verification', 'On Leave', 'Inactive'] as QuickFilterType[]).map(chip => <button key={chip} onClick={() => { setQuickFilter(chip); setCurrentPage(1); }} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${quickFilter === chip ? 'bg-foreground text-background border-foreground shadow-md' : 'bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'}`}>{chip}</button>)}
                        </div>
                        {showAdvancedFilters && (
                            <div className="p-6 bg-muted/30 border-b border-border animate-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                    <select value={filters.department} onChange={e => setFilters({...filters, department: e.target.value})} className="h-10 px-3 rounded-lg border border-input bg-background text-sm"><option value="">All Departments</option>{departments.map(d => <option key={d} value={d as string}>{d}</option>)}</select>
                                    <select value={filters.designation} onChange={e => setFilters({...filters, designation: e.target.value})} className="h-10 px-3 rounded-lg border border-input bg-background text-sm"><option value="">All Designations</option>{designations.map(d => <option key={d} value={d as string}>{d}</option>)}</select>
                                    <select value={filters.employmentType} onChange={e => setFilters({...filters, employmentType: e.target.value})} className="h-10 px-3 rounded-lg border border-input bg-background text-sm"><option value="">All Types</option><option value="Full-time">Full-time</option><option value="Part-time">Part-time</option><option value="Contract">Contract</option></select>
                                    <select value={filters.joiningYear} onChange={e => setFilters({...filters, joiningYear: e.target.value})} className="h-10 px-3 rounded-lg border border-input bg-background text-sm"><option value="">All Years</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                        {selectedIds.size > 0 && (
                            <div className="px-6 py-3 bg-primary/5 border-b border-primary/10 flex items-center justify-between animate-in fade-in sticky top-0 z-20">
                                <div className="flex items-center gap-4"><span className="text-sm font-bold text-primary">{selectedIds.size} selected</span><div className="h-4 w-px bg-primary/20"></div><button onClick={() => handleBulkAction('status')} className="text-xs font-bold text-muted-foreground hover:text-primary flex items-center gap-1.5 px-2 py-1 rounded hover:bg-primary/5 transition-colors"><CheckCircleIcon className="w-3.5 h-3.5"/> Set Status</button><button onClick={() => handleBulkAction('department')} className="text-xs font-bold text-muted-foreground hover:text-primary flex items-center gap-1.5 px-2 py-1 rounded hover:bg-primary/5 transition-colors"><BriefcaseIcon className="w-3.5 h-3.5"/> Assign Dept</button><button onClick={() => handleBulkAction('subject')} className="text-xs font-bold text-muted-foreground hover:text-primary flex items-center gap-1.5 px-2 py-1 rounded hover:bg-primary/5 transition-colors"><BookIcon className="w-3.5 h-3.5"/> Assign Subject</button><button onClick={() => handleBulkAction('transfer')} className="text-xs font-bold text-muted-foreground hover:text-primary flex items-center gap-1.5 px-2 py-1 rounded hover:bg-primary/5 transition-colors"><TransferIcon className="w-3.5 h-3.5"/> Transfer</button><button onClick={() => handleBulkAction('message')} className="text-xs font-bold text-muted-foreground hover:text-primary flex items-center gap-1.5 px-2 py-1 rounded hover:bg-primary/5 transition-colors"><CommunicationIcon className="w-3.5 h-3.5"/> Message</button></div>
                                <div className="flex gap-2"><button onClick={handleExport} className="px-3 py-1.5 bg-white border border-border text-xs font-bold rounded-lg shadow-sm hover:bg-muted flex items-center gap-2"><DownloadIcon className="w-3.5 h-3.5"/> Export</button><button className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-lg shadow-sm hover:bg-red-100 flex items-center gap-2"><TrashIcon className="w-3.5 h-3.5"/> Delete</button></div>
                            </div>
                        )}
                        {loading ? <div className="flex-grow flex items-center justify-center"><Spinner size="lg" /></div> : filteredTeachers.length === 0 ? (
                            <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground p-10"><div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4"><UsersIcon className="w-10 h-10 opacity-20" /></div><p className="font-medium text-lg">No teachers found</p><button onClick={() => { setSearchTerm(''); setQuickFilter('All'); setFilters(INITIAL_FILTERS); }} className="mt-4 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-bold text-foreground">Clear All Filters</button></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-muted/30 border-b border-border sticky top-0 z-10 backdrop-blur-md">
                                        <tr>
                                            <th className="p-4 w-10 text-center"><input type="checkbox" className="rounded border-input text-primary focus:ring-primary cursor-pointer w-4 h-4" checked={selectedIds.size > 0 && selectedIds.size === paginatedTeachers.length} onChange={handleSelectAll} /></th>
                                            <th className="p-4 font-bold text-muted-foreground uppercase text-xs tracking-wider cursor-pointer hover:text-foreground group" onClick={() => handleSort('name')}>Faculty Member {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                                            <th className="p-4 font-bold text-muted-foreground uppercase text-xs tracking-wider">Contact</th>
                                            <th className="p-4 font-bold text-muted-foreground uppercase text-xs tracking-wider">Emp ID</th>
                                            <th className="p-4 font-bold text-muted-foreground uppercase text-xs tracking-wider">Dept</th>
                                            <th className="p-4 font-bold text-muted-foreground uppercase text-xs tracking-wider">Daily Status</th>
                                            <th className="p-4 font-bold text-muted-foreground uppercase text-xs tracking-wider">Status</th>
                                            <th className="p-4 text-right pr-8">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {paginatedTeachers.map((teacher) => (
                                            <tr key={teacher.id} className={`group hover:bg-muted/30 transition-colors cursor-pointer ${selectedIds.has(teacher.id) ? 'bg-primary/5' : ''}`} onClick={() => setSelectedTeacher(teacher)}>
                                                <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="rounded border-input text-primary focus:ring-primary cursor-pointer w-4 h-4" checked={selectedIds.has(teacher.id)} onChange={() => handleSelectRow(teacher.id)} /></td>
                                                <td className="p-4"><div className="flex items-center gap-3"><div className="relative"><div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm overflow-hidden border-2 border-background">{teacher.details?.profile_picture_url ? <img src={teacher.details.profile_picture_url} className="w-full h-full object-cover" alt=""/> : (teacher.display_name || '?').charAt(0)}</div><div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${(teacher as any).dailyStatus === 'Present' ? 'bg-green-500' : (teacher as any).dailyStatus === 'Absent' ? 'bg-red-500' : 'bg-amber-500'}`}></div></div><div><p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{teacher.display_name}</p><p className="text-[10px] text-muted-foreground uppercase font-bold">{teacher.details?.designation || 'Teacher'}</p></div></div></td>
                                                <td className="p-4"><div className="flex flex-col gap-1"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MailIcon className="w-3 h-3"/> <span className="truncate max-w-[150px]" title={teacher.email || ''}>{teacher.email || ''}</span></div>{teacher.phone && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><PhoneIcon className="w-3 h-3"/> {teacher.phone}</div>}</div></td>
                                                <td className="p-4 text-xs font-mono font-medium text-muted-foreground">{teacher.details?.employee_id || '—'}</td>
                                                <td className="p-4">{teacher.details?.department && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground border border-border">{teacher.details.department}</span>}</td>
                                                <td className="p-4"><AttendanceBadge status={(teacher as any).dailyStatus} /></td>
                                                <td className="p-4"><StatusBadge status={teacher.details?.employment_status} /></td>
                                                <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}><button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><MoreHorizontalIcon className="w-5 h-5"/></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="p-4 border-t border-border bg-muted/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-muted-foreground">
                            <div className="flex items-center gap-2"><span>Rows:</span><select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-background border border-input rounded px-2 py-1"><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select><span className="ml-2">Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedTeachers.length)} of {sortedTeachers.length}</span></div>
                            <div className="flex items-center gap-2"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-background disabled:opacity-50 border border-transparent hover:border-border transition-all"><ChevronLeftIcon className="w-4 h-4"/></button><span className="mx-2 font-bold text-foreground">Page {currentPage} of {totalPages}</span><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-background disabled:opacity-50 border border-transparent hover:border-border transition-all"><ChevronRightIcon className="w-4 h-4"/></button></div>
                        </div>
                    </div>
                </>
            )}
            {isAddModalOpen && <AddTeacherModal onClose={() => setIsAddModalOpen(false)} onSuccess={fetchTeachers} branchId={branchId} />}
            {selectedTeacher && <TeacherDetailModal teacher={selectedTeacher} onClose={() => setSelectedTeacher(null)} onUpdate={fetchTeachers} />}
            {bulkAction && <BulkActionsModal action={bulkAction} selectedIds={Array.from(selectedIds)} onClose={() => setBulkAction(null)} onSuccess={() => { fetchTeachers(); setSelectedIds(new Set()); }} branchId={branchId} />}
            {isAiAuditOpen && <TeacherAiAuditModal onClose={() => setIsAiAuditOpen(false)} />}
            {isGuideOpen && <TeacherWorkflowGuide onClose={() => setIsGuideOpen(false)} />}
        </div>
    );
};

export default TeachersManagementTab;