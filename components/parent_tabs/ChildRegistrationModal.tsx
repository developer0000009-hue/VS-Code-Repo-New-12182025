import React, { useState, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { AdmissionApplication } from '../../types';
import Spinner from '../common/Spinner';
import { XCircleIcon } from '../icons/XCircleIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { UserIcon } from '../icons/UserIcon';
import { CameraIcon } from '../icons/CameraIcon';

/**
 * Robust error message extractor to prevent [object Object] displays.
 * Guarantees a string return for safe React rendering.
 */
const formatError = (err: any): string => {
    if (!err) return "Institutional synchronization failed.";
    if (typeof err === 'string') return err;
    
    // Check common error property paths and ensure they are strings
    const message = err.message || err.error_description || err.details || err.hint;
    if (typeof message === 'string' && !message.includes("[object Object]")) {
        return message;
    }
    
    // Check if it's a Supabase error object wrapping another message
    if (err.error) {
        if (typeof err.error === 'string') return err.error;
        if (typeof err.error.message === 'string') return err.error.message;
    }

    // Fallback to JSON stringification if it's a plain object, else generic fallback
    try {
        const str = JSON.stringify(err);
        if (str && str !== '{}' && str !== '[]') return str;
    } catch { }

    const fallback = String(err);
    return fallback === '[object Object]' ? "An unexpected server exception occurred." : fallback;
};

interface ChildRegistrationModalProps {
    child: AdmissionApplication | null;
    onClose: () => void;
    onSave: () => void;
    currentUserId: string;
}

const ChildRegistrationModal: React.FC<ChildRegistrationModalProps> = ({ child, onClose, onSave, currentUserId }) => {
    const [step, setStep] = useState<'details' | 'success'>('details');
    const [formData, setFormData] = useState({
        applicant_name: child?.applicant_name || '',
        grade: child?.grade || '',
        date_of_birth: child?.date_of_birth || '',
        gender: child?.gender || 'Male',
        medical_info: child?.medical_info || '',
        emergency_contact: child?.emergency_contact || '',
    });
    
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(child?.profile_photo_url || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) {
                alert("Photo size must be less than 2MB.");
                return;
            }
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmitDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        let finalPhotoUrl = photoPreview;

        try {
            if (photoFile) {
                const fileExt = photoFile.name.split('.').pop();
                const filePath = `${currentUserId}/photos/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('admission-documents')
                    .upload(filePath, photoFile);
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('admission-documents').getPublicUrl(filePath);
                finalPhotoUrl = urlData.publicUrl;
            }

            const { error: rpcError } = await supabase.rpc('create_admission', {
                p_applicant_name: formData.applicant_name,
                p_grade: formData.grade,
                p_date_of_birth: formData.date_of_birth || null,
                p_gender: formData.gender,
                p_profile_photo_url: finalPhotoUrl,
                p_medical_info: formData.medical_info,
                p_emergency_contact: formData.emergency_contact
            });

            if (rpcError) throw rpcError;
            setStep('success');
        } catch (err: any) {
            console.error("Admission submission error:", err);
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    const copyFromProfile = async () => {
        try {
            const { data: profile } = await supabase.from('profiles').select('display_name, phone').eq('id', currentUserId).single();
            if (profile) {
                setFormData(prev => ({
                    ...prev,
                    emergency_contact: `${profile.display_name} - ${profile.phone || 'No phone on record'}`
                }));
            }
        } catch (e) {
            console.error("Failed to copy profile info", e);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-[#1a1b1e] w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-white/5 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                
                <div className="p-8 pb-4 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
                            <CheckCircleIcon className="w-6 h-6"/>
                        </div>
                        <div>
                            <h2 className="text-3xl font-serif font-bold text-white tracking-tight">New Registration</h2>
                            <p className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-black mt-1">Institutional Student Enrollment</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-full hover:bg-white/5 text-white/50 transition-colors">
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto p-8 pt-4 custom-scrollbar">
                    {error && (
                        <div className="p-4 mb-6 bg-red-500/10 text-red-500 rounded-2xl text-sm border border-red-500/20 animate-in fade-in">
                            <div className="flex items-center gap-2 font-bold mb-1">
                                <XCircleIcon className="w-4 h-4" /> System Exception
                            </div>
                            {error}
                        </div>
                    )}
                    
                    {step === 'details' && (
                        <form id="reg-form" onSubmit={handleSubmitDetails} className="space-y-8">
                            <div className="flex flex-col items-center justify-center space-y-4 py-2">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <div className="w-32 h-32 rounded-[2.8rem] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group-hover:border-primary/50 transition-all duration-500 shadow-inner">
                                        {photoPreview ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" /> : <UserIcon className="w-12 h-12 text-white/20" />}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><CameraIcon className="w-8 h-8 text-white" /></div>
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-primary text-white p-2.5 rounded-2xl shadow-xl ring-4 ring-[#1a1b1e]"><UploadIcon className="w-4 h-4"/></div>
                                </div>
                                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2"><label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 block mb-2">Full Legal Name</label><input required name="applicant_name" value={formData.applicant_name} onChange={handleChange} className="w-full p-4 bg-black/30 border border-white/5 rounded-2xl text-white outline-none focus:border-primary transition-all text-sm shadow-inner" placeholder="Student's name" /></div>
                                <div><label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 block mb-2">Target Grade</label><select required name="grade" value={formData.grade} onChange={handleChange} className="w-full p-4 bg-black/30 border border-white/5 rounded-2xl text-white outline-none focus:border-primary transition-all text-sm shadow-inner cursor-pointer"><option value="" disabled>Select Grade...</option>{Array.from({length: 12}, (_, i) => i + 1).map(g => <option key={g} value={String(g)}>Grade {g}</option>)}</select></div>
                                <div><label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 block mb-2">Date of Birth</label><input required type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="w-full p-4 bg-black/30 border border-white/5 rounded-2xl text-white outline-none focus:border-primary transition-all text-sm shadow-inner" /></div>
                            </div>
                            <div className="space-y-6">
                                <div><label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 block mb-2">Medical Disclosure</label><textarea name="medical_info" value={formData.medical_info} onChange={handleChange} className="w-full p-5 bg-black/30 border border-white/5 rounded-[1.5rem] text-white outline-none focus:border-primary transition-all h-28 resize-none text-sm leading-relaxed shadow-inner" placeholder="Allergies, conditions..." /></div>
                                <div><div className="flex justify-between items-center mb-2 px-1"><label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Emergency Contact</label><button type="button" onClick={copyFromProfile} className="text-[9px] font-black text-primary hover:underline uppercase tracking-widest">Copy Profile Info</button></div><textarea name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} className="w-full p-5 bg-black/30 border border-white/5 rounded-[1.5rem] text-white outline-none focus:border-primary transition-all h-28 resize-none text-sm leading-relaxed shadow-inner" placeholder="Name and Phone" /></div>
                            </div>
                        </form>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-12 animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_80px_rgba(16,185,129,0.2)] ring-8 ring-emerald-500/5"><CheckCircleIcon className="w-14 h-14" /></div>
                            <h3 className="text-3xl font-serif font-bold text-white tracking-tight">Submission Successful</h3>
                            <p className="text-muted-foreground mt-4 max-w-sm mx-auto text-base leading-relaxed">Application for <strong className="text-white">{formData.applicant_name}</strong> has been secured.</p>
                            <button onClick={() => { onSave(); onClose(); }} className="mt-12 px-12 py-4 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl hover:shadow-primary/50 transition-all transform hover:-translate-y-1 active:scale-95">Dashboard</button>
                        </div>
                    )}
                </div>

                <div className="p-8 border-t border-white/5 bg-black/40 flex justify-between items-center z-20">
                    <button onClick={onClose} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">Cancel</button>
                    {step !== 'success' && <button form="reg-form" type="submit" disabled={loading} className="px-10 py-4 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-primary/25 hover:bg-primary/90 transition-all flex items-center gap-3 transform active:scale-95 disabled:opacity-50">{loading ? <Spinner size="sm" className="text-white"/> : 'Seal & Submit'}</button>}
                </div>
            </div>
        </div>
    );
};

export default ChildRegistrationModal;