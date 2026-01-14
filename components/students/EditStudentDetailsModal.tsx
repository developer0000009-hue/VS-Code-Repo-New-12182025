
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { StudentForAdmin } from '../../types';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { UserIcon } from '../icons/UserIcon';
import { PhoneIcon } from '../icons/PhoneIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { LocationIcon } from '../icons/LocationIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { LockIcon } from '../icons/LockIcon';
import { RefreshIcon } from '../icons/RefreshIcon';

// Simple Switch Component
const Switch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
    <button 
        type="button"
        role="switch" 
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        className={`
            relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
    >
        <span className="sr-only">Use parent info</span>
        <span
            aria-hidden="true"
            className={`
                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                ${checked ? 'translate-x-5' : 'translate-x-0'}
            `}
        />
    </button>
);

interface EditStudentDetailsModalProps {
    student: StudentForAdmin;
    onClose: () => void;
    onSave: () => void;
}

const FloatingInput: React.FC<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> & { label: string, icon?: React.ReactNode, isSynced?: boolean, isTextArea?: boolean }> = ({ label, icon, isSynced, isTextArea, className, readOnly, ...props }) => {
    const inputClasses = `
        peer block w-full rounded-xl border bg-background px-4 py-3.5 pl-11 text-sm text-foreground shadow-sm 
        focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none placeholder-transparent transition-all
        ${readOnly ? 'bg-muted/40 text-muted-foreground border-transparent cursor-default' : 'border-input hover:border-primary/50'} 
        ${className}
    `;

    return (
        <div className="relative group w-full">
            <div className={`absolute ${isTextArea ? 'top-4' : 'top-1/2 -translate-y-1/2'} left-4 text-muted-foreground/60 ${!readOnly && 'group-focus-within:text-primary'} transition-colors z-10 pointer-events-none`}>
                {icon}
            </div>
            
            {isTextArea ? (
                <textarea 
                    {...(props as any)} 
                    readOnly={readOnly}
                    placeholder=" " 
                    className={`${inputClasses} resize-none h-24 pt-3.5`} 
                />
            ) : (
                <input 
                    {...(props as any)} 
                    readOnly={readOnly}
                    placeholder=" " 
                    className={inputClasses} 
                />
            )}

            <label className={`
                absolute left-11 ${isTextArea ? 'top-3.5' : 'top-0 -translate-y-1/2'} bg-background px-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 transition-all 
                peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case 
                peer-focus:top-0 peer-focus:text-[10px] peer-focus:font-bold peer-focus:uppercase peer-focus:text-primary pointer-events-none
                ${isTextArea ? 'peer-placeholder-shown:top-4' : ''}
            `}>
                {label}
            </label>

            {isSynced && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none animate-in fade-in zoom-in duration-300">
                    <span className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-sm">
                        <LockIcon className="w-3 h-3" /> Synced
                    </span>
                </div>
            )}
        </div>
    );
};

const EditStudentDetailsModal: React.FC<EditStudentDetailsModalProps> = ({ student, onClose, onSave }) => {
    // Form State
    const [formData, setFormData] = useState({
        display_name: student.display_name || '',
        student_id_number: student.student_id_number || '',
        grade: student.grade || '',
        date_of_birth: student.date_of_birth ? new Date(student.date_of_birth).toISOString().split('T')[0] : '',
        gender: student.gender || '',
        phone: student.phone || '',
        address: student.address || '',
        parent_guardian_details: student.parent_guardian_details || '',
    });
    
    // Sync Logic State
    const [syncWithParent, setSyncWithParent] = useState(true);
    const [parentData, setParentData] = useState<any>(null);
    const [isFetchingParent, setIsFetchingParent] = useState(false);

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    // Fetch Parent Data on Mount
    useEffect(() => {
        const fetchParent = async () => {
            setIsFetchingParent(true);
            try {
                const { data, error } = await supabase.rpc('get_linked_parent_for_student', { p_student_id: student.id });
                
                if (error) {
                    console.error("Error fetching parent:", error);
                } else if (data && data.found) {
                    setParentData(data);
                    // Default to sync if parent exists and data seems aligned, or if forced by previous state
                    if (isMounted.current) setSyncWithParent(true);
                } else {
                     if (isMounted.current) setSyncWithParent(false); // No parent found, disable sync
                }
            } catch (e) {
                console.error(e);
            } finally {
                if (isMounted.current) setIsFetchingParent(false);
            }
        };
        fetchParent();
    }, [student.id]);

    // Apply Sync Effect
    useEffect(() => {
        if (syncWithParent && parentData) {
            // Construct Address
            const addressParts = [
                parentData.address,
                parentData.city,
                parentData.state,
                parentData.country,
            ].filter(Boolean);
            const fullAddress = addressParts.join(', ');

            // Construct Guardian Details
            const guardianInfo = `${parentData.name} (${parentData.relationship || 'Guardian'})`;

            setFormData(prev => ({
                ...prev,
                phone: parentData.phone || '',
                address: fullAddress,
                parent_guardian_details: guardianInfo
            }));
        }
    }, [syncWithParent, parentData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: rpcError } = await supabase.rpc('update_student_details_admin', {
                p_student_id: student.id,
                p_display_name: formData.display_name,
                p_phone: formData.phone,
                p_dob: formData.date_of_birth || null,
                p_gender: formData.gender,
                p_address: formData.address,
                p_parent_details: formData.parent_guardian_details,
                p_student_id_number: formData.student_id_number,
                p_grade: formData.grade
            });

            if (rpcError) throw rpcError;

            onSave();
            onClose();
        } catch (err: any) {
            if (isMounted.current) setError(err.message || "Failed to update student details.");
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in zoom-in-95 ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg text-foreground">Edit Student Profile</h3>
                        <p className="text-sm text-muted-foreground">Update information & synchronize with parent data.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <XIcon className="w-5 h-5"/>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto max-h-[80vh] custom-scrollbar bg-background">
                    {error && (
                        <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-sm font-medium border border-destructive/20 flex items-center gap-2 animate-pulse">
                            <span className="text-lg">⚠️</span> {error}
                        </div>
                    )}
                    
                    {/* Identity Section */}
                    <section className="space-y-5">
                        <div className="flex items-center gap-3 border-b border-border pb-2">
                            <div className="p-1.5 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                                <UserIcon className="w-4 h-4" />
                            </div>
                            <h4 className="text-xs font-extrabold uppercase text-muted-foreground tracking-widest">Identity & Academic</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FloatingInput label="Full Name" name="display_name" value={formData.display_name} onChange={handleChange} required icon={<UserIcon className="w-4 h-4"/>} />
                            <FloatingInput label="Student ID" name="student_id_number" value={formData.student_id_number} onChange={handleChange} icon={<div className="w-4 h-4 font-bold text-[10px] flex items-center justify-center border border-current rounded">ID</div>} />
                            <FloatingInput label="Grade / Class" name="grade" value={formData.grade} onChange={handleChange} required icon={<div className="w-4 h-4 font-bold text-[10px] flex items-center justify-center">Gr</div>} />
                            
                            <div className="relative group">
                                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full h-[52px] rounded-xl border border-input bg-background px-4 pl-11 text-sm shadow-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer">
                                    <option value="">Select Gender...</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                                <div className="absolute top-1/2 -translate-y-1/2 left-4 text-muted-foreground/60 pointer-events-none"><UserIcon className="w-4 h-4"/></div>
                                <label className="absolute left-11 top-0 -translate-y-1/2 bg-background px-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Gender</label>
                            </div>

                            <FloatingInput label="Date of Birth" type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} icon={<CalendarIcon className="w-4 h-4"/>} />
                        </div>
                    </section>

                    {/* Contact & Guardian Section */}
                    <section className="space-y-5">
                        <div className="flex items-center justify-between border-b border-border pb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg">
                                    <UsersIcon className="w-4 h-4" />
                                </div>
                                <h4 className="text-xs font-extrabold uppercase text-muted-foreground tracking-widest">Contact & Guardian</h4>
                            </div>
                            
                            {/* Sync Toggle */}
                            <div className="flex items-center gap-3 bg-muted/30 p-1.5 rounded-lg border border-border/50">
                                {isFetchingParent && <Spinner size="sm" className="text-primary" />}
                                <label className={`text-xs font-bold uppercase tracking-wider transition-colors ${syncWithParent ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {syncWithParent ? 'Auto-Sync Active' : 'Manual Entry'}
                                </label>
                                <Switch 
                                    checked={syncWithParent} 
                                    onChange={(checked) => {
                                        setSyncWithParent(checked);
                                        // Re-trigger sync logic in useEffect
                                    }} 
                                    disabled={isFetchingParent || !parentData?.found}
                                />
                            </div>
                        </div>
                        
                        {!parentData?.found && !isFetchingParent && (
                             <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-center gap-2 mb-2 font-medium">
                                 <span className="text-lg">⚠️</span> No linked parent profile found. Please enter details manually.
                             </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FloatingInput 
                                label="Student Phone" 
                                type="tel" 
                                name="phone" 
                                value={formData.phone} 
                                onChange={handleChange} 
                                icon={<PhoneIcon className="w-4 h-4"/>} 
                                readOnly={syncWithParent && parentData?.found}
                                isSynced={syncWithParent && parentData?.found}
                            />
                            <FloatingInput 
                                label="Guardian Name / Relationship" 
                                name="parent_guardian_details" 
                                value={formData.parent_guardian_details} 
                                onChange={handleChange} 
                                icon={<UsersIcon className="w-4 h-4"/>} 
                                readOnly={syncWithParent && parentData?.found}
                                isSynced={syncWithParent && parentData?.found}
                            />
                        </div>
                        
                        <FloatingInput 
                            label="Residential Address"
                            name="address" 
                            value={formData.address} 
                            onChange={handleChange as any} 
                            icon={<LocationIcon className="w-4 h-4"/>}
                            isTextArea
                            readOnly={syncWithParent && parentData?.found}
                            isSynced={syncWithParent && parentData?.found}
                        />
                    </section>

                    <div className="pt-6 flex justify-end gap-3 border-t border-border bg-background sticky bottom-0 z-10 pb-2">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-6 py-2.5 font-bold text-muted-foreground hover:bg-muted rounded-xl text-sm transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="px-8 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg hover:bg-primary/90 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <Spinner size="sm" className="text-current"/> : <><CheckCircleIcon className="w-4 h-4"/> Save Changes</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditStudentDetailsModal;
