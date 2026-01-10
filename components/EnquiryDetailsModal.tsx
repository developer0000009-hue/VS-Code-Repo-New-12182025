import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, formatError } from '../services/supabase';
import { EnquiryService } from '../services/enquiry';
import { Enquiry, TimelineItem, EnquiryStatus } from '../types';
import Spinner from './common/Spinner';
import { XIcon } from './icons/XIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { GraduationCapIcon } from './icons/GraduationCapIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CommunicationIcon } from './icons/CommunicationIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { UsersIcon } from './icons/UsersIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { SearchIcon } from './icons/SearchIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { GoogleGenAI } from '@google/genai';

const LocalSendIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

const STATUS_CONFIG: Record<string, { icon: React.ReactNode, label: string, color: string, ring: string, bg: string }> = {
    'ENQUIRY_ACTIVE': { icon: <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"/>, label: 'Active', color: 'text-blue-700', ring: 'ring-blue-600', bg: 'bg-blue-50' },
    'ENQUIRY_VERIFIED': { icon: <ShieldCheckIcon className="w-4 h-4"/>, label: 'Verified', color: 'text-teal-700', ring: 'ring-teal-500', bg: 'bg-teal-50' },
    'ENQUIRY_IN_PROGRESS': { icon: <div className="w-2 h-2 rounded-full bg-purple-600"/>, label: 'In Progress', color: 'text-purple-700', ring: 'ring-purple-500', bg: 'bg-purple-50' },
    'CONVERTED': { icon: <CheckCircleIcon className="w-4 h-4"/>, label: 'Converted', color: 'text-emerald-700', ring: 'ring-emerald-500', bg: 'bg-emerald-50' },
};

const ORDERED_STATUSES: EnquiryStatus[] = ['ENQUIRY_ACTIVE', 'ENQUIRY_VERIFIED', 'ENQUIRY_IN_PROGRESS', 'CONVERTED'];

const TimelineEntry: React.FC<{ item: TimelineItem }> = ({ item }) => {
    if (item.item_type === 'MESSAGE') {
        const isParent = !item.is_admin;
        return (
             <div className={`flex items-end gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full ${isParent ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end gap-5 max-w-[85%] sm:max-w-[75%] ${isParent ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-11 h-11 rounded-[1.1rem] flex items-center justify-center font-black text-sm shadow-2xl text-white flex-shrink-0 border border-white/5 ${isParent ? 'bg-indigo-600' : 'bg-[#252833]'}`}>
                        {item.created_by_name.charAt(0)}
                    </div>
                    <div className={`p-6 md:p-8 rounded-[2.5rem] shadow-2xl ring-1 ring-white/5 overflow-hidden relative ${isParent ? 'bg-[#1a1d23] rounded-br-none' : 'bg-[#221f30] rounded-bl-none text-white/90'}`}>
                         <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                         <p className="text-[15px] md:text-[17px] leading-relaxed relative z-10 whitespace-pre-wrap font-medium">{item.details.message}</p>
                         <div className={`flex items-center gap-3 mt-6 relative z-10 opacity-30 ${isParent ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[9px] font-black uppercase tracking-widest">{item.created_by_name}</span>
                            <span className="w-1 h-1 rounded-full bg-white"></span>
                            <span className="text-[9px] font-mono">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex justify-center my-10 animate-in fade-in zoom-in-95 duration-1000">
            <div className="flex items-center gap-4 px-6 py-2.5 rounded-full bg-white/[0.02] border border-white/5 shadow-inner backdrop-blur-sm">
                <div className="w-1 h-1 rounded-full bg-primary/40 animate-pulse"></div>
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">
                    {item.item_type.replace(/_/g, ' ')} / {new Date(item.created_at).toLocaleTimeString()}
                </span>
                <div className="w-1 h-1 rounded-full bg-primary/40 animate-pulse"></div>
            </div>
        </div>
    );
};

interface EnquiryDetailsModalProps {
    enquiry: Enquiry;
    onClose: () => void;
    onUpdate: () => void;
    currentBranchId?: string | null; 
    onNavigate?: (component: string) => void;
}

const EnquiryDetailsModal: React.FC<EnquiryDetailsModalProps> = ({ enquiry, onClose, onUpdate, onNavigate }) => {
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [formData, setFormData] = useState({
        status: enquiry.status,
        notes: enquiry.notes || '',
        applicant_name: enquiry.applicant_name || '',
    });
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState({ timeline: true, saving: false, converting: false, ai: false });
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const commsEndRef = useRef<HTMLDivElement>(null);

    const fetchTimeline = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(prev => ({ ...prev, timeline: true }));
        try {
            const { data, error } = await supabase.rpc('get_enquiry_timeline', { p_enquiry_id: String(enquiry.id) });
            if (error) throw error;
            setTimeline(data || []);
        } catch (e) {
            console.error("Timeline Sync Error:", formatError(e));
        } finally {
            if (!isSilent) setLoading(prev => ({ ...prev, timeline: false }));
        }
    }, [enquiry.id]);

    useEffect(() => { 
        fetchTimeline(); 
    }, [fetchTimeline]);

    useEffect(() => {
        if (commsEndRef.current) {
            commsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [timeline]);

    const handleAIGenerateSummary = async () => {
        if (!process.env.API_KEY) {
            alert("Security Protocol Violation: AI Intelligence Key is not provisioned.");
            return;
        }

        setLoading(prev => ({ ...prev, ai: true }));
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const conversationText = timeline
                .filter(t => t.item_type === 'MESSAGE')
                .map(t => `${t.is_admin ? 'Admin' : 'Parent'}: ${t.details.message}`)
                .join('\n');
                
            const prompt = `Summarize the following school admission enquiry conversation for ${enquiry.applicant_name} (Grade ${enquiry.grade}). Provide a concise analysis of the parent's primary concerns and the current status of the handshake. Tone: Executive and Brief.\n\nConversation:\n${conversationText}`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: { parts: [{ text: prompt }] }
            });
            
            setAiSummary(response.text || "Summary unavailable.");
        } catch (err: any) {
            const formatted = formatError(err);
            console.error("AI Context Failure:", formatted);
            if (formatted.toLowerCase().includes("abort")) {
                alert("The AI request was interrupted. This usually happens if you navigate away or the connection is unstable. Please retry.");
            } else {
                alert(`AI Synthesis Failed: ${formatted}`);
            }
        } finally {
            setLoading(prev => ({ ...prev, ai: false }));
        }
    };

    const handleSaveStatus = async (newStatus: EnquiryStatus) => {
        setLoading(prev => ({ ...prev, saving: true }));
        try {
            const { error } = await supabase
                .from('enquiries')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', enquiry.id);
            
            if (error) throw error;
            setFormData(prev => ({ ...prev, status: newStatus }));
            onUpdate();
            await fetchTimeline(true);
        } catch (err) {
            alert(`Save failed: ${formatError(err)}`);
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const handleConvert = async () => {
        setLoading(prev => ({ ...prev, converting: true }));
        try {
            const result = await EnquiryService.convertToAdmission(enquiry.id);
            if (result.success) {
                onUpdate();
                onClose();
                onNavigate?.('Admissions');
            }
        } catch (err: any) {
            alert(formatError(err));
        } finally {
            setLoading(prev => ({ ...prev, converting: false }));
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const msg = newMessage.trim();
        if (!msg) return;
        
        try {
            const { error } = await supabase.rpc('send_enquiry_message', { 
                p_enquiry_id: String(enquiry.id), 
                p_message: msg 
            });
            if (error) throw error;
            setNewMessage('');
            await fetchTimeline(true);
        } catch (err) {
            alert("Transmit Failure: " + formatError(err));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl flex items-center justify-center z-[150] p-0 sm:p-4 md:p-6" onClick={onClose}>
            <div className="bg-[#09090b] rounded-t-[3.5rem] sm:rounded-[4.5rem] shadow-[0_64px_128px_-32px_rgba(0,0,0,1)] w-full max-w-[1700px] h-full sm:h-[94vh] flex flex-col border border-white/5 overflow-hidden ring-1 ring-white/10 animate-in zoom-in-95 duration-500" onClick={e => e.stopPropagation()}>
                
                <header className="px-10 md:px-16 py-10 border-b border-white/5 bg-[#0f1115]/95 backdrop-blur-2xl flex flex-wrap justify-between items-center z-40 relative shadow-2xl">
                    <div className="flex items-center gap-10">
                        <div className="relative group shrink-0">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl opacity-40 group-hover:opacity-100 transition-opacity duration-1000"></div>
                            <div className="w-20 h-20 bg-indigo-600 rounded-[2.2rem] text-white flex items-center justify-center shadow-2xl border border-white/10 relative z-10 transform group-hover:rotate-6 transition-transform duration-700">
                                <ClipboardListIcon className="w-10 h-10" />
                            </div>
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-6 mb-3">
                                <h2 className="text-4xl md:text-6xl font-serif font-black text-white tracking-tighter uppercase leading-none drop-shadow-2xl">{enquiry.applicant_name}</h2>
                                <span className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] shadow-inner backdrop-blur-md">Node 0x{String(enquiry.id).substring(0,6).toUpperCase()}</span>
                            </div>
                            <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] flex items-center gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                Domain Sync Active • Grade {enquiry.grade} Context
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 rounded-[1.5rem] bg-white/5 text-white/20 hover:text-white hover:bg-white/10 transition-all transform active:scale-90 border border-white/5"><XIcon className="w-8 h-8"/></button>
                </header>
                
                <div className="flex-grow flex flex-col lg:flex-row overflow-hidden relative">
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-0" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)`, backgroundSize: '40px 40px' }}></div>

                    <div className="flex-1 flex flex-col bg-transparent relative z-10">
                        <div className="flex-grow overflow-y-auto p-10 md:p-20 space-y-16 custom-scrollbar flex flex-col scroll-smooth">
                            {loading.timeline && timeline.length === 0 ? (
                                <div className="m-auto flex flex-col items-center gap-6">
                                    <Spinner size="lg" className="text-primary" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 animate-pulse">Recalling Conversation Ledger</p>
                                </div>
                            ) : (
                                <>
                                    {timeline.length === 0 && (
                                        <div className="m-auto flex flex-col items-center text-center opacity-10 space-y-10">
                                            <CommunicationIcon className="w-48 h-48" />
                                            <p className="text-4xl font-serif italic text-white max-w-lg leading-relaxed">No encrypted messages exchanged on this channel.</p>
                                        </div>
                                    )}
                                    <div className="space-y-16">
                                        {timeline.map((item, idx) => <TimelineEntry key={idx} item={item} />)}
                                        <div ref={commsEndRef} className="h-4" />
                                    </div>
                                </>
                            )}
                        </div>
                        
                        <div className="p-10 md:p-14 border-t border-white/5 bg-[#0a0a0c]/98 backdrop-blur-3xl">
                            <form onSubmit={handleSendMessage} className="flex gap-8 items-end max-w-5xl mx-auto group">
                                <div className="flex-grow relative">
                                    <textarea 
                                        value={newMessage} 
                                        onChange={(e) => setNewMessage(e.target.value)} 
                                        placeholder="TYPE PAYLOAD TO PARENT NODE..." 
                                        className="w-full p-8 md:p-10 rounded-[3.5rem] bg-white/[0.02] border border-white/10 text-white placeholder:text-white/5 outline-none resize-none font-serif text-xl md:text-2xl shadow-inner focus:bg-white/[0.04] focus:border-primary/40 transition-all duration-500 custom-scrollbar"
                                        rows={1}
                                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e as any); } }}
                                    />
                                    <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 pointer-events-none">
                                        <span className="text-[9px] font-black text-primary/40 uppercase tracking-[0.4em]">Secure Uplink Terminal</span>
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={!newMessage.trim()}
                                    className="w-24 h-24 md:w-32 md:h-32 bg-primary text-white rounded-[3rem] md:rounded-[4rem] flex items-center justify-center shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] transform active:scale-90 transition-all duration-500 disabled:opacity-5 disabled:grayscale"
                                >
                                    <LocalSendIcon className="w-10 h-10 md:w-14 md:h-14" />
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="w-full lg:w-[480px] bg-[#0c0d12]/90 backdrop-blur-3xl border-l border-white/10 p-12 md:p-16 space-y-16 overflow-y-auto custom-scrollbar relative z-20">
                        <section className="space-y-10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[11px] font-black uppercase text-white/30 tracking-[0.5em]">Lifecycle Management</h3>
                                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] animate-pulse"></div>
                            </div>
                            <div className="space-y-4">
                                {ORDERED_STATUSES.map(s => (
                                    <button 
                                        key={s} 
                                        onClick={() => handleSaveStatus(s)}
                                        disabled={loading.saving || enquiry.status === 'CONVERTED'}
                                        className={`w-full flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-700 group/btn relative overflow-hidden ${enquiry.status === s ? 'bg-primary/10 border-primary text-white shadow-2xl' : 'bg-black/20 border-white/5 text-white/30 hover:bg-white/5 hover:border-white/20'}`}
                                    >
                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className={`p-3 rounded-xl transition-all duration-700 ${enquiry.status === s ? 'bg-primary text-white shadow-lg rotate-3' : 'bg-white/5 text-white/20 group-hover/btn:scale-110'}`}>
                                                {STATUS_CONFIG[s]?.icon}
                                            </div>
                                            <span className={`text-sm font-black uppercase tracking-[0.2em] transition-colors duration-700 ${enquiry.status === s ? 'text-primary' : 'group-hover/btn:text-white'}`}>
                                                {STATUS_CONFIG[s]?.label}
                                            </span>
                                        </div>
                                        {enquiry.status === s && <CheckCircleIcon className="w-5 h-5 text-primary animate-in zoom-in duration-500 relative z-10" />}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-10">
                             <div className="flex items-center justify-between">
                                <h3 className="text-[11px] font-black uppercase text-white/30 tracking-[0.5em]">Identity Intel</h3>
                                <button 
                                    onClick={handleAIGenerateSummary} 
                                    disabled={loading.ai}
                                    className="p-3 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all active:scale-90"
                                    title="AI Summarize Conversation"
                                >
                                    {loading.ai ? <Spinner size="sm" /> : <SparklesIcon className="w-5 h-5" />}
                                </button>
                             </div>
                             
                             {aiSummary ? (
                                <div className="bg-primary/5 border border-primary/20 p-8 rounded-[2.5rem] relative group overflow-hidden animate-in fade-in slide-in-from-right-8 duration-1000">
                                     <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:opacity-40 transition-opacity"></div>
                                     <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary mb-4 flex items-center gap-2">
                                         <SparklesIcon className="w-3.5 h-3.5" /> AI Synthesis
                                     </p>
                                     <p className="text-sm font-serif italic text-white/70 leading-loose">"{aiSummary}"</p>
                                     <button onClick={() => setAiSummary(null)} className="mt-6 text-[9px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white transition-colors">Clear Insight</button>
                                </div>
                             ) : (
                                <div className="space-y-5">
                                    <div className="flex flex-col gap-2 p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 shadow-inner">
                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Parent Contact</span>
                                        <p className="text-base text-white/80 font-medium font-serif italic">{enquiry.parent_email}</p>
                                    </div>
                                    <div className="flex flex-col gap-2 p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 shadow-inner">
                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Institutional Grade</span>
                                        <p className="text-base text-white/80 font-black font-serif italic tracking-wider">GRADE {enquiry.grade}</p>
                                    </div>
                                </div>
                             )}
                        </section>

                        {enquiry.status !== 'CONVERTED' && (
                            <section className="pt-10 border-t border-white/5 space-y-8">
                                <button 
                                    onClick={handleConvert}
                                    disabled={loading.converting || enquiry.status === 'ENQUIRY_ACTIVE'}
                                    className={`w-full py-7 md:py-8 rounded-[2.8rem] flex items-center justify-center gap-6 font-black text-xs uppercase tracking-[0.5em] transition-all duration-700 shadow-2xl active:scale-95 ${enquiry.status !== 'ENQUIRY_ACTIVE' ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-white/5 text-white/5 cursor-not-allowed border border-white/5 grayscale'}`}
                                >
                                    {loading.converting ? <Spinner size="sm" className="text-white"/> : <><GraduationCapIcon className="w-7 h-7 opacity-60" /> PROMOTE TO ADMISSION</>}
                                </button>
                                {enquiry.status === 'ENQUIRY_ACTIVE' && <p className="text-[9px] text-amber-500/60 font-black uppercase tracking-[0.2em] text-center leading-relaxed">Identity verification protocol required <br/> prior to Promotion.</p>}
                            </section>
                        )}

                        <div className="mt-auto opacity-5 hover:opacity-100 transition-opacity duration-1000">
                            <p className="text-[8px] font-mono text-white break-all text-center uppercase tracking-widest">CIPHER: {btoa(String(enquiry.id)).substring(0, 32)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnquiryDetailsModal;