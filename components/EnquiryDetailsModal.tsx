import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, formatError } from '../services/supabase';
import { Enquiry, TimelineItem, EnquiryStatus } from '../types';
import Spinner from './common/Spinner';
import { XIcon } from './icons/XIcon';
import { RequestDocumentsModal } from './AdmissionsTab';
import { PaperClipIcon } from './icons/PaperClipIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { UserIcon } from './icons/UserIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { ClockIcon } from './icons/ClockIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon'; 
import { SearchIcon } from './icons/SearchIcon';
import { SchoolIcon } from './icons/SchoolIcon';
import { MailIcon } from './icons/MailIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { EditIcon } from './icons/EditIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';

// --- Icons & Constants ---

const LocalSendIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

const STATUS_CONFIG: Record<EnquiryStatus, { icon: React.ReactNode, label: string, color: string, ring: string, bg: string }> = {
    'New': { icon: <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.5)]"/>, label: 'New Enquiry', color: 'text-purple-700', ring: 'ring-purple-600', bg: 'bg-purple-50' },
    'Contacted': { icon: <MegaphoneIcon className="w-4 h-4"/>, label: 'Contacted', color: 'text-amber-700', ring: 'ring-amber-500', bg: 'bg-amber-50' },
    'In Review': { icon: <SearchIcon className="w-4 h-4"/>, label: 'In Review', color: 'text-blue-700', ring: 'ring-blue-500', bg: 'bg-blue-50' },
    'Completed': { icon: <CheckCircleIcon className="w-4 h-4"/>, label: 'Converted', color: 'text-emerald-700', ring: 'ring-emerald-500', bg: 'bg-emerald-50' },
};

const ORDERED_STATUSES: EnquiryStatus[] = ['New', 'Contacted', 'In Review', 'Completed'];

// --- Helper Components ---

