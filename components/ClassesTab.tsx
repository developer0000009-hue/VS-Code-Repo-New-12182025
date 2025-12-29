
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { SchoolClass, Course, UserProfile, SchoolAdminProfileData } from '../types';
import Spinner from './common/Spinner';
import { ClassIcon } from './icons/ClassIcon';
import { PlusIcon } from './icons/PlusIcon';
import { SearchIcon } from './icons/SearchIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UsersIcon } from './icons/UsersIcon';
import { TeacherIcon } from './icons/TeacherIcon';
import { XIcon } from './icons/XIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { BookIcon } from './icons/BookIcon';
import { FilterIcon } from './icons/FilterIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { ClockIcon } from './icons/ClockIcon';
import { MoreHorizontalIcon } from './icons/MoreHorizontalIcon';
import { UploadIcon } from './icons/UploadIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import BulkClassOperationsModal from './classes/BulkClassOperationsModal';
import { SparklesIcon } from './icons/SparklesIcon';
import { GoogleGenAI } from '@google/genai';
import CreateClassWizard from './classes/CreateClassWizard';
import ClassWorkspace from './classes/ClassWorkspace';

// --- Types ---

// Fix: Redefined ExtendedClass to clearly include all properties needed for table display and sorting.
interface ExtendedClass extends SchoolClass {
    id: number;
    name: string;
    grade_level: string;
    capacity: number;
    class_teacher_id?: string | null; // Fix: Explicitly included for 'No Teacher' filtering
    teacher_name?: string;
    student_count?: number;
    created_at?: string;
}

type QuickFilterType = 'All' | 'No Teacher' | 'No Students' | 'Overloaded' | 'New' | 'Full';
type ClassStatus = 'Active' | 'Pending Setup' | 'Inactive' | 'Draft' | 'Overloaded';

interface ClassesTabProps {
    branchId?: number | null;
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
                <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${colorBase}-600 shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

const StatusBadge: React.FC<{ status: ClassStatus | string }> = ({ status }) => {
    const styles: Record<string, string> = {
        'Active': 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800',
        'Pending Setup': 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800',
        'Inactive': 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-400 dark:border-red-800',
        'Draft': 'bg-purple-500/10 text-purple-700 border-purple-200 dark:text-purple-400 dark:border-purple-800',
        'Overloaded': 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800',
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
    }, [activeTab]);

