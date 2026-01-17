import React from 'react';
import { Role, BuiltInRoles } from './types';
import { SchoolIcon } from './components/icons/SchoolIcon';
import { ParentIcon } from './components/icons/ParentIcon';
import { StudentIcon } from './components/icons/StudentIcon';
import { TeacherIcon } from './components/icons/TeacherIcon';
import { TransportIcon } from './components/icons/TransportIcon';
import { CartIcon } from './components/icons/CartIcon';
import { BriefcaseIcon } from './components/icons/BriefcaseIcon';
import { ClipboardListIcon } from './components/icons/ClipboardListIcon';
import { UserIcon } from './components/icons/UserIcon';
import { FinanceIcon } from './components/icons/FinanceIcon';

// Maps roles to their specific enterprise-grade icons
export const ROLE_ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
    [BuiltInRoles.SCHOOL_ADMINISTRATION]: SchoolIcon,
    [BuiltInRoles.BRANCH_ADMIN]: SchoolIcon,
    [BuiltInRoles.PARENT_GUARDIAN]: ParentIcon,
    [BuiltInRoles.STUDENT]: StudentIcon,
    [BuiltInRoles.TEACHER]: TeacherIcon,
    [BuiltInRoles.TRANSPORT_STAFF]: TransportIcon,
    [BuiltInRoles.ECOMMERCE_OPERATOR]: CartIcon,
    [BuiltInRoles.PRINCIPAL]: UserIcon,
    [BuiltInRoles.HR_MANAGER]: BriefcaseIcon,
    [BuiltInRoles.ACADEMIC_COORDINATOR]: ClipboardListIcon,
    [BuiltInRoles.ACCOUNTANT]: FinanceIcon,
};

// Standard UI sort order for role lists - Updated as per user request
export const ROLE_ORDER: Role[] = [
    BuiltInRoles.PARENT_GUARDIAN,
    BuiltInRoles.SCHOOL_ADMINISTRATION,
    BuiltInRoles.STUDENT,
    BuiltInRoles.TEACHER,
    BuiltInRoles.PRINCIPAL,
    BuiltInRoles.HR_MANAGER,
    BuiltInRoles.ACADEMIC_COORDINATOR,
    BuiltInRoles.ACCOUNTANT,
    BuiltInRoles.TRANSPORT_STAFF,
    BuiltInRoles.ECOMMERCE_OPERATOR,
];