import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { StudentDashboardData, DocumentRequirement } from '../../types';
import Spinner from '../common/Spinner';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { UserIcon } from '../icons/UserIcon';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { PhoneIcon } from '../icons/PhoneIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { ClockIcon } from '../icons/ClockIcon';

// --- Step Components ---

const Steps = ['Profile', 'Guardian', 'Documents', 'Verification', 'Review'];

const ShieldCheckIcon = ({className}:{className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);

interface WizardProps {
    data: StudentDashboardData;
    onComplete: () => void;
}

const StudentOnboardingWizard: React.FC<WizardProps> = ({ data, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Consolidated Form State
    const [formData, setFormData] = useState({
        // Student
        applicant_name: data.admission.applicant_name || '',
        date_of_birth: data.admission.date_of_birth || '',
        gender: data.admission.gender || '',
        phone: '', // Student's own phone if applicable, or leave blank
        medical_info: data.admission.medical_info || '',
        // Guardian
        parent_name: data.admission.parent_name || '',
        parent_email: data.admission.parent_email || '',
        parent_phone: data.admission.parent_phone || '',
        relationship: 'Parent',
        address: '',
        emergency_contact: data.admission.emergency_contact || '',
        // Meta
        profile_photo_url: data.admission.profile_photo_url || null,
    });
    
    const [otp, setOtp] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [docs, setDocs] = useState<DocumentRequirement[]>([]);
    
    // Fetch Docs on mount
    useEffect(() => {
        const fetchDocs = async () => {
            // Reuse the RPC that fetches requirements for the current user (who is the student/parent)
            // Since we are logged in as the student user (linked to admission), we need to query by admission ID
            if(data.admission.id) {
                 const { data: docData } = await supabase
                    .from('document_requirements')
                    .select('*, admission_documents(*)')
                    .eq('admission_id', data.admission.id);
                 if(docData) setDocs(docData);
            }
        };
        fetchDocs();
    }, [data.admission.id]);

    const handleNext = () => {
        if (currentStep < Steps.length - 1) setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- Logic: Verification ---
    const sendOtp = () => {
        setLoading(true);
        setTimeout(() => {
            setIsOtpSent(true);
            setLoading(false);
            alert(`OTP sent to ${formData.parent_phone || formData.parent_email} (Use 1234)`);
        }, 1500);
    };

    const verifyOtp = () => {
        if (otp === '1234') {
            handleNext();
        } else {
            alert('Invalid OTP');
        }
    };

    // --- Logic: Final Submit ---
    const handleFinalSubmit = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.rpc('complete_student_onboarding', {
                p_student_id: data.profile.id,
                p_data: formData
            });
            
            if (error) throw error;
            
            // Reload page or trigger parent callback to refresh dashboard
            onComplete();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };
    
    // --- Sub-Components for Steps ---
    
    const Step1Profile = () => (
        <div className="space-y-5 animate-in slide-in-from-right-8 duration-300">
             <div className="flex justify-center mb-6">
                 <div className="w-24 h-24 rounded-full bg-muted border-4 border-card shadow-lg flex items-center justify-center overflow-hidden relative group cursor-pointer">
                     {formData.profile_photo_url ? (
                         <img src={formData.profile_photo_url} className="w-full h-full object-cover" alt="Profile" />
                     ) : (
                         <UserIcon className="w-10 h-10 text-muted-foreground" />
                     )}
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-xs text-white font-bold">Upload</span>
                     </div>
                 </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                     <label className="text-xs font-bold uppercase text-muted-foreground">Full Name</label>
                     <input name="applicant_name" value={formData.applicant_name} onChange={handleChange} className="w-full p-3 bg-muted/30 rounded-xl border border-input mt-1 font-medium" />
                 </div>
                 <div>
                     <label className="text-xs font-bold uppercase text-muted-foreground">Date of Birth</label>
                     <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="w-full p-3 bg-muted/30 rounded-xl border border-input mt-1" />
                 </div>
                 <div>
                     <label className="text-xs font-bold uppercase text-muted-foreground">Gender</label>
                     <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-3 bg-muted/30 rounded-xl border border-input mt-1">
                         <option value="" disabled>Select Gender...</option>
                         <option>Male</option><option>Female</option><option>Other</option>
                     </select>
                 </div>
                 <div>
                     <label className="text-xs font-bold uppercase text-muted-foreground">Student Phone (Optional)</label>
                     <input name="phone" value={formData.phone} onChange={handleChange} placeholder="+1..." className="w-full p-3 bg-muted/30 rounded-xl border border-input mt-1" />
                 </div>
                 <div className="md:col-span-2">
                     <label className="text-xs font-bold uppercase text-muted-foreground">Medical Info</label>
                     <textarea name="medical_info" value={formData.medical_info} onChange={handleChange} className="w-full p-3 bg-muted/30 rounded-xl border border-input mt-1 h-24 resize-none" placeholder="Allergies, conditions..." />
                 </div>
             </div>
        </div>
    );

    const Step2Parent = () => (
        <div className="space-y-5 animate-in slide-in-from-right-8 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                     <label className="text-xs font-bold uppercase text-muted-foreground">Parent/Guardian Name</label>
                     <input name="parent_name" value={formData.parent_name} onChange={handleChange} className="w-full p-3 bg-muted/30 rounded-xl border border-input mt-1 font-medium" />
                 </div>
                 <div>
                     <label className="text-xs font-bold uppercase text-muted-foreground">Relationship</label>
                     <select name="relationship" value={formData.relationship} onChange={handleChange} className="w-full p-3 bg-muted/30 rounded-xl border border-input mt-1">
                         <option>Father</option><option>Mother</option><option>Guardian</option>
                     </select>
                 </div>
                 <div>
                     <label className="text-xs font-bold uppercase text-muted-foreground">Email</label>
                     <input name="parent_email" value={formData.parent_email} onChange={handleChange} className="w-full p-3 bg-muted/30 rounded-xl border border-input mt-1" />
                 </div>
                 <div>
                     <label className="text-xs font-bold uppercase text-muted-foreground">Phone</label>
                     <input name="parent_phone" value={formData.parent_phone} onChange={handleChange} className="w-full p-3 bg-muted/30 rounded-xl border border-input mt-1" />
                 </div>
                 <div className="md:col-span-2">
                     <label className="text-xs font-bold uppercase text-muted-foreground">Permanent Address</label>
                     <textarea name="address" value={formData.address} onChange={handleChange} className="w-full p-3 bg-muted/30 rounded-xl border border-input mt-1 h-24 resize-none" />
                 </div>
                 <div className="md:col-span-2">
                     <label className="text-xs font-bold uppercase text-muted-foreground">Emergency Contact (if different)</label>
                     <input name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} placeholder="Name & Phone" className="w-full p-3 bg-muted/30 rounded-xl border border-input mt-1" />
                 </div>
            </div>
        </div>
    );
    
    const Step3Documents = () => (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            <p className="text-sm text-muted-foreground">Please ensure all required documents are uploaded and verified. Rejected documents must be re-uploaded.</p>
            
            <div className="grid grid-cols-1 gap-4">
                {/* Standard required docs list if not present in DB */}
                {["Birth Certificate", "Address Proof", "Identity Proof (Guardian)", "Previous Year Marksheet"].map((docName, idx) => {
                    const existing = docs.find(d => d.document_name === docName);
                    // Standardize check for Verified status (using master enum standard)
                    const status = existing?.status || 'Pending';
                    const isVerified = status === 'Verified';
                    
                    return (
                        <div key={docName} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isVerified ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                                    <DocumentTextIcon className="w-5 h-5"/>
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-foreground">{docName}</p>
                                    <p className="text-xs text-muted-foreground">{status}</p>
                                </div>
                            </div>
                            <button className="px-4 py-2 text-xs font-bold bg-primary/10 text-primary rounded-lg hover:bg-primary/20">
                                {isVerified ? 'View' : 'Upload'}
                            </button>
                        </div>
                    )
                })}
            </div>
            
            <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-yellow-800 text-xs">
                <ClockIcon className="w-4 h-4"/> Documents will be verified by admin after submission.
            </div>
        </div>
    );
    
    const Step4Verification = () => (
        <div className="flex flex-col items-center justify-center py-8 animate-in slide-in-from-right-8 duration-300">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <ShieldCheckIcon className="w-8 h-8"/>
            </div>
            <h3 className="text-xl font-bold text-foreground">Verify Contact Info</h3>
            <p className="text-muted-foreground text-center max-w-xs mt-2 mb-8">We will send a One-Time Password (OTP) to <strong>{formData.parent_phone}</strong>.</p>
            
            {!isOtpSent ? (
                 <button onClick={sendOtp} disabled={loading} className="w-full max-w-xs py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg">
                     {loading ? <Spinner size="sm" className="text-white"/> : 'Send OTP'}
                 </button>
            ) : (
                <div className="w-full max-w-xs space-y-4">
                    <input 
                        value={otp}
                        onChange={e => setOtp(e.target.value)}
                        placeholder="Enter 4-digit OTP"
                        className="w-full text-center text-2xl font-mono tracking-widest p-4 rounded-xl border-2 border-primary/30 focus:border-primary focus:outline-none bg-background"
                        maxLength={4}
                    />
                    <button onClick={verifyOtp} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700">
                        Verify & Continue
                    </button>
                    <button onClick={sendOtp} className="w-full py-2 text-sm text-muted-foreground hover:text-foreground">Resend OTP</button>
                </div>
            )}
        </div>
    );
    
    const Step5Review = () => (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-border">
                     <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
                         {formData.applicant_name.charAt(0)}
                     </div>
                     <div>
                         <h3 className="font-bold text-lg">{formData.applicant_name}</h3>
                         <p className="text-sm text-muted-foreground">Grade {data.admission.grade}</p>
                     </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-muted-foreground text-xs uppercase">DOB</p><p className="font-medium">{formData.date_of_birth}</p></div>
                    <div><p className="text-muted-foreground text-xs uppercase">Gender</p><p className="font-medium">{formData.gender}</p></div>
                    <div><p className="text-muted-foreground text-xs uppercase">Parent</p><p className="font-medium">{formData.parent_name}</p></div>
                    <div><p className="text-muted-foreground text-xs uppercase">Contact</p><p className="font-medium">{formData.parent_phone}</p></div>
                </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800">
                <CheckCircleIcon className="w-5 h-5"/>
                <span className="text-sm font-bold">Contact Verified</span>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800">
                <CheckCircleIcon className="w-5 h-5"/>
                <span className="text-sm font-bold">Documents Uploaded</span>
            </div>
        </div>
    );

    // --- Main Render ---

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-4xl rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col h-[85vh]">
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-border bg-muted/10">
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Student Account Setup</h1>
                    <p className="text-muted-foreground mt-2">Complete these steps to activate your student portal.</p>
                    
                    {/* Progress Steps */}
                    <div className="flex items-center justify-between mt-8 px-2 relative">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10"></div>
                        {Steps.map((label, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-2 bg-card px-2 z-10">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${idx <= currentStep ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border text-muted-foreground'}`}>
                                    {idx < currentStep ? <CheckCircleIcon className="w-5 h-5"/> : idx + 1}
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${idx <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-grow overflow-y-auto p-6 md:p-10 bg-background">
                    {currentStep === 0 && <Step1Profile />}
                    {currentStep === 1 && <Step2Parent />}
                    {currentStep === 2 && <Step3Documents />}
                    {currentStep === 3 && <Step4Verification />}
                    {currentStep === 4 && <Step5Review />}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-border bg-muted/10 flex justify-between items-center">
                    <button 
                        onClick={handleBack} 
                        disabled={currentStep === 0 || loading}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-muted-foreground hover:bg-background hover:text-foreground transition-colors disabled:opacity-0"
                    >
                        <ChevronLeftIcon className="w-4 h-4"/> Back
                    </button>

                    {currentStep < Steps.length - 1 ? (
                        <button 
                            onClick={handleNext}
                            disabled={currentStep === 3 && !isOtpSent /* Logic block for OTP step */} 
                            className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg hover:bg-primary/90 transition-transform active:scale-95"
                        >
                            Next <ChevronRightIcon className="w-4 h-4"/>
                        </button>
                    ) : (
                        <button 
                            onClick={handleFinalSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-10 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 transition-transform active:scale-95"
                        >
                            {loading ? <Spinner size="sm" className="text-white"/> : 'Finish Setup & Enter Portal'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentOnboardingWizard;