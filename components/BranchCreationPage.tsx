import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../services/supabase';
import { SchoolBranch, UserProfile, SchoolAdminProfileData, BuiltInRoles } from '../types';
import Spinner from './common/Spinner';
import { SchoolIcon } from './icons/SchoolIcon';
import { PlusIcon } from './icons/PlusIcon';
import { EditIcon } from './icons/EditIcon';
import { XIcon } from './icons/XIcon';
import { UsersIcon } from './icons/UsersIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { MailIcon } from './icons/MailIcon';
import ConfirmationModal from './common/ConfirmationModal';
import { countries, statesByCountry, citiesByState } from './data/locations';
import { LocationIcon } from './icons/LocationIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { GoogleGenAI } from '@google/genai';

interface BranchCreationPageProps {
    onNext?: () => void;
    profile?: UserProfile;
    onBack?: () => void;
}

const formatError = (err: any): string => {
    if (!err) return "An unknown error occurred.";
    if (typeof err === 'string') return err;
    const message = err.message || err.error_description || err.details || err.hint;
    if (message && typeof message === 'string') return message;
    return "An unexpected system error occurred.";
};

const FloatingLabelInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string, icon?: React.ReactNode, action?: React.ReactNode }> = ({ label, icon, action, className, ...props }) => (
    <div className="relative group">
        <div className="absolute top-1/2 -translate-y-1/2 left-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-200 z-10 pointer-events-none">
            {icon}
        </div>
        <input
            {...props}
            placeholder=" "
            className={`peer block w-full rounded-xl border border-input bg-background px-4 py-3.5 pl-11 ${action ? 'pr-12' : ''} text-sm text-foreground shadow-sm transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none placeholder-transparent ${className}`}
        />
        <label className="absolute left-11 top-0 -translate-y-1/2 bg-card/95 px-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 transition-all duration-200 
            peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-placeholder-shown:normal-case peer-placeholder-shown:text-muted-foreground/60
            peer-focus:top-0 peer-focus:text-[10px] peer-focus:font-bold peer-focus:uppercase peer-focus:text-primary pointer-events-none">
            {label}
        </label>
        {action && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20">
                {action}
            </div>
        )}
    </div>
);

const StyledSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, icon?: React.ReactNode }> = ({ label, icon, children, className, ...props }) => (
    <div className="relative group">
        <div className="absolute top-1/2 -translate-y-1/2 left-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-200 z-10 pointer-events-none">
            {icon}
        </div>
        <select
            {...props}
            className={`peer block w-full appearance-none rounded-xl border border-input bg-background px-4 py-3.5 pl-11 text-sm text-foreground shadow-sm transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none cursor-pointer ${className}`}
        >
            {children}
        </select>
        <label className="absolute left-11 top-0 -translate-y-1/2 bg-card/95 px-1.5 text-[10px] font-bold uppercase tracking-wider text-primary transition-all duration-200 pointer-events-none">
            {label}
        </label>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-foreground transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
    </div>
);

