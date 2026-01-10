
import React, { useState, useEffect } from 'react';
import { supabase, formatError } from '../services/supabase';
import { UserProfile, Role } from '../types';
import { GoogleGenAI } from '@google/genai';
import Spinner from './common/Spinner';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { UsersIcon } from './icons/UsersIcon';
import { TeacherIcon } from './icons/TeacherIcon';
import { FinanceIcon } from './icons/FinanceIcon';
import { GraduationCapIcon } from './icons/GraduationCapIcon';
import { SchoolIcon } from './icons/SchoolIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ActivityIcon } from './icons/ActivityIcon';
import { KeyIcon } from './icons/KeyIcon';
import ProfileDropdown from './common/ProfileDropdown';
import ThemeSwitcher from './common/ThemeSwitcher';

const StatBox: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; trend?: string; desc?: string }> = ({ title, value, icon, color, trend, desc }) => (
    <div className="bg-[#0d0f14]/80 backdrop-blur-3xl border border-white/5 p-8 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] hover:shadow-primary/10 transition-all duration-500 group overflow-hidden relative ring-1 ring-white/5">
        <div className={`absolute -right-8 -top-8 w-48 h-48 ${color} opacity-[0.03] rounded-full blur-[100px] group-hover:opacity-[0.08] transition-opacity duration-1000`}></div>
        <div className="flex justify-between items-start relative z-10">
            <div className={`p-4 rounded-2xl bg-white/5 text-white/30 ring-1 ring-white/10 shadow-inner group-hover:scale-110 group-hover:text-primary transition-all duration-500`}>
                {icon}
            </div>
            {trend && <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em] border border-emerald-500/20">{trend}</div>}
        </div>
        <div className="mt-10 relative z-10">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">{title}</p>
            <h3 className="text-5xl font-serif font-black text-white tracking-tighter leading-none">{value}</h3>
            {desc && <p className="text-[11px] text-white/30 mt-4 font-medium italic leading-relaxed">{desc}</p>}
        </div>
    </div>
);

interface MinimalAdminDashboardProps {
    profile: UserProfile;
    onSignOut: () => void;
    onSelectRole: (role: Role, isExisting?: boolean) => void;
}

