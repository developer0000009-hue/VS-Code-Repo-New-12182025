
import React, { useState, useEffect, useRef } from 'react';
import RoleSelectionPage from './RoleSelectionPage';
import { BranchCreationPage } from './BranchCreationPage';
import { ProfileCreationPage } from './ProfileCreationPage';
import PricingSelectionPage from './PricingSelectionPage';
import { Role, UserProfile, BuiltInRoles } from '../types';
import { supabase } from '../services/supabase';
import Spinner from './common/Spinner';
import ThemeSwitcher from './common/ThemeSwitcher';
import { SchoolIcon } from './icons/SchoolIcon';
import ProfileDropdown from './common/ProfileDropdown';
import Stepper from './common/Stepper';

interface OnboardingFlowProps {
    profile: UserProfile;
    onComplete: () => Promise<void> | void;
    onStepChange: () => Promise<void> | void;
    onboardingStep?: string | null;
}

const ONBOARDING_STEPS = ['Profile', 'Plan', 'Branches & Admins'];
const stepMap: { [key: string]: number } = {
    'profile': 0,
    'pricing': 1,
    'branches': 2
};

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ profile, onComplete, onStepChange, onboardingStep }) => {
    const [step, setStep] = useState<'role' | 'profile' | 'pricing' | 'branches'>('role');
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);
    
    const isMounted = useRef(true);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);
    
    /**
     * Reacts to changes in the user profile or the onboarding step from the DB.
     * This is the core engine that ensures the user is on the right screen.
     */
    useEffect(() => {
        if (!isMounted.current || isTransitioning) return;

        // Step 0: No Role
        if (!profile.role) {
            setSelectedRole(null);
            setStep('role');
            setLoading(false);
            return;
        }

        setSelectedRole(profile.role);
        
        // Step 1+: Has Role
        if (profile.role === BuiltInRoles.SCHOOL_ADMINISTRATION) {
            const dbStep = onboardingStep;
            if (dbStep && ['profile', 'pricing', 'branches'].includes(dbStep)) {
                setStep(dbStep as any);
            } else if (dbStep === 'complete') {
                onComplete();
            } else {
                setStep('profile');
            }
        } else {
            // Other roles are simpler: Profile Setup -> Complete
            if (profile.profile_completed) {
                onComplete();
            } else {
                setStep('profile');
            }
        }
        
        setLoading(false);
    }, [profile.role, profile.profile_completed, onboardingStep, isTransitioning, onComplete]);

    const handleSignOut = async () => {
        if (isMounted.current) setLoading(true);
        await supabase.auth.signOut();
    };
    
    const handleRoleSelect = async (role: Role) => {
        if (!isMounted.current || isTransitioning) return;
        setIsTransitioning(true);
        setLoading(true);
        
        try {
            if (role === BuiltInRoles.SCHOOL_ADMINISTRATION) {
                const { error } = await supabase.rpc('initialize_school_admin');
                if (error) throw error;
            } else {
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ role: role, profile_completed: false })
                    .eq('id', profile.id);

                if (updateError) throw updateError;
            }

            // Signal the app to reload the profile
            if (onStepChange) await onStepChange();
            
        } catch (err: any) {
            console.error('Role selection failed:', err);
            alert(`Setup failed: ${err.message || "Institutional initialization failed."}`);
        } finally {
            if (isMounted.current) {
                setIsTransitioning(false);
                setLoading(false);
            }
        }
    };

    const handleStepAdvance = async () => {
        if (!isMounted.current) return;
        // The individual page has already updated the DB step. 
        // Signal the app to reload and the useEffect above will pivot the UI.
        if (onStepChange) await onStepChange();
    };

    const handleFinalize = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.rpc('complete_branch_step');
            if (error) throw error;
            if (onComplete) await onComplete();
        } catch (error: any) {
            alert("Error finalizing setup: " + (error.message || String(error)));
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };
    
    const handleBack = async () => {
        if (!isMounted.current || profile.profile_completed || isTransitioning) return;
        setIsTransitioning(true);
        setLoading(true);

        try {
            if (selectedRole === BuiltInRoles.SCHOOL_ADMINISTRATION) {
                let prevStep = 'role';
                if (step === 'branches') prevStep = 'pricing';
                else if (step === 'pricing') prevStep = 'profile';

                if (prevStep === 'role') {
                    await supabase.from('profiles').update({ role: null, profile_completed: false }).eq('id', profile.id);
                } else {
                    await supabase.from('school_admin_profiles').update({ onboarding_step: prevStep }).eq('user_id', profile.id);
                }
            } else {
                await supabase.from('profiles').update({ role: null, profile_completed: false }).eq('id', profile.id);
            }
            
            if (onStepChange) await onStepChange();
        } catch (err) {
            console.error("Back navigation error:", err);
        } finally {
            if (isMounted.current) {
                setIsTransitioning(false);
                setLoading(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Spinner size="lg" />
            </div>
        );
    }
    
    let content;
    switch (step) {
        case 'role':
            content = <RoleSelectionPage onRoleSelect={handleRoleSelect} onComplete={onComplete} />;
            break;
        case 'profile':
            content = <ProfileCreationPage profile={profile} role={selectedRole!} onComplete={handleStepAdvance} onBack={handleBack} showBackButton={true} />;
            break;
        case 'pricing':
            content = <PricingSelectionPage onComplete={handleStepAdvance} onBack={handleBack} />;
            break;
        case 'branches':
            content = <BranchCreationPage onNext={handleFinalize} profile={profile} onBack={handleBack} />;
            break;
        default:
            content = <RoleSelectionPage onRoleSelect={handleRoleSelect} onComplete={onComplete} />;
    }

    const currentStepIndex = stepMap[step] ?? 0;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center flex-shrink-0 cursor-pointer" onClick={() => step !== 'role' && handleBack()}>
                            <div className="p-2 bg-primary/10 rounded-xl mr-3">
                                <SchoolIcon className="h-6 w-6 text-primary" />
                            </div>
                            <span className="font-serif font-bold text-lg hidden sm:block text-foreground">Institutional Setup</span>
                        </div>
                        
                        {selectedRole === BuiltInRoles.SCHOOL_ADMINISTRATION && step !== 'role' && (
                            <div className="hidden md:flex items-center justify-center flex-grow max-w-xl mx-auto">
                                <Stepper steps={ONBOARDING_STEPS} currentStep={currentStepIndex} />
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <ThemeSwitcher />
                            <ProfileDropdown profile={profile} onSignOut={handleSignOut} />
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-grow max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
                {content}
            </main>
        </div>
    );
};

export default OnboardingFlow;
