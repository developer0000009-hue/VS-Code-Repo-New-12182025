
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { SchoolClass } from '../../types';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { BookIcon } from '../icons/BookIcon';
import { DollarSignIcon } from '../icons/DollarSignIcon';
import { GridIcon } from '../icons/GridIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';

interface FeeMasterWizardProps {
    onClose: () => void;
    onSuccess: () => void;
    branchId: number | null;
}

const FREQUENCIES = ['One-time', 'Monthly', 'Quarterly', 'Annually'];

const formatError = (err: any): string => {
    if (!err) return "An unknown error occurred.";
    
    // Convert object errors to string for analysis
    const strErr = JSON.stringify(err);
    
    // Catch Supabase Schema Cache issues
    if (strErr.includes("Could not find the") && strErr.includes("column")) {
        return "Database Schema Mismatch: The 'currency' column is missing. Please run the migration script in 'schema.txt' to update your database.";
    }

    if (typeof err === 'string') return err;
    
    // Prioritize standard error fields
    const message = err.message || err.error_description || err.details || err.hint;
    if (message && typeof message === 'string') return message;
    
    // Fallback to JSON string if it's a readable object, otherwise default text
    if (strErr && strErr !== '{}' && strErr !== '[]') return `System Error: ${strErr.substring(0, 100)}...`;
    
    return "Failed to synchronize with institutional data servers.";
};

const formatCurrency = (amount: number, currency: 'INR' | 'USD' = 'INR') => {
    return new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: currency,
        minimumFractionDigits: 0
    }).format(amount || 0);
};

