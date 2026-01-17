import React, { useState, useRef, useMemo } from 'react';
import { SchoolAdminProfileData } from '../../types';
import { countries, statesByCountry, citiesByState } from '../data/locations';
import { countryCodes } from '../data/countryCodes';
import { SchoolIcon } from '../icons/SchoolIcon';
import { LocationIcon } from '../icons/LocationIcon';
import { GlobeIcon } from '../icons/GlobeIcon';
import { MailIcon } from '../icons/MailIcon';
import { PhoneIcon } from '../icons/PhoneIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { BookIcon } from '../icons/BookIcon';
import { HashIcon } from '../icons/HashIcon';
import { LayersIcon } from '../icons/LayersIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import CustomSelect from '../common/CustomSelect';
import { GoogleGenAI } from '@google/genai';
import Spinner from '../common/Spinner';

// --- Constants ---
const MONTHS = [
    { value: 'January', label: 'January' },
    { value: 'February', label: 'February' },
    { value: 'March', label: 'March' },
    { value: 'April', label: 'April' },
    { value: 'May', label: 'May' },
    { value: 'June', label: 'June' },
    { value: 'July', label: 'July' },
    { value: 'August', label: 'August' },
    { value: 'September', label: 'September' },
    { value: 'October', label: 'October' },
    { value: 'November', label: 'November' },
    { value: 'December', label: 'December' },
];

