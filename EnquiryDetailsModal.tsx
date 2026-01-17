
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, formatError } from './services/supabase';
import { EnquiryService } from './services/enquiry';
import { Enquiry, TimelineItem, EnquiryStatus } from './types';
import Spinner from './components/common/Spinner';
import { XIcon } from './components/icons/XIcon';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';
import { GraduationCapIcon } from './components/icons/GraduationCapIcon';
import { ShieldCheckIcon } from './components/icons/ShieldCheckIcon';
import { ClockIcon } from './components/icons/ClockIcon';
import { CommunicationIcon } from './components/icons/CommunicationIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { GoogleGenAI } from '@google/genai';
import { UsersIcon } from './components/icons/UsersIcon';
import { LockIcon } from './components/icons/LockIcon';
import { SaveIcon } from './components/icons/SaveIcon';
import { ShieldAlertIcon } from './components/icons/ShieldAlertIcon';
import { AlertTriangleIcon } from './components/icons/AlertTriangleIcon';
import { MailIcon } from './components/icons/MailIcon';
import { PhoneIcon } from './components/icons/PhoneIcon';
import { CopyIcon } from './components/icons/CopyIcon';
import { UserIcon } from './components/icons/UserIcon';
import { motion, AnimatePresence } from 'framer-motion';

const LocalSendIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

const STATUS_CONFIG: Record<string, { icon: React.ReactNode, label: string, color: string }> = {
    'ENQUIRY_ACTIVE': { icon: <div className="w-2 h-2 rounded-full bg-blue-500/80 shadow-sm"/>, label: 'Active', color: 'text-blue-400' },
    'ENQUIRY_VERIFIED': { icon: <ShieldCheckIcon className="w-4 h-4 text-teal-500/80"/>, label: 'Verified', color: 'text-teal-500' },
    'ENQUIRY_IN_REVIEW': { icon: <ClockIcon className="w-4 h-4 text-purple-500/80"/>, label: 'In Review', color: 'text-purple-500' },
    'ENQUIRY_CONTACTED': { icon: <CommunicationIcon className="w-4 h-4 text-amber-500/80"/>, label: 'Contacted', color: 'text-amber-500' },
    'ENQUIRY_REJECTED': { icon: <ShieldAlertIcon className="w-4 h-4 text-red-500/80"/>, label: 'Rejected', color: 'text-red-500' },
    'ENQUIRY_CONVERTED': { icon: <CheckCircleIcon className="w-4 h-4 text-emerald-500/80"/>, label: 'Converted', color: 'text-emerald-500' },
};

