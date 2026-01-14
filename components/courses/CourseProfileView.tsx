import React, { useState, useEffect, useCallback } from 'react';
import { Course, UserProfile, BuiltInRoles } from '../../types';
import { supabase } from '../../services/supabase';
import { GoogleGenAI } from '@google/genai';
import { BookIcon } from '../icons/BookIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { FileTextIcon } from '../icons/FileTextIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { XIcon } from '../icons/XIcon';
import { EditIcon } from '../icons/EditIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { TeacherIcon } from '../icons/TeacherIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { BellIcon } from '../icons/BellIcon';
import { ArchiveIcon } from '../icons/ArchiveIcon';
import { LayersIcon } from '../icons/LayersIcon';
import { ActivityIcon } from '../icons/ActivityIcon';
import Spinner from '../common/Spinner';

interface CourseProfileViewProps {
    course: Course;
    onClose: () => void;
    profile?: UserProfile;
}

type Tab = 'overview' | 'curriculum' | 'teachers' | 'students' | 'analytics';

const SectionHeader: React.FC<{ title: string; action?: React.ReactNode }> = ({ title, action }) => (
    <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-foreground tracking-tight">{title}</h3>{action}</div>
);

const CurriculumTab: React.FC<{ course: Course; canEdit: boolean }> = ({ course, canEdit }) => {
    const [units, setUnits] = useState([ { id: 1, title: 'Unit 1: Foundations', duration: '2 Weeks' } ]);
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <SectionHeader title="Curriculum Structure" action={ canEdit && (<button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl"><PlusIcon className="w-3.5 h-3.5"/> Add Unit</button>) } />
             <div className="relative border-l-2 border-border/50 ml-4 space-y-8 py-2">
                {units.map((unit, idx) => ( <div key={unit.id} className="relative pl-8 group"><div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-card border-2 border-primary z-10"></div><div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all"><h4 className="font-bold text-foreground text-sm">{unit.title}</h4><div className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-muted text-muted-foreground border-border mt-1.5 w-fit">{unit.duration}</div></div></div> ))}
            </div>
        </div>
    );
};

export const CourseProfileView: React.FC<CourseProfileViewProps> = ({ course, onClose, profile }) => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const role = profile?.role;
    const isFullAdmin = role === BuiltInRoles.SCHOOL_ADMINISTRATION || role === BuiltInRoles.BRANCH_ADMIN;
    
    const tabs = [
        { id: 'overview', label: 'Overview', icon: <ChartBarIcon className="w-4 h-4"/> },
        { id: 'curriculum', label: 'Curriculum', icon: <LayersIcon className="w-4 h-4"/> },
        { id: 'analytics', label: 'Analytics', icon: <ChartBarIcon className="w-4 h-4"/> },
        { id: 'teachers', label: 'Faculty', icon: <TeacherIcon className="w-4 h-4"/> },
        { id: 'students', label: 'Students', icon: <UsersIcon className="w-4 h-4"/> },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return <div className="text-muted-foreground">Overview content here.</div>
            case 'curriculum':
                return <CurriculumTab course={course} canEdit={isFullAdmin} />;
            default:
                return <div className="text-muted-foreground italic text-center p-8 bg-muted/20 rounded-xl">This section is under development.</div>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex justify-center items-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="w-full max-w-6xl h-[90vh] bg-background rounded-[2rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 bg-card/80 backdrop-blur-xl border-b border-border p-8 flex justify-between items-start z-20">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg border border-white/10 shrink-0 text-3xl font-bold">{course.title.charAt(0)}</div>
                        <div>
                            <h2 className="text-3xl font-extrabold text-foreground tracking-tight">{course.title}</h2>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground font-medium"><span className="bg-muted/50 px-2 py-0.5 rounded border border-border font-mono text-xs">{course.code}</span><span className="w-1 h-1 rounded-full bg-muted-foreground/40"></span><span>Grade {course.grade_level}</span></div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                         {isFullAdmin && <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl"><EditIcon className="w-3.5 h-3.5"/> Edit Course</button>}
                         <button onClick={onClose} className="p-2.5 hover:bg-muted rounded-full text-muted-foreground"><XIcon className="w-6 h-6"/></button>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
                    <div className="w-full md:w-64 bg-muted/10 border-r border-border flex-shrink-0 overflow-y-auto"><nav className="p-4 space-y-1.5">{tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 group ${activeTab === tab.id ? 'bg-card text-primary shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}><span className={`${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>{tab.icon}</span>{tab.label}</button>))}</nav></div>
                    <div className="flex-grow overflow-y-auto p-8 md:p-10 bg-background custom-scrollbar">{renderTabContent()}</div>
                </div>
            </div>
        </div>
    );
};
