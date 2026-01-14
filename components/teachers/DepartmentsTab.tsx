
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { SchoolDepartment, TeacherExtended } from '../../types';
import Spinner from '../common/Spinner';
import { GridIcon } from '../icons/GridIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { BookIcon } from '../icons/BookIcon';
import { HeatmapIcon } from '../icons/HeatmapIcon';
import { UserPlusIcon } from '../icons/UserPlusIcon';
import { XIcon } from '../icons/XIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { SearchIcon } from '../icons/SearchIcon';
import { UserIcon } from '../icons/UserIcon';
import { BriefcaseIcon } from '../icons/BriefcaseIcon';

interface DepartmentsTabProps {
    teachers: TeacherExtended[];
    branchId: number | null;
}

// Helper to safely format errors
const formatError = (err: any): string => {
    if (typeof err === 'string') return err;
    if (err?.message) return err.message;
    return "An unknown error occurred";
};

const DepartmentsTab: React.FC<DepartmentsTabProps> = ({ teachers, branchId }) => {
    const [departments, setDepartments] = useState<SchoolDepartment[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<SchoolDepartment | null>(null);
    const [activeModalTab, setActiveModalTab] = useState<'details' | 'faculty'>('details');
    
    // Form State
    const [formData, setFormData] = useState({ name: '', description: '', hod_id: '' });
    const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(new Set());
    const [teacherSearch, setTeacherSearch] = useState('');
    
    const [isSaving, setIsSaving] = useState(false);

    const fetchDepartments = useCallback(async () => {
        if (!branchId) {
            setDepartments([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_school_departments_stats', { p_branch_id: branchId });
            if (error) throw error;
            setDepartments(data || []);
        } catch (err: any) {
            console.error('Fetch departments error:', err);
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => {
        fetchDepartments();
    }, [fetchDepartments]);

    const handleOpenModal = (dept?: SchoolDepartment) => {
        setEditingDept(dept || null);
        setFormData({
            name: dept?.name || '',
            description: dept?.description || '',
            hod_id: dept?.hod_id || ''
        });
        
        // Pre-select teachers currently in this department
        if (dept) {
            const deptTeachers = teachers.filter(t => t.details?.department === dept.name).map(t => t.id);
            setSelectedTeacherIds(new Set(deptTeachers));
        } else {
            setSelectedTeacherIds(new Set());
        }
        
        setActiveModalTab('details');
        setTeacherSearch('');
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // 1. Save Department (Create or Update)
            const { error: deptError } = await supabase.rpc('manage_school_department', {
                p_id: editingDept?.id || null,
                p_name: formData.name,
                p_description: formData.description,
                p_hod_id: formData.hod_id || null,
                p_branch_id: branchId,
                p_delete: false
            });

            if (deptError) throw deptError;

            // 2. Handle Teacher Assignments
            // Identify original teachers in this department (if editing)
            const originalTeachers = editingDept 
                ? teachers.filter(t => t.details?.department === editingDept.name).map(t => t.id) 
                : [];
            
            const currentSelection = Array.from(selectedTeacherIds);
            
            // Teachers to remove (were in dept, but now unchecked)
            const toRemove = originalTeachers.filter(id => !selectedTeacherIds.has(id));
            
            // Teachers to add/update (checked)
            // Note: This includes teachers who were already there (to handle renaming) and new additions
            const toUpdate = currentSelection;

            const updates: Promise<any>[] = [];

            if (toRemove.length > 0) {
                updates.push(supabase.rpc('bulk_update_teacher_profiles', {
                    p_teacher_ids: toRemove,
                    p_updates: { department: null } // Remove from dept
                }));
            }

            if (toUpdate.length > 0) {
                updates.push(supabase.rpc('bulk_update_teacher_profiles', {
                    p_teacher_ids: toUpdate,
                    p_updates: { department: formData.name } // Assign new/updated name
                }));
            }

            if (updates.length > 0) {
                await Promise.all(updates);
            }
            
            setIsModalOpen(false);
            fetchDepartments(); // Refresh stats
            // Ideally trigger a refresh of teachers in parent component too, but for now stats update is key
        } catch (error: any) {
            alert(`Error: ${formatError(error)}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (dept: SchoolDepartment) => {
        if (dept.teacher_count && dept.teacher_count > 0) {
            alert(`Cannot delete department. There are ${dept.teacher_count} active faculty members assigned. Please reassign them first.`);
            return;
        }
        if (dept.course_count && dept.course_count > 0) {
            alert(`Cannot delete department. There are ${dept.course_count} courses linked. Please reassign them first.`);
            return;
        }

        if (!confirm(`Are you sure you want to delete the ${dept.name} department? This action cannot be undone.`)) return;
        
        try {
            const { error } = await supabase.rpc('manage_school_department', {
                p_id: dept.id, p_name: '', p_description: '', p_hod_id: null, p_branch_id: null, p_delete: true
            });
            if (error) throw error;
            fetchDepartments();
        } catch (error: any) {
             alert(`Error: ${formatError(error)}`);
        }
    };

    const toggleTeacherSelection = (id: string) => {
        const newSet = new Set(selectedTeacherIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedTeacherIds(newSet);
    };

    // Filter teachers for the modal list
    const filteredTeachersForModal = useMemo(() => {
        return teachers.filter(t => 
            t.display_name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
            t.email.toLowerCase().includes(teacherSearch.toLowerCase())
        );
    }, [teachers, teacherSearch]);

    // Mock Workload Data generation based on departments
    const workloadData = departments.slice(0, 5).map(dept => ({
        name: dept.name,
        load: Math.floor(Math.random() * 40) + 60, // Random load 60-100%
        teachers: dept.teacher_count || 0
    }));

    if (loading) return <div className="flex justify-center p-12"><Spinner size="lg"/></div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-foreground">Department Management</h2>
                    <p className="text-muted-foreground text-sm">Organize faculty into departments and manage leadership.</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()} 
                    className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 flex items-center gap-2 transition-all hover:-translate-y-0.5 active:scale-95"
                >
                    <PlusIcon className="w-5 h-5"/> Add Department
                </button>
            </div>

            {departments.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 border-2 border-dashed border-border rounded-xl">
                    <GridIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4"/>
                    <p className="font-medium text-foreground">No departments defined.</p>
                    <p className="text-sm text-muted-foreground mt-1">Create a department to start organizing your faculty.</p>
                    <button onClick={() => handleOpenModal()} className="mt-4 text-primary text-sm font-bold hover:underline">
                        Create First Department
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departments.map(dept => (
                        <div key={dept.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 rounded-xl">
                                    <GridIcon className="w-6 h-6"/>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenModal(dept)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"><EditIcon className="w-4 h-4"/></button>
                                    <button onClick={() => handleDelete(dept)} className="p-2 hover:bg-red-50 text-muted-foreground hover:text-red-600 rounded-lg"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-bold text-foreground mb-1">{dept.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-4">{dept.description || 'No description provided.'}</p>
                            
                            <div className="mt-auto space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
                                    {dept.hod_name ? (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm border border-white/10">
                                                {(dept.hod_name || '?').charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Head of Dept</p>
                                                <p className="text-sm font-bold text-foreground">{dept.hod_name}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2 text-muted-foreground text-sm w-full cursor-pointer hover:text-primary transition-colors" onClick={() => handleOpenModal(dept)}>
                                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-dashed border-muted-foreground/30">
                                                <UserPlusIcon className="w-5 h-5"/>
                                            </div>
                                            <span className="font-medium">Assign HOD</span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-border/50">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <UsersIcon className="w-4 h-4"/>
                                        <span className="font-semibold text-foreground">{dept.teacher_count || 0}</span> Faculty
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <BookIcon className="w-4 h-4"/>
                                        <span className="font-semibold text-foreground">{dept.course_count || 0}</span> Courses
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Workload Distribution Section */}
            {departments.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-8 shadow-sm mt-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                                <HeatmapIcon className="w-5 h-5 text-primary"/> Workload Distribution
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">Average teaching load per department this week.</p>
                        </div>
                        <select className="bg-muted text-sm px-4 py-2 rounded-lg border-transparent focus:border-primary focus:ring-primary/20">
                            <option>This Week</option>
                            <option>Last Month</option>
                        </select>
                    </div>
                    
                    <div className="space-y-6">
                        {workloadData.map((d, i) => (
                            <div key={i} className="group">
                                <div className="flex justify-between text-sm font-medium mb-2">
                                    <span className="text-foreground">{d.name}</span>
                                    <span className="text-muted-foreground">{d.teachers} Teachers • {d.load}% Avg Load</span>
                                </div>
                                <div className="h-3 w-full bg-muted/50 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                            d.load > 90 ? 'bg-red-500' : d.load > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                                        }`} 
                                        style={{ width: `${d.load}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-card w-full max-w-2xl rounded-[2rem] shadow-2xl border border-border flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        
                        <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">{editingDept ? 'Edit Department' : 'Create Department'}</h3>
                                <p className="text-xs text-muted-foreground mt-1">Manage details and faculty members.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><XIcon className="w-5 h-5"/></button>
                        </div>

                        <div className="flex border-b border-border">
                            <button 
                                onClick={() => setActiveModalTab('details')}
                                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeModalTab === 'details' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                                Details & Head
                            </button>
                            <button 
                                onClick={() => setActiveModalTab('faculty')}
                                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeModalTab === 'faculty' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                                Faculty Members ({selectedTeacherIds.size})
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex-grow overflow-hidden flex flex-col">
                            <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
                                {activeModalTab === 'details' ? (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">Department Name</label>
                                            <div className="relative">
                                                <GridIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input 
                                                    required 
                                                    value={formData.name} 
                                                    onChange={e => setFormData({...formData, name: e.target.value})} 
                                                    className="w-full pl-10 p-3 rounded-xl bg-background border border-input focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-medium" 
                                                    placeholder="e.g. Mathematics"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">Description</label>
                                            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 rounded-xl bg-background border border-input focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none h-24 resize-none" placeholder="Brief description of responsibilities..."/>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">Head of Department (HOD)</label>
                                            <div className="relative group">
                                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                                                <select value={formData.hod_id} onChange={e => setFormData({...formData,hod_id: e.target.value})} className="w-full pl-10 p-3 rounded-xl bg-background border border-input focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none cursor-pointer">
                                                    <option value="">Select Faculty Member...</option>
                                                    {teachers.map(t => (
                                                        <option key={t.id} value={t.id}>{t.display_name} ({t.details?.designation || 'Teacher'})</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                                            <input 
                                                type="text"
                                                placeholder="Search teachers..."
                                                value={teacherSearch}
                                                onChange={(e) => setTeacherSearch(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                            {filteredTeachersForModal.map(t => {
                                                const isSelected = selectedTeacherIds.has(t.id);
                                                const currentDept = t.details?.department;
                                                const isAssignedElsewhere = currentDept && currentDept !== formData.name;
                                                
                                                return (
                                                    <div 
                                                        key={t.id} 
                                                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-primary/5 border-primary shadow-sm' : 'bg-card border-border hover:bg-muted/50'}`}
                                                        onClick={() => toggleTeacherSelection(t.id)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                                {(t.display_name || '?').charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>{t.display_name}</p>
                                                                {isAssignedElsewhere && (
                                                                    <p className="text-[10px] text-amber-600 flex items-center gap-1">
                                                                        <BriefcaseIcon className="w-3 h-3"/> Currently in {currentDept}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                                                            {isSelected && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {filteredTeachersForModal.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No teachers found.</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-6 border-t border-border bg-muted/20 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors border border-transparent hover:border-border">Cancel</button>
                                <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 flex items-center gap-2 transition-all">
                                    {isSaving ? <Spinner size="sm" className="text-current"/> : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DepartmentsTab;
