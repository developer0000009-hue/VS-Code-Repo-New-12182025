import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { useRoles } from '../../contexts/RoleContext';
import { Communication, Role, BuiltInRoles, SchoolClass } from '../../types';
import Spinner from '../common/Spinner';
import { ParentIcon } from '../icons/ParentIcon';
import { StudentIcon } from '../icons/StudentIcon';
import { TeacherIcon } from '../icons/TeacherIcon';
import { TransportIcon } from '../icons/TransportIcon';
import { CartIcon } from '../icons/CartIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { MegaphoneIcon } from '../icons/MegaphoneIcon';
import { FunctionComponentWithIcon } from '../../types';

// --- ICONS ---
const SendIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);
const RefreshIcon: React.FC<React.SVGProps<SVGSVGElement> & { onClick?: () => void }> = (props) => (
     <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.18-3.185m-3.181 9.348a8.25 8.25 0 00-11.664 0l-3.18 3.185m3.181-9.348l-3.18-3.183a8.25 8.25 0 00-11.664 0l-3.18 3.185" />
    </svg>
);
const ClockIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

const ROLE_ICONS_MAP: Record<string, React.FC<{className?: string}>> = {
    [BuiltInRoles.PARENT_GUARDIAN]: ParentIcon,
    [BuiltInRoles.STUDENT]: StudentIcon,
    [BuiltInRoles.TEACHER]: TeacherIcon,
    [BuiltInRoles.TRANSPORT_STAFF]: TransportIcon,
    [BuiltInRoles.ECOMMERCE_OPERATOR]: CartIcon,
    'default': ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
};

const TEMPLATES = [
    { id: 1, name: 'General Reminder', subject: 'Class Update', body: 'Dear Parent,\n\nPlease note the following update regarding our upcoming class activities.' },
    { id: 2, name: 'Homework Alert', subject: 'New Assignment Posted', body: 'Dear Student/Parent,\n\nA new assignment has been posted for the class. Please check the portal for instructions.' },
];

