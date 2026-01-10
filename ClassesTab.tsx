import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, formatError } from './services/supabase';
import { SchoolClass, Course, UserProfile, SchoolAdminProfileData } from './types';
import Spinner from './components/common/Spinner';
import { ClassIcon } from './components/icons/ClassIcon';
import { PlusIcon } from './components/icons/PlusIcon';
import { SearchIcon } from './components/icons/SearchIcon';
import { EditIcon } from './components/icons/EditIcon';
import { TrashIcon } from './components/icons/TrashIcon';
import { UsersIcon } from './components/icons/UsersIcon';
import { TeacherIcon } from './components/icons/TeacherIcon';
import { XIcon } from './components/icons/XIcon';
import { ChartBarIcon } from './components/icons/ChartBarIcon';
import { BookIcon } from './components/icons/BookIcon';
import { FilterIcon } from './components/icons/FilterIcon';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';
import { AlertTriangleIcon } from './components/icons/AlertTriangleIcon';
import { ClockIcon } from './components/icons/ClockIcon';
import { MoreHorizontalIcon } from './components/icons/MoreHorizontalIcon';
import { UploadIcon } from './components/icons/UploadIcon';
import { ChevronRightIcon } from './components/icons/ChevronRightIcon';
import { ChevronLeftIcon } from './components/icons/ChevronLeftIcon';
import BulkClassOperationsModal from './components/classes/BulkClassOperationsModal';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { GridIcon } from './components/icons/GridIcon';
import { GoogleGenAI } from '@google/genai';
import CreateClassWizard from './components/classes/CreateClassWizard';
import ClassWorkspace from './components/classes/ClassWorkspace';

// --- Types ---

interface ExtendedClass extends SchoolClass {
    id: string;
    name: string;
    grade_level: string;
    capacity: number;
    class_teacher_id?: string | null; 
    teacher_name?: string;
    student_count?: number;
    created_at?: string;
}

type QuickFilterType = 'All' | 'No Teacher' | 'No Students' | 'Overloaded' | 'New' | 'Full';
type ClassStatus = 'Active' | 'Pending Setup' | 'Inactive' | 'Draft' | 'Overloaded';

interface ClassesTabProps {
    branchId?: string | null;
}

// --- Local Components ---

