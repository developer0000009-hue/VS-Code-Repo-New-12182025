import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Course, UserProfile, CourseStatus, BuiltInRoles } from '../types';
import { BookIcon } from './icons/BookIcon';
import { SearchIcon } from './icons/SearchIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TeacherIcon } from './icons/TeacherIcon';
import Spinner from './common/Spinner';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { FilterIcon } from './icons/FilterIcon';
import { UsersIcon } from './icons/UsersIcon';
import { EditIcon } from './icons/EditIcon';
import { MoreHorizontalIcon } from './icons/MoreHorizontalIcon';
import { CourseCreationWizard } from './courses/CourseCreationWizard';
import { CourseProfileView } from './courses/CourseProfileView';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import BulkCourseActionsModal, { BulkCourseActionType } from './courses/BulkCourseActionsModal';
import { UploadIcon } from './icons/UploadIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ArchiveIcon } from './icons/ArchiveIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { ClockIcon } from './icons/ClockIcon';
import { SparklesIcon } from './icons/SparklesIcon';

const useAnimatedCounter = (endValue: number, duration = 1500) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const frameRate = 1000 / 60;
        const totalFrames = Math.round(duration / frameRate);
        const increment = endValue / totalFrames;
        let currentFrame = 0;

        const timer = setInterval(() => {
            currentFrame++;
            start += increment;
            if (currentFrame >= totalFrames) {
                setCount(endValue);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, frameRate);

        return () => clearInterval(timer);
    }, [endValue, duration]);
    return count;
};

// --- Enhanced KPI Card ---
const KPICard: React.FC<{ 
    title: string; 
    value: number; 
    icon: React.ReactNode; 
    color: string;
    subtext?: string;
}> = ({ title, value, icon, color, subtext }) => {
    const animatedValue = useAnimatedCounter(value);
    return (
        <div className="bg-card border border-border/60 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-lg transition-all duration-300 group hover:-translate-y-0.5">
            <div>
                <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1.5">{title}</p>
                <h3 className="text-3xl font-black text-foreground tracking-tight">{animatedValue}</h3>
                {subtext && <p className="text-[10px] font-semibold text-muted-foreground mt-1">{subtext}</p>}
            </div>
            <div className={`p-3.5 rounded-xl ${color} text-white shadow-sm ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300`}>
                {icon}
            </div>
        </div>
    );
};

// --- Status Badge ---
const StatusBadge: React.FC<{ status: CourseStatus }> = ({ status }) => {
    const config = {
        'Active': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-800', label: 'Active' },
        'Draft': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', border: 'border-amber-200 dark:border-amber-800', label: 'Draft' },
        'Archived': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500', border: 'border-blue-200 dark:border-blue-800', label: 'Archived' },
        'Pending': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500', border: 'border-purple-200 dark:border-purple-800', label: 'Pending Assignment' },
        'Inactive': { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-400', border: 'border-slate-200 dark:border-slate-700', label: 'Inactive' },
    };
    
    const style = config[status] || config['Inactive'];

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${style.bg} ${style.text} ${style.border} shadow-sm`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${style.dot} ${status === 'Active' ? 'animate-pulse' : ''}`}></span>
            {style.label}
        </span>
    );
};

interface CoursesTabProps {
    profile?: UserProfile;
}

