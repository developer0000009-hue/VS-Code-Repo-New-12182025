import React, { useMemo, useState, useEffect } from 'react';
import { ParentProfileData } from '../../types';
import { UserIcon } from '../icons/UserIcon';
import { PhoneIcon } from '../icons/PhoneIcon';
import { GlobeIcon } from '../icons/GlobeIcon';
import { LocationIcon } from '../icons/LocationIcon';
import { HomeIcon } from '../icons/HomeIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import CustomSelect from '../common/CustomSelect';
import { countries, statesByCountry, citiesByState } from '../data/locations';
import Spinner from '../common/Spinner';
import { GoogleGenAI } from '@google/genai';

const LocateFixedIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
    </svg>
);

const PremiumFloatingInput: React.FC<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> & { label: string; icon?: React.ReactNode; isTextArea?: boolean; isSynced?: boolean; action?: React.ReactNode }> = ({ label, icon, isTextArea, isSynced, action, className, ...props }) => (
    <div className="relative group w-full">
        {label && (
            <label className={`absolute left-11 top-0 -translate-y-1/2 bg-slate-900/90 px-1.5 text-[10px] font-bold uppercase tracking-widest z-20 transition-all duration-300 pointer-events-none
                ${isSynced ? 'text-primary' : 'text-white/30 group-focus-within:text-primary'}`}>
                {label}
            </label>
        )}
        <div className={`absolute ${isTextArea ? 'top-5' : 'top-1/2 -translate-y-1/2'} left-4 text-white/10 group-focus-within:text-primary transition-all duration-300 z-10 pointer-events-none ${isSynced ? 'text-primary/60' : ''}`}>
            {icon}
        </div>
        {isTextArea ? (
            <textarea
                {...(props as any)}
                placeholder=" "
                className={`peer block w-full h-24 rounded-xl border transition-all duration-300 px-5 pl-12 pr-12 pt-5 pb-2 text-[15px] text-white font-medium outline-none placeholder-transparent
                    ${isSynced ? 'border-primary/40 bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.05)]' : 'border-white/10 bg-black/30 hover:border-white/20 focus:border-primary/40 focus:ring-4 focus:ring-primary/5'} 
                    ${className}`}
            />
        ) : (
            <input
                {...props}
                placeholder=" "
                className={`peer block w-full h-[48px] rounded-xl border transition-all duration-300 px-5 pl-12 pt-4 pb-1 text-[15px] text-white font-medium outline-none placeholder-transparent
                    ${isSynced ? 'border-primary/40 bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.05)]' : 'border-white/10 bg-black/30 hover:border-white/20 focus:border-primary/40 focus:ring-4 focus:ring-primary/5'} 
                    ${className}`}
            />
        )}
        {action && (
            <div className="absolute right-3 top-3 z-30">
                {action}
            </div>
        )}
        {isSynced && !action && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-in zoom-in-95 duration-500">
                <CheckCircleIcon className="w-4 h-4 text-primary shadow-[0_0_10px_rgba(var(--primary),0.4)]" />
            </div>
        )}
    </div>
);

interface FormProps {
    formData: Partial<ParentProfileData & { phone: string; display_name: string; }>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    activeTab: 'details' | 'contact';
}

