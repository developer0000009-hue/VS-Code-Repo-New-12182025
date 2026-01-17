
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { UserProfile, Role } from '../types';
import { useRoles } from '../contexts/RoleContext';
import Spinner from './common/Spinner';
import EditUserModal from './EditUserModal';
import ThemeSwitcher from './common/ThemeSwitcher';
import { BellIcon } from './icons/BellIcon';
import ProfileDropdown from './common/ProfileDropdown';
import { PlusIcon } from './icons/PlusIcon';
import { SearchIcon } from './icons/SearchIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UsersIcon } from './icons/UsersIcon';
import { KeyIcon } from './icons/KeyIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';


interface SuperAdminDashboardProps {
    profile: UserProfile;
    onSelectRole: (role: Role, isExisting?: boolean) => void;
    onSignOut: () => void;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ profile, onSelectRole, onSignOut }) => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<string>('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof UserProfile; direction: 'ascending' | 'descending' } | null>({ key: 'display_name', direction: 'ascending' });
    const [currentPage, setCurrentPage] = useState(1);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleIsAdmin, setNewRoleIsAdmin] = useState(false);
    const [roleError, setRoleError] = useState('');
    const { roles, refetchRoles } = useRoles();

    const usersPerPage = 10;

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.rpc('get_all_users_for_admin');
            if (error) throw error;
            setUsers(data || []);
        } catch (err: any) {
            let finalMessage = 'Failed to fetch users: Please try again later.';
            if (typeof err === 'object' && err !== null && typeof err.message === 'string') {
                finalMessage = `Failed to fetch users: ${err.message}`;
            }
            setError(finalMessage);
            console.error('Original error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleAddNewRole = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedRoleName = newRoleName.trim();
        if (!trimmedRoleName) {
            setRoleError('Role name cannot be empty.');
            return;
        }
        if (roles.some(role => role.toLowerCase() === trimmedRoleName.toLowerCase())) {
            setRoleError('This role already exists.');
            return;
        }
        setRoleError('');

        const { error } = await supabase.rpc('add_new_role', { 
            role_name: trimmedRoleName,
            is_admin: newRoleIsAdmin 
        });

        if (error) {
            setRoleError(error.message);
        } else {
            setNewRoleName('');
            setNewRoleIsAdmin(false);
            await refetchRoles();
        }
    };

    const handleDownloadTemplate = () => {
        const headers = ['display_name', 'email', 'password', 'phone', 'role'];
        const csvContent = headers.join(',');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'user_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUploadClick = () => {
        alert('Placeholder: This feature is for testing purposes and will be fully implemented soon.');
    };

    const processedUsers = useMemo(() => {
        let filteredUsers = [...users];

        if (filterRole) {
            filteredUsers = filteredUsers.filter(user => user.role === filterRole);
        }

        if (searchTerm) {
            filteredUsers = filteredUsers.filter(user =>
                (user.display_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (sortConfig !== null) {
            filteredUsers.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                
                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        
        return filteredUsers;
    }, [users, searchTerm, filterRole, sortConfig]);

    const paginatedUsers = useMemo(() => {
        const indexOfLastUser = currentPage * usersPerPage;
        const indexOfFirstUser = indexOfLastUser - usersPerPage;
        return processedUsers.slice(indexOfFirstUser, indexOfLastUser);
    }, [processedUsers, currentPage, usersPerPage]);

    const requestSort = (key: keyof UserProfile) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1);
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
        setCurrentPage(1);
    };


    const handleUpdateUser = (updatedUser: UserProfile) => {
        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    const toggleUserActiveState = async (user: UserProfile) => {
        const newActiveState = !user.is_active;
        const { data, error } = await supabase
            .from('profiles')
            .update({ is_active: newActiveState })
            .eq('id', user.id)
            .select()
            .single();

        if (error) {
            alert('Failed to update user status.');
            console.error(error);
        } else if (data) {
            handleUpdateUser(data as UserProfile);
        }
    };
    
    const SortIcon: React.FC<{ direction: 'ascending' | 'descending' | null }> = ({ direction }) => {
        if (!direction) return <svg className="w-4 h-4 ml-1.5 text-muted-foreground/50 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>;
        if (direction === 'ascending') return <svg className="w-4 h-4 ml-1.5 text-foreground inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>;
        return <svg className="w-4 h-4 ml-1.5 text-foreground inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>;
    };

    const SortableHeader: React.FC<{ label: string; sortKey: keyof UserProfile }> = ({ label, sortKey }) => (
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted" onClick={() => requestSort(sortKey)}>
            {label}
            <SortIcon direction={sortConfig?.key === sortKey ? sortConfig.direction : null} />
        </th>
    );

    return (
        <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-foreground">Super Admin Dashboard</h1>
                        <p className="text-muted-foreground mt-1">Welcome, {profile.display_name}.</p>
                    </div>
                     <div className="flex items-center gap-2 sm:gap-4">
                        <ThemeSwitcher />
                         <button className="p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
                            <BellIcon className="h-5 w-5" />
                        </button>
                        <ProfileDropdown
                            profile={profile}
                            onSelectRole={onSelectRole}
                            onSignOut={onSignOut}
                        />
                    </div>
                </header>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-card p-6 rounded-xl shadow-md">
                        <h3 className="text-lg font-semibold text-muted-foreground">Total Users</h3>
                        <p className="text-4xl font-bold text-primary">{users.length}</p>
                    </div>
                     <div className="bg-card p-6 rounded-xl shadow-md">
                        <h3 className="text-lg font-semibold text-muted-foreground">Active Users</h3>
                        <p className="text-4xl font-bold text-green-500">{users.filter(u => u.is_active).length}</p>
                    </div>
                    <div className="bg-card p-6 rounded-xl shadow-md">
                        <h3 className="text-lg font-semibold text-muted-foreground">Role Management</h3>
                        <form onSubmit={handleAddNewRole} className="space-y-3 mt-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={newRoleName}
                                    onChange={(e) => setNewRoleName(e.target.value)}
                                    placeholder="New role name..."
                                    className="block w-full text-sm border-input rounded-md bg-background focus:ring-primary focus:border-primary"
                                />
                                <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Add</button>
                            </div>
                            <div className="flex items-center">
                                <input
                                    id="isAdminRole"
                                    type="checkbox"
                                    checked={newRoleIsAdmin}
                                    onChange={(e) => setNewRoleIsAdmin(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="isAdminRole" className="ml-2 block text-sm text-muted-foreground">
                                    Is Admin Role
                                </label>
                            </div>
                        </form>
                        {roleError && <p className="text-red-500 text-xs mt-1">{roleError}</p>}
                    </div>
                </div>

                <div className="bg-card shadow-lg rounded-xl p-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                        <h2 className="text-xl font-bold">User Management</h2>
                         <div className="flex items-center gap-4">
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="block w-full max-w-xs pl-3 pr-3 py-2 border border-border rounded-md leading-5 bg-background placeholder-muted-foreground focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                            />
                            <select
                                value={filterRole}
                                onChange={(e) => {
                                    setFilterRole(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="block w-full max-w-xs pl-3 pr-10 py-2 text-base border-border focus:outline-none focus:ring-ring focus:border-primary sm:text-sm rounded-md bg-background text-foreground"
                            >
                                <option value="">Filter by role (All)</option>
                                {roles.map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="mb-6 pb-4 border-b border-border">
                        <h3 className="text-lg font-semibold mb-2">Bulk User Creation</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            To create multiple user profiles for testing, download the CSV template, fill it out, and upload the file.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleDownloadTemplate}
                                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                Download Template
                            </button>
                            <button
                                onClick={handleUploadClick}
                                className="bg-muted hover:bg-muted/80 text-foreground font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                Upload CSV
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-8"><Spinner size="lg" /></div>
                    ) : error ? (
                        <p className="text-center text-red-400">{error}</p>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <SortableHeader label="User" sortKey="display_name" />
                                            <SortableHeader label="Role" sortKey="role" />
                                            <SortableHeader label="Status" sortKey="is_active" />
                                            <SortableHeader label="Verified" sortKey="email_confirmed_at" />
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-card divide-y divide-border">
                                        {paginatedUsers.map((user) => (
                                            <tr key={user.id} className={`${!user.is_active ? 'opacity-50' : ''}`}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-foreground">{user.display_name}</div>
                                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{user.role}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-800 text-green-100' : 'bg-gray-700 text-gray-200'}`}>
                                                        {user.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.email_confirmed_at ? 'bg-blue-800 text-blue-100' : 'bg-yellow-800 text-yellow-100'}`}>
                                                        {user.email_confirmed_at ? 'Yes' : 'No'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                    <button onClick={() => setEditingUser(user)} className="text-primary hover:text-primary/90">Edit</button>
                                                    <button onClick={() => toggleUserActiveState(user)} className={user.is_active ? 'text-red-500 hover:text-red-400' : 'text-green-500 hover:text-green-400'}>
                                                        {user.is_active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {processedUsers.length === 0 && !loading && <p className="text-center py-8 text-muted-foreground">No users found for the current filter.</p>}
                            </div>
                             {processedUsers.length > usersPerPage && (
                                <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                                    <span className="text-sm text-muted-foreground">
                                        Page {currentPage} of {Math.ceil(processedUsers.length / usersPerPage)}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 text-sm font-medium rounded-md bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(p + 1, Math.ceil(processedUsers.length / usersPerPage)))}
                                            disabled={currentPage * usersPerPage >= processedUsers.length}
                                            className="px-4 py-2 text-sm font-medium rounded-md bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            {editingUser && (
                <EditUserModal 
                    user={editingUser} 
                    onClose={() => setEditingUser(null)}
                    onSave={handleUpdateUser}
                />
            )}
        </div>
    );
};

export default SuperAdminDashboard;
