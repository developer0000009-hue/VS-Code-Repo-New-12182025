
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import Spinner from './common/Spinner';
import { UsersIcon } from './icons/UsersIcon';
import { UserIcon } from './icons/UserIcon';
import { MailIcon } from './icons/MailIcon';
import { XIcon } from './icons/XIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { UserProfile } from '../types';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';

interface ITAdminSetupPageProps {
    onComplete: () => void;
    profile: UserProfile;
    onBack?: () => void;
}

const FloatingLabelInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string, icon?: React.ReactNode }> = ({ label, icon, ...props }) => (
    <div className="relative group">
        <div className="absolute top-1/2 -translate-y-1/2 left-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors z-10">{icon}</div>
        <input {...props} placeholder=" " className="peer block w-full rounded-xl border border-input/50 bg-background/50 px-4 py-4 pl-12 text-sm text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all" />
        <label className="absolute left-11 top-0 -translate-y-1/2 bg-card/95 px-1.5 text-[10px] font-bold uppercase text-muted-foreground/80 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:top-0 peer-focus:text-[10px] peer-focus:font-bold peer-focus:uppercase peer-focus:text-primary pointer-events-none">{label}</label>
    </div>
);

const ITAdminSetupPage: React.FC<ITAdminSetupPageProps> = ({ onComplete, profile, onBack }) => {
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        designation: 'IT Administrator'
    });
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        if (profile) {
            setFormData(prev => ({
                ...prev,
                name: profile.display_name || '',
                email: profile.email || '',
                phone: profile.phone || ''
            }));
        }
        setInitializing(false);
    }, [profile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: rpcError } = await supabase.rpc('complete_school_onboarding', {
                p_admin_name: formData.name,
                p_admin_email: formData.email,
                p_admin_phone: formData.phone,
                p_designation: formData.designation
            });

            if (rpcError) throw rpcError;
            
            if (isMounted.current) onComplete();
        } catch (err: any) {
            if (isMounted.current) {
                setError(err.message || 'Failed to complete setup.');
                setLoading(false);
            }
        }
    };

    if (initializing) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Spinner size="lg" />
                <p className="mt-4 animate-pulse">Loading IT Admin setup...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-xl mx-auto">
            {onBack && (
                <button
                    onClick={onBack}
                    className="mb-6 flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-sm font-medium"
                >
                    <ChevronLeftIcon className="w-4 h-4" />
                    Back
                </button>
            )}

            <div className="bg-card rounded-2xl shadow-xl border border-border p-8 md:p-10 animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-indigo-500 to-purple-500"></div>
                
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner transform rotate-3">
                        <UsersIcon className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight">IT Admin Setup</h1>
                    <p className="text-muted-foreground mt-3 text-lg leading-relaxed max-w-sm mx-auto">
                        Configure the primary administrator profile for this branch.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-sm font-bold border border-destructive/20 flex items-center gap-3 animate-pulse">
                            <XIcon className="w-5 h-5 flex-shrink-0" /> {error}
                        </div>
                    )}
                    
                    <FloatingLabelInput 
                        label="Full Name" 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        required 
                        icon={<UserIcon className="w-4 h-4"/>} 
                    />

                    <FloatingLabelInput 
                        label="Email Address" 
                        type="email" 
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        required 
                        icon={<MailIcon className="w-4 h-4"/>} 
                    />

                    <FloatingLabelInput 
                        label="Phone Number (Optional)" 
                        type="tel" 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})} 
                        icon={<PhoneIcon className="w-4 h-4"/>} 
                    />

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-8 py-4 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-primary/25 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center gap-3 justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? <Spinner size="md" className="text-white" /> : 'Complete Setup'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ITAdminSetupPage;
