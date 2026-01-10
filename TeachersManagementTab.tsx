
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase, formatError } from './services/supabase';
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
import { UploadIcon } from './components/icons/UploadIcon';
import { ClockIcon } from './components/icons/ClockIcon';
import AddTeacherModal from './components/AddTeacherModal';
import TeacherDetailModal from './components/TeacherDetailModal';
import BulkActionsModal, { BulkActionType } from './components/teachers/BulkActionsModal';
import DepartmentsTab from './components/teachers/DepartmentsTab';

type QuickFilterType = 'All' | 'Active' | 'New Joinees' | 'Pending Verification' | 'On Leave' | 'Inactive';

interface FilterState {
    department: string;
    designation: string;
    employmentType: string;
    joiningYear: string;
    grade: string;
    specialization: string;
}

const INITIAL_FILTERS: FilterState = {
    department: '',
    designation: '',
    employmentType: '',
    joiningYear: '',
    grade: '',
    specialization: ''
};

const KPICard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; colorClass?: string; trend?: string }> = ({ title, value, icon, colorClass = "text-primary bg-primary/10", trend }) => (
    <div className="bg-card hover:bg-card/80 p-5 rounded-2xl shadow-sm border border-border flex items-start justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group">
        <div><p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{title}</p><p className="text-3xl font-extrabold text-foreground tracking-tight">{value}</p>{trend && <p className="text-[10px] text-emerald-600 mt-1 font-semibold">{trend}</p>}</div>
        <div className={`p-3 rounded-xl ${colorClass} transition-transform group-hover:scale-110 shadow-inner`}>{icon}</div>
    </div>
);

const getRandomStatus = () => {
    const r = Math.random();
    if (r > 0.9) return 'Absent';
    if (r > 0.8) return 'Late';
    return 'Present';
};

