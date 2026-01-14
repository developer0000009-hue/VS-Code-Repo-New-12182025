import React, { useEffect, useState } from 'react';
import { SchoolAdminProfileData, SchoolBranch, UserProfile, BuiltInRoles } from '../../types';
import { supabase } from '../../services/supabase';
import StatCard from './StatCard';
import AreaChart from './charts/AreaChart';
import BarChart from './charts/BarChart';
import { StudentsIcon } from '../icons/StudentsIcon';
import { TeacherIcon } from '../icons/TeacherIcon';
import { CoursesIcon } from '../icons/CoursesIcon';
import { FinanceIcon } from '../icons/FinanceIcon';
import { LocationIcon } from '../icons/LocationIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { SchoolIcon } from '../icons/SchoolIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { KeyIcon } from '../icons/KeyIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';

interface DashboardOverviewProps {
    schoolProfile: SchoolAdminProfileData | null;
    currentBranch: SchoolBranch | null;
    profile: UserProfile;
    onNavigate: (component: string) => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ schoolProfile, currentBranch, profile, onNavigate }) => {
    const [stats, setStats] = useState({ students: 0, teachers: 0, courses: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            const branchId = currentBranch ? currentBranch.id : null;
            if (!branchId) return;

            const [studentRes, teacherRes, courseRes] = await Promise.all([
                supabase.rpc('get_all_students_for_admin', { p_branch_id: branchId }), 
                supabase.from('teacher_profiles').select('user_id', { count: 'exact', head: true }).eq('branch_id', branchId),
                supabase.from('courses').select('id', { count: 'exact', head: true }).eq('branch_id', branchId)
            ]);
            
            setStats({
                students: studentRes.data?.length || 0,
                teachers: teacherRes.count || 0,
                courses: courseRes.count || 0
            });
        };
        fetchStats();
    }, [currentBranch]);

    const isBranchAdmin = profile.role === BuiltInRoles.BRANCH_ADMIN;
    const branchStatus = currentBranch?.status || 'Active';
    const isBranchLinked = branchStatus === 'Active' || branchStatus === 'Linked' || !!profile.branch_id;

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
            {/* --- PREMIUM COMMAND CENTER HEADER --- */}
            <div className="relative overflow-hidden rounded-[3rem] bg-[#0a0a0c] border border-white/5 p-8 md:p-14 shadow-2xl shadow-black/50 ring-1 ring-white/10">
                {/* Aurora/Glow Background Effects */}
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-primary/10 rounded-full filter blur-[120px] opacity-40 animate-aurora pointer-events-none"></div>
                <div className="absolute -left-40 -bottom-40 w-[500px] h-[500px] bg-indigo-500/5 rounded-full filter blur-[100px] opacity-30 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12">
                    <div className="space-y-8 w-full max-w-4xl">
                        <div className="flex flex-wrap items-center gap-3">
                             <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em] bg-primary/10 px-5 py-2 rounded-full border border-primary/20 shadow-inner">Institutional Control</span>
                             {currentBranch ? (
                                 isBranchLinked ? (
                                    <span className="flex items-center gap-2 text-[9px] font-bold text-emerald-500 uppercase tracking-[0.2em] bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/10 backdrop-blur-md">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> Node Synced
                                    </span>
                                 ) : (
                                    <span className="flex items-center gap-2 text-[9px] font-bold text-amber-500 uppercase tracking-[0.2em] bg-amber-500/5 px-4 py-2 rounded-full border border-amber-500/10 backdrop-blur-md">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div> Handshake Pending
                                    </span>
                                 )
                             ) : (
                                <span className="flex items-center gap-2 text-[9px] font-bold text-red-500 uppercase tracking-[0.2em] bg-red-500/5 px-4 py-2 rounded-full border border-red-500/10 backdrop-blur-md">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div> Protocol Disconnect
                                </span>
                             )}
                        </div>
                        
                        <div>
                            <h1 className="text-5xl md:text-7xl font-serif font-black text-white tracking-tight leading-none mb-2 uppercase">
                                Welcome, <br/><span className="text-white/30 italic">{(profile.display_name || 'Admin').split(' ')[0]}!</span>
                            </h1>
                            <p className="text-white/40 text-lg md:text-xl font-medium tracking-tight font-serif italic mt-6 border-l border-white/10 pl-8">System Status: {currentBranch ? 'Operating under local node context.' : 'Standby mode. Node resolution required.'}</p>
                        </div>

                        {currentBranch ? (
                            <div className="flex flex-col gap-6 pt-2 animate-in slide-in-from-left-6 duration-1000">
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-8 group">
                                    <div className="p-5 bg-white/5 rounded-[2.2rem] text-primary shadow-2xl border border-white/10 group-hover:scale-105 group-hover:rotate-2 transition-all duration-700 ring-1 ring-inset ring-white/5">
                                        <SchoolIcon className="w-12 h-12" />
                                    </div>
                                    <div className="min-w-0 flex-grow">
                                        <div className="flex items-center gap-4 mb-2">
                                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none truncate font-sans drop-shadow-lg">
                                                {currentBranch.name}
                                            </h2>
                                            <span className="font-mono text-[10px] font-black text-white/30 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 shrink-0 shadow-inner">
                                                NODE_{currentBranch.id.toString().padStart(4, '0')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white/40 font-bold uppercase tracking-[0.2em] text-[11px] leading-relaxed">
                                            <LocationIcon className="w-4 h-4 text-primary opacity-60 shrink-0" />
                                            {[currentBranch.address, currentBranch.city, currentBranch.state].filter(Boolean).join(', ')}
                                        </div>
                                    </div>
                                </div>
                                
                                {!isBranchLinked && isBranchAdmin && (
                                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-[2.5rem] p-8 mt-2 flex flex-col md:flex-row items-center justify-between gap-8 animate-pulse shadow-xl shadow-amber-500/5">
                                        <div className="flex items-start gap-5">
                                            <div className="p-3.5 bg-amber-500 text-white rounded-2xl shadow-xl shadow-amber-500/20">
                                                <AlertTriangleIcon className="w-6 h-6" />
                                            </div>
                                            <div className="max-w-md">
                                                <p className="text-sm font-black text-amber-500 uppercase tracking-[0.2em]">Institutional Handshake Required</p>
                                                <p className="text-xs text-white/50 mt-2 leading-relaxed font-medium">Your profile is mapped via email, but the secure link is not finalized. Complete the protocol to unlock full telemetry.</p>
                                            </div>
                                        </div>
                                        <button onClick={() => onNavigate('Code Verification')} className="w-full md:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                                             Finalize Link <ChevronRightIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="group relative bg-red-500/5 border border-red-500/20 rounded-[2.5rem] p-8 md:p-10 animate-in zoom-in duration-700 max-w-3xl overflow-hidden shadow-2xl shadow-red-500/5">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] transform rotate-12 group-hover:scale-110 transition-transform duration-1000"><ShieldCheckIcon className="w-48 h-48 text-red-500" /></div>
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                                    <div className="flex items-start gap-6 text-center md:text-left flex-col md:flex-row items-center md:items-start">
                                        <div className="w-20 h-20 bg-red-500 text-white rounded-[1.8rem] flex items-center justify-center flex-shrink-0 shadow-2xl shadow-red-500/30 transform group-hover:rotate-6 transition-transform duration-500">
                                            <AlertTriangleIcon className="w-10 h-10" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-red-500 uppercase tracking-widest leading-none font-serif">Identity Disconnect</p>
                                            <p className="text-sm text-white/40 mt-4 leading-relaxed font-medium max-w-sm">No active branch node detected for <strong className="text-white/80">{profile.email}</strong>. Enter your provisioned link code to activate this workstation.</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => onNavigate('Code Verification')}
                                        className="w-full md:w-auto px-10 py-5 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-[0.25em] rounded-2xl shadow-2xl shadow-red-600/20 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 whitespace-nowrap ring-4 ring-red-600/10"
                                    >
                                        <KeyIcon className="w-5 h-5" /> Start Handshake
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-4 w-full lg:w-auto">
                        {!isBranchAdmin ? (
                            <button 
                                onClick={() => onNavigate('Branches')}
                                className="px-10 py-5 bg-primary text-primary-foreground rounded-2xl shadow-2xl shadow-primary/30 hover:bg-primary/90 hover:shadow-primary/50 font-black text-xs uppercase tracking-[0.3em] transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-4 whitespace-nowrap ring-4 ring-primary/10"
                            >
                                <GridIcon className="w-5 h-5" /> Institutional Nodes
                            </button>
                        ) : isBranchLinked && (
                            <button className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 group/dl">
                                <DownloadIcon className="w-5 h-5 group-hover/dl:translate-y-1 transition-transform" /> Export Campus Intelligence
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* --- SCOPED TELEMETRY GRID --- */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-700 ${!currentBranch ? 'opacity-30 grayscale blur-[2px] pointer-events-none' : 'opacity-100'}`}>
                <StatCard title="Active Enrollment" value={stats.students.toString()} icon={<StudentsIcon className="h-6 w-6" />} trend="+5.2%" colorClass="bg-blue-500/10 text-blue-400" />
                <StatCard title="Faculty Assets" value={stats.teachers.toString()} icon={<TeacherIcon className="h-6 w-6" />} trend="+2 new" colorClass="bg-emerald-500/10 text-emerald-400" />
                <StatCard title="Live Courses" value={stats.courses.toString()} icon={<CoursesIcon className="h-6 w-6" />} trend="Stable" colorClass="bg-amber-500/10 text-amber-400" />
                <StatCard title="Revenue (YTD)" value="$0" icon={<FinanceIcon className="h-6 w-6" />} trend="--%" colorClass="bg-indigo-500/10 text-indigo-400" />
            </div>

            {/* --- ANALYTICS VISUALIZATION --- */}
            <div className={`grid grid-cols-1 lg:grid-cols-5 gap-8 transition-all duration-700 ${!currentBranch ? 'opacity-20 blur-md pointer-events-none' : 'opacity-100'}`}>
                <div className="lg:col-span-3 bg-card/60 backdrop-blur-xl border border-white/5 rounded-[3rem] shadow-2xl flex flex-col h-[480px] relative overflow-hidden ring-1 ring-black/10">
                    <div className="p-8 md:p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                        <div>
                            <h3 className="font-bold text-xl text-white font-serif tracking-tight">Demographic Distribution</h3>
                            <p className="text-xs text-white/30 mt-1 uppercase tracking-widest font-black">Grade Wise Breakdown</p>
                        </div>
                        <div className="flex items-center gap-3">
                             <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"></div>
                             <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Active Enrollment</span>
                        </div>
                    </div>
                    <div className="p-10 flex-grow"><AreaChart /></div>
                </div>
                <div className="lg:col-span-2 bg-card/60 backdrop-blur-xl border border-white/5 rounded-[3rem] shadow-2xl flex flex-col h-[480px] relative overflow-hidden ring-1 ring-black/10">
                    <div className="p-8 md:p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                        <div>
                            <h3 className="font-bold text-xl text-white font-serif tracking-tight">Engagement Metric</h3>
                            <p className="text-xs text-white/30 mt-1 uppercase tracking-widest font-black">Institutional Health</p>
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.25em] bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">Target: 95%</span>
                    </div>
                    <div className="p-10 flex-grow"><BarChart /></div>
                </div>
            </div>
        </div>
    );
};

const GridIcon = ({className}:{className?:string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="7" height="7" x="3" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="14" rx="1.5"/><rect width="7" height="7" x="3" y="14" rx="1.5"/></svg>
);

export default DashboardOverview;