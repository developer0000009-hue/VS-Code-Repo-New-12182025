import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase, STORAGE_KEY } from './services/supabase';
import { UserProfile, Role, BuiltInRoles } from './types';
import AuthPage from './components/AuthPage';
import SchoolAdminDashboard from './components/SchoolAdminDashboard';
import Spinner from './components/common/Spinner';
import OnboardingFlow from './OnboardingFlow';
import ParentDashboard from './components/ParentDashboard';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import TransportDashboard from './components/TransportDashboard';
import EcommerceDashboard from './components/EcommerceDashboard';
import NotFound from './components/common/NotFound';
import { XIcon } from './components/icons/XIcon';

/**
 * Robust error message extractor for Enterprise compliance.
 * Guarantees a string return to prevent UI rendering crashes.
 */
const formatError = (err: any): string => {
    if (!err) return "Institutional synchronization failed.";
    if (typeof err === 'string') return err;
    const message = err.message || err.error_description || err.details || err.hint;
    if (message && typeof message === 'string' && !message.includes("[object Object]")) return message;
    if (err.error?.message) return err.error.message;
    return "A system exception occurred. Please refresh the portal.";
};

const ROLE_ROUTES: Record<string, string> = {
    [BuiltInRoles.SCHOOL_ADMINISTRATION]: '/admin',
    [BuiltInRoles.BRANCH_ADMIN]: '/admin',
    [BuiltInRoles.PRINCIPAL]: '/admin',
    [BuiltInRoles.HR_MANAGER]: '/admin',
    [BuiltInRoles.ACADEMIC_COORDINATOR]: '/admin',
    [BuiltInRoles.ACCOUNTANT]: '/admin',
    [BuiltInRoles.PARENT_GUARDIAN]: '/parent',
    [BuiltInRoles.STUDENT]: '/student',
    [BuiltInRoles.TEACHER]: '/teacher',
    [BuiltInRoles.TRANSPORT_STAFF]: '/transport',
    [BuiltInRoles.ECOMMERCE_OPERATOR]: '/store',
};

