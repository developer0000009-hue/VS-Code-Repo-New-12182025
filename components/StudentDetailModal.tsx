
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { StudentForAdmin } from '../types';
import Spinner from './common/Spinner';
import { XIcon } from './icons/XIcon';
import { UsersIcon } from './icons/UsersIcon';

interface StudentDetailModalProps {
    student: StudentForAdmin;
    onClose: () => void;
    onUpdate: () => void;
}

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ student, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        display_name: student.display_name,
        grade: student.grade,
        parent_guardian_details: student.parent_guardian_details,
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Update base profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ display_name: formData.display_name })
                .eq('id', student.id);

            if (profileError) throw profileError;

            // Update student specific details
            const { error: studentError } = await supabase
                .from('student_profiles')
                .update({
                    grade: formData.grade,
                    parent_guardian_details: formData.parent_guardian_details
                })
                .eq('user_id', student.id);

            if (studentError) throw studentError;

            onUpdate();
            onClose();
        } catch (error: any) {
            alert('Error updating student: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-full text-primary shadow-sm border border-primary/10">
                            <UsersIcon className="w-6 h-6"/>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">{student.display_name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-mono font-bold bg-muted px-2 py-0.5 rounded text-muted-foreground border border-border">
                                    {student.student_id_number || 'ID Pending'}
                                </span>
                                {student.is_active ? 
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">ACTIVE</span> :
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">PENDING</span>
                                }
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"><XIcon className="w-5 h-5"/></button>
                </div>

                <form onSubmit={handleSave} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider border-b border-border pb-2 mb-4">Academic Info</h3>
                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="text-xs font-bold text-foreground mb-2 block">Student ID</label>
                                <input value={student.student_id_number || ''} readOnly className="w-full p-3 bg-muted/50 border border-border rounded-xl text-sm text-muted-foreground font-mono cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-foreground mb-2 block">Current Grade</label>
                                <input name="grade" value={formData.grade} onChange={handleChange} className="w-full p-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium transition-all" required />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider border-b border-border pb-2 mb-4">Personal Details</h3>
                        <div>
                            <label className="text-xs font-bold text-foreground mb-2 block">Full Name</label>
                            <input name="display_name" value={formData.display_name} onChange={handleChange} className="w-full p-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium transition-all" required />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-foreground mb-2 block">Parent/Guardian Name</label>
                            <input name="parent_guardian_details" value={formData.parent_guardian_details} onChange={handleChange} className="w-full p-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium transition-all" />
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-3 border-t border-border mt-2">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors">Cancel</button>
                        <button type="submit" disabled={loading} className="px-8 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
                            {loading ? <Spinner size="sm" className="text-current"/> : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentDetailModal;
