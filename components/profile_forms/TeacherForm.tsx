
import React from 'react';
import { TeacherProfileData } from '../../types';

interface FormProps {
    formData: Partial<TeacherProfileData & { display_name: string }>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    photoPreviewUrl: string | null;
    onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    currentUserId: string; 
    isRestrictedView?: boolean; // New prop to disable fields for teachers editing themselves
}

const UserIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
);

const BaseInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input 
        {...props}
        className={`appearance-none block w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-primary sm:text-sm bg-background text-foreground ${props.readOnly ? 'opacity-60 cursor-not-allowed bg-muted' : ''}`} 
    />
);

const BaseTextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea 
        {...props}
        className={`appearance-none block w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-primary sm:text-sm bg-background text-foreground ${props.readOnly ? 'opacity-60 cursor-not-allowed bg-muted' : ''}`} 
    />
);

const BaseSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select
        {...props}
        className={`appearance-none block w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-primary sm:text-sm bg-background text-foreground ${props.disabled ? 'opacity-60 cursor-not-allowed bg-muted' : ''}`}
    >
        {props.children}
    </select>
);


const Label: React.FC<{htmlFor: string; children: React.ReactNode}> = ({htmlFor, children}) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-muted-foreground mb-1">{children}</label>
);

const TeacherForm: React.FC<FormProps> = ({ formData, handleChange, photoPreviewUrl, onPhotoChange, currentUserId, isRestrictedView }) => {
    return (
        <div className="space-y-4">
             <div>
                <Label htmlFor="photo">Profile Photo</Label>
                <div className="mt-1 flex items-center gap-4">
                    <span className="inline-block h-20 w-20 rounded-full overflow-hidden bg-muted border border-border">
                        {photoPreviewUrl ? 
                            <img src={photoPreviewUrl} alt="Profile Preview" className="h-full w-full object-cover" /> :
                            <div className="p-4"><UserIcon /></div>
                        }
                    </span>
                    <label htmlFor="photo-upload" className="cursor-pointer bg-card text-foreground border border-border px-3 py-2 rounded-md text-sm font-medium hover:bg-muted">
                        <span>Change</span>
                        <input id="photo-upload" name="photo" type="file" onChange={onPhotoChange} accept="image/*" className="sr-only"/>
                    </label>
                </div>
            </div>
            
            {/* Personal Info */}
            <div>
                <Label htmlFor="display_name">Full Name</Label>
                <BaseInput id="display_name" name="display_name" type="text" value={formData.display_name || ''} onChange={handleChange} required placeholder="e.g., Jane Doe"/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <BaseInput id="date_of_birth" name="date_of_birth" type="date" value={formData.date_of_birth || ''} onChange={handleChange} readOnly={isRestrictedView} />
                </div>
                <div>
                    <Label htmlFor="gender">Gender</Label>
                    <BaseSelect id="gender" name="gender" value={formData.gender || ''} onChange={handleChange} disabled={isRestrictedView}>
                        <option value="" disabled>Select Gender...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                    </BaseSelect>
                </div>
            </div>

            {/* Academic Info */}
            <div>
                <Label htmlFor="subject">Primary Subject</Label>
                <BaseInput id="subject" name="subject" type="text" value={formData.subject || ''} onChange={handleChange} required placeholder="e.g., Mathematics, Physics" readOnly={isRestrictedView}/>
            </div>
            <div>
                <Label htmlFor="qualification">Qualification</Label>
                <BaseInput id="qualification" name="qualification" type="text" value={formData.qualification || ''} onChange={handleChange} placeholder="e.g., M.Sc. in Physics"/>
            </div>
            
            {/* Employment Info - Mostly Restricted for Teachers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="date_of_joining">Date of Joining</Label>
                    <BaseInput id="date_of_joining" name="date_of_joining" type="date" value={formData.date_of_joining || ''} onChange={handleChange} readOnly={isRestrictedView} />
                </div>
                <div>
                    <Label htmlFor="experience_years">Years of Experience</Label>
                    <BaseInput id="experience_years" name="experience_years" type="number" value={formData.experience_years || ''} onChange={handleChange} placeholder="e.g., 5" readOnly={isRestrictedView} />
                </div>
            </div>
             
             {/* Only Show Employment Details if NOT Restricted View (Admin/HR Mode) */}
             {!isRestrictedView && (
                 <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="department">Department</Label>
                            <BaseInput id="department" name="department" type="text" value={formData.department || ''} onChange={handleChange} placeholder="e.g. Science" />
                        </div>
                        <div>
                            <Label htmlFor="designation">Designation</Label>
                            <BaseInput id="designation" name="designation" type="text" value={formData.designation || ''} onChange={handleChange} placeholder="e.g. Senior Teacher" />
                        </div>
                    </div>
                    
                    <div className="p-4 bg-muted/30 border border-border rounded-md space-y-4">
                        <h4 className="text-xs font-bold uppercase text-muted-foreground">HR & Finance (Admin Only)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Fix: salary mapping */}
                            <div>
                                <Label htmlFor="salary">Annual Salary</Label>
                                <BaseInput id="salary" name="salary" type="text" value={formData.salary || ''} onChange={handleChange} placeholder="e.g. 45000" />
                            </div>
                            {/* Fix: bank_details mapping */}
                            <div>
                                <Label htmlFor="bank_details">Bank Details</Label>
                                <BaseInput id="bank_details" name="bank_details" type="text" value={formData.bank_details || ''} onChange={handleChange} placeholder="IBAN / Account No." />
                            </div>
                        </div>
                    </div>
                 </>
             )}

             <div>
                <Label htmlFor="specializations">Specializations</Label>
                <BaseInput id="specializations" name="specializations" type="text" value={formData.specializations || ''} onChange={handleChange} placeholder="e.g., AP Physics, Robotics"/>
            </div>
            <div>
                <Label htmlFor="bio">Bio</Label>
                <BaseTextArea id="bio" name="bio" value={formData.bio || ''} onChange={handleChange} rows={3} placeholder="A brief introduction about your teaching philosophy..."/>
            </div>
        </div>
    );
};

export default TeacherForm;
