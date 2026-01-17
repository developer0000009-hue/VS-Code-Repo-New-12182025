
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
import { Role, BuiltInRoles } from '../../types';

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

const PERMISSIONS: Record<string, Set<string>> = {
    [BuiltInRoles.SCHOOL_ADMINISTRATION]: new Set(['all']),
    [BuiltInRoles.BRANCH_ADMIN]: new Set(['Dashboard', 'Analytics', 'User Management', 'Student Management', 'Teacher Management', 'Code Verification', 'Enquiries', 'Admissions', 'Classes', 'Courses', 'Attendance', 'Timetable', 'Homework', 'Finance', 'Facility Management', 'Meetings', 'Communication']),
    [BuiltInRoles.PRINCIPAL]: new Set(['Dashboard', 'Analytics', 'Teacher Management', 'Student Management', 'Classes', 'Courses', 'Attendance', 'Timetable', 'Homework', 'Communication']),
    [BuiltInRoles.HR_MANAGER]: new Set(['Dashboard', 'User Management', 'Teacher Management', 'Attendance', 'Meetings']),
    [BuiltInRoles.ACADEMIC_COORDINATOR]: new Set(['Dashboard', 'Student Management', 'Teacher Management', 'Classes', 'Courses', 'Timetable', 'Homework', 'Analytics']),
    [BuiltInRoles.ACCOUNTANT]: new Set(['Dashboard', 'Finance', 'Student Management', 'Admissions']),
};

export const getAdminMenu = (isHeadOfficeAdmin: boolean, userRole: Role): MenuGroup[] => {
    const allGroups: MenuGroup[] = [
        {
            id: 'overview',
            title: 'Insights',
            items: [
                { id: 'Dashboard', label: 'Command Center', icon: <DashboardIcon className="w-5 h-5" /> },
                { id: 'Analytics', label: 'School Analytics', icon: <ChartBarIcon className="w-5 h-5" /> },
            ]
        },
        {
            id: 'management',
            title: 'Governance',
            items: [
                { id: 'Branches', label: 'Institutional Branches', icon: <SchoolIcon className="w-5 h-5" /> },
                { id: 'User Management', label: 'Access Control', icon: <UsersIcon className="w-5 h-5" /> },
                { id: 'Student Management', label: 'Student Directory', icon: <StudentsIcon className="w-5 h-5" /> },
                { id: 'Teacher Management', label: 'Faculty Roster', icon: <TeacherIcon className="w-5 h-5" /> },
            ]
        },
        {
            id: 'admissions',
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
                { id: 'Homework', label: 'Assignments', icon: <BookIcon className="w-5 h-5" /> },
            ]
        },
        {
            id: 'operations',
            title: 'Institutional Ops',
            items: [
                { id: 'Finance', label: 'Finance & Fees', icon: <FinanceIcon className="w-5 h-5" /> },
                { id: 'Facility Management', label: 'Campus Resources', icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-4h8v4" /></svg> },
                { id: 'Meetings', label: 'Events & Sync', icon: <UsersIcon className="w-5 h-5" /> },
            ]
        },
        {
            id: 'communication',
            title: 'Network',
            items: [
                { id: 'Communication', label: 'Broadcasts', icon: <CommunicationIcon className="w-5 h-5" /> },
            ]
        }
    ];

    const userPermissions = PERMISSIONS[userRole] || new Set();
    const canAccessAll = userPermissions.has('all');

    return allGroups.map(group => {
        const filteredItems = group.items.filter(item => {
            if (item.id === 'Branches' && !isHeadOfficeAdmin) return false;
            return canAccessAll || userPermissions.has(item.id);
        });
        return { ...group, items: filteredItems };
    }).filter(group => group.items.length > 0);
};