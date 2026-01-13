
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { AdmissionApplication } from '../../types';
import { StorageService, BUCKETS } from '../../services/storage';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { UserIcon } from '../icons/UserIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { SchoolIcon } from '../icons/SchoolIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { InfoIcon } from '../icons/InfoIcon';
import { PhoneIcon } from '../icons/PhoneIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import CustomSelect from '../common/CustomSelect';
import PremiumAvatar from '../common/PremiumAvatar';

const resolveSyncError = (err: any): string => {
    if (!err) return "Identity synchronization protocol failed.";
    
    let message = '';
    if (typeof err === 'string') {
        message = err;
    } else {
        message = err.message || err.error_description || err.details || err.hint || err.error || '';
    }

    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('bucket not found')) {
        return "Critical Configuration Mismatch: The institutional cloud bucket 'profile-images' has not been initialized. Please contact the system architect to run the infrastructure sync script.";
    }

    if (lowerMessage.includes('invalid input syntax for type bigint') && /[\da-f]{8}-[\da-f]{4}/.test(lowerMessage)) {
        return "Identity Type Mismatch: The admissions registry uses an outdated numeric ID. Please apply the latest `schema.txt` update via the Supabase SQL Editor to resolve this protocol exception.";
    }
    
    return typeof message === 'string' ? message : "Institutional node exception.";
};

const PremiumFloatingInput: React.FC<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> & { label: string; icon?: React.ReactNode; isTextArea?: boolean; isSynced?: boolean }> = ({ label, icon, isTextArea, isSynced, className, ...props }) => (
    <div className="relative group w-full">
        {label && (
            <label className={`absolute left-10 top-0 -translate-y-1/2 bg-[#0a0a0c] px-2 text-[9px] font-black uppercase text-white/30 tracking-[0.3em] z-20 transition-all duration-300 group-focus-within:text-primary ${isSynced ? 'text-primary' : ''}`}>
                {label}
            </label>
        )}
        <div className={`absolute ${isTextArea ? 'top-6' : 'top-1/2 -translate-y-1/2'} left-5 text-white/10 group-focus-within:text-primary transition-all duration-500 z-10 pointer-events-none ${isSynced ? 'text-primary/60' : ''}`}>
            {icon}
        </div>
        {isTextArea ? (
            <textarea
                {...(props as any)}
                placeholder=" "
                className={`peer block w-full h-32 rounded-[1.8rem] border transition-all duration-500 px-6 pl-14 pt-6 pb-2 text-sm text-white font-medium bg-white/[0.01] outline-none placeholder-transparent border-white/5 hover:border-white/10 focus:border-primary/50 focus:ring-8 focus:ring-primary/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] focus:bg-white/[0.03] ${className}`}
            />
        ) : (
            <input
                {...props}
                placeholder=" "
                className={`peer block w-full h-[64px] rounded-[1.5rem] border transition-all duration-500 px-6 pl-14 pt-4 pb-1 text-sm text-white font-medium bg-white/[0.01] outline-none placeholder-transparent border-white/5 hover:border-white/10 focus:border-primary/50 focus:ring-8 focus:ring-primary/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] focus:bg-white/[0.03] ${isSynced ? 'border-primary/40 bg-primary/5' : ''} ${className}`}
            />
        )}
    </div>
);

interface ChildRegistrationModalProps {
    child: AdmissionApplication | null;
    onClose: () => void;
    onSave: () => Promise<void> | void;
    currentUserId: string;
}

