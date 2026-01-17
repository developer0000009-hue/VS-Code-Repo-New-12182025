import React, { useState, useEffect, useMemo } from 'react';
import { supabase, formatError } from '../../services/supabase';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { BookIcon } from '../icons/BookIcon';
import { DollarSignIcon } from '../icons/DollarSignIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'framer-motion';

interface FeeMasterWizardProps {
    onClose: () => void;
    onSuccess: () => void;
    branchId: number | null;
}

const FREQUENCIES = ['One-time', 'Monthly', 'Quarterly', 'Annually'];

const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: currency === 'USD' ? 'USD' : 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount || 0);
};

const FeeMasterWizard: React.FC<FeeMasterWizardProps> = ({ onClose, onSuccess, branchId }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [aiAffordability, setAiAffordability] = useState<string | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        academicYear: '2025-2026',
        targetGrade: '1',
        description: '',
        currency: 'INR' as 'INR' | 'USD'
    });

    const [components, setComponents] = useState<{ name: string; amount: number; frequency: string; is_mandatory: boolean }[]>([
        { name: 'TUITION_FEES', amount: 0, frequency: 'Monthly', is_mandatory: true }
    ]);

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
            else if (c.frequency === 'Annually') multiplier = 1;
            return acc + (amount * multiplier);
        }, 0);
    }, [components]);

    const generateAIDescription = async () => {
        if (!formData.name) return;
        setAiGenerating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Write a professional school fee policy description for a fee structure titled "${formData.name}". Include details about standard academic billing, payment cycles, and institutional standards for Grade ${formData.targetGrade}. Keep it concise but formal. Maximum 60 words.`;
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: prompt
            });
            setFormData(prev => ({ ...prev, description: response.text || '' }));
        } catch (e) {
            console.warn("AI Generation fail", e);
        } finally {
            setAiGenerating(false);
        }
    };

    const runAffordabilitySimulation = async () => {
        setIsSimulating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Analyze a proposed school fee structure for Grade ${formData.targetGrade}. Total annual amount: ${totalYearlyAmount} ${formData.currency}. Breakdown: ${JSON.stringify(components)}. Provide a 25-word executive summary on parent affordability sentiment and collection feasibility. Use a clinical, strategic tone.`;
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: prompt
            });
            setAiAffordability(response.text || "Simulation synchronized.");
        } catch (e) {
            setAiAffordability("Sentiment matrix unavailable.");
        } finally {
            setIsSimulating(false);
        }
    };

    const handleFinalize = async (publish: boolean = false) => {
        if (!formData.name.trim()) {
            setError("Structure designation is required for registry mapping.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const bid = branchId ? Number(branchId) : null;

            const { data: struct, error: structError } = await supabase
                .from('fee_structures')
                .insert({
                    name: formData.name,
                    academic_year: formData.academic_year,
                    target_grade: formData.targetGrade,
                    description: formData.description,
                    currency: formData.currency,
                    status: publish ? 'Active' : 'Draft',
                    is_active: publish,
                    branch_id: bid
                })
                .select()
                .single();

            if (structError) throw structError;

            const componentsPayload = components.map(c => ({
                structure_id: struct.id,
                name: c.name || 'MISC_FEE',
                amount: c.amount || 0,
                frequency: c.frequency,
                is_mandatory: c.is_mandatory
            }));

            const { error: compError } = await supabase.from('fee_components').insert(componentsPayload);
            if (compError) throw compError;

            onSuccess();
        } catch (err: any) {
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[150] flex items-center justify-center p-4 animate-in fade-in duration-500" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-[#0c0d12] w-full max-w-4xl rounded-[3rem] shadow-[0_80px_160px_-24px_rgba(0,0,0,1)] border border-white/10 flex flex-col overflow-hidden max-h-[92vh] ring-1 ring-white/5" 
                onClick={e => e.stopPropagation()}
            >
                <div className="p-10 border-b border-white/5 bg-[#12141c]/40 backdrop-blur-md flex justify-between items-center relative z-20">
                    <div className="flex items-center gap-6">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner border border-primary/20 ring-4 ring-primary/5">
                            <BookIcon className="w-6 h-6"/>
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-1">Node Initialization</h3>
                            <p className="text-2xl font-serif font-black text-white tracking-tight uppercase leading-none">Master Architect</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 rounded-2xl hover:bg-white/5 text-white/20 hover:text-white transition-all border border-transparent hover:border-white/10 active:scale-90"><XIcon className="w-8 h-8"/></button>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar p-10 md:p-16 bg-transparent relative">
                    {error && (
                        <div className="mb-10 p-6 bg-red-500/5 border border-red-500/20 rounded-[2.5rem] flex items-start gap-6 animate-in shake relative z-10">
                             <div className="p-4 bg-red-500/10 rounded-xl text-red-500">
                                <AlertTriangleIcon className="w-6 h-6"/>
                             </div>
                             <div>
                                 <p className="text-[10px] font-black uppercase text-red-500 tracking-[0.3em] mb-1.5">Handshake Exception</p>
                                 <p className="text-sm font-medium text-red-200/60 leading-relaxed font-serif italic">{error}</p>
                             </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-12 animate-in slide-in-from-right-10 duration-700 relative z-10">
                            <div className="space-y-4">
                                <span className="text-[10px] font-black uppercase text-primary/60 tracking-[0.5em] ml-1">System Initialization · Phase 01</span>
                                <h4 className="text-5xl md:text-7xl font-serif font-black text-white tracking-tighter uppercase leading-[0.85]">
                                    CORE <span className="text-white/20">REGISTRY.</span>
                                </h4>
                                <p className="text-lg md:text-xl text-white/30 font-serif italic max-w-xl leading-relaxed">Determine the primary identity and regional standards for this operational block.</p>
                            </div>
                            
                            <div className="space-y-12">
                                <div className="p-8 bg-[#12141c]/50 border border-white/5 rounded-[3rem] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                                    <div className="space-y-6">
                                        <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] ml-1">Structural Scope</label>
                                        <input 
                                            type="text" 
                                            placeholder="DEFINE NODE DESIGNATION (E.G. PRIMARY LEDGER)" 
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl p-8 md:p-10 text-xl md:text-3xl font-serif font-black text-white focus:ring-8 focus:ring-primary/5 focus:border-primary/40 outline-none transition-all shadow-inner uppercase tracking-wide placeholder:text-white/5"
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                                        />
                                        <p className="text-[9px] text-white/10 font-bold uppercase tracking-widest ml-1">Determine the primary operational boundary for this node.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-5">
                                        <div className="flex items-center gap-3 px-1">
                                            <DollarSignIcon className="w-4 h-4 text-primary/40" />
                                            <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em]">Monetary Standard</label>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 p-2 bg-black/60 border border-white/5 rounded-2xl shadow-inner">
                                            {['INR', 'USD'].map(curr => (
                                                <button 
                                                    key={curr}
                                                    type="button"
                                                    onClick={() => setFormData({...formData, currency: curr as any})}
                                                    className={`py-4 rounded-xl text-[11px] font-black tracking-[0.3em] uppercase transition-all duration-500 ${formData.currency === curr ? 'bg-primary text-white shadow-3xl scale-[1.03] z-10' : 'text-white/20 hover:text-white/40'}`}
                                                >
                                                    {curr} {curr === 'INR' ? '(₹)' : '($)'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="flex items-center gap-3 px-1">
                                            <BookIcon className="w-4 h-4 text-primary/40" />
                                            <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em]">Academic Target</label>
                                        </div>
                                        <div className="relative group">
                                            <select 
                                                className="w-full h-[66px] bg-black/60 border border-white/5 rounded-2xl px-8 text-[11px] font-black text-white focus:border-primary/40 outline-none cursor-pointer appearance-none uppercase tracking-[0.3em] shadow-inner transition-all hover:bg-black/80"
                                                value={formData.targetGrade}
                                                onChange={e => setFormData({...formData, targetGrade: e.target.value})}
                                            >
                                                {Array.from({length: 12}, (_, i) => i + 1).map(g => (
                                                    <option key={g} value={String(g)}>GRADE {g} CONTEXT</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/10 group-hover:text-primary transition-colors"><ChevronRightIcon className="w-5 h-5 rotate-90"/></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="flex justify-between items-center px-1">
                                        <div className="flex items-center gap-3">
                                            <SparklesIcon className="w-4 h-4 text-primary/40" />
                                            <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em]">Protocol Narrative · <span className="italic opacity-50 lowercase">optional</span></label>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={generateAIDescription} 
                                            disabled={aiGenerating || !formData.name} 
                                            className="px-5 py-2.5 bg-[#1f1b2e] text-violet-400 hover:text-violet-300 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border border-violet-500/20 shadow-[0_12px_24px_-8px_rgba(139,92,246,0.3)] group/ai"
                                        >
                                            {aiGenerating ? <Spinner size="sm"/> : <SparklesIcon className="w-3.5 h-3.5 group-hover/ai:rotate-12 transition-transform"/>} Synthesize Insights
                                        </button>
                                    </div>
                                    <div className="bg-[#12141c]/50 p-2 rounded-[2.5rem] border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                                        <textarea 
                                            placeholder="Define system intent, constraints, or governance logic..." 
                                            className="w-full bg-transparent border-none rounded-[2rem] p-8 text-lg font-medium text-white/60 focus:ring-0 outline-none h-44 resize-none leading-relaxed font-serif italic transition-all placeholder:text-white/5"
                                            value={formData.description}
                                            onChange={e => setFormData({...formData, description: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-20 animate-in slide-in-from-right-10 duration-700 relative z-10">
                             <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
                                <div className="space-y-3">
                                    <span className="text-[10px] font-black uppercase text-primary/60 tracking-[0.5em] ml-1">Phase 02</span>
                                    <h4 className="text-6xl font-serif font-black text-white tracking-tighter uppercase leading-[0.85]">LEDGER <span className="text-white/20 italic tracking-widest">NODES.</span></h4>
                                    <p className="text-xl text-white/30 font-serif italic max-w-xl leading-relaxed">Map specific billable entities and their periodic chronologies within the registry.</p>
                                </div>
                                <button 
                                    onClick={handleAddComponent}
                                    className="px-12 py-6 bg-primary text-white text-[11px] font-black uppercase tracking-[0.5em] rounded-[2rem] shadow-[0_40px_80px_-16px_rgba(var(--primary),0.5)] hover:bg-primary/90 transition-all flex items-center gap-4 transform active:scale-95 border border-white/10 ring-8 ring-primary/5"
                                >
                                    <PlusIcon className="w-7 h-7"/> Add Entity
                                </button>
                            </div>

                            <div className="space-y-6 max-w-6xl">
                                {components.map((comp, idx) => (
                                    <div key={idx} className="flex flex-col lg:flex-row items-center gap-10 p-10 bg-white/[0.01] border border-white/5 rounded-[3rem] group hover:border-primary/40 transition-all duration-700 shadow-3xl relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                        <div className="flex-grow min-w-0 relative z-10">
                                            <input 
                                                type="text" 
                                                placeholder="E.G. TUITION_FEES" 
                                                className="w-full bg-transparent border-none p-0 text-4xl font-serif font-black text-white focus:ring-0 placeholder:text-white/5 uppercase tracking-tighter leading-none"
                                                value={comp.name}
                                                onChange={e => updateComponent(idx, 'name', e.target.value.toUpperCase().replace(/\s/g, '_'))}
                                            />
                                            <p className="text-[10px] font-black uppercase text-white/20 tracking-[0.5em] mt-5 pl-1">Registry Identifier</p>
                                        </div>
                                        <div className="w-full lg:w-72 relative z-10">
                                            <div className="relative group/input">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.6)]">{formData.currency === 'INR' ? '₹' : '$'}</span>
                                                <input 
                                                    type="number" 
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-6 pl-14 text-3xl font-mono font-black text-white text-right focus:border-primary/40 outline-none transition-all shadow-inner"
                                                    value={comp.amount}
                                                    onChange={e => updateComponent(idx, 'amount', e.target.value)}
                                                />
                                            </div>
                                            <p className="text-[10px] font-black uppercase text-white/20 tracking-[0.5em] mt-5 text-right pr-4">Magnitude</p>
                                        </div>
                                        <div className="w-full lg:w-64 relative z-10">
                                            <div className="relative">
                                                <select 
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-6 text-[10px] font-black uppercase tracking-[0.4em] text-white/60 appearance-none cursor-pointer text-center focus:border-primary/40 outline-none shadow-inner transition-all hover:bg-black/60"
                                                    value={comp.frequency}
                                                    onChange={e => updateComponent(idx, 'frequency', e.target.value)}
                                                >
                                                    {FREQUENCIES.map(f => <option key={f}>{f.toUpperCase()}</option>)}
                                                </select>
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/10 group-hover:text-primary transition-colors"><PlusIcon className="w-4 h-4 rotate-45"/></div>
                                            </div>
                                            <p className="text-[10px] font-black uppercase text-white/20 tracking-[0.5em] mt-5 text-center">Cycle Frequency</p>
                                        </div>
                                        <button 
                                            onClick={() => handleRemoveComponent(idx)}
                                            className="p-4 text-white/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all active:scale-90 flex-shrink-0"
                                        >
                                            <TrashIcon className="w-7 h-7"/>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="p-20 bg-[#0d0f14] border-2 border-dashed border-primary/20 rounded-[5rem] flex flex-col xl:flex-row justify-between items-center gap-16 relative overflow-hidden group shadow-[0_80px_160px_-24px_rgba(0,0,0,1)] ring-1 ring-white/5">
                                <div className="absolute top-0 right-0 p-24 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"><TrendingUpIcon className="w-80 h-80 text-primary" /></div>
                                <div className="relative z-10 space-y-6">
                                    <p className="text-[12px] font-black uppercase text-primary tracking-[0.8em]">Cumulative Yield Projection</p>
                                    <p className="text-2xl text-white/30 font-medium font-serif italic leading-relaxed max-w-xl">Node architecture suggests automated capital stabilization based on periodic chronologies.</p>
                                </div>
                                <div className="relative z-10 text-center xl:text-right">
                                     <span className="text-[clamp(60px,8vw,120px)] font-black text-primary font-mono tracking-tighter drop-shadow-[0_0_60px_rgba(var(--primary),0.5)] leading-none">{formatCurrency(totalYearlyAmount, formData.currency)}</span>
                                     <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em] mt-8">Projected Periodic Intake Capacity</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center space-y-20 py-24 animate-in zoom-in-98 duration-1000 relative z-10">
                             <div className="relative inline-block group">
                                <div className="absolute inset-0 bg-emerald-500/10 blur-[120px] rounded-full animate-pulse group-hover:bg-emerald-500/20 transition-all duration-1000"></div>
                                <div className="relative w-40 h-40 bg-emerald-500/10 text-emerald-500 rounded-[3.5rem] flex items-center justify-center mx-auto shadow-[0_0_80px_rgba(16,185,129,0.15)] border border-emerald-500/20 ring-8 ring-emerald-500/5 group-hover:scale-110 transition-transform duration-700">
                                    <CheckCircleIcon animate className="w-20 h-20" />
                                </div>
                             </div>
                             
                             <div className="max-w-4xl mx-auto space-y-6">
                                <span className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.6em]">Final Verification</span>
                                <h4 className="text-[clamp(48px,6vw,84px)] font-serif font-black text-white tracking-tighter uppercase leading-[0.85]">SEAL <span className="text-white/20 italic">PROTOCOL.</span></h4>
                                <p className="text-2xl text-white/40 font-serif italic leading-relaxed max-w-2xl mx-auto">Financial Node <strong>{formData.name}</strong> is architected and ready for high-fidelity synchronization across the institutional matrix.</p>
                             </div>
                             
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-5xl mx-auto text-left">
                                 <div className="p-16 bg-black/60 rounded-[4rem] border border-white/5 shadow-2xl flex flex-col justify-center backdrop-blur-2xl relative overflow-hidden group ring-1 ring-white/5">
                                     <div className="absolute top-0 left-0 w-1.5 h-full bg-primary opacity-20"></div>
                                     <div className="flex justify-between items-center text-[10px] font-black uppercase text-white/20 tracking-[0.4em] mb-12">
                                         <span>Registry Valuation</span>
                                         <span className="text-primary font-bold">{formData.currency} Standard</span>
                                     </div>
                                     <div className="space-y-10">
                                        <div className="flex justify-between items-end border-b border-white/[0.04] pb-8">
                                            <span className="text-[12px] font-black text-white/40 uppercase tracking-[0.2em]">Gross Yield</span>
                                            <span className="text-5xl font-black text-white font-mono tracking-tighter">{formatCurrency(totalYearlyAmount, formData.currency)}</span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-[12px] font-black text-white/40 uppercase tracking-[0.2em]">Active Ledger Nodes</span>
                                            <span className="text-4xl font-black text-white">{components.length} <span className="text-sm opacity-20 font-sans tracking-tight">Units mapped</span></span>
                                        </div>
                                     </div>
                                 </div>
                                 
                                 <div className="p-16 bg-primary/5 rounded-[4rem] border border-primary/20 shadow-2xl flex flex-col relative overflow-hidden group ring-1 ring-white/5">
                                     <div className="absolute top-0 right-0 p-16 opacity-[0.02] group-hover:scale-110 transition-transform"><SparklesIcon className="w-48 h-48 text-primary" /></div>
                                     <div className="flex justify-between items-center mb-16">
                                         <span className="text-[10px] font-black uppercase text-primary tracking-[0.6em]">Affordability Simulator</span>
                                         {!aiAffordability && !isSimulating && (
                                             <button onClick={runAffordabilitySimulation} className="text-[9px] font-black uppercase text-white/20 hover:text-primary transition-colors border border-white/5 px-4 py-2 rounded-xl backdrop-blur-md">Initialize Simulation</button>
                                         )}
                                     </div>
                                     {isSimulating ? (
                                         <div className="flex-grow flex flex-col items-center justify-center gap-6">
                                             <Spinner size="lg" className="text-primary"/>
                                             <p className="text-[9px] font-black uppercase tracking-[0.5em] text-primary/40 animate-pulse">Modeling parent sentiment data...</p>
                                         </div>
                                     ) : aiAffordability ? (
                                         <div className="flex-grow animate-in fade-in duration-1000">
                                            <p className="text-2xl text-white/70 leading-relaxed font-serif italic text-left">"{aiAffordability}"</p>
                                            <button onClick={() => setAiAffordability(null)} className="mt-12 text-[9px] font-black text-white/10 uppercase tracking-widest hover:text-white/40 transition-colors pt-6 border-t border-white/[0.03] w-full text-left">Redact AI Prediction</button>
                                         </div>
                                     ) : (
                                         <div className="flex-grow flex flex-col items-center justify-center text-center opacity-20">
                                             <SparklesIcon className="w-12 h-12 mb-6" />
                                             <p className="text-sm font-bold uppercase tracking-widest leading-relaxed">Economic stewardship <br/>analysis ready</p>
                                         </div>
                                     )}
                                 </div>
                             </div>
                        </div>
                    )}
                </div>

                <div className="p-10 border-t border-white/5 bg-[#08090a] flex flex-col md:flex-row justify-between items-center gap-8 relative z-30">
                    <button 
                        onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                        className="px-10 py-5 text-[11px] font-black text-white/20 uppercase tracking-[0.6em] hover:text-white transition-all flex items-center gap-4 group"
                        disabled={loading}
                    >
                        {step === 1 ? 'Abort Session' : <><ChevronLeftIcon className="w-6 h-6 group-hover:-translate-x-1 transition-transform"/> Previous Phase</>}
                    </button>
                    
                    <div className="flex flex-col items-center gap-4 w-full md:w-auto">
                        <p className="text-[10px] font-bold text-white/5 uppercase tracking-[0.2em] mb-1">Configuration defines atomic system defaults.</p>
                        <div className="flex gap-6 w-full">
                            {step === 3 && (
                                <button 
                                    onClick={() => handleFinalize(true)}
                                    disabled={loading}
                                    className="flex-1 md:flex-none px-12 py-6 bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.4em] rounded-3xl shadow-2xl shadow-emerald-500/20 hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-30 ring-8 ring-emerald-500/5"
                                >
                                    {loading ? <Spinner size="sm"/> : 'Sync & Activate'}
                                </button>
                            )}
                            <button 
                                onClick={() => step === 3 ? handleFinalize(false) : setStep(step + 1)}
                                disabled={loading || (step === 1 && !formData.name)}
                                className={`flex-1 md:flex-none px-16 py-6 bg-primary text-primary-foreground font-black text-xs uppercase tracking-[0.5em] rounded-3xl shadow-[0_40px_80px_-16px_rgba(var(--primary),0.6)] hover:bg-primary/90 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-30 flex items-center justify-center gap-6 ring-8 ring-primary/5`}
                            >
                                {loading ? <Spinner size="sm" className="text-white"/> : step === 3 ? 'Store as Draft' : <>Next Phase <ChevronRightIcon className="w-4 h-4"/></>}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default FeeMasterWizard;