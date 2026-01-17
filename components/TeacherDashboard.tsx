
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { UserProfile, Role } from '../types';
import Header from './teacher/Header';
import { ProfileCreationPage } from './ProfileCreationPage';
import { TeacherIcon } from './icons/TeacherIcon'; // Added missing import

// Import the tab components
import MyClassesTab from './teacher_tabs/MyClassesTab';
import AttendanceTab from './teacher_tabs/AttendanceTab';
import CommunicationTab from './teacher_tabs/CommunicationTab';
import LessonPlannerTab from './teacher_tabs/LessonPlannerTab';
import { PerformanceTab } from './teacher_tabs/PerformanceTab';
import ProfessionalDevelopmentTab from './teacher_tabs/ProfessionalDevelopmentTab';


interface TeacherDashboardProps {
    profile: UserProfile;
    onSwitchRole: () => void;
    onSelectRole?: (role: Role, isExisting?: boolean) => void;
    onProfileUpdate: () => void;
    onSignOut: () => void;
}

const navItems = [
    { id: 'My Classes', label: 'My Classes', icon: <MyClassesTab.Icon className="w-5 h-5" /> },
    { id: 'Attendance', label: 'Attendance', icon: <AttendanceTab.Icon className="w-5 h-5" /> },
    { id: 'Lesson Planner', label: 'Lesson Planner', icon: <LessonPlannerTab.Icon className="w-5 h-5" /> },
    { id: 'Communication', label: 'Communication', icon: <CommunicationTab.Icon className="w-5 h-5" /> },
    { id: 'Performance', label: 'Performance', icon: <PerformanceTab.Icon className="w-5 h-5" /> },
    { id: 'Professional Development', label: 'Prof. Development', icon: <ProfessionalDevelopmentTab.Icon className="w-5 h-5" /> },
];

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ profile, onSwitchRole, onProfileUpdate, onSignOut, onSelectRole }) => {
    const [activeComponent, setActiveComponent] = useState('My Classes');
    
    const components: { [key: string]: React.ReactNode } = {
        'My Classes': <MyClassesTab currentUserId={profile.id} />,
        'Attendance': <AttendanceTab />,
        'Lesson Planner': <LessonPlannerTab currentUserId={profile.id} />,
        'Communication': <CommunicationTab currentUserId={profile.id} />,
        'Performance': <PerformanceTab currentUserId={profile.id} />,
        'Professional Development': <ProfessionalDevelopmentTab currentUserId={profile.id} />,
        'My Profile': <ProfileCreationPage 
                            profile={profile} 
                            role={profile.role!} 
                            onComplete={onProfileUpdate}
                            onBack={() => {}} 
                            showBackButton={false} 
                        />,
    };

    const renderComponent = () => {
        return components[activeComponent] || <MyClassesTab currentUserId={profile.id} />;
    };
    
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header 
                profile={profile}
                onSwitchRole={onSwitchRole}
                onSignOut={onSignOut}
                onProfileClick={() => setActiveComponent('My Profile')}
                onSelectRole={onSelectRole}
            />
             <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeComponent !== 'My Profile' && (
                     <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
                        <nav className="flex space-x-1 bg-muted p-1 rounded-xl border border-border min-w-max" aria-label="Tabs">
                            {navItems.map(item => {
                                const isActive = activeComponent === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveComponent(item.id)}
                                        className={`
                                            flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ease-in-out
                                            ${isActive 
                                                ? 'bg-card text-primary shadow-sm' 
                                                : 'text-muted-foreground hover:text-foreground'
                                            }
                                        `}
                                        aria-current={isActive ? 'page' : undefined}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                )}
                {renderComponent()}
            </main>
        </div>
    );
};

export default TeacherDashboard;
