
import React from 'react';
import { StudentProfileData, UserProfile } from '../../types';
import { UserIcon } from '../icons/UserIcon';
import { UsersIcon } from '../icons/UsersIcon'; // For relationship/parent
import { CalendarIcon } from '../icons/CalendarIcon'; // For DOB
import { LockIcon } from '../icons/LockIcon'; // For read-only

interface FormProps {
    formData: Partial<StudentProfileData & { applicant_name: string, date_of_birth: string, gender: string }>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    profile: UserProfile; // Parent's profile
}

// Reusing the premium FloatingLabelInput pattern for consistency
const FloatingInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string, icon?: React.ReactNode, readOnly?: boolean }> = ({ label, icon, readOnly, className, ...props }) => (
    <div className="relative group w-full">
        <div className={`absolute top-1/2 -translate-y-1/2 left-4 transition-colors duration-200 z-10 pointer-events-none ${readOnly ? 'text-muted-foreground/40' : 'text-muted-foreground/60 group-focus-within:text-primary'}`}>
            {icon}
        </div>
        <input
            {...props}
            readOnly={readOnly}
            placeholder=" "
            className={`peer block w-full rounded-xl border px-4 py-3.5 pl-11 text-sm shadow-sm transition-all duration-200 outline-none placeholder-transparent ${
                readOnly 
                ? 'bg-muted/30 border-transparent text-muted-foreground cursor-not-allowed' 
                : 'bg-background border-input text-foreground hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10'
            } ${className}`}
        />
        <label className={`absolute left-11 top-0 -translate-y-1/2 px-1.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 pointer-events-none ${
            readOnly 
            ? 'text-muted-foreground/60 bg-transparent' 
            : 'bg-background text-muted-foreground/80 peer-focus:text-primary'
        } peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-focus:top-0 peer-focus:text-[10px] peer-focus:uppercase peer-focus:font-bold`}>
            {label}
        </label>
        {readOnly && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none">
                <LockIcon className="w-4 h-4" />
            </div>
        )}
    </div>
);

const FloatingSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, icon?: React.ReactNode }> = ({ label, icon, children, className, ...props }) => (
    <div className="relative group w-full">
        <div className="absolute top-1/2 -translate-y-1/2 left-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-200 z-10 pointer-events-none">
            {icon}
        </div>
        <select
            {...props}
            className={`peer block w-full appearance-none rounded-xl border border-input bg-background px-4 py-3.5 pl-11 text-sm text-foreground shadow-sm transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none cursor-pointer ${className}`}
        >
            {children}
        </select>
        <label className="absolute left-11 top-0 -translate-y-1/2 bg-background px-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 transition-all duration-200 peer-focus:text-primary pointer-events-none">
            {label}
        </label>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
    </div>
);

const StudentForm: React.FC<FormProps> = ({ formData, handleChange, profile }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FloatingInput 
                    label="Full Name" 
                    name="applicant_name" 
                    value={formData.applicant_name || ''} 
                    readOnly 
                    icon={<UserIcon className="w-5 h-5"/>} 
                />
                
                <FloatingInput 
                    label="Grade / Class" 
                    name="grade" 
                    value={formData.grade || ''} 
                    readOnly 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14v7"/></svg>} 
                />

                <FloatingInput 
                    label="Date of Birth" 
                    name="date_of_birth" 
                    type="date" 
                    value={formData.date_of_birth || ''} 
                    onChange={handleChange} 
                    required 
                    icon={<CalendarIcon className="w-5 h-5"/>} 
                />
                
                <FloatingSelect 
                    label="Gender" 
                    name="gender" 
                    value={formData.gender || ''} 
                    onChange={handleChange} 
                    required
                    icon={<UserIcon className="w-5 h-5"/>}
                >
                    <option value="" disabled>Select Gender...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </FloatingSelect>
            </div>

            <div className="bg-muted/30 p-4 rounded-xl border border-border flex items-center gap-4">
                <div className="p-3 bg-background rounded-full border border-border text-muted-foreground">
                    <UsersIcon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-0.5">Linked Guardian</p>
                    <p className="font-semibold text-foreground">{profile.display_name}</p>
                    <p className="text-xs text-muted-foreground">{profile.email}</p>
                </div>
            </div>
        </div>
    );
};

export default StudentForm;
