
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
import { XCircleIcon } from './icons/XCircleIcon';

interface AddTeacherModalProps {
    onClose: () => void;
    onSuccess: () => void;
    branchId?: number | null;
}

const STEPS = ['Basic Info', 'Photo', 'Role & Dept', 'Academics', 'Documents', 'Review'];

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const FloatingInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string, icon?: React.ReactNode, readOnly?: boolean }> = ({ label, icon, className, readOnly, ...props }) => (
    <div className="relative group w-full">
        <div className="absolute top-1/2 -translate-y-1/2 left-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors z-10 pointer-events-none">{icon}</div>
        <input {...props} readOnly={readOnly} placeholder=" " className={`peer block w-full rounded-xl border border-input bg-background px-4 py-3.5 pl-11 text-sm text-foreground shadow-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none placeholder-transparent ${readOnly ? 'bg-muted/30 cursor-not-allowed border-transparent' : ''} ${className}`} />
        <label className={`absolute left-11 top-0 -translate-y-1/2 bg-background px-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:top-0 peer-focus:text-[10px] peer-focus:font-bold peer-focus:uppercase peer-focus:text-primary pointer-events-none ${readOnly ? 'bg-transparent' : ''}`}>{label}</label>
    </div>
);

const generateEmployeeId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `EMP-${year}-${random}`;
};

