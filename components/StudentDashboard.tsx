import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { UserProfile, StudentDashboardData, AdmissionApplication, Role } from '../types';
import Spinner from './common/Spinner';
import StudentSidebar from './student/StudentSidebar';
import StudentHeader from './student/StudentHeader';
import StudentOnboardingWizard from './student/StudentOnboardingWizard';

// Import tab components
import DashboardTab from './student_tabs/DashboardTab';
import AcademicsTab from './student_tabs/AcademicsTab';
import ProfileTab from './student_tabs/ProfileTab';
import AnnouncementsTab from './student_tabs/AnnouncementsTab';
import SchoolInfoTab from './student_tabs/SchoolInfoTab';
import AttendanceTab from './student_tabs/AttendanceTab';
import ExamsTab from './student_tabs/ExamsTab';
import FeesTab from './student_tabs/FeesTab';
import DocumentsTab from './student_tabs/DocumentsTab';
import SupportTab from './student_tabs/SupportTab';
import { SchoolIcon } from './icons/SchoolIcon';

interface StudentDashboardProps {
    profile: UserProfile;
    onSignOut: () => void;
    onSwitchRole: () => void;
    onSelectRole?: (role: Role, isExisting?: boolean) => void; 
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ profile, onSignOut, onSwitchRole, onSelectRole }) => {
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // State for data and view type (student vs parent)
    const [isParentView, setIsParentView] = useState(false);
    const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
    const [currentAdmissionId, setCurrentAdmissionId] = useState<string | null>(null);
    const [allMyChildren, setAllMyChildren] = useState<AdmissionApplication[]>([]);
    const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // This effect runs once to determine the view type
    useEffect(() => {
        const initializeView = async () => {
            setLoading(true);
            if (!profile.id) { 
                setLoading(false); 
                setError("User ID not available."); 
                return; 
            }

            // Check if current user is a parent in the Parent Profile registry
            const { count, error: parentProfileError } = await supabase
                .from('parent_profiles')
                .select('id', { count: 'exact', head: true })
                .eq('id', profile.id);

            if (parentProfileError) {
                setError("Could not verify user type.");
                setLoading(false);
                return;
            }
            
            if (count && count > 0) { // It's a parent
                setIsParentView(true);
                const { data: childrenData, error: childrenError } = await supabase.rpc('get_my_children_profiles');

                if (childrenError) { 
                    setError("Could not fetch children list."); 
                    setLoading(false); 
                    return; 
                }
                
                const enrolledChildren = (childrenData || []).filter((child: any) => child.id);
                setAllMyChildren(enrolledChildren);

                if (enrolledChildren.length > 0) {
                    const firstChild = enrolledChildren[0];
                    setCurrentAdmissionId(firstChild.id);
                    setCurrentStudentId(firstChild.id);
                } else {
                    setLoading(false);
                    return;
                }
            } else { // It's a student
                setIsParentView(false);
                setCurrentStudentId(profile.id);
            }
        };

        initializeView();
    }, [profile]); 

    // This effect fetches the main dashboard data whenever the student ID to view changes
    const fetchDashboardData = useCallback(async () => {
        if (!currentStudentId) return;

        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.rpc('get_student_dashboard_data', { p_student_id: currentStudentId });
            
            if (error) {
                setError(`Failed to load dashboard data: ${error.message}`);
                console.error(error);
            } else {
                setDashboardData(data);
            }
        } catch (e: any) {
            setError(e.message || "Failed to load dashboard.");
        } finally {
            setLoading(false);
        }
    }, [currentStudentId]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);
    
    const handleSwitchStudent = async (newAdmissionId: string) => {
        if (newAdmissionId === currentAdmissionId) return; // No change

        setLoading(true);
        const { error: switchError } = await supabase.rpc('parent_switch_student_view', { p_new_admission_id: newAdmissionId });
        if (switchError) {
            setError(`Failed to switch student view: ${switchError.message}`);
            setLoading(false);
            return;
        }
        
        setCurrentAdmissionId(newAdmissionId);
        setCurrentStudentId(newAdmissionId);
    };
    
    if (dashboardData?.needs_onboarding) {
        return <StudentOnboardingWizard data={dashboardData} onComplete={fetchDashboardData} />;
    }

    const renderContent = () => {
        if (loading) {
            return <div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>;
        }
        
        if (isParentView && !currentStudentId) {
             return (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in duration-700">
                    <div className="p-6 bg-muted/30 rounded-full mb-4 border-2 border-dashed border-border">
                        <svg className="w-12 h-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">No Students Linked</h3>
                    <p className="text-muted-foreground mt-2 max-w-md">It seems you haven't enrolled any children yet, or their profiles haven't been approved by the admin.</p>
                </div>
             );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in shake duration-500">
                    <div className="p-4 bg-destructive/10 rounded-full mb-4">
                        <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Dashboard Unavailable</h3>
                    <p className="text-muted-foreground mt-2 max-w-md">{error}</p>
                    <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-lg">Reload Page</button>
                </div>
            );
        }
        
        if (!dashboardData) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in zoom-in-95">
                    <div className="p-6 bg-muted/20 rounded-full mb-4 border border-border">
                        <SchoolIcon className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Initializing Student Profile...</h3>
                    <p className="text-muted-foreground mt-2 max-w-md">We are setting up your dashboard. If this persists, please contact support.</p>
                    <button onClick={fetchDashboardData} className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 shadow-lg">
                        Retry Loading
                    </button>
                </div>
            );
        }

        switch (activeTab) {
            case 'Dashboard': return <DashboardTab data={dashboardData} />;
            case 'Academics': return <AcademicsTab data={dashboardData} onRefresh={fetchDashboardData} currentUserId={profile.id} />;
            case 'Profile': return <ProfileTab data={dashboardData} />;
            case 'Announcements': return <AnnouncementsTab data={dashboardData} />;
            case 'School Info': return <SchoolInfoTab />;
            case 'Attendance': return <AttendanceTab data={dashboardData} studentId={currentStudentId} />;
            case 'Exams & Grades': return <ExamsTab data={dashboardData} />;
            case 'Fees': return <FeesTab studentId={currentStudentId} />;
            case 'My Documents': return <DocumentsTab />;
            case 'Support': return <SupportTab />;
            default: return <DashboardTab data={dashboardData} />;
        }
    };
    
    return (
        <div className="flex h-screen bg-muted/40">
            <StudentSidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                profile={profile}
                isParentView={isParentView}
                onSwitchRole={onSwitchRole}
            />
            <div className="flex flex-col flex-1 overflow-hidden">
                <StudentHeader 
                    profile={profile} 
                    onSignOut={onSignOut} 
                    onSwitchRole={onSwitchRole}
                    onSelectRole={onSelectRole} 
                    onMenuClick={() => setIsSidebarOpen(true)}
                    pageTitle={activeTab}
                    isParentView={isParentView}
                    allMyChildren={allMyChildren}
                    currentChildId={currentAdmissionId}
                    onSwitchStudent={handleSwitchStudent}
                    currentStudentName={dashboardData?.profile?.display_name}
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StudentDashboard;