export const BranchCreationPage: React.FC<BranchCreationPageProps> = ({ onNext, profile, onBack }) => {
    const [branches, setBranches] = useState<SchoolBranch[]>([]);
    const [schoolData, setSchoolData] = useState<SchoolAdminProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<SchoolBranch | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isResolvingAddress, setIsResolvingAddress] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [deletingBranch, setDeletingBranch] = useState<SchoolBranch | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isFinishing, setIsFinishing] = useState(false);
    
    const isMounted = useRef(true);

    const [formData, setFormData] = useState({
        name: '', address: '', country: 'India', city: '', state: '', 
        adminName: '', adminPhone: '', adminEmail: '', isMain: false
    });

    const isHeadOfficeAdmin = useMemo(() => {
        return profile?.role === BuiltInRoles.SCHOOL_ADMINISTRATION;
    }, [profile]);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    const handleBranchUpdate = (updatedBranch: SchoolBranch, isDelete: boolean = false) => {
        if (!isMounted.current) return;
        if (isDelete) {
            setBranches(prev => prev.filter(b => b.id !== updatedBranch.id));
        } else {
            setBranches(prev => {
                const exists = prev.some(b => b.id === updatedBranch.id);
                const newBranches = exists
                    ? prev.map(b => (b.id === updatedBranch.id ? updatedBranch : b))
                    : [...prev, updatedBranch];
                return newBranches.sort((a,b) => (b.is_main_branch ? 1 : 0) - (a.is_main_branch ? 1 : 0));
            });
        }
    };

    const fetchInitialData = useCallback(async (isUpdate = false) => {
        if (!isMounted.current) return;
        if (!isUpdate) setLoading(true);
        setError(null);
        try {
            const [branchRes, schoolRes] = await Promise.all([
                supabase.rpc('get_school_branches'),
                profile?.id ? supabase.from('school_admin_profiles').select('*').eq('user_id', profile.id).maybeSingle() : Promise.resolve({ data: null, error: null })
            ]);

            if (branchRes.error) throw branchRes.error;
            if (schoolRes.error && schoolRes.error.code !== 'PGRST116') throw schoolRes.error;

            if (isMounted.current) {
                const currentBranches = (branchRes.data || []).sort((a: SchoolBranch, b: SchoolBranch) => (b.is_main_branch ? 1 : 0) - (a.is_main_branch ? 1 : 0));
                setBranches(currentBranches);
                if(schoolRes.data) setSchoolData(schoolRes.data);
            }
        } catch (err: any) {
            if (isMounted.current) setError(formatError(err));
        } finally {
            if (isMounted.current && !isUpdate) setLoading(false);
        }
    }, [profile?.id]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleOpenCreate = (currentSchoolData: SchoolAdminProfileData | null = schoolData) => {
        if (!isMounted.current) return;
        setEditingBranch(null);
        const isHeadOffice = branches.length === 0;
        setFormData({
            name: (isHeadOffice && currentSchoolData?.school_name) || '',
            address: (isHeadOffice && currentSchoolData?.address) || '',
            country: (isHeadOffice && currentSchoolData?.country) || 'India',
            state: (isHeadOffice && currentSchoolData?.state) || '',
            city: (isHeadOffice && currentSchoolData?.city) || '',
            adminName: (isHeadOffice && currentSchoolData?.admin_contact_name) || '',
            adminPhone: (isHeadOffice && currentSchoolData?.admin_contact_phone) || '',
            adminEmail: (isHeadOffice && currentSchoolData?.admin_contact_email) || '',
            isMain: isHeadOffice
        });
        setModalError(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (branch: SchoolBranch) => {
        if (!isMounted.current) return;
        setEditingBranch(branch);
        setFormData({
            name: branch.name, address: branch.address, country: branch.country || 'India', state: branch.state || '', city: branch.city || '',
            adminName: branch.admin_name || '', adminPhone: branch.admin_phone || '', adminEmail: branch.admin_email || '', isMain: branch.is_main_branch
        });
        setModalError(null);
        setIsModalOpen(true);
    };

    const handleResolveAddress = async () => {
        if (!formData.address.trim()) return;
        setIsResolvingAddress(true);
        setModalError(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Based on the street address "${formData.address}", identify the city, state, and country.
            Output ONLY strictly as a valid JSON object: {"city": "string", "state": "string", "country": "string"}.
            Important: The "country" must match one of these: ${countries.join(', ')}. The "state" must match a valid state in that country.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    tools: [{ googleMaps: {} }]
                }
            });

            const text = response.text || '';
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                setFormData(prev => ({
                    ...prev,
                    city: data.city || prev.city,
                    state: data.state || prev.state,
                    country: data.country || prev.country
                }));
            }
        } catch (err) {
            console.error("Address auto-fill error:", err);
            setModalError("Unable to auto-fill address details. Please enter manually.");
        } finally {
            setIsResolvingAddress(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setModalError(null);
        try {
            const payload = {
                p_name: formData.name, 
                p_address: formData.address, 
                p_city: formData.city, 
                p_state: formData.state,
                p_country: formData.country,
                p_contact_number: " ", 
                p_is_main: formData.isMain, 
                p_email: formData.adminEmail, 
                p_admin_name: formData.adminName, 
                p_admin_phone: formData.adminPhone, 
                p_admin_email: formData.adminEmail
            };

            if (editingBranch) {
                const { data, error } = await supabase.rpc('update_school_branch', { ...payload, p_branch_id: editingBranch.id });
                if (error) throw error;
                if (isMounted.current) handleBranchUpdate(data[0]);
            } else {
                const { data, error } = await supabase.rpc('create_school_branch', payload);
                if (error) throw error;
                if (isMounted.current) handleBranchUpdate(data[0]);
            }
            if (isMounted.current) setIsModalOpen(false);
        } catch (err: any) {
            if (isMounted.current) setModalError(formatError(err));
        } finally {
            if (isMounted.current) setIsSaving(false);
        }
    };
    
    const handleDelete = async () => {
        if (!deletingBranch) return;
        setIsDeleting(true);
        const { error } = await supabase.rpc('delete_school_branch', { p_branch_id: deletingBranch.id });
        
        if (isMounted.current) {
            if (error) {
                alert(`Failed to delete: ${formatError(error)}`);
            } else {
                handleBranchUpdate(deletingBranch, true);
            }
            setIsDeleting(false);
            setDeletingBranch(null);
        }
    };

    const handleFinish = () => {
        if (isFinishing || !onNext) return;
        setIsFinishing(true);
        onNext();
    };

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, country: e.target.value, state: '', city: '' });
    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, state: e.target.value, city: '' });
    const availableStates = useMemo(() => formData.country ? statesByCountry[formData.country] || [] : [], [formData.country]);
    const availableCities = useMemo(() => formData.state ? citiesByState[formData.state] || [] : [], [formData.state]);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center max-w-2xl mx-auto mb-10">
                <h1 className="text-4xl font-serif font-extrabold text-foreground tracking-tight">Set Up Your Branches</h1>
                <p className="text-muted-foreground mt-3 text-lg leading-relaxed">
                    Start by defining your Head Office, then add any additional satellite campuses to your network.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 bg-card p-4 rounded-xl border border-border shadow-sm">
                <div>
                    {onBack && (
                        <button
                            onClick={onBack}
                            disabled={isFinishing}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            <ChevronLeftIcon className="w-4 h-4" />
                            Back to Pricing
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => handleOpenCreate()} 
                        disabled={loading} 
                        className="px-5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-bold rounded-lg transition-all flex items-center gap-2 border border-primary/20 shadow-sm"
                    >
                        <PlusIcon className="w-4 h-4" /> Add Branch
                    </button>
                    {onNext && branches.length > 0 && (
                        <button 
                            onClick={handleFinish} 
                            disabled={isFinishing} 
                            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all hover:bg-primary/90 shadow-md min-w-[180px] justify-center"
                        >
                            {isFinishing ? <><Spinner size="sm" className="text-current" /> Finalizing...</> : <>Complete Setup & Continue &rarr;</>}
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-20"><Spinner size="lg" /></div>
            ) : error ? (
                <div className="p-6 bg-destructive/10 text-destructive rounded-xl text-center font-medium">{error}</div>
            ) : branches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/30 border-2 border-dashed border-border rounded-2xl text-center hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => handleOpenCreate()}>
                    <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mb-6 shadow-sm border border-border group-hover:scale-110 transition-transform duration-300">
                        <SchoolIcon className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Welcome to Branch Setup</h3>
                    <p className="text-muted-foreground mt-2 max-sm mx-auto">
                        You haven't added any branches yet. Let's start by establishing your <strong>Head Office</strong>.
                    </p>
                    <button className="mt-8 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all">
                        Create Head Office
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {branches.map(branch => (
                        <div 
                            key={branch.id} 
                            className="group relative bg-card border border-border hover:border-primary/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${branch.is_main_branch ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                    <SchoolIcon className="w-6 h-6"/>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenEdit(branch)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"><EditIcon className="w-4 h-4"/></button>
                                    {!branch.is_main_branch && (
                                        <button onClick={() => setDeletingBranch(branch)} className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"><XIcon className="w-4 h-4"/></button>
                                    )}
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-bold text-foreground truncate mb-1">{branch.name}</h3>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                                <LocationIcon className="w-3.5 h-3.5"/>
                                <span className="truncate">{[branch.city, branch.state, branch.country].filter(Boolean).join(', ')}</span>
                            </div>

                            {branch.is_main_branch ? (
                                <span className="inline-flex self-start items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">
                                    <CheckCircleIcon className="w-3 h-3"/> Head Office
                                </span>
                            ) : (
                                <span className="inline-flex self-start items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider border border-border">
                                    Satellite Branch
                                </span>
                            )}

                            <div className="mt-auto pt-5 border-t border-border flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                    {branch.admin_name ? branch.admin_name.charAt(0) : '?'}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-xs font-bold text-foreground truncate">{branch.admin_name || 'No Admin Assigned'}</p>
                                    <p className="text-xs text-muted-foreground truncate">{branch.admin_email || '—'}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {/* Add New Card */}
                    <button 
                        onClick={() => handleOpenCreate()}
                        className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all group min-h-[200px]"
                    >
                        <div className="w-12 h-12 rounded-full bg-muted group-hover:bg-background flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors mb-3 shadow-sm group-hover:shadow-md border border-border group-hover:border-primary/20">
                            <PlusIcon className="w-6 h-6 transform group-hover:rotate-90 transition-transform duration-300"/>
                        </div>
                        <span className="font-bold text-foreground">Add Another Branch</span>
                    </button>
                </div>
            )}

            {isModalOpen && (
                 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-card w-full max-w-3xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-muted/30">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">
                                    {editingBranch ? 'Edit Branch Details' : (branches.length === 0 ? 'Create Head Office' : 'Add New Branch')}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">Please provide the campus and administrator details.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                <XIcon className="w-5 h-5"/>
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex flex-col flex-grow overflow-hidden">
                            <div className="flex-grow overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                {modalError && (
                                    <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-sm font-medium border border-destructive/20 flex items-center gap-3">
                                        <XIcon className="w-5 h-5"/> {modalError}
                                    </div>
                                )}
                                
                                {/* Section 1: Campus Details */}
                                <div className="space-y-5">
                                     <div className="flex items-center gap-2 mb-2">
                                         <SchoolIcon className="w-5 h-5 text-primary" />
                                         <h4 className="text-sm font-bold uppercase text-foreground tracking-wide">Campus Information</h4>
                                     </div>
                                     
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="md:col-span-2">
                                            <FloatingLabelInput 
                                                label="Branch Name" 
                                                value={formData.name} 
                                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                                required 
                                                icon={<SchoolIcon className="w-4 h-4"/>} 
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <FloatingLabelInput 
                                                label="Street Address" 
                                                value={formData.address} 
                                                onChange={e => setFormData({...formData, address: e.target.value})} 
                                                required 
                                                icon={<LocationIcon className="w-4 h-4"/>}
                                                action={
                                                    <button 
                                                        type="button"
                                                        onClick={handleResolveAddress}
                                                        disabled={isResolvingAddress || !formData.address.trim()}
                                                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-30 disabled:grayscale"
                                                        title="Auto-fill city, state, country"
                                                    >
                                                        {isResolvingAddress ? <Spinner size="sm" /> : <SparklesIcon className="w-5 h-5" />}
                                                    </button>
                                                }
                                            />
                                        </div>
                                        
                                        <StyledSelect label="Country" required value={formData.country} onChange={handleCountryChange} icon={<GlobeIcon className="w-4 h-4"/>}>
                                            {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                        </StyledSelect>
                                        
                                        <StyledSelect label="State/Province" required value={formData.state} onChange={handleStateChange} disabled={!formData.country} icon={<LocationIcon className="w-4 h-4"/>}>
                                            <option value="">Select State</option>
                                            {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
                                        </StyledSelect>
                                        
                                        {availableCities.length > 0 ? (
                                            <StyledSelect className="md:col-span-2" label="City" required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} disabled={!formData.state} icon={<LocationIcon className="w-4 h-4"/>}>
                                                <option value="">Select City</option>
                                                {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                                            </StyledSelect>
                                        ) : (
                                            <FloatingLabelInput className="md:col-span-2" label="City" required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} disabled={!formData.state} icon={<LocationIcon className="w-4 h-4"/>} />
                                        )}
                                     </div>
                                </div>

                                <div className="h-px bg-border/50 w-full"></div>

                                {/* Section 2: Administrator Details */}
                                <div className="space-y-5">
                                    <div className="flex items-center gap-2 mb-2">
                                         <UsersIcon className="w-5 h-5 text-primary" />
                                         <h4 className="text-sm font-bold uppercase text-foreground tracking-wide">IT Administrator Credentials</h4>
                                     </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FloatingLabelInput label="Admin Name" value={formData.adminName} onChange={e => setFormData({...formData, adminName: e.target.value})} icon={<UsersIcon className="w-4 h-4"/>} />
                                        <FloatingLabelInput label="Admin Phone" type="tel" value={formData.adminPhone} onChange={e => setFormData({...formData, adminPhone: e.target.value})} icon={<PhoneIcon className="w-4 h-4"/>} />
                                        <div className="md:col-span-2"><FloatingLabelInput label="Login Email" type="email" required value={formData.adminEmail} onChange={e => setFormData({...formData, adminEmail: e.target.value})} icon={<MailIcon className="w-4 h-4"/>} /></div>
                                    </div>
                                </div>

                                {isHeadOfficeAdmin && (
                                    <div 
                                        className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${formData.isMain ? 'bg-primary/5 border-primary/30' : 'bg-muted/30 border-border hover:border-primary/30'}`} 
                                        onClick={() => setFormData({...formData, isMain: !formData.isMain})}
                                    >
                                        <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.isMain ? 'bg-primary border-primary' : 'bg-background border-muted-foreground'}`}>
                                            {formData.isMain && <CheckCircleIcon className="w-3.5 h-3.5 text-primary-foreground"/>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-foreground">Set as Head Office</p>
                                            <p className="text-xs text-muted-foreground mt-1">This branch will be the primary headquarters for your institution.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-border bg-muted/20 flex justify-end gap-4 flex-shrink-0">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold">Cancel</button>
                                <button type="submit" disabled={isSaving} className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 flex items-center min-w-[140px] justify-center">
                                    {isSaving ? <Spinner size="sm" /> : (editingBranch ? 'Update' : 'Add Branch')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            <ConfirmationModal 
                isOpen={!!deletingBranch} 
                onClose={() => setDeletingBranch(null)} 
                onConfirm={handleDelete} 
                title="Delete Branch" 
                message={`Are you sure you want to permanently delete the "${deletingBranch?.name}" branch? This action cannot be undone.`} 
                confirmText="Yes, Delete Branch" 
                loading={isDeleting} 
            />
        </div>
    );
};
