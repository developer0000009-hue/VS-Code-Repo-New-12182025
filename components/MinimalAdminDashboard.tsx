import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { KeyIcon } from './icons/KeyIcon';
// Fix: Added missing RefreshIcon and CheckCircleIcon imports to resolve compiler errors on lines 214 and 221.
import { RefreshIcon } from './icons/RefreshIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import ProfileDropdown from './common/ProfileDropdown';
import ThemeSwitcher from './common/ThemeSwitcher';

const StatBox: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; trend?: string }> = ({ title, value, icon, color, trend }) => (
    <motion.div 
        whileHover={{ y: -5, scale: 1.01 }}
        className="bg-[#0d0f14]/80 backdrop-blur-3xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl hover:shadow-primary/10 transition-all duration-500 group overflow-hidden relative ring-1 ring-white/5"
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
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchTelemetry = useCallback(async () => {
        if (!isRefreshing) setLoading(true);
        try {
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
            
            // Execute AI Auditor using Gemini 3 Pro for high-quality executive reasoning
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: `Perform an executive audit of the institutional node data: 
                - Current Enrollment: ${currentStats.students} students
                - Faculty Roster: ${currentStats.teachers} personnel
                - Admission Queue: ${currentStats.applications} pending review
                - Financial Revenue YTD: ${currentStats.revenue}
                
                Analyze the operational health and provide a 20-word critical executive summary for the Board of Governors. Tone: Clinical, Strategic, Authoritative.`,
                config: {
                    temperature: 0.7,
                    topP: 0.95,
                    topK: 40
                }
            });
            setAiInsight(response.text || null);
        } catch (e) {
            console.error("Governance Handshake Failure:", formatError(e));
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [isRefreshing]);

    useEffect(() => {
        fetchTelemetry();
    }, [fetchTelemetry]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchTelemetry();
    };

    if (loading && !isRefreshing) return (
        <div className="flex flex-col justify-center items-center h-screen space-y-8 bg-[#08090a]">
            <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl animate-pulse"></div>
                <Spinner size="lg" className="text-primary relative z-10" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.8em] text-white/30 animate-pulse">Establishing Governance Hub</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#08090a] text-foreground font-sans selection:bg-primary/20 pb-32">
            {/* High-Contrast Pattern Overlay */}
            <div className="fixed inset-0 opacity-[0.01] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

            <div className="max-w-[1800px] mx-auto p-6 md:p-12 lg:p-16 space-y-16 animate-in fade-in duration-1000 relative z-10">
                
                {/* Global Command Header */}
                <div className="flex justify-between items-center bg-[#0d0f14]/90 p-4 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-xl sticky top-6 z-50 ring-1 ring-white/10">
                    <div className="flex items-center gap-6 pl-4">
                        <div className="p-3 bg-primary/10 rounded-2xl shadow-inner border border-primary/20 group cursor-pointer" onClick={handleRefresh}>
                            <SchoolIcon className={`w-6 h-6 text-primary transition-transform duration-700 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-12'}`} />
                        </div>
                        <div>
                            <span className="font-serif font-black text-white text-xl tracking-[0.1em] uppercase leading-none block">Gurukul <span className="text-white/20 italic font-medium">OS</span></span>
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mt-1.5 block">Executive Administrative Interface</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 pr-2">
                        <div className="hidden sm:block"><ThemeSwitcher /></div>
                        <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
                        <ProfileDropdown profile={profile} onSignOut={onSignOut} onSelectRole={onSelectRole} />
                    </div>
                </div>

                {/* Main Hero Console */}
                <header className="relative flex flex-col xl:flex-row justify-between items-start xl:items-center gap-16 bg-[#0a0c10] border border-white/5 p-12 md:p-24 rounded-[5rem] overflow-hidden ring-1 ring-white/10 shadow-[0_80px_160px_-48px_rgba(0,0,0,1)]">
                    <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[180px] opacity-60 pointer-events-none animate-aurora"></div>

                    <div className="relative z-10 space-y-12 max-w-4xl">
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981] animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-white/40">Secure Node Handshake: 256-BIT Verified</span>
                        </motion.div>
                        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-7xl md:text-9xl font-serif font-black text-white tracking-tighter leading-[0.8] uppercase">
                            Executive <br/> <span className="text-white/30 italic lowercase">telemetry.</span>
                        </motion.h1>
                        <p className="text-xl text-white/40 font-medium font-serif italic max-w-xl leading-relaxed border-l-2 border-white/10 pl-10">
                            A unified analytical layer for institutional orchestration. Monitor growth vectors, faculty efficiency, and fiscal stabilization in real-time.
                        </p>
                    </div>
                    
                    <div className="xl:w-[460px] w-full space-y-8 relative z-10">
                        <AnimatePresence mode="wait">
                            {aiInsight ? (
                                <motion.div 
                                    key="ai-card"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-primary/5 border border-primary/20 p-10 rounded-[3.5rem] relative group overflow-hidden shadow-2xl"
                                >
                                    <SparklesIcon className="absolute -right-4 -top-4 w-24 h-24 text-primary/10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000" />
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-2 bg-primary/20 rounded-lg text-primary"><SparklesIcon className="w-4 h-4"/></div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Intelligence Pulse</p>
                                    </div>
                                    <p className="text-lg font-serif italic text-white/80 leading-relaxed font-medium">"{aiInsight}"</p>
                                    <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Model: Gemini 3 Pro</span>
                                        <button onClick={() => setAiInsight(null)} className="text-[9px] font-black text-primary hover:text-white transition-colors uppercase tracking-widest">Dismiss Audit</button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.button 
                                    key="ai-trigger"
                                    onClick={fetchTelemetry}
                                    whileHover={{ scale: 1.02 }}
                                    className="w-full p-12 rounded-[3.5rem] border-2 border-dashed border-white/10 hover:border-primary/40 transition-all flex flex-col items-center justify-center gap-4 text-white/20 hover:text-primary group"
                                >
                                    <SparklesIcon className="w-10 h-10 group-hover:animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Initialize AI Analysis</span>
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </header>

                {/* Telemetry Core Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <StatBox title="Active Students" value={stats.students.toLocaleString()} icon={<GraduationCapIcon className="w-8 h-8"/>} color="bg-blue-500" trend="+4.2%" />
                    <StatBox title="Faculty Assets" value={stats.teachers.toLocaleString()} icon={<TeacherIcon className="w-8 h-8" />} color="bg-emerald-500" trend="Stable" />
                    <StatBox title="Pending Queue" value={stats.applications.toLocaleString()} icon={<UsersIcon className="w-8 h-8"/>} color="bg-amber-500" trend="Action" />
                    <StatBox title="Revenue YTD" value={formatCurrency(stats.revenue)} icon={<FinanceIcon className="w-8 h-8"/>} color="bg-indigo-500" />
                </div>

                {/* Handshake & Protocol Monitors */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
                    <div className="lg:col-span-8 bg-[#0c0e12] border border-white/5 rounded-[4.5rem] p-12 md:p-16 shadow-3xl relative overflow-hidden group ring-1 ring-white/10">
                        <div className="flex justify-between items-start mb-16 relative z-10">
                            <div>
                                <h3 className="text-4xl font-serif font-black text-white tracking-tight uppercase leading-none">Vault Synchronization</h3>
                                <p className="text-base text-white/30 mt-3 font-medium tracking-[0.3em] uppercase">Pending Artifact Verification Queue</p>
                            </div>
                            <button onClick={handleRefresh} className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:text-primary transition-all group/refresh shadow-xl">
                                <RefreshIcon className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : 'group-hover/refresh:rotate-180 transition-transform duration-700'}`} />
                            </button>
                        </div>
                        
                        <div className="space-y-4 relative z-10">
                            {pendingDocs.length === 0 ? (
                                <div className="py-24 text-center">
                                    <CheckCircleIcon className="w-16 h-16 text-emerald-500/20 mx-auto mb-6" />
                                    <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.6em] italic">Identity Vault Perfectly Synchronized</p>
                                </div>
                            ) : pendingDocs.map((doc, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    key={doc.id} 
                                    className="flex items-center justify-between p-7 bg-white/[0.02] border border-white/5 rounded-[2.5rem] hover:bg-white/[0.04] transition-all group/item shadow-sm"
                                >
                                    <div className="flex items-center gap-8">
                                        <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20 shadow-inner group-hover/item:scale-110 transition-transform">
                                            <DocumentTextIcon className="w-7 h-7"/>
                                        </div>
                                        <div>
                                            <p className="text-[16px] font-bold text-white uppercase tracking-wider">{doc.admissions?.applicant_name}</p>
                                            <p className="text-[10px] text-white/20 uppercase font-black mt-1.5 tracking-widest">{doc.document_name} Protocol</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className="text-[10px] font-mono text-white/10 uppercase tracking-tighter hidden sm:block">REF_{String(doc.id).padStart(6, '0')}</span>
                                        <button className="p-4 bg-primary/10 text-primary rounded-2xl opacity-0 group-hover/item:opacity-100 transition-all transform group-hover/item:translate-x-2 active:scale-90">
                                            <ChevronRightIcon className="w-6 h-6"/>
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        
                        {/* High-tech grid lines */}
                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)`, backgroundSize: '40px 40px' }}></div>
                    </div>
                    
                    <div className="lg:col-span-4 bg-[#0a0a0c] border border-white/10 rounded-[4.5rem] p-12 md:p-14 shadow-inner relative overflow-hidden flex flex-col group/security">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover/security:scale-110 transition-transform duration-1000"><ShieldCheckIcon className="w-64 h-64 text-indigo-500" /></div>
                        
                        <h3 className="text-[11px] font-black uppercase text-indigo-400 tracking-[0.5em] mb-16 flex items-center gap-4">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
                            Security Stream
                        </h3>
                        
                        <div className="space-y-12 flex-grow relative z-10">
                            {[
                                { action: 'Identity Vault Synced', node: 'Primary Guardian Node #04', time: '12m ago', icon: <DocumentTextIcon className="w-4 h-4 text-emerald-400" /> },
                                { action: 'New Faculty Provisioned', node: 'Staffing Cluster Node #02', time: '1h ago', icon: <KeyIcon className="w-4 h-4 text-indigo-400" /> },
                                { action: 'Governance Seal Applied', node: 'Central Administration', time: '3h ago', icon: <ShieldCheckIcon className="w-4 h-4 text-amber-400" /> },
                                { action: 'Admission Cycle Initialized', node: 'Public Entry Gateway', time: '5h ago', icon: <GraduationCapIcon className="w-4 h-4 text-blue-400" /> }
                            ].map((log, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + (i * 0.1) }}
                                    key={i} 
                                    className="flex gap-8 items-start relative group/log"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-lg group-hover/log:border-primary/20 transition-colors duration-500">
                                        {log.icon}
                                    </div>
                                    <div className="min-w-0 border-b border-white/5 pb-8 flex-grow group-hover/log:border-white/20 transition-colors">
                                        <p className="text-[15px] font-bold text-white/90 truncate uppercase tracking-tight">{log.action}</p>
                                        <div className="flex justify-between mt-2.5">
                                            <span className="text-[9px] font-black uppercase text-white/20 tracking-widest">{log.node}</span>
                                            <span className="text-[9px] font-bold text-white/10 uppercase font-mono">{log.time}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <button className="mt-16 py-5 px-8 rounded-2xl bg-white/5 border border-white/10 text-[9px] font-black uppercase text-white/30 tracking-[0.4em] hover:bg-white/10 hover:text-white transition-all shadow-xl active:scale-95">
                            Access Full Audit Ledger
                        </button>
                    </div>
                </div>

                {/* Deployment Stamp */}
                <div className="pt-20 border-t border-white/[0.04] text-center">
                    <p className="text-[10px] font-black uppercase tracking-[1em] text-white/5 select-none">
                        GURUKUL OS v23.5.0-ALPHA • DEPLOYMENT STABLE • CORE ACTIVE
                    </p>
                </div>
            </div>
        </div>
    );
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount || 0);
};

export default MinimalAdminDashboard;