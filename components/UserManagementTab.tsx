import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { UserProfile, Role, BuiltInRoles } from '../types';
import { useRoles } from '../contexts/RoleContext';
import Spinner from './common/Spinner';
import { PlusIcon } from './icons/PlusIcon';
import { SearchIcon } from './icons/SearchIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UsersIcon } from './icons/UsersIcon';
import { XIcon } from './icons/XIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { LockIcon } from './icons/LockIcon';
import { EyeIcon } from './icons/EyeIcon';
import ConfirmationModal from './common/ConfirmationModal';
import { AddStudentModal } from './StudentManagementTab';
import EditUserModal from './EditUserModal';
import { KeyIcon } from './icons/KeyIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ClockIcon } from './icons/ClockIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';

// --- Types ---

type PermissionLevel = 'FULL' | 'READ' | 'NONE';

interface PermissionChangeLog {
    id: string;
    role: string;
    module: string;
    oldLevel: PermissionLevel;
    newLevel: PermissionLevel;
    modifiedBy: string;
    timestamp: Date;
}

const MODULES = [
    'Dashboard', 
    'Admissions', 
    'Students', 
    'Academics', 
    'Finance', 
    'Transport', 
    'Settings',
    'Reports',
    'HR & Payroll'
];

const DEFAULT_MATRIX: Record<string, Record<string, PermissionLevel>> = {
    [BuiltInRoles.SCHOOL_ADMINISTRATION]: { Dashboard: 'FULL', Admissions: 'FULL', Students: 'FULL', Academics: 'FULL', Finance: 'FULL', Transport: 'FULL', Settings: 'FULL', Reports: 'FULL', 'HR & Payroll': 'FULL' },
    [BuiltInRoles.BRANCH_ADMIN]:          { Dashboard: 'FULL', Admissions: 'FULL', Students: 'FULL', Academics: 'READ', Finance: 'READ', Transport: 'FULL', Settings: 'READ', Reports: 'FULL', 'HR & Payroll': 'READ' },
    [BuiltInRoles.TEACHER]:               { Dashboard: 'READ', Admissions: 'NONE', Students: 'READ', Academics: 'FULL', Finance: 'NONE', Transport: 'NONE', Settings: 'NONE', Reports: 'READ', 'HR & Payroll': 'NONE' },
    [BuiltInRoles.STUDENT]:               { Dashboard: 'READ', Admissions: 'NONE', Students: 'NONE', Academics: 'READ', Finance: 'NONE', Transport: 'READ', Settings: 'NONE', Reports: 'NONE', 'HR & Payroll': 'NONE' },
    [BuiltInRoles.PARENT_GUARDIAN]:       { Dashboard: 'READ', Admissions: 'READ', Students: 'READ', Academics: 'READ', Finance: 'READ', Transport: 'READ', Settings: 'NONE', Reports: 'NONE', 'HR & Payroll': 'NONE' },
};

// --- Sub-Components ---

