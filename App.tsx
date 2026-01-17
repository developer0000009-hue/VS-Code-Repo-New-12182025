import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase, formatError, STORAGE_KEY } from './services/supabase';
import { UserProfile, BuiltInRoles, Role } from './types';
import PageLoader from './components/common/PageLoader';
import NotFound from './components/common/NotFound';

// Unified lazy loading from correct locations
const AuthPage = lazy(() => import('./components/AuthPage'));
const SchoolAdminDashboard = lazy(() => import('./SchoolAdminDashboard'));
const ParentDashboard = lazy(() => import('./ParentDashboard'));
const StudentDashboard = lazy(() => import('./components/StudentDashboard'));
const TeacherDashboard = lazy(() => import('./TeacherDashboard'));
const MinimalAdminDashboard = lazy(() => import('./components/MinimalAdminDashboard'));
const OnboardingFlow = lazy(() => import('./OnboardingFlow'));

/**
 * Main Application Hub
 * Orchestrates identity-based routing and session lifecycle management.
 * Fix: Completed the truncated file and added default export to resolve "no default export" error in index.tsx.
 */
const App: React.FC = () => {
    const [session, setSession] = useState<any | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            setProfile(data as UserProfile);
        } catch (err: any) {
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
            setSession(initialSession);
            if (initialSession) {
                fetchProfile(initialSession.user.id);
            } else {
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            setSession(currentSession);
            if (currentSession) {
                fetchProfile(currentSession.user.id);
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [fetchProfile]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    const handleProfileUpdate = () => {
        if (session) fetchProfile(session.user.id);
    };

    const handleSelectRole = async (role: Role, isExisting?: boolean) => {
        if (session) {
            setLoading(true);
            try {
                const { error } = await supabase
                    .from('profiles')
                    .update({ role })
                    .eq('id', session.user.id);
                
                if (error) throw error;
                await fetchProfile(session.user.id);
            } catch (err: any) {
                setError(formatError(err));
                setLoading(false);
            }
        }
    };

    if (loading) return <PageLoader />;

    if (!session) {
        return (
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="*" element={<Navigate to="/auth" replace />} />
                </Routes>
            </Suspense>
        );
    }

    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                <Route path="/" element={
                    !profile?.role || !profile.profile_completed ? (
                        <OnboardingFlow 
                            profile={profile!} 
                            onComplete={handleProfileUpdate} 
                            onStepChange={handleProfileUpdate}
                            onboardingStep={(profile as any)?.onboarding_step}
                        />
                    ) : (
                        profile.role === BuiltInRoles.SCHOOL_ADMINISTRATION || profile.role === BuiltInRoles.BRANCH_ADMIN ? (
                            <SchoolAdminDashboard 
                                profile={profile} 
                                onSelectRole={handleSelectRole} 
                                onProfileUpdate={handleProfileUpdate}
                                onSignOut={handleSignOut}
                            />
                        ) : profile.role === BuiltInRoles.PARENT_GUARDIAN ? (
                            <ParentDashboard 
                                profile={profile} 
                                onSelectRole={handleSelectRole} 
                                onProfileUpdate={handleProfileUpdate}
                                onSignOut={handleSignOut}
                            />
                        ) : profile.role === BuiltInRoles.STUDENT ? (
                            <StudentDashboard 
                                profile={profile} 
                                onSignOut={handleSignOut}
                                onSwitchRole={() => {}}
                                onSelectRole={handleSelectRole}
                            />
                        ) : profile.role === BuiltInRoles.TEACHER ? (
                            <TeacherDashboard 
                                profile={profile} 
                                onSwitchRole={() => {}}
                                onProfileUpdate={handleProfileUpdate}
                                onSignOut={handleSignOut}
                                onSelectRole={handleSelectRole}
                            />
                        ) : (
                            <MinimalAdminDashboard 
                                profile={profile} 
                                onSignOut={handleSignOut} 
                                onSelectRole={handleSelectRole} 
                            />
                        )
                    )
                } />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Suspense>
    );
};

export default App;