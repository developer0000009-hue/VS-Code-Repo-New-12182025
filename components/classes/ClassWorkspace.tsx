
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { SchoolClass, StudentForAdmin, Course, SchoolAdminProfileData } from '../../types';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { TeacherIcon } from '../icons/TeacherIcon';
import { BookIcon } from '../icons/BookIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { FileTextIcon } from '../icons/FileTextIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { ActivityIcon } from '../icons/ActivityIcon';

interface ClassWorkspaceProps {
    classData: SchoolClass & { 
        student_count?: number; 
        teacher_name?: string; 
        grade_level?: string; 
        section?: string;
        academic_year?: string;
        capacity?: number;
    };
    onClose: () => void;
    onUpdate: () => void;
    schoolProfile: SchoolAdminProfileData | null;
}

type TabType = 'overview' | 'students' | 'teachers' | 'subjects' | 'timetable' | 'analytics' | 'docs' | 'activity';

const TabButton: React.FC<{ id: TabType, label: string, icon: React.ReactNode, active: boolean, onClick: (id: TabType) => void }> = ({ id, label, icon, active, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            active
            ? 'border-primary text-primary bg-primary/5' 
            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}
    >
        {icon}
        {label}
    </button>
);

const StatWidget: React.FC<{ title: string, value: string | number, icon: React.ReactNode, color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
        <div className={`p-3 rounded-xl ${color} text-white shadow-sm`}>
            {icon}
        </div>
        <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-black text-foreground">{value}</p>
        </div>
    </div>
);

const formatError = (err: any): string => {
    if (!err) return "An unknown error occurred.";
    if (typeof err === 'string') {
         if (err.includes("[object Object]")) return "An unexpected error occurred.";
         return err;
    }
    const message = err.message || err.error_description || err.details || err.hint;
    if (message && typeof message === 'string') return message;
    try {
        return JSON.stringify(err);
    } catch {
        return "An error occurred.";
    }
};

