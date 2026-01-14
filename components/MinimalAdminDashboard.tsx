import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { ClockIcon } from './icons/ClockIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ActivityIcon } from './icons/ActivityIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
// FIX: Added missing import for KeyIcon
import { KeyIcon } from './icons/KeyIcon';
import ProfileDropdown from './common/ProfileDropdown';
import ThemeSwitcher from './common/ThemeSwitcher';

const StatBox: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; trend?: string }> = ({ title, value, icon, color, trend }) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className="bg-[#0d0f14]/80 backdrop-blur-3xl border border-white/5 p-8 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] hover:shadow-primary/10 transition-all duration-500 group overflow-hidden relative ring-1 ring-white/5"
    >
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
        </div>
    </motion.div>
);

interface MinimalAdminDashboardProps {
    profile: UserProfile;
    onSignOut: () => void;
    onSelectRole: (role: Role, isExisting?: boolean) => void;
}

const MinimalAdminDashboard: React.FC<MinimalAdminDashboardProps> = ({ profile, onSignOut, onSelectRole }) => {
    const [stats, setStats] = useState({ students: 0, teachers: 0, revenue: 0, applications: 0 });
    const [pendingDocs, setPendingDocs] = useState<any[]>([]);
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTelemetry = async () => {
            setLoading(true);
            try {
                // Parallel identity discovery
                const [std, tea, fin, adm, docs] = await Promise.all([
                    supabase.from('student_profiles').select('*', { count: 'exact', head: true }),
                    supabase.from('teacher_profiles').select('*', { count: 'exact', head: true }),
                    supabase.rpc('get_finance_dashboard_data'),
                    supabase.from('admissions').select('*', { count: 'exact', head: true }).eq('status', 'Pending Review'),
                    supabase.from('document_requirements').select('*, admissions(applicant_name)').eq('status', 'Submitted').limit(5)
                ]);
                
                const currentStats = {
                    students: std.count || 0,
                    teachers: tea.count || 0,
                    revenue: fin.data?.revenue_ytd || 0,
                    applications: adm.count || 0
                };
                setStats(currentStats);
                setPendingDocs(docs.data || []);
                
                // AI Audit Execution
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: `Audit Institutional Node: ${currentStats.students} students, ${currentStats.teachers} faculty, ${currentStats.applications} admissions waiting. Provide a 15-word critical status summary for a Head of Institution.`
                });
                setAiInsight(response.text || null);
            } catch (e) {
                console.error("Governance Handshake Failure:", formatError(e));
            } finally {
                setLoading(false);
            }
        };
        fetchTelemetry();
    }, []);

    if (loading) return (
        <div className="flex flex-col justify-center items-center h-screen space-y-8 bg-[#08090a]">
            <Spinner size="lg" className="text-primary" />
            <p className="text-[12px] font-black uppercase tracking-[0.6em] text-white/30 animate-pulse">Initializing Governance Streams</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#08090a] text-foreground font-sans selection:bg-primary/20 pb-20">
            <div className="max-w-[1800px] mx-auto p-6 md:p-10 lg:p-16 space-y-12 animate-in fade-in duration-1000">
                
                {/* Global Command Header */}
                <div className="flex justify-between items-center bg-[#0d0f14]/90 p-4 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-xl sticky top-6 z-50 ring-1 ring-white/10">
                    <div className="flex items-center gap-6 pl-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl shadow-inner border border-primary/20">
                            <SchoolIcon className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <span className="font-serif font-black text-white text-xl tracking-[0.2em] uppercase leading-none block">Governance Node</span>
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mt-1 block">Institutional Oversight</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 pr-2">
                        <ThemeSwitcher />
                        <div className="w-px h-8 bg-white/10"></div>
                        <ProfileDropdown profile={profile} onSignOut={onSignOut} onSelectRole={onSelectRole} />
                    </div>
                </div>

                {/* AI-Enhanced Hero */}
                <header className="relative flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12 bg-[#0a0c10] border border-white/5 p-12 md:p-20 rounded-[4.5rem] overflow-hidden ring-1 ring-white/10 shadow-3xl">
                    <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] opacity-40 animate-pulse"></div>

                    <div className="relative z-10 space-y-10 max-w-4xl">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-5 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                            <ActivityIcon className="w-4 h-4 text-emerald-500 animate-pulse" />
                            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-emerald-500">Registry Synchronized</span>
                        </motion.div>
                        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-6xl md:text-8xl lg:text-9xl font-serif font-black text-white tracking-tighter leading-[0.85] uppercase">
                            Executive <br/> <span className="text-white/30 italic lowercase">overview.</span>
                        </motion.h1>
                    </div>
                    
                    <div className="xl:w-[400px] w-full space-y-6 relative z-10">
                        {aiInsight && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-primary/5 border border-primary/20 p-8 rounded-[2.5rem] relative group overflow-hidden">
                                <SparklesIcon className="absolute -right-2 -top-2 w-16 h-16 text-primary/10 group-hover:scale-110 transition-transform" />
                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary mb-3">AI Context Pulse</p>
                                <p className="text-sm font-serif italic text-white/70 leading-relaxed">"{aiInsight}"</p>
                            </motion.div>
                        )}
                    </div>
                </header>

                {/* Core Telemetry */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <StatBox title="Live Students" value={stats.students} icon={<GraduationCapIcon className="w-8 h-8"/>} color="bg-blue-500" trend="+4.2%" />
                    <StatBox title="Faculty Count" value={stats.teachers} icon={<TeacherIcon className="w-8 h-8" />} color="bg-emerald-500" />
                    <StatBox title="Pending Admiss." value={stats.applications} icon={<UsersIcon className="w-8 h-8"/>} color="bg-amber-500" trend="Attention" />
                    <StatBox title="Revenue YTD" value={`$${(stats.revenue / 1000).toFixed(1)}K`} icon={<FinanceIcon className="w-8 h-8"/>} color="bg-indigo-500" />
                </div>

                {/* Handshake Monitor */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    <div className="lg:col-span-8 bg-[#0c0e12] border border-white/5 rounded-[4rem] p-12 md:p-16 shadow-2xl relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-16 relative z-10">
                            <div>
                                <h3 className="text-4xl font-serif font-black text-white tracking-tight uppercase">Identity Vault Monitor</h3>
                                <p className="text-base text-white/30 mt-3 font-medium tracking-[0.3em] uppercase">Pending Artifact Verification</p>
                            </div>
                            <button className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:text-primary transition-all"><ClockIcon className="w-6 h-6" /></button>
                        </div>
                        
                        <div className="space-y-4 relative z-10">
                            {pendingDocs.length === 0 ? (
                                <div className="py-20 text-center text-white/10 uppercase font-black tracking-[0.4em]">Vault Synchronized</div>
                            ) : pendingDocs.map((doc, i) => (
                                <div key={doc.id} className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-white/[0.04] transition-all group/item">
                                    <div className="flex items-center gap-6">
                                        <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400"><DocumentTextIcon className="w-6 h-6"/></div>
                                        <div>
                                            <p className="text-sm font-bold text-white uppercase tracking-wider">{doc.admissions?.applicant_name}</p>
                                            <p className="text-[10px] text-white/30 uppercase font-bold mt-1 tracking-widest">{doc.document_name}</p>
                                        </div>
                                    </div>
                                    <button className="p-3 bg-primary/10 text-primary rounded-xl opacity-0 group-hover/item:opacity-100 transition-all"><ChevronRightIcon className="w-5 h-5"/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="lg:col-span-4 bg-[#0a0a0c] border border-white/10 rounded-[4rem] p-10 md:p-12 shadow-inner relative overflow-hidden flex flex-col">
                        <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em] mb-12 flex items-center gap-3">
                            <ShieldCheckIcon className="w-5 h-5" /> Security Stream
                        </h3>
                        <div className="space-y-10 flex-grow relative z-10">
                            {[
                                { action: 'Vault Artifact Linked', node: 'Parent Node #04', time: '12m ago', icon: <DocumentTextIcon className="w-4 h-4 text-emerald-400" /> },
                                { action: 'Identity Initiated', node: 'Branch Node #02', time: '1h ago', icon: <KeyIcon className="w-4 h-4 text-indigo-400" /> },
                                { action: 'Governance Seal', node: 'Central Node', time: '3h ago', icon: <ShieldCheckIcon className="w-4 h-4 text-amber-400" /> }
                            ].map((log, i) => (
                                <div key={i} className="flex gap-6 items-start">
                                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">{log.icon}</div>
                                    <div className="min-w-0 border-b border-white/5 pb-6 flex-grow">
                                        <p className="text-sm font-bold text-white truncate">{log.action}</p>
                                        <div className="flex justify-between mt-2"><span className="text-[10px] font-black uppercase text-white/20 tracking-widest">{log.node}</span><span className="text-[9px] font-bold text-white/10 uppercase">{log.time}</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MinimalAdminDashboard;