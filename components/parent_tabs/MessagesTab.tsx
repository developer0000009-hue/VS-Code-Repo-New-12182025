
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, formatError } from '../../services/supabase';
import { MyEnquiry, TimelineItem, EnquiryStatus, Communication } from '../../types';
import Spinner from '../common/Spinner';
import { MegaphoneIcon } from '../icons/MegaphoneIcon'; 
import { SearchIcon } from '../icons/SearchIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { XIcon } from '../icons/XIcon';
import { CommunicationIcon } from '../icons/CommunicationIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuIcon } from '../icons/MenuIcon';

type Tab = 'inbox' | 'enquiries';

// FIX: Corrected UUID_REGEX to include the 5th segment, resolving the Legacy Node Mismatch error.
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// FIX: The statusColors object was using keys that did not conform to the EnquiryStatus type, causing a compilation error. The object has been updated to use only the valid keys defined in EnquiryStatus.
const statusColors: { [key in EnquiryStatus]: string } = {
  'ENQUIRY_ACTIVE': 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20',
  'ENQUIRY_VERIFIED': 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20',
  'ENQUIRY_IN_REVIEW': 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  'ENQUIRY_CONTACTED': 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  'ENQUIRY_REJECTED': 'bg-rose-400/10 text-red-400 border-red-400/20',
  'ENQUIRY_CONVERTED': 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
};

const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "JUST NOW";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}M AGO`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}H AGO`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase();
};

const LocalSendIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

