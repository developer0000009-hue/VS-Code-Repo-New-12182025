
import React from 'react';
import { ParentProfileData, UserProfile } from '../../types';
import { MailIcon } from '../icons/MailIcon';
import { PhoneIcon } from '../icons/PhoneIcon';
import { LocationIcon } from '../icons/LocationIcon';
import { EditIcon } from '../icons/EditIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';

interface ParentProfileCardProps {
    profile: UserProfile;
    data: Partial<ParentProfileData & { phone: string }>;
    onEdit: () => void;
}

const InfoRow: React.FC<{ label: string; value?: string | number | null; icon: React.ReactNode }> = ({ label, value, icon }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 text-muted-foreground/60">{icon}</div>
            <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="text-sm font-medium text-foreground">{String(value)}</p>
            </div>
        </div>
    );
};

const ParentProfileCard: React.FC<ParentProfileCardProps> = ({ profile, data, onEdit }) => {
    const fullAddress = [data.address, data.city, data.state, data.pin_code, data.country]
        .filter(Boolean)
        .join(', ');

    return (
        <div className="group relative bg-card border border-border rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden h-full">
            {/* Header / Avatar */}
            <div className="relative p-6 pb-4 flex flex-col items-center border-b border-border/50">
                <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-600/20 dark:to-indigo-600/20"></div>
                <div className="relative z-10 w-24 h-24 rounded-full border-4 border-background shadow-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                    <span className="text-3xl font-extrabold text-foreground/40 select-none">
                        {(profile.display_name || 'P').charAt(0)}
                    </span>
                </div>
                
                <div className="relative z-10 text-center mt-3">
                    <h3 className="text-xl font-bold text-foreground">{profile.display_name || 'Parent'}</h3>
                    <div className="flex items-center justify-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground font-medium">{data.relationship_to_student || 'Guardian'}</span>
                        <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-primary/20">
                            <CheckCircleIcon className="w-3 h-3"/> Primary
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-grow bg-muted/5 space-y-5">
                <InfoRow 
                    label="Email Address" 
                    value={profile.email} 
                    icon={<MailIcon className="w-4 h-4"/>} 
                />
                <InfoRow 
                    label="Phone Number" 
                    value={data.phone} 
                    icon={<PhoneIcon className="w-4 h-4"/>} 
                />
                <InfoRow 
                    label="Residential Address" 
                    value={fullAddress} 
                    icon={<LocationIcon className="w-4 h-4"/>} 
                />
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                    <InfoRow 
                        label="Gender" 
                        value={data.gender} 
                        icon={<div className="w-4 h-4"/>} 
                    />
                    <InfoRow 
                        label="Children" 
                        value={data.number_of_children} 
                        icon={<div className="w-4 h-4"/>} 
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-muted/30 border-t border-border mt-auto">
                <button 
                    onClick={onEdit}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-sm font-bold transition-all shadow-sm hover:shadow-md"
                >
                    <EditIcon className="w-4 h-4"/>
                    Edit Profile
                </button>
            </div>
        </div>
    );
};

export default ParentProfileCard;
