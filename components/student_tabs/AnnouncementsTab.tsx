import React from 'react';
import { StudentDashboardData } from '../../types';
import { MegaphoneIcon } from '../icons/MegaphoneIcon';

interface AnnouncementsTabProps {
    data: StudentDashboardData;
}

const AnnouncementsTab: React.FC<AnnouncementsTabProps> = ({ data }) => {
    const announcements = data?.announcements ?? [];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Announcements</h2>
            {announcements.length > 0 ? (
                <div className="space-y-5">
                    {announcements.map(ann => (
                        <div key={ann.id} className="bg-card p-5 rounded-xl border border-border shadow-sm transition-shadow hover:shadow-md">
                             <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mt-1">
                                    <MegaphoneIcon className="w-5 h-5" />
                                </div>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-baseline">
                                        <p className="font-bold text-foreground text-base">{ann.subject}</p>
                                        <p className="text-xs text-muted-foreground/80 font-medium flex-shrink-0 ml-2">{new Date(ann.sent_at).toLocaleDateString()}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-3">From: {ann.sender_name}</p>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{ann.body}</p>
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 text-muted-foreground bg-card border-2 border-dashed border-border rounded-xl">
                    <MegaphoneIcon className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4"/>
                    <p className="font-medium text-lg text-foreground">Inbox Zero</p>
                    <p className="text-sm text-muted-foreground mt-1">All school-wide and class-specific updates will appear here.</p>
                </div>
            )}
        </div>
    );
};

export default AnnouncementsTab;