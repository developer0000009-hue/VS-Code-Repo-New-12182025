
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

// --- Types & Config ---

const statusConfig: { [key: string]: { text: string; bg: string; border: string; icon: React.ReactNode } } = {
  'Active': { 
      text: 'text-emerald-400', 
      bg: 'bg-emerald-500/10', 
      border: 'border-emerald-500/20',
      icon: <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
  },
  'Expired': { 
      text: 'text-slate-400', 
      bg: 'bg-slate-500/10', 
      border: 'border-slate-500/20',
      icon: <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
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
      icon: <CheckCircleIcon className="w-3 h-3 text-blue-500" />
  },
  // Fallback for unknown statuses
  'default': {
      text: 'text-gray-400',
      bg: 'bg-gray-500/10',
      border: 'border-gray-500/20',
      icon: <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
  }
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ShareCodesTabProps {
    onNavigate?: (tab: string) => void;
}

export default function ShareCodesTab({ onNavigate }: ShareCodesTabProps) {
  // Data State
  const [codes, setCodes] = useState<ShareCode[]>([]);
  const [myApplications, setMyApplications] = useState<AdmissionApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedAdmission, setSelectedAdmission] = useState<string>('');
  const [purpose, setPurpose] = useState('');
  const [codeType, setCodeType] = useState<ShareCodeType>('Enquiry');
  
  // UI State
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
        // Use direct select for share_codes to avoid missing RPC errors
        // get_my_children_profiles is complex so we keep RPC, but verify it exists
        const [appsRes, codesRes] = await Promise.all([
            supabase.rpc('get_my_children_profiles'),
            supabase.from('share_codes').select('*').order('created_at', { ascending: false })
        ]);

        if (appsRes.error) throw appsRes.error;
        if (codesRes.error) throw codesRes.error;

        const apps = appsRes.data || [];
        setMyApplications(apps);
        
        // Auto-select first child if none selected and children exist
        if (apps.length > 0 && !selectedAdmission) {
            setSelectedAdmission(String(apps[0].id));
        }

        // Map share codes, ensure status fallback
        const mappedCodes = (codesRes.data || []).map((c: any) => ({
            ...c,
            // Fallback for applicant_name if not joined (direct select doesn't join)
            // We can match it from apps list manually for display
            applicant_name: c.applicant_name || apps.find((a: any) => a.id === c.admission_id)?.applicant_name || 'Unknown Applicant'
        }));
        
        setCodes(mappedCodes);
    } catch (err: any) {
        console.error("Share code fetch error:", err);
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
    if (!selectedAdmission) {
      alert('Please select a child profile.');
      return;
    }

    if (!UUID_REGEX.test(selectedAdmission)) {
        setError("Identity Mismatch: This profile uses a legacy ID format. Please contact support.");
        return;
    }
    
    setGenerating(true);
    setGeneratedCode(null);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('generate_admission_share_code', {
        p_admission_id: selectedAdmission,
        p_purpose: purpose,
        p_code_type: codeType,
      });

      if (error) {
          if (error.code === '42883' || error.message?.includes('operator does not exist: uuid = bigint')) {
              throw new Error("System Update Required: Please contact support regarding database schema migration.");
          }
          throw error;
      }

      // Handle response variation (object vs string)
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
    if (window.confirm('Are you sure you want to revoke this code? It will no longer be usable.')) {
        const { error } = await supabase.rpc('revoke_my_share_code', { p_code_id: id });
        if (error) {
            alert(`Failed to revoke code: ${formatError(error)}`);
        } else {
            await fetchData();
        }
    }
  };
  
  const handleRegenerate = (code: ShareCode) => {
    if (code.admission_id) {
        setSelectedAdmission(code.admission_id);
    }
    if (code.code_type) {
        setCodeType(code.code_type);
    }
    setPurpose(code.purpose ? `Regenerated: ${code.purpose}` : 'Regenerated Code');
    
    // Smooth scroll to top
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
          <div className="flex flex-col items-center justify-center py-40">
              <Spinner size="lg" className="text-primary" />
              <p className="mt-8 text-[11px] font-black uppercase text-white/20 tracking-[0.4em] animate-pulse">Retrieving Secure Keys</p>
          </div>
      );
  }

  return (
    <div className="access-codes-module space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-8">
            <div className="space-y-1">
                <h2 className="text-3xl font-serif font-bold text-white tracking-tight">Access Codes</h2>
                <p className="text-sm text-white/40 font-medium">Generate and manage time-bound secure keys for school administrators.</p>
            </div>
            <button 
                onClick={() => fetchData()} 
                className="group flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white/60 hover:text-white transition-all border border-white/5 active:scale-95"
            >
                <RefreshIcon className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                <span>Refresh Ledger</span>
            </button>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Generator Form */}
            <div className="xl:col-span-5 space-y-6">
                 <div className="bg-[#0c0d12] p-8 rounded-[2.5rem] shadow-2xl border border-white/5 ring-1 ring-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="flex items-center gap-3 mb-8 relative z-10">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary border border-primary/20 shadow-inner">
                            <KeyIcon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-lg text-white">Generate New Key</h3>
                    </div>

                    <form onSubmit={handleGenerateCode} className="space-y-8 relative z-10">
                        
                        {/* 1. Child Selection (Custom UI to fix visibility bug) */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] ml-1">Select Identity Node</label>
                            {myApplications.length === 0 ? (
                                <div className="p-8 rounded-[2rem] bg-red-500/5 border border-red-500/10 text-center animate-in fade-in">
                                    <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                        <UsersIcon className="w-6 h-6" />
                                    </div>
                                    <p className="text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">No Identity Nodes</p>
                                    <p className="text-[11px] text-white/40 mb-6 px-4 leading-relaxed font-medium">You must enroll a student profile before generating access keys.</p>
                                    {onNavigate && (
                                        <button 
                                            type="button"
                                            onClick={() => onNavigate('My Children')}
                                            className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-red-500/20 transition-all flex items-center gap-2 mx-auto hover:scale-105 active:scale-95 shadow-lg"
                                        >
                                            Enroll Student
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {myApplications.map(app => (
                                        <button
                                            key={app.id}
                                            type="button"
                                            onClick={() => setSelectedAdmission(String(app.id))}
                                            className={`
                                                flex items-center gap-4 p-3 rounded-2xl border transition-all text-left group
                                                ${selectedAdmission === String(app.id) 
                                                    ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/20' 
                                                    : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                                                }
                                            `}
                                        >
                                            <PremiumAvatar name={app.applicant_name} size="sm" className={`w-10 h-10 rounded-xl transition-transform ${selectedAdmission === String(app.id) ? 'scale-110' : 'grayscale group-hover:grayscale-0'}`} />
                                            <div>
                                                <p className={`text-sm font-bold transition-colors ${selectedAdmission === String(app.id) ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>{app.applicant_name}</p>
                                                <p className="text-[10px] text-white/30 font-mono mt-0.5 uppercase tracking-wider">Grade {app.grade}</p>
                                            </div>
                                            {selectedAdmission === String(app.id) && (
                                                <div className="ml-auto p-1 bg-primary text-black rounded-full shadow-lg animate-in zoom-in">
                                                    <CheckCircleIcon className="w-3 h-3" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. Access Type Selection (Card Grid) */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] ml-1">Access Protocol</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    type="button" 
                                    disabled={myApplications.length === 0}
                                    onClick={() => setCodeType('Enquiry')} 
                                    className={`relative p-5 rounded-2xl border transition-all text-left group flex flex-col justify-between h-32 disabled:opacity-50 disabled:cursor-not-allowed ${codeType === 'Enquiry' ? 'bg-blue-500/10 border-blue-500/50 ring-1 ring-blue-500/20' : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'}`}
                                >
                                    <div className={`p-2 rounded-lg w-fit ${codeType === 'Enquiry' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/10 text-white/40'}`}>
                                        <InfoIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className={`block font-bold text-sm ${codeType === 'Enquiry' ? 'text-white' : 'text-white/60'}`}>Enquiry</span>
                                        <span className="block text-[10px] text-white/30 mt-1 leading-tight">Read-only view for initial assessment.</span>
                                    </div>
                                </button>
                                
                                <button 
                                    type="button" 
                                    disabled={myApplications.length === 0}
                                    onClick={() => setCodeType('Admission')} 
                                    className={`relative p-5 rounded-2xl border transition-all text-left group flex flex-col justify-between h-32 disabled:opacity-50 disabled:cursor-not-allowed ${codeType === 'Admission' ? 'bg-purple-500/10 border-purple-500/50 ring-1 ring-purple-500/20' : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'}`}
                                >
                                    <div className={`p-2 rounded-lg w-fit ${codeType === 'Admission' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-white/10 text-white/40'}`}>
                                        <FileTextIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className={`block font-bold text-sm ${codeType === 'Admission' ? 'text-white' : 'text-white/60'}`}>Admission</span>
                                        <span className="block text-[10px] text-white/30 mt-1 leading-tight">Full document access for verification.</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                        
                        {/* 3. Purpose Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] ml-1">Context Note</label>
                            <input 
                                type="text" 
                                disabled={myApplications.length === 0}
                                placeholder="e.g. Principal Meeting, Document Check..." 
                                value={purpose} 
                                onChange={(e) => setPurpose(e.target.value)} 
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                            />
                        </div>

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            disabled={generating || myApplications.length === 0} 
                            className="w-full py-4 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white font-bold text-sm rounded-2xl shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {generating ? <Spinner size="sm" className="text-white" /> : <><ShieldCheckIcon className="w-4 h-4"/> Generate Secure Key</>}
                        </button>
                    </form>
                    
                    {error && !generatedCode && (
                        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center animate-in fade-in slide-in-from-top-2">
                            <p className="text-[10px] font-black uppercase text-red-500 tracking-wider mb-1">Error</p>
                            <p className="text-xs text-red-400 font-medium">{error}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: Output & History */}
            <div className="xl:col-span-7 space-y-8">
                
                {/* 1. Generated Code Hero */}
                {generatedCode && (
                    <div className="animate-in fade-in slide-in-from-top-8 duration-700">
                        <div className="bg-gradient-to-br from-[#13151b] to-black rounded-[3rem] shadow-2xl border border-white/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none opacity-50"></div>
                            
                            <div className="p-10 md:p-12 text-center relative z-10">
                                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/10 border border-emerald-500/20 animate-bounce">
                                    <CheckCircleIcon className="w-10 h-10" />
                                </div>
                                <h3 className="text-3xl md:text-4xl font-serif font-black text-white tracking-tight mb-2">Protocol Active</h3>
                                <p className="text-white/40 text-sm font-medium">Share this key with the school admin.</p>

                                <div 
                                    className="mt-10 mb-8 p-8 bg-black/40 border-2 border-dashed border-white/10 rounded-[2rem] relative group/code cursor-pointer hover:border-white/20 transition-all"
                                    onClick={() => copyToClipboard(generatedCode, 'generated')}
                                >
                                     <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Verification Token</p>
                                     <div className="text-5xl md:text-6xl font-mono font-black text-primary tracking-widest drop-shadow-lg select-all">
                                         {generatedCode}
                                     </div>
                                     <div className={`absolute inset-0 flex items-center justify-center bg-slate-900/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl backdrop-blur-sm`}>
                                         <span className="text-white font-bold text-sm flex items-center gap-2">
                                             {copiedCodeId === 'generated' ? <CheckCircleIcon className="w-5 h-5 text-emerald-500"/> : <CopyIcon className="w-5 h-5"/>}
                                             {copiedCodeId === 'generated' ? 'Copied to Clipboard' : 'Click to Copy'}
                                         </span>
                                     </div>
                                </div>
                                
                                <div className="flex justify-center gap-4">
                                     <button 
                                        type="button" 
                                        onClick={() => copyToClipboard(generatedCode, 'generated_btn')}
                                        className="px-8 py-3 bg-white text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-white/90 transition-all flex items-center gap-2 shadow-lg active:scale-95"
                                    >
                                        {copiedCodeId === 'generated_btn' ? <CheckCircleIcon className="w-4 h-4"/> : <CopyIcon className="w-4 h-4"/>}
                                        {copiedCodeId === 'generated_btn' ? 'Copied' : 'Copy Key'}
                                    </button>
                                </div>
                                <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em] mt-8">Expires in 24 Hours • One-time Use</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. History List */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <h3 className="text-lg font-bold text-white">Active Keys</h3>
                        <div className="h-px bg-white/10 flex-grow"></div>
                        <span className="text-xs font-medium text-white/40">{codes.length} Total</span>
                    </div>
                    
                    {codes.length === 0 ? (
                        <div className="text-center py-20 bg-white/[0.02] rounded-[2.5rem] border border-white/5 flex flex-col items-center">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5">
                                <UsersIcon className="w-8 h-8 text-white/20" />
                            </div>
                            <p className="font-bold text-white/60">No active keys found</p>
                            <p className="text-xs text-white/30 mt-1 max-w-xs leading-relaxed">Generate a code to grant temporary access to your child's records.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {codes.map(code => {
                                // Safety: Fallback for unexpected status strings from DB
                                const status = statusConfig[code.status] || statusConfig['default'];
                                
                                return (
                                <div key={code.id} className="bg-[#13151b] border border-white/5 hover:border-white/10 rounded-3xl p-6 transition-all group hover:shadow-lg relative overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 font-bold border border-white/5">
                                                {code.applicant_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm truncate max-w-[120px]">{code.applicant_name}</p>
                                                <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">{code.code_type}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${status.bg} ${status.text} ${status.border}`}>
                                            {status.icon} {code.status}
                                        </span>
                                    </div>
                                    
                                    <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex justify-between items-center mb-4 group/mini">
                                        <span className={`font-mono font-bold tracking-widest text-lg ${code.status === 'Active' ? 'text-primary' : 'text-white/30 decoration-white/20'}`}>{code.code}</span>
                                        <button 
                                            onClick={() => copyToClipboard(code.code, String(code.id))}
                                            className="p-1.5 hover:bg-white/10 rounded-lg text-white/30 hover:text-white transition-colors"
                                        >
                                            {copiedCodeId === String(code.id) ? <CheckCircleIcon className="w-4 h-4 text-emerald-500"/> : <CopyIcon className="w-4 h-4"/>}
                                        </button>
                                    </div>
                                    
                                    <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-auto">
                                         <div className="flex items-center gap-1.5 text-[10px] font-medium text-white/30">
                                             <ClockIcon className="w-3 h-3"/> Exp: {new Date(code.expires_at).toLocaleDateString()}
                                         </div>
                                         <div className="flex items-center gap-2">
                                             {code.status === 'Active' ? (
                                                 <button 
                                                    onClick={() => handleRevokeCode(code.id)}
                                                    className="flex items-center gap-1.5 text-[10px] font-bold text-red-500/60 hover:text-red-500 transition-colors uppercase tracking-wider"
                                                >
                                                    <TrashIcon className="w-3 h-3"/> Revoke
                                                </button>
                                             ) : (
                                                <button 
                                                    onClick={() => handleRegenerate(code)}
                                                    className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400/60 hover:text-blue-400 transition-colors uppercase tracking-wider"
                                                >
                                                    <RotateCcwIcon className="w-3 h-3"/> Regenerate
                                                </button>
                                             )}
                                         </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}
