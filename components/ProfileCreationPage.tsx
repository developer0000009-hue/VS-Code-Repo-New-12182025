import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Role, BuiltInRoles, UserProfile } from '../types';
import { supabase } from '../services/supabase';
import Spinner from './common/Spinner';
import SchoolAdminForm from './profile_forms/SchoolAdminForm';
import ParentForm from './profile_forms/ParentForm';
import StudentForm from './profile_forms/StudentForm';
import TeacherForm from './profile_forms/TeacherForm';
import { UserIcon } from './icons/UserIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XIcon } from './icons/XIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { motion, AnimatePresence } from 'framer-motion';

const formatError = (err: any): string => {
    if (!err) return "Synchronization failed.";
    if (typeof err === 'string') return err;
    return err.message || "Institutional system error.";
};

interface ProfileCreationPageProps {
    profile: UserProfile;
    role: Role;
    onComplete: () => void;
    onBack: () => void;
    showBackButton: boolean;
}

export const ProfileCreationPage: React.FC<ProfileCreationPageProps> = ({ profile, role, onComplete, onBack, showBackButton }) => {
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFetchingInitialData, setIsFetchingInitialData] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'contact'>('details');
    
    const isMounted = useRef(true);
    useEffect(() => { return () => { isMounted.current = false; }; }, []);

    const fetchExistingProfileData = useCallback(async () => {
        if (!isMounted.current) return;
        setIsFetchingInitialData(true);

        let tableName = '';
        switch (role) {
            case BuiltInRoles.SCHOOL_ADMINISTRATION: tableName = 'school_admin_profiles'; break;
            case BuiltInRoles.PARENT_GUARDIAN: tableName = 'parent_profiles'; break;
            case BuiltInRoles.TEACHER: tableName = 'teacher_profiles'; break;
            case BuiltInRoles.STUDENT: tableName = 'student_profiles'; break;
        }

        let fetchedData: any = {};
        if (tableName) {
            const { data } = await supabase.from(tableName).select('*').eq('user_id', profile.id).maybeSingle();
            if (data) fetchedData = data;
        }
        
        if (isMounted.current) {
            setFormData({ 
                ...fetchedData, 
                phone: profile.phone || '', 
                display_name: profile.display_name || '',
                email: profile.email || '',
                country: fetchedData.country || 'India'
            });
            setIsFetchingInitialData(false);
        }
    }, [role, profile.id, profile.display_name, profile.phone, profile.email]);

    useEffect(() => { fetchExistingProfileData(); }, [fetchExistingProfileData]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const isFormValid = useMemo(() => {
        if (!formData.display_name?.trim()) return false;
        if (role === BuiltInRoles.PARENT_GUARDIAN && !formData.relationship_to_student) return false;
        return true;
    }, [formData, role]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) {
            setError("Mandatory identity parameters are missing.");
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            if (role === BuiltInRoles.TEACHER) {
                const { error: tError } = await supabase.rpc('upsert_teacher_profile', {
                    p_user_id: profile.id,
                    p_display_name: formData.display_name,
                    p_email: profile.email,
                    p_phone: formData.phone,
                    p_department: formData.department,
                    p_designation: formData.designation,
                    p_subject: formData.subject,
                    p_qualification: formData.qualification,
                    p_experience: Number(formData.experience_years) || 0,
                    p_doj: formData.date_of_joining || new Date().toISOString().split('T')[0]
                });
                if (tError) throw tError;
            } else if (role === BuiltInRoles.PARENT_GUARDIAN) {
                const { error: pError } = await supabase.from('parent_profiles').upsert({
                    user_id: profile.id,
                    relationship_to_student: formData.relationship_to_student,
                    gender: formData.gender,
                    number_of_children: Number(formData.number_of_children) || 1,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    country: formData.country,
                    pin_code: formData.pin_code
                });
                if (pError) throw pError;
            } else if (role === BuiltInRoles.SCHOOL_ADMINISTRATION) {
                 const { error: sError } = await supabase.from('school_admin_profiles').upsert({
                     user_id: profile.id,
                     school_name: formData.school_name,
                     address: formData.address,
                     city: formData.city,
                     state: formData.state,
                     country: formData.country,
                     admin_contact_name: formData.admin_contact_name,
                     admin_contact_phone: formData.admin_contact_phone,
                     onboarding_step: 'completed'
                 });
                 if (sError) throw sError;
            }

            const { error: profileError } = await supabase.from('profiles').update({
                display_name: formData.display_name,
                phone: formData.phone,
                profile_completed: true,
                role: role
            }).eq('id', profile.id);
            
            if (profileError) throw profileError;

            if (isMounted.current) {
                setLoading(false);
                onComplete(); 
            }
        } catch (err: any) {
             if (isMounted.current) {
                 setError(formatError(err));
                 setLoading(false);
             }
        }
    };

    if (isFetchingInitialData) return <div className="flex justify-center p-20"><Spinner size="lg" /></div>;

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8 pb-32 font-sans">
            {/* Main Header Identity Card */}
            <div 
                className="relative bg-slate-900/60 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/5 shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-4"
            >
                <div className="p-8 md:p-10 flex flex-col items-center relative z-10">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-b from-white/10 to-transparent border border-white/10 flex items-center justify-center text-3xl font-semibold text-white shadow-xl mb-6 relative group overflow-hidden">
                        <span className="relative z-10">{(formData.display_name || 'U').charAt(0).toUpperCase()}</span>
                        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight text-center">
                        {formData.display_name || 'New Identity'}
                    </h2>
                    <p className="text-primary/70 text-[10px] font-bold uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                        <ShieldCheckIcon className="w-3 h-3" />
                        {role}
                    </p>
                </div>

                <div className="px-8 border-t border-white/5 flex justify-center gap-10 bg-black/20">
                    <button 
                        onClick={() => setActiveTab('details')} 
                        className={`py-4 text-[11px] font-bold uppercase tracking-widest relative transition-all duration-300 ${activeTab === 'details' ? 'text-primary' : 'text-white/30 hover:text-white/50'}`}
                    >
                        Core Registry {activeTab === 'details' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-[0_0_12px_rgba(var(--primary),0.6)]"></div>}
                    </button>
                    <button 
                        onClick={() => setActiveTab('contact')} 
                        className={`py-4 text-[11px] font-bold uppercase tracking-widest relative transition-all duration-300 ${activeTab === 'contact' ? 'text-primary' : 'text-white/30 hover:text-white/50'}`}
                    >
                        Contact & Node {activeTab === 'contact' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-[0_0_12px_rgba(var(--primary),0.6)]"></div>}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-5 rounded-2xl flex items-center gap-4 animate-in shake">
                    <XIcon className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-semibold uppercase tracking-wider">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10">
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-8 md:p-10 shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                    {role === BuiltInRoles.PARENT_GUARDIAN ? (
                        <ParentForm formData={formData} handleChange={handleFormChange} activeTab={activeTab} />
                    ) : role === BuiltInRoles.TEACHER ? (
                        <TeacherForm formData={formData} handleChange={handleFormChange} photoPreviewUrl={null} onPhotoChange={() => {}} currentUserId={profile.id} isRestrictedView={true} />
                    ) : role === BuiltInRoles.SCHOOL_ADMINISTRATION ? (
                        <SchoolAdminForm formData={formData} handleChange={handleFormChange} isInitialCreation={false} />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FloatingPremiumInput label="Full Legal Name" name="display_name" value={formData.display_name} onChange={handleFormChange} icon={<UserIcon className="w-4 h-4"/>} />
                            <FloatingPremiumInput label="Contact Number" name="phone" value={formData.phone} onChange={handleFormChange} icon={<PhoneIcon className="w-4 h-4"/>} />
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mt-12 px-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
                    {showBackButton ? (
                        <button type="button" onClick={onBack} className="group text-[11px] font-bold text-white/30 hover:text-white transition-all uppercase tracking-widest flex items-center gap-2.5">
                            <ChevronLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Return to Selection
                        </button>
                    ) : <div/>}
                    
                    <button 
                        type="submit" 
                        disabled={loading || !isFormValid} 
                        className={`h-[48px] px-10 rounded-xl font-bold text-[12px] uppercase tracking-[0.15em] transition-all flex items-center gap-3 group ${!isFormValid || loading ? 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5' : 'bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:scale-[1.02] hover:shadow-primary/40 active:scale-[0.98]'}`}
                    >
                        {loading ? <Spinner size="sm" className="text-white"/> : <><CheckCircleIcon className="w-4 h-4"/> Complete Setup</>}
                    </button>
                </div>
            </form>
            
            <div className="text-center py-4 opacity-40 animate-in fade-in duration-1000 delay-300">
                <p className="text-[11px] font-medium tracking-wide flex items-center justify-center gap-2 text-white/60">
                    <ShieldCheckIcon className="w-3.5 h-3.5" />
                    Your information is encrypted and used only for institutional verification.
                </p>
            </div>
        </div>
    );
};

const FloatingPremiumInput = ({ label, icon, ...props }: any) => (
    <div className="relative group w-full">
        <div className="absolute top-1/2 -translate-y-1/2 left-4 text-white/20 group-focus-within:text-primary transition-colors duration-300 z-10 pointer-events-none">{icon}</div>
        <input 
            {...props} 
            placeholder=" " 
            className="peer block w-full h-[48px] rounded-xl border border-white/10 bg-black/20 px-5 pl-12 text-[15px] text-white font-medium focus:ring-4 focus:ring-primary/5 focus:border-primary/40 transition-all outline-none" 
        />
        <label className="absolute left-12 top-0 -translate-y-1/2 bg-slate-900/90 px-1.5 text-[10px] font-bold uppercase text-white/30 tracking-[0.2em] peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-[14px] peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:top-0 peer-focus:text-[10px] peer-focus:font-bold peer-focus:uppercase peer-focus:text-primary transition-all duration-300 pointer-events-none">
            {label}
        </label>
    </div>
);