const GRADES = [
    { value: 'Pre-K', label: 'Pre-Kindergarten' },
    { value: 'KG', label: 'Kindergarten' },
    ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Grade ${i + 1}` })),
];

// --- Styled Components ---

const PremiumInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: React.ReactNode; action?: React.ReactNode; fullWidth?: boolean }> = ({ label, icon, action, fullWidth, className, ...props }) => (
    <div className={`relative group ${fullWidth ? 'w-full' : ''}`}>
        <div className="absolute top-1/2 -translate-y-1/2 left-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors duration-300 z-10 pointer-events-none">
            {icon}
        </div>
        <input
            {...props}
            placeholder=" "
            className={`peer block w-full h-[56px] rounded-xl border border-input/60 bg-background/50 px-4 ${icon ? 'pl-11' : 'pl-4'} ${action ? 'pr-12' : ''} pt-5 pb-1 text-sm text-foreground font-medium shadow-sm transition-all duration-200 hover:bg-background hover:border-primary/30 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none placeholder-transparent ${className}`}
        />
        <label className={`absolute left-4 top-4 z-10 origin-[0] -translate-y-2.5 scale-75 transform text-[10px] font-bold uppercase tracking-wider text-muted-foreground duration-200 
            peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-xs peer-placeholder-shown:font-medium peer-placeholder-shown:normal-case
            peer-focus:-translate-y-2.5 peer-focus:scale-75 peer-focus:text-[10px] peer-focus:font-bold peer-focus:uppercase peer-focus:text-primary ${icon ? 'peer-placeholder-shown:left-11' : ''}`}>
            {label}
        </label>
        {action && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20">
                {action}
            </div>
        )}
    </div>
);

const SectionHeader: React.FC<{ title: string, subtitle: string, icon: React.ReactNode, colorClass: string }> = ({ title, subtitle, icon, colorClass }) => (
    <div className="flex items-start gap-4 mb-6">
        <div className={`p-3 rounded-2xl ${colorClass} shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/10`}>
            {icon}
        </div>
        <div>
            <h3 className="text-xl font-bold text-foreground tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground font-medium mt-0.5">{subtitle}</p>
        </div>
    </div>
);

type TabType = 'details' | 'contact' | 'academic';

interface FormProps {
    formData: Partial<SchoolAdminProfileData & { admin_contact_phone_country_code?: string; admin_contact_phone_local?: string; }>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    isInitialCreation: boolean;
    activeTab?: TabType;
    onTabChange?: (tab: TabType) => void;
}

const SchoolAdminForm: React.FC<FormProps> = ({ formData, handleChange, isInitialCreation, activeTab, onTabChange }) => {
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [internalTab, setInternalTab] = useState<TabType>('details');
    const [isResolving, setIsResolving] = useState(false);
    
    const currentTab = activeTab !== undefined ? activeTab : internalTab;
    
    const handleTabSwitch = (tab: TabType) => {
        if (onTabChange) {
            onTabChange(tab);
        } else {
            setInternalTab(tab);
        }
    };
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => setBannerPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleResolveAddress = async () => {
        if (!formData.address?.trim()) return;
        setIsResolving(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `From the street address "${formData.address}", extract or identify the city, state, and country.
            Output Strictly as valid JSON: {"city": "string", "state": "string", "country": "string"}.
            Values for country must match the closest official name from: ${countries.join(', ')}.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { tools: [{ googleMaps: {} }] }
            });

            const text = response.text || '';
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                if (data.city) handleChange({ target: { name: 'city', value: data.city } } as any);
                if (data.state) handleChange({ target: { name: 'state', value: data.state } } as any);
                if (data.country) handleChange({ target: { name: 'country', value: data.country } } as any);
            }
        } catch (err) {
            console.error("Auto-fill failed", err);
        } finally {
            setIsResolving(false);
        }
    };

    // Location Logic
    const availableStates = useMemo(() => formData.country ? statesByCountry[formData.country] || [] : [], [formData.country]);
    const availableCities = useMemo(() => formData.state ? citiesByState[formData.state] || [] : [], [formData.state]);

    const handleCountrySelect = (val: string) => {
        handleChange({ target: { name: 'country', value: val } } as any);
        handleChange({ target: { name: 'state', value: '' } } as any);
        handleChange({ target: { name: 'city', value: '' } } as any);
    };

    const handleStateSelect = (val: string) => {
        handleChange({ target: { name: 'state', value: val } } as any);
        handleChange({ target: { name: 'city', value: '' } } as any);
    };

    return (
        <div className="space-y-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-20">
            
            {/* --- HERO SECTION --- */}
            <div className="relative rounded-3xl overflow-hidden bg-card border border-border shadow-xl group">
                {/* Banner Area */}
                <div className="h-56 md:h-72 bg-muted relative group/banner">
                    {bannerPreview ? (
                         <img src={bannerPreview} alt="School Banner" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                            <div className="text-center z-10">
                                <SchoolIcon className="w-16 h-16 text-white/10 mx-auto mb-2" />
                                <p className="text-white/20 text-sm font-medium uppercase tracking-widest">Add Cover Photo</p>
                            </div>
                        </div>
                    )}
                    <div 
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover/banner:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer backdrop-blur-[2px]"
                        onClick={() => bannerInputRef.current?.click()}
                    >
                        <span className="text-white font-bold text-sm flex items-center gap-2 bg-white/20 px-6 py-3 rounded-full border border-white/30 hover:bg-white/30 transition-all transform hover:scale-105 backdrop-blur-md shadow-lg">
                            <UploadIcon className="w-4 h-4"/> Upload Banner
                        </span>
                    </div>
                    <input type="file" ref={bannerInputRef} onChange={handleBannerChange} accept="image/*" className="hidden" />

                    {/* Status Badges Overlay */}
                    <div className="absolute top-6 right-6 flex gap-3">
                         <div className="bg-black/40 backdrop-blur-md border border-white/10 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                             85% Complete
                         </div>
                         <div className="bg-white/90 backdrop-blur-md border border-white/50 text-slate-900 px-4 py-1.5 rounded-full text-xs font-bold shadow-lg uppercase tracking-wider">
                             Draft
                         </div>
                    </div>
                </div>

                {/* Identity Area */}
                <div className="px-8 md:px-12 pb-8 pt-0 relative">
                    <div className="flex flex-col md:flex-row items-start md:items-end gap-8 -mt-20">
                        {/* Logo */}
                        <div className="relative group/logo flex-shrink-0">
                            <div className={`w-40 h-40 rounded-[2rem] border-[6px] border-card shadow-2xl flex items-center justify-center overflow-hidden bg-background relative z-10 transition-transform duration-300 group-hover/logo:scale-[1.02] ${!logoPreview ? 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900' : ''}`}>
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center p-4">
                                        <SchoolIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-2" />
                                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/50">Upload Logo</span>
                                    </div>
                                )}
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity cursor-pointer backdrop-blur-[1px]"
                                >
                                    <UploadIcon className="w-8 h-8 text-white" />
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" />
                            </div>
                            <div className="absolute bottom-2 right-2 bg-blue-500 border-4 border-card w-8 h-8 rounded-full z-20 shadow-md flex items-center justify-center text-white" title="Upload Required">
                                <span className="text-xl font-bold leading-none mb-0.5">+</span>
                            </div>
                        </div>

                        {/* Title Input */}
                        <div className="flex-grow w-full pt-2 md:pb-4 space-y-1">
                            <label className="block text-[10px] font-extrabold text-muted-foreground/80 uppercase tracking-[0.2em] mb-1 pl-1">Institution Name</label>
                            <input
                                name="school_name"
                                value={formData.school_name || ''}
                                onChange={handleChange}
                                placeholder="Enter Official School Name"
                                className="w-full bg-transparent border-b-2 border-transparent hover:border-border focus:border-primary p-1 text-3xl md:text-5xl font-black text-foreground placeholder:text-muted-foreground/20 focus:ring-0 focus:outline-none transition-all font-serif tracking-tight leading-tight"
                            />
                        </div>
                    </div>
                </div>

                {/* Modern Tabs */}
                <div className="px-8 md:px-12 mt-4 bg-muted/30 border-t border-border/60">
                    <div className="flex overflow-x-auto scrollbar-hide gap-8">
                        {[
                            { id: 'details', label: 'Institution Details', icon: <SchoolIcon className="w-4 h-4"/> },
                            { id: 'contact', label: 'Contact Info', icon: <UsersIcon className="w-4 h-4"/> },
                            { id: 'academic', label: 'Academic Settings', icon: <DocumentTextIcon className="w-4 h-4"/> },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleTabSwitch(tab.id as TabType)}
                                className={`
                                    flex items-center gap-2.5 py-5 text-sm font-bold border-b-[3px] transition-all whitespace-nowrap
                                    ${currentTab === tab.id 
                                        ? 'border-primary text-primary' 
                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                                    }
                                `}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- FORM CONTENT --- */}
            <div className="pt-2">
                
                {currentTab === 'details' && (
                    <div className="bg-card rounded-3xl border border-border/60 shadow-sm p-8 md:p-10 animate-in fade-in slide-in-from-right-4 duration-500">
                        <SectionHeader 
                            title="Location & Headquarters" 
                            subtitle="Set the official address for correspondence and mapping." 
                            icon={<LocationIcon className="w-6 h-6 text-blue-600 dark:text-blue-400"/>}
                            colorClass="bg-blue-50 dark:bg-blue-900/20"
                        />
                        
                        <div className="space-y-6 max-w-4xl">
                            <PremiumInput 
                                label="Street Address" 
                                name="address" 
                                value={formData.address || ''} 
                                onChange={handleChange} 
                                required 
                                icon={<LocationIcon className="w-5 h-5"/>}
                                fullWidth
                                action={
                                    <button 
                                        type="button" 
                                        onClick={handleResolveAddress}
                                        disabled={isResolving || !formData.address?.trim()}
                                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all disabled:opacity-30 disabled:grayscale"
                                        title="Auto-fill Location"
                                    >
                                        {isResolving ? <Spinner size="sm" /> : <SparklesIcon className="w-5 h-5" />}
                                    </button>
                                }
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <CustomSelect 
                                    label="Country" 
                                    placeholder="Select Country"
                                    options={countries.map(c => ({ label: c, value: c }))} 
                                    value={formData.country || 'India'} 
                                    onChange={handleCountrySelect}
                                    icon={<GlobeIcon className="w-4 h-4"/>}
                                    searchable
                                />
                                <CustomSelect 
                                    label="State" 
                                    placeholder="Select State"
                                    options={availableStates.map(s => ({ label: s, value: s }))} 
                                    value={formData.state || ''} 
                                    onChange={handleStateSelect}
                                    disabled={!formData.country}
                                    icon={<LocationIcon className="w-4 h-4"/>}
                                    searchable
                                />
                                <CustomSelect 
                                    label="City" 
                                    placeholder="Select City"
                                    options={availableCities.map(c => ({ label: c, value: c }))} 
                                    value={formData.city || ''} 
                                    onChange={(val) => handleChange({ target: { name: 'city', value: val } } as any)}
                                    disabled={!formData.state}
                                    icon={<LocationIcon className="w-4 h-4"/>}
                                    searchable
                                />
                            </div>
                        </div>
                    </div>
                )}

                {currentTab === 'contact' && (
                    <div className="bg-card rounded-3xl border border-border/60 shadow-sm p-8 md:p-10 animate-in fade-in slide-in-from-right-4 duration-500">
                        <SectionHeader 
                            title="Primary Administrator" 
                            subtitle="Main contact for technical and administrative issues." 
                            icon={<UsersIcon className="w-6 h-6 text-purple-600 dark:text-purple-400"/>}
                            colorClass="bg-purple-50 dark:bg-purple-900/20"
                        />

                         {isInitialCreation && (
                            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 mb-8 flex items-start gap-4">
                                <CheckCircleIcon className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-foreground">Pre-filled Information</p>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">We've automatically populated these fields using your account details. Please review them for accuracy.</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                            <PremiumInput 
                                label="Full Name" 
                                name="admin_contact_name" 
                                value={formData.admin_contact_name || ''} 
                                onChange={handleChange} 
                                required 
                                icon={<UsersIcon className="w-5 h-5"/>} 
                            />
                            
                            <PremiumInput 
                                label="Designation" 
                                name="admin_designation" 
                                value={formData.admin_designation || ''} 
                                onChange={handleChange} 
                                required 
                                placeholder="e.g. Principal"
                                icon={<CheckCircleIcon className="w-5 h-5"/>} 
                            />
                            
                            <div className="md:col-span-2">
                                <PremiumInput 
                                    label="Official Email" 
                                    type="email"
                                    name="admin_contact_email" 
                                    value={formData.admin_contact_email || ''} 
                                    onChange={handleChange} 
                                    required 
                                    icon={<MailIcon className="w-5 h-5"/>} 
                                />
                            </div>

                            <div className="flex gap-4 md:col-span-2">
                                <div className="w-[160px]">
                                     <CustomSelect
                                        label="Code"
                                        placeholder="+91"
                                        options={countryCodes.map(c => ({ value: c.dial_code, label: `${c.code} ${c.dial_code}` }))}
                                        value={formData.admin_contact_phone_country_code || '+91'}
                                        onChange={(val) => handleChange({ target: { name: 'admin_contact_phone_country_code', value: val } } as any)}
                                        icon={<PhoneIcon className="w-4 h-4"/>}
                                        searchable
                                    />
                                </div>
                                <div className="flex-grow">
                                    <PremiumInput 
                                        label="Phone Number" 
                                        type="tel"
                                        name="admin_contact_phone_local" 
                                        value={formData.admin_contact_phone_local || ''} 
                                        onChange={handleChange} 
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentTab === 'academic' && (
                     <div className="bg-card rounded-3xl border border-border/60 shadow-sm p-8 md:p-10 animate-in fade-in slide-in-from-right-4 duration-500">
                         <SectionHeader 
                            title="Academic Configuration" 
                            subtitle="Set up boards, affiliation, and grade structures." 
                            icon={<DocumentTextIcon className="w-6 h-6 text-amber-600 dark:text-amber-400"/>}
                            colorClass="bg-amber-50 dark:bg-amber-900/20"
                        />
                        
                        <div className="space-y-8 max-w-4xl">
                            {/* Board & Affiliation */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <CustomSelect
                                    label="Education Board"
                                    placeholder="Select Board"
                                    options={[
                                        { value: 'CBSE', label: 'CBSE (Central Board)' },
                                        { value: 'ICSE', label: 'ICSE (Indian Certificate)' },
                                        { value: 'IB', label: 'IB (International Baccalaureate)' },
                                        { value: 'IGCSE', label: 'Cambridge (IGCSE)' },
                                        { value: 'State Board', label: 'State Board' },
                                        { value: 'Other', label: 'Other' },
                                    ]}
                                    value={formData.academic_board || ''}
                                    onChange={(val) => handleChange({ target: { name: 'academic_board', value: val } } as any)}
                                    icon={<BookIcon className="w-4 h-4" />}
                                    required
                                    searchable
                                />
                                
                                <PremiumInput 
                                    label="Affiliation / School Code" 
                                    name="affiliation_number" 
                                    value={formData.affiliation_number || ''} 
                                    onChange={handleChange} 
                                    placeholder="e.g. 830012"
                                    icon={<HashIcon className="w-5 h-5"/>} 
                                />
                            </div>

                            <div className="h-px bg-border/50 w-full"></div>

                            {/* School Type & Session */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                 <CustomSelect
                                    label="Institution Type"
                                    placeholder="Select Type"
                                    options={[
                                        { value: 'Co-Educational', label: 'Co-Educational' },
                                        { value: 'Boys', label: 'Boys School' },
                                        { value: 'Girls', label: 'Girls School' },
                                    ]}
                                    value={formData.school_type || ''}
                                    onChange={(val) => handleChange({ target: { name: 'school_type', value: val } } as any)}
                                    icon={<UsersIcon className="w-4 h-4" />}
                                />

                                <div className="md:col-span-2 grid grid-cols-2 gap-5">
                                     <CustomSelect
                                        label="Academic Year Start"
                                        placeholder="Start Month"
                                        options={MONTHS}
                                        value={formData.academic_year_start || ''}
                                        onChange={(val) => handleChange({ target: { name: 'academic_year_start', value: val } } as any)}
                                        icon={<CalendarIcon className="w-4 h-4" />}
                                        searchable
                                    />
                                     <CustomSelect
                                        label="Academic Year End"
                                        placeholder="End Month"
                                        options={MONTHS}
                                        value={formData.academic_year_end || ''}
                                        onChange={(val) => handleChange({ target: { name: 'academic_year_end', value: val } } as any)}
                                        icon={<CalendarIcon className="w-4 h-4" />}
                                        searchable
                                    />
                                </div>
                            </div>

                            {/* Grades */}
                            <div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
                                <h4 className="text-xs font-extrabold text-foreground mb-6 flex items-center gap-2 uppercase tracking-widest">
                                    <LayersIcon className="w-4 h-4 text-primary" /> Grade Levels Offered
                                </h4>
                                <div className="grid grid-cols-2 gap-8">
                                     <CustomSelect
                                        label="Lowest Grade"
                                        placeholder="Start Grade"
                                        options={GRADES}
                                        value={formData.grade_range_start || ''}
                                        onChange={(val) => handleChange({ target: { name: 'grade_range_start', value: val } } as any)}
                                        searchable
                                    />
                                     <CustomSelect
                                        label="Highest Grade"
                                        placeholder="End Grade"
                                        options={GRADES}
                                        value={formData.grade_range_end || ''}
                                        onChange={(val) => handleChange({ target: { name: 'grade_range_end', value: val } } as any)}
                                        searchable
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SchoolAdminForm;
