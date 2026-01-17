
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        color: "bg-blue-500/10 border-blue-500/20 text-blue-400",
        items: [
            { id: 1, title: 'Add Teacher', desc: 'Create basic profile with personal details.', icon: <UserPlusIcon className="w-5 h-5"/> },
            { id: 2, title: 'Account Setup', desc: 'System generates login credentials & portal access.', icon: <CheckCircleIcon className="w-5 h-5"/> },
            { id: 3, title: 'Verification', desc: 'Upload & verify qualification documents.', icon: <ShieldCheckIcon className="w-5 h-5"/> },
        ]
    },
    {
        phase: "Active Management",
        color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
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
        color: "bg-red-500/10 border-red-500/20 text-red-400",
        items: [
            { id: 9, title: 'Offboarding', desc: 'Resignation, asset handover & archival.', icon: <TrashIcon className="w-5 h-5"/> },
        ]
    }
];

const TeacherWorkflowGuide: React.FC<TeacherWorkflowGuideProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0c0d12] w-full max-w-4xl rounded-[3rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden max-h-[90vh] ring-1 ring-white/10" 
                onClick={e => e.stopPropagation()}
            >
                <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-serif font-black text-white tracking-tighter uppercase leading-none">Lifecycle <span className="text-white/20 italic">SOP.</span></h2>
                        <p className="text-white/40 mt-2 font-medium">Institutional Standard Operating Procedure for Faculty Orchestration.</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all"><XIcon className="w-6 h-6"/></button>
                </div>

                <div className="flex-grow overflow-y-auto p-10 bg-transparent custom-scrollbar space-y-12">
                    {steps.map((section, idx) => (
                        <div key={idx} className="relative">
                            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-6 ml-1">{section.phase}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {section.items.map((step) => (
                                    <div key={step.id} className={`p-6 rounded-[2rem] border transition-all duration-500 group relative overflow-hidden bg-white/[0.01] ${section.color} hover:bg-white/[0.03]`}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-3 bg-black/40 rounded-2xl shadow-inner border border-white/5">
                                                {step.icon}
                                            </div>
                                            <span className="text-5xl font-black opacity-5 absolute right-4 top-2 select-none">{step.id}</span>
                                        </div>
                                        <h4 className="font-bold text-lg text-white mb-2">{step.title}</h4>
                                        <p className="text-xs opacity-60 leading-relaxed font-medium">{step.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    
                    <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/20 flex items-start gap-6 relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-10 opacity-[0.03]"><ShieldCheckIcon className="w-32 h-32 text-primary" /></div>
                         <div className="p-3.5 bg-primary/10 rounded-2xl text-primary border border-primary/20"><ShieldCheckIcon className="w-6 h-6"/></div>
                         <div className="relative z-10">
                             <h4 className="font-bold text-white text-lg tracking-tight">System Compliance Policy</h4>
                             <p className="text-sm text-white/40 mt-2 leading-loose max-w-2xl font-serif italic">
                                 Adhering to the verified institutional lifecycle ensures synchronized payroll processing, conflict-free timetable generation, and high-fidelity audit trails for regulatory compliance.
                             </p>
                         </div>
                    </div>
                </div>
                
                <div className="p-8 border-t border-white/5 bg-white/[0.01] text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.6em] text-white/5">Institutional Framework v9.5.1 Governance Component</p>
                </div>
            </motion.div>
        </div>
    );
};

export default TeacherWorkflowGuide;
