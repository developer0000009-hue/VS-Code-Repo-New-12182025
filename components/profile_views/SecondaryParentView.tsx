import React from 'react';
import { ParentProfileData } from '../../types';

interface ViewProps {
    data: ParentProfileData;
    onEdit: () => void;
    onRemove: () => void;
}

const InfoRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
    <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-lg text-foreground">{value || 'Not provided'}</p>
    </div>
);

const SecondaryParentView: React.FC<ViewProps> = ({ data, onEdit, onRemove }) => {
    return (
        <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow label="Full Name" value={data.secondary_parent_name} />
                <InfoRow label="Relationship" value={data.secondary_parent_relationship} />
                <InfoRow label="Email" value={data.secondary_parent_email} />
                <InfoRow label="Phone" value={data.secondary_parent_phone} />
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
                 <button onClick={onRemove} className="py-2 px-4 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg text-sm font-medium">
                    Remove
                </button>
                <button onClick={onEdit} className="py-2 px-4 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-lg text-sm font-medium">
                    Edit
                </button>
            </div>
        </div>
    );
};

export default SecondaryParentView;