const MessagesTab: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('inbox');
    const [enquiries, setEnquiries] = useState<MyEnquiry[]>([]);
    const [announcements, setAnnouncements] = useState<Communication[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEnquiry, setSelectedEnquiry] = useState<MyEnquiry | null>(null);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Communication | null>(null);
    const [isMobileRegistryOpen, setIsMobileRegistryOpen] = useState(false);

    const fetchData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const [enqResult, msgResult] = await Promise.all([
                supabase.rpc('get_my_enquiries'),
                supabase.rpc('get_my_messages') 
            ]);
            
            const fetchedEnquiries = (enqResult.data as MyEnquiry[]) || [];
            const fetchedAnnouncements = ((msgResult.data as any[]) || []).map(i => ({...i, id: i.message_id || i.id}));
            
            setEnquiries(fetchedEnquiries);
            setAnnouncements(fetchedAnnouncements);

            if (!isSilent) {
                if (activeTab === 'inbox' && fetchedAnnouncements.length > 0) {
                    setSelectedAnnouncement(fetchedAnnouncements[0]);
                } else if (activeTab === 'enquiries' && fetchedEnquiries.length > 0) {
                    setSelectedEnquiry(fetchedEnquiries[0]);
                }
            }
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => { 
        fetchData(); 
        const channel = supabase
            .channel('parent-comms-hub')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiry_messages' }, () => fetchData(true))
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'communications' }, () => fetchData(true))
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchData]);

    const handleTabSwitch = (t: Tab) => {
        setActiveTab(t);
        if (t === 'inbox' && announcements.length > 0) setSelectedAnnouncement(announcements[0]);
        else if (t === 'enquiries' && enquiries.length > 0) setSelectedEnquiry(enquiries[0]);
        else {
            setSelectedAnnouncement(null);
            setSelectedEnquiry(null);
        }
    };

    const handleItemSelect = (item: any) => {
        if (activeTab === 'inbox') setSelectedAnnouncement(item);
        else setSelectedEnquiry(item);
        setIsMobileRegistryOpen(false);
    };

    if (loading && announcements.length === 0 && enquiries.length === 0) return (
        <div className="flex flex-col justify-center items-center py-40 space-y-10">
            <Spinner size="lg" className="text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 animate-pulse font-sans">Synchronizing Node Broadcasts</p>
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col lg:flex-row h-[calc(100vh-16rem)] min-h-[650px] bg-[#08090a] rounded-2xl overflow-hidden border border-white/[0.04] relative font-sans shadow-2xl"
        >
            {/* Mobile Navigation Trigger */}
            <div className="lg:hidden absolute top-4 left-4 z-[60]">
                <button 
                    onClick={() => setIsMobileRegistryOpen(true)}
                    className="p-3 bg-[#12141c] text-white rounded-xl shadow-2xl border border-white/10 active:scale-95 transition-transform backdrop-blur-md"
                >
                    <MenuIcon className="w-5 h-5" />
                </button>
            </div>

            {/* --- LEFT PANEL: REGISTRY / BROADCASTS (Responsive Drawer) --- */}
            <AnimatePresence>
                {(isMobileRegistryOpen || window.innerWidth > 1024) && (
                    <motion.div 
                        initial={window.innerWidth <= 1024 ? { x: -380 } : false}
                        animate={{ x: 0 }}
                        exit={{ x: -380 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className={`
                            w-full lg:w-[380px] flex flex-col border-r border-white/[0.03] bg-[#0c0d12]/95 backdrop-blur-2xl transition-all duration-500 z-50
                            ${isMobileRegistryOpen ? 'fixed inset-0 lg:static' : 'hidden lg:flex static'}
                        `}
                    >
                        <div className="p-8 border-b border-white/[0.04] bg-white/[0.01]">
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Institutional Registry</span>
                                <button onClick={() => setIsMobileRegistryOpen(false)} className="lg:hidden p-2 text-white/40 hover:text-white transition-colors"><XIcon className="w-5 h-5"/></button>
                            </div>
                            <div className="flex p-1.5 bg-black/40 rounded-2xl border border-white/5 shadow-inner">
                                {(['inbox', 'enquiries'] as Tab[]).map(t => (
                                    <button 
                                        key={t} onClick={() => handleTabSwitch(t)}
                                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 relative overflow-hidden ${activeTab === t ? 'bg-primary/20 text-primary shadow-lg ring-1 ring-white/10' : 'text-white/30 hover:text-white/50'}`}
                                    >
                                        {t === 'inbox' ? 'Broadcasts' : 'Enquiries'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-grow overflow-y-auto custom-scrollbar bg-black/20">
                            {activeTab === 'inbox' ? (
                                announcements.length === 0 ? <EmptyState label="Broadcast" /> : announcements.map((msg) => (
                                    <button 
                                        key={msg.id} onClick={() => handleItemSelect(msg)}
                                        className={`w-full text-left p-6 border-b border-white/[0.03] transition-all duration-500 relative group ${selectedAnnouncement?.id === msg.id ? 'bg-white/[0.05] z-10 translate-x-1' : 'hover:bg-white/[0.02]'}`}
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2.5">
                                                <MegaphoneIcon className={`w-3.5 h-3.5 ${selectedAnnouncement?.id === msg.id ? 'text-primary' : 'text-white/20'}`} />
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${selectedAnnouncement?.id === msg.id ? 'text-primary' : 'text-white/20'}`}>Authority</span>
                                            </div>
                                            <span className="text-[9px] font-bold text-white/10 uppercase tracking-widest">{formatTimeAgo(msg.sent_at)}</span>
                                        </div>
                                        <h4 className={`text-[15px] font-bold truncate transition-colors leading-tight ${selectedAnnouncement?.id === msg.id ? 'text-white' : 'text-white/60 group-hover:text-white/80'}`}>{msg.subject}</h4>
                                        <p className="text-[12px] text-white/20 line-clamp-1 mt-2 font-medium tracking-tight opacity-80">{msg.body}</p>
                                        {selectedAnnouncement?.id === msg.id && <motion.div layoutId="tab-pill" className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full shadow-[0_0_12px_rgba(var(--primary),0.8)]"></motion.div>}
                                    </button>
                                ))
                            ) : (
                                enquiries.length === 0 ? <EmptyState label="Enquiry" /> : enquiries.map(enq => (
                                    <button 
                                        key={enq.id} onClick={() => handleItemSelect(enq)}
                                        className={`w-full text-left p-6 border-b border-white/[0.03] transition-all duration-500 relative group ${selectedEnquiry?.id === enq.id ? 'bg-white/[0.05] z-10 translate-x-1' : 'hover:bg-white/[0.02]'}`}
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2.5">
                                                <CommunicationIcon className={`w-3.5 h-3.5 ${selectedEnquiry?.id === enq.id ? 'text-indigo-400' : 'text-white/20'}`} />
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${selectedEnquiry?.id === enq.id ? 'text-indigo-400' : 'text-white/20'}`}>Identity Node</span>
                                            </div>
                                            <span className="text-[9px] font-bold text-white/10 uppercase tracking-widest">{formatTimeAgo(enq.updated_at)}</span>
                                        </div>
                                        <h4 className={`text-[15px] font-bold truncate transition-colors leading-tight ${selectedEnquiry?.id === enq.id ? 'text-white' : 'text-white/60 group-hover:text-white/80'}`}>{enq.applicant_name}</h4>
                                        <div className="mt-3 flex items-center gap-3">
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border tracking-widest shadow-sm ${statusColors[enq.status] || 'bg-white/5 text-white/20'}`}>{enq.status.replace('ENQUIRY_', '')}</span>
                                            <span className="text-[9px] font-bold text-white/10 uppercase tracking-[0.2em] opacity-60">Grade {enq.grade} Context</span>
                                        </div>
                                        {selectedEnquiry?.id === enq.id && <motion.div layoutId="tab-pill-enq" className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.8)]"></motion.div>}
                                    </button>
                                ))
                            )}
                        </div>
                        
                        <div className="p-8 border-t border-white/[0.04] bg-white/[0.01] text-center">
                            <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em] select-none">Secure Vault Registry</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- RIGHT PANEL: PAYLOAD VIEW (Dominant) --- */}
            <div className="flex-grow flex flex-col transition-all duration-700 relative z-10 bg-transparent">
                {activeTab === 'inbox' ? (
                    selectedAnnouncement ? <AnnouncementView announcement={selectedAnnouncement} /> : <ReadingStandby title="BROADCAST PAYLOAD STANDBY" />
                ) : (
                    selectedEnquiry ? <EnquiryConversation enquiry={selectedEnquiry} refreshEnquiries={fetchData} /> : <ReadingStandby title="ENQUIRY PAYLOAD STANDBY" />
                )}
            </div>
        </motion.div>
    );
};