const SortIcon: React.FC<{ direction: 'ascending' | 'descending' | null }> = ({ direction }) => (
    <svg className={`w-3 h-3 ml-1 transition-transform duration-200 ${direction === 'descending' ? 'rotate-180' : ''} ${direction ? 'opacity-100' : 'opacity-30'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

const KPICard: React.FC<{ 
    title: string; 
    value: number; 
    subValue?: string | React.ReactNode;
    icon: React.ReactNode; 
    color: string;
    trend?: string;
    onClick?: () => void;
    active?: boolean;
}> = ({ title, value, subValue, icon, color, trend, onClick, active }) => {
    const colorBase = color.split('-')[1]; 
    return (
        <div 
            onClick={onClick}
            className={`
                relative overflow-hidden rounded-2xl p-6 transition-all duration-300 cursor-pointer group
                ${active 
                    ? 'bg-card ring-2 ring-primary shadow-lg shadow-primary/10 transform -translate-y-1' 
                    : 'bg-card hover:shadow-xl hover:-translate-y-1 border border-border/60 hover:border-border'
                }
            `}
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-${colorBase}-500/10 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110`}></div>
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                        {title}
                        {trend && <span className="text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[9px]">{trend}</span>}
                    </p>
                    <h3 className="text-3xl font-black text-foreground tracking-tight">{value}</h3>
                    {subValue && <div className="mt-1 text-xs font-medium text-muted-foreground">{subValue}</div>}
                </div>
                <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${colorBase}-600 shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

const StatusBadge: React.FC<{ status: ClassStatus | string }> = ({ status }) => {
    const styles: Record<string, string> = {
        'Active': 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:bg-emerald-400 dark:border-emerald-800',
        'Pending Setup': 'bg-amber-500/10 text-amber-700 border-amber-200 dark:bg-amber-400 dark:border-amber-800',
        'Inactive': 'bg-red-500/10 text-red-700 border-red-200 dark:bg-red-400 dark:border-red-800',
        'Draft': 'bg-purple-500/10 text-purple-700 border-purple-200 dark:bg-purple-400 dark:border-purple-800',
        'Overloaded': 'bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-400 dark:border-blue-800',
    };
    const dotColors: Record<string, string> = {
        'Active': 'bg-emerald-500',
        'Pending Setup': 'bg-amber-500',
        'Inactive': 'bg-red-500',
        'Draft': 'bg-purple-500',
        'Overloaded': 'bg-blue-500',
    };
    let normalizedStatus = status;
    if (status === 'Pending') normalizedStatus = 'Pending Setup';
    if (status === 'Full') normalizedStatus = 'Active';

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${styles[normalizedStatus] || styles['Draft']}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColors[normalizedStatus] || 'bg-gray-400'} shadow-[0_0_6px_rgba(0,0,0,0.2)]`}></span>
            {normalizedStatus}
        </span>
    );
};

const ClassroomAIModal: React.FC<{ classes: ExtendedClass[]; onClose: () => void }> = ({ classes, onClose }) => {
    const [activeTab, setActiveTab] = useState<'distribution' | 'staffing' | 'insights'>('distribution');
    const [loading, setLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [teachers, setTeachers] = useState<UserProfile[]>([]);

    useEffect(() => {
        if (activeTab === 'staffing' && teachers.length === 0) {
             supabase.rpc('get_all_teachers_for_admin').then(({ data }) => {
                 if(data) setTeachers(data);
             });
        }
        setAiResponse(null);
    }, [activeTab, teachers.length]);

    const runAnalysis = async () => {
        if (!process.env.API_KEY) {
            alert("Security Protocol Violation: AI Intelligence Key is not provisioned.");
            return;
        }

        setLoading(true);
        setAiResponse(null);
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            let prompt = "";
            let dataContext = "";

            if (activeTab === 'distribution') {
                const classData = classes.map(c => ({ name: c.name, grade: c.grade_level, count: c.student_count, capacity: c.capacity || 30 }));
                dataContext = JSON.stringify(classData);
                prompt = `
                    Analyze the following class enrollment data: ${dataContext}.
                    Identify any classes that are overfilled (count > capacity) or significantly underfilled.
                    Suggest specific student moves to balance the distribution within the same grade levels.
                    Format the response as a list of actionable suggestions (e.g., "Move 3 students from Grade 10-A to 10-B").
                    Keep it concise and professional.
                `;
            } else if (activeTab === 'staffing') {
                const unassigned = classes.filter(c => !c.class_teacher_id).map(c => c.name);
                const teacherList = teachers.map(t => t.display_name).slice(0, 10);
                prompt = `
                    The following classes have no assigned teacher: ${unassigned.join(', ')}.
                    Here is a list of available faculty: ${teacherList.join(', ')}.
                    Suggest optimal assignments based on typical school structures.
                    Provide a rationale for each suggestion.
                `;
            } else {
                const totalStudents = classes.slice(0, 100).reduce((acc, c) => acc + (c.student_count || 0), 0);
                const totalCapacity = classes.slice(0, 100).reduce((acc, c) => acc + (c.capacity || 30), 0);
                prompt = `
                    School Data: Total Students: ${totalStudents}, Total Capacity: ${totalCapacity}, Class Count: ${classes.length}.
                    Analyze the capacity utilization. Are we approaching limits? 
                    Predict potential issues for the next academic year if enrollment grows by 10%.
                    Provide 3 strategic recommendations for space management.
                `;
            }

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: { parts: [{ text: prompt }] }
            });
            
            setAiResponse(response.text || "No response generated.");

        } catch (err: any) {
            const formatted = formatError(err);
            console.error("AI Analysis Failed:", formatted);
            setAiResponse("AI Analysis Interrupted: " + formatted);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-card w-full max-w-3xl rounded-3xl shadow-2xl border border-white/10 flex flex-col overflow-hidden max-h-[85vh] ring-1 ring-black/5" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 via-purple-500/5 to-transparent flex justify-between items-center backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 ring-4 ring-primary/5">
                            <SparklesIcon className="w-6 h-6 animate-pulse"/>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-foreground">Classroom Intelligence</h3>
                            <p className="text-xs text-muted-foreground font-medium">AI-Powered Optimization & Insights</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><XIcon className="w-5 h-5"/></button>
                </div>
                
                <div className="flex border-b border-border bg-muted/5">
                    {[
                        { id: 'distribution', label: 'Student Distribution', icon: <UsersIcon className="w-4 h-4"/> },
                        { id: 'staffing', label: 'Staffing Assistant', icon: <TeacherIcon className="w-4 h-4"/> },
                        { id: 'insights', label: 'Capacity Insights', icon: <ChartBarIcon className="w-4 h-4"/> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === tab.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-8 overflow-y-auto flex-grow bg-background">
                    {!aiResponse && !loading && (
                        <div className="text-center py-16 space-y-6">
                            <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-primary/20 animate-pulse">
                                <SparklesIcon className="w-12 h-12 text-primary/40"/>
                            </div>
                            <div className="max-w-md mx-auto">
                                <h4 className="text-lg font-bold text-foreground mb-2">Ready to Analyze</h4>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {activeTab === 'distribution' && "I will scan all class sizes and capacities to suggest optimal student distribution plans to balance workloads."}
                                    {activeTab === 'staffing' && "I will identify unassigned classes and suggest suitable teachers from your faculty list based on expertise."}
                                    {activeTab === 'insights' && "I will analyze current enrollment trends vs capacity to predict future space requirements."}
                                </p>
                            </div>
                            <button onClick={runAnalysis} className="px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto">
                                <SparklesIcon className="w-4 h-4" /> Run AI Analysis
                            </button>
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-24 space-y-6">
                            <Spinner size="lg" className="text-primary"/>
                            <p className="text-sm font-bold text-muted-foreground animate-pulse">Crunching school data...</p>
                        </div>
                    )}

                    {aiResponse && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
                             <div className="bg-card border border-border rounded-2xl p-8 shadow-sm relative overflow-hidden ring-1 ring-black/5">
                                 <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary to-purple-600"></div>
                                 <div className="flex items-center gap-3 mb-6">
                                     <div className="p-2 bg-primary/10 rounded-lg text-primary"><SparklesIcon className="w-5 h-5"/></div>
                                     <h4 className="font-bold text-lg">AI Recommendation</h4>
                                 </div>
                                 <div className="prose dark:prose-invert prose-sm max-w-none text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                     {aiResponse}
                                 </div>
                             </div>
                             
                             <div className="flex justify-end gap-3">
                                 <button onClick={() => setAiResponse(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-colors border border-transparent hover:border-border">Clear Result</button>
                                 <button onClick={runAnalysis} className="px-6 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors flex items-center gap-2">
                                     <ClockIcon className="w-4 h-4"/> Regenerate
                                 </button>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ClassesTab: React.FC<ClassesTabProps> = ({ branchId }) => {
    const [classes, setClasses] = useState<ExtendedClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState<ExtendedClass | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [schoolProfile, setSchoolProfile] = useState<SchoolAdminProfileData | null>(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [quickFilter, setQuickFilter] = useState<QuickFilterType>('All');
    const [sortConfig, setSortConfig] = useState<{ key: keyof ExtendedClass; direction: 'ascending' | 'descending' }>({ key: 'name', direction: 'ascending' });
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    const fetchClasses = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_all_classes_for_admin', { p_branch_id: branchId });
            if (error) throw error;
            const extended: ExtendedClass[] = (data || []).map((c: any) => ({
                ...c,
                teacher_name: c.teacher_name,
                student_count: c.student_count,
                capacity: c.capacity || 30
            }));
            setClasses(extended);
            
            const { data: schoolData } = await supabase.from('school_admin_profiles').select('*').limit(1).single();
            if(schoolData) setSchoolProfile(schoolData as SchoolAdminProfileData);

        } catch (error: any) {
            console.error("Classes fetch failed:", formatError(error));
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    const getStatus = (cls: ExtendedClass): string => {
        if ((cls.student_count || 0) > (cls.capacity || 30)) return 'Overloaded';
        if (!cls.class_teacher_id) return 'Pending Setup';
        if ((cls.student_count || 0) === 0) return 'Draft';
        return 'Active';
    };

    const filteredClasses = useMemo(() => {
        return classes.filter(cls => {
            const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) || (cls.teacher_name || '').toLowerCase().includes(searchTerm.toLowerCase());
            let matchesFilter = true;
            if (quickFilter === 'No Teacher') matchesFilter = !cls.class_teacher_id;
            if (quickFilter === 'No Students') matchesFilter = (cls.student_count || 0) === 0;
            if (quickFilter === 'Overloaded') matchesFilter = (cls.student_count || 0) > (cls.capacity || 30);
            if (quickFilter === 'Full') matchesFilter = (cls.student_count || 0) === (cls.capacity || 30);
            return matchesSearch && matchesFilter;
        }).sort((a, b) => {
            const aVal = (a[sortConfig.key] || '').toString();
            const bVal = (b[sortConfig.key] || '').toString();
            if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
    }, [classes, searchTerm, quickFilter, sortConfig]);

    const stats = useMemo(() => ({
        total: classes.length,
        sections: new Set(classes.map(c => c.name)).size, 
        students: classes.reduce((acc, c) => acc + (c.student_count || 0), 0),
        unassigned: classes.filter(c => !c.class_teacher_id).length,
    }), [classes]);

    const handleSort = (key: keyof ExtendedClass) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending'
        }));
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Classes & Grades</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Manage academic structure, sections, and teacher assignments.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsAIModalOpen(true)} className="px-5 py-3 bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300 font-bold rounded-xl border border-violet-200 dark:border-violet-800 transition-all flex items-center gap-2 shadow-sm hover:shadow-md">
                        <SparklesIcon className="w-4 h-4" /> AI Optimize
                    </button>
                    <button onClick={() => setIsBulkModalOpen(true)} className="px-5 py-3 bg-card hover:bg-muted text-foreground font-bold rounded-xl border border-border/60 transition-all flex items-center gap-2 shadow-sm">
                        <UploadIcon className="w-4 h-4" /> Bulk Mapping
                    </button>
                    <button onClick={() => setIsCreateModalOpen(true)} className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:scale-95">
                        <PlusIcon className="w-5 h-5" /> New Class
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Total Classes" value={stats.total} icon={<ClassIcon className="w-6 h-6"/>} color="bg-blue-500" trend="+2" />
                <KPICard title="Students Enrolled" value={stats.students} icon={<UsersIcon className="w-6 h-6"/>} color="bg-emerald-500" />
                <KPICard title="Unique Sections" value={stats.sections} icon={<GridIcon className="w-6 h-6"/>} color="bg-purple-500" />
                <KPICard title="Unassigned Units" value={stats.unassigned} icon={<AlertTriangleIcon className="w-6 h-6"/>} color="bg-amber-500" trend={stats.unassigned > 0 ? "Action Required" : "Stable"} />
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                <div className="p-4 border-b border-border bg-muted/5 flex flex-col lg:flex-row gap-4 justify-between items-center sticky top-0 z-20 backdrop-blur-md">
                    <div className="relative w-full lg:w-96 group">
                        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors"/>
                        <input type="text" placeholder="Search class or teacher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide w-full lg:w-auto p-1">
                        {(['All', 'No Teacher', 'No Students', 'Overloaded', 'Full'] as QuickFilterType[]).map(f => (
                            <button key={f} onClick={() => setQuickFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${quickFilter === f ? 'bg-primary/10 text-primary border-primary/20 shadow-sm' : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted/50 hover:text-foreground'}`}>
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-muted/30 border-b border-border text-xs font-black text-muted-foreground uppercase tracking-wider">
                            <tr>
                                <th className="p-5 font-bold cursor-pointer hover:text-foreground group pl-8" onClick={() => handleSort('name')}>
                                    Class Identity <SortIcon direction={sortConfig.key === 'name' ? sortConfig.direction : null} />
                                </th>
                                <th className="p-5">Grade</th>
                                <th className="p-5">Teacher Assignment</th>
                                <th className="p-5">Enrolment</th>
                                <th className="p-5">Status</th>
                                <th className="p-5 text-right pr-8">Manage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {loading ? (
                                <tr><td colSpan={6} className="p-20 text-center"><Spinner size="lg" className="text-primary"/></td></tr>
                            ) : filteredClasses.length === 0 ? (
                                <tr><td colSpan={6} className="p-20 text-center text-muted-foreground italic font-medium">No classes identified matching the current filter node.</td></tr>
                            ) : filteredClasses.map(cls => (
                                <tr key={cls.id} className="group hover:bg-muted/20 transition-all cursor-pointer" onClick={() => setSelectedClass(cls)}>
                                    <td className="p-5 pl-8">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-muted rounded-xl text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all border border-transparent group-hover:border-primary/20 shadow-inner">
                                                <ClassIcon className="w-5 h-5"/>
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{cls.name}</p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{cls.academic_year}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase border border-blue-100 dark:border-blue-800">Grade {cls.grade_level}</span>
                                    </td>
                                    <td className="p-5">
                                        {cls.teacher_name ? (
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">{cls.teacher_name.charAt(0)}</div>
                                                <span className="font-medium text-foreground/80">{cls.teacher_name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded border border-amber-200 dark:border-amber-800 animate-pulse">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="p-5">
                                        <div className="w-32">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-[10px] font-bold text-muted-foreground">{cls.student_count || 0} / {cls.capacity || 30}</span>
                                                <span className="text-[9px] font-black text-muted-foreground">{Math.round(((cls.student_count || 0) / (cls.capacity || 30)) * 100)}%</span>
                                            </div>
                                            <div className="h-1 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${(cls.student_count || 0) > (cls.capacity || 30) ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${Math.min(((cls.student_count || 0) / (cls.capacity || 30)) * 100, 100)}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <StatusBadge status={getStatus(cls)} />
                                    </td>
                                    <td className="p-5 text-right pr-8">
                                        <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><MoreHorizontalIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Fix: Pass branchId as string to components instead of number */}
            {isCreateModalOpen && <CreateClassWizard onClose={() => setIsCreateModalOpen(false)} onSuccess={fetchClasses} branchId={branchId || null} />}
            {selectedClass && <ClassWorkspace classData={selectedClass} onClose={() => setSelectedClass(null)} onUpdate={fetchClasses} schoolProfile={schoolProfile} />}
            {/* Fix: Pass branchId as string to components instead of number */}
            {isBulkModalOpen && <BulkClassOperationsModal onClose={() => setIsBulkModalOpen(false)} onSuccess={fetchClasses} branchId={branchId || null} academicYear="2025-2026" />}
            {isAIModalOpen && <ClassroomAIModal classes={classes} onClose={() => setIsAIModalOpen(false)} />}
        </div>
    );
};

export default ClassesTab;