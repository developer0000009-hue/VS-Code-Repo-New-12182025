
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { UserProfile } from '../../types';
import Spinner from '../common/Spinner';
import { UsersIcon } from '../icons/UsersIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { CommunicationIcon } from '../icons/CommunicationIcon';
import { motion } from 'framer-motion';

interface ParentStats {
    total_applications: number;
    pending_applications: number;
    approved_applications: number;
}

// --- Micro-Trend Visualization ---
const MicroTrendLine = ({ color = "#8B5CF6" }) => {
    const points = "0,35 20,30 40,32 60,20 80,25 100,10";
    return (
        <div className="h-8 w-20 opacity-40 group-hover:opacity-70 transition-opacity">
            <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                <path
                    d={`M ${points}`}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
};

// --- Metric Console Component ---
const ConsoleMetric: React.FC<{ 
    title: string; 
    value: number | string; 
    icon: React.ReactNode; 
    subtitle?: string;
    variant?: 'primary' | 'secondary';
    colorClass?: string;
}> = ({ title, value, icon, subtitle, variant = 'secondary', colorClass = "text-primary" }) => (
    <motion.div 
        variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0 }
        }}
        className={`flex flex-col p-6 rounded-2xl bg-[#0f1116] border border-white/[0.04] shadow-2xl transition-all duration-300 hover:border-white/[0.08] hover:-translate-y-1 group ${variant === 'primary' ? 'ring-1 ring-primary/20' : ''}`}
    >
        <div className="flex justify-between items-start mb-6">
            <div className={`p-2.5 rounded-xl bg-white/[0.02] ${colorClass} transition-colors border border-white/[0.05] group-hover:bg-white/[0.05]`}>
                {icon}
            </div>
            <MicroTrendLine color={variant === 'primary' ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.2)'} />
        </div>
        <div className="space-y-1">
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em]">{title}</p>
            <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-semibold text-white/90 tracking-tight leading-none font-sans">{value}</h3>
                {subtitle && <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{subtitle}</span>}
            </div>
        </div>
    </motion.div>
);