const EmptyState = ({ label }: { label: string }) => (
    <div className="flex flex-col items-center justify-center py-32 px-8 text-center opacity-40 animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-white/[0.02] rounded-[2rem] flex items-center justify-center mb-8 border border-white/5 shadow-inner">
            <AlertTriangleIcon className="w-10 h-10 text-white/10" />
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-white/60 leading-relaxed max-w-[200px]">No active registry nodes detected for this module.</p>
    </div>
);

const ReadingStandby = ({ title }: { title: string }) => (
    <div className="flex flex-col items-center justify-center h-full p-12 text-center animate-in fade-in duration-1000">
        <div className="relative mb-16 flex items-center justify-center">
             <div className="absolute w-56 h-56 bg-primary/5 rounded-full blur-[80px]"></div>
             <MegaphoneIcon className="w-32 h-32 text-white/[0.02] relative z-10" />
        </div>
        <h3 className="text-[28px] font-bold text-white tracking-tight uppercase leading-none mb-6 font-serif">{title}</h3>
        <p className="text-[15px] text-white/40 font-medium leading-relaxed max-w-[320px] mx-auto font-serif italic">Select a node from the registry to decrypt and establish an institutional handshake.</p>
        
        <div className="mt-20 flex items-center gap-3 text-[10px] font-black text-white/10 uppercase tracking-[0.4em] border-t border-white/[0.03] pt-10">
            <ShieldCheckIcon className="w-5 h-5 opacity-20" /> Institutional payloads are end-to-end encrypted
        </div>
    </div>
);

