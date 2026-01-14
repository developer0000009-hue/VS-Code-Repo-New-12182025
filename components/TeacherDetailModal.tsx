
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TeacherExtended, TeacherDocument, SchoolClass, Course, TeacherSubjectMapping } from '../types';
import { supabase } from '../services/supabase';
import Spinner from './common/Spinner';
import { XIcon } from './icons/XIcon';
import { UserIcon } from './icons/UserIcon';
import { MailIcon } from './icons/MailIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { BookIcon } from './icons/BookIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import ConfirmationModal from './common/ConfirmationModal';
import { TimetableIcon } from './icons/TimetableIcon';
import { CommunicationIcon } from './icons/CommunicationIcon';
import { EditIcon } from './icons/EditIcon';
import { SaveIcon } from './icons/SaveIcon';
import OffboardingModal from './teachers/OffboardingModal';
import { ClockIcon } from './icons/ClockIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UsersIcon } from './icons/UsersIcon';
import { GridIcon } from './icons/GridIcon';
import { InfoIcon } from './icons/InfoIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ActivityIcon } from './icons/ActivityIcon';
import { ShieldAlertIcon } from './icons/ShieldAlertIcon';
import { KeyIcon } from './icons/KeyIcon';
import AssignSubjectModal from './teachers/AssignSubjectModal';

interface TeacherDetailModalProps {
    teacher: TeacherExtended;
    onClose: () => void;
    onUpdate: () => void;
}

type TabType = 'personal' | 'employment' | 'academics' | 'timetable' | 'documents' | 'attendance' | 'performance' | 'account';

const formatError = (err: any): string => {
    if (!err) return "An unknown error occurred.";
    if (typeof err === 'string') return err;
    const message = err.message || err.error_description || err.details || err.hint;
    if (message && typeof message === 'string') return message;
    return "An unexpected system error occurred.";
};

const generateEmployeeId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `EMP-${year}-${random}`;
};

