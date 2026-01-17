
import React from 'react';
import { ParentProfileData } from '../../types';
import { PlusIcon } from '../icons/PlusIcon';
import { MailIcon } from '../icons/MailIcon';
import { PhoneIcon } from '../icons/PhoneIcon';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { UsersIcon } from '../icons/UsersIcon';

const InfoRow: React.FC<{ label: string; value?: string | null; icon: React.ReactNode }> = ({ label, value, icon }) => {
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

interface SecondaryParentCardProps {
    data: Partial<ParentProfileData>;
    onAdd: () => void;
    onEdit: () => void;
    onRemove: () => void;
}

const SecondaryParentCard: React.FC<SecondaryParentCardProps> = ({ data, onAdd, onEdit, onRemove }) => {
    const hasData = !!data.secondary_parent_name;

    if (!hasData) {
        return (
            <button 
                onClick={onAdd} 
                className="w-full h-full min-h-[350px] bg-card/50 hover:bg-card border-2 border-dashed border-border hover:border-primary/50 transition-all duration-300 rounded-2xl flex flex-col items-center justify-center p-8 group cursor-pointer"
            >
                <div className="w-16 h-16 rounded-full bg-muted group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center mb-4 transition-colors">
                    <PlusIcon className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">Add Secondary Parent</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs text-center">
                    Add another guardian for emergency contacts and school communication.
                </p>
            </button>
        );
    }

    return (
        <div className="group relative bg-card border border-border rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden h-full">
            {/* Header / Avatar */}
            <div className="relative p-6 pb-4 flex flex-col items-center border-b border-border/50">
                <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-purple-600/10 to-pink-600/10 dark:from-purple-600/20 dark:to-pink-600/20"></div>
                <div className="relative z-10 w-24 h-24 rounded-full border-4 border-background shadow-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                    <span className="text-3xl font-extrabold text-foreground/40 select-none">
                        {data.secondary_parent_name?.charAt(0)}
                    </span>
                </div>
                
                <div className="relative z-10 text-center mt-3">
                    <h3 className="text-xl font-bold text-foreground">{data.secondary_parent_name}</h3>
                    <div className="flex items-center justify-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground font-medium">{data.secondary_parent_relationship}</span>
                        <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-purple-500/20">
                            Secondary
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-grow bg-muted/5 space-y-5">
                <InfoRow 
                    label="Email Address" 
                    value={data.secondary_parent_email} 
                    icon={<MailIcon className="w-4 h-4"/>} 
                />
                <InfoRow 
                    label="Phone Number" 
                    value={data.secondary_parent_phone} 
                    icon={<PhoneIcon className="w-4 h-4"/>} 
                />
                <div className="pt-2 border-t border-border/50">
                    <InfoRow 
                        label="Gender" 
                        value={data.secondary_parent_gender} 
                        icon={<UsersIcon className="w-4 h-4"/>} 
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-muted/30 border-t border-border mt-auto flex gap-3">
                <button 
                    onClick={onRemove} 
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white text-sm font-bold transition-all"
                >
                    <TrashIcon className="w-4 h-4"/>
                    Remove
                </button>
                <button 
                    onClick={onEdit} 
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-sm font-bold transition-all shadow-sm"
                >
                    <EditIcon className="w-4 h-4"/>
                    Edit
                </button>
            </div>
        </div>
    );
};

export default SecondaryParentCard;
