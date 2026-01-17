
import React from 'react';
import { AdmissionApplication } from '../../types';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { GraduationCapIcon } from '../icons/GraduationCapIcon';
import { EditIcon } from '../icons/EditIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import PremiumAvatar from '../common/PremiumAvatar';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';

interface ChildProfileCardProps {
    child: AdmissionApplication;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onEdit: () => void;
    onManageDocuments: () => void;
    onNavigateDashboard: () => void;
    index?: number;
}

const ChildProfileCard: React.FC<ChildProfileCardProps> = ({ child, onEdit, onManageDocuments, onNavigateDashboard }) => {
    const getProgress = () => {
        const s = child.status;
        if (s === 'Enrolled') return 100;
        if (s === 'Approved') return 90;
        if (s === 'Verified') return 75;
        if (s === 'Pending Review') return 45;
        if (s === 'Registered') return 20;
        return 10;
    };

    const progress = getProgress();
    const isVerified = progress >= 90; // Includes Approved and Enrolled
    const isEnrolled = child.status === 'Enrolled';

    return (
        <div className="group relative bg-card border border-white/5 rounded-2xl shadow-xl transition-all duration-500 hover:border-primary/40 hover:-translate-y-1.5 flex flex-col h-full overflow-hidden ring-1 ring-black/50">
            {/* Soft Inner Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-tr ${isEnrolled ? 'from-emerald-500/[0.05] via-transparent' : 'from-primary/[0.01] via-transparent'} to-white/[0.01] pointer-events-none`}></div>

            <div className="p-6 md:p-8 flex-grow space-y-8 relative z-10">
                <div className="flex items-center gap-5">
                    <div className="relative shrink-0">
                        <div className={`absolute -inset-1 rounded-full blur-md opacity-20 transition-all duration-700 group-hover:opacity-40 ${isVerified ? 'bg-emerald-500' : 'bg-primary'}`}></div>
                        <PremiumAvatar 
                            src={child.profile_photo_url} 
                            name={child.applicant_name} 
                            size="sm" 
                            className="shadow-2xl border border-white/10 w-16 h-16 relative z-10"
                        />
                    </div>
                    <div className="flex-grow min-w-0">
                         <div className="flex items-center gap-2 mb-1.5">
                             <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Node Protocol</span>
                             <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg border uppercase tracking-widest ${isEnrolled ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-primary/40 bg-primary/5 border-primary/10'}`}>
                                 {child.student_id_number || child.application_number || 'ACTIVE'}
                             </span>
                         </div>
                        <h3 className="text-xl font-bold text-white tracking-tight leading-tight truncate">
                            {child.applicant_name}
                        </h3>
                        <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.15em] mt-2">
                             {child.class_name ? child.class_name : `Grade ${child.grade} Block`}
                        </p>
                    </div>
                </div>

                <div className="bg-black/40 p-5 rounded-2xl border border-white/5 shadow-inner">
                    <div className="flex justify-between items-end mb-4">
                        <div className="space-y-1.5">
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] leading-none">Integrity Index</p>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black tracking-widest uppercase ${isVerified ? 'text-emerald-500' : 'text-primary'}`}>
                                    {child.status.replace(/_/g, ' ')}
                                </span>
                                {isVerified && <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]" />}
                                {isEnrolled && <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`text-2xl font-serif font-black tracking-tighter leading-none ${isVerified ? 'text-emerald-500' : 'text-white/90'}`}>
                                {progress}<span className="text-[10px] opacity-20 ml-0.5">%</span>
                            </p>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden p-[1px] border border-white/5">
                        <div 
                            className={`h-full rounded-full transition-all duration-[2000ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${isVerified ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]'}`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="px-6 md:px-8 pb-6 md:pb-8 flex items-center justify-between gap-3 relative z-10">
                <button 
                    onClick={onManageDocuments}
                    className="flex-1 h-11 flex items-center justify-center gap-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-all group/btn active:scale-[0.98] shadow-sm"
                >
                    <DocumentTextIcon className="w-4 h-4 text-white/30 group-hover/btn:text-primary transition-colors" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover/btn:text-white/80">Vault</span>
                </button>

                <button 
                    onClick={onNavigateDashboard}
                    disabled={!isEnrolled}
                    className={`flex-1 h-11 flex items-center justify-center gap-2.5 rounded-xl border transition-all group/btn active:scale-[0.98] shadow-sm ${isEnrolled ? 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5 cursor-pointer' : 'bg-white/[0.01] border-transparent cursor-not-allowed opacity-40'}`}
                >
                    <GraduationCapIcon className={`w-4 h-4 transition-colors ${isEnrolled ? 'text-white/30 group-hover/btn:text-primary' : 'text-white/20'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover/btn:text-white/80">Portal</span>
                </button>

                <button 
                    onClick={onEdit}
                    className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-all group/btn active:scale-[0.98] shadow-sm"
                    title="Edit Node"
                >
                    <EditIcon className="w-4 h-4 text-white/30 group-hover/btn:text-white/80 transition-colors" />
                </button>
            </div>
        </div>
    );
};

export default ChildProfileCard;
