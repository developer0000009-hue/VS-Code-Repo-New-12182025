import React from 'react';
import { SchoolIcon } from '../icons/SchoolIcon';

const schoolRules = [
    { title: 'Attendance', content: 'Minimum 75% attendance is required to be eligible for final examinations.' },
    { title: 'Dress Code', content: 'Students must wear the prescribed school uniform at all times on campus.' },
    { title: 'Phone Use', content: 'Mobile phones are not permitted during class hours. They must be switched off and kept in bags.' },
    { title: 'Behavior Policy', content: 'Respect for teachers, staff, and fellow students is mandatory. Bullying is strictly prohibited.' },
];

const schoolFacilities = [
    { title: 'Library', content: 'Open from 8 AM to 4 PM. Students can borrow up to 2 books at a time.' },
    { title: 'Science Labs', content: 'Accessible only during practical classes with teacher supervision.' },
    { title: 'Sports Grounds', content: 'Available for use during PE classes and after school hours until 5 PM.' },
    { title: 'Canteen', content: 'Serves snacks and lunch during break times. All payments are digital.' },
];

const InfoCard: React.FC<{ title: string; items: { title: string; content: string }[] }> = ({ title, items }) => (
    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
        <h3 className="font-bold text-foreground text-lg mb-4">{title}</h3>
        <div className="space-y-4">
            {items.map(item => (
                <div key={item.title} className="p-4 rounded-lg bg-muted/40 border border-border">
                    <p className="font-semibold text-sm text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{item.content}</p>
                </div>
            ))}
        </div>
    </div>
);


const SchoolInfoTab: React.FC = () => {
    return (
        <div className="space-y-8">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-start gap-5">
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <SchoolIcon className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="font-bold text-foreground text-xl">School Details</h3>
                    <div className="mt-2 text-sm text-muted-foreground space-y-1">
                        <p><strong>Address:</strong> 123 Education Lane, Knowledge City, 12345</p>
                        <p><strong>Contact:</strong> admin@school.system | (123) 456-7890</p>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <InfoCard title="Key School Rules" items={schoolRules} />
                <InfoCard title="Facilities Information" items={schoolFacilities} />
            </div>
        </div>
    );
};

export default SchoolInfoTab;