const AnnouncementView = ({ announcement }: any) => (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-700 bg-transparent">
         <div className="px-10 py-10 md:px-16 border-b border-white/[0.04] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#0c0d12]/40 backdrop-blur-md">
            <div className="space-y-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Official Node Broadcast</span>
                <div className="flex items-center gap-3">
                    <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest">{formatTimeAgo(announcement.sent_at)}</p>
                    <div className="w-1 h-1 rounded-full bg-white/10"></div>
                    <p className="text-[11px] font-black text-white/40 uppercase tracking-widest">{announcement.sender_name || 'CENTRAL AUTHORITY'}</p>
                </div>
            </div>
            <div className="flex gap-2">
                <button className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/30 hover:text-white transition-all border border-white/5 shadow-xl group/btn active:scale-95"><DownloadIcon className="w-5 h-5 group-hover/btn:translate-y-0.5 transition-transform" /></button>
            </div>
         </div>
         <div className="flex-grow overflow-y-auto p-10 md:p-16 lg:p-24 custom-scrollbar">
             <div className="max-w-4xl mx-auto space-y-16">
                <div className="space-y-8">
                    <h1 className="text-[32px] md:text-[44px] font-bold text-white leading-[1.1] tracking-tighter uppercase font-serif drop-shadow-2xl">{announcement.subject}</h1>
                    <div className="w-24 h-1 bg-gradient-to-r from-primary to-transparent rounded-full opacity-40"></div>
                </div>
                <div className="text-white/60 text-[18px] md:text-[20px] leading-relaxed font-medium whitespace-pre-wrap selection:bg-primary/20 font-serif italic border-l-4 border-white/[0.03] pl-10">
                    {announcement.body}
                </div>
                <div className="pt-24 border-t border-white/[0.03]">
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.6em] text-white/10 select-none">
                        <ShieldCheckIcon className="w-6 h-6" /> INTEGRITY LEDGER LOG: {String(announcement.id || '').slice(0, 18).toUpperCase()}
                    </div>
                </div>
             </div>
         </div>
    </div>
);

