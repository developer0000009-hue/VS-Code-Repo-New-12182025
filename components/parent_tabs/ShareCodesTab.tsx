
import React, { useState, useEffect, useCallback } from 'react';
import { supabase, formatError } from '../../services/supabase';
import { ShareCode, ShareCodeStatus, AdmissionApplication, ShareCodeType } from '../../types';
import Spinner from '../common/Spinner';
import PremiumAvatar from '../common/PremiumAvatar';
import { CopyIcon } from '../icons/CopyIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { RefreshIcon } from '../icons/RefreshIcon';
import { KeyIcon } from '../icons/KeyIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { FileTextIcon } from '../icons/FileTextIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { InfoIcon } from '../icons/InfoIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { RotateCcwIcon } from '../icons/RotateCcwIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { motion, AnimatePresence } from 'framer-motion';

const statusConfig: { [key: string]: { text: string; bg: string; border: string; icon: React.ReactNode } } = {
  'Active': { 
      text: 'text-emerald-400', 
      bg: 'bg-emerald-500/10', 
      border: 'border-emerald-500/20',
      icon: <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
  },
  'Expired': { 
      text: 'text-white/20', 
      bg: 'bg-white/5', 
      border: 'border-white/10',
      icon: <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
  },
  'Revoked': { 
      text: 'text-red-400', 
      bg: 'bg-red-500/10', 
      border: 'border-red-500/20',
      icon: <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
  },
  'Redeemed': { 
      text: 'text-blue-400', 
      bg: 'bg-blue-500/10', 
      border: 'border-blue-500/20',
      icon: <CheckCircleIcon className="w-3.5 h-3.5 text-blue-500" />
  }
};

interface ShareCodesTabProps {
    onNavigate?: (tab: string) => void;
}

