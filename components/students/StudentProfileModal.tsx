
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase, formatError } from '../../services/supabase';
import { StudentForAdmin, SchoolClass, Course, SchoolAdminProfileData } from '../../types';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { UserIcon } from '../icons/UserIcon';
import { MailIcon } from '../icons/MailIcon';
import { PhoneIcon } from '../icons/PhoneIcon';
import { GraduationCapIcon } from '../icons/GraduationCapIcon';
import { FileTextIcon } from '../icons/FileTextIcon';
import { CreditCardIcon } from '../icons/CreditCardIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { EditIcon } from '../icons/EditIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { SchoolIcon } from '../icons/SchoolIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { LocationIcon } from '../icons/LocationIcon';
import { BookIcon } from '../icons/BookIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { PrinterIcon } from '../icons/PrinterIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { InfoIcon } from '../icons/InfoIcon';
import { SettingsIcon } from '../icons/SettingsIcon';
import { MenuIcon } from '../icons/MenuIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { EyeIcon } from '../icons/EyeIcon';
import { LockIcon } from '../icons/LockIcon';
import { KeyIcon } from '../icons/KeyIcon';
import { RefreshIcon } from '../icons/RefreshIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { ReceiptIcon } from '../icons/ReceiptIcon';
import { DollarSignIcon } from '../icons/DollarSignIcon';
import { ActivityIcon } from '../icons/ActivityIcon';
import { TeacherIcon } from '../icons/TeacherIcon';
import CustomSelect from '../common/CustomSelect';
import RecordPaymentModal from '../finance/RecordPaymentModal';
import { StorageService, BUCKETS } from '../../services/storage';
import PremiumAvatar from '../common/PremiumAvatar';
import { CopyIcon } from '../icons/CopyIcon';
import EditStudentDetailsModal from './EditStudentDetailsModal';

interface StudentProfileModalProps {
    student: StudentForAdmin;
    onClose: () => void;
    onUpdate: () => void;
    initialTab?: TabType;
}

type TabType = 'overview' | 'parents' | 'academic' | 'documents' | 'fees' | 'history';
type LifecycleStatus = 'REGISTERED' | 'VERIFIED' | 'PLACEMENT_PENDING' | 'ACTIVE' | 'ARCHIVED';

// --- SUB-COMPONENTS ---

const TabButton: React.FC<{ 
    id: TabType; 
    label: string; 
    icon: React.ReactNode; 
    active: boolean; 
    onClick: (id: TabType) => void;
}> = ({ id, label, icon, active, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`w-full flex items-center gap-3 px-4 py-3.5 mb-1 rounded-r-xl border-l-[3px] transition-all duration-300 group relative overflow-hidden ${
            active 
                ? 'border-primary bg-gradient-to-r from-primary/10 to-transparent text-white shadow-[inset_10px_0_20px_-10px_rgba(var(--primary),0.2)]' 
                : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'
        }`}
    >
        <div className={`relative z-10 p-1 rounded-lg transition-colors ${active ? 'text-primary' : 'text-white/30 group-hover:text-white'}`}>
            {icon}
        </div>
        <span className={`relative z-10 text-xs font-bold uppercase tracking-widest ${active ? 'text-white' : ''}`}>
            {label}
        </span>
        {active && <div className="absolute inset-0 bg-primary/5 blur-sm"></div>}
    </button>
);

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0
    }).format(amount || 0);
};

