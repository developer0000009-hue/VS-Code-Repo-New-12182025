
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
    branchId: string | null;
}

const formatError = (err: any): string => {
    if (typeof err === 'string') return err;
    if (err?.message) return err.message;
    return "An unknown error occurred";
};

const DepartmentsTab: React.FC<DepartmentsTabProps> = ({ teachers, branchId }) => {
    const [departments, setDepartments] = useState<SchoolDepartment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<SchoolDepartment | null>(null);
    const [activeModalTab, setActiveModalTab] = useState<'details' | 'faculty'>('details');
    const [formData, setFormData] = useState({ name: '', description: '', hod_id: '' });
    const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(new Set());
    const [teacherSearch, setTeacherSearch] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchDepartments = useCallback(async () => {
        if (!branchId) { setDepartments([]); setLoading(false); return; }
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_school_departments_stats', { p_branch_id: branchId });
            if (error) throw error;
            setDepartments(data || []);
        } catch (err: any) { console.error('Fetch error:', err); } finally { setLoading(false); }
    }, [branchId]);

    useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSaving(true);
        try {
            const { error: deptError } = await supabase.rpc('manage_school_department', { p_id: editingDept?.id || null, p_name: formData.name, p_description: formData.description, p_hod_id: formData.hod_id || null, p_branch_id: branchId, p_delete: false });
            if (deptError) throw deptError;
            setIsModalOpen(false); fetchDepartments();
        } catch (error: any) { alert(`Error: ${formatError(error)}`); } finally { setIsSaving(false); }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"><div className="flex justify-between items-center"><div><h2 className="text-xl font-bold">Faculty Departments</h2><p className="text-muted-foreground text-sm">Organize academic leadership nodes.</p></div><button onClick={() => { setEditingDept(null); setFormData({name:'', description:'', hod_id:''}); setSelectedTeacherIds(new Set()); setIsModalOpen(true); }} className="px-5 py-2 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2"><PlusIcon className="w-5 h-5"/> New Dept</button></div>{loading ? <div className="flex justify-center p-12"><Spinner size="lg"/></div> : departments.length === 0 ? (<div className="py-20 text-center border-2 border-dashed border-border rounded-xl opacity-30"><GridIcon className="mx-auto w-16 h-16 mb-4"/><p>No departments provisioned.</p></div>) : (<div className="grid grid-cols-1 md:grid-cols-3 gap-6">{departments.map(dept => (<div key={dept.id} className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all"><h3 className="text-xl font-bold">{dept.name}</h3><p className="text-sm text-muted-foreground mt-2 line-clamp-2">{dept.description || 'Description standby.'}</p><div className="mt-8 flex justify-between items-center pt-4 border-t border-border/50"><div className="flex gap-2"><UsersIcon className="w-4 h-4 text-primary"/> <span className="text-xs font-bold">{dept.teacher_count || 0} Faculty</span></div><button onClick={() => { setEditingDept(dept); setFormData({name:dept.name, description:dept.description||'', hod_id:dept.hod_id||''}); setIsModalOpen(true); }} className="text-xs font-bold text-primary hover:underline">Edit Node</button></div></div>))}</div>)} {isModalOpen && (<div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[100] animate-in fade-in" onClick={()=>setIsModalOpen(false)}><div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl p-8" onClick={e=>e.stopPropagation()}><h3 className="text-2xl font-bold mb-6">Configure Department</h3><form onSubmit={handleSave} className="space-y-5"><div><label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Department Name</label><input required value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} className="w-full p-3 rounded-xl border bg-background" /></div><div className="flex justify-end gap-3 pt-4"><button type="button" onClick={()=>setIsModalOpen(false)} className="px-6 py-2.5 font-bold">Cancel</button><button type="submit" disabled={isSaving} className="px-8 py-2.5 bg-primary text-white rounded-xl font-bold">{isSaving ? <Spinner size="sm"/> : 'Save Changes'}</button></div></form></div></div>)}</div>
    );
};

export default DepartmentsTab;