    const runAnalysis = async () => {
        setLoading(true);
        setAiResponse(null);
        
        try {
            if (!process.env.API_KEY) throw new Error("AI Key Missing");
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
                const totalStudents = classes.reduce((acc, c) => acc + (c.student_count || 0), 0);
                const totalCapacity = classes.reduce((acc, c) => acc + (c.capacity || 30), 0);
                prompt = `
                    School Data: Total Students: ${totalStudents}, Total Capacity: ${totalCapacity}, Class Count: ${classes.length}.
                    Analyze the capacity utilization. Are we approaching limits? 
                    Predict potential issues for the next academic year if enrollment grows by 10%.
                    Provide 3 strategic recommendations for space management.
                `;
            }

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt
            });
            
            setAiResponse(response.text || "No response generated.");

        } catch (err: any) {
            setAiResponse("AI Analysis Unavailable: " + (err.message || String(err)));
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

        } catch (error) {
            console.error(error);
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
                     <button 
                        onClick={() => setIsAIModalOpen(true)}
                        className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:scale-95"
                    >
                        <SparklesIcon className="w-5 h-5 text-white animate-pulse"/> AI Assistant
                    </button>
                     <button 
                        onClick={() => setIsBulkModalOpen(true)}
                        className="px-5 py-3 bg-card hover:bg-muted text-foreground font-bold rounded-xl border border-border/60 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                    >
                        <UploadIcon className="w-5 h-5 text-muted-foreground"/> Bulk Operations
                    </button>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:scale-95"
                    >
                        <PlusIcon className="w-5 h-5"/> Create New Class
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Total Grades" value={12} icon={<ClassIcon className="w-6 h-6"/>} color="bg-blue-500" active={false}/>
                <KPICard title="Total Classes" value={stats.total} icon={<UsersIcon className="w-6 h-6"/>} color="bg-emerald-500" />
                <KPICard title="Students Assigned" value={stats.students} icon={<CheckCircleIcon className="w-6 h-6"/>} color="bg-indigo-500" />
                <KPICard title="Unassigned Classes" value={stats.unassigned} icon={<AlertTriangleIcon className="w-6 h-6"/>} color="bg-amber-500" trend={stats.unassigned > 0 ? 'Action Needed' : undefined} onClick={() => setQuickFilter('No Teacher')} active={quickFilter === 'No Teacher'} />
            </div>
            
            {filteredClasses.some(c => (c.student_count || 0) > (c.capacity || 30)) && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top-2 shadow-sm">
                    <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
                        <div className="p-2 bg-red-500/10 rounded-lg"><AlertTriangleIcon className="w-5 h-5"/></div>
                        <span className="font-bold text-sm">Capacity Alert: Some classes are overfilled. Use AI Assistant to rebalance distribution.</span>
                    </div>
                    <button onClick={() => setIsAIModalOpen(true)} className="text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 px-4 py-2 rounded-xl transition-colors">Optimize Now</button>
                </div>
            )}

            <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[600px] ring-1 ring-black/5">
                <div className="p-5 border-b border-border bg-muted/5 backdrop-blur-md flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-20">
                    <div className="relative w-full md:max-w-md group">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search class, teacher..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-input/50 bg-background/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide w-full md:w-auto p-1">
                         {(['All', 'No Teacher', 'No Students', 'Overloaded', 'New'] as QuickFilterType[]).map(f => (
                             <button 
                                key={f}
                                onClick={() => setQuickFilter(f)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${quickFilter === f ? 'bg-primary/10 text-primary border-primary/20 shadow-sm' : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted/50 hover:text-foreground'}`}
                             >
                                 {f}
                             </button>
                         ))}
                         <button className="p-2.5 bg-muted/30 border border-border/50 rounded-xl text-muted-foreground hover:text-foreground transition-colors hover:bg-muted"><FilterIcon className="w-4 h-4"/></button>
                    </div>
                </div>

                <div className="flex-grow overflow-x-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center h-64 space-y-4">
                            <Spinner size="lg"/>
                            <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading academic structure...</p>
                        </div>
                    ) : filteredClasses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                            <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-border">
                                <ClassIcon className="w-10 h-10 text-muted-foreground/40"/>
                            </div>
                            <h3 className="text-lg font-bold text-foreground">No Classes Found</h3>
                            <p className="text-muted-foreground text-sm mt-1 mb-6 max-w-xs mx-auto">We couldn't find any classes matching your current filters.</p>
                            <button onClick={() => {setSearchTerm(''); setQuickFilter('All')}} className="text-primary text-xs font-bold bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors">Clear Filters</button>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-muted/30 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider sticky top-0 z-10 backdrop-blur-xl shadow-sm">
                                <tr>
                                    <th className="p-6 pl-8 cursor-pointer hover:text-foreground group transition-colors" onClick={() => handleSort('grade_level')}>
                                        <div className="flex items-center gap-1">Grade <SortIcon direction={sortConfig.key === 'grade_level' ? sortConfig.direction : null} /></div>
                                    </th>
                                    <th className="p-6 cursor-pointer hover:text-foreground group transition-colors" onClick={() => handleSort('name')}>
                                        <div className="flex items-center gap-1">Section / Name <SortIcon direction={sortConfig.key === 'name' ? sortConfig.direction : null} /></div>
                                    </th>
                                    <th className="p-6 cursor-pointer hover:text-foreground group transition-colors" onClick={() => handleSort('teacher_name')}>
                                        <div className="flex items-center gap-1">Class Teacher <SortIcon direction={sortConfig.key === 'teacher_name' ? sortConfig.direction : null} /></div>
                                    </th>
                                    <th className="p-6">Capacity</th>
                                    <th className="p-6 text-center">Status</th>
                                    <th className="p-6 text-right pr-8">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40 bg-card/50">
                                {filteredClasses.map(cls => (
                                    <tr 
                                        key={cls.id} 
                                        onClick={() => setSelectedClass(cls)}
                                        className="hover:bg-muted/40 transition-colors cursor-pointer group"
                                    >
                                        <td className="p-6 pl-8">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-black text-sm border border-blue-500/20 shadow-sm">
                                                {cls.grade_level}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <p className="font-bold text-foreground text-base group-hover:text-primary transition-colors">{cls.name}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 font-medium">{cls.academic_year}</p>
                                        </td>
                                        <td className="p-6">
                                            {cls.teacher_name ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm border border-white/20">
                                                        {(cls.teacher_name || '?').charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-semibold text-foreground">{cls.teacher_name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-amber-600 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 inline-flex items-center gap-1">
                                                    <AlertTriangleIcon className="w-3 h-3"/> Assign Teacher
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-6">
                                            <div className="w-36">
                                                <div className="flex justify-between text-[10px] mb-1.5 font-bold uppercase text-muted-foreground tracking-wide">
                                                    <span>{cls.student_count || 0} Enrolled</span>
                                                    <span>{cls.capacity || 30} Max</span>
                                                </div>
                                                <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden ring-1 ring-black/5">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${((cls.student_count || 0) > (cls.capacity || 30)) ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                                        style={{ width: `${Math.min(((cls.student_count || 0)/(cls.capacity || 30))*100, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <StatusBadge status={getStatus(cls)} />
                                        </td>
                                        <td className="p-6 text-right pr-8">
                                            <button className="p-2 hover:bg-background rounded-xl text-muted-foreground hover:text-foreground transition-all opacity-0 group-hover:opacity-100 hover:shadow-sm border border-transparent hover:border-border">
                                                <MoreHorizontalIcon className="w-5 h-5"/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {selectedClass && (
                <ClassWorkspace 
                    classData={selectedClass} 
                    onClose={() => setSelectedClass(null)} 
                    onUpdate={fetchClasses}
                    schoolProfile={schoolProfile}
                />
            )}

            {isCreateModalOpen && (
                <CreateClassWizard 
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={fetchClasses}
                    branchId={branchId}
                />
            )}
            
            {isBulkModalOpen && (
                <BulkClassOperationsModal 
                    onClose={() => setIsBulkModalOpen(false)}
                    onSuccess={() => {
                        setIsBulkModalOpen(false);
                        fetchClasses();
                    }}
                    academicYear={`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`} 
                    branchId={branchId} 
                />
            )}
            
            {isAIModalOpen && (
                <ClassroomAIModal 
                    classes={classes} 
                    onClose={() => setIsAIModalOpen(false)}
                />
            )}
        </div>
    );
};

export default ClassesTab;