const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard`);
};

const DocumentCard: React.FC<{ 
    doc: any, 
    onVerify: (id: number) => void, 
    onReject: (id: number) => void,
    onView: (path: string) => void
}> = ({ 
    doc, 
    onVerify, 
    onReject, 
    onView 
}) => {
    const status = doc.status || 'Pending';
    const file = doc.admission_documents?.[0];
    
    const getStatusStyle = (s: string) => {
        switch(s) {
            case 'Verified': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]';
            case 'Submitted': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'Rejected': return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
        }
    };

    return (
        <div className="group relative bg-[#0f1115] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all duration-300 hover:shadow-xl hover:shadow-black/50 flex flex-col h-full overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-opacity group-hover:opacity-100 ${status === 'Verified' ? 'from-emerald-500/10' : 'from-blue-500/10'}`}></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-3 rounded-xl bg-[#1a1d23] text-white/50 group-hover:text-white group-hover:bg-[#252830] transition-colors border border-white/5 shadow-inner">
                    <FileTextIcon className="w-6 h-6"/>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${getStatusStyle(status)} backdrop-blur-sm`}>
                    {status}
                </span>
            </div>
            
            <div className="flex-grow relative z-10">
                <h4 className="font-bold text-white text-sm line-clamp-1 leading-relaxed" title={doc.document_name}>{doc.document_name}</h4>
                {file ? (
                    <p className="text-[11px] text-white/40 mt-1 font-mono flex items-center gap-1.5">
                        <ClockIcon className="w-3 h-3"/> {new Date(file.uploaded_at).toLocaleDateString()}
                    </p>
                ) : (
                    <p className="text-[11px] text-white/20 mt-1 italic">Pending Upload</p>
                )}
                {doc.rejection_reason && (
                    <p className="text-[10px] text-red-400 mt-2 bg-red-500/5 border border-red-500/10 p-2 rounded-lg">
                        Reason: {doc.rejection_reason}
                    </p>
                )}
            </div>

            {file && (
                <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-2 relative z-10">
                    <button 
                        onClick={() => onView(file.storage_path)}
                        className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 border border-transparent hover:border-white/10"
                    >
                        <EyeIcon className="w-3.5 h-3.5"/> View
                    </button>
                    
                    {status !== 'Verified' && (
                         <div className="flex gap-2">
                             <button 
                                onClick={() => onVerify(doc.id)} 
                                className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all hover:scale-105 active:scale-95" 
                                title="Verify Document"
                            >
                                 <CheckCircleIcon className="w-4 h-4"/>
                             </button>
                             <button 
                                onClick={() => onReject(doc.id)} 
                                className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all hover:scale-105 active:scale-95" 
                                title="Reject Document"
                            >
                                 <XCircleIcon className="w-4 h-4"/>
                             </button>
                         </div>
                    )}
                </div>
            )}
        </div>
    )
}

const GuardianCard: React.FC<{ 
    title: string; 
    data: any; 
    isPrimary?: boolean; 
    onEdit: () => void;
}> = ({ title, data, isPrimary, onEdit }) => (
    <div className="bg-[#13151b] border border-white/10 rounded-[2.5rem] p-8 shadow-lg relative overflow-hidden group flex flex-col h-full hover:border-white/20 transition-all">
        <div className="flex justify-between items-start mb-6 z-10 relative">
            <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${isPrimary ? 'bg-indigo-500/10 text-indigo-400' : 'bg-white/5 text-white/40'}`}>
                    <UsersIcon className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-bold text-white text-lg">{title}</h4>
                    <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest">{data ? 'Linked' : 'Not Linked'}</p>
                </div>
            </div>
            <button 
                onClick={onEdit} 
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/30 hover:text-white transition-all"
            >
                <EditIcon className="w-4 h-4"/>
            </button>
        </div>
        
        {data ? (
            <div className="space-y-5 relative z-10">
                <div>
                    <p className="text-[10px] font-black uppercase text-white/20 tracking-widest mb-1">Full Name</p>
                    <p className="text-base font-medium text-white">{data.name}</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <p className="text-[10px] font-black uppercase text-white/20 tracking-widest mb-1">Relationship</p>
                        <p className="text-sm text-white/60">{data.relationship}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-white/20 tracking-widest mb-1">Contact</p>
                        <div className="flex flex-col gap-1">
                            <p className="text-sm text-white/60 flex items-center gap-2"><MailIcon className="w-3 h-3 opacity-50"/> {data.email || '—'}</p>
                            <p className="text-sm text-white/60 flex items-center gap-2"><PhoneIcon className="w-3 h-3 opacity-50"/> {data.phone || '—'}</p>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center opacity-30 py-8">
                <UserIcon className="w-16 h-16 mb-4"/>
                <p className="text-sm font-bold">No guardian linked</p>
            </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
    </div>
);

const GuardianEditModal: React.FC<{
    type: 'primary' | 'secondary';
    initialData: any;
    parentId?: string;
    onClose: () => void;
    onSave: () => void;
}> = ({ type, initialData, parentId, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '',
        relationship: initialData?.relationship || ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (type === 'primary' && parentId) {
                 const { error: pError } = await supabase.from('profiles').update({
                     display_name: formData.name,
                     email: formData.email,
                     phone: formData.phone
                 }).eq('id', parentId);
                 if (pError) throw pError;
                 
                 const { error: ppError } = await supabase.from('parent_profiles').update({
                     relationship_to_student: formData.relationship
                 }).eq('user_id', parentId);
                 if (ppError) throw ppError;

            } else if (type === 'secondary' && parentId) {
                const { error } = await supabase.from('parent_profiles').update({
                    secondary_parent_name: formData.name,
                    secondary_parent_email: formData.email,
                    secondary_parent_phone: formData.phone,
                    secondary_parent_relationship: formData.relationship
                }).eq('user_id', parentId);
                if (error) throw error;
            }
            onSave();
        } catch (err: any) {
            alert("Error updating guardian: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in zoom-in-95" onClick={onClose}>
            <div className="bg-[#13151b] w-full max-w-md rounded-3xl shadow-2xl border border-white/10 p-8 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none"><UsersIcon className="w-32 h-32"/></div>
                
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <h3 className="font-bold text-xl text-white font-serif tracking-tight">Edit {type === 'primary' ? 'Primary' : 'Secondary'} Guardian</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><XIcon className="w-5 h-5 text-white/50 hover:text-white"/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Full Name</label>
                        <input className="w-full p-4 rounded-2xl border border-white/10 bg-black/20 text-sm text-white focus:border-indigo-500 focus:bg-black/40 outline-none transition-all font-medium" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Relationship</label>
                        <input className="w-full p-4 rounded-2xl border border-white/10 bg-black/20 text-sm text-white focus:border-indigo-500 focus:bg-black/40 outline-none transition-all font-medium" value={formData.relationship} onChange={e => setFormData({...formData, relationship: e.target.value})} />
                    </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Email</label>
                        <input className="w-full p-4 rounded-2xl border border-white/10 bg-black/20 text-sm text-white focus:border-indigo-500 focus:bg-black/40 outline-none transition-all font-medium" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Phone</label>
                        <input className="w-full p-4 rounded-2xl border border-white/10 bg-black/20 text-sm text-white focus:border-indigo-500 focus:bg-black/40 outline-none transition-all font-medium" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/5">
                        <button type="button" onClick={onClose} className="px-6 py-3 text-xs font-bold text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-colors uppercase tracking-wider">Cancel</button>
                        <button type="submit" disabled={loading} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/20 hover:bg-indigo-50 flex items-center gap-2 transition-all uppercase tracking-wider hover:-translate-y-0.5">
                            {loading && <Spinner size="sm" className="text-white"/>} Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const LifecycleStepper: React.FC<{ 
    isApproved: boolean, 
    isRegistered: boolean, 
    isActive: boolean, 
    classId?: number | null,
    className?: string | null,
    hasAvailableMappings: boolean
}> = ({ isApproved, isRegistered, isActive, classId, className, hasAvailableMappings }) => {
    const isPlacementComplete = !!(classId && className && className !== 'UNASSIGNED' && className !== 'PENDING' && className !== 'PLACEMENT PENDING');
    const steps = [{ label: 'ADMISSION', status: isApproved ? 'complete' : 'pending', sub: 'Verified' }, { label: 'REGISTRATION', status: isRegistered ? 'complete' : (isApproved ? 'current' : 'pending'), sub: 'Profile' }, { label: 'ACTIVE', status: isActive ? 'complete' : (isRegistered ? 'current' : 'pending'), sub: 'Enrolled' }, { label: 'PLACEMENT', status: isPlacementComplete ? 'complete' : (isActive ? 'current' : 'pending'), sub: isPlacementComplete ? className : (hasAvailableMappings ? 'Ready' : 'Pending') }];
    const completedCount = steps.filter(s => s.status === 'complete').length;
    const progressPercent = Math.max(0, Math.min(100, (completedCount / (steps.length - 1)) * 100));

    return (
        <div className="w-full relative py-4">
             <div className="flex flex-col md:flex-row md:items-center justify-between w-full px-6 py-8 md:px-8 bg-[#13151b] rounded-3xl md:rounded-[2.5rem] border border-white/10 relative overflow-hidden shadow-2xl shadow-black/50">
                <div className="hidden md:block absolute top-[46px] left-16 right-16 h-[2px] bg-white/5 rounded-full z-0"></div>
                <div className="hidden md:block absolute top-[46px] left-16 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 z-0 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.6)]" style={{ width: `calc(${progressPercent}% - 4rem)` }}></div>
                <div className="md:hidden absolute left-10 top-16 bottom-16 w-[2px] bg-white/5 rounded-full z-0"></div>
                <div className="md:hidden absolute left-10 top-16 w-[2px] bg-gradient-to-b from-emerald-500 via-teal-400 to-indigo-500 z-0 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.6)]" style={{ height: `calc(${progressPercent}% - 3rem)` }}></div>
                {steps.map((step, idx) => (
                    <div key={idx} className="flex md:flex-col items-center relative z-10 flex-1 group mb-8 md:mb-0 last:mb-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 relative flex-shrink-0 z-10 ${step.status === 'complete' ? 'bg-[#0f1115] border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : step.status === 'current' ? 'bg-[#0f1115] border-indigo-500 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-110' : 'bg-[#1a1d23] border-white/10 text-white/20'}`}>
                            {step.status === 'complete' ? <CheckCircleIcon className="w-5 h-5" /> : step.status === 'current' ? <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-pulse" /> : <div className="w-2 h-2 bg-white/20 rounded-full" />}
                        </div>
                        <div className="ml-4 md:ml-0 md:mt-4 text-left md:text-center transition-all duration-300 transform group-hover:translate-x-1 md:group-hover:translate-x-0 md:group-hover:translate-y-[-2px]">
                            <span className={`block text-[10px] font-black uppercase tracking-[0.25em] mb-0.5 ${step.status === 'complete' ? 'text-emerald-500' : step.status === 'current' ? 'text-indigo-400' : 'text-white/30'}`}>{step.label}</span>
                            <span className={`text-[9px] font-medium tracking-wide ${step.status === 'complete' ? 'text-white/60' : step.status === 'current' ? 'text-white/90' : 'text-white/10'}`}>{step.sub}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DigitalIdCard: React.FC<{ student: StudentForAdmin }> = ({ student }) => {
    const [isPrinting, setIsPrinting] = useState(false);
    const verificationData = encodeURIComponent(JSON.stringify({ 
        id: student.student_id_number || student.id, 
        name: student.display_name, 
        valid: student.is_active 
    }));
    const qrUrl = `https://quickchart.io/qr?text=${verificationData}&size=200&margin=1&ecLevel=H&format=png&dark=000000&light=ffffff`;
    
    const handlePrint = useCallback(() => { 
        setIsPrinting(true); 
        setTimeout(() => { 
            window.print(); 
            setIsPrinting(false); 
        }, 100); 
    }, []);

    const isEnrolled = !!(student.student_id_number && student.assigned_class_id);

    return (
        <div className="flex flex-col items-center gap-6">
             <style>{`@media print { @page { size: auto; margin: 0; } body { background-color: #fff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } body * { visibility: hidden; } #id-card-print-container, #id-card-print-container * { visibility: visible; } #id-card-print-container { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 320px; height: 520px; box-shadow: none !important; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; background-color: #0a0a0c !important; z-index: 9999; } .no-print { display: none !important; } }`}</style>
            
            <div className="relative group perspective-1000">
                <div className="absolute -top-10 left-0 right-0 text-center pointer-events-none">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 bg-[#0a0a0c] px-3 py-1 rounded-full border border-white/10 shadow-xl backdrop-blur-md">Official Student ID</span>
                </div>

                <div id="id-card-print-container" className="relative w-[320px] h-[520px] bg-[#18181b] rounded-[16px] overflow-hidden flex flex-col shadow-2xl border border-white/20 select-none">
                    <div className="h-[28%] bg-gradient-to-b from-[#0f172a] to-[#18181b] relative flex flex-col items-center justify-center pt-6 pb-2 border-b border-white/5">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="mb-3 p-2 bg-white rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                <SchoolIcon className="w-5 h-5 text-black" />
                            </div>
                            <h1 className="text-xl font-serif font-black text-white tracking-widest uppercase leading-none mb-1 text-center">GURUKUL ACADEMY</h1>
                            <p className="text-[7px] text-white/60 uppercase tracking-[0.3em] font-medium">Excellence in Education</p>
                        </div>
                    </div>

                    <div className="flex-grow flex flex-col items-center relative -mt-8 z-20">
                         <div className="relative mb-4">
                            <div className={`w-32 h-32 rounded-full p-1 bg-[#18181b] shadow-2xl ring-2 ${student.is_active ? 'ring-emerald-500' : 'ring-amber-500'}`}>
                                <div className="w-full h-full rounded-full overflow-hidden bg-black">
                                    <img 
                                        src={student.profile_photo_url || `https://api.dicebear.com/8.x/initials/svg?seed=${student.display_name}&backgroundColor=1a1a1a`} 
                                        alt="Student" 
                                        className="w-full h-full object-cover" 
                                    />
                                </div>
                            </div>
                         </div>
                         
                         <div className="text-center w-full px-4 mb-6">
                            <h2 className="text-2xl font-bold text-white leading-tight mb-2 line-clamp-2">{student.display_name}</h2>
                            <span className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/70 uppercase tracking-widest">
                                Student • Grade {student.grade}
                            </span>
                         </div>

                         <div className="w-full px-6 space-y-3">
                             <div className="flex justify-between items-center py-2 border-b border-white/5">
                                 <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Student ID</span>
                                 <span className="text-sm font-mono font-bold text-white">{student.student_id_number || 'PENDING'}</span>
                             </div>
                             <div className="flex justify-between items-center py-2 border-b border-white/5">
                                 <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Academic Year</span>
                                 <span className="text-sm font-medium text-white">2025 - 2026</span>
                             </div>
                             <div className="flex justify-between items-center py-2">
                                 <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">DOB</span>
                                 <span className="text-sm font-medium text-white">{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '---'}</span>
                             </div>
                         </div>
                    </div>

                    <div className="mt-auto bg-white p-5 flex items-center justify-between relative overflow-hidden h-[110px]">
                        <div className="z-10 flex flex-col items-center gap-1">
                            <img src={qrUrl} className="w-16 h-16 mix-blend-multiply" alt="QR Code" />
                            <span className="text-[6px] font-bold text-black uppercase tracking-wider">Scan to Verify</span>
                        </div>

                        <div className="flex flex-col items-end z-10 h-full justify-center pl-4">
                            <div className="h-8 flex items-end justify-end gap-[1px] opacity-90 mb-1 w-32 overflow-hidden">
                                {[...Array(40)].map((_,i) => (
                                    <div key={i} className="bg-black" style={{
                                        height: '100%', 
                                        width: Math.random() > 0.6 ? '3px' : '1px',
                                        marginLeft: Math.random() > 0.7 ? '1px' : '0' 
                                    }}></div>
                                ))}
                            </div>
                            <p className="text-[7px] font-bold text-black/60 uppercase tracking-[0.1em]">Property of Gurukul</p>
                        </div>
                    </div>
                    
                    <div className="bg-[#18181b] py-1.5 text-center border-t border-white/5">
                         <p className="text-[6px] text-white/20 uppercase tracking-wider">Official Property of the Institution</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 no-print mt-2 w-full max-w-[320px]">
                {isEnrolled ? (
                    <div className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                        <CheckCircleIcon className="w-4 h-4"/> Enrollment Sealed
                    </div>
                ) : (
                    <button onClick={handlePrint} disabled={isPrinting} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50">
                        {isPrinting ? <Spinner size="sm" className="text-white"/> : <><PrinterIcon className="w-4 h-4"/> Confirm & Print</>}
                    </button>
                )}
                
                <button onClick={handlePrint} disabled={isPrinting} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-card hover:bg-muted text-foreground border border-white/10 rounded-2xl text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-50" title="Use 'Save as PDF' in print dialog">
                    <DownloadIcon className="w-4 h-4"/> Save PDF
                </button>
            </div>
        </div>
    );
};

const CoreInfoCard: React.FC<{ label: string; value?: string | number | null; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#1a1d24] border border-white/5 hover:border-white/10 transition-colors group shadow-sm h-full">
        <div className="w-10 h-10 rounded-xl bg-[#0f1115] flex items-center justify-center text-indigo-400 group-hover:text-white transition-colors shadow-inner flex-shrink-0 border border-white/5">{icon}</div>
        <div className="flex-grow min-w-0">
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">{label}</p>
            {value ? (
                 <p className="text-sm font-bold text-white truncate">{value}</p>
            ) : (
                 <p className="text-xs font-medium text-white/20 italic">Not Assigned</p>
            )}
        </div>
    </div>
);

const InfoRow: React.FC<{ label: string, value?: string | number | null, icon: React.ReactNode, action?: React.ReactNode }> = ({ label, value, icon, action }) => (
    <div className="flex items-center gap-5 py-5 border-b border-white/5 last:border-0 group"><div className="w-10 h-10 rounded-2xl bg-[#1a1d24] flex items-center justify-center text-white/30 group-hover:text-primary group-hover:bg-primary/10 transition-all duration-300 shadow-sm border border-white/5 flex-shrink-0">{icon}</div><div className="flex-grow min-w-0 pr-2"><p className="text-[9px] font-black text-white/30 uppercase tracking-[0.25em] mb-1.5 transition-colors group-hover:text-white/50">{label}</p><p className={`text-sm md:text-base font-serif font-medium truncate ${!value ? 'text-white/20 italic' : 'text-white/90'}`}>{value || 'Not Provided'}</p></div>{action && <div className="ml-auto opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">{action}</div>}</div>
);

export const AssignClassModal: React.FC<{ student: StudentForAdmin, onClose: () => void, onSuccess: (updatedData: { class_id: number; class_name: string }) => void }> = ({ student, onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState<React.ReactNode | null>(null);

    const selectedClass = useMemo(() => classes.find(c => c.id.toString() === selectedClassId), [classes, selectedClassId]);

    const fetchClasses = useCallback(async () => {
        setFetching(true);
        setError(null);
        try {
            const currentGrade = String(student.grade || '').trim();
            const studentGradeNum = parseInt(currentGrade.replace(/\D/g, '')) || null;
            
            const { data: profileBranch } = await supabase.from('student_profiles').select('branch_id').eq('user_id', student.id).maybeSingle();
            
            const { data, error: fetchError } = await supabase.rpc('get_all_classes_for_admin', { 
                p_branch_id: profileBranch?.branch_id || null 
            });
            
            if (fetchError) throw fetchError;
            
            const matchedClasses = (data || []).filter((c: any) => {
                const cGradeRaw = String(c.grade_level || '').trim();
                if (cGradeRaw.toLowerCase() === currentGrade.toLowerCase()) return true;
                const cGradeNum = parseInt(cGradeRaw.replace(/\D/g, '')) || null;
                if (studentGradeNum !== null && cGradeNum !== null && studentGradeNum === cGradeNum) {
                    return true;
                }
                return cGradeRaw.toLowerCase().includes(currentGrade.toLowerCase()) || currentGrade.toLowerCase().includes(cGradeRaw.toLowerCase());
            });
            
            if (matchedClasses.length === 0) {
                setError(<div className="space-y-3"><p className="text-white/80 text-sm">No active sections found for Grade {student.grade}.</p></div>);
                setClasses([]); 
            } else {
                setClasses(matchedClasses);
                if (matchedClasses.length === 1) {
                    setSelectedClassId(matchedClasses[0].id.toString());
                }
            }
        } catch (err: any) {
            console.error("Assign Class Error:", err);
            setError(`System failed to retrieve academic structure: ${formatError(err)}`);
        } finally {
            setFetching(false);
        }
    }, [student.grade, student.id]);

    useEffect(() => { fetchClasses(); }, [fetchClasses]);

    const handleAssign = async () => {
        if (!selectedClassId) {
             alert("Please select a class section first.");
             return;
        }
        
        const targetClass = selectedClass || classes.find(c => c.id.toString() === selectedClassId);
        
        if (!targetClass) {
             alert("Selected class data is invalid. Please re-select.");
             return;
        }

        if (!student || !student.id) {
             alert("Critical Error: Student identity missing. Cannot process assignment.");
             return;
        }

        setLoading(true);
        try {
            const classId = parseInt(selectedClassId);
            
            const { data, error } = await supabase.rpc('admin_assign_student_class', {
                p_student_id: student.id,
                p_class_id: classId,
                p_branch_id: student.branch_id || (targetClass as any).branch_id || null
            });

            if (error) throw error;

            if (data && !data.success) {
                throw new Error(data.message || "Assignment failed on server.");
            }
            
            onSuccess({ class_id: classId, class_name: targetClass.name });
        } catch (err: any) {
            console.error("Assignment error:", err);
            alert("Enrollment Failed: " + (err.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-[#0f1115] w-full max-w-md rounded-3xl shadow-2xl border border-white/10 flex flex-col relative overflow-hidden scale-100 font-serif" onClick={e => e.stopPropagation()}>
                <div className="px-6 pt-6 pb-4 flex justify-between items-center z-10"><div className="flex items-center gap-3"><div className="p-2 bg-white/5 rounded-2xl text-white shadow-inner border border-white/10"><UsersIcon className="w-5 h-5"/></div><h3 className="text-lg font-bold text-white tracking-tight">Guided Enrollment</h3></div><button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/50 hover:text-white"><XIcon className="w-5 h-5"/></button></div>
                <div className="px-6 pb-8 pt-2 flex-grow flex-col min-h-[350px]">
                    {step === 1 ? (
                        <div className="flex flex-col h-full animate-in slide-in-from-right-8 duration-500">
                            <div className="mb-6"><span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em] mb-2 block">Step 1: Placement</span><h4 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none mb-2">Select<br/>Class Section</h4></div>
                            <div className="space-y-6 flex-grow relative z-20"><div className="relative z-50"><label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-3 ml-1">Available Sections</label>{fetching ? <div className="h-[58px] bg-white/5 rounded-xl animate-pulse border border-white/10"></div> : error ? <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs font-bold text-red-400 leading-relaxed shadow-sm">{error}</div> : <CustomSelect value={selectedClassId} onChange={setSelectedClassId} placeholder="Choose a section..." options={classes.map(c => ({ value: c.id.toString(), label: c.name }))} icon={<SchoolIcon className="w-4 h-4"/>} searchable className="relative z-50 font-sans" />}</div></div>
                            <div className="mt-auto pt-6 relative z-10"><button type="button" onClick={() => selectedClassId && setStep(2)} disabled={!selectedClassId || fetching || !!error} className={`w-full py-4 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-3 transition-all duration-300 pointer-events-auto font-sans uppercase tracking-widest ${!selectedClassId || fetching || !!error ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20 hover:-translate-y-0.5'}`}>Continue <ChevronRightIcon className="w-4 h-4"/></button></div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full animate-in slide-in-from-right-8 duration-500">
                            <div className="mb-8"><span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.25em] mb-2 block">Step 2: Confirmation</span><h4 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none mb-4">Confirm<br/>Assignment</h4><div className="p-5 bg-white/5 rounded-[1.5rem] border border-white/10"><p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Target Section</p><p className="text-xl font-bold text-white flex items-center gap-2">{selectedClass?.name} <CheckCircleIcon className="w-5 h-5 text-emerald-500"/></p></div></div>
                            <div className="mt-auto flex flex-col gap-3"><button onClick={handleAssign} disabled={loading} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">{loading ? <Spinner size="sm" className="text-white"/> : <>Finalize Enrollment <CheckCircleIcon className="w-4 h-4"/></>}</button><button onClick={() => setStep(1)} className="w-full py-3 text-[10px] font-black text-white/30 hover:text-white uppercase tracking-widest transition-colors">Back</button></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ student, onClose, onUpdate, initialTab = 'overview' }) => {
    const [activeTab, setActiveTab] = useState<TabType>(initialTab);
    const [isEditing, setIsEditing] = useState(false);
    
    // --- Data States ---
    const [loading, setLoading] = useState(true);
    const [parentData, setParentData] = useState<any>(null);
    const [guardianData, setGuardianData] = useState<any>(null);
    const [docs, setDocs] = useState<any[]>([]);
    const [feesSummary, setFeesSummary] = useState<any>(null);
    const [activityLog, setActivityLog] = useState<any[]>([]);

    // --- Modal States ---
    const [showGuardianEdit, setShowGuardianEdit] = useState<'primary' | 'secondary' | null>(null);
    const [showAssignClass, setShowAssignClass] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [docViewerUrl, setDocViewerUrl] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch Guardians (Parent & Secondary)
            const { data: parentRes } = await supabase.rpc('get_linked_parent_for_student', { p_student_id: student.id });
            if (parentRes && parentRes.found) {
                setParentData({
                    name: parentRes.name,
                    email: parentRes.email,
                    phone: parentRes.phone,
                    relationship: parentRes.relationship
                });
                
                // If secondary parent exists in the returned JSON structure (needs RPC update or separate fetch)
                // For now assuming secondary parent data might come from `parent_profiles` if we query it directly
                // Let's do a direct query for secondary parent details using parent's ID if we have it
                if (parentRes.parent_id) {
                     const { data: secParent } = await supabase
                        .from('parent_profiles')
                        .select('secondary_parent_name, secondary_parent_email, secondary_parent_phone, secondary_parent_relationship')
                        .eq('user_id', parentRes.parent_id)
                        .single();
                     
                     if (secParent && secParent.secondary_parent_name) {
                         setGuardianData({
                             name: secParent.secondary_parent_name,
                             email: secParent.secondary_parent_email,
                             phone: secParent.secondary_parent_phone,
                             relationship: secParent.secondary_parent_relationship
                         });
                     }
                }
            }

            // 2. Fetch Docs (Using admission link)
            const { data: admission } = await supabase
                .from('admissions')
                .select('id')
                .eq('student_user_id', student.id)
                .maybeSingle();
            
            if (admission) {
                 const { data: docList } = await supabase
                    .from('document_requirements')
                    .select('*, admission_documents(*)')
                    .eq('admission_id', admission.id);
                 setDocs(docList || []);
            }

            // 3. Fetch Fees
            const { data: feeData } = await supabase.rpc('get_student_fee_summary', { p_student_id: student.id });
            setFeesSummary(feeData);

            // 4. Mock Activity Log (Replace with real table later)
            setActivityLog([
                { id: 1, action: 'Profile Updated', date: '2025-01-15T10:00:00Z', user: 'Admin' },
                { id: 2, action: 'Class Assigned', date: '2025-01-14T09:30:00Z', user: 'Principal' },
                { id: 3, action: 'Document Verified', date: '2025-01-10T14:20:00Z', user: 'Admin' },
            ]);

        } catch (err) {
            console.error("Profile Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    }, [student.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDocVerify = async (docId: number) => {
        await supabase.from('document_requirements').update({ status: 'Verified' }).eq('id', docId);
        fetchData();
    };

    const handleDocReject = async (docId: number) => {
        const reason = prompt("Reason for rejection:");
        if (reason) {
            await supabase.from('document_requirements').update({ status: 'Rejected', rejection_reason: reason }).eq('id', docId);
            fetchData();
        }
    };

    const handleDocView = async (path: string) => {
        const url = await StorageService.getSignedUrl(path);
        window.open(url, '_blank');
    };

    const hasClass = !!(student.assigned_class_id && student.assigned_class_name);

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-0 md:p-6 overflow-hidden">
            <div className="bg-[#08090a] w-full max-w-[1400px] h-full md:h-[92vh] md:rounded-[3rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden relative ring-1 ring-white/5 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-white/[0.04] bg-[#0c0d12]/80 flex justify-between items-center shrink-0 z-20 backdrop-blur-xl">
                    <div className="flex items-center gap-6">
                        <PremiumAvatar src={student.profile_photo_url} name={student.display_name} size="md" className="shadow-2xl border-2 border-white/10 rounded-2xl" />
                        <div>
                            <h2 className="text-2xl font-serif font-black text-white tracking-tight uppercase leading-none mb-1">{student.display_name}</h2>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] bg-white/5 px-2 py-0.5 rounded border border-white/5">ID: {student.student_id_number || 'PENDING'}</span>
                                <div className="w-1 h-1 rounded-full bg-white/20"></div>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${student.is_active ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {student.is_active ? 'Active Status' : 'Suspended'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setIsEditing(true)} className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl border border-white/10 transition-all">
                            <EditIcon className="w-4 h-4"/> Edit Profile
                        </button>
                        <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-colors"><XIcon className="w-6 h-6"/></button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
                    {/* Sidebar Nav */}
                    <div className="w-full md:w-72 bg-[#0a0b10] border-r border-white/5 flex-shrink-0 flex flex-col">
                        <div className="p-6 space-y-1 overflow-y-auto custom-scrollbar flex-grow">
                            <p className="px-4 text-[9px] font-black text-white/20 uppercase tracking-[0.25em] mb-4">Core Registry</p>
                            <TabButton id="overview" label="Overview" icon={<ActivityIcon className="w-4 h-4"/>} active={activeTab === 'overview'} onClick={setActiveTab} />
                            <TabButton id="parents" label="Guardians" icon={<UsersIcon className="w-4 h-4"/>} active={activeTab === 'parents'} onClick={setActiveTab} />
                            <TabButton id="academic" label="Academics" icon={<GraduationCapIcon className="w-4 h-4"/>} active={activeTab === 'academic'} onClick={setActiveTab} />
                            
                            <p className="px-4 text-[9px] font-black text-white/20 uppercase tracking-[0.25em] mt-8 mb-4">Administration</p>
                            <TabButton id="documents" label="Documents" icon={<FileTextIcon className="w-4 h-4"/>} active={activeTab === 'documents'} onClick={setActiveTab} />
                            <TabButton id="fees" label="Financials" icon={<CreditCardIcon className="w-4 h-4"/>} active={activeTab === 'fees'} onClick={setActiveTab} />
                            <TabButton id="history" label="Audit Log" icon={<ClockIcon className="w-4 h-4"/>} active={activeTab === 'history'} onClick={setActiveTab} />
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-grow bg-[#08090a] overflow-y-auto custom-scrollbar p-8 md:p-12 relative">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <Spinner size="lg" className="text-primary"/>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'overview' && (
                                    <div className="space-y-10 max-w-4xl animate-in fade-in slide-in-from-right-4 duration-500">
                                         {/* Quick Stats Grid */}
                                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                             <div className="p-6 rounded-[2rem] bg-[#0c0e12] border border-white/5 flex flex-col justify-between h-32 group hover:border-white/10 transition-all">
                                                 <div className="flex justify-between items-start">
                                                     <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500"><SchoolIcon className="w-5 h-5"/></div>
                                                     <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Placement</span>
                                                 </div>
                                                 <div>
                                                     <p className="text-xl font-bold text-white">{student.assigned_class_name || 'Unassigned'}</p>
                                                     <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">Current Class</p>
                                                 </div>
                                             </div>
                                             <div className="p-6 rounded-[2rem] bg-[#0c0e12] border border-white/5 flex flex-col justify-between h-32 group hover:border-white/10 transition-all">
                                                 <div className="flex justify-between items-start">
                                                     <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500"><CheckCircleIcon className="w-5 h-5"/></div>
                                                     <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Attendance</span>
                                                 </div>
                                                 <div>
                                                     <p className="text-xl font-bold text-white">94% <span className="text-sm font-normal text-white/40">Avg</span></p>
                                                     <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">Participation</p>
                                                 </div>
                                             </div>
                                             <div className="p-6 rounded-[2rem] bg-[#0c0e12] border border-white/5 flex flex-col justify-between h-32 group hover:border-white/10 transition-all">
                                                 <div className="flex justify-between items-start">
                                                     <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500"><DollarSignIcon className="w-5 h-5"/></div>
                                                     <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Balance</span>
                                                 </div>
                                                 <div>
                                                     <p className={`text-xl font-bold ${feesSummary?.outstanding_balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{formatCurrency(feesSummary?.outstanding_balance || 0)}</p>
                                                     <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">Outstanding Dues</p>
                                                 </div>
                                             </div>
                                         </div>

                                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                              <div className="space-y-6">
                                                  <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.25em]">Personal Details</h3>
                                                  <div className="space-y-4">
                                                      <InfoRow label="Legal Name" value={student.display_name} icon={<UserIcon className="w-4 h-4"/>} />
                                                      <InfoRow label="Gender" value={student.gender} icon={<UserIcon className="w-4 h-4"/>} />
                                                      <InfoRow label="Date of Birth" value={student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : null} icon={<CalendarIcon className="w-4 h-4"/>} />
                                                      <InfoRow label="Address" value={student.address} icon={<LocationIcon className="w-4 h-4"/>} />
                                                  </div>
                                              </div>
                                              <div className="space-y-6">
                                                  <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.25em]">Contact Information</h3>
                                                  <div className="space-y-4">
                                                      <InfoRow label="Primary Email" value={student.email} icon={<MailIcon className="w-4 h-4"/>} />
                                                      <InfoRow label="Student Phone" value={student.phone} icon={<PhoneIcon className="w-4 h-4"/>} />
                                                      <InfoRow label="Parent Contact" value={parentData?.phone} icon={<PhoneIcon className="w-4 h-4"/>} />
                                                  </div>
                                                  <div className="mt-8 pt-8 border-t border-white/5">
                                                      <DigitalIdCard student={student} />
                                                  </div>
                                              </div>
                                         </div>
                                    </div>
                                )}

                                {activeTab === 'parents' && (
                                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 max-w-5xl">
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                             <GuardianCard 
                                                title="Primary Guardian" 
                                                data={parentData} 
                                                isPrimary 
                                                onEdit={() => setShowGuardianEdit('primary')}
                                             />
                                             <GuardianCard 
                                                title="Secondary Guardian" 
                                                data={guardianData} 
                                                onEdit={() => setShowGuardianEdit('secondary')}
                                             />
                                         </div>
                                         {!parentData && (
                                             <div className="p-8 border-2 border-dashed border-white/10 rounded-[2rem] text-center bg-white/[0.01]">
                                                 <p className="text-white/40 text-sm font-medium">No parent accounts linked to this student node.</p>
                                                 <button className="mt-4 text-primary text-xs font-bold uppercase tracking-widest hover:underline">Link Existing Parent</button>
                                             </div>
                                         )}
                                    </div>
                                )}

                                {activeTab === 'academic' && (
                                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 max-w-4xl">
                                        <div className="bg-[#0c0e12] border border-white/5 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-10 opacity-[0.03]"><SchoolIcon className="w-40 h-40"/></div>
                                            
                                            <div className="relative z-10 flex justify-between items-start mb-10">
                                                <div>
                                                    <h3 className="text-2xl font-black text-white tracking-tight">Academic Placement</h3>
                                                    <p className="text-sm text-white/40 mt-1">Class assignment and enrollment status.</p>
                                                </div>
                                                <button 
                                                    onClick={() => setShowAssignClass(true)} 
                                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
                                                >
                                                    {hasClass ? 'Reassign Class' : 'Enroll in Class'}
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <CoreInfoCard label="Current Grade" value={`Grade ${student.grade}`} icon={<GraduationCapIcon className="w-5 h-5"/>} />
                                                <CoreInfoCard label="Assigned Section" value={student.assigned_class_name} icon={<SchoolIcon className="w-5 h-5"/>} />
                                            </div>
                                            
                                            {!hasClass && (
                                                <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-amber-500">
                                                    <AlertTriangleIcon className="w-5 h-5"/>
                                                    <span className="text-xs font-bold uppercase tracking-wide">Student is currently unassigned</span>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.25em] mb-6">Subject Performance</h3>
                                            <div className="p-12 text-center border-2 border-dashed border-white/10 rounded-[2.5rem] text-white/20">
                                                <ChartBarIcon className="w-12 h-12 mx-auto mb-4 opacity-50"/>
                                                <p className="text-sm font-medium">Grades and academic records module is loading...</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'documents' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                         <div className="flex justify-between items-center">
                                             <h3 className="text-lg font-bold text-white">Digital Vault</h3>
                                             <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2">
                                                 <PlusIcon className="w-4 h-4"/> Request Document
                                             </button>
                                         </div>
                                         
                                         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                             {docs.map(doc => (
                                                 <DocumentCard 
                                                    key={doc.id} 
                                                    doc={doc} 
                                                    onVerify={handleDocVerify} 
                                                    onReject={handleDocReject} 
                                                    onView={handleDocView}
                                                />
                                             ))}
                                             {docs.length === 0 && (
                                                 <div className="col-span-full py-20 text-center text-white/20 border-2 border-dashed border-white/5 rounded-[2rem]">
                                                     <FileTextIcon className="w-12 h-12 mx-auto mb-4 opacity-30"/>
                                                     <p className="text-sm font-bold uppercase tracking-widest">Vault Empty</p>
                                                 </div>
                                             )}
                                         </div>
                                    </div>
                                )}

                                {activeTab === 'fees' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 max-w-5xl">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="p-6 bg-[#0c0e12] border border-white/5 rounded-[2rem] text-center">
                                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">Total Billed</p>
                                                <p className="text-2xl font-mono font-black text-white mt-1">{formatCurrency(feesSummary?.total_billed)}</p>
                                            </div>
                                            <div className="p-6 bg-[#0c0e12] border border-white/5 rounded-[2rem] text-center">
                                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">Collected</p>
                                                <p className="text-2xl font-mono font-black text-emerald-500 mt-1">{formatCurrency(feesSummary?.total_paid)}</p>
                                            </div>
                                            <div className="p-6 bg-[#0c0e12] border border-white/5 rounded-[2rem] text-center">
                                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">Due Balance</p>
                                                <p className="text-2xl font-mono font-black text-red-500 mt-1">{formatCurrency(feesSummary?.outstanding_balance)}</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <button 
                                                onClick={() => setShowPayment(true)}
                                                className="px-8 py-3 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2"
                                            >
                                                <ReceiptIcon className="w-4 h-4"/> Record Manual Payment
                                            </button>
                                        </div>

                                        <div className="border border-white/5 rounded-[2rem] overflow-hidden bg-[#0c0e12]">
                                            <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                                                <h4 className="font-bold text-white text-sm uppercase tracking-wide">Transaction History</h4>
                                            </div>
                                            <div className="p-8 text-center text-white/20 text-sm italic">
                                                Full ledger details available in Finance Module.
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {activeTab === 'history' && (
                                     <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 max-w-3xl">
                                         <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.25em]">Audit Trail</h3>
                                         <div className="relative border-l border-white/10 ml-3 space-y-8 py-2">
                                             {activityLog.map((log, i) => (
                                                 <div key={i} className="relative pl-8 group">
                                                     <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#1a1d23] border border-white/20 group-hover:border-primary group-hover:bg-primary transition-colors"></div>
                                                     <p className="text-sm font-bold text-white">{log.action}</p>
                                                     <p className="text-xs text-white/40 mt-0.5">
                                                         {new Date(log.date).toLocaleString()} • by <span className="text-primary">{log.user}</span>
                                                     </p>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Sub-Modals */}
            {isEditing && (
                <EditStudentDetailsModal 
                    student={student} 
                    onClose={() => setIsEditing(false)} 
                    onSave={() => { setIsEditing(false); onUpdate(); }} 
                />
            )}
            {showGuardianEdit && (
                <GuardianEditModal 
                    type={showGuardianEdit}
                    initialData={showGuardianEdit === 'primary' ? parentData : guardianData}
                    parentId={showGuardianEdit === 'primary' ? student.id : undefined} // Secondary usually doesn't have own user_id in this context, stored in parent profile
                    onClose={() => setShowGuardianEdit(null)}
                    onSave={() => { setShowGuardianEdit(null); fetchData(); }}
                />
            )}
            {showAssignClass && (
                <AssignClassModal 
                    student={student} 
                    onClose={() => setShowAssignClass(false)} 
                    onSuccess={() => { setShowAssignClass(false); onUpdate(); }} 
                />
            )}
            {showPayment && (
                <RecordPaymentModal 
                    studentId={student.id}
                    studentName={student.display_name}
                    onClose={() => setShowPayment(false)}
                    onSuccess={() => { setShowPayment(false); fetchData(); }}
                />
            )}
        </div>
    );
};

export default StudentProfileModal;