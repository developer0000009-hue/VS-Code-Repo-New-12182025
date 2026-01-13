import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase, formatError } from './services/supabase';
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
import { AlertTriangleIcon } from './components/icons/AlertTriangleIcon';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const App: React.FC = () => {
    const [session, setSession] = useState<any | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [onboardingStep, setOnboardingStep] = useState<string | null>(null);
    
    const isFetching = useRef(false);

    const loadUserData = useCallback(async (currentSession: any, force = false) => {
        if (!currentSession?.user?.id) {
            setLoading(false);
            return;
        }

        if (isFetching.current && !force) return;
        isFetching.current = true;
        
        try {
            // Identity Handshake: Sync primary registry
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentSession.user.id)
                .maybeSingle();

            if (profileError) throw profileError;

            if (!profileData) {
                // Provision new identity node
                const metadata = currentSession.user.user_metadata || {};
                const { data: newProfile, error: insertError } = await supabase.from('profiles').upsert({
                    id: currentSession.user.id,
                    email: currentSession.user.email,
                    display_name: metadata.display_name || 'New User',
                    role: metadata.role || null,
                    is_active: true,
                    profile_completed: false
                }).select().maybeSingle();
                
                if (insertError) throw insertError;
                setProfile(newProfile as UserProfile);
                setError(null);
            } else {
                setProfile(profileData as UserProfile);
                setError(null);
                
                // Scoped context retrieval for school admins
                if (profileData.role === BuiltInRoles.SCHOOL_ADMINISTRATION) {
                    const { data: adminProfile } = await supabase
                        .from('school_admin_profiles')
                        .select('onboarding_step')
                        .eq('user_id', profileData.id)
                        .maybeSingle();
                    setOnboardingStep(adminProfile?.onboarding_step || 'profile');
                }
            }
        } catch (e: any) {
            console.error("Registry Sync failure:", e);
            setError(formatError(e));
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

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            setSession(currentSession);
            if (currentSession) {
                loadUserData(currentSession, true);
            } else {
                setProfile(null);
                setError(null);
                setLoading(false);
            }
        });
        return () => subscription.unsubscribe();
    }, [loadUserData]);

    const handleRetry = () => {
        setLoading(true);
        setError(null);
        if (session) {
            loadUserData(session, true);
        } else {
            window.location.reload();
        }
    };

    if (error) {
        const isMigrationError = error.includes("Identity Type Mismatch");
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#08090a] p-6 text-center animate-in fade-in duration-500 font-sans">
                <div className="relative mb-8">
                    <div className={`absolute inset-0 ${isMigrationError ? 'bg-amber-500/10' : 'bg-red-500/10'} blur-3xl rounded-full`}></div>
                    <div className={`relative w-24 h-24 bg-black/50 rounded-full border ${isMigrationError ? 'border-amber-500/20' : 'border-red-500/20'} flex items-center justify-center shadow-2xl backdrop-blur-md`}>
                        <AlertTriangleIcon className={`w-10 h-10 ${isMigrationError ? 'text-amber-500' : 'text-red-500'}`} />
                    </div>
                </div>
                <h2 className="text-3xl font-serif font-black text-white mb-4 tracking-tight uppercase">
                    {isMigrationError ? "System Migration Required" : "Registry Synchronization Failure"}
                </h2>
                <p className="text-white/40 mb-12 text-sm md:text-base leading-relaxed font-serif italic max-w-md mx-auto">
                    {error}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    {isMigrationError ? (
                        <button
                            onClick={() => window.open('https://supabase.com/dashboard/project/_/editor', '_blank')}
                            className="px-12 py-4 bg-amber-500 text-black font-black text-[10px] uppercase tracking-[0.4em] rounded-xl hover:bg-amber-400 transition-all transform active:scale-95 shadow-2xl"
                        >
                            Open SQL Editor
                        </button>
                    ) : (
                        <button
                            onClick={handleRetry}
                            className="px-12 py-4 bg-white text-black font-black text-[10px] uppercase tracking-[0.4em] rounded-xl hover:bg-white/90 transition-all transform active:scale-95 shadow-2xl"
                        >
                            Retry Connection
                        </button>
                    )}
                    <button
                        onClick={() => supabase.auth.signOut()}
                        className="px-12 py-4 bg-red-600/10 text-red-500 border border-red-500/20 font-black text-[10px] uppercase tracking-[0.4em] rounded-xl hover:bg-red-600 hover:text-white transition-all transform active:scale-95"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#08090a] text-center p-6">
                <Spinner size="lg" />
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">Establishing Identity Stream</p>
            </div>
        );
    }

    if (!session || !profile) return <AuthPage />;

    if (!profile.role || (!profile.profile_completed && profile.role !== BuiltInRoles.SUPER_ADMIN)) {
        return (
            <OnboardingFlow 
                profile={profile} 
                onComplete={() => loadUserData(session, true)} 
                onStepChange={() => loadUserData(session, true)}
                onboardingStep={onboardingStep}
            />
        );
    }

    const handleRoleSelect = async (role: Role) => {
        setLoading(true);
        try {
            const { error } = await supabase.rpc('switch_active_role', { p_target_role: role });
            if (error) throw error;
            await loadUserData(session, true);
        } catch (e) {
            alert(formatError(e));
        } finally {
            setLoading(false);
        }
    };

    const renderDashboard = () => {
        switch (profile.role) {
            case BuiltInRoles.SUPER_ADMIN:
                return <MinimalAdminDashboard profile={profile} onSignOut={() => supabase.auth.signOut()} onSelectRole={handleRoleSelect} />;
            case BuiltInRoles.SCHOOL_ADMINISTRATION:
            case BuiltInRoles.BRANCH_ADMIN:
            case BuiltInRoles.PRINCIPAL:
            case BuiltInRoles.HR_MANAGER:
            case BuiltInRoles.ACADEMIC_COORDINATOR:
            case BuiltInRoles.ACCOUNTANT:
                return <SchoolAdminDashboard profile={profile} onSignOut={() => supabase.auth.signOut()} onProfileUpdate={() => loadUserData(session, true)} onSelectRole={handleRoleSelect} />;
            case BuiltInRoles.PARENT_GUARDIAN:
                return <ParentDashboard profile={profile} onSignOut={() => supabase.auth.signOut()} onProfileUpdate={() => loadUserData(session, true)} onSelectRole={handleRoleSelect} />;
            case BuiltInRoles.STUDENT:
                return <StudentDashboard profile={profile} onSignOut={() => supabase.auth.signOut()} onSwitchRole={() => {}} onSelectRole={handleRoleSelect} />;
            case BuiltInRoles.TEACHER:
                return <TeacherDashboard profile={profile} onSwitchRole={() => {}} onProfileUpdate={() => loadUserData(session, true)} onSelectRole={handleRoleSelect} onSignOut={() => supabase.auth.signOut()} />;
            default:
                return <div className="p-20 text-center text-white/50">Identity Mismatch: Role "{profile.role}" is not mapped in this deployment.</div>;
        }
    };

    return (
        <div className="min-h-screen bg-[#08090a] selection:bg-primary/20 transition-colors duration-500">
            <Routes>
                <Route path="/" element={renderDashboard()} />
                <Route path="*" element={<NotFound redirectTo="/" />} />
            </Routes>
        </div>
    );
};

export default App;
