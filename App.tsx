
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { supabase, STORAGE_KEY, formatError } from './services/supabase';
import { UserProfile, BuiltInRoles, Role } from './types';
import AuthPage from './components/AuthPage';
import SchoolAdminDashboard from './components/SchoolAdminDashboard';
import ParentDashboard from './ParentDashboard';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import MinimalAdminDashboard from './components/MinimalAdminDashboard';
import OnboardingFlow from './OnboardingFlow';
import Spinner from './components/common/Spinner';
import NotFound from './components/common/NotFound';

const App: React.FC = () => {
    const [session, setSession] = useState<any | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [onboardingStep, setOnboardingStep] = useState<string | null>(null);
    
    const navigate = useNavigate();
    const isFetching = useRef(false);

    const loadUserData = useCallback(async (currentSession: any, force = false) => {
        if (isFetching.current && !force) return;
        isFetching.current = true;
        
        try {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentSession.user.id)
                .maybeSingle();

            if (profileError) throw profileError;

            if (!profileData) {
                // Fallback for race condition: create profile from metadata if trigger hasn't finished
                const metadata = currentSession.user.user_metadata || {};
                const { data: newProfile, error: upsertError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: currentSession.user.id,
                        email: currentSession.user.email,
                        display_name: metadata.display_name || 'Identity Node',
                        phone: metadata.phone || currentSession.user.phone || null,
                        role: null,
                        is_active: true,
                        profile_completed: false
                    }, { onConflict: 'id' })
                    .select()
                    .maybeSingle();
                
                if (upsertError) throw upsertError;
                setProfile(newProfile as UserProfile);
            } else {
                setProfile(profileData as UserProfile);
                
                // Fetch admin onboarding state if applicable
                if (profileData.role === BuiltInRoles.SCHOOL_ADMINISTRATION) {
                    const { data: adminProfile, error: adminError } = await supabase
                        .from('school_admin_profiles')
                        .select('onboarding_step')
                        .eq('user_id', profileData.id)
                        .maybeSingle();
                    
                    if (!adminError) {
                        setOnboardingStep(adminProfile?.onboarding_step || 'profile');
                    }
                }
            }
        } catch (e) {
            console.error("CRITICAL: Identity Sync Protocol failure.", formatError(e));
        } finally {
            isFetching.current = false;
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
            setSession(initialSession);
            if (initialSession) loadUserData(initialSession);
            else setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
            setSession(currentSession);
            if (currentSession) {
                loadUserData(currentSession, true);
            } else {
                setProfile(null);
                setLoading(false);
            }
        });
        return () => subscription.unsubscribe();
    }, [loadUserData]);

    const handleOnboardingComplete = async () => {
        setLoading(true);
        if (session) await loadUserData(session, true);
    };

    const handleRoleSelect = async (role: Role) => {
        setLoading(true);
        try {
            const { error } = await supabase.rpc('switch_active_role', { p_target_role: role });
            if (error) throw error;
            if (session) await loadUserData(session, true);
            navigate('/', { replace: true });
        } catch (err: any) {
            console.error("Role Switch Protocol failed:", formatError(err));
            alert(formatError(err));
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        localStorage.removeItem(STORAGE_KEY);
        setSession(null);
        setProfile(null);
        navigate('/', { replace: true });
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0c] text-center p-6">
                <Spinner size="lg" />
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">Establishing Identity Stream</p>
            </div>
        );
    }

    if (!session || !profile) return <AuthPage />;

    // Force onboarding if role is missing or profile incomplete
    if (!profile.role || (!profile.profile_completed && profile.role !== BuiltInRoles.SUPER_ADMIN)) {
        return (
            <OnboardingFlow 
                profile={profile} 
                onComplete={handleOnboardingComplete} 
                onStepChange={() => loadUserData(session, true)}
                onboardingStep={onboardingStep}
            />
        );
    }

    const renderDashboard = () => {
        switch (profile.role) {
            case BuiltInRoles.SUPER_ADMIN:
                return <MinimalAdminDashboard profile={profile} onSignOut={handleSignOut} onSelectRole={handleRoleSelect} />;
            case BuiltInRoles.SCHOOL_ADMINISTRATION:
            case BuiltInRoles.BRANCH_ADMIN:
            case BuiltInRoles.PRINCIPAL:
            case BuiltInRoles.HR_MANAGER:
            case BuiltInRoles.ACADEMIC_COORDINATOR:
            case BuiltInRoles.ACCOUNTANT:
                return <SchoolAdminDashboard profile={profile} onSignOut={handleSignOut} onProfileUpdate={handleOnboardingComplete} onSelectRole={handleRoleSelect} />;
            case BuiltInRoles.PARENT_GUARDIAN:
                return <ParentDashboard profile={profile} onSignOut={handleSignOut} onProfileUpdate={handleOnboardingComplete} onSelectRole={handleRoleSelect} />;
            case BuiltInRoles.STUDENT:
                return <StudentDashboard profile={profile} onSignOut={handleSignOut} onSwitchRole={() => handleRoleSelect(null as any)} onSelectRole={handleRoleSelect} />;
            case BuiltInRoles.TEACHER:
                return <TeacherDashboard profile={profile} onSignOut={handleSignOut} onProfileUpdate={handleOnboardingComplete} onSelectRole={handleRoleSelect} onSwitchRole={() => handleRoleSelect(null as any)} />;
            default:
                return <div className="p-20 text-center font-serif italic text-white/40">Identity Mismatch: Role {profile.role} is not mapped to a telemetry dashboard.</div>;
        }
    };

    return (
        <Routes>
            <Route path="/" element={renderDashboard()} />
            <Route path="*" element={<NotFound redirectTo="/" />} />
        </Routes>
    );
};

export default App;