const CoursesTab: React.FC<CoursesTabProps> = ({ profile }) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState<'All' | 'New' | 'Core' | 'Elective'>('All');
    const [filters, setFilters] = useState({ grade: 'All', department: 'All', status: 'All', type: 'All', teacherStatus: 'All' });
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'title', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [bulkAction, setBulkAction] = useState<BulkCourseActionType | null>(null);
    const [bulkIds, setBulkIds] = useState<number[]>([]);

    const userRole = profile?.role;
    const isFullAdmin = userRole === BuiltInRoles.SCHOOL_ADMINISTRATION || userRole === BuiltInRoles.BRANCH_ADMIN;

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('courses').select('*, teacher:teacher_id(display_name), modules:course_modules(count), enrollments:course_enrollments(count)');
        if (!error && data) {
            const formattedData: Course[] = data.map((c: any) => ({
                ...c,
                teacher_name: c.teacher?.display_name,
                modules_count: c.modules?.[0]?.count || 0,
                enrolled_count: c.enrollments?.[0]?.count || 0,
                subject_type: c.subject_type || c.category 
            }));
            setCourses(formattedData);
        }
        setLoading(false);
        setSelectedIds(new Set());
    }, []);

    useEffect(() => { fetchCourses(); }, [fetchCourses]);

    const processedCourses = useMemo(() => {
        let data = courses.filter(c => {
            const searchLower = searchText.toLowerCase();
            const matchesSearch = !searchText || 
                c.title.toLowerCase().includes(searchLower) || 
                c.code.toLowerCase().includes(searchLower) || 
                (c.teacher_name || '').toLowerCase().includes(searchLower) ||
                (c.department || '').toLowerCase().includes(searchLower);

            if (!matchesSearch) return false;

            if (activeTab === 'New') {
                const created = new Date(c.created_at || '');
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                if (created < thirtyDaysAgo) return false;
            }
            if (activeTab === 'Core' && c.category !== 'Core') return false;
            if (activeTab === 'Elective' && c.category !== 'Elective') return false;

            return true;
        });

        return data.sort((a, b) => {
            let aValue: any = a[sortConfig.key as keyof Course];
            let bValue: any = b[sortConfig.key as keyof Course];
            if (aValue === null || aValue === undefined) aValue = '';
            if (bValue === null || bValue === undefined) bValue = '';
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            }
            return sortConfig.direction === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
        });
    }, [courses, searchText, activeTab, sortConfig]);

    const paginatedCourses = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return processedCourses.slice(start, start + itemsPerPage);
    }, [processedCourses, currentPage, itemsPerPage]);
    const totalPages = Math.ceil(processedCourses.length / itemsPerPage);

    const stats = useMemo(() => ({
        total: courses.length,
        active: courses.filter(c => c.status === 'Active').length,
        draft: courses.filter(c => c.status === 'Draft').length,
        students: courses.reduce((acc, c) => acc + (c.enrolled_count || 0), 0)
    }), [courses]);

    return (
        <div className="space-y-8 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Course Management</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Manage curriculum, assignments, and academic structure.</p>
                </div>
                {isFullAdmin && (
                    <div className="flex gap-3">
                        <button 
                            onClick={() => { setBulkAction('import'); setBulkIds([]); }}
                            className="px-5 py-3 bg-card hover:bg-muted text-foreground font-bold rounded-xl border border-border/60 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                        >
                            <UploadIcon className="w-4 h-4" /> Bulk Upload
                        </button>
                        <button 
                            onClick={() => setIsWizardOpen(true)}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:scale-95"
                        >
                            <SparklesIcon className="w-5 h-5" /> Create Course
                        </button>
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Total Courses" value={stats.total} icon={<BookIcon className="w-6 h-6"/>} color="bg-blue-500" subtext="All subjects" />
                <KPICard title="Active Courses" value={stats.active} icon={<CheckCircleIcon className="w-6 h-6"/>} color="bg-emerald-500" subtext="Live & running" />
                <KPICard title="Total Enrollment" value={stats.students} icon={<UsersIcon className="w-6 h-6"/>} color="bg-purple-500" subtext="Across all subjects" />
                <KPICard title="Drafts Pending" value={stats.draft} icon={<EditIcon className="w-6 h-6"/>} color="bg-orange-500" subtext="Courses under creation" />
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                <div className="p-4 border-b border-border bg-muted/5 flex flex-col xl:flex-row gap-4 justify-between items-center sticky top-0 z-20 backdrop-blur-md">
                    <div className="relative w-full xl:w-96 group">
                        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors"/>
                        <input 
                            type="text" 
                            placeholder="Search course name, code, teacher, or department..." 
                            value={searchText} 
                            onChange={e => setSearchText(e.target.value)} 
                            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" 
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide w-full xl:w-auto p-1">
                        {['All', 'New', 'Core', 'Elective'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab as any); setCurrentPage(1); }}
                                className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${activeTab === tab ? 'bg-primary/10 text-primary border-primary/20 shadow-sm' : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted/50 hover:text-foreground'}`}
                            >
                                {tab === 'All' ? 'All Courses' : tab}
                            </button>
                        ))}
                        <div className="h-6 w-px bg-border mx-1"></div>
                        <button className="p-2.5 rounded-xl transition-colors border text-muted-foreground border-transparent hover:bg-muted/30" title="Filters"><FilterIcon className="w-4 h-4"/></button>
                        <button onClick={fetchCourses} className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-colors" title="Refresh List"><RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
                    </div>
                </div>

                <div className="flex-grow p-6 bg-muted/5">
                    {loading ? (
                        <div className="flex h-64 items-center justify-center"><Spinner size="lg"/></div>
                    ) : processedCourses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-border group">
                                <BookIcon className="w-10 h-10 text-muted-foreground/50 group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">No Courses Found</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm">Try adjusting your filters or search criteria to find what you're looking for.</p>
                            {isFullAdmin && (
                                <button onClick={() => setIsWizardOpen(true)} className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                                    Create Your First Course
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                           {paginatedCourses.map(course => (
                                <div key={course.id} onClick={() => setSelectedCourse(course)} className="group relative bg-card border rounded-2xl p-5 transition-all duration-300 flex flex-col h-full cursor-pointer border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-1">
                                    <div className="flex items-start gap-3 mb-4 pr-6">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm flex-shrink-0"><BookIcon className="w-5 h-5"/></div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-base text-foreground truncate group-hover:text-primary transition-colors">{course.title}</h4>
                                            <p className="text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/50 w-fit mt-1">{course.code}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3 flex-grow border-t border-border/40 pt-4 mb-4">
                                        <div className="flex items-center gap-2.5 text-sm text-muted-foreground"><TeacherIcon className="w-4 h-4"/> <span className="truncate font-medium text-foreground/80">{course.teacher_name || 'Unassigned'}</span></div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-xs font-medium text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">Grade {course.grade_level}</span>
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-900/20 text-xs font-medium text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800">{course.department || 'General'}</span>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-border/50 flex items-end justify-between gap-4 mt-auto">
                                         <div className="flex-grow">
                                             <div className="flex justify-between text-[9px] font-bold uppercase text-muted-foreground mb-1.5"><span>Enrollment</span><span>{course.enrolled_count} Students</span></div>
                                             <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden shadow-inner"><div className="h-full bg-primary/80 rounded-full" style={{ width: `${Math.min((course.enrolled_count || 0) * 2, 100)}%` }}></div></div>
                                         </div>
                                         <div className="flex items-center gap-2 flex-shrink-0">
                                            <StatusBadge status={course.status} />
                                         </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {processedCourses.length > 0 && (
                    <div className="p-4 border-t border-border bg-muted/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-muted-foreground">
                        <div className="flex items-center gap-2"><span>Rows per page:</span><select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-background border border-input rounded px-2 py-1 focus:ring-1 focus:ring-primary"><option value={12}>12</option><option value={24}>24</option><option value={48}>48</option></select></div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-background disabled:opacity-50 border border-transparent hover:border-border"><ChevronLeftIcon className="w-4 h-4"/></button>
                            <span className="mx-2 font-bold text-foreground">Page {currentPage} of {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-background disabled:opacity-50 border border-transparent hover:border-border"><ChevronRightIcon className="w-4 h-4"/></button>
                        </div>
                    </div>
                )}
            </div>

            {isWizardOpen && <CourseCreationWizard onClose={() => setIsWizardOpen(false)} onSuccess={fetchCourses} />}
            {selectedCourse && <CourseProfileView course={selectedCourse} onClose={() => setSelectedCourse(null)} profile={profile} />}
            {bulkAction && <BulkCourseActionsModal action={bulkAction} selectedIds={bulkIds} onClose={() => setBulkAction(null)} onSuccess={() => { fetchCourses(); setBulkAction(null); }} />}
        </div>
    );
};

export default CoursesTab;