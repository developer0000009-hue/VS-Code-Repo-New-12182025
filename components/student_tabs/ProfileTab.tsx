
import React, { useState } from 'react';
import { StudentDashboardData } from '../../types';
import { SchoolIcon } from '../icons/SchoolIcon';
import { EditIcon } from '../icons/EditIcon';
import { UserIcon } from '../icons/UserIcon';
import { PhoneIcon } from '../icons/PhoneIcon';
import { MailIcon } from '../icons/MailIcon';
import { supabase } from '../../services/supabase';
import Spinner from '../common/Spinner';

interface ProfileTabProps {
    data: StudentDashboardData;
}

const InfoRow: React.FC<{ label: string, value: string | null | undefined, icon?: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="flex items-start gap-4 py-4 border-b border-border last:border-b-0">
        <div className="mt-0.5 text-muted-foreground">
            {icon || <div className="w-5 h-5" />}
        </div>
        <div className="flex-grow">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-base text-foreground font-medium mt-0.5">{value || 'Not provided'}</p>
        </div>
    </div>
);

const DigitalIdCard: React.FC<{ data: StudentDashboardData }> = ({ data }) => (
    <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden max-w-sm mx-auto transform hover:scale-105 transition-transform duration-300 group">
        <div className="p-5 bg-gradient-to-br from-primary via-blue-600 to-indigo-700 relative text-white">
             <div className="absolute inset-0 bg-black/10"></div>
             <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                    <SchoolIcon className="w-8 h-8 text-white/90" />
                    <h3 className="font-bold text-white text-lg leading-tight">Student ID Card</h3>
                </div>
                <div className="flex items-end gap-5">
                    <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm flex-shrink-0 overflow-hidden border-4 border-white/50 shadow-lg">
                        <img src={`https://api.dicebear.com/8.x/initials/svg?seed=${data.profile.display_name}&backgroundColor=00897b,00acc1,26c6da,4dd0e1,80deea,a7ffeb`} alt="Student" className="w-full h-full object-cover"/>
                    </div>
                    <div className="space-y-1 pb-1">
                        <p className="text-xs text-white/80 font-medium uppercase tracking-wider">Class {data.profile.grade}</p>
                        <h4 className="text-2xl font-extrabold text-white tracking-tight leading-none">{data.profile.display_name}</h4>
                    </div>
                </div>
             </div>
        </div>
        <div className="p-5 space-y-4 bg-card">
            <div className="flex justify-between items-center border-b border-border pb-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Roll No.</p>
                <p className="font-mono font-bold text-lg text-foreground">{data.profile.roll_number || 'N/A'}</p>
            </div>
             <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Student ID</p>
                <p className="font-mono font-bold text-lg text-foreground">{data.profile.student_id_number || 'N/A'}</p>
            </div>
        </div>
        <div className="bg-emerald-500/10 p-3 border-t border-emerald-500/20 text-center">
            <div className="flex justify-center items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Student
            </div>
        </div>
    </div>
);

const EditProfileModal: React.FC<{ profile: any, onClose: () => void }> = ({ profile, onClose }) => {
    const [phone, setPhone] = useState(profile.phone || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.from('profiles').update({ phone }).eq('id', profile.id);
        setLoading(false);
        if (error) alert("Failed to update profile");
        else {
            window.location.reload(); // Simple reload to refresh data
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl p-6 border border-border" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">Edit Personal Details</h3>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Phone Number</label>
                        <input 
                            type="tel" 
                            value={phone} 
                            onChange={e => setPhone(e.target.value)} 
                            className="w-full p-3 rounded-lg bg-background border border-input focus:ring-2 focus:ring-primary/50 outline-none"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg font-bold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                        <button type="submit" disabled={loading} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors flex items-center gap-2">
                            {loading && <Spinner size="sm" className="text-current"/>} Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const ProfileTab: React.FC<ProfileTabProps> = ({ data }) => {
    const [isEditing, setIsEditing] = useState(false);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-1">
                <DigitalIdCard data={data} />
            </div>
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-foreground text-xl">Personal Information</h3>
                        <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-primary hover:bg-primary/10 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-primary/20">
                            <EditIcon className="w-4 h-4" /> Edit Details
                        </button>
                    </div>
                    
                    <div>
                        <InfoRow label="Full Name" value={data.profile.display_name} icon={<UserIcon className="w-5 h-5"/>} />
                        <InfoRow label="System Email" value={data.profile.email} icon={<MailIcon className="w-5 h-5"/>} />
                        <InfoRow label="Contact Phone" value={data.profile.phone} icon={<PhoneIcon className="w-5 h-5"/>} />
                        <InfoRow label="Parent/Guardian" value={data.profile.parent_guardian_details} icon={<UserIcon className="w-5 h-5"/>} />
                    </div>
                </div>
                
                <div className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm">
                    <h3 className="font-bold text-foreground text-xl mb-6">Academic Details</h3>
                     <div>
                        <InfoRow label="Current Class" value={data.classInfo?.name} icon={<SchoolIcon className="w-5 h-5"/>} />
                        <InfoRow label="Class Teacher" value={data.classInfo?.teacher_name} icon={<UserIcon className="w-5 h-5"/>} />
                        <InfoRow label="Admission Date" value={new Date(data.profile.created_at).toLocaleDateString()} icon={<SchoolIcon className="w-5 h-5"/>} />
                    </div>
                </div>
            </div>
            
            {isEditing && <EditProfileModal profile={data.profile} onClose={() => setIsEditing(false)} />}
        </div>
    );
};

export default ProfileTab;
