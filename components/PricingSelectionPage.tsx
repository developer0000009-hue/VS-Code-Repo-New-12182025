import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import Spinner from './common/Spinner';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { UserProfile } from '../types';

interface PricingSelectionPageProps {
    onComplete: () => void;
    onBack?: () => void;
}

interface BasePlan {
    id: string;
    label: string;
    branches: string;
    description: string;
    features: string[];
    recommended?: boolean;
}

const basePlans: BasePlan[] = [
    { 
        id: '1_branch', 
        label: 'Single Branch', 
        branches: '1 Branch', 
        description: 'Perfect for individual schools starting out.',
        features: ['Core Admin Features', 'Student Management', 'Basic Reporting', 'Email Support']
    },
    { 
        id: '3_branches', 
        label: 'Starter Chain', 
        branches: '3 Branches', 
        description: 'Ideal for small groups expanding their reach.',
        features: ['Multi-branch Dashboard', 'Advanced Analytics', 'Priority Support', 'Custom Branding'],
        recommended: true
    },
    { 
        id: '5_branches', 
        label: 'Growth Chain', 
        branches: '5 Branches', 
        description: 'For growing institutions with multiple campuses.',
        features: ['Enterprise API Access', 'Dedicated Account Manager', 'Data Export/Import', 'Unlimited Staff Accounts']
    },
    { 
        id: 'unlimited', 
        label: 'Enterprise', 
        branches: 'Unlimited', 
        description: 'Full-scale solution for large educational networks.',
        features: ['Full White Label', 'On-premise Deployment', '24/7 Phone Support', 'Custom Feature Dev']
    },
];

/**
 * Standardized error formatter to prevent [object Object].
 */
const formatError = (err: any): string => {
    if (!err) return "An unknown error occurred.";
    
    if (typeof err === 'string') {
        const isJunk = err === "[object Object]" || err === "{}" || err === "null" || err === "undefined";
        return isJunk ? "Pricing update protocol failure." : err;
    }
    
    const candidates = [
        err.message,
        err.error_description,
        err.details,
        err.hint,
        err.error?.message,
        err.error
    ];

    for (const val of candidates) {
        if (typeof val === 'string' && val !== "[object Object]" && val !== "{}") return val;
        if (typeof val === 'object' && val?.message && typeof val.message === 'string') return val.message;
    }

    try {
        const str = JSON.stringify(err);
        if (str && str !== '{}' && str !== '[]' && !str.includes("[object Object]")) {
            return str.length > 200 ? str.substring(0, 197) + "..." : str;
        }
    } catch { }

    return "An unexpected system error occurred during pricing selection.";
};

/**
 * Component for selecting an institutional deployment plan.
 */
const PricingSelectionPage: React.FC<PricingSelectionPageProps> = ({ onComplete, onBack }) => {
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    // Fix: Completed the missing plan selection logic and persistence call
    const handleSelectPlan = async (planId: string) => {
        setSelectedPlan(planId);
        setLoading(true);
        setError(null);

        try {
            const { error: updateError } = await supabase.rpc('update_school_plan', {
                p_plan_id: planId
            });

            if (updateError) throw updateError;
            
            if (isMounted.current) onComplete();
        } catch (err: any) {
            if (isMounted.current) {
                setError(formatError(err));
                setLoading(false);
            }
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-4xl font-serif font-black text-foreground tracking-tight">Institutional Scaling</h2>
                <p className="text-muted-foreground mt-4 text-lg leading-relaxed font-medium">
                    Select a core deployment plan tailored to your institutional complexity. Plans can be adjusted as your node network expands.
                </p>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-center font-bold animate-pulse">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                {basePlans.map((plan) => (
                    <div 
                        key={plan.id}
                        className={`
                            relative flex flex-col p-8 rounded-[2.5rem] border transition-all duration-500 group
                            ${plan.recommended 
                                ? 'bg-primary/5 border-primary shadow-2xl ring-1 ring-primary/20 scale-105 z-10' 
                                : 'bg-card border-border hover:border-primary/40 hover:shadow-xl'
                            }
                        `}
                    >
                        {plan.recommended && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg">
                                Recommended
                            </div>
                        )}

                        <div className="mb-8">
                            <h3 className="text-xl font-black text-foreground uppercase tracking-widest">{plan.label}</h3>
                            <p className="text-3xl font-black text-primary mt-2">{plan.branches}</p>
                        </div>

                        <p className="text-sm text-muted-foreground font-medium mb-8 leading-relaxed">
                            {plan.description}
                        </p>

                        <ul className="space-y-4 mb-10 flex-grow">
                            {plan.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-xs font-bold text-foreground/70">
                                    <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleSelectPlan(plan.id)}
                            disabled={loading}
                            className={`
                                w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all transform active:scale-95
                                ${plan.recommended 
                                    ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:bg-primary/90' 
                                    : 'bg-muted text-muted-foreground hover:bg-foreground hover:text-background'
                                }
                                ${loading && selectedPlan === plan.id ? 'opacity-50' : ''}
                            `}
                        >
                            {loading && selectedPlan === plan.id ? <Spinner size="sm" className="mx-auto" /> : 'Select Plan'}
                        </button>
                    </div>
                ))}
            </div>

            {onBack && (
                <div className="mt-16 text-center">
                    <button
                        onClick={onBack}
                        disabled={loading}
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                        <ChevronLeftIcon className="w-4 h-4" /> Return to Profile Setup
                    </button>
                </div>
            )}
        </div>
    );
};

// Fix: Added default export
export default PricingSelectionPage;