import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { StudentForAdmin, SchoolClass, Course } from '../../types';
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
import CustomSelect from '../common/CustomSelect';
import RecordPaymentModal from '../finance/RecordPaymentModal';

interface StudentProfileModalProps {
    student: StudentForAdmin;
    onClose: () => void;
    onUpdate: () => void;
    initialTab?: TabType;
}

type TabType = 'overview' | 'parents' | 'academic' | 'documents' | 'fees' | 'history';

// --- SUB-COMPONENTS ---

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0
    }).format(amount || 0);
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
            {/* Ambient Glow */}
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
                        <button type="submit" disabled={loading} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 flex items-center gap-2 transition-all uppercase tracking-wider hover:-translate-y-0.5">
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
    const verificationData = encodeURIComponent(JSON.stringify({ id: student.student_id_number || student.id, name: student.display_name, valid: student.is_active }));
    const qrUrl = `https://quickchart.io/qr?text=${verificationData}&size=200&margin=1&ecLevel=H&format=png`;
    const handlePrint = useCallback(() => { setIsPrinting(true); setTimeout(() => { window.print(); setIsPrinting(false); }, 100); }, []);

    return (
        <div className="flex flex-col items-center gap-6">
             <style>{`@media print { @page { size: auto; margin: 0; } body { background-color: #fff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } body * { visibility: hidden; } #id-card-print-container, #id-card-print-container * { visibility: visible; } #id-card-print-container { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 320px; height: 520px; box-shadow: none !important; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; background-color: #0a0a0c !important; z-index: 9999; } .no-print { display: none !important; } }`}</style>
            <div id="id-card-print-container" className="relative group perspective-1000 w-[320px] h-[520px] select-none mx-auto">
                <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[24px] blur opacity-30 group-hover:opacity-60 transition duration-1000 no-print"></div>
                <div className="relative w-full h-full bg-[#0a0a0c] rounded-[20px] shadow-2xl overflow-hidden flex flex-col border border-white/20">
                    <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)`, backgroundSize: '24px 24px' }}></div>
                    <div className="h-[28%] bg-gradient-to-b from-[#18181b] to-[#0a0a0c] relative overflow-hidden flex flex-col items-center justify-start pt-8 border-b border-white/10">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-purple-500/10 opacity-50"></div>
                        <div className="flex flex-col items-center z-10 mb-1">
                            <div className="mb-3 p-2 bg-white rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)]"><SchoolIcon className="w-6 h-6 text-black" /></div>
                            <h1 className="text-xl font-serif font-black text-white tracking-widest uppercase leading-none mb-1 text-shadow-sm">GURUKUL ACADEMY</h1>
                            <p className="text-[8px] text-white/50 uppercase tracking-[0.4em] font-medium">Excellence in Education</p>
                        </div>
                    </div>
                    <div className="flex-grow flex flex-col items-center relative -mt-10 z-20">
                        <div className="relative mb-5">
                            <div className={`w-36 h-36 rounded-full p-1.5 bg-gradient-to-b ${student.is_active ? 'from-emerald-400 to-emerald-600' : 'from-amber-400 to-amber-600'} shadow-[0_8px_30px_rgba(0,0,0,0.6)]`}>
                                <div className="w-full h-full rounded-full border-[5px] border-[#0a0a0c] overflow-hidden bg-[#1a1a1a]"><img src={student.profile_photo_url || `https://api.dicebear.com/8.x/initials/svg?seed=${student.display_name}&backgroundColor=1a1a1a`} alt="Student" className="w-full h-full object-cover" /></div>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-[#0a0a0c] rounded-full p-1.5 border border-white/10">{student.is_active ? <CheckCircleIcon className="w-6 h-6 text-emerald-500"/> : <ClockIcon className="w-6 h-6 text-amber-500"/>}</div>
                        </div>
                        <div className="text-center w-full px-6 flex flex-col items-center">
                            <h2 className="text-3xl font-serif font-bold text-white leading-none mb-2 line-clamp-1 drop-shadow-md">{student.display_name}</h2>
                            <span className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-6">Student • Grade {student.grade}</span>
                            <div className="grid grid-cols-2 gap-y-3 gap-x-6 w-full text-left bg-white/[0.03] rounded-2xl p-5 border border-white/5 backdrop-blur-sm">
                                <div><p className="text-[7px] font-bold text-white/30 uppercase tracking-wider mb-0.5">ID Number</p><p className="text-sm font-mono font-bold text-white tracking-wide">{student.student_id_number || 'PENDING'}</p></div>
                                <div><p className="text-[7px] font-bold text-white/30 uppercase tracking-wider mb-0.5">Academic Year</p><p className="text-sm font-mono font-bold text-white tracking-wide">{new Date().getFullYear()}-{new Date().getFullYear()+1}</p></div>
                                <div><p className="text-[7px] font-bold text-white/30 uppercase tracking-wider mb-0.5">Date of Birth</p><p className="text-sm font-mono font-bold text-white tracking-wide">{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: '2-digit'}) : '---'}</p></div>
                                <div><p className="text-[7px] font-bold text-white/30 uppercase tracking-wider mb-0.5">Blood Group</p><p className="text-sm font-mono font-bold text-white tracking-wide">O+ <span className="text-[8px] text-white/20">(Sim)</span></p></div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-auto bg-white p-5 flex items-center justify-between relative overflow-hidden h-20">
                        <div className="z-10 flex items-center gap-3"><img src={qrUrl} className="w-12 h-12 mix-blend-multiply" alt="QR Code" /><div className="flex flex-col"><span className="text-[8px] font-black text-black uppercase tracking-wider">Scan to Verify</span><span className="text-[6px] text-black/50 font-mono mt-0.5 max-w-[80px] leading-tight">Digital verification enabled via secure portal.</span></div></div>
                        <div className="text-right z-10 flex flex-col items-end justify-center h-full"><div className="h-6 flex items-end justify-end gap-[2px] opacity-80 mb-1">{[...Array(24)].map((_,i) => <div key={i} className="bg-black" style={{height: Math.random() > 0.5 ? '100%' : '60%', width: Math.random() > 0.5 ? '2px' : '1px'}}></div>)}</div><p className="text-[7px] font-bold text-black/40 uppercase tracking-[0.2em]">Property of Gurukul</p></div>
                        <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>
                    </div>
                </div>
            </div>
            <div className="flex gap-4 no-print mt-4 w-full max-w-[320px]">
                <button onClick={handlePrint} disabled={isPrinting} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50">{isPrinting ? <Spinner size="sm" className="text-white"/> : <><PrinterIcon className="w-4 h-4"/> Print ID</>}</button>
                <button onClick={handlePrint} disabled={isPrinting} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-card hover:bg-muted text-foreground border border-white/10 rounded-2xl text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-50" title="Use 'Save as PDF' in print dialog"><DownloadIcon className="w-4 h-4"/> Save PDF</button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center no-print max-w-[300px] opacity-60">Tip: Use "Save as PDF" in the print dialog to export a high-quality copy.</p>
        </div>
    );
};