const ClassWorkspace: React.FC<ClassWorkspaceProps> = ({ classData, onClose, onUpdate, schoolProfile }) => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState<StudentForAdmin[]>([]);
    const [subjects, setSubjects] = useState<Course[]>([]);
    
    // Stats
    const [stats, setStats] = useState({
        attendanceRate: 94, // Mock
        avgPerformance: 82, // Mock
        pendingFees: 2
    });

    const fetchDetails = useCallback(async () => {
        setLoading(true);
        // 1. Fetch Students
        const { data: rosterData } = await supabase.rpc('get_class_roster_for_admin', { p_class_id: classData.id });
        if (rosterData) setStudents(rosterData);

        // 2. Fetch Subjects
        const { data: subjectData } = await supabase.from('class_subjects')
            .select('subject_id, courses(*)')
            .eq('class_id', classData.id);
        
        if (subjectData) {
            const mappedSubjects = subjectData.map((item: any) => item.courses);
            // Filter out nulls if course was deleted
            setSubjects(mappedSubjects.filter(Boolean));
        }

        setLoading(false);
    }, [classData.id]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const handleRemoveStudent = async (studentId: string) => {
        if(!confirm('Remove student from this class?')) return;
        const { error } = await supabase.from('student_profiles').update({ assigned_class_id: null }).eq('user_id', studentId);
        if(error) alert(formatError(error));
        else fetchDetails();
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* KPI Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatWidget title="Total Students" value={students.length} icon={<UsersIcon className="w-6 h-6"/>} color="bg-blue-500"/>
                            <StatWidget title="Subjects" value={subjects.length} icon={<BookIcon className="w-6 h-6"/>} color="bg-purple-500"/>
                            <StatWidget title="Avg Attendance" value={`${stats.attendanceRate}%`} icon={<CheckCircleIcon className="w-6 h-6"/>} color="bg-emerald-500"/>
                            <StatWidget title="Pending Fees" value={stats.pendingFees} icon={<AlertTriangleIcon className="w-6 h-6"/>} color="bg-amber-500"/>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Class Info Card */}
                            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-8 shadow-sm">
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="text-lg font-bold text-foreground">Class Information</h3>
                                    <button className="text-xs font-bold bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-lg transition-colors border border-border">Edit Details</button>
                                </div>
                                <div className="grid grid-cols-2 gap-8 text-sm">
                                    <div><p className="text-xs font-bold text-muted-foreground uppercase mb-1">Grade Level</p><p className="font-medium">{classData.grade_level}</p></div>
                                    <div><p className="text-xs font-bold text-muted-foreground uppercase mb-1">Section</p><p className="font-medium">{classData.section || 'A'}</p></div>
                                    <div><p className="text-xs font-bold text-muted-foreground uppercase mb-1">Academic Year</p><p className="font-medium">{classData.academic_year || '2024-2025'}</p></div>
                                    <div><p className="text-xs font-bold text-muted-foreground uppercase mb-1">Capacity</p><p className="font-medium">{students.length} / {classData.capacity || 30}</p></div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-border">
                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-3">Class Teacher</p>
                                    {classData.teacher_name ? (
                                        <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                                {classData.teacher_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">{classData.teacher_name}</p>
                                                <p className="text-xs text-muted-foreground">Primary Instructor</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-sm flex items-center gap-2">
                                            <AlertTriangleIcon className="w-4 h-4"/> No Class Teacher Assigned
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Quick Actions</h3>
                                <div className="space-y-3">
                                    <button className="w-full py-3 px-4 rounded-xl bg-background border border-border hover:bg-muted font-bold text-sm text-left flex items-center gap-3 transition-colors">
                                        <UsersIcon className="w-4 h-4 text-primary"/> Add Students
                                    </button>
                                    <button className="w-full py-3 px-4 rounded-xl bg-background border border-border hover:bg-muted font-bold text-sm text-left flex items-center gap-3 transition-colors">
                                        <ClockIcon className="w-4 h-4 text-primary"/> Edit Timetable
                                    </button>
                                    <button className="w-full py-3 px-4 rounded-xl bg-background border border-border hover:bg-muted font-bold text-sm text-left flex items-center gap-3 transition-colors">
                                        <FileTextIcon className="w-4 h-4 text-primary"/> Download Report
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'students':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">Enrolled Students ({students.length})</h3>
                            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-primary/90">
                                <PlusIcon className="w-4 h-4"/> Enroll Student
                            </button>
                        </div>
                        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/30 border-b border-border text-xs font-bold uppercase text-muted-foreground">
                                    <tr>
                                        <th className="p-4 pl-6">Name</th>
                                        <th className="p-4">ID</th>
                                        <th className="p-4">Gender</th>
                                        <th className="p-4 text-right pr-6">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {students.map(student => (
                                        <tr key={student.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="p-4 pl-6 font-medium text-foreground">{student.display_name}</td>
                                            <td className="p-4 font-mono text-xs text-muted-foreground">{student.student_id_number || '—'}</td>
                                            <td className="p-4 text-muted-foreground">{student.gender || '—'}</td>
                                            <td className="p-4 text-right pr-6">
                                                <button onClick={() => handleRemoveStudent(student.id)} className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded transition-colors border border-transparent hover:border-red-100">Remove</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {students.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No students enrolled.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'subjects':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-center">
                             <h3 className="text-lg font-bold">Mapped Curriculum ({subjects.length})</h3>
                             <button className="bg-muted hover:bg-muted/80 border border-border px-4 py-2 rounded-lg text-xs font-bold transition-colors">Manage Mapping</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {subjects.map(sub => (
                                <div key={sub.id} className="bg-card p-5 rounded-xl border border-border hover:border-primary/50 transition-colors shadow-sm group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">{sub.code}</span>
                                        <div className="p-1.5 rounded-full bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors"><BookIcon className="w-4 h-4"/></div>
                                    </div>
                                    <h4 className="font-bold text-foreground mb-1">{sub.title}</h4>
                                    <p className="text-xs text-muted-foreground">{sub.category}</p>
                                </div>
                            ))}
                             {subjects.length === 0 && <p className="col-span-full text-center text-muted-foreground py-10 bg-muted/10 rounded-xl border-2 border-dashed border-border">No subjects mapped to this class.</p>}
                        </div>
                    </div>
                );
            case 'timetable':
                return (
                     <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-border">
                            <ClockIcon className="w-10 h-10 text-muted-foreground/40" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">Timetable View</h3>
                        <p className="text-muted-foreground text-sm mt-1 mb-6">Manage the weekly schedule for this class in the Timetable Module.</p>
                        <button className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all text-sm">Go to Timetable</button>
                    </div>
                );
            default:
                return <div className="p-10 text-center text-muted-foreground">Module under development.</div>;
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-background w-full max-w-6xl h-[92vh] rounded-[2rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden ring-1 ring-black/5" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-border bg-card/80 backdrop-blur-xl flex justify-between items-center flex-shrink-0 z-20">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            {classData.grade_level}
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">{classData.name}</h2>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground font-medium">
                                <span>{classData.academic_year}</span>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/40"></span>
                                <span>{schoolProfile?.school_name}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><XIcon className="w-6 h-6"/></button>
                </div>

                {/* Layout */}
                <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
                    {/* Sidebar Nav */}
                    <div className="w-full md:w-64 bg-muted/10 border-r border-border flex-shrink-0 overflow-y-auto">
                        <nav className="p-4 space-y-1.5">
                            <TabButton id="overview" label="Overview" icon={<ActivityIcon className="w-4 h-4"/>} active={activeTab === 'overview'} onClick={setActiveTab} />
                            <TabButton id="students" label="Students" icon={<UsersIcon className="w-4 h-4"/>} active={activeTab === 'students'} onClick={setActiveTab} />
                            <TabButton id="teachers" label="Faculty" icon={<TeacherIcon className="w-4 h-4"/>} active={activeTab === 'teachers'} onClick={setActiveTab} />
                            <TabButton id="subjects" label="Curriculum" icon={<BookIcon className="w-4 h-4"/>} active={activeTab === 'subjects'} onClick={setActiveTab} />
                            <TabButton id="timetable" label="Timetable" icon={<ClockIcon className="w-4 h-4"/>} active={activeTab === 'timetable'} onClick={setActiveTab} />
                            <TabButton id="analytics" label="Analytics" icon={<ChartBarIcon className="w-4 h-4"/>} active={activeTab === 'analytics'} onClick={setActiveTab} />
                            <TabButton id="docs" label="Documents" icon={<FileTextIcon className="w-4 h-4"/>} active={activeTab === 'docs'} onClick={setActiveTab} />
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="flex-grow overflow-y-auto p-8 bg-background custom-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center h-full"><Spinner size="lg"/></div>
                        ) : (
                            renderTabContent()
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClassWorkspace;
