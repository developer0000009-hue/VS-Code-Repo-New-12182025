import React from 'react';
import { SchoolAdminProfileData } from '../../types';

interface ViewProps {
    data: Partial<SchoolAdminProfileData>;
}

const InfoRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
    <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-lg text-foreground">{value || 'Not provided'}</p>
    </div>
);

const SchoolAdminView: React.FC<ViewProps> = ({ data }) => {
    return (
        <div className="bg-muted/50 p-6 rounded-lg space-y-4 border border-border">
            <InfoRow label="School Name" value={data.school_name} />
            <InfoRow label="Address" value={data.address} />
            <InfoRow label="Country" value={data.country} />
            <div className="grid grid-cols-2 gap-4">
                <InfoRow label="State" value={data.state} />
                <InfoRow label="City" value={data.city} />
            </div>
        </div>
    );
};

export default SchoolAdminView;