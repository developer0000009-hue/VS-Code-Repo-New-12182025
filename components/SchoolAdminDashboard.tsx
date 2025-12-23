import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserProfile, Role, SchoolAdminProfileData, SchoolBranch, BuiltInRoles } from '../types';
import Navbar from './admin/Navbar';
import Sidebar from './admin/Sidebar';
import DashboardOverview from './admin/DashboardOverview';
import AdmissionsTab from './AdmissionsTab';
import EnquiryTab from './EnquiryTab';
import AttendanceTab from './AttendanceTab';
import FinanceTab from './FinanceTab';
import CommunicationTab from './CommunicationTab';
import { UserManagementTab } from './UserManagementTab';
import { ProfileCreationPage } from './ProfileCreationPage';
import FacilityManagementTab from './FacilityManagementTab';
import CoursesTab from './CoursesTab';
import MeetingsTab from './MeetingsTab';
import HomeworkTab from './HomeworkTab';
import StudentManagementTab from './StudentManagementTab';
import { supabase } from '../services/supabase';
import TimetableTab from './TimetableTab';
import CodeVerificationTab from './CodeVerificationTab';
import { BranchManagementTab } from './BranchManagementTab';
import Spinner from './common/Spinner';
import AnalyticsTab from './AnalyticsTab';
import TeachersManagementTab from './TeachersManagementTab';
import ClassesTab from './ClassesTab';
import { getAdminMenu } from './admin/AdminMenuConfig';
import { XIcon } from './icons/XIcon';

interface SchoolAdminDashboardProps {
    profile: UserProfile;
    onSelectRole: (role: Role, isExisting?: boolean) => void;
    onProfileUpdate: () => void;
    onSignOut: () => void;
}

const SchoolAdminDashboard: React.FC<SchoolAdminDashboardProps> = ({ profile, onSelectRole, onProfileUpdate, onSignOut }) => {
    const [activeComponent, setActiveComponent] = useState('Dashboard');
    const [schoolData, setSchoolData] = useState<SchoolAdminProfileData | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    const [branches, setBranches] = useState<SchoolBranch[]>([]);
    const [currentBranchId, setCurrentBranchId] = useState<number | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async () => {
        setLoadingData(true);
        setDataError(null);
        try {
            const [schoolRes, branchRes] = await Promise.all([
                supabase.from('school_admin_profiles').select('*').eq('user_id', profile.id).maybeSingle(),
                supabase.rpc('get_school_branches')
            ]);

            if (schoolRes.error && schoolRes.error.code !== 'PGRST116') throw schoolRes.error;
            if (branchRes.error) throw branchRes.error;

            setSchoolData(schoolRes.data);
            const sortedBranches = (branchRes.data || []).sort((a: SchoolBranch, b: SchoolBranch) => 
                (b.is_main_branch ? 1 : 0) - (a.is_main_branch ? 1 : 0)
            );
            setBranches(sortedBranches);

            // Maintain branch selection across navigations
            if (sortedBranches.length > 0) {
                const mainBranch = sortedBranches.find(b => b.is_main_branch);
                setCurrentBranchId(prevId => {
                    if (prevId && sortedBranches.some(b => b.id === prevId)) return prevId;
                    return mainBranch ? mainBranch.id : sortedBranches[0].id;
                });
            }

        } catch (e: any) {
            console.error("Dashboard Data Fetch Error:", e);
            setDataError(e.message || "Failed to synchronize institutional data.");
        } finally {
            setLoadingData(false);
        }
    }, [profile.id]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const isHeadOfficeAdmin = profile.role === BuiltInRoles.SCHOOL_ADMINISTRATION;

    const menuGroups = useMemo(() => {
        if (!profile.role) return [];
        return getAdminMenu(isHeadOfficeAdmin, profile.role);
    }, [isHeadOfficeAdmin, profile.role]);

    const currentBranch = useMemo(() => branches.find(b => b.id === currentBranchId) || null, [branches, currentBranchId]);

    if (loadingData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
                <Spinner size="lg" />
                <p className="text-xs font-black uppercase text-muted-foreground animate-pulse tracking-widest">Initializing Administrative Context</p>
            </div>
        );
    }

    if (dataError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 text-center">
                <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
                    <XIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Sync Error</h3>
                <p className="text-muted-foreground max-w-md mb-6">{dataError}</p>
                <button onClick={fetchDashboardData} className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all">
                    Retry Sync
                </button>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeComponent) {
            case 'Dashboard': return <DashboardOverview schoolProfile={schoolData} currentBranch={currentBranch} profile={profile} onNavigateToBranches={() => setActiveComponent('Branches')} />;
            case 'Profile': return <ProfileCreationPage profile={profile} role={profile.role!} onComplete={onProfileUpdate} onBack={() => setActiveComponent('Dashboard')} showBackButton={true} />;
            case 'Branches': return <BranchManagementTab isHeadOfficeAdmin={isHeadOfficeAdmin} branches={branches} isLoading={loadingData} error={dataError} onBranchUpdate={fetchDashboardData} onSelectBranch={setCurrentBranchId} schoolProfile={schoolData} />;
            case 'Admissions': return <AdmissionsTab branchId={currentBranchId} />;
            case 'Enquiries': return <EnquiryTab branchId={currentBranchId} onNavigate={setActiveComponent} />;
            case 'Code Verification': return <CodeVerificationTab branchId={currentBranchId} />;
            case 'Student Management': return <StudentManagementTab />;
            case 'Teacher Management': return <TeachersManagementTab profile={profile} branchId={currentBranchId} />;
            case 'Classes': return <ClassesTab branchId={currentBranchId} />;
            case 'Courses': return <CoursesTab profile={profile} />;
            case 'Attendance': return <AttendanceTab />;
            case 'Timetable': return <TimetableTab />;
            case 'Finance': return <FinanceTab profile={profile} branchId={currentBranchId} />;
            case 'Communication': return <CommunicationTab profile={profile} />;
            case 'User Management': return <UserManagementTab profile={profile} isHeadOfficeAdmin={isHeadOfficeAdmin} />;
            case 'Analytics': return <AnalyticsTab />;
            case 'Meetings': return <MeetingsTab />;
            case 'Homework': return <HomeworkTab />;
            case 'Facility Management': return <FacilityManagementTab />;
            default: return <DashboardOverview schoolProfile={schoolData} currentBranch={currentBranch} profile={profile} onNavigateToBranches={() => setActiveComponent('Branches')} />;
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
            <Sidebar 
                activeComponent={activeComponent}
                setActiveComponent={setActiveComponent}
                isCollapsed={isSidebarCollapsed}
                setCollapsed={setIsSidebarCollapsed}
                isBranchAdmin={!isHeadOfficeAdmin}
                isHeadOfficeAdmin={isHeadOfficeAdmin}
                menuGroups={menuGroups}
            />

            <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out h-screen overflow-hidden ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-[280px]'}`}>
                <Navbar 
                    activeComponent={activeComponent}
                    setActiveComponent={setActiveComponent}
                    isBranchAdmin={!isHeadOfficeAdmin}
                    isHeadOfficeAdmin={isHeadOfficeAdmin}
                    profile={profile}
                    onSelectRole={onSelectRole}
                    onSignOut={onSignOut}
                    branches={branches}
                    currentBranchId={currentBranchId}
                    onSwitchBranch={setCurrentBranchId}
                    menuGroups={menuGroups}
                />
                
                <main className="flex-grow w-full max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8 custom-scrollbar overflow-y-auto">
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SchoolAdminDashboard;