const App: React.FC = () => {
    const [session, setSession] = useState<any | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [onboardingStep, setOnboardingStep] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [authError, setAuthError] = useState<string | null>(null);
    
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
                const { data: newProfile, error: insertError } = await supabase.from('profiles').upsert({
                    id: currentSession.user.id,
                    email: currentSession.user.email,
                    display_name: currentSession.user.user_metadata?.display_name || 'System User',
                }).select().maybeSingle();
                if (insertError) throw insertError;
                setProfile(newProfile as UserProfile);
            } else {
                setProfile(profileData as UserProfile);
                
                if (profileData.role === BuiltInRoles.SCHOOL_ADMINISTRATION) {
                    const { data: adminData } = await supabase
                        .from('school_admin_profiles')
                        .select('onboarding_step')
                        .eq('user_id', profileData.id)
                        .maybeSingle();
                    if (adminData) setOnboardingStep(adminData.onboarding_step);
                }
            }
        } catch (e: any) {
            console.error("Critical Profile Sync Error:", e);
            setAuthError(formatError(e));
        } finally {
            isFetching.current = false;
            setLoading(false);
        }
    }, []);

    const handleSignOut = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        localStorage.removeItem(STORAGE_KEY);
        setSession(null);
        setProfile(null);
        navigate('/', { replace: true });
        setLoading(false);
    };

    const handleDirectRoleSwitch = useCallback(async (newRole: Role, isExisting: boolean = true) => {
        if (!profile || !session) return;
        setLoading(true);
        try {
            const { error } = await supabase.rpc('switch_active_role', { p_target_role: newRole });
            if (error) throw error;
            
            await loadUserData(session, true);
            
            if (isExisting) {
                const targetPath = ROLE_ROUTES[newRole] || '/dashboard';
                navigate(targetPath, { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        } catch (e: any) {
            alert(`Role Switch Rejected: ${formatError(e)}`);
        } finally {
            setLoading(false);
        }
    }, [profile, session, loadUserData, navigate]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
            setSession(initialSession);
            if (initialSession) loadUserData(initialSession);
            else setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            setSession(currentSession);
            if (currentSession) loadUserData(currentSession, true);
            else {
                setProfile(null);
                setLoading(false);
            }
        });
        return () => subscription.unsubscribe();
    }, [loadUserData]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <Spinner size="lg" />
                <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Syncing Secure Identity</p>
            </div>
        );
    }

    if (authError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 text-center">
                <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
                    <XIcon className="w-8 h-8" />
                </div>
                <h1 className="text-xl font-bold mb-2">Portal Access Error</h1>
                <p className="text-muted-foreground mb-6 max-w-md">{authError}</p>
                <button onClick={() => window.location.reload()} className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg">Retry Sync</button>
            </div>
        );
    }
    
    if (!session || !profile) return <AuthPage />;
    
    // ATOMIC ONBOARDING CHECK: If profile is incomplete OR role is null, force Onboarding Flow
    if (!profile.profile_completed || !profile.role) {
        return (
            <OnboardingFlow 
                profile={profile} 
                onboardingStep={onboardingStep}
                onComplete={() => loadUserData(session, true)} 
                onStepChange={() => loadUserData(session, true)}
            />
        );
    }

    const homePath = ROLE_ROUTES[profile.role] || '/dashboard';
    
    // Strict Administrative Scope Enforcement
    const isAdminRole = (r: Role | null) => {
        if (!r) return false;
        const adminRoles: Role[] = [
            BuiltInRoles.SCHOOL_ADMINISTRATION, 
            BuiltInRoles.BRANCH_ADMIN, 
            BuiltInRoles.PRINCIPAL, 
            BuiltInRoles.HR_MANAGER, 
            BuiltInRoles.ACADEMIC_COORDINATOR, 
            BuiltInRoles.ACCOUNTANT
        ];
        return adminRoles.includes(r);
    };

    return (
        <Routes>
            <Route path="/" element={<Navigate to={homePath} replace />} />
            
            {/* Unified Admin Sub-System */}
            <Route path="/admin/*" element={
                isAdminRole(profile.role) 
                ? <SchoolAdminDashboard profile={profile} onSelectRole={handleDirectRoleSwitch} onSignOut={handleSignOut} onProfileUpdate={() => loadUserData(session, true)} /> 
                : <Navigate to={homePath} replace />
            } />

            <Route path="/parent/*" element={profile.role === BuiltInRoles.PARENT_GUARDIAN ? <ParentDashboard profile={profile} onSelectRole={handleDirectRoleSwitch} onSignOut={handleSignOut} onProfileUpdate={() => loadUserData(session, true)} /> : <Navigate to={homePath} replace />} />
            <Route path="/student/*" element={profile.role === BuiltInRoles.STUDENT ? <StudentDashboard profile={profile} onSignOut={handleSignOut} onSwitchRole={handleSignOut} onSelectRole={handleDirectRoleSwitch} /> : <Navigate to={homePath} replace />} />
            <Route path="/teacher/*" element={profile.role === BuiltInRoles.TEACHER ? <TeacherDashboard profile={profile} onSwitchRole={handleSignOut} onSignOut={handleSignOut} onProfileUpdate={() => loadUserData(session, true)} onSelectRole={handleDirectRoleSwitch} /> : <Navigate to={homePath} replace />} />
            <Route path="/transport/*" element={profile.role === BuiltInRoles.TRANSPORT_STAFF ? <TransportDashboard profile={profile} onSignOut={handleSignOut} onSwitchRole={handleSignOut} onSelectRole={handleDirectRoleSwitch} /> : <Navigate to={homePath} replace />} />
            <Route path="/store/*" element={profile.role === BuiltInRoles.ECOMMERCE_OPERATOR ? <EcommerceDashboard profile={profile} onSignOut={handleSignOut} onSwitchRole={handleSignOut} onSelectRole={handleDirectRoleSwitch} /> : <Navigate to={homePath} replace />} />

            <Route path="*" element={<NotFound redirectTo={homePath} />} />
        </Routes>
    );
};

export default App;