const ChildRegistrationModal: React.FC<ChildRegistrationModalProps> = ({ child, onClose, onSave, currentUserId }) => {
    const isEdit = !!child;
    const [step, setStep] = useState<'details' | 'success'>('details');
    const [formData, setFormData] = useState({
        applicant_name: child?.applicant_name || '',
        grade: child?.grade || '',
        date_of_birth: child?.date_of_birth || '',
        gender: child?.gender || 'Male',
        medical_info: child?.medical_info || '',
        emergency_contact: child?.emergency_contact || '',
    });
    
    // Position state for draggability
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const modalRef = useRef<HTMLDivElement>(null);

    const [parentProfile, setParentProfile] = useState<{ name: string; email: string; phone: string } | null>(null);
    const [isEmergencySynced, setIsEmergencySynced] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(child?.profile_photo_url || null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Prevent background scrolling when modal is active
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    useEffect(() => {
        const fetchParent = async () => {
            const { data } = await supabase.from('profiles').select('display_name, email, phone').eq('id', currentUserId).maybeSingle();
            if (data) {
                setParentProfile({ name: data.display_name || '', email: data.email, phone: data.phone || '' });
            }
        };
        fetchParent();
    }, [currentUserId]);

    // Draggable Logic
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('select')) return;
        
        setIsDragging(true);
        dragStartPos.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        
        const newX = e.clientX - dragStartPos.current.x;
        const newY = e.clientY - dragStartPos.current.y;
        
        const bounds = {
            x: window.innerWidth * 0.45,
            y: window.innerHeight * 0.45
        };

        setPosition({ 
            x: Math.max(-bounds.x, Math.min(bounds.x, newX)), 
            y: Math.max(-bounds.y, Math.min(bounds.y, newY)) 
        });
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                alert("Magnitude exceeds limits. Max 5MB.");
                return;
            }
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSyncEmergency = async () => {
        if (isEmergencySynced) {
            setFormData(prev => ({ ...prev, emergency_contact: '' }));
            setIsEmergencySynced(false);
            return;
        }
        if (parentProfile) {
            setFormData(prev => ({ ...prev, emergency_contact: `${parentProfile.name} / ${parentProfile.phone || 'No Phone'}` }));
            setIsEmergencySynced(true);
        }
    };

    const handleSubmitDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.applicant_name || !currentUserId) return;
        setLoading(true);
        setError(null);
        try {
            let finalPhotoPath = child?.profile_photo_url || null;

            if (photoFile) {
                const storagePath = StorageService.getProfilePath('child', currentUserId);
                const { path } = await StorageService.upload(BUCKETS.PROFILES, storagePath, photoFile);
                finalPhotoPath = path;
            }

            const payload: any = {
                applicant_name: formData.applicant_name,
                grade: formData.grade,
                date_of_birth: formData.date_of_birth,
                gender: formData.gender,
                medical_info: formData.medical_info,
                emergency_contact: formData.emergency_contact,
                profile_photo_url: finalPhotoPath,
                parent_id: currentUserId,
                parent_name: parentProfile?.name || '',
                parent_email: parentProfile?.email || '',
                parent_phone: parentProfile?.phone || '',
                status: 'Pending Review' 
            };

            if (isEdit) {
                const { error } = await supabase.from('admissions').update(payload).eq('id', child.id);
                if (error) throw error;
            } else {
                // FIX: Explicitly generate a UUID on the client side.
                // This hardens the application against database misconfigurations where the 'id' column
                // might be missing its default value generator, thus resolving the "violates not-null constraint" error.
                payload.id = crypto.randomUUID();
                const { error } = await supabase.from('admissions').insert(payload);
                if (error) throw error;
            }
            setStep('success');
        } catch (err: any) {
            setError(resolveSyncError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleFinalizeHandshake = async () => {
        setLoading(true);
        try {
            await onSave();
            onClose();
        } catch (err: any) {
            setError(resolveSyncError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[150] flex items-center justify-center p-4 sm:p-6 overflow-hidden animate-in fade-in duration-500 select-none">
            <div 
                ref={modalRef}
                style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
                className={`bg-[#0a0a0c] w-full max-w-2xl h-full md:h-auto md:max-h-[92vh] rounded-[2rem] md:rounded-[3.5rem] shadow-[0_64px_128px_-24px_rgba(0,0,0,1)] border border-white/10 flex flex-col relative animate-in zoom-in-95 duration-500 ring-1 ring-white/5 overflow-hidden transition-shadow ${isDragging ? 'shadow-primary/20 scale-[1.01]' : ''}`} 
                onClick={e => e.stopPropagation()}
            >
                {step === 'details' ? (
                    <form onSubmit={handleSubmitDetails} className="flex flex-col h-full relative z-10 overflow-hidden select-text">
                        {/* Header - Drag Handle */}
                        <div 
                            onMouseDown={handleMouseDown}
                            className={`px-6 py-6 md:px-10 md:py-8 border-b border-white/5 bg-white/[0.02] backdrop-blur-2xl flex justify-between items-center shrink-0 cursor-grab active:cursor-grabbing transition-colors ${isDragging ? 'bg-primary/5' : ''}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner border border-primary/20">
                                    <PlusIcon className="w-6 h-6"/>
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-xl md:text-3xl font-serif font-black text-white tracking-tighter uppercase leading-none truncate">Register <span className="text-white/20 italic">Child.</span></h3>
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mt-1 whitespace-nowrap">Identity Enrollment Node</p>
                                </div>
                            </div>
                            <button type="button" onClick={onClose} className="p-2.5 rounded-full bg-white/5 text-white/20 hover:text-white hover:bg-white/10 transition-all"><XIcon className="w-5 h-5"/></button>
                        </div>

                        {/* Body - Scrollable */}
                        <div className="px-6 py-6 md:px-10 md:py-8 overflow-y-auto flex-grow space-y-10 custom-scrollbar">
                            {error && (
                                <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl text-xs border border-red-500/20 flex items-start gap-4 animate-in shake">
                                    <XCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-black uppercase tracking-[0.2em] text-[9px]">Sync Protocol Exception</p>
                                        <p className="font-medium leading-relaxed opacity-80">{error}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col items-center gap-4 group/avatar">
                                <div className="relative">
                                    <PremiumAvatar 
                                        src={photoPreview} 
                                        name={formData.applicant_name || 'C'} 
                                        size="md" 
                                        className="ring-[12px] ring-white/[0.02] border-4 border-[#0a0a0c] shadow-2xl transition-transform duration-500 group-hover/avatar:scale-105"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-2xl ring-4 ring-[#0a0a0c] hover:scale-110 active:scale-95 transition-all z-30"
                                    >
                                        <UploadIcon className="w-5 h-5"/>
                                    </button>
                                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                                </div>
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.6em] animate-pulse">Biometric Interface</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                                <PremiumFloatingInput label="Full Legal Name" name="applicant_name" value={formData.applicant_name} onChange={handleChange} required icon={<UserIcon className="w-4 h-4"/>} />
                                <CustomSelect 
                                    label="Academic Placement"
                                    value={formData.grade}
                                    onChange={(v) => setFormData(prev => ({ ...prev, grade: v }))}
                                    options={Array.from({length: 12}, (_, i) => ({ value: String(i + 1), label: `Grade ${i + 1}` }))}
                                    icon={<SchoolIcon className="w-4 h-4"/>}
                                    placeholder="Select Grade"
                                />
                                <PremiumFloatingInput label="Date of Birth" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} required icon={<CalendarIcon className="w-4 h-4"/>} />
                                <CustomSelect 
                                    label="Gender"
                                    value={formData.gender}
                                    onChange={(v) => setFormData(prev => ({ ...prev, gender: v }))}
                                    options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]}
                                    icon={<UserIcon className="w-4 h-4"/>}
                                />
                                <div className="md:col-span-2 space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em]">Safety Contact</label>
                                        <button type="button" onClick={handleSyncEmergency} className={`text-[9px] font-black uppercase tracking-widest transition-all ${isEmergencySynced ? 'text-primary' : 'text-white/20 hover:text-white'}`}>
                                            <SparklesIcon className="w-3 h-3 inline mr-1" /> {isEmergencySynced ? 'Synced' : 'Use My Data'}
                                        </button>
                                    </div>
                                    <PremiumFloatingInput label="" name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} isSynced={isEmergencySynced} icon={<PhoneIcon className="w-4 h-4"/>} placeholder="Guardian Name / Secure Line" />
                                </div>
                                <div className="md:col-span-2 pb-6">
                                    <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em] mb-4 block ml-1">Clinical Disclosures</label>
                                    <PremiumFloatingInput label="" name="medical_info" value={formData.medical_info} onChange={handleChange} isTextArea icon={<InfoIcon className="w-4 h-4"/>} placeholder="Define Allergies or Requirements..." />
                                </div>
                            </div>
                        </div>

                        {/* Footer - Fixed */}
                        <div className="px-6 py-6 md:px-10 md:py-8 border-t border-white/5 bg-white/[0.02] flex flex-col sm:flex-row justify-between items-center gap-6 shrink-0">
                            <button type="button" onClick={onClose} disabled={loading} className="text-[11px] font-black text-white/20 hover:text-white transition-all uppercase tracking-[0.5em] order-2 sm:order-1">Discard Protocol</button>
                            <button type="submit" disabled={loading || !formData.applicant_name} className="w-full sm:w-auto px-12 py-5 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-4 group transform active:scale-95 disabled:opacity-30 order-1 sm:order-2">
                                {loading ? <Spinner size="sm" className="text-white"/> : <><CheckCircleIcon className="w-5 h-5"/> Initialize Enrollment</>}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-10 md:p-20 text-center space-y-12 animate-in zoom-in-95 duration-1000 h-full flex flex-col items-center justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"></div>
                            <CheckCircleIcon animate className="w-24 h-24 md:w-32 md:h-32 text-emerald-500 relative z-10" />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-5xl font-serif font-black text-white tracking-tighter uppercase leading-none">Registry <span className="text-white/20 italic">Updated.</span></h2>
                            <p className="text-white/40 text-base md:text-lg leading-relaxed max-w-sm mx-auto font-serif italic">The enrollment protocol for {formData.applicant_name} has been successfully integrated into the institutional cluster.</p>
                        </div>
                        <button onClick={handleFinalizeHandshake} disabled={loading} className="w-full max-w-sm py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-[0.5em] rounded-[1.8rem] shadow-2xl transition-all active:scale-95">
                            Finalize Handshake
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChildRegistrationModal;