const OverviewTab: React.FC<{ profile?: UserProfile; setActiveComponent?: (id: string) => void }> = ({ profile, setActiveComponent }) => {
  const [stats, setStats] = useState<ParentStats>({ total_applications: 0, pending_applications: 0, approved_applications: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_parent_dashboard_stats');
        if (!error && data) setStats(data);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex flex-col justify-center items-center py-40 space-y-6">
      <Spinner size="lg" className="text-primary" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 animate-pulse">Establishing Secure Context</p>
    </div>
  );

  return (
    <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
            visible: { transition: { staggerChildren: 0.08 } }
        }}
        className="max-w-6xl mx-auto space-y-8 pb-32 font-sans"
    >
      
      {/* 1. MISSION CONTROL HEADER */}
      <motion.div 
        variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
        className="relative p-10 md:p-14 rounded-[2.5rem] bg-[#0c0e12] border border-white/5 overflow-hidden shadow-[0_32px_80px_-16px_rgba(0,0,0,1)]"
      >
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
              <div className="space-y-6 max-w-2xl">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Operational</span>
                    </div>
                    <span className="text-[12px] font-medium text-white/20 uppercase tracking-widest italic">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                </div>
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight uppercase">
                        Greetings, <span className="text-white/40 italic font-medium">{profile?.display_name?.split(' ')[0] || 'Guardian'}</span>
                    </h1>
                    <p className="text-[15px] text-white/40 leading-relaxed font-medium mt-6 border-l border-white/10 pl-8 max-w-lg">
                        System status remains nominal. Institutional network reports stable connectivity. All identity processes are currently synchronized.
                    </p>
                </div>
              </div>
              
              <div className="flex items-center gap-5 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] shadow-inner backdrop-blur-md">
                 <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                    <ShieldCheckIcon className="w-5 h-5"/>
                 </div>
                 <div className="pr-4">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-0.5">Integrity</p>
                    <p className="text-[12px] font-bold text-white uppercase tracking-widest">Verified</p>
                 </div>
              </div>
          </div>
      </motion.div>

      {/* 2. CONSOLE METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ConsoleMetric 
            title="Registered Nodes" 
            value={stats.total_applications} 
            icon={<UsersIcon className="w-5 h-5" />} 
            subtitle="Children"
            variant="primary"
        />
        <ConsoleMetric 
            title="Verification Queue" 
            value={stats.pending_applications} 
            icon={<ClockIcon className="w-5 h-5" />} 
            subtitle="Pending"
            colorClass="text-amber-500"
        />
        <ConsoleMetric 
            title="Identity Clearance" 
            value={stats.approved_applications} 
            icon={<CheckCircleIcon className="w-5 h-5" />} 
            subtitle="Sealed"
            colorClass="text-emerald-500"
        />
      </div>

      {/* 3. WORKSPACE GRID */}
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* SYSTEM INSIGHTS (Left Column) */}
          <motion.div 
            variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}
            className="lg:col-span-8 space-y-6"
          >
              <div className="flex items-center justify-between px-2">
                 <h3 className="text-[14px] font-bold text-white/40 uppercase tracking-widest">Critical Insights</h3>
                 <button className="text-[11px] font-bold text-primary uppercase tracking-widest hover:text-white transition-colors">System Audit Log</button>
              </div>
              
              <div className="bg-[#0c0e12] border border-white/[0.05] rounded-[2rem] p-10 min-h-[340px] flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 opacity-[0.01] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                  
                  {stats.pending_applications > 0 ? (
                      <div className="space-y-8 relative z-10">
                          <div 
                            className="flex items-center justify-between p-8 rounded-2xl bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.03] hover:border-primary/20 transition-all cursor-pointer shadow-2xl"
                            onClick={() => setActiveComponent?.('Documents')}
                          >
                              <div className="flex items-center gap-8">
                                  <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20 shadow-xl">
                                      <DocumentTextIcon className="w-7 h-7"/>
                                  </div>
                                  <div>
                                      <p className="text-xl font-bold text-white tracking-tight">Handshake Authentication</p>
                                      <p className="text-[14px] text-white/30 mt-1.5 font-medium leading-relaxed max-w-md italic">
                                          Security clearance requires artifact synchronization for <span className="text-amber-500 font-bold">{stats.pending_applications} active node(s)</span>.
                                      </p>
                                  </div>
                              </div>
                              <div className="p-3 rounded-full bg-white/[0.03] text-white/10 group-hover:text-primary transition-all group-hover:translate-x-1">
                                  <ChevronRightIcon className="w-5 h-5" />
                              </div>
                          </div>
                      </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center text-center p-12 opacity-30 relative z-10">
                          <div className="relative mb-8">
                              <CheckCircleIcon className="w-16 h-16 text-emerald-500/40"/>
                              <div className="absolute inset-0 border border-emerald-500/20 rounded-full animate-ping opacity-20"></div>
                          </div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-white/80">Registry Optimized</p>
                          <p className="text-[15px] mt-4 font-serif italic max-w-sm text-white/40 leading-relaxed">No high-priority synchronization tasks detected in the local queue. Operating at peak efficiency.</p>
                      </div>
                  )}
              </div>
          </motion.div>

          {/* SHORTCUTS (Right Column) */}
           <motion.div 
            variants={{ hidden: { opacity: 0, x: 10 }, visible: { opacity: 1, x: 0 } }}
            className="lg:col-span-4 space-y-6"
           >
                <h3 className="text-[14px] font-bold text-white/40 uppercase tracking-widest px-2">Console Shortcuts</h3>
                <div className="grid grid-cols-1 gap-3">
                    {[
                        { title: "Register Sibling", icon: <PlusIcon className="w-4 h-4" />, id: 'My Children', desc: 'Initialize node' },
                        { title: "Verification Vault", icon: <DocumentTextIcon className="w-4 h-4" />, id: 'Documents', desc: 'Manage assets' },
                        { title: "Broadcast Inbox", icon: <CommunicationIcon className="w-4 h-4" />, id: 'Messages', desc: 'System feed' }
                    ].map(link => (
                        <button 
                            key={link.title} 
                            onClick={() => setActiveComponent?.(link.id)} 
                            className="group w-full flex items-center justify-between p-6 rounded-2xl bg-[#0c0e12] hover:bg-white/[0.01] border border-white/[0.03] hover:border-primary/20 transition-all duration-300 text-left shadow-sm"
                        >
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-white/[0.02] rounded-xl text-white/20 group-hover:text-primary transition-colors border border-white/[0.05]">
                                    {link.icon}
                                </div>
                                <div>
                                    <span className="font-bold text-[14px] text-white/70 group-hover:text-white transition-colors uppercase tracking-widest">{link.title}</span>
                                    <p className="text-[11px] font-medium text-white/10 group-hover:text-white/20 transition-colors mt-0.5">{link.desc}</p>
                                </div>
                            </div>
                            <ChevronRightIcon className="w-4 h-4 text-white/5 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </button>
                    ))}
                </div>
            </motion.div>
       </div>
       
       <motion.div 
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 0.1 } }}
        className="pt-12 border-t border-white/[0.04] flex justify-center"
       >
            <p className="text-[11px] font-black uppercase tracking-[0.6em] text-white">Institutional Operating System • v9.5.1 Deployment</p>
       </motion.div>
    </motion.div>
  );
};

export default OverviewTab;