const PermissionCell: React.FC<{ 
    level: PermissionLevel; 
    onChange: (newLevel: PermissionLevel) => void; 
    isHeadOfficeAdmin: boolean;
    roleName: string; 
}> = ({ level, onChange, isHeadOfficeAdmin, roleName }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Styling based on level
    const getStyles = (lvl: PermissionLevel) => {
        switch (lvl) {
            case 'FULL': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30';
            case 'READ': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30';
            default: return 'bg-muted text-muted-foreground border-border opacity-70';
        }
    };

    const getIcon = (lvl: PermissionLevel) => {
        switch (lvl) {
            case 'FULL': return <CheckCircleIcon className="w-3.5 h-3.5" />;
            case 'READ': return <EyeIcon className="w-3.5 h-3.5" />;
            default: return <LockIcon className="w-3.5 h-3.5" />;
        }
    };

    const handleSelect = (lvl: PermissionLevel) => {
        onChange(lvl);
        setIsOpen(false);
    };

    if (!isHeadOfficeAdmin || roleName === BuiltInRoles.SCHOOL_ADMINISTRATION) {
         // Read-only view for non-admins or for the Admin role itself (self-lock)
         return (
            <div className={`flex justify-center items-center w-full h-full py-3`}>
                <span className={`inline-flex items-center justify-center gap-1.5 w-28 py-1.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${getStyles(level)} cursor-default`}>
                    {getIcon(level)} {level}
                </span>
            </div>
         );
    }

    return (
        <div className="relative flex justify-center items-center w-full h-full py-2" ref={ref}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`relative inline-flex items-center justify-between gap-2 w-28 px-2 py-1.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border transition-all duration-200 hover:shadow-md active:scale-95 ${getStyles(level)}`}
            >
                <span className="flex items-center gap-1.5">{getIcon(level)} {level}</span>
                <ChevronDownIcon className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 w-36 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in zoom-in-95 duration-150">
                    {(['FULL', 'READ', 'NONE'] as PermissionLevel[]).map((opt) => (
                        <button
                            key={opt}
                            onClick={() => handleSelect(opt)}
                            className={`
                                w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-left hover:bg-muted transition-colors
                                ${opt === level ? 'bg-primary/5 text-primary' : 'text-muted-foreground'}
                            `}
                        >
                            {getIcon(opt)}
                            {opt === 'FULL' ? 'Full Access' : opt === 'READ' ? 'Read Only' : 'No Access'}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const RoleConfigPanel: React.FC<{ 
    role: string; 
    permissions: Record<string, PermissionLevel>;
    onClose: () => void; 
    onBulkUpdate: (level: PermissionLevel) => void;
    logs: PermissionChangeLog[];
}> = ({ role, permissions, onClose, onBulkUpdate, logs }) => {
    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-card border-l border-border shadow-2xl z-[60] flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-lg text-foreground">{role}</h3>
                    <p className="text-xs text-muted-foreground">Configuration & Audit</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-muted rounded-full text-muted-foreground"><XIcon className="w-5 h-5"/></button>
            </div>

            <div className="p-6 border-b border-border space-y-4">
                <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Bulk Actions</h4>
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => onBulkUpdate('FULL')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors gap-1">
                        <CheckCircleIcon className="w-5 h-5"/>
                        <span className="text-[10px] font-bold">All Full</span>
                    </button>
                    <button onClick={() => onBulkUpdate('READ')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors gap-1">
                        <EyeIcon className="w-5 h-5"/>
                        <span className="text-[10px] font-bold">All Read</span>
                    </button>
                    <button onClick={() => onBulkUpdate('NONE')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-border bg-muted hover:bg-muted/80 text-muted-foreground transition-colors gap-1">
                        <LockIcon className="w-5 h-5"/>
                        <span className="text-[10px] font-bold">Revoke All</span>
                    </button>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
                <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-4">Recent Changes</h4>
                <div className="relative border-l-2 border-border ml-2 space-y-6">
                    {logs.filter(l => l.role === role).length === 0 ? (
                        <p className="text-sm text-muted-foreground italic pl-6">No changes recorded in this session.</p>
                    ) : (
                        logs.filter(l => l.role === role).map(log => (
                            <div key={log.id} className="relative pl-6">
                                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-card"></div>
                                <p className="text-xs text-muted-foreground mb-1">{log.timestamp.toLocaleTimeString()}</p>
                                <p className="text-sm font-medium text-foreground">
                                    Changed <strong>{log.module}</strong> from <span className="font-mono text-xs bg-muted px-1 rounded">{log.oldLevel}</span> to <span className="font-mono text-xs bg-primary/10 text-primary px-1 rounded">{log.newLevel}</span>
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1">by {log.modifiedBy}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
            
            <div className="p-4 border-t border-border bg-muted/20 text-center">
                <p className="text-xs text-muted-foreground">Last synced: Just now</p>
            </div>
        </div>
    );
};

// --- Main Component ---

// FIX: Add profile to props to provide user context.
interface UserManagementTabProps {
    isHeadOfficeAdmin: boolean;
    profile: UserProfile;
}

export const UserManagementTab: React.FC<UserManagementTabProps> = ({ isHeadOfficeAdmin, profile }) => {
    const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
    
    // --- Users State ---
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('All');
    const { roles } = useRoles();

    // --- Roles & Permissions State ---
    const [matrix, setMatrix] = useState(DEFAULT_MATRIX);
    const [logs, setLogs] = useState<PermissionChangeLog[]>([]);
    const [selectedRoleForConfig, setSelectedRoleForConfig] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // --- Fetch Users ---
    const fetchUsers = useCallback(async () => {
        setLoadingUsers(true);
        const { data, error } = await supabase.rpc('get_all_users_for_admin');
        if (!error && data) {
            setUsers(data as UserProfile[]);
        }
        setLoadingUsers(false);
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // --- Permissions Logic ---

    const handlePermissionChange = (role: string, module: string, newLevel: PermissionLevel) => {
        setMatrix(prev => {
            const oldLevel = prev[role][module];
            if (oldLevel === newLevel) return prev;

            // Log the change
            const newLog: PermissionChangeLog = {
                id: Math.random().toString(36).substr(2, 9),
                role,
                module,
                oldLevel,
                newLevel,
                // FIX: Use the display name from the passed profile prop for audit logging.
                modifiedBy: profile.display_name,
                timestamp: new Date()
            };
            setLogs(currentLogs => [newLog, ...currentLogs]);
            setHasUnsavedChanges(true);

            return {
                ...prev,
                [role]: {
                    ...prev[role],
                    [module]: newLevel
                }
            };
        });
    };

    const handleBulkRoleUpdate = (role: string, level: PermissionLevel) => {
        setMatrix(prev => {
            const newRolePerms: Record<string, PermissionLevel> = {};
            MODULES.forEach(m => newRolePerms[m] = level);
            setHasUnsavedChanges(true);
            return {
                ...prev,
                [role]: newRolePerms
            };
        });
    };

    const saveChanges = async () => {
        setIsSaving(true);
        // Simulation of API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setHasUnsavedChanges(false);
        setIsSaving(false);
        // In a real app, you'd push `matrix` to your backend
    };

    // --- Render Helpers ---

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = !searchTerm || (
                (user.display_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
            const matchesRole = filterRole === 'All' || user.role === filterRole;
            return matchesSearch && matchesRole;
        });
    }, [users, searchTerm, filterRole]);

    return (
        <div className="space-y-6 relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div>
                   <h2 className="text-2xl font-bold text-foreground tracking-tight">User Management</h2>
                   <p className="text-muted-foreground text-sm mt-1">Manage accounts, roles, and centralized permissions.</p>
                </div>

                <div className="bg-muted p-1 rounded-xl border border-border inline-flex shadow-inner">
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'users' ? 'bg-card text-foreground shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Users
                    </button>
                    <button 
                        onClick={() => setActiveTab('roles')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'roles' ? 'bg-card text-foreground shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Roles & Permissions
                    </button>
                </div>
            </div>

            {/* USERS TAB */}
            {activeTab === 'users' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                     <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/10 flex justify-between items-center gap-4">
                             <div className="relative w-full max-w-md">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                                <input 
                                    type="text" 
                                    placeholder="Search users..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
                                />
                            </div>
                            <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="h-9 px-3 bg-background border border-input rounded-lg text-sm focus:outline-none">
                                <option value="All">All Roles</option>
                                {roles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/30 border-b border-border text-xs font-bold uppercase text-muted-foreground tracking-wider">
                                    <tr>
                                        <th className="p-4">User Identity</th>
                                        <th className="p-4">Role</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {loadingUsers ? (
                                        <tr><td colSpan={4} className="p-8 text-center"><Spinner/></td></tr>
                                    ) : filteredUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold shadow-sm">
                                                        {user.display_name ? user.display_name.charAt(0) : '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground text-sm">{user.display_name}</p>
                                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4"><span className="px-2 py-1 rounded bg-muted text-xs font-bold">{user.role}</span></td>
                                            <td className="p-4">
                                                 <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${user.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button className="text-muted-foreground hover:text-primary"><EditIcon className="w-4 h-4"/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </div>
                </div>
            )}

            {/* ROLES TAB */}
            {activeTab === 'roles' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                     <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
                        
                        {/* Legend Header */}
                        <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
                             <div className="flex gap-4 text-xs font-medium text-muted-foreground">
                                 <div className="flex items-center gap-1.5"><CheckCircleIcon className="w-4 h-4 text-emerald-500"/> Full Access</div>
                                 <div className="flex items-center gap-1.5"><EyeIcon className="w-4 h-4 text-blue-500"/> Read Only</div>
                                 <div className="flex items-center gap-1.5"><LockIcon className="w-4 h-4 text-muted-foreground"/> Restricted</div>
                             </div>
                             {hasUnsavedChanges && (
                                 <div className="flex items-center gap-3 animate-in slide-in-from-right-4 fade-in">
                                     <span className="text-xs text-amber-600 font-bold italic">Unsaved changes</span>
                                     <button onClick={saveChanges} disabled={isSaving} className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow-lg hover:bg-primary/90 flex items-center gap-2 transition-all">
                                         {isSaving ? <Spinner size="sm" className="text-white"/> : 'Save Now'}
                                     </button>
                                 </div>
                             )}
                        </div>

                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-card">
                                        {/* Sticky Corner Module Header */}
                                        <th className="p-4 text-left font-extrabold text-xs text-muted-foreground uppercase tracking-wider w-[180px] bg-card sticky left-0 z-30 border-b border-r border-border/50 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)]">
                                            <div className="flex items-center gap-2">
                                                <ShieldCheckIcon className="w-4 h-4 text-primary"/> Module
                                            </div>
                                        </th>
                                        {/* Role Headers */}
                                        {Object.keys(matrix).map((role) => (
                                            <th key={role} className="p-4 text-center min-w-[160px] bg-card border-b border-r border-border/50 last:border-r-0 z-20 group">
                                                <div 
                                                    className="flex items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 py-2 rounded-lg transition-colors"
                                                    onClick={() => isHeadOfficeAdmin && setSelectedRoleForConfig(role)}
                                                >
                                                    <span className="font-bold text-xs text-foreground uppercase tracking-wider">{role.replace('School Administration', 'Head Office')}</span>
                                                    {isHeadOfficeAdmin && <EditIcon className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"/>}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {MODULES.map((module, idx) => (
                                        <tr key={module} className="hover:bg-muted/20 transition-colors group/row">
                                            {/* Sticky Module Column */}
                                            <td className="p-4 font-bold text-sm text-foreground bg-card sticky left-0 z-20 border-r border-border/50 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                                                {module}
                                            </td>
                                            {Object.keys(matrix).map((role) => (
                                                <td key={`${role}-${module}`} className="p-2 border-r border-border/50 last:border-r-0 relative group/cell">
                                                    {/* Hover Guides */}
                                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/cell:opacity-100 pointer-events-none transition-opacity"></div>
                                                    
                                                    <PermissionCell 
                                                        level={matrix[role][module] || 'NONE'} 
                                                        onChange={(newLevel) => handlePermissionChange(role, module, newLevel)}
                                                        isHeadOfficeAdmin={isHeadOfficeAdmin}
                                                        roleName={role}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </div>
                </div>
            )}

            {/* Role Configuration Side Panel */}
            {selectedRoleForConfig && (
                <>
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={() => setSelectedRoleForConfig(null)}></div>
                    <RoleConfigPanel 
                        role={selectedRoleForConfig} 
                        permissions={matrix[selectedRoleForConfig]}
                        onClose={() => setSelectedRoleForConfig(null)}
                        onBulkUpdate={(lvl) => handleBulkRoleUpdate(selectedRoleForConfig, lvl)}
                        logs={logs}
                    />
                </>
            )}
        </div>
    );
};
