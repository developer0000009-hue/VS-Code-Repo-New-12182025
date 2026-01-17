import React, { useState, useMemo, useEffect } from 'react';
import Spinner from '../common/Spinner';

interface SecondaryParentData {
    name: string;
    relationship: string;
    gender: string;
    email: string;
    phone: string;
}

interface FormProps {
    initialData: SecondaryParentData;
    onSave: (data: SecondaryParentData) => void;
    onCancel: () => void;
    loading: boolean;
    primaryRelationship?: string;
}

const BaseInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input 
        {...props}
        className="appearance-none block w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-primary sm:text-sm bg-background text-foreground disabled:bg-muted/50 disabled:cursor-not-allowed" 
    />
);

const BaseSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select
        {...props}
        className="appearance-none block w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-primary sm:text-sm bg-background text-foreground disabled:bg-muted/50 disabled:cursor-not-allowed"
    >
        {props.children}
    </select>
);

const Label: React.FC<{htmlFor: string; children: React.ReactNode}> = ({htmlFor, children}) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-muted-foreground mb-1">{children}</label>
);

const SecondaryParentForm: React.FC<FormProps> = ({ initialData, onSave, onCancel, loading, primaryRelationship }) => {
    const [formData, setFormData] = useState(initialData);

    const availableRelationships = useMemo(() => {
        if (primaryRelationship === 'Father') {
            return ['Mother', 'Guardian', 'Other'];
        }
        if (primaryRelationship === 'Mother') {
            return ['Father', 'Guardian', 'Other'];
        }
        // Fallback for when primary is Guardian, Other, or not set yet.
        const allRelationships = ['Father', 'Mother', 'Guardian', 'Other'];
        if (primaryRelationship) {
            return allRelationships.filter(r => r !== primaryRelationship);
        }
        return allRelationships;
    }, [primaryRelationship]);

    useEffect(() => {
        // Auto-select relationship on mount for new entries only.
        if (!initialData.relationship) {
            if (primaryRelationship === 'Father') {
                setFormData(prev => ({ ...prev, relationship: 'Mother' }));
            } else if (primaryRelationship === 'Mother') {
                setFormData(prev => ({ ...prev, relationship: 'Father' }));
            }
        }
    }, [initialData.relationship, primaryRelationship]);


    useEffect(() => {
        // If the currently saved relationship is no longer valid, reset it.
        if (formData.relationship && !availableRelationships.includes(formData.relationship)) {
            setFormData(prev => ({ ...prev, relationship: '' }));
        }
    }, [availableRelationships, formData.relationship]);
    
    useEffect(() => {
        const relationship = formData.relationship;
        let newGender = '';

        if (relationship === 'Father') {
            newGender = 'Male';
        } else if (relationship === 'Mother') {
            newGender = 'Female';
        }

        // Only update if the gender needs to change to avoid infinite loops
        if (newGender && formData.gender !== newGender) {
            setFormData(prev => ({ ...prev, gender: newGender }));
        }
    }, [formData.relationship, formData.gender]);

    const isGenderDisabled = formData.relationship === 'Father' || formData.relationship === 'Mother';


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-muted/50 p-4 rounded-lg border border-border space-y-4">
            <div>
                <Label htmlFor="name">Full Name</Label>
                <BaseInput id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="relationship">Relationship to Student</Label>
                    <BaseSelect id="relationship" name="relationship" value={formData.relationship} onChange={handleChange} required>
                        <option value="" disabled>Select...</option>
                        {availableRelationships.map(rel => (
                            <option key={rel} value={rel}>{rel}</option>
                        ))}
                    </BaseSelect>
                </div>
                <div>
                    <Label htmlFor="gender">Gender</Label>
                    <BaseSelect id="gender" name="gender" value={formData.gender} onChange={handleChange} disabled={isGenderDisabled}>
                        <option value="" disabled>Select Gender...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                    </BaseSelect>
                </div>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="email">Email Address</Label>
                    <BaseInput id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                </div>
                <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <BaseInput id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onCancel} className="py-2 px-4 bg-background hover:bg-border text-foreground rounded-lg text-sm font-medium">
                    Cancel
                </button>
                <button type="submit" disabled={loading} className="py-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg disabled:opacity-50 flex items-center text-sm font-medium">
                    {loading ? <Spinner size="sm" /> : 'Save Details'}
                </button>
            </div>
        </form>
    );
};

export default SecondaryParentForm;