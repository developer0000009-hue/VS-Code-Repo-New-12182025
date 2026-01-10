
import React from 'react';
import { DashboardIcon } from '../icons/DashboardIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { SchoolIcon } from '../icons/SchoolIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { StudentsIcon } from '../icons/StudentsIcon';
import { TeacherIcon } from '../icons/TeacherIcon';
import { KeyIcon } from '../icons/KeyIcon';
import { ClipboardListIcon } from '../icons/ClipboardListIcon';
import { ClassIcon } from '../icons/ClassIcon';
import { CoursesIcon } from '../icons/CoursesIcon';
import { ChecklistIcon } from '../icons/ChecklistIcon';
import { TimetableIcon } from '../icons/TimetableIcon';
import { BookIcon } from '../icons/BookIcon';
import { FinanceIcon } from '../icons/FinanceIcon';
import { CommunicationIcon } from '../icons/CommunicationIcon';
import { MailIcon } from '../icons/MailIcon';
import { BuiltInRoles } from '../../types';

export interface MenuItem {
    id: string;
    label: string;
    icon: React.ReactNode;
}

export interface MenuGroup {
    id: string;
    title: string;
    items: MenuItem[];
}

export const getAdminMenu = (isHeadOfficeAdmin: boolean, userRole: string): MenuGroup[] => {
    return [
        {
            id: 'overview',
            title: 'Insights',
            items: [
                { id: 'Dashboard', label: 'Command Center', icon: <DashboardIcon className="w-5 h-5" /> },
                { id: 'Analytics', label: 'School Analytics', icon: <ChartBarIcon className="w-5 h-5" /> },
            ]
        },
        {
            id: 'governance',
            title: 'Governance',
            items: [
                ...(isHeadOfficeAdmin ? [{ id: 'Branches', label: 'Institutional Branches', icon: <SchoolIcon className="w-5 h-5" /> }] : []),
                { id: 'User Management', label: 'Access Control', icon: <UsersIcon className="w-5 h-5" /> },
                { id: 'Student Management', label: 'Student Directory', icon: <StudentsIcon className="w-5 h-5" /> },
                { id: 'Teacher Management', label: 'Faculty Roster', icon: <TeacherIcon className="w-5 h-5" /> },
            ]
        },
        {
            id: 'enrollment',
            title: 'Enrollment',
            items: [
                { id: 'Code Verification', label: 'Quick Verification', icon: <KeyIcon className="w-5 h-5" /> },
                { id: 'Enquiries', label: 'Enquiry Desk', icon: <MailIcon className="w-5 h-5" /> },
                { id: 'Admissions', label: 'Admission Vault', icon: <ClipboardListIcon className="w-5 h-5" /> },
            ]
        },
        {
            id: 'academics',
            title: 'Academics',
            items: [
                { id: 'Classes', label: 'Grades & Sections', icon: <ClassIcon className="w-5 h-5" /> },
                { id: 'Courses', label: 'Curriculum Master', icon: <CoursesIcon className="w-5 h-5" /> },
                { id: 'Attendance', label: 'Attendance Monitor', icon: <ChecklistIcon className="w-5 h-5" /> },
                { id: 'Timetable', label: 'Master Schedule', icon: <TimetableIcon className="w-5 h-5" /> },
            ]
        }
    ];
};
