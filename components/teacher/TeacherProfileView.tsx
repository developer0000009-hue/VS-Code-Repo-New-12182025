import React from 'react';
import { UserProfile, TeacherProfileData } from '../../types';
import { EditIcon } from '../icons/EditIcon';

const InfoItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <div>
            <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">{label}</p>
            <p className="text-foreground mt-1">{value}</p>
        </div>
    );
};

interface TeacherProfileViewProps {
    profile: UserProfile;
    teacherData: Partial<TeacherProfileData>;
    onEdit: () => void;
}

const TeacherProfileView: React.FC<TeacherProfileViewProps> = ({ profile, teacherData, onEdit }) => {
    return (
        <div className="bg-card rounded-2xl shadow-lg border border-border max-w-4xl mx-auto overflow-hidden">
            <div className="p-8 relative">
                <div className="absolute top-6 right-6">
                    <button onClick={onEdit} className="flex items-center gap-2 text-sm font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-lg transition-colors">
                        <EditIcon className="w-4 h-4" />
                        Edit Profile
                    </button>
                </div>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                    <div className="flex-shrink-0">
                        <img 
                            src={teacherData.profile_picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${profile.display_name}`} 
                            alt={profile.display_name}
                            className="w-32 h-32 rounded-full object-cover border-4 border-primary/20 shadow-md"
                        />
                    </div>
                    <div className="text-center sm:text-left">
                        <h2 className="text-3xl font-bold text-foreground">{profile.display_name}</h2>
                        <p className="text-lg font-medium text-primary mt-1">{teacherData.subject || 'Teacher'}</p>
                        <p className="text-sm text-muted-foreground mt-2">{profile.email}</p>
                        {profile.phone && <p className="text-sm text-muted-foreground">{profile.phone}</p>}
                    </div>
                </div>

                {teacherData.bio && (
                    <div className="mt-8 pt-6 border-t border-border">
                        <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-2">About Me</h3>
                        <p className="text-foreground/90 whitespace-pre-wrap">{teacherData.bio}</p>
                    </div>
                )}
            </div>
            
            <div className="bg-muted/30 p-8 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                <InfoItem label="Qualification" value={teacherData.qualification} />
                <InfoItem label="Experience" value={teacherData.experience_years ? `${teacherData.experience_years} years` : undefined} />
                <InfoItem label="Joined On" value={teacherData.date_of_joining ? new Date(teacherData.date_of_joining).toLocaleDateString() : undefined} />
                <InfoItem label="Specializations" value={teacherData.specializations} />
                <InfoItem label="Gender" value={teacherData.gender} />
                <InfoItem label="Date of Birth" value={teacherData.date_of_birth ? new Date(teacherData.date_of_birth).toLocaleDateString() : undefined} />
            </div>
        </div>
    );
};

export default TeacherProfileView;