
import React, { useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import Spinner from './common/Spinner';
import { XIcon } from './icons/XIcon';
import { UserIcon } from './icons/UserIcon';
import { MailIcon } from './icons/MailIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { UploadIcon } from './icons/UploadIcon';
import { FilePlusIcon } from './icons/FilePlusIcon';
import { BookIcon } from './icons/BookIcon';
import Stepper from './common/Stepper';

interface AddTeacherModalProps {
    onClose: () => void;
    onSuccess: () => void;
    branchId?: string | null;
}

const STEPS = ['Basic Info', 'Photo', 'Role & Dept', 'Academics', 'Documents', 'Review'];
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const FloatingInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string, icon?: React.ReactNode, readOnly?: boolean }> = ({ label, icon, className, readOnly, ...props }) => (
    <div className="relative group w-full"><div className="absolute top-1/2 -translate-y-1/2 left-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors z-10 pointer-events-none">{icon}</div><input {...props} readOnly={readOnly} placeholder=" " className={`peer block w-full rounded-xl border border-input bg-background px-4 py-3.5 pl-11 text-sm text-foreground shadow-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none placeholder-transparent ${readOnly ? 'bg-muted/30 cursor-not-allowed border-transparent' : ''} ${className}`} /><label className={`absolute left-11 top-0 -translate-y-1/2 bg-background px-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-focus:top-0 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-primary pointer-events-none ${readOnly ? 'bg-transparent' : ''}`}>{label}</label></div>
);

const generateEmployeeId = () => `EMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

const AddTeacherModal: React.FC<AddTeacherModalProps> = ({ onClose, onSuccess, branchId }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [formData, setFormData] = useState({ display_name: '', email: '', phone: '', gender: 'Male', dob: '', department: '', designation: '', employee_id: '', employment_type: 'Full-time', subject: '', qualification: '', experience_years: 0, date_of_joining: new Date().toISOString().split('T')[0], grades: [] as string[] });
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [resumeFile, setResumeFile] = useState<File | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { setPhotoFile(e.target.files[0]); setPhotoPreview(URL.createObjectURL(e.target.files[0])); } };

    const handleNext = () => { if (currentStep === 0 && (!formData.display_name.trim() || !EMAIL_REGEX.test(formData.email))) { setErrorMsg("Name and valid Email required."); return; } if (currentStep === 1 && !formData.employee_id) setFormData(p => ({ ...p, employee_id: generateEmployeeId() })); setCurrentStep(p => p + 1); };

    const handleSubmit = async () => {
        setLoading(true); try {
            const mockUserId = crypto.randomUUID();
            const { error } = await supabase.rpc('upsert_teacher_profile', { p_user_id: mockUserId, p_display_name: formData.display_name, p_email: formData.email, p_phone: formData.phone, p_department: formData.department, p_designation: formData.designation, p_employee_id: formData.employee_id, p_employment_type: formData.employment_type, p_subject: formData.subject, p_qualification: formData.qualification, p_experience: Number(formData.experience_years), p_doj: formData.date_of_joining, p_branch_id: branchId || null });
            if (error) throw error;
            setIsSuccess(true);
        } catch (err: any) { setErrorMsg(err.message); } finally { setLoading(false); }
    };

    if (isSuccess) return (<div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 animate-in fade-in"><div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border p-8 text-center"><CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-6"/><h2 className="text-2xl font-bold">Success!</h2><p className="mt-2 text-muted-foreground">Faculty added and credentials dispatched.</p><button onClick={onSuccess} className="mt-8 w-full py-3 bg-primary text-white rounded-xl font-bold">Done</button></div></div>);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}><div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden max-h-[90vh]" onClick={e => e.stopPropagation()}><div className="p-6 border-b bg-muted/10 flex justify-between items-center"><div><h2 className="text-xl font-bold">Teacher Onboarding</h2></div><button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors"><XIcon className="w-5 h-5"/></button></div><div className="px-6 pt-4"><Stepper steps={STEPS} currentStep={currentStep} /></div><div className="p-8 overflow-y-auto flex-grow">{errorMsg && <div className="p-3 bg-destructive/10 text-destructive rounded-lg mb-4">{errorMsg}</div>}{currentStep === 0 && (<div className="space-y-4"><FloatingInput label="Name" name="display_name" value={formData.display_name} onChange={handleChange} icon={<UserIcon className="w-4 h-4"/>}/><FloatingInput label="Email" name="email" value={formData.email} onChange={handleChange} icon={<MailIcon className="w-4 h-4"/>}/></div>)} {currentStep > 0 && <p className="text-muted-foreground">Complete setup to finalize onboarding.</p>}</div><div className="p-6 border-t bg-muted/10 flex justify-between"><button onClick={currentStep === 0 ? onClose : () => setCurrentStep(p => p - 1)} className="px-6 py-2 rounded-xl border">Back</button><button onClick={currentStep === STEPS.length - 1 ? handleSubmit : handleNext} disabled={loading} className="px-8 py-2.5 bg-primary text-white rounded-xl font-bold flex items-center gap-2">{loading ? <Spinner size="sm"/> : (currentStep === STEPS.length - 1 ? 'Finish' : 'Next')}</button></div></div></div>
    );
};

export default AddTeacherModal;