const ORDERED_STATUSES: EnquiryStatus[] = ['ENQUIRY_ACTIVE', 'ENQUIRY_VERIFIED', 'ENQUIRY_IN_REVIEW', 'ENQUIRY_CONTACTED', 'ENQUIRY_REJECTED', 'ENQUIRY_CONVERTED'];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TimelineEntry: React.FC<{ item: TimelineItem }> = ({ item }) => {
    if (item.item_type === 'MESSAGE') {
        const isParent = !item.is_admin;
        return (
             <motion.div 
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex items-start gap-3 w-full py-2 ${isParent ? 'justify-start' : 'justify-end'}`}
            >
                <div className={`flex items-start gap-3 max-w-[80%] ${isParent ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] text-white/90 flex-shrink-0 border border-white/5 ${isParent ? 'bg-indigo-600/40' : 'bg-white/5'}`}>
                        {item.created_by_name.charAt(0)}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <div className={`px-4 py-3 rounded-2xl shadow-sm border border-white/[0.05] ${isParent ? 'bg-[#1a1d23] rounded-tl-none' : 'bg-[#1f1b2e] rounded-tr-none'}`}>
                            <p className="text-[14px] leading-relaxed text-white/85 font-sans whitespace-pre-wrap">{item.details.message}</p>
                        </div>
                        <div className={`flex items-center gap-2 px-1 ${isParent ? 'justify-start' : 'justify-end'}`}>
                            <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">{item.created_by_name}</span>
                            <span className="text-[11px] font-sans text-white/20">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }
    
    return (
        <div className="flex justify-center my-6">
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/[0.02] border border-white/5">
                <span className="text-[11px] font-semibold uppercase text-white/25 tracking-widest">
                    {item.item_type.replace(/_/g, ' ')} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
    );
};

interface EnquiryDetailsModalProps {
    enquiry: Enquiry;
    onClose: () => void;
    onUpdate: () => void;
    currentBranchId?: number | null; 
    onNavigate?: (component: string) => void;
}

const EnquiryDetailsModal: React.FC<EnquiryDetailsModalProps> = ({ enquiry, onClose, onUpdate, onNavigate }) => {
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [pendingStatus, setPendingStatus] = useState<EnquiryStatus>(enquiry.status);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState({ timeline: true, saving: false, converting: false, ai: false });
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isLegacyNode, setIsLegacyNode] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const commsEndRef = useRef<HTMLDivElement>(null);
    const isMounted = useRef(true);

    const handleCopy = (val: string, field: string) => {
        navigator.clipboard.writeText(val);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const fetchTimeline = useCallback(async (isSilent = false) => {
        if (!enquiry?.id) return;
        const idString = String(enquiry.id);
        
        if (!UUID_REGEX.test(idString)) {
            setIsLegacyNode(true);
            if (isMounted.current) setLoading(prev => ({ ...prev, timeline: false }));
            return;
        }

        if (!isSilent) {
            if (isMounted.current) setLoading(prev => ({ ...prev, timeline: true }));
        }
        
        setSyncError(null);
        try {
            const { data, error } = await supabase.rpc('get_enquiry_timeline_v3', { p_enquiry_id: idString });
            if (error) throw error;
            if (isMounted.current) {
                setTimeline(data || []);
                setIsLegacyNode(false);
            }
        } catch (e) {
            if (isMounted.current) setSyncError(formatError(e));
        } finally {
            if (isMounted.current) setLoading(prev => ({ ...prev, timeline: false }));
        }
    }, [enquiry.id]);

    useEffect(() => { 
        isMounted.current = true;
        fetchTimeline(); 
        return () => { isMounted.current = false; };
    }, [fetchTimeline]);

    useEffect(() => {
        if (commsEndRef.current) {
            commsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [timeline]);

    const handleAIGenerateSummary = async () => {
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
                contents: prompt
            });
            
            setAiSummary(response.text || "Summary unavailable.");
        } catch (err) {
            console.error("AI Context Failure:", formatError(err));
        } finally {
            if (isMounted.current) setLoading(prev => ({ ...prev, ai: false }));
        }
    };

    const executeSave = async (targetStatus: EnquiryStatus, customNote?: string) => {
        setLoading(prev => ({ ...prev, saving: true }));
        try {
            const idString = String(enquiry.id);
            const newNotes = customNote 
                ? `${enquiry.notes || ''}${enquiry.notes ? '\n' : ''}${customNote}`
                : enquiry.notes || null;

            // USE SERVICE PROTOCOL (RPC) TO BYPASS RLS AND ENSURE ATOMICITY
            await EnquiryService.updateStatus(idString, targetStatus, newNotes);
            
            // The service call only updates the status and notes. It doesn't log to timeline.
            // So we need to do it here.
            if (UUID_REGEX.test(idString)) {
                await supabase.rpc('send_enquiry_message_v3', { 
                    p_enquiry_id: idString, 
                    p_message: `PROTOCOL UPDATE: Application promoted to ${targetStatus}.${customNote ? ` Note: ${customNote}` : ''}` 
                });
            }

            onUpdate(); // Re-fetches data in parent
            onClose(); // Closes modal
        } catch (err: any) {
            alert(`Save failed: ${err.message || formatError(err)}`);
        } finally {
            if (isMounted.current) setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const handleFinalizeSave = async () => {
        if (pendingStatus === 'ENQUIRY_CONVERTED') {
            handleConvert();
            return;
        }

        let customNote = "";
        if (pendingStatus === 'ENQUIRY_REJECTED') {
            const reason = prompt("Specify the reason for record rejection:");
            if (!reason) return; // User cancelled
            customNote = `Rejected: ${reason}`;
        }

        await executeSave(pendingStatus, customNote);
    };
    
    const handleQuickVerify = async () => {
        await executeSave('ENQUIRY_VERIFIED', "Profile has been reviewed and verified.");
    };

    const handleConvert = async () => {
        setLoading(prev => ({ ...prev, converting: true }));
        try {
            const result = await EnquiryService.convertToAdmission(String(enquiry.id));
            if (result.success) {
                onUpdate();
                onClose();
                onNavigate?.('Admissions');
            }
        } catch (err: any) {
            alert(formatError(err));
        } finally {
            if (isMounted.current) setLoading(prev => ({ ...prev, converting: false }));
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const msg = newMessage.trim();
        if (!msg) return;
        
        if (isLegacyNode) {
            alert("Record synchronization requires UUID standard node.");
            return;
        }

        try {
            const { error } = await supabase.rpc('send_enquiry_message_v3', { 
                p_enquiry_id: String(enquiry.id), 
                p_message: msg 
            });
            if (error) throw error;
            setNewMessage('');
            await fetchTimeline(true);
        } catch (err) {
            alert("Transmission Failure: " + formatError(err));
        }
    };

    const hasStatusChanged = pendingStatus !== enquiry.status;

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[150] p-0 sm:p-4 md:p-12 overflow-hidden font-sans" onClick={onClose}>
            <div className="bg-[#08090a] rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-[1400px] h-full sm:h-[90vh] flex flex-col border border-white/5 overflow-hidden ring-1 ring-white/10 animate-in fade-in zoom-in-98 duration-300" onClick={e => e.stopPropagation()}>
                
                {/* Header Area */}
                <header className="px-8 py-6 border-b border-white/[0.04] bg-[#0c0d12]/80 flex justify-between items-center z-40 flex-shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-white/5 rounded-xl text-white/90 flex items-center justify-center border border-white/10 shadow-sm">
                            <UsersIcon className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="flex items-baseline gap-4 mb-0.5">
                                <h2 className="text-xl md:text-2xl font-bold text-white/90 tracking-tight uppercase">{enquiry.applicant_name}</h2>
                                <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest bg-white/[0.03] px-2 py-0.5 rounded border border-white/5">NODE_{String(enquiry.id).substring(0,8).toUpperCase()}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] font-semibold text-primary/80 uppercase tracking-widest">Secured Channel</span>
                                <div className="w-1 h-1 rounded-full bg-white/10"></div>
                                <span className="text-[11px] font-medium text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                                    Grade {enquiry.grade} Context
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {enquiry.status === 'ENQUIRY_ACTIVE' && !loading.saving && (
                            <button 
                                onClick={handleQuickVerify}
                                className="hidden md:flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-500 font-black text-[10px] uppercase tracking-widest border border-teal-500/20 transition-all shadow-lg active:scale-95 animate-in slide-in-from-right-4"
                            >
                                <ShieldCheckIcon className="w-4 h-4"/> Verify Profile
                            </button>
                        )}
                        <button onClick={onClose} className="p-2.5 rounded-lg bg-white/5 text-white/40 hover:text-white transition-all border border-white/5"><XIcon className="w-5 h-5"/></button>
                    </div>
                </header>

                <div className="flex-grow overflow-hidden flex flex-col lg:flex-row relative">
                    {/* Message Area */}
                    <div className="flex-1 flex flex-col bg-transparent relative z-10 border-r border-white/[0.03]">
                        <div className="flex-grow overflow-y-auto p-8 md:p-12 space-y-6 custom-scrollbar flex flex-col scroll-smooth bg-[#08090a]/40">
                            {loading.timeline && timeline.length === 0 ? (
                                <div className="m-auto flex flex-col items-center gap-3">
                                    <Spinner size="md" className="text-primary/60" />
                                    <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/15">Establishing Link...</p>
                                </div>
                            ) : syncError ? (
                                <div className="m-auto flex flex-col items-center text-center space-y-4">
                                    <AlertTriangleIcon className="w-10 h-10 text-red-500/50" />
                                    <p className="text-xs font-bold text-white/30 uppercase tracking-widest">{syncError}</p>
                                    <button onClick={() => fetchTimeline()} className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">Retry Connection</button>
                                </div>
                            ) : isLegacyNode ? (
                                <div className="m-auto flex flex-col items-center text-center space-y-6">
                                    <AlertTriangleIcon className="w-16 h-16 text-white/10" />
                                    <div>
                                        <h4 className="text-lg font-bold text-white/40 uppercase tracking-widest">Legacy Record Detected</h4>
                                        <p className="text-sm text-white/20 mt-2 max-w-sm mx-auto leading-relaxed">Communications are locked for this node. Identity migration to UUID standard is required.</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {timeline.length === 0 && (
                                        <div className="m-auto flex flex-col items-center text-center opacity-20">
                                            <CommunicationIcon className="w-16 h-16 mb-6" />
                                            <p className="text-sm font-medium uppercase tracking-[0.3em]">Channel Idle</p>
                                        </div>
                                    )}
                                    <div className="space-y-4">
                                        {timeline.map((item, idx) => <TimelineEntry key={idx} item={item} />)}
                                        <div ref={commsEndRef} className="h-4" />
                                    </div>
                                </>
                            )}
                        </div>
                        
                        {/* Input Composer */}
                        <div className="p-8 border-t border-white/[0.04] bg-[#0c0d12]/90 backdrop-blur-md">
                            <form onSubmit={handleSendMessage} className="flex gap-4 items-center max-w-4xl mx-auto">
                                <div className="flex-grow relative">
                                    <input 
                                        type="text"
                                        value={newMessage} 
                                        onChange={(e) => setNewMessage(e.target.value)} 
                                        disabled={isLegacyNode || !!syncError}
                                        placeholder={isLegacyNode ? "HANDSHAKE BLOCKED" : "Add an internal note or audit comment..."}
                                        className={`w-full h-12 pl-5 pr-12 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white/85 placeholder:text-white/20 outline-none transition-all duration-200 focus:bg-white/[0.05] focus:border-primary/40 ${isLegacyNode || syncError ? 'opacity-30 cursor-not-allowed' : ''}`}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <LockIcon className="w-4 h-4 text-white/10" />
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={!newMessage.trim() || isLegacyNode || !!syncError}
                                    className="w-12 h-12 bg-indigo-600/80 text-white rounded-xl flex items-center justify-center transition-all hover:bg-indigo-600 active:scale-95 disabled:opacity-10"
                                >
                                    <LocalSendIcon className="w-5 h-5" />
                                </button>
                            </form>
                            <p className="text-center text-[10px] font-bold uppercase tracking-[0.4em] text-white/10 mt-5">Verified Audit Log Context</p>
                        </div>
                    </div>

                    {/* Right Control Panel */}
                    <div className="w-full lg:w-[400px] bg-[#090a0f] p-8 space-y-10 overflow-y-auto custom-scrollbar relative z-20">
                        
                        {/* Status Focus Card */}
                        <section className="space-y-6">
                            <h3 className="text-[13px] font-semibold uppercase text-white/30 tracking-wider">Lifecycle Status</h3>
                            
                            <div className="bg-[#13151b] border border-white/10 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center">
                                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 mb-5">
                                    <CheckCircleIcon className="w-10 h-10 text-primary" />
                                </div>
                                <div className="text-center">
                                    <span className="text-[11px] font-black text-primary uppercase tracking-[0.4em]">
                                        {STATUS_CONFIG[enquiry.status]?.label || 'ACTIVE'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {ORDERED_STATUSES.filter(s => s !== enquiry.status).map(s => (
                                    <button 
                                        key={s} 
                                        onClick={() => setPendingStatus(s)}
                                        disabled={loading.saving || enquiry.status === 'ENQUIRY_CONVERTED' || enquiry.status === 'ENQUIRY_REJECTED'}
                                        className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border transition-all duration-200 group/btn ${pendingStatus === s ? 'bg-primary/10 border-primary/40 text-white' : 'bg-white/[0.01] border-white/[0.03] text-white/20 hover:border-white/10'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="transition-transform group-hover/btn:scale-105">
                                                {STATUS_CONFIG[s]?.icon}
                                            </div>
                                            <span className={`text-[12px] font-semibold uppercase tracking-wider ${pendingStatus === s ? 'text-primary' : ''}`}>
                                                {STATUS_CONFIG[s]?.label}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            
                            <button 
                                onClick={handleFinalizeSave}
                                disabled={loading.saving || !hasStatusChanged}
                                className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest transition-all ${hasStatusChanged ? 'bg-indigo-600/90 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-600/10' : 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5'}`}
                            >
                                {loading.saving ? <Spinner size="sm" className="text-white"/> : <><SaveIcon className="w-4 h-4" /> Commit Status</>}
                            </button>
                        </section>

                        {/* Identity Intel Section */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[13px] font-semibold uppercase text-white/30 tracking-wider">Identity Intel</h3>
                                <button 
                                    onClick={handleAIGenerateSummary} 
                                    disabled={loading.ai || isLegacyNode || !!syncError}
                                    className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all disabled:opacity-20 border border-primary/10"
                                    title="AI Synthesis"
                                >
                                    {loading.ai ? <Spinner size="sm" /> : <SparklesIcon className="w-4 h-4" />}
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {aiSummary ? (
                                    <div className="bg-primary/[0.03] border border-primary/10 p-6 rounded-2xl animate-in fade-in duration-500">
                                         <p className="text-[13px] font-sans text-white/70 leading-relaxed italic">"{aiSummary}"</p>
                                         <button onClick={() => setAiSummary(null)} className="mt-4 text-[10px] font-bold uppercase text-white/20 hover:text-white/40 transition-colors">Discard</button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] group/intel transition-all hover:border-white/10">
                                            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/[0.03]">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                                                    <UserIcon className="w-5 h-5"/>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[14px] font-bold text-white/85 truncate uppercase tracking-tight">{enquiry.parent_name || 'Anonymous'}</p>
                                                    <span className="text-[10px] font-medium text-white/20 uppercase tracking-widest">Parent Node</span>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <MailIcon className="w-4 h-4 text-white/15" />
                                                        <span className="text-[13px] text-white/60 font-medium truncate max-w-[200px]">{enquiry.parent_email}</span>
                                                    </div>
                                                    <button onClick={() => handleCopy(enquiry.parent_email, 'email')} className="text-white/10 hover:text-white/40 transition-colors">
                                                        {copiedField === 'email' ? <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500"/> : <CopyIcon className="w-3.5 h-3.5"/>}
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <PhoneIcon className="w-4 h-4 text-white/15" />
                                                        <span className="text-[13px] text-white/60 font-medium tracking-wider">{enquiry.parent_phone || '—'}</span>
                                                    </div>
                                                    {enquiry.parent_phone && (
                                                        <button onClick={() => handleCopy(enquiry.parent_phone, 'phone')} className="text-white/10 hover:text-white/40 transition-colors">
                                                            {copiedField === 'phone' ? <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500"/> : <CopyIcon className="w-3.5 h-3.5"/>}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] transition-all hover:border-white/10">
                                            <div className="flex items-center gap-4">
                                                 <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 shadow-sm">
                                                    <GraduationCapIcon className="w-5 h-5"/>
                                                </div>
                                                <div>
                                                    <p className="text-lg font-bold text-white/85 tracking-widest uppercase">GRADE {enquiry.grade}</p>
                                                    <span className="text-[10px] font-medium text-white/20 uppercase tracking-widest">Academic Target</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {enquiry.status !== 'ENQUIRY_CONVERTED' && (
                            <section className="pt-6 border-t border-white/[0.04]">
                                <button 
                                    onClick={handleConvert}
                                    disabled={loading.converting || ['ENQUIRY_ACTIVE', 'ENQUIRY_REJECTED', 'ENQUIRY_CONVERTED'].includes(enquiry.status)}
                                    className={`w-full h-14 rounded-xl flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest transition-all ${!['ENQUIRY_ACTIVE', 'ENQUIRY_REJECTED', 'ENQUIRY_CONVERTED'].includes(enquiry.status) ? 'bg-[#10b981]/90 text-white hover:bg-[#10b981] shadow-lg shadow-emerald-900/20' : 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5 grayscale'}`}
                                >
                                    <GraduationCapIcon className="w-5 h-5 opacity-60" />
                                    <span>Promote to Admission</span>
                                </button>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnquiryDetailsModal;