const AddTeacherModal: React.FC<AddTeacherModalProps> = ({ onClose, onSuccess, branchId }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    // Form Data
    const [formData, setFormData] = useState({
        // Step 0: Basic
        display_name: '', email: '', phone: '', gender: 'Male', dob: '',
        // Step 2: Role
        department: '', designation: '', employee_id: '', employment_type: 'Full-time',
        // Step 3: Academics
        subject: '', qualification: '', experience_years: 0, date_of_joining: new Date().toISOString().split('T')[0], grades: [] as string[],
    });

    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    
    // Documents
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [idProofFile, setIdProofFile] = useState<File | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPhotoFile(e.target.files[0]);
            setPhotoPreview(URL.createObjectURL(e.target.files[0]));
        }
    };

    const toggleGrade = (grade: string) => {
        setFormData(prev => {
            const grades = prev.grades.includes(grade) 
                ? prev.grades.filter(g => g !== grade)
                : [...prev.grades, grade];
            return { ...prev, grades };
        });
    };

    const handleSubmit = async () => {
        setLoading(true);
        setErrorMsg(null);

        if (!EMAIL_REGEX.test(formData.email)) {
            setErrorMsg("Please enter a valid email address.");
            setLoading(false);
            return;
        }

        try {
            // Generate a UUID for the new teacher (simulating auth.uid)
            const mockUserId = crypto.randomUUID(); 
            
            const { error } = await supabase.rpc('upsert_teacher_profile', {
                p_user_id: mockUserId,
                p_display_name: formData.display_name,
                p_email: formData.email,
                p_phone: formData.phone,
                p_department: formData.department,
                p_designation: formData.designation,
                p_employee_id: formData.employee_id,
                p_employment_type: formData.employment_type,
                p_subject: formData.subject,
                p_qualification: formData.qualification,
                p_experience: Number(formData.experience_years),
                p_doj: formData.date_of_joining,
                p_branch_id: branchId || null
            });

            if (error) throw error;

            // Handle Document Uploads
            if (resumeFile) {
                const filePath = `${mockUserId}/${Date.now()}_resume.pdf`;
                await supabase.storage.from('teacher-documents').upload(filePath, resumeFile);
                await supabase.from('teacher_documents').insert({
                    teacher_id: mockUserId,
                    document_name: 'Resume',
                    document_type: 'Resume',
                    file_path: filePath,
                    status: 'Pending'
                });
            }

            // Simulate sending credentials email
            await new Promise(resolve => setTimeout(resolve, 800));

            setIsSuccess(true);
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "Failed to onboard teacher.");
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        const nextStep = currentStep + 1;
        
        // Basic Step Validation
        if (currentStep === 0) {
            if (!formData.display_name.trim()) {
                setErrorMsg("Full Name is required.");
                return;
            }
            if (!formData.email.trim() || !EMAIL_REGEX.test(formData.email)) {
                setErrorMsg("A valid email address is required.");
                return;
            }
            setErrorMsg(null);
        }

        // Auto-generate ID if entering Step 2 (Role & Dept) and ID is missing
        if (nextStep === 2 && !formData.employee_id) {
            setFormData(prev => ({ ...prev, employee_id: generateEmployeeId() }));
        }
        setCurrentStep(nextStep);
    };
    
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    // Render Steps
    // Fix: Rename renderStep to renderStepContent to match usage on line 392
    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Basic Info
                return (
                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg font-bold text-foreground">Basic Information</h3>
                        <FloatingInput label="Full Name" name="display_name" value={formData.display_name} onChange={handleChange} required icon={<UserIcon className="w-4 h-4"/>} autoFocus />
                        <FloatingInput label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} icon={<MailIcon className="w-4 h-4"/>} />
                        <div className="grid grid-cols-2 gap-4">
                            <FloatingInput label="Phone Number" type="tel" name="phone" value={formData.phone} onChange={handleChange} icon={<PhoneIcon className="w-4 h-4"/>} />
                            <div className="relative group">
                                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full h-[50px] rounded-xl border border-input bg-background px-4 text-sm shadow-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer">
                                    <option>Male</option><option>Female</option><option>Other</option>
                                </select>
                                <label className="absolute left-4 top-0 -translate-y-1/2 bg-background px-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 pointer-events-none">Gender</label>
                            </div>
                        </div>
                        <FloatingInput label="Date of Birth" type="date" name="dob" value={formData.dob} onChange={handleChange} icon={<div className="w-4"/>} />
                    </div>
                );
            case 1: // Photo
                return (
                    <div className="flex flex-col items-center justify-center space-y-6 animate-in slide-in-from-right-4 duration-300 py-4">
                        <h3 className="text-lg font-bold text-foreground">Upload Profile Photo</h3>
                        <div className="relative group cursor-pointer w-40 h-40">
                            <div className="w-40 h-40 rounded-full border-4 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors">
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-16 h-16 text-muted-foreground/40" />
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <UploadIcon className="w-8 h-8 text-white" />
                            </div>
                            <input type="file" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                        </div>
                        <p className="text-sm text-muted-foreground text-center max-w-xs">
                            Upload a clear face photo. This will be used for the teacher's ID card and portal profile.
                        </p>
                    </div>
                );
            case 2: // Role & Dept
                return (
                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg font-bold text-foreground">Role & Department</h3>
                        <div className="grid grid-cols-2 gap-5">
                            <FloatingInput label="Employee ID" name="employee_id" value={formData.employee_id} readOnly={true} icon={<div className="w-4 h-4 font-bold text-[10px] flex items-center justify-center border border-current rounded">ID</div>} />
                            <FloatingInput label="Department" name="department" value={formData.department} onChange={handleChange} icon={<BriefcaseIcon className="w-4 h-4"/>} />
                        </div>
                        <FloatingInput label="Designation" name="designation" value={formData.designation} onChange={handleChange} icon={<UserIcon className="w-4 h-4"/>} />
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Employment Type</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Full-time', 'Part-time', 'Contract'].map(type => (
                                    <button
                                        type="button"
                                        key={type}
                                        onClick={() => setFormData({...formData, employment_type: type})}
                                        className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${formData.employment_type === type ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-input hover:bg-muted'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 3: // Academics
                return (
                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg font-bold text-foreground">Academic Assignments</h3>
                        <FloatingInput label="Primary Subject" name="subject" value={formData.subject} onChange={handleChange} icon={<BookIcon className="w-4 h-4"/>} />
                        
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Assign Grades</label>
                            <div className="flex flex-wrap gap-2">
                                {Array.from({length: 12}, (_, i) => i + 1).map(g => (
                                    <button
                                        type="button"
                                        key={g}
                                        onClick={() => toggleGrade(String(g))}
                                        className={`w-10 h-10 rounded-lg text-sm font-bold border transition-all ${formData.grades.includes(String(g)) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted border-input'}`}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <FloatingInput label="Qualification" name="qualification" value={formData.qualification} onChange={handleChange} icon={<BookIcon className="w-4 h-4"/>} />
                            <FloatingInput label="Experience (Yrs)" type="number" name="experience_years" value={formData.experience_years} onChange={handleChange} icon={<BriefcaseIcon className="w-4 h-4"/>} />
                        </div>
                    </div>
                );
            case 4: // Documents
                return (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg font-bold text-foreground">Upload Documents</h3>
                        
                        <div className="border-2 border-dashed border-border rounded-xl p-6 hover:bg-muted/30 transition-colors relative group bg-muted/5">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${resumeFile ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}>
                                    {resumeFile ? <CheckCircleIcon className="w-6 h-6"/> : <FilePlusIcon className="w-6 h-6"/>}
                                </div>
                                <div>
                                    <p className="font-bold text-foreground">Resume / CV</p>
                                    <p className="text-xs text-muted-foreground">{resumeFile ? resumeFile.name : 'PDF or DOCX (Max 5MB)'}</p>
                                </div>
                            </div>
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && setResumeFile(e.target.files[0])} />
                        </div>

                        <div className="border-2 border-dashed border-border rounded-xl p-6 hover:bg-muted/30 transition-colors relative group bg-muted/5">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${idProofFile ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}>
                                    {idProofFile ? <CheckCircleIcon className="w-6 h-6"/> : <FilePlusIcon className="w-6 h-6"/>}
                                </div>
                                <div>
                                    <p className="font-bold text-foreground">ID Proof</p>
                                    <p className="text-xs text-muted-foreground">{idProofFile ? idProofFile.name : 'Passport, Driving License, etc.'}</p>
                                </div>
                            </div>
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && setIdProofFile(e.target.files[0])} />
                        </div>
                    </div>
                );
            case 5: // Review
                return (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        {errorMsg && <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{errorMsg}</div>}
                        <div className="text-center">
                            {photoPreview ? (
                                <img src={photoPreview} alt="Profile" className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-card shadow-lg" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-4xl font-bold border-4 border-card shadow-lg">
                                    {formData.display_name.charAt(0)}
                                </div>
                            )}
                            <h3 className="text-2xl font-bold text-foreground mt-4">{formData.display_name}</h3>
                            <p className="text-base font-medium text-primary">{formData.designation || 'Teacher'} • {formData.department || 'General'}</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pb-2 border-b border-border mb-4">Contact & Personal</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                    <div><p className="text-muted-foreground">Email Address</p><p className="font-semibold text-foreground">{formData.email}</p></div>
                                    <div><p className="text-muted-foreground">Phone</p><p className="font-semibold text-foreground">{formData.phone || 'Not Provided'}</p></div>
                                    <div><p className="text-muted-foreground">Gender</p><p className="font-semibold text-foreground">{formData.gender}</p></div>
                                    <div><p className="text-muted-foreground">Date of Birth</p><p className="font-semibold text-foreground">{formData.dob || 'Not Provided'}</p></div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pb-2 border-b border-border mb-4">Professional Role</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                    <div><p className="text-muted-foreground">Employee ID</p><p className="font-mono font-bold text-primary">{formData.employee_id}</p></div>
                                    <div><p className="text-muted-foreground">Primary Subject</p><p className="font-semibold text-foreground">{formData.subject}</p></div>
                                    <div><p className="text-muted-foreground">Qualification</p><p className="font-semibold text-foreground">{formData.qualification}</p></div>
                                    <div><p className="text-muted-foreground">Experience</p><p className="font-semibold text-foreground">{formData.experience_years} years</p></div>
                                    <div><p className="text-muted-foreground">Date of Joining</p><p className="font-semibold text-foreground">{formData.date_of_joining}</p></div>
                                    <div className="md:col-span-2">
                                        <p className="text-muted-foreground mb-1">Assigned Grades</p>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.grades.length > 0 ? formData.grades.map(g => (
                                                <span key={g} className="px-2.5 py-1 text-xs font-bold bg-muted text-foreground rounded-full border border-border">{g}</span>
                                            )) : <span className="text-xs italic text-muted-foreground">None Assigned</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm flex items-start gap-3 border border-amber-200 mt-6 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">
                            <CheckCircleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <span>On submission, login credentials will be generated and emailed to the teacher. Their account status will be set to <strong>Pending Verification</strong>.</span>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in">
                <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-8 text-center animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <CheckCircleIcon animate className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Teacher Onboarded!</h2>
                    <p className="text-muted-foreground mt-2 mb-6">
                        <strong>{formData.display_name}</strong> has been added successfully. An email with login credentials has been sent.
                    </p>
                    <div className="bg-muted p-4 rounded-xl mb-6">
                        <p className="text-xs font-bold text-muted-foreground uppercase">Current Status</p>
                        <p className="text-lg font-bold text-amber-600">Pending Verification</p>
                        <p className="text-[10px] font-mono text-muted-foreground/60 mt-1">ID: {formData.employee_id}</p>
                    </div>
                    <button onClick={onSuccess} className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all">
                        Done
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[150] p-4" onClick={onClose}>
            <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in zoom-in-95 max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border bg-muted/10 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">New Teacher Onboarding</h2>
                        <p className="text-xs text-muted-foreground mt-1">Step {currentStep + 1}: {STEPS[currentStep]}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><XIcon className="w-5 h-5"/></button>
                </div>
                <div className="px-6 pt-4">
                    <Stepper steps={STEPS} currentStep={currentStep} />
                </div>
                <div className="p-8 overflow-y-auto flex-grow bg-background">
                    {renderStepContent()}
                </div>
                <div className="p-6 border-t border-border bg-muted/10 flex justify-between items-center">
                    <button 
                        onClick={currentStep === 0 ? onClose : handleBack} 
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-background hover:text-foreground transition-colors border border-transparent hover:border-border text-sm"
                        disabled={loading}
                    >
                        {currentStep === 0 ? 'Cancel' : <><ChevronLeftIcon className="w-4 h-4"/> Back</>}
                    </button>
                    
                    <button 
                        onClick={currentStep === STEPS.length - 1 ? handleSubmit : handleNext} 
                        disabled={loading || (currentStep === 0 && (!formData.display_name || !formData.email))}
                        className="flex items-center gap-2 px-8 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg hover:shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    >
                        {loading ? <Spinner size="sm" className="text-white"/> : (
                            currentStep === STEPS.length - 1 ? 'Create Account' : <>Next <ChevronRightIcon className="w-4 h-4"/></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddTeacherModal;