const MinimalAdminDashboard: React.FC<MinimalAdminDashboardProps> = ({ profile, onSignOut, onSelectRole }) => {
    const [stats, setStats] = useState({ students: 0, teachers: 0, revenue: 0, applications: 0 });
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const [std, tea, fin, adm] = await Promise.all([
                    supabase.from('student_profiles').select('*', { count: 'exact', head: true }),
                    supabase.from('teacher_profiles').select('*', { count: 'exact', head: true }),
                    supabase.rpc('get_finance_dashboard_data').catch(() => ({ data: { revenue_ytd: 0 } })),
                    supabase.from('admissions').select('*', { count: 'exact', head: true }).eq('status', 'Pending Review')
                ]);
                
                const statsObj = {
                    students: std.count || 0,
                    teachers: tea.count || 0,
                    revenue: (fin as any).data?.revenue_ytd || 0,
                    applications: adm.count || 0
                };
                setStats(statsObj);
                
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: `Provide a one-sentence executive summary of these school metrics: Total Students ${statsObj.students}, Faculty ${statsObj.teachers}, Revenue $${statsObj.revenue}, Pending Applications ${statsObj.applications}. Tone: Decisive and analytical.`
                });
                setAiInsight(response.text || null);
            } catch (e) {
                console.error("Metric sync failed:", formatError(e));
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="flex flex-col justify-center items-center h-screen space-y-8 bg-[#08090a]">
            <Spinner size="lg" className="text-primary" />
            <p className="text-[12px] font-black uppercase tracking-[0.6em] text-white/30 animate-pulse">Establishing Secure Context</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#08090a] text-foreground font-sans selection:bg-primary/20">
            <div className="max-w-[1800px] mx-auto p-6 md:p-10 lg:p-16 space-y-12 animate-in fade-in duration-1000">
                
                {/* Navbar Area */}
                <div className="flex justify-between items-center bg-[#0d0f14]/90 p-4 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-3xl sticky top-6 z-50 ring-1 ring-white/10">
                    <div className="flex items-center gap-6 pl-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl shadow-inner border border-primary/20">
                            <SchoolIcon className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <span className="font-serif font-black text-white text-xl tracking-[0.2em] uppercase leading-none block">Master Node</span>
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mt-1 block">Institutional Overlord</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 pr-2">
                        <ThemeSwitcher />
                        <div className="w-px h-8 bg-white/10"></div>
                        <ProfileDropdown profile={profile} onSignOut={onSignOut} onSelectRole={onSelectRole} />
                    </div>
                </div>

                {/* Main Hero Header */}
                <header className="relative flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12 bg-[#0a0c10] border border-white/5 p-12 md:p-20 rounded-[4.5rem] overflow-hidden ring-1 ring-white/10 shadow-[0_64px_128px_-24px_rgba(0,0,0,1)]">
                    <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] opacity-40 animate-pulse"></div>
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-900/10 rounded-full blur-[100px] opacity-30"></div>

                    <div className="relative z-10 space-y-10 max-w-4xl">
                        <div className="inline-flex items-center gap-5 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-inner">
                            <ActivityIcon className="w-4 h-4 text-primary animate-pulse" />
                            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-primary">Live Pulse Synchronization</span>
                        </div>
                        
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-black text-white tracking-tighter leading-[0.85] uppercase">
                            Global <br/> <span className="text-white/30 italic lowercase">oversight.</span>
                        </h1>
                        
                        <p className="text-xl md:text-2xl text-white/40 font-serif italic leading-relaxed border-l-4 border-primary/30 pl-10 max-w-2xl">
                            Real-time intelligence dashboard aggregating telemetry from all institutional branch nodes, financial centers, and academic clusters.
                        </p>
                    </div>
                    
                    <div className="xl:w-[400px] w-full space-y-6 relative z-10">
                        <div className="bg-[#141726]/80 backdrop-blur-xl border border-primary/20 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent animate-scanner-move pointer-events-none"></div>
                             <div className="flex justify-between items-start mb-10">
                                 <div>
                                     <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-1">Fiscal Status</p>
                                     <h4 className="text-2xl font-black text-white uppercase tracking-tight">Active Cycle</h4>
                                 </div>
                                 <div className="p-3 bg-white/5 rounded-2xl border border-white/10"><CalendarIcon className="w-6 h-6 text-white/40" /></div>
                             </div>
                             <div className="space-y-4">
                                 <div className="flex justify-between text-sm"><span className="text-white/30 font-bold uppercase tracking-widest text-[9px]">Cycle ID</span><span className="font-mono font-black text-white tracking-widest text-xs">CY-2025-HO</span></div>
                                 <div className="flex justify-between text-sm"><span className="text-white/30 font-bold uppercase tracking-widest text-[9px]">Uptime</span><span className="font-mono font-black text-emerald-500 tracking-widest text-xs">99.98%</span></div>
                             </div>
                        </div>

                        {aiInsight && (
                            <div className="bg-primary/5 border border-primary/20 p-8 rounded-[2.5rem] relative group overflow-hidden animate-in fade-in slide-in-from-right-8 duration-1000">
                                <SparklesIcon className="absolute -right-2 -top-2 w-16 h-16 text-primary/10 group-hover:scale-110 transition-transform" />
                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary mb-3">AI Intelligence Summary</p>
                                <p className="text-sm font-serif italic text-white/70 leading-relaxed">"{aiInsight}"</p>
                            </div>
                        )}
                    </div>
                </header>

                {/* Core Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <StatBox 
                        title="Aggregated Students" 
                        value={stats.students.toLocaleString()} 
                        icon={<GraduationCapIcon className="w-8 h-8"/>} 
                        color="bg-blue-500" 
                        trend="+12.4%" 
                        desc="Consolidated across all branch nodes."
                    />
                    <StatBox 
                        title="Faculty Network" 
                        value={stats.teachers.toLocaleString()} 
                        icon={<TeacherIcon className="w-8 h-8" />} 
                        color="bg-emerald-500" 
                        trend="Optimal"
                        desc="Verified instructional personnel."
                    />
                    <StatBox 
                        title="Pending Enrolments" 
                        value={stats.applications.toLocaleString()} 
                        icon={<UsersIcon className="w-8 h-8"/>} 
                        color="bg-amber-500" 
                        trend="Attention"
                        desc="Inbound identity verification queue."
                    />
                    <StatBox 
                        title="Gross Yield" 
                        value={`$${(stats.revenue / 1000).toFixed(1)}K`} 
                        icon={<FinanceIcon className="w-8 h-8"/>} 
                        color="bg-indigo-500" 
                        trend="+5.8%"
                        desc="Current cycle realized revenue."
                    />
                </div>

                {/* Activity Feed Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    <div className="lg:col-span-8 bg-[#0c0e12] border border-white/5 rounded-[4rem] p-12 md:p-16 shadow-2xl relative overflow-hidden group hover:border-primary/20 transition-all duration-1000">
                        <div className="absolute top-0 right-0 p-16 opacity-[0.02] pointer-events-none transform -rotate-12 group-hover:scale-110 transition-transform duration-1000"><ChartBarIcon className="w-96 h-96 text-white" /></div>
                        <div className="flex justify-between items-start mb-16 relative z-10">
                            <div>
                                <h3 className="text-4xl font-serif font-black text-white tracking-tight uppercase leading-none">Fiscal Trajectory</h3>
                                <p className="text-base text-white/30 mt-3 font-medium tracking-[0.3em] uppercase">Comparative Node Analysis</p>
                            </div>
                            <button className="p-4 bg-white/5 rounded-2xl hover:bg-primary hover:text-white border border-white/10 transition-all">
                                <TrendingUpIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="h-[250px] flex items-end justify-between gap-6 px-4">
                            {[40, 70, 55, 90, 65, 85, 95, 75].map((h, i) => (
                                <div key={i} className="flex-1 bg-white/[0.02] rounded-full relative group/bar hover:bg-primary/5 transition-all duration-700" style={{ height: '100%' }}>
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/30 to-primary rounded-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]" style={{ height: `${h}%` }}></div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-10 text-[10px] font-black text-white/10 uppercase tracking-[0.6em] px-8">
                            <span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span><span>Q1</span><span>Q2</span><span>Q3</span><span>PROJ</span>
                        </div>
                    </div>
                    
                    <div className="lg:col-span-4 bg-[#0a0a0c] border border-white/10 rounded-[4rem] p-10 md:p-12 shadow-inner relative overflow-hidden flex flex-col">
                        <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em] mb-12 flex items-center gap-3">
                            <ShieldCheckIcon className="w-5 h-5" /> Security Ledger
                        </h3>
                        <div className="space-y-10 flex-grow relative z-10">
                            {[
                                { action: 'Access Permit Provisioned', node: 'Node_1102', time: '12m ago', icon: <KeyIcon className="w-4 h-4 text-emerald-400" /> },
                                { action: 'Fiscal Audit Finalized', node: 'Head Office', time: '1h ago', icon: <FinanceIcon className="w-4 h-4 text-indigo-400" /> },
                                { action: 'Identity Verification Override', node: 'Node_0988', time: '3h ago', icon: <UsersIcon className="w-4 h-4 text-amber-400" /> }
                            ].map((log, i) => (
                                <div key={i} className="flex gap-6 items-start group/log cursor-pointer">
                                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:log:border-primary/40 transition-colors">
                                        {log.icon}
                                    </div>
                                    <div className="min-w-0 border-b border-white/5 pb-6 flex-grow">
                                        <p className="text-sm font-bold text-white group-hover:log:text-primary transition-colors truncate">{log.action}</p>
                                        <div className="flex justify-between mt-2">
                                            <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">{log.node}</span>
                                            <span className="text-[9px] font-bold text-white/10 uppercase">{log.time}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="mt-12 w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-white/40 hover:text-white hover:bg-white/10 transition-all uppercase tracking-[0.4em]">Full System Audit &rarr;</button>
                    </div>
                </div>

                <footer className="pt-24 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10 opacity-20">
                    <div className="flex items-center gap-4">
                        <SchoolIcon className="w-5 h-5" />
                        <p className="text-[11px] font-black uppercase tracking-[0.6em] text-white">GURUKUL MASTER DEPLOYMENT CORE v12.0.1</p>
                    </div>
                    <div className="flex items-center gap-12">
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div> Nodes Verified</span>
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500">AES-256 ENCRYPTED UPLINK</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default MinimalAdminDashboard;