const EnquiryConversation = ({ enquiry, refreshEnquiries }: any) => {
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLegacy, setIsLegacy] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const primaryId = (enquiry.id).toString();

    const fetchTimeline = useCallback(async () => {
        if (!UUID_REGEX.test(primaryId)) {
            setIsLegacy(true);
            setLoading(false);
            return;
        }

        setLoading(true);
        const { data, error } = await supabase.rpc('get_enquiry_timeline_v3', { p_enquiry_id: primaryId });
        if (!error && data) {
            setTimeline(data);
            setIsLegacy(false);
        }
        setLoading(false);
    }, [primaryId]);

    useEffect(() => { 
        fetchTimeline(); 
        if (!isLegacy) {
            const channel = supabase.channel(`parent-enq-view-${primaryId}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiry_messages', filter: `enquiry_id=eq.${primaryId}` }, () => fetchTimeline())
                .subscribe();
            return () => { supabase.removeChannel(channel); };
        }
    }, [fetchTimeline, primaryId, isLegacy]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [timeline]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;
        if (isLegacy) {
            alert("Security Protocol: Node migration required for messaging capability.");
            return;
        }

        setSending(true);
        const { error } = await supabase.rpc('send_enquiry_message_v3', { p_enquiry_id: primaryId, p_message: newMessage });
        if (!error) {
            setNewMessage('');
            await fetchTimeline();
            refreshEnquiries(true);
        } else {
            alert(formatError(error));
        }
        setSending(false);
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-700 bg-transparent">
            <header className="p-8 md:p-12 border-b border-white/[0.04] bg-[#0c0d12]/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-8 z-20">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/30 border border-white/5 shadow-inner">
                        <CommunicationIcon className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-3 font-serif">{enquiry.applicant_name}</h3>
                        <div className="flex items-center gap-4">
                             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] bg-indigo-400/5 px-3 py-1 rounded-lg border border-indigo-400/10 shadow-sm">Grade {enquiry.grade} Block</span>
                             <div className="w-1 h-1 rounded-full bg-white/10"></div>
                             <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">{enquiry.status.replace('ENQUIRY_', '')}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                     <button className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-xl">Inspect Identity</button>
                </div>
            </header>

            <div ref={scrollRef} className="flex-grow overflow-y-auto p-10 md:p-16 space-y-10 bg-transparent custom-scrollbar relative">
                {loading ? (
                    <div className="h-full flex items-center justify-center opacity-20"><Spinner size="lg" /></div>
                ) : isLegacy ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-50 animate-in zoom-in-95 duration-1000">
                        <div className="relative mb-10">
                            <div className="absolute -inset-10 bg-red-500/5 blur-[80px] rounded-full"></div>
                            <AlertTriangleIcon className="w-20 h-20 text-red-500/40 relative z-10" />
                        </div>
                        <h4 className="text-2xl font-bold text-white uppercase tracking-[0.3em] font-serif">Legacy Node Mismatch</h4>
                        <p className="text-[15px] text-white/30 mt-4 max-w-sm font-serif italic leading-relaxed">This record uses a legacy identity standard. Timeline synchronization is disabled for this node.</p>
                    </div>
                ) : timeline.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-white/5 uppercase font-black tracking-[0.6em] select-none opacity-20">
                        <ShieldCheckIcon className="w-16 h-16 mb-6" />
                        Channel Silent
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto space-y-8">
                        {timeline.map((item, idx) => (
                            <motion.div 
                                key={idx} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`flex ${item.is_admin ? 'justify-start' : 'justify-end'}`}
                            >
                                 <div className={`max-w-[75%] p-6 rounded-[1.8rem] text-[15px] leading-relaxed shadow-2xl border transition-all duration-500 hover:scale-[1.01] ${
                                    !item.is_admin 
                                    ? 'bg-white/[0.04] text-white/70 border-white/[0.06] rounded-br-none backdrop-blur-sm' 
                                    : 'bg-indigo-600 text-white border-white/10 rounded-bl-none shadow-indigo-600/20'
                                 }`}>
                                     <p className="font-medium font-sans selection:bg-white/20">{item.details.message}</p>
                                     <div className={`text-[9px] font-black uppercase mt-5 tracking-[0.3em] opacity-40 flex items-center gap-3 ${!item.is_admin ? 'justify-end' : 'justify-start'}`}>
                                        <span className="truncate">{item.created_by_name}</span>
                                        <div className="w-1 h-1 rounded-full bg-current opacity-30"></div>
                                        <span className="whitespace-nowrap">{formatTimeAgo(item.created_at)}</span>
                                     </div>
                                 </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-8 md:p-12 border-t border-white/[0.04] bg-[#0c0d12]/80 backdrop-blur-xl">
                <form onSubmit={handleSendMessage} className="max-w-5xl mx-auto flex gap-6">
                    <div className="flex-grow relative group">
                        <input 
                            type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                            disabled={isLegacy}
                            placeholder={isLegacy ? "COMMUNICATION RESTRICTED" : "Add payload context..."}
                            className={`w-full h-14 px-8 rounded-[1.5rem] bg-black/40 border border-white/5 text-white placeholder:text-white/10 focus:border-primary/50 focus:bg-black/60 outline-none transition-all text-sm font-medium disabled:opacity-20 shadow-inner group-hover:border-white/10`}
                        />
                        {!isLegacy && <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 group-focus-within:opacity-100 transition-opacity"><ShieldCheckIcon className="w-4 h-4 text-primary" /></div>}
                    </div>
                    <button 
                        type="submit" disabled={!newMessage.trim() || sending || isLegacy} 
                        className={`h-14 w-14 flex items-center justify-center rounded-[1.2rem] shadow-2xl transition-all active:scale-90 disabled:opacity-10 ${!newMessage.trim() || isLegacy ? 'bg-white/5 text-white/20' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'}`}
                    >
                        {sending ? <Spinner size="sm" className="text-white" /> : <LocalSendIcon className="w-6 h-6" />}
                    </button>
                </form>
                <div className="max-w-5xl mx-auto mt-6 text-center">
                    <p className="text-[9px] font-black text-white/5 uppercase tracking-[0.5em] select-none">Secure Institutional Uplink Active</p>
                </div>
            </div>
        </div>
    );
};

const DownloadIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);

export default MessagesTab;