const CommunicationTab: FunctionComponentWithIcon<{ currentUserId: string }> = ({ currentUserId }) => {
    const { roles } = useRoles();
    
    const [selectedRoles, setSelectedRoles] = useState<Set<Role>>(new Set());
    const [targetType, setTargetType] = useState<'roles' | 'class'>('roles');
    const [selectedClass, setSelectedClass] = useState<string>('');
    
    const [history, setHistory] = useState<Communication[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [loading, setLoading] = useState({ sending: false, fetching: true, classes: false });
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

    const communicationRoles = useMemo(() => roles.filter(r => r !== BuiltInRoles.SCHOOL_ADMINISTRATION), [roles]);

    const fetchHistory = useCallback(async () => {
        setLoading(prev => ({ ...prev, fetching: true }));
        try {
            const { data, error } = await supabase.rpc('get_communications_history');
            if (error) throw error;
            setHistory(data || []);
        } catch (err) {
            console.error("Fetch history failure:", err);
        } finally {
            setLoading(prev => ({ ...prev, fetching: false }));
        }
    }, []);

    const fetchClasses = useCallback(async () => {
        setLoading(prev => ({ ...prev, classes: true }));
        try {
            const { data, error } = await supabase.rpc('get_teacher_classes');
            if (error) throw error;
            setClasses(data || []);
        } catch (err) {
            console.error("Fetch classes failure:", err);
        } finally {
            setLoading(prev => ({ ...prev, classes: false }));
        }
    }, []);

    useEffect(() => {
        fetchHistory();
        fetchClasses();
    }, [fetchHistory, fetchClasses]);

    const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const templateId = parseInt(e.target.value);
        const template = TEMPLATES.find(t => t.id === templateId);
        if (template) {
            setSubject(template.subject);
            setBody(template.body);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);
        
        if (!subject.trim() || !body.trim()) {
             setErrorMessage('Please enter a subject and message body.');
             return;
        }
        
        let criteria = {};
        let recipients: string[] = [];

        if (targetType === 'roles') {
            if (selectedRoles.size === 0) {
                setErrorMessage('Please select at least one recipient role.');
                return;
            }
            recipients = Array.from(selectedRoles);
            criteria = { type: 'role', value: 'custom' };
        } else if (targetType === 'class') {
            if (!selectedClass) {
                setErrorMessage('Please select a class.');
                return;
            }
            const className = classes.find(c => c.id.toString() === selectedClass)?.name;
            criteria = { type: 'class', value: selectedClass, label: className };
            recipients = [BuiltInRoles.PARENT_GUARDIAN, BuiltInRoles.STUDENT]; 
        }

        setLoading(prev => ({ ...prev, sending: true }));

        try {
            const { error: rpcError } = await supabase.rpc('send_bulk_communication', {
                p_subject: subject,
                p_body: body,
                p_recipient_roles: recipients,
                p_target_criteria: criteria
            });

            if (rpcError) throw rpcError;

            setSuccessMessage('Message queued successfully!');
            setSubject('');
            setBody('');
            setSelectedRoles(new Set());
            setSelectedClass('');
            await fetchHistory();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            setErrorMessage(`Protocol Failure: ${err.message || "Communication link lost."}`);
        } finally {
            setLoading(prev => ({ ...prev, sending: false }));
        }
    };

    const toggleRole = (role: Role) => {
        setSelectedRoles(prev => {
            const newSet = new Set(prev);
            if (newSet.has(role)) newSet.delete(role);
            else newSet.add(role);
            return newSet;
        });
    };

    const toggleSelectAllRoles = () => {
        if (selectedRoles.size === communicationRoles.length) {
            setSelectedRoles(new Set());
        } else {
            setSelectedRoles(new Set(communicationRoles));
        }
    };

    const getRecipientSummary = () => {
        if (targetType === 'roles') {
            if (selectedRoles.size === 0) return 'Select recipients';
            return `Sending to ${selectedRoles.size} role${selectedRoles.size > 1 ? 's' : ''}`;
        } else {
            if (!selectedClass) return 'Select a class';
            const cls = classes.find(c => c.id.toString() === selectedClass);
            return cls ? `Sending to ${cls.name}` : 'Unknown Class';
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 h-[calc(100vh-8rem)] min-h-[600px]">
            {/* --- LEFT PANEL: COMPOSER --- */}
            <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-md flex flex-col overflow-hidden">
                <div className="p-5 border-b border-border bg-muted/10">
                    <h3 className="font-bold text-lg text-foreground">Compose Message</h3>
                    <p className="text-xs text-muted-foreground mt-1">Send class updates or alerts to parents.</p>
                </div>
                
                <form onSubmit={handleSendMessage} className="flex-grow flex flex-col overflow-hidden">
                    <div className="p-5 flex-grow flex flex-col space-y-5 overflow-y-auto custom-scrollbar">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-semibold text-foreground">Recipients</label>
                                <div className="flex bg-muted p-0.5 rounded-lg">
                                    <button type="button" onClick={() => setTargetType('roles')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${targetType === 'roles' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>By Role</button>
                                    <button type="button" onClick={() => setTargetType('class')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${targetType === 'class' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>By Class</button>
                                </div>
                            </div>

                            {targetType === 'roles' ? (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Select Groups:</span>
                                        <button type="button" onClick={toggleSelectAllRoles} className="text-xs text-primary hover:underline font-medium">
                                            {selectedRoles.size === communicationRoles.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {communicationRoles.map(role => (
                                            <label key={role} className={`cursor-pointer border rounded-full px-3 py-1.5 text-xs font-medium transition-all select-none flex items-center gap-1 ${selectedRoles.has(role) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/50'}`}>
                                                <input type="checkbox" className="hidden" checked={selectedRoles.has(role)} onChange={() => toggleRole(role)} />
                                                {selectedRoles.has(role) && <CheckCircleIcon className="w-3 h-3"/>}
                                                {role}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <select 
                                        value={selectedClass} 
                                        onChange={e => setSelectedClass(e.target.value)} 
                                        className="w-full input-premium"
                                    >
                                        <option value="" disabled>Select a Class...</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div>
                             <label className="text-sm font-semibold text-foreground mb-1.5 block">Use Template (Optional)</label>
                             <select onChange={handleTemplateSelect} defaultValue="" className="w-full input-premium">
                                 <option value="" disabled>Select a template...</option>
                                 {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                             </select>
                        </div>

                        <div>
                            <div className="flex justify-between mb-1.5">
                                <label className="text-sm font-semibold text-foreground">Subject</label>
                                <span className={`text-xs ${subject.length > 100 ? 'text-red-500' : 'text-muted-foreground'}`}>{subject.length}/128</span>
                            </div>
                            <input 
                                type="text" 
                                maxLength={128}
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                placeholder="e.g. Important Class Update"
                                className="w-full input-premium font-medium"
                            />
                        </div>

                        <div className="flex-grow flex flex-col">
                            <label className="text-sm font-semibold text-foreground mb-1.5">Message</label>
                            <div className="relative flex-grow min-h-[150px]">
                                <textarea 
                                    value={body}
                                    onChange={e => setBody(e.target.value)}
                                    placeholder="Type your message here..."
                                    className="w-full h-full min-h-[150px] p-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none text-sm leading-relaxed"
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 border-t border-border bg-muted/10">
                         {errorMessage && (
                            <div className="mb-3 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm border border-red-500/20 animate-in shake duration-300">
                               {errorMessage}
                            </div>
                        )}
                        {successMessage && (
                            <div className="mb-3 p-3 bg-green-500/10 text-green-500 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 border border-green-500/20">
                                <CheckCircleIcon className="w-4 h-4"/> {successMessage}
                            </div>
                        )}
                        
                        <div className="flex items-center justify-between mb-3">
                             <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest truncate max-w-[200px]">
                                {getRecipientSummary()}
                             </span>
                        </div>
                        <button 
                            type="submit"
                            disabled={loading.sending} 
                            className="w-full py-4 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
                        >
                            {loading.sending ? <Spinner size="sm" className="text-white"/> : <><SendIcon className="w-4 h-4" /> Send Message</>}
                        </button>
                    </div>
                </form>
            </div>

            {/* --- RIGHT PANEL: HISTORY --- */}
            <div className="lg:col-span-3 bg-card border border-border rounded-xl shadow-md flex flex-col overflow-hidden">
                <div className="p-5 border-b border-border flex justify-between items-center bg-muted/10">
                    <h3 className="font-bold text-lg text-foreground">History</h3>
                    <button onClick={fetchHistory} className={`p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors ${loading.fetching ? 'animate-spin' : ''}`}>
                        <RefreshIcon className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto p-5 space-y-4 bg-muted/5 custom-scrollbar">
                    {loading.fetching && history.length === 0 ? (
                        <div className="flex justify-center py-20"><Spinner size="lg" className="text-primary"/></div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-24 text-muted-foreground opacity-40">
                             <MegaphoneIcon className="w-12 h-12 mx-auto mb-4" />
                            <p className="font-bold text-lg">No history detected.</p>
                        </div>
                    ) : (
                        history.map((msg) => {
                             const isClassTarget = msg.target_criteria && msg.target_criteria.type === 'class';
                             const PrimaryRole = !isClassTarget && (msg.recipients && Array.isArray(msg.recipients) && msg.recipients[0]) ? msg.recipients[0] : 'default';
                             const IconComp = ROLE_ICONS_MAP[PrimaryRole] || ROLE_ICONS_MAP['default'];
                             const recipients = msg.recipients || [];
                             
                             return (
                                <div key={msg.id} className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-full bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                            {isClassTarget ? <div className="font-bold text-xs w-5 h-5 flex items-center justify-center border border-current rounded">C</div> : <IconComp className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-foreground truncate pr-2 text-base">{msg.subject}</h4>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                                                    msg.status === 'Sent' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                                    msg.status === 'Delivered' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                                    'bg-red-500/10 text-red-600 border-red-500/20'
                                                }`}>
                                                    {msg.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{msg.body}</p>
                                            
                                            <div className="mt-3 pt-3 border-t border-border flex flex-wrap justify-between items-center gap-2">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    {isClassTarget ? (
                                                        <span className="font-semibold bg-secondary/10 text-secondary-foreground px-2 py-0.5 rounded border border-secondary/20">
                                                            {msg.target_criteria.label ? `Class ${msg.target_criteria.label}` : `Class ID: ${msg.target_criteria.value}`}
                                                        </span>
                                                    ) : (
                                                        recipients.slice(0, 3).map(r => (
                                                            <span key={r} className="bg-muted px-2 py-0.5 rounded border border-border/50">{r}</span>
                                                        ))
                                                    )}
                                                    {!isClassTarget && recipients.length > 3 && <span>+{recipients.length - 3} more</span>}
                                                </div>
                                                <div className="flex items-center text-xs text-muted-foreground font-medium">
                                                    <ClockIcon className="w-3.5 h-3.5 mr-1" />
                                                    {new Date(msg.sent_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
            
            <style>{`
                .input-premium { display: block; width: 100%; padding: 0.6rem 0.8rem; border: 1px solid hsl(var(--input)); border-radius: 0.5rem; background-color: hsl(var(--background)); color: hsl(var(--foreground)); transition: all 0.2s; font-size: 0.9rem; }
                .input-premium:focus { outline: none; border-color: hsl(var(--primary)); box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2); }
            `}</style>
        </div>
    );
};

CommunicationTab.Icon = MegaphoneIcon;
export default CommunicationTab;