
import React from 'react';
import { AdmissionApplication } from '../../types';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { GraduationCapIcon } from '../icons/GraduationCapIcon';
import { EditIcon } from '../icons/EditIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import PremiumAvatar from '../common/PremiumAvatar';

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
        // Fix: Use correct Title Case string literals ('Approved', 'Verified') to match AdmissionStatus type definition.
        if (child.status === 'Approved' || child.status === 'Verified') return 100;
        // Fix: Use correct Title Case string literal ('Pending Review') to match AdmissionStatus type definition.
        if (child.status === 'Pending Review') return 45;
        // Fix: Use correct Title Case string literal ('Registered') to match AdmissionStatus type definition.
        if (child.status === 'Registered') return 20;
        return 10;
    };

    const progress = getProgress();
    const isVerified = progress === 100;

    return (
        <div className="group relative bg-[#0d0f14] border border-white/5 rounded-[2.5rem] shadow-[0_48px_128px_-24px_rgba(0,0,0,1)] transition-all duration-300 hover:border-primary/40 hover:-translate-y-1.5 flex flex-col h-full overflow-hidden ring-1 ring-black/50">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/[0.02] to-transparent pointer-events-none"></div>

            <div className="p-8 flex-grow space-y-10 relative z-10">
                <div className="flex items-center gap-6">
                    <div className="relative shrink-0 group/avatar">
                        <div className={`absolute -inset-1 rounded-full blur-md opacity-20 group-hover/avatar:opacity-40 transition-opacity ${isVerified ? 'bg-emerald-500' : 'bg-primary'}`}></div>
                        <PremiumAvatar 
                            src={child.profile_photo_url} 
                            name={child.applicant_name} 
                            size="sm" 
                            className="shadow-2xl border border-white/10 w-[64px] h-[64px] relative z-10"
                        />
                    </div>
                    <div className="flex-grow min-w-0">
                         <div className="flex items-center gap-3 mb-1.5">
                             <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Node Protocol</span>
                             <span className="text-[9px] font-mono font-bold text-indigo-400/60 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10 uppercase tracking-widest">{child.application_number || 'ACTIVE'}</span>
                         </div>
                        <h3 className="text-xl md:text-2xl font-serif font-black text-white tracking-tight leading-tight truncate">
                            {child.applicant_name}
                        </h3>
                        <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mt-2">Grade {child.grade} Block</p>
                    </div>
                </div>

                <div className="bg-black/40 p-6 rounded-3xl border border-white/5 shadow-inner">
                    <div className="flex justify-between items-end mb-4">
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] leading-none">Integrity Index</p>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-black tracking-[0.1em] uppercase ${isVerified ? 'text-emerald-500' : 'text-primary'}`}>{child.status.replace(/_/g, ' ')}</span>
                                {isVerified && <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`text-2xl font-serif font-black tracking-tighter leading-none ${isVerified ? 'text-emerald-500' : 'text-white'}`}>
                                {progress}<span className="text-[10px] opacity-20 ml-1">%</span>
                            </p>
                        </div>
                    </div>
                    <div className="h-[6px] w-full bg-white/[0.03] rounded-full overflow-hidden p-[1px] border border-white/5 shadow-inner">
                        <div 
                            className={`h-full rounded-full transition-all duration-[1500ms] ease-out shadow-lg ${isVerified ? 'bg-emerald-500' : 'bg-primary shadow-primary/20'}`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="px-8 pb-8 flex items-center justify-between gap-4 relative z-10">
                <button 
                    onClick={onManageDocuments}
                    className="flex-1 h-[54px] flex items-center justify-center gap-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-all group/btn active:scale-95 shadow-sm"
                >
                    <DocumentTextIcon className="w-4.5 h-4.5 text-white/20 group-hover:btn:text-primary transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 group-hover:btn:text-white/60">Vault</span>
                </button>

                <button 
                    onClick={onNavigateDashboard}
                    className="flex-1 h-[54px] flex items-center justify-center gap-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-all group/btn active:scale-95 shadow-sm"
                >
                    <GraduationCapIcon className="w-4.5 h-4.5 text-white/20 group-hover:btn:text-primary transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 group-hover:btn:text-white/60">Portal</span>
                </button>

                <button 
                    onClick={onEdit}
                    className="w-[54px] h-[54px] flex items-center justify-center rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-all group/btn active:scale-95 shadow-sm"
                    title="Edit Node"
                >
                    <EditIcon className="w-4.5 h-4.5 text-white/20 group-hover:btn:text-white/60 transition-colors" />
                </button>
            </div>
        </div>
    );
};

export default ChildProfileCard;