const WorkflowStageSelector: React.FC<{ 
    currentStatus: EnquiryStatus, 
    onChange: (status: EnquiryStatus) => void,
    disabled?: boolean 
}> = ({ currentStatus, onChange, disabled }) => {
    const currentIndex = ORDERED_STATUSES.indexOf(currentStatus);

    return (
        <div className="w-full relative py-4 select-none">
            {/* Progress Bar Background */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-muted/60 -z-10 rounded-full transform -translate-y-1/2"></div>
            
            {/* Active Progress Bar */}
            <div 
                className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-600 -z-10 rounded-full transition-all duration-700 ease-out transform -translate-y-1/2"
                style={{ width: `${(currentIndex / (ORDERED_STATUSES.length - 1)) * 100}%` }}
            ></div>

            <div className="flex justify-between items-center w-full relative px-1">
                {ORDERED_STATUSES.map((step, index) => {
                    const isActive = index === currentIndex;
                    const isCompleted = index < currentIndex;
                    const config = STATUS_CONFIG[step];

                    return (
                        <button
                            key={step}
                            onClick={() => !disabled && onChange(step)}
                            disabled={disabled}
                            className={`
                                flex flex-col items-center gap-2 group focus:outline-none transition-all duration-300 transform
                                ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:-translate-y-1'}
                            `}
                        >
                            <div 
                                className={`
                                    w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 z-10 shadow-sm
                                    ${isActive 
                                        ? `bg-background ${config.ring} ring-2 ring-offset-2 ring-offset-background scale-110 shadow-lg` 
                                        : isCompleted 
                                            ? `bg-indigo-600 border-indigo-600 text-white shadow-md` 
                                            : 'bg-card border-muted text-muted-foreground'
                                    }
                                `}
                            >
                                {isCompleted ? <CheckCircleIcon className="w-4 h-4 md:w-5 md:h-5"/> : (isActive ? config.icon : <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>)}
                            </div>
                            <span 
                                className={`
                                    absolute top-10 md:top-12 text-[9px] md:text-[10px] font-extrabold uppercase tracking-widest transition-all duration-300 whitespace-nowrap
                                    ${isActive ? 'text-primary translate-y-0 opacity-100 scale-100' : 'text-muted-foreground translate-y-1 opacity-0 scale-90 group-hover:opacity-100 group-hover:translate-y-0'}
                                `}
                            >
                                {config.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const TimelineEvent: React.FC<{ item: TimelineItem }> = ({ item }) => {
    let content = null;
    let icon = <ClockIcon className="w-3 h-3"/>;
    let containerClass = "bg-muted/30 border-border/40 text-muted-foreground";
    
    switch (item.details.type) {
        case 'STATUS_CHANGE':
            content = <span>Status updated to <span className="font-bold text-foreground">{item.details.data?.new}</span></span>;
            icon = <CheckCircleIcon className="w-3 h-3 text-primary"/>;
            containerClass = "bg-primary/5 border-primary/10 text-primary/80";
            break;
        case 'NOTE_ADDED':
            content = <span>Added an internal note.</span>;
             icon = <ClipboardListIcon className="w-3 h-3 text-amber-500"/>;
             containerClass = "bg-amber-50/50 border-amber-100 text-amber-700/80 dark:bg-amber-900/10 dark:border-amber-800 dark:text-amber-400";
            break;
        case 'ADMISSION_STATUS_CHANGE':
            content = <span>Admission status: <span className="font-bold text-foreground">{item.details.data?.status}</span></span>;
            break;
        case 'DOCUMENTS_REQUESTED':
            const docs = item.details.data?.documents as string[] || [];
            const message = item.details.data?.message;
            return (
                <div className="flex justify-center my-6 animate-in fade-in zoom-in-95 duration-300 w-full">
                    <div className="bg-card border border-border p-5 rounded-2xl shadow-sm max-w-sm w-full relative overflow-hidden group">
                         <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 transition-all group-hover:w-1.5"></div>
                         <div className="flex items-center gap-2 mb-3 text-blue-600">
                            <PaperClipIcon className="w-4 h-4"/>
                            <span className="text-xs font-bold uppercase tracking-widest">Document Request</span>
                         </div>
                        <p className="text-sm text-foreground mb-3">
                            <span className="font-semibold">{item.created_by_name}</span> requested verification:
                        </p>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {docs.map((doc, i) => (
                                <span key={i} className="text-[10px] font-bold px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded border border-blue-100 dark:border-blue-800">
                                    {doc}
                                </span>
                            ))}
                        </div>
                        {message && <p className="text-xs text-muted-foreground mt-3 italic border-t border-border/50 pt-2">"{message}"</p>}
                         <p className="text-[10px] text-muted-foreground text-right mt-3 opacity-60">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                </div>
            );
        default:
            return null;
    }
    
    if (!content) return null;

    return (
        <div className="flex justify-center my-4 animate-in fade-in slide-in-from-bottom-2 w-full">
            <span className={`flex items-center gap-2 text-[11px] font-medium px-4 py-1.5 rounded-full border shadow-sm ${containerClass}`}>
                {icon}
                <span>
                    <span className="font-bold opacity-100">{item.created_by_name}</span> {content}
                </span>
                <span className="opacity-40 mx-1">•</span>
                <span className="opacity-70">{new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </span>
        </div>
    );
};

const EditableInput: React.FC<{ 
    label: string, 
    value: string, 
    name: string, 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    icon?: React.ReactNode,
    type?: string,
    placeholder?: string
}> = ({ label, value, name, onChange, icon, type = "text", placeholder }) => (
    <div className="group relative">
        <label className="block text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 ml-1 group-focus-within:text-primary transition-colors">{label}</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                {icon}
            </div>
            <input 
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full pl-11 pr-10 py-3 bg-muted/30 border border-transparent hover:border-border/60 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-xl text-sm font-medium transition-all outline-none shadow-sm"
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <EditIcon className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
        </div>
    </div>
);

interface EnquiryDetailsModalProps {
    enquiry: Enquiry;
    onClose: () => void;
    onUpdate: () => void;
    onNavigate?: (component: string) => void;
    currentBranchId?: number | null; 
}

const EnquiryDetailsModal: React.FC<EnquiryDetailsModalProps> = ({ enquiry, onClose, onUpdate, onNavigate, currentBranchId }) => {
    // Core State
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    
    // Form Data State
    const [formData, setFormData] = useState({
        status: enquiry.status,
        notes: enquiry.notes || '',
        applicant_name: enquiry.applicant_name || '',
        grade: enquiry.grade || '',
        // Parent fields
        parent_name: enquiry.parent_name || '',
        parent_email: enquiry.parent_email || '',
        parent_phone: enquiry.parent_phone || '',
    });

    const [guardianRelationship, setGuardianRelationship] = useState<string>('');
    const [newMessage, setNewMessage] = useState('');
    const [currentAdmissionId, setCurrentAdmissionId] = useState<string | null>(enquiry.admission_id || null);
    
    // UI/UX State
    const [loading, setLoading] = useState({ timeline: true, saving: false, sending: false });
    const [isRequestDocsModalOpen, setIsRequestDocsModalOpen] = useState(false);
    const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

    const commsEndRef = useRef<HTMLDivElement>(null);

    // Initial Fetch & Auto-Populate Parent Data logic
    useEffect(() => {
        const loadLinkedData = async () => {
            if (enquiry.admission_id) {
                const { data: admission } = await supabase
                    .from('admissions')
                    .select('parent_id, parent_name, parent_email, parent_phone')
                    .eq('id', enquiry.admission_id)
                    .single();
                
                if (admission) {
                    let fetchedName = admission.parent_name;
                    let fetchedEmail = admission.parent_email;
                    let fetchedPhone = admission.parent_phone;
                    let fetchedRelationship = '';

                    if (admission.parent_id) {
                         const { data: userProfile } = await supabase.from('profiles').select('display_name, email, phone').eq('id', admission.parent_id).single();
                         if (userProfile) {
                            fetchedName = userProfile.display_name || fetchedName;
                            fetchedEmail = userProfile.email || fetchedEmail;
                            fetchedPhone = userProfile.phone || fetchedPhone;
                        }
                         const { data: parentProfile } = await supabase.from('parent_profiles').select('relationship_to_student').eq('user_id', admission.parent_id).single();
                         if (parentProfile) {
                             fetchedRelationship = parentProfile.relationship_to_student || '';
                         }
                    }
                    setGuardianRelationship(fetchedRelationship);
                    setFormData(prev => ({
                        ...prev,
                        parent_name: prev.parent_name || fetchedName || '',
                        parent_email: prev.parent_email || fetchedEmail || '',
                        parent_phone: prev.parent_phone || fetchedPhone || '',
                    }));
                }
            }
        };
        loadLinkedData();
    }, [enquiry.admission_id]);

    const fetchTimeline = useCallback(async () => {
        if (!enquiry.id) return;
        setLoading(prev => ({ ...prev, timeline: true }));
        try {
            const { data, error } = await supabase.rpc('get_enquiry_timeline', { p_enquiry_id: enquiry.id });
            if (!error) setTimeline(data || []);
        } catch (e) {
            console.error("Timeline fetch error", formatError(e));
        } finally {
            setLoading(prev => ({ ...prev, timeline: false }));
        }
    }, [enquiry.id]);

    useEffect(() => {
        fetchTimeline();
    }, [fetchTimeline]);
    
    useEffect(() => {
        if (commsEndRef.current) {
            commsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [timeline, loading.timeline]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (closeOnSuccess: boolean = false): Promise<boolean> => {
        if (formData.parent_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parent_email)) {
            alert("Please enter a valid email address.");
            return false;
        }

        setLoading(prev => ({ ...prev, saving: true }));
        setSaveSuccessMessage(null);

        try {
            const { error: statusError } = await supabase.rpc('update_enquiry_status', { p_enquiry_id: enquiry.id, p_new_status: formData.status, p_notes: formData.notes });
            if (statusError) throw statusError;

            const { error: detailsError } = await supabase.from('enquiries').update({ applicant_name: formData.applicant_name, grade: formData.grade, parent_name: formData.parent_name, parent_email: formData.parent_email, parent_phone: formData.parent_phone }).eq('id', enquiry.id);
            if (detailsError) throw detailsError;
            
            if (currentAdmissionId) {
                 const { error: admError } = await supabase.from('admissions').update({ applicant_name: formData.applicant_name, grade: formData.grade, parent_name: formData.parent_name, parent_email: formData.parent_email, parent_phone: formData.parent_phone }).eq('id', currentAdmissionId);
                 if (admError) console.warn("Failed to sync admission record:", formatError(admError));
            }

            onUpdate();
            await fetchTimeline(); 
            
            if (closeOnSuccess) {
                onClose();
            } else {
                setSaveSuccessMessage("Saved successfully.");
                setTimeout(() => setSaveSuccessMessage(null), 3000);
            }
            return true;
        } catch (error: any) {
            alert(`Failed to save: ${formatError(error)}`);
            return false;
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        setLoading(prev => ({ ...prev, sending: true }));
        const { error } = await supabase.rpc('send_enquiry_message', { p_enquiry_id: enquiry.id, p_message: newMessage });
        if (error) {
            alert(`Failed to send message: ${formatError(error)}`);
        } else {
            setNewMessage('');
            await fetchTimeline();
            onUpdate(); 
        }
        setLoading(prev => ({ ...prev, sending: false }));
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-50 p-4 transition-opacity duration-300" onClick={onClose}>
                <div 
                    className="bg-background rounded-[2rem] shadow-2xl w-full max-w-[1400px] h-[92vh] flex flex-col border border-border/40 overflow-hidden animate-in slide-in-from-bottom-4 duration-300 ring-1 ring-white/10" 
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <header className="px-6 py-4 border-b border-border bg-card/80 backdrop-blur-xl flex-shrink-0 flex justify-between items-center z-30">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                <ClipboardListIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-foreground flex items-center gap-3 tracking-tight">
                                    {enquiry.applicant_name}
                                    <span className="text-[10px] font-mono font-bold text-muted-foreground px-2 py-0.5 bg-muted rounded-md border border-border uppercase tracking-wider">ID: {enquiry.id}</span>
                                </h2>
                                <p className="text-xs text-muted-foreground font-bold mt-0.5 uppercase tracking-wider opacity-80">Enquiry Details & Workflow</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-3 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
                            aria-label="Close modal"
                        >
                            <XIcon className="w-5 h-5"/>
                        </button>
                    </header>
                    
                    {/* Content Container */}
                    <div className="flex-grow flex flex-col lg:flex-row overflow-hidden bg-background relative">
                        
                        {/* LEFT PANE: CONVERSATION */}
                        <div className="flex-1 flex flex-col min-w-0 border-r border-border/60 bg-[#F8FAFC] dark:bg-black/20 relative order-2 lg:order-1">
                            <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
                                {loading.timeline ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-3">
                                        <Spinner />
                                        <p className="text-xs font-medium animate-pulse">Loading conversation history...</p>
                                    </div>
                                ) : timeline.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground/60 p-8 text-center">
                                        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-border/60">
                                            <ClipboardListIcon className="w-8 h-8 opacity-40" />
                                        </div>
                                        <p className="text-sm font-semibold text-foreground/80">No conversation history.</p>
                                        <p className="text-xs mt-1">Start chatting with the parent below.</p>
                                    </div>
                                ) : (
                                    timeline.map((item) =>
                                        item.item_type === 'MESSAGE' ? (
                                            <div key={`msg-${item.id}`} className={`flex flex-col ${item.is_admin ? 'items-end' : 'items-start'} w-full animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                                <div className={`max-w-[85%] lg:max-w-[75%] p-4 rounded-[1.25rem] text-sm leading-relaxed shadow-sm relative group transition-all hover:shadow-md ${
                                                    item.is_admin 
                                                    ? 'bg-gradient-to-br from-primary to-indigo-600 text-white rounded-br-none shadow-primary/10' 
                                                    : 'bg-white dark:bg-card border border-border/60 text-foreground rounded-bl-none shadow-black/5'
                                                }`}>
                                                    <p className="whitespace-pre-wrap">{item.details.message}</p>
                                                    <span className={`text-[9px] absolute -bottom-5 ${item.is_admin ? 'right-1' : 'left-1'} text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-medium`}>
                                                        {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : <TimelineEvent key={`evt-${item.id}`} item={item} />
                                    )
                                )}
                                <div ref={commsEndRef} className="h-4" />
                            </div>
                            
                            <div className="p-4 bg-card border-t border-border z-10 shadow-lg">
                                <form onSubmit={handleSendMessage} className="relative flex gap-3 items-end">
                                    <div className="relative flex-grow">
                                        <textarea 
                                            value={newMessage} 
                                            onChange={(e) => setNewMessage(e.target.value)} 
                                            placeholder="Type a message to the parent..." 
                                            className="w-full p-3.5 pr-12 bg-muted/30 border border-input rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none text-sm min-h-[52px] max-h-[150px] shadow-inner focus:bg-background"
                                            rows={1}
                                            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }}}
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={loading.sending || !newMessage.trim()} 
                                        className="h-[52px] w-[52px] bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center flex-shrink-0"
                                    >
                                        {loading.sending ? <Spinner size="sm" className="text-white"/> : <LocalSendIcon className="w-5 h-5" />}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* RIGHT PANE: DETAILS & WORKFLOW */}
                        <div className="w-full lg:w-[420px] xl:w-[480px] bg-card border-l border-border flex flex-col h-full overflow-y-auto custom-scrollbar order-1 lg:order-2 z-10 shadow-xl lg:shadow-none">
                            <div className="p-6 md:p-8 space-y-8">
                                
                                {/* Status Stepper */}
                                <section>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                                            <ClockIcon className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-xs font-extrabold text-foreground uppercase tracking-widest">
                                            Workflow Status
                                        </h3>
                                    </div>
                                    <div className="bg-muted/30 rounded-[1.5rem] border border-border/60 shadow-sm overflow-hidden p-1">
                                        <WorkflowStageSelector 
                                            currentStatus={formData.status} 
                                            onChange={(newStatus) => setFormData(prev => ({ ...prev, status: newStatus }))} 
                                            disabled={enquiry.status === 'Completed'}
                                        />
                                    </div>
                                </section>

                                {/* Admin Notes */}
                                <section className="bg-amber-50/50 dark:bg-amber-900/10 rounded-[1.5rem] p-6 border border-amber-200/50 dark:border-amber-800/30 shadow-sm relative group focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-xs font-bold text-amber-800 dark:text-amber-500 uppercase tracking-wide flex items-center gap-2">
                                            <ClipboardListIcon className="w-4 h-4" /> Internal Notes
                                        </label>
                                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100/50 dark:bg-amber-900/40 ${formData.notes.length > 500 ? 'text-red-500' : 'text-amber-700/60'}`}>
                                            {formData.notes.length} chars
                                        </span>
                                    </div>
                                    <textarea 
                                        name="notes"
                                        value={formData.notes} 
                                        onChange={handleFormChange} 
                                        rows={4} 
                                        className="w-full bg-white/60 dark:bg-black/20 border border-amber-200/60 dark:border-amber-800/50 rounded-xl p-4 text-sm focus:border-amber-500 outline-none shadow-sm resize-none placeholder:text-muted-foreground/50 transition-all text-foreground leading-relaxed custom-scrollbar" 
                                        placeholder="Add private notes for the admissions team..."
                                    ></textarea>
                                </section>

                                <div className="w-full h-px bg-border/60"></div>

                                {/* Applicant Details */}
                                <section className="space-y-6">
                                    <h3 className="text-xs font-extrabold text-foreground uppercase tracking-widest flex items-center gap-3">
                                        <div className="p-1.5 bg-blue-100 text-blue-600 dark:bg-blue-900/20 rounded-md">
                                            <UserIcon className="w-3.5 h-3.5" /> 
                                        </div>
                                        Applicant Profile
                                    </h3>
                                    <div className="space-y-4 px-1">
                                        <EditableInput label="Full Name" name="applicant_name" value={formData.applicant_name} onChange={handleFormChange} icon={<UserIcon className="w-4 h-4"/>} />
                                        <EditableInput label="Grade Applying For" name="grade" value={formData.grade} onChange={handleFormChange} icon={<SchoolIcon className="w-4 h-4"/>} />
                                    </div>
                                </section>
                                
                                {/* Guardian Details */}
                                <section className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xs font-extrabold text-foreground uppercase tracking-widest flex items-center gap-3">
                                            <div className="p-1.5 bg-purple-100 text-purple-600 dark:bg-purple-900/20 rounded-md">
                                                <PhoneIcon className="w-3.5 h-3.5" /> 
                                            </div>
                                            Guardian Contact
                                        </h3>
                                        {guardianRelationship && (
                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wide">
                                                {guardianRelationship}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-4 px-1">
                                        <EditableInput label="Primary Guardian Name" name="parent_name" value={formData.parent_name} onChange={handleFormChange} icon={<UserIcon className="w-4 h-4"/>} placeholder="e.g. John Doe"/>
                                        <EditableInput label="Email Address" name="parent_email" type="email" value={formData.parent_email} onChange={handleFormChange} icon={<MailIcon className="w-4 h-4"/>} placeholder="parent@example.com"/>
                                        <EditableInput label="Phone Number" name="parent_phone" type="tel" value={formData.parent_phone} onChange={handleFormChange} icon={<PhoneIcon className="w-4 h-4"/>} placeholder="+1 234 567 890"/>
                                    </div>
                                </section>
                            </div>
                            
                             {/* Footer inside right panel for easy access */}
                            <div className="p-6 border-t border-border bg-muted/10 flex flex-col gap-3 mt-auto">
                                {saveSuccessMessage && (
                                    <div className="px-4 py-2.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-xl text-xs font-bold flex items-center gap-2 justify-center shadow-sm animate-in slide-in-from-bottom-2 fade-in">
                                        <CheckCircleIcon className="w-4 h-4"/>
                                        <span>{saveSuccessMessage}</span>
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => handleSave(false)} 
                                        disabled={loading.saving} 
                                        className="flex-1 px-4 py-3 bg-background hover:bg-muted text-foreground font-bold rounded-xl text-xs transition-colors border border-border/80 shadow-sm"
                                    >
                                        {loading.saving ? <Spinner size="sm" /> : 'Save Changes'}
                                    </button>
                                    <button 
                                        onClick={() => handleSave(true)} 
                                        disabled={loading.saving} 
                                        className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs shadow-md transition-all active:scale-95"
                                    >
                                        Save & Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isRequestDocsModalOpen && currentAdmissionId && (
                <RequestDocumentsModal 
                    admissionId={currentAdmissionId}
                    applicantName={enquiry.applicant_name}
                    onClose={() => {
                        setIsRequestDocsModalOpen(false);
                        onClose();
                    }}
                    onSuccess={() => {
                        setIsRequestDocsModalOpen(false);
                        onClose();
                        onUpdate();
                    }}
                />
            )}
        </>
    );
};

export default EnquiryDetailsModal;
