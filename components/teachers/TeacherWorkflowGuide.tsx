
import React from 'react';
import { XIcon } from '../icons/XIcon';
import { UserPlusIcon } from '../icons/UserPlusIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { BriefcaseIcon } from '../icons/BriefcaseIcon';
import { BookIcon } from '../icons/BookIcon';
import { TimetableIcon } from '../icons/TimetableIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';

interface TeacherWorkflowGuideProps {
    onClose: () => void;
}

const steps = [
    {
        phase: "Onboarding Phase",
        color: "bg-blue-50 border-blue-200 text-blue-700",
        items: [
            { id: 1, title: 'Add Teacher', desc: 'Create basic profile with personal details.', icon: <UserPlusIcon className="w-5 h-5"/> },
            { id: 2, title: 'Account Setup', desc: 'System generates login credentials & portal access.', icon: <CheckCircleIcon className="w-5 h-5"/> },
            { id: 3, title: 'Verification', desc: 'Upload & verify qualification documents.', icon: <ShieldCheckIcon className="w-5 h-5"/> },
        ]
    },
    {
        phase: "Active Management",
        color: "bg-emerald-50 border-emerald-200 text-emerald-700",
        items: [
            { id: 4, title: 'Dept. Assignment', desc: 'Assign to department & set role (e.g. HOD).', icon: <BriefcaseIcon className="w-5 h-5"/> },
            { id: 5, title: 'Subject Mapping', desc: 'Map teaching subjects & grade levels.', icon: <BookIcon className="w-5 h-5"/> },
            { id: 6, title: 'Timetable Setup', desc: 'Generate weekly schedule & free periods.', icon: <TimetableIcon className="w-5 h-5"/> },
            { id: 7, title: 'Workload Monitor', desc: 'Track weekly hours to ensure fair distribution.', icon: <ChartBarIcon className="w-5 h-5"/> },
            { id: 8, title: 'Profile Mgmt', desc: 'Continuous updates to performance & bio.', icon: <EditIcon className="w-5 h-5"/> },
        ]
    },
    {
        phase: "Exit Phase",
        color: "bg-red-50 border-red-200 text-red-700",
        items: [
            { id: 9, title: 'Offboarding', desc: 'Resignation, asset handover & archival.', icon: <TrashIcon className="w-5 h-5"/> },
        ]
    }
];

const TeacherWorkflowGuide: React.FC<TeacherWorkflowGuideProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-card w-full max-w-4xl rounded-3xl shadow-2xl border border-border flex flex-col overflow-hidden max-h-[90vh] ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-8 border-b border-border bg-muted/30 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">Teacher Lifecycle Guide</h2>
                        <p className="text-muted-foreground mt-2">Standard Operating Procedure (SOP) for Faculty Management</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-8 bg-background custom-scrollbar">
                    <div className="space-y-8">
                        {steps.map((section, idx) => (
                            <div key={idx} className="relative">
                                <h3 className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider mb-4 ml-1">{section.phase}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {section.items.map((step) => (
                                        <div key={step.id} className={`p-4 rounded-xl border ${section.color} relative overflow-hidden group hover:shadow-md transition-shadow`}>
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="p-2 bg-white/60 dark:bg-black/20 rounded-lg shadow-sm">
                                                    {step.icon}
                                                </div>
                                                <span className="text-4xl font-black opacity-10 absolute right-2 top-0">{step.id}</span>
                                            </div>
                                            <h4 className="font-bold text-lg mb-1">{step.title}</h4>
                                            <p className="text-xs opacity-90 leading-relaxed font-medium">{step.desc}</p>
                                        </div>
                                    ))}
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className="absolute left-4 bottom-0 w-px h-8 bg-border/50 translate-y-full hidden md:block"></div>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-12 p-6 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-4">
                         <div className="p-2 bg-primary/20 text-primary rounded-lg">
                             <ShieldCheckIcon className="w-6 h-6"/>
                         </div>
                         <div>
                             <h4 className="font-bold text-foreground text-sm">System Compliance</h4>
                             <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                 Following this workflow ensures accurate payroll calculation, conflict-free timetables, and secure access control.
                                 Admins should regularly audit "Pending Verification" teachers to maintain directory hygiene.
                             </p>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherWorkflowGuide;
