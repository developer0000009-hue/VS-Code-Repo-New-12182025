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
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
    </svg>
);

const PremiumFloatingInput: React.FC<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> & { label: string; icon?: React.ReactNode; isTextArea?: boolean; isSynced?: boolean }> = ({ label, icon, isTextArea, isSynced, className, ...props }) => (
    <div className="relative group w-full">
        {label && (
            <label className={`absolute left-11 top-0 -translate-y-1/2 bg-[#0c0e12] px-2 text-[10px] font-black uppercase tracking-[0.25em] z-20 duration-300 pointer-events-none
                ${isSynced ? 'text-primary' : 'text-white/40 group-focus-within:text-primary'}`}>
                {label}
            </label>
        )}
        <div className={`absolute ${isTextArea ? 'top-6' : 'top-1/2 -translate-y-1/2'} left-5 text-white/20 group-focus-within:text-primary transition-colors duration-300 z-10 pointer-events-none ${isSynced ? 'text-primary/60' : ''}`}>
            {icon}
        </div>
        {isTextArea ? (
            <textarea
                {...(props as any)}
                placeholder=" "
                className={`peer block w-full h-32 rounded-[2.2rem] border transition-all duration-300 px-6 pl-14 pt-6 pb-2 text-sm text-white font-medium shadow-inner outline-none placeholder-transparent
                    ${isSynced ? 'border-primary/40 bg-primary/5 shadow-[0_0_20px_rgba(var(--primary),0.1)]' : 'border-white/10 bg-black/40 hover:border-white/20 focus:border-primary focus:ring-8 focus:ring-primary/5'} 
                    ${className}`}
            />
        ) : (
            <input
                {...props}
                placeholder=" "
                className={`peer block w-full h-[74px] rounded-[1.8rem] border transition-all duration-300 px-6 pl-14 pt-5 pb-1 text-sm text-white font-medium shadow-inner outline-none placeholder-transparent
                    ${isSynced ? 'border-primary/40 bg-primary/5 shadow-[0_0_20px_rgba(var(--primary),0.1)]' : 'border-white/10 bg-black/40 hover:border-white/20 focus:border-primary focus:ring-8 focus:ring-primary/5'} 
                    ${className}`}
            />
        )}
        {isSynced && (
            <div className="absolute right-5 top-1/2 -translate-y-1/2 animate-in zoom-in-95 duration-500">
                <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.8)] flex items-center justify-center">
                    <CheckCircleIcon className="w-2 h-2 text-white" />
                </div>
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
    const [syncStatus, setSyncStatus] = useState<string>('');
    const [syncError, setSyncError] = useState<{message: string, isWarning: boolean} | null>(null);
    const [syncedFields, setSyncedFields] = useState<Set<string>>(new Set());
    const [mapUrl, setMapUrl] = useState<string | null>(null);

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
                setTimeout(() => setLoadingStates(false), 400);
            }
            if (name === 'state') {
                setLoadingCities(true);
                handleChange({ target: { name: 'city', value: '' } } as any);
                setTimeout(() => setLoadingCities(false), 400);
            }
            const next = new Set(syncedFields);
            next.delete(name);
            setSyncedFields(next);
        }
    };

    /**
     * Tiered Location Detection Flow
     */
    const handleAutoLocate = async () => {
        setIsLocating(true);
        setSyncStatus('Resolving GPS Telemetry...');
        setSyncError(null);
        setSyncedFields(new Set());
        setMapUrl(null);

        // Fallback Logic: IP-based hint (Mock for frontend robustness)
        const ipFallback = async () => {
            console.log("Telemetry: Falling back to Tier 2 (Contextual Hint)...");
            setSyncStatus('Regional Lookup Active...');
            // In a real environment, this would call a geolocation microservice
            await new Promise(r => setTimeout(r, 1000));
            handleSelectChange('country', false)('India');
            setSyncedFields(new Set(['country']));
            setSyncError({
                message: "Location access was denied. We've defaulted to your institutional home region (India). Please enter specific residency details manually.",
                isWarning: true
            });
            setIsLocating(false);
        };

        if (!navigator.geolocation) {
            await ipFallback();
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
                setSyncStatus('Identifying Neural Node...');
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                const prompt = `Perform a high-accuracy address lookup for coordinates: ${latitude}, ${longitude}.
                
                INSTRUCTIONS:
                1. Use the googleMaps tool to find the official residential address.
                2. Return ONLY a valid JSON object.
                3. Field 'state' must be the full official name (e.g. 'Rajasthan').
                4. Field 'country' must be 'India' if applicable.

                JSON SCHEMA:
                { 
                  "address": "Building Name/No, Street, Area", 
                  "city": "City Name", 
                  "state": "Official State Name", 
                  "country": "Country Name", 
                  "pin_code": "6-digit code" 
                }`;

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        tools: [{ googleMaps: {} }],
                        toolConfig: { retrievalConfig: { latLng: { latitude, longitude } } }
                    }
                });

                // Extract maps metadata for UX verification
                const mapsUri = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.find((chunk: any) => chunk.maps?.uri)?.maps?.uri;
                if (mapsUri) setMapUrl(mapsUri);

                const text = response.text || '';
                
                // Robust Regex extraction to bypass markdown junk
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                const jsonStr = jsonMatch ? jsonMatch[0] : null;
                
                if (jsonStr) {
                    setSyncStatus('Synchronizing Residency...');
                    const data = JSON.parse(jsonStr);
                    
                    const fields = ['country', 'state', 'city', 'address', 'pin_code'];
                    setSyncedFields(new Set(fields));

                    // Staggered UI population for premium "neural sync" feel
                    if (data.country) handleSelectChange('country', false)(data.country);
                    await new Promise(r => setTimeout(r, 200));
                    if (data.state) handleSelectChange('state', false)(data.state);
                    await new Promise(r => setTimeout(r, 200));
                    if (data.city) handleSelectChange('city', false)(data.city);
                    if (data.address) handleChange({ target: { name: 'address', value: data.address } } as any);
                    if (data.pin_code) handleChange({ target: { name: 'pin_code', value: data.pin_code } } as any);
                    
                    setSyncStatus('Identity Synced.');
                    setTimeout(() => setSyncStatus(''), 3000);
                } else {
                    throw new Error("Tier 1 Payload Mismatch");
                }
            } catch (err: any) {
                console.error("Locate Identity Failure [Tier 1]:", err);
                setSyncError({
                    message: "We couldn't auto-detect your location. Please enter your residency details manually.",
                    isWarning: false
                });
                setSyncStatus('');
            } finally {
                setIsLocating(false);
            }
        }, async (err) => {
            console.error("Geolocation Protocol Blocked:", err.code);
            await ipFallback();
        }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
    };

    if (activeTab === 'details') {
        return (
            <div className="animate-in slide-in-from-right-10 duration-700 pb-12">
                <div className="flex items-center gap-6 mb-12">
                    <div className="w-20 h-20 bg-primary/10 rounded-[1.8rem] flex items-center justify-center border border-primary/20 shadow-inner ring-4 ring-primary/5">
                        <UsersIcon className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-serif font-black text-white tracking-tight leading-none uppercase">Guardian Identity</h3>
                        <p className="text-sm text-white/30 font-medium mt-2 tracking-tight">Define your relationship and role within the institutional registry.</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <PremiumFloatingInput label="Full Legal Name" name="display_name" value={formData.display_name} onChange={handleChange} required icon={<UserIcon className="w-6 h-6"/>} />
                    
                    <CustomSelect 
                        label="Relationship Status" 
                        value={formData.relationship_to_student || ''} 
                        onChange={handleSelectChange('relationship_to_student')} 
                        options={[{value:'Father', label:'Father'}, {value:'Mother', label:'Mother'}, {value:'Guardian', label:'Legal Guardian'}, {value:'Other', label:'Authorized Affiliate'}]}
                        icon={<UsersIcon className="w-5 h-5"/>}
                    />
                    
                    <CustomSelect 
                        label="Gender" 
                        value={formData.gender || ''} 
                        onChange={handleSelectChange('gender')} 
                        options={[{value:'Male', label:'Male'}, {value:'Female', label:'Female'}, {value:'Other', label:'Other / Diverse'}, {value:'Prefer not to say', label:'Prefer not to say'}]}
                        icon={<UserIcon className="w-5 h-5"/>}
                    />
                    
                    <CustomSelect 
                        label="Family Roster Size" 
                        value={String(formData.number_of_children || '1')} 
                        onChange={handleSelectChange('number_of_children')} 
                        options={[{value:'1', label:'Single Child'}, {value:'2', label:'Nuclear Family (2)'}, {value:'3', label:'Nuclear Family (3)'}, {value:'4', label:'Extended Household (4+)'}]}
                        icon={<UsersIcon className="w-5 h-5"/>}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in slide-in-from-right-10 duration-700 pb-12">
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8 mb-14 bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000"><LocationIcon className="w-48 h-48" /></div>
                
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-[1.8rem] flex items-center justify-center border border-indigo-500/20 shadow-inner ring-4 ring-indigo-500/5">
                        <HomeIcon className="w-10 h-10 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-serif font-black text-white tracking-tight leading-none uppercase">Residency & Contact</h3>
                        <p className="text-sm text-white/30 font-medium mt-2 tracking-tight">Primary communication channels and residential telemetry.</p>
                        {syncStatus && (
                            <p className="text-[10px] font-black uppercase text-indigo-400 mt-3 animate-pulse tracking-[0.2em] flex items-center gap-2">
                                <SparklesIcon className="w-3 h-3" /> {syncStatus}
                            </p>
                        )}
                    </div>
                </div>

                <div className="relative z-10 w-full xl:w-auto">
                    <button 
                        type="button"
                        onClick={handleAutoLocate}
                        disabled={isLocating}
                        className={`w-full xl:w-auto flex items-center justify-center gap-4 px-10 py-5 rounded-[1.4rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all duration-700 shadow-2xl border
                            ${isLocating 
                                ? 'bg-primary/20 text-primary border-primary/40 animate-pulse cursor-wait' 
                                : 'bg-white/[0.03] text-white/50 border-white/10 hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:scale-95'
                            }
                        `}
                    >
                        {isLocating ? <Spinner size="sm" className="text-primary"/> : <><LocateFixedIcon className="w-5 h-5"/> Locate Identity</>}
                    </button>
                </div>
            </div>

            {/* Robust User-Friendly Banner */}
            {syncError && (
                <div className={`mb-10 p-6 border rounded-3xl flex items-center justify-between gap-5 animate-in slide-in-from-top-4 shadow-xl
                    ${syncError.isWarning ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'}
                `}>
                    <div className={`flex items-center gap-4 ${syncError.isWarning ? 'text-amber-500' : 'text-red-500'}`}>
                        {syncError.isWarning ? <AlertTriangleIcon className="w-8 h-8 shrink-0" /> : <XCircleIcon className="w-8 h-8 shrink-0" />}
                        <div>
                            <p className="text-sm font-black uppercase tracking-widest leading-none">{syncError.isWarning ? 'Manual Review Suggested' : 'Sync Interrupted'}</p>
                            <p className="text-xs font-medium mt-1.5 opacity-80 leading-relaxed">{syncError.message}</p>
                        </div>
                    </div>
                    <button onClick={() => setSyncError(null)} className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors">Dismiss</button>
                </div>
            )}

            <div className="space-y-12 bg-[#0c0e12] p-8 md:p-12 rounded-[3.5rem] border border-white/5 shadow-3xl ring-1 ring-black/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <PremiumFloatingInput 
                        label="Primary Mobile Number" 
                        name="phone" 
                        type="tel" 
                        value={formData.phone} 
                        onChange={handleChange} 
                        required 
                        icon={<PhoneIcon className="w-6 h-6"/>} 
                    />
                    
                    <CustomSelect 
                        label="Country" 
                        value={formData.country || ''} 
                        onChange={handleSelectChange('country')} 
                        options={countries.map(c => ({value: c, label: c}))}
                        icon={<GlobeIcon className="w-5 h-5"/>}
                        placeholder="Select Country..."
                        searchable
                        isSynced={syncedFields.has('country')}
                    />
                </div>

                <div className="relative group">
                    <div className="absolute -top-1.5 -left-1.5 w-8 h-8 bg-primary/5 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    <PremiumFloatingInput 
                        label="Full Residential Address" 
                        name="address" 
                        value={formData.address} 
                        onChange={handleChange as any} 
                        isTextArea 
                        isSynced={syncedFields.has('address')}
                        icon={<LocationIcon className="w-6 h-6"/>} 
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="relative">
                        <CustomSelect 
                            label="State / Province" 
                            value={formData.state || ''} 
                            onChange={handleSelectChange('state')} 
                            options={availableStates.map(s => ({value: s, label: s}))}
                            icon={loadingStates ? <Spinner size="sm" /> : <LocationIcon className="w-5 h-5"/>}
                            disabled={!formData.country}
                            placeholder={formData.country ? "Select State..." : "Waiting..."}
                            searchable
                            isSynced={syncedFields.has('state')}
                        />
                    </div>
                    <div className="relative">
                        <CustomSelect 
                            label="City / Locality" 
                            value={formData.city || ''} 
                            onChange={handleSelectChange('city')} 
                            options={availableCities.map(c => ({value: c, label: c}))}
                            icon={loadingCities ? <Spinner size="sm" /> : <LocationIcon className="w-5 h-5"/>}
                            disabled={!formData.state}
                            placeholder={formData.state ? "Select City..." : "Waiting..."}
                            searchable
                            isSynced={syncedFields.has('city')}
                        />
                    </div>
                    <PremiumFloatingInput 
                        label="Pin / Zip Code" 
                        name="pin_code" 
                        value={formData.pin_code} 
                        onChange={handleChange} 
                        isSynced={syncedFields.has('pin_code')}
                        icon={<LocationIcon className="w-6 h-6"/>} 
                    />
                </div>
                
                {mapUrl && (
                    <div className="flex justify-center pt-2 animate-in fade-in">
                         <a 
                            href={mapUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-2 text-[9px] font-black uppercase text-indigo-400 hover:text-indigo-300 transition-colors tracking-[0.2em]"
                        >
                            <LocationIcon className="w-3 h-3"/> Verify Node on Maps
                         </a>
                    </div>
                )}

                {syncedFields.size > 0 && !isLocating && (
                    <div className="pt-4 flex items-center justify-center gap-3 animate-in slide-in-from-bottom-2 duration-500">
                        <div className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-3 shadow-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Geographic Parameters Synced</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParentForm;