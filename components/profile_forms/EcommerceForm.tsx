
import React from 'react';
import { EcommerceProfileData } from '../../types';

interface FormProps {
    formData: Partial<EcommerceProfileData>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const BaseInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input 
        {...props}
        className="appearance-none block w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-primary sm:text-sm bg-background text-foreground" 
    />
);

const Label: React.FC<{htmlFor: string; children: React.ReactNode}> = ({htmlFor, children}) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-muted-foreground mb-1">{children}</label>
);

const EcommerceForm: React.FC<FormProps> = ({ formData, handleChange }) => {
    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="store_name">Store/Business Name</Label>
                <BaseInput id="store_name" name="store_name" type="text" value={formData.store_name || ''} onChange={handleChange} required placeholder="e.g., School Uniform Supply"/>
            </div>
            <div>
                <Label htmlFor="business_type">Type of Business</Label>
                <BaseInput id="business_type" name="business_type" type="text" value={formData.business_type || ''} onChange={handleChange} placeholder="e.g., Uniforms, Stationery, Books"/>
            </div>
        </div>
    );
};

export default EcommerceForm;