const StatusBadge = ({ status }: { status?: string }) => {
    let styles = 'bg-gray-100 text-gray-600 border-gray-200';
    let icon = null;
    if (status === 'Active') { styles = 'bg-emerald-50 text-emerald-700 border-emerald-200'; icon = <CheckCircleIcon className="w-3 h-3"/>; }
    else if (status === 'Pending Verification') { styles = 'bg-amber-50 text-amber-700 border-amber-200'; icon = <ClockIcon className="w-3 h-3"/>; }
    else if (status === 'On Leave') { styles = 'bg-blue-50 text-blue-700 border-blue-200'; }
    else if (status === 'Suspended' || status === 'Resigned') { styles = 'bg-red-50 text-red-700 border-red-200'; }
    return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${styles}`}>{icon} {status || 'Unknown'}</span>;
};

interface TeachersManagementTabProps {
    profile: UserProfile;
    branchId: string | null;
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

    const fetchTeachers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: rpcError } = await supabase.rpc('get_all_teachers_for_admin');
            if (rpcError) throw rpcError;
            if (!data) { setTeachers([]); return; }
            const mappedTeachers: TeacherExtended[] = data.map((t: any) => ({
                id: t.id,
                email: t.email,
                display_name: t.display_name,
                phone: t.phone,
                role: 'Teacher',
                is_active: t.is_active,
                profile_completed: true,
                created_at: t.created_at,
                details: {
                    subject: t.subject, qualification: t.qualification, experience_years: t.experience_years, date_of_joining: t.date_of_joining,
                    bio: t.bio, specializations: t.specializations, profile_picture_url: t.profile_picture_url, gender: t.gender,
                    date_of_birth: t.date_of_birth, department: t.department, designation: t.designation, employee_id: t.employee_id,
                    employment_type: t.employment_type, employment_status: t.employment_status || (t.is_active ? 'Active' : 'Inactive'), branch_id: t.branch_id
                },
                dailyStatus: getRandomStatus() 
            }));
            setTeachers(mappedTeachers);
        } catch (err: any) { setError(formatError(err)); } finally { setLoading(false); setSelectedIds(new Set()); }
    }, []);

    useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

    const filteredTeachers = useMemo(() => {
        return teachers.filter(t => {
            const matchesBranch = !branchId || t.details?.branch_id === branchId;
            if (!matchesBranch) return false;
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || t.display_name.toLowerCase().includes(searchLower) || t.email.toLowerCase().includes(searchLower);
            let matchesQuickFilter = true;
            if (quickFilter === 'Active') matchesQuickFilter = t.is_active;
            const matchesDepartment = !filters.department || t.details?.department === filters.department;
            return matchesSearch && matchesQuickFilter && matchesDepartment;
        });
    }, [teachers, searchTerm, quickFilter, filters, branchId]);

    const sortedTeachers = useMemo(() => {
        const sorted = [...filteredTeachers];
        sorted.sort((a, b) => {
            const aValue = a.display_name;
            const bValue = b.display_name;
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [filteredTeachers, sortConfig]);

    const stats = useMemo(() => ({
        total: filteredTeachers.length,
        active: filteredTeachers.filter(t => t.is_active).length,
        departments: new Set(filteredTeachers.map(t => t.details?.department).filter(Boolean)).size,
        pending: filteredTeachers.filter(t => t.details?.employment_status === 'Pending Verification').length
    }), [filteredTeachers]);

    const totalPages = Math.ceil(sortedTeachers.length / itemsPerPage);
    const paginatedTeachers = useMemo(() => sortedTeachers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [sortedTeachers, currentPage, itemsPerPage]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"><KPICard title="Total Faculty" value={stats.total} icon={<TeacherIcon className="h-6 w-6" />} colorClass="bg-indigo-500 text-white" trend="+2 this month" /><KPICard title="Active Teachers" value={stats.active} icon={<CheckCircleIcon className="h-6 w-6" />} colorClass="bg-emerald-500 text-white" /><KPICard title="Departments" value={stats.departments} icon={<GridIcon className="h-6 w-6" />} colorClass="bg-amber-500 text-white" /><KPICard title="Pending Verification" value={stats.pending} icon={<BriefcaseIcon className="h-6 w-6" />} colorClass="bg-purple-500 text-white" /></div><div className="flex space-x-1 bg-muted p-1 rounded-xl border border-border w-fit shadow-sm"><button onClick={() => setActiveTab('directory')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'directory' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>Faculty Directory</button><button onClick={() => setActiveTab('departments')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'departments' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>Departments</button></div>{activeTab === 'departments' ? (<><DepartmentsTab teachers={teachers} branchId={branchId} /></>) : (<><div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden transition-all duration-300"><div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/10"><div className="relative w-full md:max-w-lg group"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors"><SearchIcon className="h-5 w-5" /></div><input type="text" placeholder="Search by Name, Email, ID, Subject..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-input rounded-xl leading-5 bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm" /></div><div className="flex items-center gap-3 w-full md:w-auto"><button onClick={() => setBulkAction('import')} className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border bg-background border-input hover:bg-muted text-foreground"><UploadIcon className="w-4 h-4"/> Import</button><button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/25 hover:-translate-y-0.5"><PlusIcon className="w-4 h-4"/> Add Teacher</button></div></div><div className="px-4 py-3 bg-background border-b border-border overflow-x-auto flex items-center gap-2 scrollbar-hide">{(['All', 'Active', 'New Joinees', 'Pending Verification', 'On Leave', 'Inactive'] as QuickFilterType[]).map(chip => (<button key={chip} onClick={() => { setQuickFilter(chip); setCurrentPage(1); }} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${quickFilter === chip ? 'bg-foreground text-background border-foreground shadow-md' : 'bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'}`}>{chip}</button>))}</div></div><div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">{loading ? (<div className="flex-grow flex items-center justify-center"><Spinner size="lg" /></div>) : filteredTeachers.length === 0 ? (<div className="flex-grow flex flex-col items-center justify-center text-muted-foreground p-10"><p className="font-medium text-lg">No teachers found</p></div>) : (<div className="overflow-x-auto"><table className="w-full text-left text-sm whitespace-nowrap"><thead className="bg-muted/30 border-b border-border sticky top-0 z-10 backdrop-blur-md"><tr><th className="p-4 font-bold text-muted-foreground uppercase text-xs tracking-wider">Faculty Member</th><th className="p-4 font-bold text-muted-foreground uppercase text-xs tracking-wider">Contact</th><th className="p-4 font-bold text-muted-foreground uppercase text-xs tracking-wider">Status</th><th className="p-4 text-right pr-8">Actions</th></tr></thead><tbody className="divide-y divide-border/50">{paginatedTeachers.map((teacher) => (<tr key={teacher.id} className={`group hover:bg-muted/30 transition-colors cursor-pointer`} onClick={() => setSelectedTeacher(teacher)}><td className="p-4"><div className="flex items-center gap-3"><div><p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{teacher.display_name}</p><p className="text-[10px] text-muted-foreground uppercase font-bold">{teacher.details?.designation || 'Teacher'}</p></div></div></td><td className="p-4"><div className="flex flex-col gap-1"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MailIcon className="w-3 h-3"/> {teacher.email}</div></div></td><td className="p-4"><StatusBadge status={teacher.details?.employment_status} /></td><td className="p-4 text-right"><button className="p-1.5 rounded-lg hover:bg-muted transition-colors"><MoreHorizontalIcon className="w-5 h-5"/></button></td></tr>))}</tbody></table></div>)}<div className="p-4 border-t border-border bg-muted/10 flex justify-between items-center text-xs font-medium text-muted-foreground"><span>Page {currentPage} of {totalPages}</span><div className="flex items-center gap-2"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-background disabled:opacity-50 transition-all"><ChevronLeftIcon className="w-4 h-4"/></button><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-background disabled:opacity-50 transition-all"><ChevronRightIcon className="w-4 h-4"/></button></div></div></div></>)} {isAddModalOpen && <AddTeacherModal onClose={() => setIsAddModalOpen(false)} onSuccess={fetchTeachers} branchId={branchId} />} {selectedTeacher && <TeacherDetailModal teacher={selectedTeacher} onClose={() => setSelectedTeacher(null)} onUpdate={fetchTeachers} />} {bulkAction && <BulkActionsModal action={bulkAction} selectedIds={Array.from(selectedIds)} onClose={() => setBulkAction(null)} onSuccess={() => { fetchTeachers(); setSelectedIds(new Set()); }} branchId={branchId} />} </div>
    );
};

export default TeachersManagementTab;
