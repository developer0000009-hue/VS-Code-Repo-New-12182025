import React from 'react';
import { SchoolIcon } from '../icons/SchoolIcon';
import { DashboardIcon } from '../icons/DashboardIcon';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';
import { IdCardIcon } from '../icons/IdCardIcon';
import { MegaphoneIcon } from '../icons/MegaphoneIcon';
import { InfoIcon } from '../icons/InfoIcon';
import { XIcon } from '../icons/XIcon';
import { UserProfile } from '../../types';

import { ChecklistIcon } from '../icons/ChecklistIcon';
import { BarChartIcon } from '../icons/BarChartIcon';
import { FinanceIcon } from '../icons/FinanceIcon';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { SupportIcon } from '../icons/SupportIcon';
import { LogoutIcon } from '../icons/LogoutIcon';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    profile: UserProfile;
    isParentView: boolean;
    onSwitchRole: () => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <li>
        <button
            onClick={onClick}
            className={`flex items-center w-full text-left px-3 py-2.5 rounded-lg transition-colors duration-200 text-sm font-semibold ${
                isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
        >
            <span className="w-6">{icon}</span>
            <span className="ml-3">{label}</span>
        </button>
    </li>
);

const mainNavItems = [
    { id: 'Dashboard', icon: <DashboardIcon className="h-5 w-5" />, label: 'Dashboard' },
    { id: 'Academics', icon: <AcademicCapIcon className="h-5 w-5" />, label: 'Academics' },
    { id: 'Attendance', icon: <ChecklistIcon className="h-5 w-5" />, label: 'Attendance' },
    { id: 'Exams & Grades', icon: <BarChartIcon className="h-5 w-5" />, label: 'Exams & Grades' },
    { id: 'Fees', icon: <FinanceIcon className="h-5 w-5" />, label: 'Fees' },
    { id: 'Announcements', icon: <MegaphoneIcon className="h-5 w-5" />, label: 'Announcements' },
];

const secondaryNavItems = [
    { id: 'My Documents', icon: <DocumentTextIcon className="h-5 w-5" />, label: 'My Documents' },
    { id: 'School Info', icon: <InfoIcon className="h-5 w-5" />, label: 'School Info' },
    { id: 'Support', icon: <SupportIcon className="h-5 w-5" />, label: 'Support' },
];

const StudentSidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen, profile, isParentView, onSwitchRole }) => {
    
    const handleNavClick = (tab: string) => {
        setActiveTab(tab);
        setIsSidebarOpen(false);
    };

    return (
        <>
            {/* Overlay for mobile */}
            <div
                className={`fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsSidebarOpen(false)}
            ></div>

            <aside
                className={`fixed lg:relative top-0 left-0 h-full bg-card text-card-foreground border-r border-border flex flex-col transition-transform duration-300 ease-in-out z-50 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 w-64`}
            >
                <div className="flex items-center justify-between border-b border-border p-4 h-20 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <SchoolIcon className="h-8 w-8 text-primary" />
                        <span className="font-bold text-lg">Student Portal</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden p-1 rounded-md text-muted-foreground hover:bg-muted"
                    >
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>
                
                <nav className="flex-1 px-4 py-4 overflow-y-auto">
                    <ul className="space-y-2">
                        {mainNavItems.map(item => (
                            <NavItem
                                key={item.id}
                                icon={item.icon}
                                label={item.label}
                                isActive={activeTab === item.id}
                                onClick={() => handleNavClick(item.id)}
                            />
                        ))}
                    </ul>
                    <div className="mt-6 pt-4 border-t border-border">
                        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Resources</p>
                        <ul className="space-y-2">
                            {secondaryNavItems.map(item => (
                                <NavItem
                                    key={item.id}
                                    icon={item.icon}
                                    label={item.label}
                                    isActive={activeTab === item.id}
                                    onClick={() => handleNavClick(item.id)}
                                />
                            ))}
                        </ul>
                    </div>
                </nav>

                <div className="p-4 mt-auto border-t border-border">
                    {isParentView ? (
                        <div className="bg-muted p-3 rounded-lg border border-border">
                            <div className="flex items-center gap-3">
                                <img className="h-10 w-10 rounded-full" src={`https://api.dicebear.com/8.x/initials/svg?seed=${profile.display_name}`} alt="Parent avatar" />
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">Viewing as Parent</p>
                                    <p className="text-sm font-bold text-foreground truncate">{profile.display_name}</p>
                                </div>
                            </div>
                            <button
                                onClick={onSwitchRole}
                                className="w-full mt-3 flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground text-sm font-semibold py-2 rounded-md transition-colors"
                            >
                                <LogoutIcon className="w-4 h-4" />
                                Exit Student View
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => handleNavClick('Profile')}
                            className={`flex items-center w-full text-left p-2 rounded-lg transition-colors duration-200 ${ activeTab === 'Profile' ? 'bg-muted' : 'hover:bg-muted' }`}
                        >
                            <img className="h-10 w-10 rounded-full" src={`https://api.dicebear.com/8.x/initials/svg?seed=${profile.display_name}`} alt="User avatar" />
                            <div className="min-w-0 ml-3">
                                <p className="text-sm font-bold text-foreground truncate">{profile.display_name}</p>
                                <p className="text-xs text-muted-foreground truncate">View Profile</p>
                            </div>
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
};

export default StudentSidebar;