export default function ShareCodesTab({ onNavigate }: ShareCodesTabProps) {
  const [codes, setCodes] = useState<ShareCode[]>([]);
  const [myApplications, setMyApplications] = useState<AdmissionApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAdmission, setSelectedAdmission] = useState<string>('');
  const [purpose, setPurpose] = useState('');
  const [codeType, setCodeType] = useState<ShareCodeType>('Enquiry');
  
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
        const [appsRes, codesRes] = await Promise.all([
            supabase.rpc('get_my_children_profiles'),
            supabase.from('share_codes').select('*').order('created_at', { ascending: false })
        ]);

        if (appsRes.error) throw appsRes.error;
        if (codesRes.error) throw codesRes.error;

        const apps = appsRes.data || [];
        setMyApplications(apps);
        
        if (apps.length > 0 && !selectedAdmission) {
            setSelectedAdmission(String(apps[0].id));
        }

        const mappedCodes = (codesRes.data || []).map((c: any) => ({
            ...c,
            applicant_name: c.applicant_name || apps.find((a: any) => a.id === c.admission_id)?.applicant_name || 'Unknown Applicant'
        }));
        
        setCodes(mappedCodes);
    } catch (err: any) {
        setError(formatError(err));
    } finally {
        setLoading(false);
    }
  }, [selectedAdmission]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;
    
    setGenerating(true);
    setGeneratedCode(null);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('generate_admission_share_code', {
        p_admission_id: selectedAdmission,
        p_purpose: purpose,
        p_code_type: codeType,
      });

      if (error) throw error;

      // Robust extraction of code value
      const codeValue = typeof data === 'string' ? data : (data?.code || data?.p_code);
      setGeneratedCode(codeValue);
      setPurpose('');
      await fetchData();
    } catch (err: any) {
      setError(formatError(err));
    } finally {
        setGenerating(false);
    }
  };
  
  const handleRevokeCode = async (id: number) => {
    if (window.confirm('Terminate this protocol key? Access will be immediately revoked.')) {
        const { error } = await supabase.rpc('revoke_my_share_code', { p_code_id: id });
        if (error) alert(`Protocol failure: ${formatError(error)}`);
        else await fetchData();
    }
  };
  
  const handleRegenerate = (code: ShareCode) => {
    setSelectedAdmission(code.admission_id);
    setCodeType(code.code_type);
    setPurpose(code.purpose ? `Refreshed: ${code.purpose}` : 'Refreshed Protocol');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setGeneratedCode(null);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  if (loading && myApplications.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center py-48">
              <Spinner size="lg" className="text-primary" />
              <p className="mt-8 text-[11px] font-black uppercase text-white/10 tracking-[0.6em] animate-pulse">Initializing Security Matrix</p>
          </div>
      );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-40 max-w-[1600px] mx-auto">
        
        {/* Module Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
            <div className="space-y-4 max-w-3xl">
                <div className="flex items-center gap-4 mb-2">
                    <div className="h-[1px] w-12 bg-primary/40 rounded-full" />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/80">Registry Control Center</span>
                </div>
                <h2 className="text-5xl md:text-6xl font-serif font-black text-white tracking-tighter uppercase leading-none">
                    Access <span className="text-white/20 italic">Protocols.</span>
                </h2>
                <p className="text-lg md:text-xl text-white/40 font-medium font-serif italic border-l-2 border-white/5 pl-8 max-w-xl leading-relaxed">
                    Generate and manage encrypted ephemeral keys for institutional identity verification handshakes.
                </p>
            </div>
            <button 
                onClick={() => fetchData()} 
                className="group flex items-center gap-3 px-8 py-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl text-[10px] font-black uppercase text-white/40 hover:text-white transition-all border border-white/5 active:scale-95 tracking-widest shadow-2xl backdrop-blur-md"
            >
                <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
                <span>Sync Security Vault</span>
            </button>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
            
            {/* --- PRIMARY ACTION: KEY GENERATOR --- */}
            <div className="xl:col-span-5 space-y-8">
                 <div className="bg-[#0c0d12]/60 backdrop-blur-3xl p-8 md:p-12 rounded-[3.5rem] shadow-[0_48px_96px_-24px_rgba(0,0,0,1)] border border-white/5 relative overflow-hidden ring-1 ring-white/5 group">
                    <div className="absolute top-0 right-0 p-24 bg-primary/5 rounded-full blur-[120px] pointer-events-none group-hover:bg-primary/10 transition-colors duration-1000" />
                    
                    <div className="flex items-center justify-between mb-16 relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-inner ring-8 ring-primary/5">
                                <KeyIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-2xl text-white tracking-tight font-serif uppercase">Provision Key</h3>
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">Identity Authorization Node</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleGenerateCode} className="space-y-12 relative z-10">
                        
                        {/* Step 1: Select Identity Node */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.4em]">1. Select Target Node</label>
                                {myApplications.length > 0 && <span className="text-[9px] font-bold text-emerald-500/60 uppercase">{myApplications.length} Nodes Active</span>}
                            </div>
                            
                            {myApplications.length === 0 ? (
                                <div className="p-10 rounded-[2.5rem] bg-red-500/[0.02] border-2 border-dashed border-red-500/10 text-center animate-in fade-in">
                                    <AlertTriangleIcon className="w-12 h-12 text-red-500/30 mx-auto mb-6" />
                                    <p className="text-sm font-bold text-red-400 uppercase tracking-widest mb-2">Registry Silent</p>
                                    <p className="text-xs text-white/30 mb-8 leading-relaxed font-medium font-serif italic">Complete a child registration in 'Children' to activate protocol keys.</p>
                                    <button 
                                        type="button"
                                        onClick={() => onNavigate?.('My Children')}
                                        className="px-10 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-red-500/20 transition-all hover:scale-105"
                                    >
                                        Enroll Node
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
                                    {myApplications.map(app => (
                                        <button
                                            key={app.id}
                                            type="button"
                                            onClick={() => setSelectedAdmission(String(app.id))}
                                            className={`
                                                flex items-center gap-6 p-6 rounded-[2rem] border transition-all duration-500 text-left group relative overflow-hidden
                                                ${selectedAdmission === String(app.id) 
                                                    ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/20 shadow-2xl z-10' 
                                                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                                                }
                                            `}
                                        >
                                            <PremiumAvatar name={app.applicant_name} size="xs" className={`w-12 h-12 rounded-2xl transition-all duration-700 ${selectedAdmission === String(app.id) ? 'scale-110 shadow-[0_0_20px_rgba(var(--primary),0.3)]' : 'grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100'}`} />
                                            <div className="flex-grow min-w-0">
                                                <p className={`text-[15px] font-bold truncate transition-colors ${selectedAdmission === String(app.id) ? 'text-white' : 'text-white/40 group-hover:text-white'}`}>{app.applicant_name}</p>
                                                <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em] mt-1">Grade {app.grade} Block</p>
                                            </div>
                                            {selectedAdmission === String(app.id) && (
                                                <CheckCircleIcon className="w-6 h-6 text-primary animate-in zoom-in-50" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Step 2: Access Protocol Type */}
                        <div className="space-y-6">
                            <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.4em] ml-1">2. Access Protocol</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <button 
                                    type="button" 
                                    disabled={myApplications.length === 0}
                                    onClick={() => setCodeType('Enquiry')} 
                                    className={`relative p-7 rounded-[2.5rem] border transition-all duration-500 text-left group flex flex-col justify-between h-48 disabled:opacity-30 ${codeType === 'Enquiry' ? 'bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/20 shadow-2xl' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'}`}
                                >
                                    <div className={`p-4 rounded-2xl w-fit transition-all duration-500 ${codeType === 'Enquiry' ? 'bg-blue-500 text-white shadow-[0_0_30px_rgba(59,130,246,0.4)]' : 'bg-white/5 text-white/20'}`}>
                                        <InfoIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <span className={`block font-black text-xs uppercase tracking-[0.3em] ${codeType === 'Enquiry' ? 'text-white' : 'text-white/30'}`}>Enquiry</span>
                                        <span className="block text-[11px] text-white/20 mt-3 font-medium leading-relaxed font-serif italic">Restricted profile handshake.</span>
                                    </div>
                                </button>
                                
                                <button 
                                    type="button" 
                                    disabled={myApplications.length === 0}
                                    onClick={() => setCodeType('Admission')} 
                                    className={`relative p-7 rounded-[2.5rem] border transition-all duration-500 text-left group flex flex-col justify-between h-48 disabled:opacity-30 ${codeType === 'Admission' ? 'bg-purple-500/10 border-purple-500/40 ring-1 ring-purple-500/20 shadow-2xl' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'}`}
                                >
                                    <div className={`p-4 rounded-2xl w-fit transition-all duration-500 ${codeType === 'Admission' ? 'bg-purple-500 text-white shadow-[0_0_30px_rgba(168,85,247,0.4)]' : 'bg-white/5 text-white/20'}`}>
                                        <FileTextIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <span className={`block font-black text-xs uppercase tracking-[0.3em] ${codeType === 'Admission' ? 'text-white' : 'text-white/30'}`}>Admission</span>
                                        <span className="block text-[11px] text-white/20 mt-3 font-medium leading-relaxed font-serif italic">Full artifact vault clearance.</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                        
                        {/* Step 3: Payload Context */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.4em] ml-1">3. Payload Context</label>
                            <input 
                                type="text" 
                                disabled={myApplications.length === 0}
                                placeholder="Purpose of access (e.g. Principal Meeting)..." 
                                value={purpose} 
                                onChange={(e) => setPurpose(e.target.value)} 
                                className="w-full p-6 bg-black/40 border border-white/5 rounded-3xl text-[15px] font-medium text-white placeholder:text-white/5 focus:bg-black/60 focus:border-primary/50 outline-none transition-all shadow-inner font-serif italic" 
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={generating || myApplications.length === 0} 
                            className="w-full py-7 bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-[0.5em] rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(var(--primary),0.3)] transition-all transform active:scale-[0.98] flex items-center justify-center gap-5 disabled:opacity-30 ring-8 ring-primary/5 group"
                        >
                            {generating ? <Spinner size="sm" className="text-white" /> : <><ShieldCheckIcon className="w-6 h-6 group-hover:rotate-12 transition-transform duration-500" /> Authorize & Seal</>}
                        </button>
                    </form>
                    
                    {error && !generatedCode && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10 p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center gap-5">
                            <AlertTriangleIcon className="w-6 h-6 text-red-500/60" />
                            <p className="text-xs font-bold text-red-400 uppercase tracking-widest leading-relaxed">{error}</p>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* --- RIGHT PANEL: OUTPUT & ARCHIVE --- */}
            <div className="xl:col-span-7 space-y-12">
                
                {/* Generated Key Visualizer */}
                <AnimatePresence mode="wait">
                    {generatedCode && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="bg-[#0c0d12] rounded-[4rem] shadow-[0_64px_128px_-24px_rgba(0,0,0,1)] border border-white/10 relative overflow-hidden group ring-1 ring-white/10"
                        >
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />
                            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
                            
                            <div className="p-16 md:p-24 text-center relative z-10">
                                <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-12 shadow-[0_0_50px_rgba(16,185,129,0.2)] border border-emerald-500/20">
                                    <CheckCircleIcon className="w-12 h-12" />
                                </div>
                                <h3 className="text-4xl md:text-5xl font-serif font-black text-white tracking-tighter uppercase leading-none mb-6">Protocol <span className="text-white/20 italic">Activated.</span></h3>
                                <p className="text-white/40 text-lg font-serif italic max-w-sm mx-auto mb-16 leading-relaxed">Identity node provisioned. Dispatch this secure cipher to the authorized administrator for handshake.</p>

                                <div 
                                    className="p-12 bg-black/60 border-2 border-dashed border-white/10 rounded-[3rem] relative group/code cursor-pointer hover:border-primary/40 hover:bg-black transition-all duration-700 shadow-2xl mb-16"
                                    onClick={() => copyToClipboard(generatedCode, 'generated')}
                                >
                                     <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.7em] mb-10 select-none">Verification Cipher</p>
                                     <div className="text-5xl md:text-7xl lg:text-8xl font-mono font-black text-primary tracking-[0.5em] drop-shadow-[0_0_40px_rgba(var(--primary),0.4)] select-all uppercase">
                                         {generatedCode}
                                     </div>
                                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0c0d12]/95 opacity-0 group-hover/code:opacity-100 transition-opacity duration-500 rounded-[3rem] backdrop-blur-2xl">
                                         <div className="p-6 bg-primary/10 rounded-full mb-6 ring-8 ring-primary/5 shadow-inner"><CopyIcon className="w-10 h-10 text-primary"/></div>
                                         <span className="text-white font-black text-sm uppercase tracking-[0.5em]">Sync to Clipboard</span>
                                     </div>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-12 text-[11px] text-white/10 font-black uppercase tracking-[0.6em] border-t border-white/[0.04] pt-16">
                                    <span className="flex items-center gap-4"><ClockIcon className="w-5 h-5 opacity-40"/> 24h Lifetime</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/5 hidden sm:block" />
                                    <span className="flex items-center gap-4"><ShieldCheckIcon className="w-5 h-5 opacity-40"/> Secured Stream</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Registry Ledger Archive */}
                <div className="space-y-10">
                    <div className="flex items-center gap-8 px-8">
                        <h3 className="text-xs font-black uppercase text-white/30 tracking-[0.5em] whitespace-nowrap">Registry Ledger</h3>
                        <div className="h-[1px] bg-white/[0.05] flex-grow" />
                        <span className="text-[11px] font-black text-white/10 uppercase tracking-[0.4em]">{codes.length} Registered Keys</span>
                    </div>
                    
                    {codes.length === 0 ? (
                        <div className="text-center py-40 bg-white/[0.01] rounded-[4rem] border-2 border-dashed border-white/5 flex flex-col items-center animate-in fade-in duration-1000">
                            <div className="w-32 h-32 bg-white/[0.02] rounded-[3rem] flex items-center justify-center mb-10 border border-white/5 shadow-inner">
                                <KeyIcon className="w-12 h-12 text-white/5" />
                            </div>
                            <p className="font-black text-white/20 text-sm tracking-[0.5em] uppercase mb-4">Protocol Idle</p>
                            <p className="text-lg text-white/10 font-serif italic max-w-sm leading-relaxed">No ephemeral access nodes currently active in the institutional matrix.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {codes.map((code, idx) => {
                                const status = statusConfig[code.status] || statusConfig['Active'];
                                return (
                                <motion.div 
                                    key={code.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-[#111319]/40 backdrop-blur-xl border border-white/5 hover:border-primary/30 rounded-[3rem] p-8 transition-all duration-700 group relative overflow-hidden flex flex-col shadow-2xl"
                                >
                                    <div className="flex justify-between items-start mb-10 relative z-10">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 font-black border border-white/5 shadow-inner group-hover:text-primary transition-all duration-700 font-serif text-xl">
                                                {code.applicant_name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-white text-base truncate uppercase tracking-tight leading-none mb-2">{code.applicant_name}</p>
                                                <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">{code.code_type} Node</p>
                                            </div>
                                        </div>
                                        <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border flex items-center gap-3 backdrop-blur-md shadow-sm ${status.bg} ${status.text} ${status.border}`}>
                                            {status.icon} {code.status}
                                        </span>
                                    </div>
                                    
                                    <div className="bg-black/60 p-6 rounded-[1.8rem] border border-white/5 flex justify-between items-center mb-10 shadow-inner group/id transition-all hover:border-white/10">
                                        <span className={`font-mono font-black tracking-[0.4em] text-xl uppercase transition-colors duration-700 ${code.status === 'Active' ? 'text-primary' : 'text-white/10'}`}>{code.code}</span>
                                        <button 
                                            onClick={() => copyToClipboard(code.code, String(code.id))}
                                            className="p-3 hover:bg-white/5 rounded-xl text-white/20 hover:text-white transition-all active:scale-90"
                                            title="Copy Cipher"
                                        >
                                            {copiedCodeId === String(code.id) ? <CheckCircleIcon className="w-5 h-5 text-emerald-500 animate-in zoom-in-50"/> : <CopyIcon className="w-5 h-5"/>}
                                        </button>
                                    </div>
                                    
                                    <div className="flex justify-between items-center pt-6 border-t border-white/[0.04] mt-auto relative z-10">
                                         <div className="flex items-center gap-3 text-[10px] font-black text-white/20 uppercase tracking-widest">
                                             <ClockIcon className="w-4 h-4 opacity-40"/> 
                                             <span className="opacity-80">Exp: {new Date(code.expires_at).toLocaleDateString()}</span>
                                         </div>
                                         <div className="flex items-center gap-3">
                                             {code.status === 'Active' ? (
                                                 <button 
                                                    onClick={() => handleRevokeCode(code.id)}
                                                    className="flex items-center gap-2.5 text-[10px] font-black text-red-500/40 hover:text-red-500 transition-all uppercase tracking-widest bg-red-500/5 hover:bg-red-500/10 px-5 py-2.5 rounded-xl border border-red-500/10"
                                                >
                                                    <TrashIcon className="w-4 h-4"/> Terminate
                                                </button>
                                             ) : (
                                                <button 
                                                    onClick={() => handleRegenerate(code)}
                                                    className="flex items-center gap-2.5 text-[10px] font-black text-primary/40 hover:text-primary transition-all uppercase tracking-widest bg-primary/5 hover:bg-primary/10 px-5 py-2.5 rounded-xl border border-primary/10"
                                                >
                                                    <RotateCcwIcon className="w-4 h-4"/> Refresh
                                                </button>
                                             )}
                                         </div>
                                    </div>
                                </motion.div>
                            )})}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}