const FeeMasterWizard: React.FC<FeeMasterWizardProps> = ({ onClose, onSuccess, branchId }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Step 1: Definition
    const [formData, setFormData] = useState({
        name: '',
        academicYear: '2025-2026',
        targetGrade: '1',
        description: '',
        currency: 'INR' as 'INR' | 'USD'
    });

    // Step 2: Components
    const [components, setComponents] = useState<{ name: string; amount: number; frequency: string; is_mandatory: boolean }[]>([
        { name: 'Tuition Fees', amount: 0, frequency: 'Monthly', is_mandatory: true }
    ]);

    // Step 3: Mapping Preview
    const [availableClasses, setAvailableClasses] = useState<SchoolClass[]>([]);
    const [loadingClasses, setLoadingClasses] = useState(false);

    useEffect(() => {
        if (step === 3) {
            const fetchClasses = async () => {
                setLoadingClasses(true);
                // Ensure we filter by branchId if available to show relevant classes
                let query = supabase.from('school_classes').select('*').eq('grade_level', formData.targetGrade);
                if (branchId) {
                    query = query.eq('branch_id', branchId);
                }
                const { data } = await query;
                if (data) setAvailableClasses(data);
                setLoadingClasses(false);
            };
            fetchClasses();
        }
    }, [step, formData.targetGrade, branchId]);

    const handleAddComponent = () => {
        setComponents([...components, { name: '', amount: 0, frequency: 'Monthly', is_mandatory: false }]);
    };

    const handleRemoveComponent = (index: number) => {
        if (components.length === 1) return;
        setComponents(components.filter((_, i) => i !== index));
    };

    const updateComponent = (index: number, field: string, value: any) => {
        const newComponents = [...components];
        (newComponents[index] as any)[field] = value;
        setComponents(newComponents);
    };

    const totalYearlyAmount = useMemo(() => {
        return components.reduce((acc, c) => {
            const amount = Number(c.amount) || 0;
            let multiplier = 1;
            if (c.frequency === 'Monthly') multiplier = 12;
            else if (c.frequency === 'Quarterly') multiplier = 4;
            return acc + (amount * multiplier);
        }, 0);
    }, [components]);

    const handleFinalize = async (publish: boolean = false) => {
        setLoading(true);
        setError(null);

        // Validation Checks
        if (!branchId) {
            setError("Critical Error: No active branch selected. Please select a branch from the dashboard.");
            setLoading(false);
            return;
        }
        if (!formData.name.trim()) {
            setError("Validation Error: Fee Structure Name is required.");
            setLoading(false);
            return;
        }
        if (components.length === 0) {
            setError("Validation Error: At least one fee component is required.");
            setLoading(false);
            return;
        }

        try {
            // 1. Create Structure Record
            const { data: struct, error: structError } = await supabase
                .from('fee_structures')
                .insert({
                    name: formData.name,
                    academic_year: formData.academicYear,
                    target_grade: formData.targetGrade,
                    description: formData.description,
                    currency: formData.currency,
                    status: publish ? 'Active' : 'Draft',
                    is_active: publish,
                    branch_id: branchId
                })
                .select()
                .single();

            if (structError) throw structError;

            // 2. Batch Create Components
            const componentsPayload = components.map(c => ({
                structure_id: struct.id,
                name: c.name || 'Miscellaneous Fee',
                amount: c.amount || 0,
                frequency: c.frequency,
                is_mandatory: c.is_mandatory
            }));

            const { error: compError } = await supabase.from('fee_components').insert(componentsPayload);
            if (compError) throw compError;

            // 3. Log Audit
            await supabase.from('fee_audit_logs').insert({
                structure_id: struct.id,
                action: publish ? 'PUBLISH' : 'CREATE',
                details: { ...formData, total_yearly: totalYearlyAmount }
            });

            onSuccess();
        } catch (err: any) {
            console.error("Master Draft Error:", err);
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-background w-full max-w-3xl rounded-[2.5rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden max-h-[95vh] ring-1 ring-black/5" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-8 border-b border-border bg-card/50 flex justify-between items-center relative z-20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
                            <BookIcon className="w-8 h-8"/>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-foreground tracking-tight">Fee Master Architect</h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Cycle Definition • Step {step} of 4</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-full hover:bg-muted text-muted-foreground transition-all">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar p-10 bg-background">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
                             <AlertTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                             <div>
                                 <p className="text-sm font-bold text-red-600">System Alert</p>
                                 <p className="text-xs text-red-500 mt-1 leading-relaxed">{error}</p>
                             </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                            <div>
                                <h4 className="text-3xl font-black text-foreground tracking-tight">Global Parameters</h4>
                                <p className="text-sm text-muted-foreground mt-1">Set the identity and monetary standard for this fee cycle.</p>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 block mb-2">Structure Label</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Grade 10 - Standard Academic Cycle" 
                                        className="w-full bg-muted/30 border border-border rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 block mb-2">Base Currency</label>
                                        <div className="grid grid-cols-2 gap-2 p-1.5 bg-muted/30 border border-border rounded-2xl">
                                            <button 
                                                type="button"
                                                onClick={() => setFormData({...formData, currency: 'INR'})}
                                                className={`py-3 rounded-xl text-xs font-black transition-all ${formData.currency === 'INR' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                INR (₹)
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setFormData({...formData, currency: 'USD'})}
                                                className={`py-3 rounded-xl text-xs font-black transition-all ${formData.currency === 'USD' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                USD ($)
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 block mb-2">Target Grade</label>
                                        <select 
                                            className="w-full h-[58px] bg-muted/30 border border-border rounded-2xl px-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none cursor-pointer appearance-none"
                                            value={formData.targetGrade}
                                            onChange={e => setFormData({...formData, targetGrade: e.target.value})}
                                        >
                                            {Array.from({length: 12}, (_, i) => i + 1).map(g => (
                                                <option key={g} value={String(g)}>Grade {g}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 block mb-2">Cycle Description</label>
                                    <textarea 
                                        placeholder="Internal notes regarding concessions or scholarship logic..." 
                                        className="w-full bg-muted/30 border border-border rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 outline-none h-28 resize-none shadow-inner"
                                        value={formData.description}
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                             <div className="flex justify-between items-end">
                                <div>
                                    <h4 className="text-3xl font-black text-foreground tracking-tight">Ledger Builder ({formData.currency})</h4>
                                    <p className="text-sm text-muted-foreground mt-1">Define specific billable items and their frequencies.</p>
                                </div>
                                <button 
                                    onClick={handleAddComponent}
                                    className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                                >
                                    <PlusIcon className="w-4 h-4"/> Add Item
                                </button>
                            </div>

                            <div className="space-y-4">
                                {components.map((comp, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-6 bg-card border border-border rounded-3xl group shadow-sm hover:border-primary/40 transition-all animate-in fade-in">
                                        <div className="flex-grow">
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Activity Fees" 
                                                className="w-full bg-transparent border-none p-0 text-base font-black focus:ring-0 placeholder:text-muted-foreground/30"
                                                value={comp.name}
                                                onChange={e => updateComponent(idx, 'name', e.target.value)}
                                            />
                                            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mt-1">Ledger Item Name</p>
                                        </div>
                                        <div className="w-36">
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground">{formData.currency === 'INR' ? '₹' : '$'}</span>
                                                <input 
                                                    type="number" 
                                                    className="w-full bg-muted/40 border border-border rounded-xl p-3 pl-8 text-sm font-mono font-black text-right"
                                                    value={comp.amount}
                                                    onChange={e => updateComponent(idx, 'amount', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="w-36">
                                            <select 
                                                className="w-full bg-muted/40 border border-border rounded-xl p-3 text-[10px] font-black uppercase tracking-widest appearance-none cursor-pointer text-center"
                                                value={comp.frequency}
                                                onChange={e => updateComponent(idx, 'frequency', e.target.value)}
                                            >
                                                {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                                            </select>
                                        </div>
                                        <button 
                                            onClick={() => handleRemoveComponent(idx)}
                                            className="p-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <TrashIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="p-8 bg-primary/5 border-2 border-dashed border-primary/20 rounded-[2.5rem] flex justify-between items-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03]"><TrendingUpIcon className="w-32 h-32" /></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Projected Yearly Revenue/Liability</p>
                                    <p className="text-sm text-primary font-medium mt-1">Summation based on chosen frequencies.</p>
                                </div>
                                <span className="text-4xl font-black text-primary font-mono">{formatCurrency(totalYearlyAmount, formData.currency)}</span>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                             <div>
                                <h4 className="text-3xl font-black text-foreground tracking-tight">Institutional Scope</h4>
                                <p className="text-sm text-muted-foreground mt-1">Verify existing academic groups for Grade {formData.targetGrade}.</p>
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                {loadingClasses ? <div className="col-span-full py-20 flex justify-center"><Spinner size="lg"/></div> : (
                                    availableClasses.length === 0 ? (
                                        <p className="col-span-full text-center py-20 text-muted-foreground italic border-2 border-dashed border-border rounded-3xl">No class groups found for Grade {formData.targetGrade} in this branch.</p>
                                    ) : (
                                        availableClasses.map(cls => (
                                            <div key={cls.id} className="p-6 rounded-[2rem] bg-card border border-border flex items-center gap-4 shadow-sm group hover:border-primary/30 transition-all">
                                                <div className="p-4 bg-muted rounded-2xl text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    <GridIcon className="w-6 h-6"/>
                                                </div>
                                                <div>
                                                    <p className="font-black text-foreground text-sm tracking-tight">{cls.name}</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{cls.section} Section</p>
                                                </div>
                                            </div>
                                        ))
                                    )
                                )}
                             </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="text-center space-y-10 py-10 animate-in zoom-in-95 duration-500">
                             <div className="w-32 h-32 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-500/5">
                                <CheckCircleIcon className="w-16 h-16" />
                             </div>
                             <div>
                                <h4 className="text-4xl font-black text-foreground tracking-tight">Seal Configuration</h4>
                                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">Your institutional fee master for <strong>Grade {formData.targetGrade}</strong> is ready for persistence.</p>
                             </div>
                             
                             <div className="max-w-xs mx-auto p-8 bg-muted/40 rounded-[2.5rem] border border-border shadow-inner">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">
                                    <span>Global Valuation</span>
                                    <span className="text-foreground font-mono">{formatCurrency(totalYearlyAmount, formData.currency)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">
                                    <span>Base Currency</span>
                                    <span className="text-foreground font-mono font-bold">{formData.currency}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                    <span>Ledger Components</span>
                                    <span className="text-foreground">{components.length} Items</span>
                                </div>
                             </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-border bg-muted/30 flex justify-between items-center relative z-20">
                    <button 
                        onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                        className="px-8 py-3.5 rounded-2xl text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground hover:bg-white/10 transition-all flex items-center gap-2"
                        disabled={loading}
                    >
                        {step === 1 ? 'Discard Protocol' : <><ChevronLeftIcon className="w-4 h-4"/> Back</>}
                    </button>
                    
                    <div className="flex gap-3">
                        {step === 4 && (
                            <button 
                                onClick={() => handleFinalize(true)}
                                disabled={loading}
                                className="px-8 py-4 bg-emerald-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <Spinner size="sm"/> : 'Seal & Publish Now'}
                            </button>
                        )}
                        <button 
                            onClick={() => step === 4 ? handleFinalize(false) : setStep(step + 1)}
                            disabled={loading || (step === 1 && !formData.name)}
                            className="px-10 py-4 bg-primary text-primary-foreground font-black text-sm rounded-2xl shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                        >
                            {loading ? <Spinner size="sm" className="text-white"/> : step === 4 ? 'Save Master Draft' : <>Continue <ChevronRightIcon className="w-4 h-4"/></>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeeMasterWizard;