const CoreInfoCard: React.FC<{ label: string; value?: string | number | null; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="flex items-center gap-5 p-5 rounded-[1.5rem] bg-[#1a1d24] border border-white/5 hover:border-white/10 transition-colors group shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-[#0f1115] flex items-center justify-center text-indigo-400 group-hover:text-white transition-colors shadow-inner flex-shrink-0 border border-white/5">{icon}</div>
        <div className="flex-grow min-w-0"><p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5">{label}</p><p className="text-base font-serif font-medium text-white/90 truncate">{value || 'N/A'}</p></div>
    </div>
);

const InfoRow = ({ label, value, icon, action }: { label: string, value?: string | number | null, icon: React.ReactNode, action?: React.ReactNode }) => (
    <div className="flex items-center gap-5 py-5 border-b border-white/5 last:border-0 group"><div className="w-10 h-10 rounded-2xl bg-[#1a1d24] flex items-center justify-center text-white/30 group-hover:text-primary group-hover:bg-primary/10 transition-all duration-300 shadow-sm border border-white/5 flex-shrink-0">{icon}</div><div className="flex-grow min-w-0 pr-2"><p className="text-[9px] font-black text-white/30 uppercase tracking-[0.25em] mb-1.5 transition-colors group-hover:text-white/50">{label}</p><p className={`text-sm md:text-base font-serif font-medium truncate ${!value ? 'text-white/20 italic' : 'text-white/90'}`}>{value || 'Not Provided'}</p></div>{action && <div className="ml-auto opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">{action}</div>}</div>
);