const ParentForm: React.FC<FormProps> = ({ formData, handleChange, activeTab }) => {
    const [loadingStates, setLoadingStates] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [isResolving, setIsResolving] = useState(false);
    const [syncStatus, setSyncStatus] = useState<string>('');
    const [syncError, setSyncError] = useState<{message: string, isWarning: boolean} | null>(null);
    const [syncedFields, setSyncedFields] = useState<Set<string>>(new Set());

    const availableStates = useMemo(() => formData.country ? statesByCountry[formData.country] || [] : [], [formData.country]);
    const availableCities = useMemo(() => formData.state ? citiesByState[formData.state] || [] : [], [formData.state]);

    const handleSelectChange = (name: string, isManual = true) => (value: string) => {
        handleChange({ target: { name, value } } as any);

        if (name === 'relationship_to_student') {
            if (value === 'Father') handleChange({ target: { name: 'gender', value: 'Male' } } as any);
            else if (value === 'Mother') handleChange({ target: { name: 'gender', value: 'Female' } } as any);
        }

        if (isManual) {
            if (name === 'country') {
                setLoadingStates(true);
                handleChange({ target: { name: 'state', value: '' } } as any);
                handleChange({ target: { name: 'city', value: '' } } as any);
                setTimeout(() => setLoadingStates(false), 300);
            }
            if (name === 'state') {
                setLoadingCities(true);
                handleChange({ target: { name: 'city', value: '' } } as any);
                setTimeout(() => setLoadingCities(false), 300);
            }
            const next = new Set(syncedFields);
            next.delete(name);
            setSyncedFields(next);
        }
    };

    const handleResolveAddress = async () => {
        if (!formData.address?.trim()) return;
        setIsResolving(true);
        setSyncStatus('Resolving Address...');
        setSyncError(null);
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Based on the residential address "${formData.address}", extract or identify city, state, and country.
            Output Strictly as valid JSON: {"city": "string", "state": "string", "country": "string"}.
            Country must match one of: ${countries.join(', ')}.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { tools: [{ googleMaps: {} }] }
            });

            const text = response.text || '';
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                const fields = ['country', 'state', 'city'];
                setSyncedFields(new Set(fields));

                if (data.country) handleSelectChange('country', false)(data.country);
                if (data.state) handleSelectChange('state', false)(data.state);
                if (data.city) handleSelectChange('city', false)(data.city);
                
                setSyncStatus('Address Resolved.');
                setTimeout(() => setSyncStatus(''), 3000);
            }
        } catch (err) {
            console.error("Resolve failed", err);
            setSyncError({ message: "Auto-fill failed. Please enter manually.", isWarning: true });
        } finally {
            setIsResolving(false);
        }
    };

    const handleAutoLocate = async () => {
        setIsLocating(true);
        setSyncStatus('Resolving Telemetry...');
        setSyncError(null);
        setSyncedFields(new Set());

        if (!navigator.geolocation) {
            setSyncError({ message: "Geolocation not supported.", isWarning: false });
            setIsLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `Identify official address for coordinates: ${latitude}, ${longitude}. 
                Output JSON: {"address": string, "city": string, "state": string, "country": string, "pin_code": string}. 
                Country must be full name. Use official registry names.`;

                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: {
                        tools: [{ googleMaps: {} }],
                        toolConfig: { retrievalConfig: { latLng: { latitude, longitude } } }
                    }
                });

                const text = response.text || '';
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const data = JSON.parse(jsonMatch[0]);
                    const fields = ['country', 'state', 'city', 'address', 'pin_code'];
                    setSyncedFields(new Set(fields));

                    if (data.country) handleSelectChange('country', false)(data.country);
                    if (data.state) handleSelectChange('state', false)(data.state);
                    if (data.city) handleSelectChange('city', false)(data.city);
                    if (data.address) handleChange({ target: { name: 'address', value: data.address } } as any);
                    if (data.pin_code) handleChange({ target: { name: 'pin_code', value: data.pin_code } } as any);
                    
                    setSyncStatus('Identity Synced.');
                    setTimeout(() => setSyncStatus(''), 3000);
                }
            } catch (err: any) {
                setSyncError({ message: "Detection failed. Manual entry required.", isWarning: true });
            } finally {
                setIsLocating(false);
            }
        }, () => {
            setSyncError({ message: "Location access denied.", isWarning: true });
            setIsLocating(false);
        });
    };

    if (activeTab === 'details') {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-primary/5 rounded-xl text-primary/60 border border-primary/10 shadow-inner">
                        <UsersIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-widest uppercase">Guardian Identity</h3>
                        <p className="text-[11px] text-white/30 font-medium tracking-wider">Define your institutional role and relationship.</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PremiumFloatingInput label="Full Legal Name" name="display_name" value={formData.display_name} onChange={handleChange} required icon={<UserIcon className="w-4 h-4"/>} />
                    
                    <CustomSelect 
                        label="Relationship Status" 
                        value={formData.relationship_to_student || ''} 
                        onChange={handleSelectChange('relationship_to_student')} 
                        options={[{value:'Father', label:'Father'}, {value:'Mother', label:'Mother'}, {value:'Guardian', label:'Legal Guardian'}, {value:'Other', label:'Authorized Affiliate'}]}
                        icon={<UsersIcon className="w-4 h-4"/>}
                    />
                    
                    <CustomSelect 
                        label="Gender" 
                        value={formData.gender || ''} 
                        onChange={handleSelectChange('gender')} 
                        options={[{value:'Male', label:'Male'}, {value:'Female', label:'Female'}, {value:'Other', label:'Diverse'}, {value:'Prefer not to say', label:'Prefer not to say'}]}
                        icon={<UserIcon className="w-4 h-4"/>}
                    />
                    
                    <CustomSelect 
                        label="Family Size" 
                        value={String(formData.number_of_children || '1')} 
                        onChange={handleSelectChange('number_of_children')} 
                        options={[{value:'1', label:'Single Child'}, {value:'2', label:'2 Children'}, {value:'3', label:'3 Children'}, {value:'4', label:'4+ Children'}]}
                        icon={<UsersIcon className="w-4 h-4"/>}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
            <div className="flex items-center justify-between gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-indigo-500/5 rounded-xl text-indigo-400 border border-indigo-500/10 shadow-inner">
                        <HomeIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-widest uppercase">Residency & Contact</h3>
                        <p className="text-[11px] text-white/30 font-medium tracking-wider">{syncStatus || 'Primary contact and telemetry.'}</p>
                    </div>
                </div>

                <button 
                    type="button"
                    onClick={handleAutoLocate}
                    disabled={isLocating}
                    className={`h-[40px] px-6 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all duration-300 border
                        ${isLocating 
                            ? 'bg-primary/20 text-primary border-primary/40 animate-pulse' 
                            : 'bg-white/5 text-white/50 border-white/5 hover:border-primary/40 hover:text-white active:scale-[0.98]'
                        }
                    `}
                >
                    {isLocating ? <Spinner size="sm" className="text-primary"/> : <><LocateFixedIcon className="w-4 h-4 inline mr-2"/> Locate Node</>}
                </button>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PremiumFloatingInput 
                        label="Primary Mobile" 
                        name="phone" 
                        type="tel" 
                        value={formData.phone} 
                        onChange={handleChange} 
                        required 
                        icon={<PhoneIcon className="w-4 h-4"/>} 
                    />
                    
                    <CustomSelect 
                        label="Country" 
                        value={formData.country || ''} 
                        onChange={handleSelectChange('country')} 
                        options={countries.map(c => ({value: c, label: c}))}
                        icon={<GlobeIcon className="w-4 h-4"/>}
                        placeholder="Select Region..."
                        searchable
                        isSynced={syncedFields.has('country')}
                    />
                </div>

                <PremiumFloatingInput 
                    label="Full Residential Address" 
                    name="address" 
                    value={formData.address} 
                    onChange={handleChange as any} 
                    isTextArea 
                    isSynced={syncedFields.has('address')}
                    icon={<LocationIcon className="w-4 h-4"/>} 
                    action={
                        <button 
                            type="button"
                            onClick={handleResolveAddress}
                            disabled={isResolving || !formData.address?.trim()}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all disabled:opacity-30"
                            title="Auto-fill city, state, country"
                        >
                            {isResolving ? <Spinner size="sm" /> : <SparklesIcon className="w-5 h-5" />}
                        </button>
                    }
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <CustomSelect 
                        label="State" 
                        value={formData.state || ''} 
                        onChange={handleSelectChange('state')} 
                        options={availableStates.map(s => ({value: s, label: s}))}
                        icon={loadingStates ? <Spinner size="sm" /> : <LocationIcon className="w-4 h-4"/>}
                        disabled={!formData.country}
                        searchable
                        isSynced={syncedFields.has('state')}
                    />
                    <CustomSelect 
                        label="City" 
                        value={formData.city || ''} 
                        onChange={handleSelectChange('city')} 
                        options={availableCities.map(c => ({value: c, label: c}))}
                        icon={loadingCities ? <Spinner size="sm" /> : <LocationIcon className="w-4 h-4"/>}
                        disabled={!formData.state}
                        searchable
                        isSynced={syncedFields.has('city')}
                    />
                    <PremiumFloatingInput 
                        label="Pin Code" 
                        name="pin_code" 
                        value={formData.pin_code} 
                        onChange={handleChange} 
                        isSynced={syncedFields.has('pin_code')}
                        icon={<LocationIcon className="w-4 h-4"/>} 
                    />
                </div>
            </div>
        </div>
    );
};

export default ParentForm;
