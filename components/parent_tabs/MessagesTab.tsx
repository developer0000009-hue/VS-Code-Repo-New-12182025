
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

type Tab = 'inbox' | 'enquiries';

// Status colors for EnquiryStatus enum values
const statusColors: { [key in EnquiryStatus]: string } = {
  'NEW': 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  'CONTACTED': 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  'VERIFIED': 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20',
  'APPROVED': 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  'REJECTED': 'bg-red-400/10 text-red-400 border-red-400/20',
  'CONVERTED': 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
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
    const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

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
        setIsMobileDetailOpen(false);
        if (t === 'inbox' && announcements.length > 0) setSelectedAnnouncement(announcements[0]);
        if (t === 'enquiries' && enquiries.length > 0) setSelectedEnquiry(enquiries[0]);
    };

    if (loading && announcements.length === 0 && enquiries.length === 0) return (
        <div className="flex flex-col justify-center items-center py-40 space-y-10">
            <Spinner size="lg" className="text-primary" />
            <p className="text-[11px] font-black uppercase text-white/20 tracking-[0.5em] animate-pulse">Establishing Communication Uplink</p>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-18rem)] min-h-[700px] bg-[#0d0f14] border border-white/5 rounded-[3rem] md:rounded-[4rem] shadow-[0_64px_128px_-24px_rgba(0,0,0,1)] overflow-hidden ring-1 ring-black/50 animate-in fade-in duration-1000">
            <div className="flex h-full relative">
                <div className={`w-full lg:w-[460px] flex flex-col border-r border-white/5 bg-[#0a0a0c]/60 backdrop-blur-3xl transition-all duration-500 z-20 ${isMobileDetailOpen ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-10 border-b border-white/5 bg-[#0f1115]/50">
                        <div className="flex p-1.5 bg-black/60 rounded-full border border-white/5 shadow-inner">
                            {(['inbox', 'enquiries'] as Tab[]).map(t => (
                                <button 
                                    key={t} onClick={() => handleTabSwitch(t)}
                                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] rounded-full transition-all duration-500 relative overflow-hidden group ${activeTab === t ? 'bg-[#1a1d24] text-primary shadow-2xl ring-1 ring-white/10 scale-[1.02]' : 'text-white/20 hover:text-white/40'}`}
                                >
                                    <span className="relative z-10">{t === 'inbox' ? 'Broadcasts' : 'Enquiries'}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto custom-scrollbar bg-black/20">
                        {activeTab === 'inbox' ? (
                            announcements.length === 0 ? <EmptyState type="inbox" /> : announcements.map((msg) => (
                                <button 
                                    key={msg.id} onClick={() => { setSelectedAnnouncement(msg); setIsMobileDetailOpen(true); }}
                                    className={`w-full text-left p-10 border-b border-white/5 transition-all duration-500 group relative overflow-hidden active:scale-[0.98] ${selectedAnnouncement?.id === msg.id ? 'bg-[#12141a] z-10 shadow-2xl' : 'hover:bg-white/[0.02]'}`}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg border transition-colors ${selectedAnnouncement?.id === msg.id ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white/5 border-white/5 text-white/20'}`}>
                                                <MegaphoneIcon className="w-4 h-4" />
                                            </div>
                                            <h4 className={`font-black text-[10px] uppercase tracking-[0.3em] transition-colors ${selectedAnnouncement?.id === msg.id ? 'text-primary' : 'text-white/30'}`}>{msg.sender_name || 'AUTHORITY'}</h4>
                                        </div>
                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{formatTimeAgo(msg.sent_at)}</span>
                                    </div>
                                    <p className={`text-xl font-serif font-black tracking-tight truncate mb-3 transition-colors ${selectedAnnouncement?.id === msg.id ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>{msg.subject}</p>
                                    <p className="text-[14px] text-white/20 line-clamp-2 leading-relaxed font-medium italic font-serif group-hover:text-white/40 transition-colors">{msg.body}</p>
                                    {selectedAnnouncement?.id === msg.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_20px_rgba(var(--primary),0.8)] animate-in slide-in-from-left-8"></div>}
                                </button>
                            ))
                        ) : (
                            enquiries.length === 0 ? <EmptyState type="enquiries" /> : enquiries.map(enq => (
                                <button 
                                    key={enq.id} onClick={() => { setSelectedEnquiry(enq); setIsMobileDetailOpen(true); }}
                                    className={`w-full text-left p-10 border-b border-white/5 transition-all duration-500 group relative overflow-hidden active:scale-[0.98] ${selectedEnquiry?.id === enq.id ? 'bg-[#12141a] z-10 shadow-2xl' : 'hover:bg-white/[0.02]'}`}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                             <div className={`p-2 rounded-lg border transition-colors ${selectedEnquiry?.id === enq.id ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-white/5 border-white/5 text-white/20'}`}>
                                                <CommunicationIcon className="w-4 h-4" />
                                            </div>
                                            <h4 className={`font-black text-[10px] uppercase tracking-[0.3em] transition-colors ${selectedEnquiry?.id === enq.id ? 'text-indigo-400' : 'text-white/30'}`}>{enq.applicant_name}</h4>
                                        </div>
                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{formatTimeAgo(enq.updated_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl border shadow-inner tracking-[0.2em] transition-all duration-700 ${statusColors[enq.status] || 'bg-white/5 text-white/20'}`}>
                                            {enq.status}
                                        </span>
                                        <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">Grade {enq.grade} Block</span>
                                    </div>
                                    {selectedEnquiry?.id === enq.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.8)] animate-in slide-in-from-left-8"></div>}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className={`flex-grow bg-[#09090b] flex flex-col transition-all duration-700 relative ${isMobileDetailOpen ? 'fixed inset-0 z-[60] lg:static' : 'hidden lg:flex'}`}>
                    {activeTab === 'inbox' ? (
                        selectedAnnouncement ? <AnnouncementDetail announcement={selectedAnnouncement} onClose={() => setIsMobileDetailOpen(false)} /> : <ReadingStandby type="inbox" />
                    ) : (
                        selectedEnquiry ? <ConversationView enquiry={selectedEnquiry} onBack={() => setIsMobileDetailOpen(false)} refreshEnquiries={fetchData} /> : <ReadingStandby type="enquiries" />
                    )}
                </div>
            </div>
        </div>
    );
};

const EmptyState = ({ type }: { type: Tab }) => (
    <div className="flex flex-col items-center justify-center py-48 px-12 text-center opacity-40 animate-in fade-in duration-1000">
        <div className="w-24 h-24 bg-white/[0.02] rounded-[2.5rem] flex items-center justify-center mb-10 border border-white/5 shadow-inner">
            {type === 'inbox' ? <MegaphoneIcon className="w-12 h-12 text-white/10" /> : <SearchIcon className="w-12 h-12 text-white/10" />}
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.6em] text-white">Registry Standby</p>
        <p className="text-[16px] mt-6 font-serif italic text-white/30 max-w-xs mx-auto leading-relaxed">No active telemetry detected for this node.</p>
    </div>
);

const ReadingStandby = ({ type }: { type: Tab }) => (
    <div className="flex flex-col items-center justify-center h-full p-24 text-center animate-in fade-in zoom-in-95 duration-1000">
        <div className="w-40 h-40 bg-white/[0.01] rounded-[4rem] flex items-center justify-center mb-16 border border-white/5 shadow-[0_64px_128px_-12px_rgba(0,0,0,0.8)] relative group overflow-hidden">
            {type === 'inbox' ? <MegaphoneIcon className="w-20 h-20 text-white/10 group-hover:text-primary group-hover:scale-110 transition-all duration-700" /> : <CommunicationIcon className="w-20 h-20 text-white/10 group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-700" />}
        </div>
        <h3 className="text-5xl font-serif font-black text-white tracking-tighter uppercase leading-none mb-8">Enquiry Payload <span className="text-white/20 italic">Standby.</span></h3>
        <p className="text-white/40 text-[20px] font-medium leading-relaxed italic max-w-sm font-serif">Select a node from the registry to decrypt and establish an institutional handshake.</p>
    </div>
);

const AnnouncementDetail = ({ announcement, onClose }: any) => (
    <div className="flex flex-col h-full animate-in slide-in-from-right-12 duration-1000 relative z-10">
         <div className="px-10 md:px-20 py-10 md:py-16 border-b border-white/5 bg-[#0f1115]/90 backdrop-blur-3xl flex justify-between items-center relative z-20 shadow-2xl">
            <div className="flex items-center gap-10">
                <button onClick={onClose} className="lg:hidden p-5 -ml-6 rounded-3xl bg-white/5 text-white/30 hover:text-white transition-all active:scale-95"><ChevronLeftIcon className="h-8 w-8"/></button>
                <div>
                    <h3 className="text-[12px] font-black text-primary uppercase tracking-[0.5em] leading-none mb-2">Authenticated Broadcast</h3>
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{formatTimeAgo(announcement.sent_at)} • ID: {announcement.id?.slice(0,12)}</p>
                </div>
            </div>
            <button onClick={onClose} className="p-4 rounded-3xl bg-white/5 text-white/20 hover:text-white transition-all"><XIcon className="w-8 h-8"/></button>
         </div>
         
         <div className="flex-grow overflow-y-auto p-10 md:p-24 lg:p-32 custom-scrollbar bg-transparent">
             <div className="max-w-4xl mx-auto space-y-24">
                <div className="flex items-center gap-10 group">
                    <div className="w-24 h-24 rounded-[2.2rem] bg-gradient-to-br from-primary/30 to-indigo-700/30 text-white flex items-center justify-center text-4xl font-serif font-black shadow-[0_32px_64px_rgba(0,0,0,0.6)] border border-white/10 transition-transform group-hover:rotate-6 duration-700">
                        {announcement.sender_name?.[0] || 'A'}
                    </div>
                    <div>
                        <h2 className="text-4xl font-serif font-black text-white leading-none tracking-tighter uppercase">{announcement.sender_name || 'INSTITUTIONAL HUB'}</h2>
                        <p className="text-[12px] font-black text-primary uppercase tracking-[0.5em] mt-4 bg-primary/5 px-4 py-2 rounded-xl border border-primary/20 w-fit">{announcement.sender_role || 'SYSTEM NODE'}</p>
                    </div>
                </div>

                <div className="space-y-16">
                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-black text-white leading-[0.9] tracking-tighter uppercase drop-shadow-2xl">
                        {announcement.subject}
                    </h1>
                    <div className="w-40 h-2.5 bg-gradient-to-r from-primary to-transparent rounded-full opacity-40 shadow-[0_0_20px_rgba(var(--primary),0.3)]"></div>
                    <div className="text-white/60 text-[24px] md:text-[28px] leading-loose font-serif italic border-l-4 border-white/5 pl-16 whitespace-pre-wrap selection:bg-primary/20 selection:text-primary">
                        {announcement.body}
                    </div>
                </div>
                
                <div className="pt-32 opacity-10 hover:opacity-100 transition-opacity duration-1000 border-t border-white/5">
                    <div className="flex items-center gap-6 text-[11px] font-black uppercase tracking-[0.6em] text-white">
                        <ShieldCheckIcon className="w-6 h-6 text-emerald-500" /> Integrity Confirmed • Gurukul OS v17
                    </div>
                </div>
             </div>
         </div>
    </div>
);

const ConversationView = ({ enquiry, onBack, refreshEnquiries }: any) => {
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const primaryId = (enquiry.id).toString();

    const fetchTimeline = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase.rpc('get_enquiry_timeline', { p_enquiry_id: primaryId });
        if (data) setTimeline(data);
        setLoading(false);
    }, [primaryId]);

    useEffect(() => { 
        fetchTimeline(); 
        const channel = supabase.channel(`parent-enq-view-${primaryId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiry_messages', filter: `admission_id=eq.${primaryId}` }, () => fetchTimeline())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchTimeline, primaryId]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [timeline]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;
        setSending(true);
        const { error } = await supabase.rpc('send_enquiry_message', { p_enquiry_id: primaryId, p_message: newMessage });
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
        <div className="flex flex-col h-full animate-in slide-in-from-right-12 duration-1000 relative z-10">
            <header className="p-10 md:p-16 border-b border-white/5 bg-[#0f1115]/95 backdrop-blur-3xl flex items-center justify-between shadow-2xl relative z-20">
                <div className="flex items-center gap-10">
                    <button onClick={onBack} className="p-5 -ml-6 rounded-3xl bg-white/5 text-white/30 hover:text-white transition-all active:scale-95"><ChevronLeftIcon className="h-8 w-8"/></button>
                    <div className="min-w-0">
                        <h3 className="font-serif font-black text-3xl md:text-5xl text-white truncate uppercase tracking-tighter leading-none">{enquiry.applicant_name}</h3>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mt-5">HANDSHAKE NODE: GRADE {enquiry.grade} BLOCK</p>
                    </div>
                </div>
                <span className={`text-[11px] font-black uppercase px-8 py-4 rounded-2xl border shadow-3xl backdrop-blur-3xl tracking-[0.3em] ${statusColors[enquiry.status] || 'bg-white/5 text-white/20'}`}>
                    {enquiry.status}
                </span>
            </header>

            <div ref={scrollRef} className="flex-grow overflow-y-auto p-10 md:p-24 space-y-12 bg-black/40 custom-scrollbar relative">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <Spinner className="text-indigo-400" size="lg" />
                    </div>
                ) : timeline.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-white/10 text-center space-y-10">
                        <CommunicationIcon className="w-24 h-24 opacity-10" />
                        <p className="font-serif italic text-2xl max-w-sm leading-relaxed text-white/20">Handshake initialized. Awaiting system response.</p>
                    </div>
                ) : timeline.map((item, idx) => (
                    <div key={idx} className={`flex ${item.is_admin ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-4 duration-700`} style={{ animationDelay: `${idx * 30}ms` }}>
                         <div className={`max-w-[85%] md:max-w-[70%] p-8 md:p-12 rounded-[3rem] text-[18px] md:text-[20px] leading-loose shadow-3xl ring-1 ring-white/5 ${
                            !item.is_admin 
                            ? 'bg-[#1a1d23]/90 backdrop-blur-3xl text-white/70 rounded-br-none' 
                            : 'bg-gradient-to-br from-primary to-indigo-700 text-white rounded-bl-none'
                         }`}>
                             <p className="font-serif italic">{item.details.message}</p>
                             <div className={`text-[10px] font-black uppercase mt-10 tracking-[0.4em] opacity-40 border-t border-white/5 pt-6 flex items-center gap-3 ${!item.is_admin ? 'justify-end' : 'justify-start'}`}>
                                {item.created_by_name} • {formatTimeAgo(item.created_at)}
                             </div>
                         </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-10 md:p-16 border-t border-white/5 bg-[#0f1115]/98 backdrop-blur-3xl flex gap-8 z-20">
                <input 
                    type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type payload here..."
                    className="flex-grow p-7 md:p-10 rounded-[2.5rem] md:rounded-[3rem] bg-black/60 border border-white/10 text-white placeholder:text-white/5 focus:border-primary/50 outline-none transition-all font-serif italic text-xl md:text-2xl"
                />
                <button 
                    type="submit" disabled={!newMessage.trim() || sending} 
                    className="h-20 w-20 md:h-28 md:w-28 bg-primary text-white flex items-center justify-center rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl hover:bg-primary/90 active:scale-95 disabled:opacity-20"
                >
                    {sending ? <Spinner size="md" className="text-white" /> : <LocalSendIcon className="w-10 h-10" />}
                </button>
            </form>
        </div>
    );
};

export default MessagesTab;