const AssignClassModal: React.FC<{ student: StudentForAdmin, onClose: () => void, onSuccess: (updatedData: { class_id: number; class_name: string }) => void }> = ({ student, onClose, onSuccess }) => {
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
            const numericGrade = currentGrade.replace(/[^0-9]/g, '');
            const { data: profileBranch } = await supabase.from('student_profiles').select('branch_id').eq('user_id', student.id).maybeSingle();
            const { data, error: fetchError } = await supabase.rpc('get_all_classes_for_admin', { p_branch_id: profileBranch?.branch_id || null });
            if (fetchError) throw fetchError;
            const matchedClasses = (data || []).filter((c: any) => {
                const cGradeLevel = String(c.grade_level || '').trim();
                const cNumeric = cGradeLevel.replace(/[^0-9]/g, '');
                return (cGradeLevel.toLowerCase() === currentGrade.toLowerCase() || cNumeric === numericGrade || cGradeLevel === numericGrade || (numericGrade && cGradeLevel.toLowerCase().includes(`grade ${numericGrade}`)));
            });
            if (matchedClasses.length === 0) {
                setError(<div className="space-y-3"><p className="text-white/80 text-sm">No active sections found for Grade {student.grade}.</p></div>);
            } else {
                setClasses(matchedClasses);
                if (matchedClasses.length === 1) setSelectedClassId(matchedClasses[0].id.toString());
            }
        } catch (err: any) {
            setError("System failed to retrieve academic structure.");
        } finally {
            setFetching(false);
        }
    }, [student.grade, student.id]);

    useEffect(() => { fetchClasses(); }, [fetchClasses]);

    const handleAssign = async () => {
        if (!selectedClassId || !selectedClass) return;
        setLoading(true);
        try {
            const { error: updateError } = await supabase.from('student_profiles').update({ assigned_class_id: parseInt(selectedClassId), updated_at: new Date().toISOString() }).eq('user_id', student.id);
            if (updateError) throw updateError;
            onSuccess({ class_id: selectedClass.id, class_name: selectedClass.name });
        } catch (err: any) {
            alert("Placement Error: " + err.message);
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
                            <div className="mt-auto pt-6 relative z-10"><button type="button" onClick={() => selectedClassId && setStep(2)} disabled={!selectedClassId || fetching || !!error} className={`w-full py-4 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-3 transition-all duration-300 pointer-events-auto font-sans uppercase tracking-widest ${!selectedClassId || fetching || !!error ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20 hover:-translate-y-1 active:scale-95'}`}>Continue <ChevronRightIcon className="w-4 h-4"/></button></div>
                        </div>
                    ) : (
                         <div className="flex-grow flex flex-col h-full animate-in slide-in-from-right-8 duration-500">
                             <div className="mb-6"><span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.25em] mb-2 block">Step 2: Confirmation</span><h4 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none mb-2">Final<br/>Verification</h4></div>
                            <div className="bg-[#13151b] border border-white/10 rounded-[2rem] p-6 space-y-4 shadow-inner relative overflow-hidden flex-grow mb-6">
                                 <div className="flex justify-between items-center py-2 border-b border-white/5"><span className="text-[10px] font-black text-white/30 uppercase tracking-wider">Candidate</span><span className="text-sm font-black text-white uppercase truncate ml-2">{student.display_name}</span></div>
                                 <div className="flex justify-between items-center py-2 border-b border-white/5"><span className="text-[10px] font-black text-white/30 uppercase tracking-wider">Assigned Unit</span><span className="text-sm font-black text-indigo-400">{selectedClass?.name}</span></div>
                                 <div className="flex justify-between items-center py-2"><span className="text-[10px] font-black text-white/30 uppercase tracking-wider">Faculty</span><span className="text-sm font-bold text-white truncate ml-4">{selectedClass?.class_teacher_id ? 'Assigned' : 'Pending'}</span></div>
                            </div>
                            <div className="mt-auto pt-4 space-y-3"><button type="button" onClick={handleAssign} disabled={loading} className="w-full py-4 bg-emerald-600 text-white font-black text-sm rounded-[1.5rem] shadow-xl shadow-emerald-500/20 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:transform-none uppercase tracking-widest font-sans">{loading ? <Spinner size="sm" className="text-white" /> : <><CheckCircleIcon className="w-5 h-5"/> Confirm Enrollment</>}</button><button type="button" onClick={() => setStep(1)} disabled={loading} className="w-full py-3 text-xs font-black text-white/30 hover:text-white transition-colors uppercase tracking-widest">Back</button></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ student, onClose, onUpdate, initialTab = 'overview' }) => {
    const [localStudent, setLocalStudent] = useState<StudentForAdmin>(student);
    const [activeTab, setActiveTab] = useState<TabType>(initialTab);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [hasMappings, setHasMappings] = useState(false);
    const [guardians, setGuardians] = useState<{ primary: any, secondary: any } | null>(null);
    const [financeData, setFinanceData] = useState<{ invoices: any[], payments: any[] } | null>(null);
    const [financeLoading, setFinanceLoading] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    
    // Academic Data State
    const [academicData, setAcademicData] = useState<{
        subjects: Course[];
        teacher: any;
        schedule: any[];
    } | null>(null);
    const [academicLoading, setAcademicLoading] = useState(false);

    // Documents State
    const [documents, setDocuments] = useState<any[]>([]);
    const [docsLoading, setDocsLoading] = useState(false);
    
    // Guardian Editing State
    const [isGuardianModalOpen, setIsGuardianModalOpen] = useState(false);
    const [editingGuardianType, setEditingGuardianType] = useState<'primary' | 'secondary'>('primary');
    
    // Responsive Sidebar State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [generatingId, setGeneratingId] = useState(false);

    const fetchProfileDetails = useCallback(async (optimisticUpdate?: Partial<StudentForAdmin>) => {
        if (optimisticUpdate) {
            setLocalStudent(prev => ({ ...prev, ...optimisticUpdate }));
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_all_students_for_admin');
            if (data && !error) {
                const current = (data as StudentForAdmin[]).find(s => s.id === localStudent.id);
                if (current) setLocalStudent(current);
            }

            const numericGrade = localStudent.grade.replace(/[^0-9]/g, '');
            let query = supabase
                .from('school_classes')
                .select('id')
                .or(`grade_level.eq.${localStudent.grade},grade_level.eq.${numericGrade},grade_level.ilike.Grade ${numericGrade}%`);
            
            const { data: profileBranch } = await supabase.from('student_profiles').select('branch_id').eq('user_id', localStudent.id).maybeSingle();
            if (profileBranch?.branch_id) {
                query = query.eq('branch_id', profileBranch.branch_id);
            }

            const { data: mappings } = await query.limit(1);
            setHasMappings(!!(mappings && mappings.length > 0));

        } catch (e) {
            console.error("Profile refresh error", e);
        } finally {
            setLoading(false);
        }
    }, [localStudent.id, localStudent.grade]);

    const fetchFinanceData = useCallback(async () => {
        setFinanceLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_student_finance_details', { p_student_id: localStudent.id });
            if (data) setFinanceData(data);
        } catch (e) { console.error(e); }
        finally { setFinanceLoading(false); }
    }, [localStudent.id]);

    useEffect(() => {
        fetchProfileDetails();
    }, [fetchProfileDetails]);

    // Enhanced Fetch Guardian Data
    const fetchGuardians = useCallback(async () => {
        const { data: admission } = await supabase.from('admissions').select('parent_id, parent_name, parent_email, parent_phone').eq('student_user_id', localStudent.id).maybeSingle();
        let primary = null;
        let secondary = null;
        if (admission) {
            if (admission.parent_id) {
                 const { data: parentProfile } = await supabase.from('parent_profiles').select('*').eq('user_id', admission.parent_id).single();
                 const { data: userProfile } = await supabase.from('profiles').select('display_name, email, phone').eq('id', admission.parent_id).single();
                 if (parentProfile) {
                     primary = { id: admission.parent_id, name: userProfile?.display_name || admission.parent_name, email: userProfile?.email || admission.parent_email, phone: userProfile?.phone || admission.parent_phone, relationship: parentProfile.relationship_to_student, address: parentProfile.address };
                     if (parentProfile.secondary_parent_name) { secondary = { name: parentProfile.secondary_parent_name, relationship: parentProfile.secondary_parent_relationship, email: parentProfile.secondary_parent_email, phone: parentProfile.secondary_parent_phone }; }
                 }
            } else { primary = { name: admission.parent_name, email: admission.parent_email, phone: admission.parent_phone, relationship: 'Guardian' }; }
        } else { primary = { name: localStudent.parent_guardian_details, relationship: 'Primary Contact' }; }
        setGuardians({ primary, secondary });
    }, [localStudent.id, localStudent.parent_guardian_details]);

    // Fetch Academic Data
    const fetchAcademicData = useCallback(async () => {
        if (!localStudent.assigned_class_id) {
             setAcademicData({ subjects: [], teacher: null, schedule: [] });
             return;
        }
        setAcademicLoading(true);
        try {
            const { data: classData } = await supabase.from('school_classes').select('class_teacher_id').eq('id', localStudent.assigned_class_id).single();
            let teacher = null;
            if (classData?.class_teacher_id) {
                const { data: teacherProfile } = await supabase.from('profiles').select('display_name, email, phone').eq('id', classData.class_teacher_id).single();
                const { data: teacherDetails } = await supabase.from('teacher_profiles').select('profile_picture_url, qualification, subject').eq('user_id', classData.class_teacher_id).single();
                if (teacherProfile) { teacher = { ...teacherProfile, ...teacherDetails }; }
            }
            const { data: subjectsData } = await supabase.from('class_subjects').select('subject_id, courses(title, code, credits, category)').eq('class_id', localStudent.assigned_class_id);
            const subjects = subjectsData ? subjectsData.map((s: any) => s.courses).filter(Boolean) : [];
            setAcademicData({ subjects, teacher, schedule: [] });
        } catch (error) { console.error("Academic fetch error:", error); } finally { setAcademicLoading(false); }
    }, [localStudent.assigned_class_id]);

    // NEW: Fetch Documents
    const fetchDocuments = useCallback(async () => {
        setDocsLoading(true);
        try {
            // Find admission ID for this student user
            const { data: admission } = await supabase.from('admissions').select('id').eq('student_user_id', localStudent.id).maybeSingle();
            if (admission) {
                const { data: docsData, error } = await supabase
                    .from('document_requirements')
                    .select('*, admission_documents(*)')
                    .eq('admission_id', admission.id);
                
                if (error) throw error;
                setDocuments(docsData || []);
            }
        } catch (err) {
            console.error("Docs fetch error:", err);
        } finally {
            setDocsLoading(false);
        }
    }, [localStudent.id]);

    useEffect(() => {
        if (activeTab === 'parents') fetchGuardians();
        if (activeTab === 'academic') fetchAcademicData();
        if (activeTab === 'documents') fetchDocuments();
        if (activeTab === 'fees') fetchFinanceData();
    }, [activeTab, fetchGuardians, fetchAcademicData, fetchDocuments, fetchFinanceData]);

    const handleAssignSuccess = (updatedData: { class_id: number; class_name: string }) => {
        setIsAssignModalOpen(false);
        setSuccessMessage("Placement Finalized. Enrollment successfully sealed.");
        fetchProfileDetails({ assigned_class_id: updatedData.class_id, assigned_class_name: updatedData.class_name });
        if (activeTab === 'academic') fetchAcademicData();
        onUpdate();
        setTimeout(() => setSuccessMessage(null), 4000);
    };
    
    const handleSync = () => {
        fetchGuardians();
        setSuccessMessage("Contact information synchronized.");
        setTimeout(() => setSuccessMessage(null), 2000);
    };

    const generateStudentId = async () => {
        setGeneratingId(true);
        try {
            const year = new Date().getFullYear();
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const newId = `STU-${year}-${randomSuffix}`;
            
            const { error } = await supabase
                .from('student_profiles')
                .update({ student_id_number: newId })
                .eq('user_id', localStudent.id);

            if (error) throw error;

            setLocalStudent(prev => ({ ...prev, student_id_number: newId }));
            setSuccessMessage("Student ID System-Generated Successfully.");
            setTimeout(() => setSuccessMessage(null), 3000);
            onUpdate();
        } catch (e: any) {
            console.error("ID Generation Error:", e);
            alert("Failed to generate ID: " + e.message);
        } finally {
            setGeneratingId(false);
        }
    };

    const handleVerifyDocument = async (docId: number) => {
        try {
            const { error } = await supabase.from('document_requirements').update({ status: 'Verified' }).eq('id', docId);
            if (error) throw error;
            fetchDocuments();
        } catch (e) { console.error(e); alert("Failed to verify document"); }
    };

    const handleRejectDocument = async (docId: number) => {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;
        try {
            const { error } = await supabase.from('document_requirements').update({ status: 'Rejected', rejection_reason: reason }).eq('id', docId);
            if (error) throw error;
            fetchDocuments();
        } catch (e) { console.error(e); alert("Failed to reject document"); }
    };

    const handleViewDocument = async (path: string) => {
        try {
            const { data } = await supabase.storage.from('admission-documents').createSignedUrl(path, 3600);
            if (data?.signedUrl) window.open(data.signedUrl, '_blank');
            else alert("Could not generate view link.");
        } catch (e) { console.error(e); }
    };
    
    const GuardianCard = ({ title, data, isPrimary }: { title: string, data: any, isPrimary?: boolean }) => {
        const hasData = data && (data.name || data.email);
        
        const handleAdd = () => {
            setEditingGuardianType(isPrimary ? 'primary' : 'secondary');
            setIsGuardianModalOpen(true);
        };
        
        const handleEdit = () => {
             setEditingGuardianType(isPrimary ? 'primary' : 'secondary');
             setIsGuardianModalOpen(true);
        };

        const handleRemove = async () => {
            if (!confirm(`Are you sure you want to remove the ${title}?`)) return;
            if (isPrimary) {
                alert("Primary guardian cannot be removed, only edited.");
                return;
            }
            if (guardians?.primary?.id) {
                await supabase.from('parent_profiles').update({
                    secondary_parent_name: null,
                    secondary_parent_email: null,
                    secondary_parent_phone: null,
                    secondary_parent_relationship: null
                }).eq('user_id', guardians.primary.id);
                fetchGuardians();
            }
        };

        if (!hasData) {
            return (
                <div onClick={handleAdd} className="bg-[#13151b] border-2 border-dashed border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer group h-full min-h-[280px]">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/10 transition-all border border-white/10"><PlusIcon className="w-6 h-6 text-white/40 group-hover:text-primary" /></div>
                    <p className="font-bold text-white/60 group-hover:text-white transition-colors">Add {title}</p>
                    <p className="text-xs text-white/30 mt-1">Assign an authorized guardian.</p>
                </div>
            )
        }
        return (
            <div className={`relative bg-[#13151b] border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl overflow-hidden ring-1 ring-black/20 flex flex-col h-full group hover:border-white/20 transition-all duration-300 ${isPrimary ? 'bg-gradient-to-br from-indigo-900/10 to-purple-900/10' : ''}`}>
                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                     <button onClick={handleEdit} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md shadow-sm border border-white/10"><EditIcon className="w-4 h-4"/></button>
                     {!isPrimary && <button onClick={handleRemove} className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 backdrop-blur-md shadow-sm border border-red-500/10"><TrashIcon className="w-4 h-4"/></button>}
                </div>
                <div className="flex items-center gap-4 mb-6 md:mb-8">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg border border-white/10 flex-shrink-0 ${isPrimary ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-white/5 text-white/70'}`}>{(data.name || 'G').charAt(0)}</div>
                    <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-1 truncate">{title}</p>
                        <h4 className="text-lg md:text-xl font-serif font-bold text-white leading-tight truncate">{data.name}</h4>
                        <p className="text-xs font-medium text-indigo-400 mt-0.5 truncate">{data.relationship || 'Guardian'}</p>
                    </div>
                    {isPrimary && (<div className="ml-auto p-2 bg-emerald-500/10 rounded-full text-emerald-500 border border-emerald-500/20 hidden md:flex"><ShieldCheckIcon className="w-5 h-5" /></div>)}
                </div>
                <div className="space-y-5 flex-grow">
                    <div className="flex items-center gap-4 group/item"><div className="p-2.5 rounded-xl bg-white/5 text-white/40 group-hover/item:text-white transition-colors border border-white/5"><MailIcon className="w-5 h-5"/></div><div className="min-w-0"><p className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Email</p><p className="text-sm font-medium text-white/80 truncate">{data.email || '—'}</p></div></div>
                    <div className="flex items-center gap-4 group/item"><div className="p-2.5 rounded-xl bg-white/5 text-white/40 group-hover/item:text-white transition-colors border border-white/5"><PhoneIcon className="w-5 h-5"/></div><div className="min-w-0"><p className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Phone</p><p className="text-sm font-medium text-white/80 truncate">{data.phone || '—'}</p></div></div>
                </div>
                <div className="mt-8 pt-6 border-t border-white/5 flex gap-3"><button onClick={handleEdit} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 transition-colors shadow-sm">Edit Details</button><button className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors border border-indigo-500/10"><MailIcon className="w-4 h-4"/></button></div>
            </div>
        );
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Status Pipeline */}
                        <section className="bg-[#13151b] border border-white/10 rounded-3xl md:rounded-[3rem] p-6 md:p-10 shadow-lg relative overflow-hidden ring-1 ring-black/20">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none transform rotate-12"><ClockIcon className="w-48 h-48 text-white" /></div>
                            <h3 className="text-xs font-black uppercase text-white/40 tracking-[0.3em] mb-8 md:mb-10 flex items-center gap-3"><ClockIcon className="w-5 h-5 text-indigo-500" /> Enrollment Lifecycle</h3>
                            <LifecycleStepper isApproved={true} isRegistered={localStudent.profile_completed} isActive={localStudent.is_active} classId={localStudent.assigned_class_id} className={localStudent.assigned_class_name} hasAvailableMappings={hasMappings} />
                        </section>

                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-12">
                            {/* Detailed Panels */}
                            <div className="xl:col-span-7 space-y-8 md:space-y-12 order-2 xl:order-1">
                                {/* Academic Status */}
                                <div className="bg-[#13151b] border border-white/10 rounded-3xl md:rounded-[3rem] p-6 md:p-10 shadow-lg ring-1 ring-black/20 group relative overflow-hidden">
                                     <div className="absolute top-0 right-0 p-6 opacity-[0.02] pointer-events-none"><GraduationCapIcon className="w-32 h-32 text-white" /></div>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 md:mb-10 gap-4 relative z-10">
                                        <h3 className="text-xs font-black uppercase text-white/40 tracking-[0.3em] flex items-center gap-3"><GraduationCapIcon className="w-5 h-5 text-indigo-500" /> Academic Portfolio</h3>
                                        {!localStudent.assigned_class_id && (<button onClick={() => setIsAssignModalOpen(true)} className="w-full sm:w-auto relative px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-500 rounded-2xl text-[10px] font-black tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(99,102,241,0.3)] border border-white/10 animate-pulse active:scale-95"><SparklesIcon className="w-4 h-4" /> INITIATE PLACEMENT</button>)}
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 relative z-10">
                                        <InfoRow label="ACTIVE GRADE" value={`Grade ${localStudent.grade}`} icon={<GraduationCapIcon className="w-5 h-5"/>} />
                                        <InfoRow label="CLASS SECTION" value={localStudent.assigned_class_name || 'PLACEMENT PENDING'} icon={<SchoolIcon className="w-5 h-5"/>} action={<button onClick={() => setIsAssignModalOpen(true)} className="p-2.5 rounded-xl hover:bg-white/5 text-indigo-400 transition-all group-hover:scale-110 shadow-sm border border-transparent hover:border-white/10"><EditIcon className="w-4 h-4" /></button>} />
                                        <InfoRow label="ACADEMIC YEAR" value="2025 - 2026 Season" icon={<CalendarIcon className="w-5 h-5"/>} />
                                        <div className="py-5 flex items-start gap-6 group relative">
                                            <div className="mt-1 p-2.5 rounded-xl bg-white/5 text-white/30 group-hover:text-indigo-400 transition-colors duration-300 ring-1 ring-inset ring-white/5"><UserIcon className="w-5 h-5"/></div>
                                            <div className="flex-grow min-w-0 pr-12"><p className="text-[10px] font-extrabold text-white/30 uppercase tracking-[0.25em] mb-1.5">ADVISORY FACULTY</p><p className="text-base font-serif font-medium truncate text-white/90">Verified Department Head</p></div>
                                        </div>
                                    </div>
                                    {!localStudent.assigned_class_id && (
                                        <div className={`mt-10 p-6 rounded-[2rem] flex flex-col sm:flex-row items-start gap-5 animate-in fade-in duration-700 relative z-10 border shadow-sm ${hasMappings ? 'bg-amber-500/5 border-amber-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                            {hasMappings ? (<AlertTriangleIcon className="w-8 h-8 text-amber-500 mt-0.5 shrink-0" />) : (<XCircleIcon className="w-8 h-8 text-red-500 mt-0.5 shrink-0" />)}
                                            <div className="flex-grow w-full">
                                                <p className={`text-base font-black ${hasMappings ? 'text-amber-400' : 'text-red-400'}`}>{hasMappings ? 'Institutional Placement Required' : 'Critical: Institutional Mapping Missing'}</p>
                                                <p className="text-xs text-white/50 mt-1 leading-relaxed">{hasMappings ? "Institutional structure is ready for Grade " + localStudent.grade + ". Assign a section now to activate student attendance and examinations." : "Warning: No academic units (Classes/Sections) exist for Grade " + localStudent.grade + ". Assignment is currently blocked by system configuration."}</p>
                                                {hasMappings ? (<button className="mt-4 w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20" onClick={() => setIsAssignModalOpen(true)}><SparklesIcon className="w-3.5 h-3.5"/> Assign Section Now</button>) : (<button className="mt-4 w-full sm:w-auto px-6 py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20" onClick={() => alert("Forwarding request to System Administrator for Academic Provisioning...")}><SettingsIcon className="w-3 h-3"/> Complete Academic Structure Setup</button>)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-[#13151b] border border-white/10 rounded-3xl md:rounded-[3rem] p-6 md:p-10 shadow-lg ring-1 ring-black/20">
                                    <h3 className="text-xs font-black uppercase text-white/40 tracking-[0.3em] mb-10 flex items-center gap-3"><UserIcon className="w-5 h-5 text-indigo-500" /> Core Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <CoreInfoCard label="OFFICIAL EMAIL" value={localStudent.email} icon={<MailIcon className="w-4 h-4"/>} />
                                        <CoreInfoCard label="PRIMARY PHONE" value={localStudent.phone} icon={<PhoneIcon className="w-4 h-4"/>} />
                                        <CoreInfoCard label="GENDER" value={localStudent.gender || 'Not Curated'} icon={<UserIcon className="w-4 h-4"/>} />
                                        <CoreInfoCard label="DATE OF BIRTH" value={localStudent.date_of_birth ? new Date(localStudent.date_of_birth).toLocaleDateString(undefined, {dateStyle: 'medium'}) : '---'} icon={<CalendarIcon className="w-4 h-4"/>} />
                                    </div>
                                </div>
                            </div>
                            <div className="xl:col-span-5 flex flex-col items-center order-1 xl:order-2 mb-8 xl:mb-0">
                                <div className="xl:sticky xl:top-10 w-full max-w-[340px]">
                                     <DigitalIdCard student={localStudent} />
                                     <p className="text-[9px] font-black text-white/10 uppercase text-center mt-8 tracking-[0.4em]">Institutional Prototype v5.1</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'parents':
                return (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 h-full flex flex-col">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4"><h3 className="text-xs font-black uppercase text-white/40 tracking-[0.3em] flex items-center gap-3"><UsersIcon className="w-5 h-5 text-indigo-500" /> Authorized Guardians</h3><button onClick={handleSync} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-2 hover:bg-white/5 px-4 py-2 rounded-xl transition-all border border-transparent hover:border-white/10 group"><RefreshIcon className={`w-4 h-4 ${successMessage ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'}`}/> Sync Contact Info</button></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                            <GuardianCard title="Primary Guardian" data={guardians?.primary} isPrimary />
                            <GuardianCard title="Secondary Guardian" data={guardians?.secondary} />
                        </div>
                         <div className="bg-[#13151b] border border-white/10 rounded-[2.5rem] p-8 shadow-lg mt-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700"><LocationIcon className="w-32 h-32 text-white" /></div>
                             <div className="p-4 bg-white/5 rounded-2xl border border-white/5 shadow-inner shrink-0"><LocationIcon className="w-8 h-8 text-indigo-400" /></div>
                             <div className="flex-grow text-center md:text-left z-10"><h4 className="text-[10px] font-black uppercase text-white/40 tracking-[0.25em] mb-2">Residential Address</h4><p className="text-lg md:text-2xl font-serif font-medium text-white/90 leading-relaxed">{localStudent.address || guardians?.primary?.address || 'Address not on file.'}</p></div>
                             <button className="p-3 hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/10 group/btn"><EditIcon className="w-5 h-5 text-white/30 group-hover/btn:text-white transition-colors" /></button>
                         </div>
                    </div>
                );
            case 'academic':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {academicLoading ? (<div className="h-[400px] flex flex-col items-center justify-center"><Spinner size="lg" className="text-white"/><p className="text-xs font-black uppercase tracking-widest text-white/30 mt-4 animate-pulse">Loading Academic Context...</p></div>) : (<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-3 bg-gradient-to-r from-[#18181b] to-[#13151b] border border-white/10 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
                                     <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><GraduationCapIcon className="w-40 h-40" /></div>
                                     <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
                                         <div>
                                             <div className="flex items-center gap-3 mb-2"><div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-500"><SparklesIcon className="w-5 h-5"/></div><h3 className="text-xs font-black uppercase text-emerald-500 tracking-widest">Current Status</h3></div>
                                             {localStudent.assigned_class_id ? (<h2 className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight leading-none">{localStudent.assigned_class_name} <span className="text-lg md:text-2xl text-white/40 font-sans font-medium">• 2025-2026</span></h2>) : (<h2 className="text-3xl md:text-4xl font-serif font-bold text-white/60 tracking-tight">Placement Pending</h2>)}
                                         </div>
                                         {localStudent.assigned_class_id && (<div className="text-right"><p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1">Class Teacher</p><div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">{academicData?.teacher?.display_name ? academicData.teacher.display_name.charAt(0) : '?'}</div><div className="text-left"><p className="text-sm font-bold text-white leading-none">{academicData?.teacher?.display_name || 'Unassigned'}</p><p className="text-[10px] text-white/50 leading-none mt-1">{academicData?.teacher?.email || 'No Contact'}</p></div></div></div>)}
                                     </div>
                                </div>
                                <div className="lg:col-span-2 bg-[#13151b] border border-white/10 rounded-[2.5rem] p-8 shadow-lg flex flex-col min-h-[400px]">
                                    <div className="flex justify-between items-center mb-6"><h3 className="text-sm font-black uppercase text-white/60 tracking-widest flex items-center gap-2"><BookIcon className="w-4 h-4"/> Enrolled Curriculum</h3><span className="text-[10px] font-bold bg-white/5 px-2 py-1 rounded text-white/40">{academicData?.subjects?.length || 0} Courses</span></div>
                                    {academicData?.subjects && academicData.subjects.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">{academicData.subjects.map((sub: any, idx: number) => (<div key={idx} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-colors group"><div className="flex justify-between items-start mb-2"><span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-white/5 text-white/40 border border-white/5 group-hover:border-white/10">{sub.code}</span>{sub.category && <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">{sub.category}</span>}</div><h4 className="font-bold text-white text-sm truncate">{sub.title}</h4><p className="text-[10px] text-white/30 mt-1 font-medium">{sub.credits || 3} Credits</p></div>))}</div>) : (<div className="flex-grow flex flex-col items-center justify-center text-center p-8 opacity-50"><BookIcon className="w-12 h-12 mb-3 text-white/20"/><p className="text-sm font-bold text-white/40">No subjects mapped yet.</p></div>)}
                                </div>
                                <div className="space-y-6">
                                     <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] p-6 shadow-sm relative overflow-hidden group"><div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><CheckCircleIcon className="w-16 h-16 text-emerald-500"/></div><p className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest mb-2">Attendance</p><p className="text-3xl font-black text-emerald-400">92%</p><p className="text-[10px] text-emerald-500/40 mt-1 font-bold">Current Term Average</p></div>
                                     <div className="bg-blue-500/5 border border-blue-500/10 rounded-[2rem] p-6 shadow-sm relative overflow-hidden group"><div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><ChartBarIcon className="w-16 h-16 text-blue-500"/></div><p className="text-[10px] font-black uppercase text-blue-500/60 tracking-widest mb-2">Performance</p><p className="text-3xl font-black text-blue-400">3.8 <span className="text-sm font-bold text-blue-500/50">GPA</span></p><p className="text-[10px] text-blue-500/40 mt-1 font-bold">Good Standing</p></div>
                                </div>
                            </div>)}
                    </div>
                );
            
            case 'documents':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 h-full flex flex-col">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <h3 className="text-xs font-black uppercase text-white/40 tracking-[0.3em] flex items-center gap-3">
                                    <ShieldCheckIcon className="w-5 h-5 text-indigo-500" /> Verification Vault
                                </h3>
                                <p className="text-white/30 text-xs mt-1 max-w-md leading-relaxed">Secure document storage for identity, academic records, and compliance.</p>
                            </div>
                            <div className="text-right">
                                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${docsLoading ? 'border-transparent text-white/20' : documents.every((d:any) => d.status === 'Verified') ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500' : 'border-amber-500/20 bg-amber-500/10 text-amber-500'}`}>
                                    {docsLoading ? 'Syncing...' : documents.every((d:any) => d.status === 'Verified') ? 'All Verified' : 'Action Required'}
                                </span>
                            </div>
                        </div>

                        <div className="flex-grow bg-[#13151b] border border-white/10 rounded-[2.5rem] p-8 shadow-inner overflow-hidden flex flex-col relative">
                            {docsLoading ? (
                                <div className="flex flex-col items-center justify-center h-full space-y-4">
                                    <Spinner size="lg" className="text-white"/>
                                    <p className="text-xs font-black uppercase tracking-widest text-white/20 animate-pulse">Decrypting Vault...</p>
                                </div>
                            ) : documents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-white/10">
                                        <LockIcon className="w-10 h-10 text-white" />
                                    </div>
                                    <h4 className="text-xl font-bold text-white">Vault Empty</h4>
                                    <p className="text-sm mt-2 max-w-xs">No documents have been requested or uploaded for this student yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-2">
                                    {documents.map((doc: any) => (
                                        <DocumentCard 
                                            key={doc.id} 
                                            doc={doc} 
                                            onVerify={handleVerifyDocument} 
                                            onReject={handleRejectDocument}
                                            onView={handleViewDocument}
                                        />
                                    ))}
                                </div>
                            )}
                            
                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                        </div>
                    </div>
                );

            case 'fees':
                const totalBilled = financeData?.invoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
                const totalPaid = financeData?.payments?.reduce((sum, pay) => sum + (pay.amount || 0), 0) || 0;
                const outstanding = totalBilled - totalPaid;

                const ledgerItems = [
                    ...(financeData?.invoices?.map(i => ({...i, type: 'invoice', date: i.due_date})) || []),
                    ...(financeData?.payments?.map(p => ({...p, type: 'payment', date: p.payment_date})) || [])
                ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 h-full flex flex-col">
                        {/* Header / Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-[#13151b] border border-white/10 rounded-[2rem] p-6 shadow-lg relative overflow-hidden group">
                                 <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform"><FileTextIcon className="w-24 h-24 text-white"/></div>
                                 <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] mb-2">Total Invoiced</p>
                                 <p className="text-3xl font-serif font-bold text-white">{formatCurrency(totalBilled)}</p>
                            </div>
                            <div className="bg-[#13151b] border border-white/10 rounded-[2rem] p-6 shadow-lg relative overflow-hidden group">
                                 <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform"><CheckCircleIcon className="w-24 h-24 text-emerald-500"/></div>
                                 <p className="text-[10px] font-black uppercase text-emerald-500/60 tracking-[0.2em] mb-2">Total Collected</p>
                                 <p className="text-3xl font-serif font-bold text-emerald-500">{formatCurrency(totalPaid)}</p>
                            </div>
                            <div className="bg-[#13151b] border border-white/10 rounded-[2rem] p-6 shadow-lg relative overflow-hidden group">
                                 <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform"><AlertTriangleIcon className="w-24 h-24 text-red-500"/></div>
                                 <p className="text-[10px] font-black uppercase text-red-500/60 tracking-[0.2em] mb-2">Outstanding</p>
                                 <p className="text-3xl font-serif font-bold text-red-500">{formatCurrency(outstanding)}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center">
                             <h3 className="text-xs font-black uppercase text-white/40 tracking-[0.3em] flex items-center gap-3">
                                <CreditCardIcon className="w-5 h-5 text-indigo-500" /> Transaction Ledger
                            </h3>
                            <button onClick={() => setIsPaymentModalOpen(true)} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2">
                                <PlusIcon className="w-4 h-4"/> Record Payment
                            </button>
                        </div>

                        {/* Ledger Table */}
                        <div className="flex-grow bg-[#13151b] border border-white/10 rounded-[2.5rem] p-0 shadow-inner overflow-hidden flex flex-col">
                            <div className="overflow-y-auto custom-scrollbar flex-grow p-6">
                                {financeLoading ? (
                                    <div className="flex justify-center py-20"><Spinner size="lg" className="text-white"/></div>
                                ) : ledgerItems.length === 0 ? (
                                    <div className="text-center py-20 text-white/30">No financial records found.</div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-[#13151b] z-10">
                                            <tr>
                                                <th className="pb-4 pl-4 text-[10px] font-black uppercase text-white/30 tracking-widest">Date</th>
                                                <th className="pb-4 text-[10px] font-black uppercase text-white/30 tracking-widest">Description</th>
                                                <th className="pb-4 text-center text-[10px] font-black uppercase text-white/30 tracking-widest">Type</th>
                                                <th className="pb-4 pr-4 text-right text-[10px] font-black uppercase text-white/30 tracking-widest">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {ledgerItems.map((item, idx) => (
                                                <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                                                    <td className="py-4 pl-4 text-xs font-mono text-white/60">{new Date(item.date).toLocaleDateString()}</td>
                                                    <td className="py-4">
                                                        <p className="text-sm font-bold text-white">{item.description || (item.type === 'payment' ? 'Payment Received' : 'Invoice')}</p>
                                                        <p className="text-[10px] text-white/30">{item.receipt_number || item.id}</p>
                                                    </td>
                                                    <td className="py-4 text-center">
                                                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${item.type === 'invoice' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                                            {item.type}
                                                        </span>
                                                    </td>
                                                    <td className={`py-4 pr-4 text-right font-mono font-bold text-sm ${item.type === 'payment' ? 'text-emerald-500' : 'text-white'}`}>
                                                        {item.type === 'payment' ? '+' : ''}{formatCurrency(item.amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="h-[600px] flex flex-col items-center justify-center text-white/20 space-y-8">
                        <div className="p-8 bg-white/5 rounded-full animate-pulse ring-8 ring-white/5">
                            <ChartBarIcon className="w-20 h-20" />
                        </div>
                        <p className="text-base font-black uppercase tracking-[0.5em]">Syncing Module Context...</p>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[100] p-0 sm:p-4 animate-in fade-in duration-300 font-serif" onClick={onClose}>
            <div className="bg-[#09090b] w-full h-full sm:h-[95vh] sm:max-w-7xl sm:rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] border-0 sm:border border-white/10 flex flex-col overflow-hidden relative ring-1 ring-white/5 transition-all duration-300" onClick={e => e.stopPropagation()}>
                
                {/* Global Toast Notification */}
                {successMessage && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-top-12 duration-700 w-full max-w-sm px-4">
                        <div className="bg-emerald-600 text-white px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-5 border border-white/20 ring-8 ring-emerald-500/10 backdrop-blur-md">
                            <div className="bg-white/20 p-2 rounded-full shadow-inner"><CheckCircleIcon className="w-6 h-6" /></div>
                            <span className="text-base font-black uppercase tracking-widest leading-none">{successMessage}</span>
                        </div>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row h-full relative">
                    
                    {/* --- MOBILE HEADER (Visible only on lg and below) --- */}
                    <div className="lg:hidden flex items-center justify-between p-6 border-b border-white/5 bg-[#0f1115]">
                        <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-lg">
                                <img 
                                    src={localStudent.profile_photo_url || `https://api.dicebear.com/8.x/initials/svg?seed=${localStudent.display_name}&backgroundColor=1e1b4b`} 
                                    className="w-full h-full rounded-[0.6rem] object-cover border border-[#09090b]"
                                    alt=""
                                />
                            </div>
                            <span className="font-bold text-white truncate max-w-[150px]">{localStudent.display_name}</span>
                        </div>
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-lg bg-white/5 text-white/60">
                            <MenuIcon className="w-6 h-6"/>
                        </button>
                    </div>

                    {/* --- SIDEBAR DRAWER (Responsive) --- */}
                    <div className={`
                        absolute inset-0 z-50 lg:static lg:w-[320px] lg:border-r lg:border-white/5 lg:bg-[#0f1115] lg:flex lg:flex-col lg:p-12 lg:flex-shrink-0
                        transition-transform duration-300 ease-in-out bg-[#0f1115] p-8 flex flex-col
                        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    `}>
                         {/* Close Button for Mobile Drawer */}
                         <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden absolute top-6 right-6 p-2 rounded-full bg-white/5 text-white/50">
                             <XIcon className="w-6 h-6"/>
                         </button>

                        <div className="mb-12 flex flex-col items-center mt-10 lg:mt-0">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-[2.8rem] bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 mb-8 shadow-[0_0_40px_rgba(99,102,241,0.3)] transform transition-transform group-hover:rotate-3 duration-700">
                                    <img 
                                        src={localStudent.profile_photo_url || `https://api.dicebear.com/8.x/initials/svg?seed=${localStudent.display_name}&backgroundColor=1e1b4b`} 
                                        className="w-full h-full rounded-[2.5rem] object-cover border-4 border-[#09090b]"
                                        alt=""
                                    />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-[#09090b] p-2 rounded-2xl shadow-xl border border-white/10">
                                    <ShieldCheckIcon className="w-6 h-6 text-indigo-400"/>
                                </div>
                            </div>
                            <h2 className="text-2xl font-black text-white text-center truncate w-full tracking-tight uppercase font-serif">{localStudent.display_name}</h2>
                            
                            {/* System Generated ID Display & Generator */}
                            <div className="mt-4 flex flex-col items-center">
                                {localStudent.student_id_number && localStudent.student_id_number !== 'PENDING' ? (
                                    <div className="bg-[#1a1d23] px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2 shadow-inner">
                                        <KeyIcon className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className="text-xs font-mono font-bold text-white tracking-widest">{localStudent.student_id_number}</span>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={generateStudentId}
                                        disabled={generatingId}
                                        className="text-[10px] font-black bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 uppercase tracking-wider"
                                    >
                                        {generatingId ? <Spinner size="sm" className="text-white"/> : <><SparklesIcon className="w-3 h-3"/> Generate ID</>}
                                    </button>
                                )}
                                <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mt-2">Institutional ID</span>
                            </div>
                        </div>

                        <nav className="flex-grow space-y-2.5">
                            {[
                                { id: 'overview', label: 'Dashboard Overview', icon: <ChartBarIcon className="w-5 h-5"/> },
                                { id: 'parents', label: 'Guardian Network', icon: <UsersIcon className="w-5 h-5"/> },
                                { id: 'academic', label: 'Academic Profile', icon: <GraduationCapIcon className="w-5 h-5"/> },
                                { id: 'documents', label: 'Verification Vault', icon: <FileTextIcon className="w-5 h-5"/> },
                                { id: 'fees', label: 'Financial Ledger', icon: <CreditCardIcon className="w-5 h-5"/> },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }}
                                    className={`w-full flex items-center gap-4 px-7 py-4.5 rounded-[1.5rem] text-[11px] font-black transition-all group ${
                                        activeTab === item.id 
                                        ? 'bg-[#1a1d23] text-indigo-400 shadow-2xl border border-white/5 ring-1 ring-black/20 transform translate-x-3' 
                                        : 'text-white/40 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <span className={`${activeTab === item.id ? 'text-indigo-400' : 'text-white/20 group-hover:text-indigo-300'} transition-colors`}>{item.icon}</span>
                                    <span className="uppercase tracking-[0.15em]">{item.label}</span>
                                    {activeTab === item.id && <ChevronRightIcon className="ml-auto w-4 h-4 opacity-40"/>}
                                </button>
                            ))}
                        </nav>

                        <div className="mt-auto pt-10 border-t border-white/5">
                             <button onClick={onClose} className="w-full py-5 rounded-[1.8rem] bg-white/5 text-white/50 hover:bg-white/10 hover:text-white font-black text-[11px] uppercase tracking-[0.3em] transition-all hover:shadow-xl active:scale-[0.98] border border-transparent hover:border-white/10">Exit Portal</button>
                        </div>
                    </div>

                    {/* Viewport Header and Main Workspace */}
                    <div className="flex-grow flex flex-col h-full bg-[#09090b] overflow-hidden relative">
                         {/* Background Ambient Glow */}
                         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none -mr-20 -mt-20"></div>
                         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none -ml-20 -mb-20"></div>

                        <header className="hidden lg:flex h-24 border-b border-white/5 items-center justify-between px-16 bg-[#09090b]/80 backdrop-blur-xl z-20 relative">
                            <div className="flex items-center gap-4">
                                <h1 className="text-4xl font-black text-white uppercase tracking-tight flex items-center gap-6 font-serif">
                                    {activeTab === 'overview' ? 'OVERVIEW' : activeTab === 'parents' ? 'PARENTS' : activeTab === 'documents' ? 'DOCUMENTS' : activeTab === 'fees' ? 'LEDGER' : activeTab.toUpperCase()} 
                                    <span className="text-white/5 font-thin">|</span> 
                                    <span className="text-indigo-400/70">{localStudent.display_name}</span>
                                </h1>
                            </div>
                            <div className="flex items-center gap-5">
                                <button className="p-3.5 rounded-2xl bg-white/5 text-white/40 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all shadow-sm ring-1 ring-inset ring-white/5"><BookIcon className="w-5 h-5"/></button>
                                <button className="p-3.5 rounded-2xl bg-white/5 text-white/40 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all shadow-sm ring-1 ring-inset ring-white/5"><EditIcon className="w-4 h-4"/></button>
                            </div>
                        </header>

                        <div className="flex-grow overflow-y-auto p-4 md:p-8 lg:p-16 custom-scrollbar relative z-10">
                            <div className="max-w-6xl mx-auto h-full">
                                {renderTabContent()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Managed Sub-Modals */}
            {isAssignModalOpen && (
                <AssignClassModal 
                    student={localStudent}
                    onClose={() => setIsAssignModalOpen(false)}
                    onSuccess={handleAssignSuccess}
                />
            )}
            
            {/* Guardian Edit Modal */}
            {isGuardianModalOpen && (
                <GuardianEditModal 
                    type={editingGuardianType}
                    initialData={editingGuardianType === 'primary' ? guardians?.primary : guardians?.secondary}
                    parentId={guardians?.primary?.id}
                    onClose={() => setIsGuardianModalOpen(false)}
                    onSave={() => { setIsGuardianModalOpen(false); handleSync(); }}
                />
            )}
            
            {/* Payment Modal */}
            {isPaymentModalOpen && (
                <RecordPaymentModal 
                    studentId={localStudent.id}
                    studentName={localStudent.display_name}
                    onClose={() => setIsPaymentModalOpen(false)}
                    onSuccess={() => {
                        setIsPaymentModalOpen(false);
                        handleSync(); // trigger refresh of data
                        if (activeTab === 'fees') fetchFinanceData();
                    }}
                />
            )}
        </div>
    );
};

export default StudentProfileModal;