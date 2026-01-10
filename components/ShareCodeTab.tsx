import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { ShareCode, ShareCodeStatus, AdmissionApplication, ShareCodeType } from '../types';
import Spinner from './common/Spinner';

// --- Icons (as they are not in separate files) ---
const CopyIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);
const CheckIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);
const ShareIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
);
const RefreshIcon: React.FC<React.SVGProps<SVGSVGElement> & { onClick?: () => void }> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.18-3.185m-3.181 9.348a8.25 8.25 0 00-11.664 0l-3.18 3.185m3.181-9.348l-3.18-3.183a8.25 8.25 0 00-11.664 0l-3.18 3.185" />
    </svg>
);
const statusConfig: { [key in ShareCodeStatus]: { text: string; bg: string; border: string; } } = {
  'Active': { text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800' },
  'Expired': { text: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700' },
  'Revoked': { text: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-900' },
  'Redeemed': { text: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-900' },
};

// Fix: Changed to explicit default export function and corrected relative import paths to resolve "no default export" and path ambiguity errors.
export default function ShareCodesTab() {
  const [codes, setCodes] = useState<ShareCode[]>([]);
  const [myApplications, setMyApplications] = useState<AdmissionApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAdmission, setSelectedAdmission] = useState<string>('');
  const [purpose, setPurpose] = useState('');
  const [codeType, setCodeType] = useState<ShareCodeType>('Enquiry');
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const [appsRes, codesRes] = await Promise.all([
        supabase.rpc('get_my_children_profiles'),
        supabase.rpc('get_my_share_codes')
    ]);

    if (appsRes.error) {
      setError(`Failed to fetch applications: ${appsRes.error.message}`);
    } else {
      setMyApplications(appsRes.data || []);
      if (appsRes.data && appsRes.data.length > 0 && !selectedAdmission) {
        setSelectedAdmission(String(appsRes.data[0].id));
      }
    }

    if (codesRes.error) {
      setError(`Failed to fetch codes: ${codesRes.error.message}`);
    } else {
      setCodes(codesRes.data || []);
    }

    setLoading(false);
  }, [selectedAdmission]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) {
      alert('Please select an application.');
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

      if (error) throw error;

      setGeneratedCode(data);
      setPurpose('');
      await fetchData();

    } catch (err: any) {
      setError(`Failed to generate code: ${err.message}`);
    } finally {
        setGenerating(false);
    }
  };
  
  // FIX: Parameter id should be string to match UUID format in types.ts
  const handleRevokeCode = async (id: string) => {
    if (window.confirm('Are you sure you want to revoke this code?')) {
        const { error } = await supabase.rpc('revoke_my_share_code', { p_code_id: id });
        if (error) {
            alert(`Failed to revoke code: ${error.message}`);
        } else {
            await fetchData();
        }
    }
  };
  
  const handleCopyCode = (code: string) => {
    if (isCopied) return;
    navigator.clipboard.writeText(code).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };
  
  const handleShareCode = (code: string) => {
      if (navigator.share) {
          navigator.share({ title: 'School Share Code', text: `Here is my share code for school verification: ${code}` }).catch(console.error);
      } else {
          handleCopyCode(code);
      }
  };

  const renderHistory = () => {
    if (loading) return <div className="flex justify-center p-8"><Spinner size="lg" /></div>;
    if (error && codes.length === 0) return <p className="text-center text-destructive p-8 bg-destructive/10 rounded-lg">{error}</p>;
    if (codes.length === 0) return (
        <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed border-border flex flex-col items-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="font-medium text-foreground">No codes active</p>
            <p className="text-sm mt-1 max-w-xs">Generate a code to allow the school to access your child's application.</p>
        </div>
    );

    return (
        <div className="space-y-4">
            {codes.map(code => (
                <div key={code.id} className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                            <p className="font-bold text-foreground">{code.applicant_name}</p>
                            <span className="font-mono font-semibold text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20 text-sm mt-1 inline-block">{code.code}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-full border ${statusConfig[code.status].bg} ${statusConfig[code.status].text} ${statusConfig[code.status].border}`}>{code.status}</span>
                            <button 
                                onClick={() => handleRevokeCode(code.id)} 
                                disabled={code.status !== 'Active'} 
                                className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Revoke
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-between items-center text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                         <span className={`px-2.5 py-0.5 inline-flex text-[10px] font-bold rounded uppercase tracking-wide ${code.code_type === 'Enquiry' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-purple-50 text-purple-700 border border-purple-100'}`}>{code.code_type}</span>
                         <span>Expires: {new Date(code.expires_at).toLocaleDateString()}</span>
                    </div>
                </div>
            ))}
        </div>
    );
  };

  return (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Access Codes</h2>
                <p className="text-muted-foreground mt-1">Securely share your child's profile with school administrators.</p>
            </div>
            <button onClick={fetchData} className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-2 bg-background px-4 py-2 rounded-xl border border-border hover:bg-muted transition-all shadow-sm">
                <RefreshIcon className="w-4 h-4" /> Refresh History
            </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-6">
                 <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                    <div className="mb-6"><h3 className="font-bold text-lg text-foreground">Create New Code</h3><p className="text-sm text-muted-foreground">Generate a temporary access key.</p></div>
                    <form onSubmit={handleGenerateCode} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">Select Child Profile</label>
                            <div className="relative">
                                <select value={selectedAdmission} onChange={(e) => setSelectedAdmission(e.target.value)} required className="w-full p-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none text-sm shadow-sm" disabled={myApplications.length === 0}>
                                    {myApplications.length === 0 ? <option disabled>No profiles found</option> : <option value="" disabled>Select Child...</option>}
                                    {myApplications.map(app => <option key={app.id} value={app.id}>{app.applicant_name} (Grade {app.grade})</option>)}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-muted-foreground"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                            </div>
                            {myApplications.length === 0 && !loading && <p className="text-xs text-destructive mt-2 font-medium bg-destructive/10 p-2 rounded-lg">Please add a child in the 'My Children' tab first.</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">Access Type</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button type="button" onClick={() => setCodeType('Enquiry')} className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 group ${codeType === 'Enquiry' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 ring-1 ring-blue-500/30' : 'border-border bg-card hover:border-blue-300/50 hover:bg-blue-50/30'}`}>
                                    <div className={`w-4 h-4 rounded-full border-2 absolute top-4 right-4 flex items-center justify-center ${codeType === 'Enquiry' ? 'border-blue-500' : 'border-muted-foreground/30'}`}>{codeType === 'Enquiry' && <div className="w-2 h-2 bg-blue-500 rounded-full" />}</div>
                                    <span className="block font-bold text-sm mb-1 text-foreground">Enquiry</span><span className="block text-xs text-muted-foreground group-hover:text-foreground/70">For initial questions & desk visits</span>
                                </button>
                                <button type="button" onClick={() => setCodeType('Admission')} className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 group ${codeType === 'Admission' ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/20 ring-1 ring-purple-500/30' : 'border-border bg-card hover:border-purple-300/50 hover:bg-blue-50/30'}`}>
                                    <div className={`w-4 h-4 rounded-full border-2 absolute top-4 right-4 flex items-center justify-center ${codeType === 'Admission' ? 'border-purple-500' : 'border-muted-foreground/30'}`}>{codeType === 'Admission' && <div className="w-2 h-2 bg-purple-500 rounded-full" />}</div>
                                    <span className="block font-bold text-sm mb-1 text-foreground">Admission</span><span className="block text-xs text-muted-foreground group-hover:text-foreground/70">Share full documents for review</span>
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">Note <span className="font-normal text-muted-foreground">(Optional)</span></label>
                            <input type="text" placeholder="e.g. For Principal meeting" value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full p-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm shadow-sm" />
                        </div>

                        <button type="submit" disabled={generating || myApplications.length === 0} className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all transform active:scale-[0.98] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none">
                            {generating ? <Spinner size="sm" className="text-primary-foreground" /> : 'Generate Secure Code'}
                        </button>
                    </form>
                    {error && !generatedCode && (<div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-center animate-in fade-in zoom-in-95"><p className="text-sm text-destructive font-semibold">Error</p><p className="text-xs text-destructive/90 mt-1">{error.replace('Failed to generate code:', '')}</p></div>)}
                </div>
            </div>

            <div className="lg:col-span-7 space-y-8">
                {generatedCode && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="bg-slate-900 text-white rounded-3xl shadow-2xl overflow-hidden border border-slate-800 relative max-w-md mx-auto lg:mx-0 lg:max-w-full">
                            <div className="p-8 pb-6 text-center relative z-10 bg-gradient-to-b from-slate-800 to-slate-900">
                                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20 animate-bounce"><CheckIcon className="w-8 h-8 text-white" /></div>
                                <h3 className="text-2xl font-bold mb-1 text-white tracking-tight">Code Generated!</h3><p className="text-slate-400 text-sm font-medium">Share this with the school admin.</p>
                            </div>
                            <div className="relative flex items-center justify-between px-6 bg-slate-900"><div className="w-6 h-6 bg-background rounded-full -ml-9"></div><div className="flex-1 border-b-2 border-dashed border-slate-700 mx-2 opacity-50"></div><div className="w-6 h-6 bg-background rounded-full -mr-9"></div></div>
                            <div className="p-8 pt-6 relative z-10 bg-slate-900">
                                <div className="border-2 border-dashed border-slate-700 bg-slate-800/50 rounded-2xl p-8 text-center mb-8 relative group cursor-pointer transition-colors hover:border-slate-600 hover:bg-slate-800" onClick={() => handleCopyCode(generatedCode)}>
                                     <p className="text-xs text-slate-500 uppercase tracking-[0.2em] font-bold mb-3">Verification Code</p>
                                     <div className="text-5xl sm:text-6xl font-mono font-bold text-blue-400 tracking-widest select-all drop-shadow-lg">{generatedCode}</div>
                                     <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl backdrop-blur-sm"><span className="text-white font-bold text-sm flex items-center gap-2"><CopyIcon className="w-5 h-5"/> Click to Copy</span></div>
                                </div>
                                <div className="flex gap-4">
                                     <button type="button" onClick={() => handleCopyCode(generatedCode)} className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${isCopied ? 'bg-emerald-600 text-white cursor-default ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-900' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30 hover:-translate-y-0.5'}`} disabled={isCopied}>
                                        {isCopied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}{isCopied ? 'Copied to Clipboard' : 'Copy Code'}
                                    </button>
                                    <button type="button" onClick={() => handleShareCode(generatedCode)} className="flex-1 py-3.5 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-600"><ShareIcon className="w-5 h-5" /> Share</button>
                                </div>
                                <p className="text-[10px] text-slate-500 text-center mt-6 uppercase tracking-wider font-medium">Valid for 24 hours • One-time use</p>
                            </div>
                        </div>
                    </div>
                )}
                <div>
                    <div className="flex items-center gap-2 mb-4"><h3 className="font-bold text-lg text-foreground">History</h3>{codes.length > 0 && <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border">{codes.length}</span>}</div>
                    {renderHistory()}
                </div>
            </div>
        </div>
    );
}