const TabButton: React.FC<{ label: string; id: TabType; activeId: TabType; onClick: (id: TabType) => void; icon: React.ReactNode }> = ({ label, id, activeId, onClick, icon }) => (
    <button
        onClick={() => onClick(id)}
        className={`flex items-center gap-3 px-5 py-3.5 text-sm font-bold border-l-4 transition-all whitespace-nowrap ${
            activeId === id
            ? 'border-primary text-primary bg-primary/10' 
            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}
    >
        <span className={`transition-colors ${activeId === id ? 'text-primary' : 'text-muted-foreground/60'}`}>{icon}</span>
        {label}
    </button>
);

const InfoRow: React.FC<{ 
    label: string; 
    value?: string | number | null; 
    fullWidth?: boolean;
    isEditing?: boolean;
    readOnly?: boolean;
    onChange?: (val: string) => void;
    type?: string;
    options?: string[];
    icon?: React.ReactNode;
    required?: boolean;
}> = ({ label, value, fullWidth, isEditing, readOnly, onChange, type = "text", options, icon, required }) => (
    <div className={`py-4 border-b border-border/40 last:border-0 ${fullWidth ? 'col-span-full' : ''} group`}>
        <div className="flex items-center gap-2 mb-2">
             {icon && <span className={`transition-colors ${isEditing ? 'text-primary' : 'text-muted-foreground/40 group-hover:text-muted-foreground'}`}>{icon}</span>}
             <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-[0.12em]">{label}</p>
             {required && isEditing && <span className="text-red-500 text-[10px] font-bold">*</span>}
        </div>
        {isEditing && !readOnly && onChange ? (
            options ? (
                <select 
                    value={value?.toString() || ''} 
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-muted/20 text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                >
                    <option value="">Select...</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            ) : (
                <input 
                    type={type} 
                    value={value?.toString() || ''} 
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-input bg-muted/20 text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                    placeholder={`Enter ${label.toLowerCase()}...`}
                />
            )
        ) : (
            <div className="flex items-center gap-2">
                <p className={`text-sm font-bold text-foreground pl-1 ${!value ? 'italic opacity-30 font-medium' : ''}`}>
                    {value || 'Not provided'}
                </p>
                {readOnly && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted/80 text-[8px] font-black text-muted-foreground uppercase tracking-tighter border border-border/50">System Managed</span>
                )}
                {!value && !isEditing && (
                    <span className="text-[9px] font-bold text-amber-500/60 uppercase">Action Required</span>
                )}
            </div>
        )}
    </div>
);

const SectionTitle: React.FC<{ title: string, icon?: React.ReactNode, action?: React.ReactNode }> = ({ title, icon, action }) => (
    <div className="flex justify-between items-center mb-8 pb-4 border-b border-border/60">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-primary/10 rounded-xl text-primary shadow-inner">
                {icon}
            </div>
            {title}
        </h3>
        {action}
    </div>
);

const TeacherDetailModal: React.FC<TeacherDetailModalProps> = ({ teacher, onClose, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<TabType>('personal');
    const [isEditing, setIsEditing] = useState(false);
    const [processingAction, setProcessingAction] = useState(false);
    const [isOffboarding, setIsOffboarding] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [confirmationAction, setConfirmationAction] = useState<{ type: 'reset_password' | 'toggle_active' | 'unmap_subject', title: string, message: string, targetId?: number } | null>(null);

    const [formData, setFormData] = useState({
        display_name: teacher.display_name,
        phone: teacher.phone || '',
        email: teacher.email,
        bio: teacher.details?.bio || '',
        gender: teacher.details?.gender || '',
        date_of_birth: teacher.details?.date_of_birth || '',
        department: teacher.details?.department || '',
        designation: teacher.details?.designation || '',
        employee_id: teacher.details?.employee_id || '',
        employment_type: teacher.details?.employment_type || '',
        employment_status: teacher.details?.employment_status || 'Active',
        date_of_joining: teacher.details?.date_of_joining || '',
        qualification: teacher.details?.qualification || '',
        specializations: teacher.details?.specializations || '',
        subject: teacher.details?.subject || '',
        workload_limit: teacher.details?.workload_limit || 30
    });

    const [docs, setDocs] = useState<TeacherDocument[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [mappings, setMappings] = useState<TeacherSubjectMapping[]>([]);
    const [loadingMappings, setLoadingMappings] = useState(false);

    // Mock Security Data
    const securityLogs = [
        { id: 1, action: 'Successful Login', location: 'Jaipur, India', device: 'Chrome / Windows', time: '2 hours ago' },
        { id: 2, action: 'Profile Updated', location: 'Jaipur, India', device: 'Chrome / Windows', time: 'Yesterday' },
        { id: 3, action: 'Password Changed', location: 'Admin Console', device: 'System Process', time: '3 days ago' },
    ];

    useEffect(() => {
        if (!formData.employee_id) {
            setFormData(prev => ({ ...prev, employee_id: generateEmployeeId() }));
        }
    }, [formData.employee_id]);

    const fetchDocs = useCallback(async () => {
        setLoadingDocs(true);
        const { data, error } = await supabase.rpc('get_teacher_documents', { p_teacher_id: teacher.id });
        if (!error && data) setDocs(data);
        setLoadingDocs(false);
    }, [teacher.id]);

    const fetchMappings = useCallback(async () => {
        setLoadingMappings(true);
        const { data: mappingData, error } = await supabase
            .from('class_subjects')
            .select(`
                id, class_id, subject_id,
                school_classes(name, academic_year, section, grade_level),
                courses(title, credits, category)
            `)
            .eq('teacher_id', teacher.id);
        
        if (!error && mappingData) {
            setMappings(mappingData.map((m: any) => ({
                id: m.id,
                teacher_id: teacher.id,
                subject_id: m.subject_id,
                class_id: m.class_id,
                academic_year: m.school_classes?.academic_year || 'Not Set',
                class_name: m.school_classes?.name,
                subject_name: m.courses?.title,
                credits: m.courses?.credits,
                category: m.courses?.category
            })));
        }
        setLoadingMappings(false);
    }, [teacher.id]);

    useEffect(() => {
        if (activeTab === 'documents') fetchDocs();
        if (activeTab === 'academics') fetchMappings();
    }, [activeTab, fetchDocs, fetchMappings]);

    // Workload Calculation for Analytics & Stewardship
    const workloadHours = useMemo(() => {
        // Calculation based on course credits/frequency
        return mappings.reduce((acc, m: any) => acc + (m.credits || 4), 0);
    }, [mappings]);

    const maxLoad = formData.workload_limit || 30;
    const loadPercentage = Math.min((workloadHours / maxLoad) * 100, 100);

    const handleSaveProfile = async () => {
        if (!formData.display_name.trim()) {
            alert("Full Name is a mandatory field.");
            return;
        }

        setIsSavingProfile(true);
        try {
            const { error: pError } = await supabase.from('profiles').update({ 
                display_name: formData.display_name, 
                phone: formData.phone 
            }).eq('id', teacher.id);
            if (pError) throw pError;

            const { error: tpError } = await supabase.from('teacher_profiles').update({
                bio: formData.bio, 
                gender: formData.gender, 
                date_of_birth: formData.date_of_birth || null, 
                department: formData.department, 
                designation: formData.designation, 
                employee_id: formData.employee_id, 
                employment_type: formData.employment_type, 
                employment_status: formData.employment_status, 
                date_of_joining: formData.date_of_joining || null, 
                qualification: formData.qualification, 
                specializations: formData.specializations, 
                subject: formData.subject,
                workload_limit: formData.workload_limit
            }).eq('user_id', teacher.id);
            if (tpError) throw tpError;

            setIsEditing(false);
            onUpdate();
        } catch (err: any) { 
            alert(`Save failed: ${formatError(err)}`); 
        } finally { 
            setIsSavingProfile(false); 
        }
    };

    const executeAccountAction = async () => {
        if (!confirmationAction) return;
        setProcessingAction(true);
        try {
            if (confirmationAction.type === 'reset_password') {
                const { error } = await supabase.auth.resetPasswordForEmail(teacher.email, { redirectTo: window.location.origin });
                if (error) throw error;
                alert("Security reset instructions have been dispatched to their email.");
            } else if (confirmationAction.type === 'toggle_active') {
                const { error } = await supabase.from('profiles').update({ is_active: !teacher.is_active }).eq('id', teacher.id);
                if (error) throw error;
                onUpdate();
            } else if (confirmationAction.type === 'unmap_subject' && confirmationAction.targetId) {
                const { error } = await supabase.from('class_subjects').update({ teacher_id: null }).eq('id', confirmationAction.targetId);
                if (error) throw error;
                fetchMappings();
                onUpdate();
            }
            setConfirmationAction(null);
        } catch (err: any) {
            alert(formatError(err));
        } finally {
            setProcessingAction(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-background w-full max-w-6xl h-[92vh] rounded-[2.5rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden relative ring-1 ring-black/5" onClick={e => e.stopPropagation()}>
                
                {/* Header Profile Section */}
                <div className="p-8 border-b border-border bg-card/40 backdrop-blur-xl flex flex-col md:flex-row justify-between items-center gap-8 flex-shrink-0 z-10">
                    <div className="flex items-center gap-8">
                        <div className="relative group">
                            <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl border-4 border-background overflow-hidden transform group-hover:rotate-2 transition-transform duration-500">
                                {teacher.details?.profile_picture_url ? (
                                    <img src={teacher.details.profile_picture_url} className="w-full h-full object-cover" alt={teacher.display_name} />
                                ) : teacher.display_name.charAt(0)}
                            </div>
                            <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-background flex items-center justify-center shadow-lg ${teacher.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                {teacher.is_active ? <CheckCircleIcon className="w-4 h-4 text-white"/> : <XCircleIcon className="w-4 h-4 text-white"/>}
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-black text-foreground tracking-tight">{teacher.display_name}</h2>
                                <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm ${
                                    teacher.details?.employment_status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}>
                                    {teacher.details?.employment_status || 'Offline'}
                                </span>
                            </div>
                            <p className="text-lg font-bold text-muted-foreground mt-1 flex items-center gap-2">
                                <BriefcaseIcon className="w-4 h-4 text-primary" />
                                {teacher.details?.designation || 'Faculty Member'} • <span className="text-foreground/80">{teacher.details?.department || 'Unassigned'}</span>
                            </p>
                            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-bold text-muted-foreground">
                                <span className="flex items-center gap-1.5"><MailIcon className="w-3.5 h-3.5 opacity-40"/> {teacher.email}</span>
                                <span className="flex items-center gap-1.5"><PhoneIcon className="w-3.5 h-3.5 opacity-40"/> {teacher.phone || 'N/A'}</span>
                                <span className="px-3 py-1 rounded-lg bg-muted text-foreground font-mono shadow-inner border border-border/60">ID: {formData.employee_id || '---'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => alert('Feature coming soon: Live Chat Integration')} className="px-6 py-3 bg-primary text-primary-foreground font-black text-sm rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2 transform active:scale-95">
                            <CommunicationIcon className="w-4 h-4" /> Message
                        </button>
                        <button onClick={onClose} className="p-3 rounded-2xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border"><XIcon className="w-6 h-6"/></button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
                    {/* Navigation Sidebar */}
                    <div className="w-full md:w-72 bg-muted/10 border-r border-border flex-shrink-0 overflow-y-auto custom-scrollbar">
                        <nav className="p-4 space-y-1">
                            <p className="px-5 py-4 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">Profile Information</p>
                            <TabButton id="personal" label="Personal Details" activeId={activeTab} onClick={setActiveTab} icon={<UserIcon className="w-5 h-5"/>} />
                            <TabButton id="employment" label="Work & Compliance" activeId={activeTab} onClick={setActiveTab} icon={<BriefcaseIcon className="w-5 h-5"/>} />
                            
                            <p className="px-5 py-4 mt-4 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">Academic Control</p>
                            <TabButton id="academics" label="Subject Mapping" activeId={activeTab} onClick={setActiveTab} icon={<BookIcon className="w-5 h-5"/>} />
                            <TabButton id="timetable" label="Live Timetable" activeId={activeTab} onClick={setActiveTab} icon={<TimetableIcon className="w-5 h-5"/>} />
                            <TabButton id="performance" label="Workload Analytics" activeId={activeTab} onClick={setActiveTab} icon={<ChartBarIcon className="w-5 h-5"/>} />
                            
                            <p className="px-5 py-4 mt-4 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">Institutional</p>
                            <TabButton id="documents" label="Document Safe" activeId={activeTab} onClick={setActiveTab} icon={<FileTextIcon className="w-5 h-5"/>} />
                            <TabButton id="account" label="Account Security" activeId={activeTab} onClick={setActiveTab} icon={<ShieldCheckIcon className="w-5 h-5"/>} />
                        </nav>
                    </div>

                    {/* Content Viewport */}
                    <div className="flex-grow overflow-y-auto p-10 bg-background relative custom-scrollbar">
                        
                        {/* Tab-Specific Editing Controls */}
                        {['personal', 'employment'].includes(activeTab) && (
                            <div className="absolute top-10 right-10 z-10">
                                {isEditing ? (
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 bg-muted text-muted-foreground rounded-xl text-xs font-black hover:bg-muted/80 transition-colors">Discard</button>
                                        <button onClick={handleSaveProfile} disabled={isSavingProfile} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2">
                                            {isSavingProfile ? <Spinner size="sm" className="text-current"/> : <><SaveIcon className="w-4 h-4"/> Commit Changes</>}
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={() => setIsEditing(true)} className="px-5 py-2.5 bg-card hover:bg-muted text-foreground rounded-xl text-xs font-black flex items-center gap-2 border border-border shadow-sm transition-all hover:-translate-y-0.5">
                                        <EditIcon className="w-4 h-4"/> Edit Information
                                    </button>
                                )}
                            </div>
                        )}

                        {activeTab === 'personal' && (
                            <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                                <SectionTitle title="Personal Information" icon={<UserIcon className="w-6 h-6"/>} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                    <InfoRow label="Full Name" value={formData.display_name} isEditing={isEditing} required={true} onChange={v => setFormData({...formData, display_name: v})} icon={<UserIcon className="w-4 h-4" />} />
                                    <InfoRow label="Gender" value={formData.gender} isEditing={isEditing} onChange={v => setFormData({...formData, gender: v})} options={['Male', 'Female', 'Other']} icon={<UserIcon className="w-4 h-4" />} />
                                    <InfoRow label="Date of Birth" value={formData.date_of_birth} isEditing={isEditing} onChange={v => setFormData({...formData, date_of_birth: v})} type="date" icon={<CalendarIcon className="w-4 h-4" />} />
                                    <InfoRow label="Contact Phone" value={formData.phone} isEditing={isEditing} onChange={v => setFormData({...formData, phone: v})} icon={<PhoneIcon className="w-4 h-4" />} />
                                    <InfoRow label="Email Address" value={formData.email} readOnly={true} icon={<MailIcon className="w-4 h-4" />} />
                                    <InfoRow label="Primary Qualification" value={formData.qualification} isEditing={isEditing} onChange={v => setFormData({...formData, qualification: v})} icon={<BookIcon className="w-4 h-4" />} />
                                    
                                    <div className="col-span-full pt-8">
                                        <div className="flex items-center gap-2 mb-4 ml-1">
                                             <FileTextIcon className="w-4 h-4 text-primary" />
                                             <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-[0.2em]">Professional Biography</p>
                                        </div>
                                        {isEditing ? (
                                            <textarea 
                                                value={formData.bio} 
                                                onChange={e => setFormData({...formData, bio: e.target.value})} 
                                                className="w-full p-6 bg-muted/20 rounded-3xl border border-input text-sm font-medium focus:ring-4 focus:ring-primary/10 transition-all h-40 resize-none outline-none leading-relaxed" 
                                                placeholder="Write a brief introduction about your teaching philosophy and journey..."
                                            />
                                        ) : (
                                            <div className="p-8 bg-card rounded-[2.5rem] border border-border shadow-sm text-sm leading-loose text-foreground/80 font-medium">
                                                {formData.bio || (
                                                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/30 italic">
                                                        <p>Biography has not been curated yet.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'employment' && (
                            <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                                <SectionTitle title="Work & Compliance" icon={<BriefcaseIcon className="w-6 h-6"/>} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                    <InfoRow label="Employee ID" value={formData.employee_id} isEditing={isEditing} readOnly={true} icon={<div className="w-4 h-4 text-[10px] font-black border border-current rounded flex items-center justify-center">ID</div>} />
                                    <InfoRow label="Department" value={formData.department} isEditing={isEditing} onChange={v => setFormData({...formData, department: v})} icon={<GridIcon className="w-4 h-4" />} />
                                    <InfoRow label="Designation" value={formData.designation} isEditing={isEditing} onChange={v => setFormData({...formData, designation: v})} icon={<CheckCircleIcon className="w-4 h-4" />} />
                                    <InfoRow label="Joining Date" value={formData.date_of_joining} isEditing={isEditing} onChange={v => setFormData({...formData, date_of_joining: v})} type="date" icon={<CalendarIcon className="w-4 h-4" />} />
                                    <InfoRow label="Employment Type" value={formData.employment_type} isEditing={isEditing} onChange={v => setFormData({...formData, employment_type: v})} options={['Full-time', 'Part-time', 'Contract']} icon={<ClockIcon className="w-4 h-4" />} />
                                    <InfoRow label="Contract Status" value={formData.employment_status} isEditing={isEditing} onChange={v => setFormData({...formData, employment_status: v})} options={['Active', 'Pending Verification', 'On Leave', 'Inactive']} icon={<ShieldCheckIcon className="w-4 h-4" />} />
                                </div>
                                <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl flex items-start gap-4">
                                     <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
                                         <InfoIcon className="w-5 h-5"/>
                                     </div>
                                     <div>
                                         <p className="text-sm font-bold text-blue-200">Institutional Notice</p>
                                         <p className="text-xs text-blue-300/70 mt-1 leading-relaxed">Financial data and background check renewals are managed in the HR & Compliance module by authorized personnel only.</p>
                                     </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'academics' && (
                             <div className="max-w-4xl space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                                 {/* Stewardship Summary Header */}
                                 <div className="p-8 bg-card border border-border rounded-[2.5rem] shadow-xl relative overflow-hidden ring-1 ring-black/10 flex flex-col md:flex-row justify-between items-center gap-8">
                                     <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><BookIcon className="w-40 h-40" /></div>
                                     <div className="relative z-10 flex flex-col gap-2">
                                         <h4 className="text-2xl font-black text-foreground tracking-tight">Academic Stewardship</h4>
                                         <p className="text-sm text-muted-foreground">Managing teaching loads and specialized assignments.</p>
                                         <div className="flex gap-4 mt-4">
                                             <div className="flex flex-col">
                                                 <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active Groups</span>
                                                 <span className="text-2xl font-black text-primary">{mappings.length}</span>
                                             </div>
                                             <div className="w-px h-8 bg-border self-end mb-1"></div>
                                             <div className="flex flex-col">
                                                 <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Weekly Load</span>
                                                 <span className={`text-2xl font-black ${loadPercentage > 90 ? 'text-red-500' : 'text-foreground'}`}>{workloadHours} / {maxLoad} Hrs</span>
                                             </div>
                                         </div>
                                     </div>
                                     <button 
                                        onClick={() => setIsAssignModalOpen(true)}
                                        className="relative z-10 px-8 py-4 bg-primary text-primary-foreground font-black text-sm rounded-[1.5rem] shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all flex items-center gap-2 transform hover:-translate-y-1 active:scale-95"
                                     >
                                         <PlusIcon className="w-5 h-5"/> Map New Subject
                                     </button>
                                 </div>

                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {loadingMappings ? <div className="col-span-full flex justify-center py-12"><Spinner /></div> : mappings.length === 0 ? (
                                        <div className="col-span-full p-16 text-center text-muted-foreground border-2 border-dashed border-border rounded-[2.5rem] bg-muted/5 flex flex-col items-center group hover:bg-muted/10 transition-colors">
                                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-background">
                                                <BookIcon className="w-10 h-10 opacity-30 group-hover:scale-110 transition-transform"/>
                                            </div>
                                            <h4 className="text-lg font-bold text-foreground mb-4">No subjects assigned</h4>
                                            <p className="text-sm max-w-xs mx-auto leading-relaxed">
                                                This faculty member has not been linked to any active classes or subjects.
                                            </p>
                                        </div>
                                    ) : (
                                        mappings.map(map => (
                                            <div key={map.id} className="flex items-center gap-5 p-6 bg-card border border-border rounded-3xl shadow-sm hover:shadow-xl hover:border-primary/30 transition-all group overflow-hidden relative">
                                                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex flex-col items-center justify-center font-black border border-indigo-500/20 shadow-inner group-hover:scale-105 transition-transform shrink-0">
                                                    <span className="text-[10px] uppercase opacity-60 font-bold leading-none mb-1">Grade</span>
                                                    <span className="text-lg leading-none">{map.class_name?.match(/\d+/)?.[0] || 'C'}</span>
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className="font-black text-foreground text-base tracking-tight truncate">{map.subject_name}</h4>
                                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border shrink-0 ml-2">{map.category || 'Core'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-[10px] font-extrabold text-primary uppercase tracking-[0.15em] flex items-center gap-1.5">
                                                            <GridIcon className="w-3 h-3 opacity-60"/> {map.class_name}
                                                        </p>
                                                        <span className="text-[10px] text-muted-foreground/60">•</span>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                                            <ClockIcon className="w-3 h-3 opacity-40"/> {map.credits || 4} Hrs/Week
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                    <button 
                                                        onClick={() => setConfirmationAction({ 
                                                            type: 'unmap_subject', 
                                                            title: 'Remove Assignment', 
                                                            message: `Are you sure you want to unassign ${teacher.display_name} from ${map.subject_name} (${map.class_name})?`,
                                                            targetId: map.id
                                                        })}
                                                        className="p-2.5 rounded-xl hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                                                        title="Unmap Subject"
                                                    >
                                                        <TrashIcon className="w-4 h-4"/>
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                 </div>
                             </div>
                        )}

                        {activeTab === 'performance' && (
                             <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-right-4 duration-300">
                                 <SectionTitle title="Workload Analysis" icon={<ChartBarIcon className="w-6 h-6"/>} />
                                 
                                 <div className="p-10 bg-card border border-border rounded-[2.5rem] shadow-xl relative overflow-hidden ring-1 ring-black/10">
                                     <div className="absolute top-0 right-0 p-10 opacity-[0.03]"><UsersIcon className="w-40 h-40" /></div>
                                     <div className="flex justify-between items-end mb-8 relative z-10">
                                         <div>
                                             <h4 className="text-xl font-black text-foreground tracking-tight">Weekly Teaching Load</h4>
                                             <p className="text-sm text-muted-foreground mt-1">Analyzed against institutional standard of <span className="font-bold text-foreground">{maxLoad} hours/week</span>.</p>
                                         </div>
                                         <div className="text-right">
                                             <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl shadow-sm border ${loadPercentage > 90 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                                 {loadPercentage > 90 ? 'Critical Overload' : 'Balanced Load'}
                                             </span>
                                         </div>
                                     </div>
                                     
                                     <div className="relative h-4 w-full bg-muted rounded-full overflow-hidden shadow-inner ring-1 ring-white/5 mb-4">
                                         <div 
                                            className={`h-full rounded-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-lg ${loadPercentage > 90 ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-400 to-primary'}`} 
                                            style={{ width: `${loadPercentage}%` }}
                                         >
                                            <div className="w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[shine_2s_linear_infinite]"></div>
                                         </div>
                                     </div>
                                     
                                     <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                         <span>0 hrs</span>
                                         <span className="text-primary text-base font-black tracking-normal">{workloadHours} / {maxLoad} Total Hours</span>
                                         <span>{maxLoad}+ hrs</span>
                                     </div>
                                 </div>

                                 <div className="grid grid-cols-2 gap-8">
                                     <div className="p-8 bg-muted/20 border border-border/60 rounded-3xl text-center group hover:bg-card transition-all shadow-sm hover:shadow-lg border-dashed">
                                         <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-2">Groups Handled</p>
                                         <p className="text-5xl font-black text-foreground group-hover:text-primary transition-colors">{mappings.length}</p>
                                     </div>
                                     <div className="p-8 bg-muted/20 border border-border/60 rounded-3xl text-center group hover:bg-card transition-all shadow-sm hover:shadow-lg border-dashed">
                                         <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-2">Student Reach</p>
                                         <p className="text-5xl font-black text-foreground group-hover:text-primary transition-colors">~{mappings.length * 28}</p>
                                     </div>
                                 </div>
                             </div>
                        )}

                        {activeTab === 'documents' && (
                            <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                                <SectionTitle 
                                    title="Document Safe" 
                                    icon={<FileTextIcon className="w-6 h-6"/>} 
                                    action={<button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black shadow-lg hover:bg-primary/90 flex items-center gap-2 transition-all active:scale-95"><PlusIcon className="w-4 h-4"/> Add New Document</button>}
                                />

                                {loadingDocs ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : docs.length === 0 ? (
                                    <div className="p-20 border-2 border-dashed border-border rounded-[2.5rem] bg-muted/5 flex flex-col items-center group hover:bg-muted/10 transition-colors">
                                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 shadow-inner">
                                            <FileTextIcon className="w-10 h-10 opacity-30 group-hover:scale-110 transition-transform" />
                                        </div>
                                        <h4 className="text-lg font-bold text-foreground">Secure Vault is Empty</h4>
                                        <p className="text-sm text-muted-foreground mt-2 max-w-xs text-center leading-relaxed">No compliance documents, degrees, or identification proofs have been archived yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {docs.map(doc => (
                                            <div key={doc.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-3 bg-muted rounded-xl text-muted-foreground group-hover:text-primary transition-colors">
                                                        <FileTextIcon className="w-6 h-6" />
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                        doc.status === 'Verified' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                    }`}>
                                                        {doc.status}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-foreground truncate">{doc.document_name}</h4>
                                                <p className="text-xs text-muted-foreground mt-1">{doc.document_type} • Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                                                
                                                <div className="mt-6 flex gap-2">
                                                    <button onClick={() => window.open(supabase.storage.from('teacher-documents').getPublicUrl(doc.file_path).data.publicUrl, '_blank')} className="flex-1 py-2.5 bg-background border border-border hover:border-primary/50 text-foreground text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                                                        <InfoIcon className="w-3.5 h-3.5"/> View
                                                    </button>
                                                    <button className="p-2.5 bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-transparent hover:border-border">
                                                        <DownloadIcon className="w-4 h-4"/>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'account' && (
                            <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                                <SectionTitle title="Account Security Center" icon={<ShieldCheckIcon className="w-6 h-6"/>} />
                                
                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                    {/* Main Controls */}
                                    <div className="lg:col-span-3 space-y-6">
                                        <div className="bg-card border border-border rounded-3xl p-8 shadow-sm group hover:border-primary/30 transition-all">
                                            <h4 className="font-bold text-lg text-foreground flex items-center gap-3 mb-6">
                                                <KeyIcon className="w-5 h-5 text-primary" /> Credential Lifecycle
                                            </h4>
                                            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">Modify login accessibility or initiate a mandatory security reset for this account.</p>
                                            <div className="flex flex-wrap gap-4">
                                                <button onClick={() => setConfirmationAction({ type: 'reset_password', title: 'Security Reset', message: `Proceed with sending a secure password reset link to ${teacher.email}?` })} className="px-6 py-3 bg-muted hover:bg-foreground hover:text-background rounded-2xl text-xs font-black transition-all border border-border shadow-sm flex items-center gap-2">
                                                    Reset Password
                                                </button>
                                                <button onClick={() => setConfirmationAction({ type: 'toggle_active', title: teacher.is_active ? 'Revoke Access' : 'Restore Access', message: `Are you sure you want to ${teacher.is_active ? 'deactivate' : 'activate'} this portal immediately?` })} className={`px-8 py-3.5 rounded-2xl text-xs font-black shadow-lg transition-all active:scale-95 ${teacher.is_active ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/20' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20'}`}>
                                                    {teacher.is_active ? 'Suspend Account' : 'Reactivate Portal'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-[2.5rem] relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform"><ShieldAlertIcon className="w-32 h-32 text-red-500" /></div>
                                            <h4 className="text-red-500 font-black text-lg flex items-center gap-2 mb-2">
                                                <ShieldAlertIcon className="w-5 h-5"/> Institutional Governance
                                            </h4>
                                            <p className="text-sm text-red-700/70 mb-6 max-w-sm">Final resignation protocols and permanent record archival. This process handles class and department reassignments.</p>
                                            <button onClick={() => setIsOffboarding(true)} className="px-8 py-3.5 bg-background hover:bg-red-500/10 border-2 border-red-500/20 text-red-500 rounded-2xl text-xs font-black shadow-sm transition-all active:scale-95">Initiate Formal Offboarding</button>
                                        </div>
                                    </div>

                                    {/* Activity Log */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="bg-muted/10 border border-border rounded-3xl p-6 shadow-inner h-full flex flex-col">
                                            <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                                                <ActivityIcon className="w-4 h-4" /> Recent Activity
                                            </h4>
                                            <div className="space-y-6 flex-grow">
                                                {securityLogs.map(log => (
                                                    <div key={log.id} className="relative pl-6 border-l-2 border-border last:border-transparent pb-1">
                                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-primary"></div>
                                                        <p className="text-sm font-bold text-foreground">{log.action}</p>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">{log.device} • {log.time}</p>
                                                        <p className="text-[10px] text-muted-foreground font-mono mt-1 opacity-60">{log.location}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <button className="mt-8 text-[10px] font-black uppercase text-primary hover:underline w-full text-center">Download Full Audit Log</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Empty/Loading States for other tabs */}
                        {(['timetable', 'attendance'].includes(activeTab)) && (
                            <div className="h-full flex flex-col items-center justify-center py-20 text-center animate-in fade-in">
                                <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-border animate-pulse">
                                    <ClockIcon className="w-10 h-10 text-muted-foreground/30" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Advanced Module Loading</h3>
                                <p className="text-sm text-muted-foreground mt-2 max-w-xs">Integrating real-time {activeTab} data into the administrative profile view...</p>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            <ConfirmationModal 
                isOpen={!!confirmationAction} 
                onClose={() => setConfirmationAction(null)} 
                onConfirm={executeAccountAction} 
                title={confirmationAction?.title || ''} 
                message={confirmationAction?.message || ''} 
                loading={processingAction} 
                confirmText="Execute" 
            />
            
            {isOffboarding && (
                <OffboardingModal 
                    teacher={teacher} 
                    onClose={() => setIsOffboarding(false)} 
                    onSuccess={() => { setIsOffboarding(false); onUpdate(); onClose(); }} 
                />
            )}

            {isAssignModalOpen && (
                <AssignSubjectModal 
                    teacher={teacher} 
                    onClose={() => setIsAssignModalOpen(false)} 
                    onSuccess={() => { setIsAssignModalOpen(false); fetchMappings(); }}
                />
            )}
        </div>
    );
};

export default TeacherDetailModal;
