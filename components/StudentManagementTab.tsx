import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { StudentForAdmin } from '../types';
import Spinner from './common/Spinner';
import { PlusIcon } from './icons/PlusIcon';
import { StudentsIcon } from './icons/StudentsIcon';
import { SearchIcon } from './icons/SearchIcon';
import { FilterIcon } from './icons/FilterIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ClockIcon } from './icons/ClockIcon';
import { MoreVerticalIcon } from './icons/MoreVerticalIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { GraduationCapIcon } from './icons/GraduationCapIcon';
import { TrashIcon } from './icons/TrashIcon';
import { XIcon } from './icons/XIcon';
import { MailIcon } from './icons/MailIcon';
import { UploadIcon } from './icons/UploadIcon';
import StudentProfileModal from './students/StudentProfileModal';
import BulkStudentActionsModal, { BulkStudentActionType } from './students/BulkStudentActionsModal';

interface StudentManagementTabProps {
    branchId?: number | null;
}

const KPICard: React.FC<{ title: string, value: number, icon: React.ReactNode, color: string, onClick?: () => void, active?: boolean }> = ({ title, value, icon, color, onClick, active }) => (
    <div 
        onClick={onClick}
        className={`relative overflow-hidden p-6 rounded-3xl border-2 transition-all duration-300 cursor-pointer group ${active ? 'bg-card border-primary ring-4 ring-primary/5 shadow-xl' : 'bg-card border-border/60 hover:border-primary/40 shadow-sm'}`}
    >
        <div className="flex justify-between items-start mb-4">
            <div className={`p-4 rounded-2xl text-white shadow-lg transform group-hover:scale-110 transition-transform duration-500 ${color}`}>
                {icon}
            </div>
            {active && <CheckCircleIcon className="w-5 h-5 text-primary animate-in zoom-in" />}
        </div>
        <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{title}</p>
            <h3 className="text-3xl font-black text-foreground mt-1 tracking-tight">{value.toLocaleString()}</h3>
        </div>
    </div>
);

export const AddStudentModal: React.FC<{ onClose: () => void; onSave: () => void }> = ({ onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        display_name: '',
        email: '',
        grade: '',
        parent_guardian_details: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.rpc('admin_quick_add_student', {
                p_display_name: formData.display_name,
                p_email: formData.email,
                p_grade: formData.grade,
                p_parent_details: formData.parent_guardian_details
            });
            if (error) throw error;
            onSave();
            onClose();
        } catch (err: any) {
            alert(err.message || "Failed to add student");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Quick Register Student</h3>
                    <button onClick={onClose}><XIcon className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Full Name</label>
                        <input required className="w-full p-3 rounded-xl border border-input bg-background outline-none focus:ring-2 focus:ring-primary/20" value={formData.display_name} onChange={e => setFormData({...formData, display_name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Login Email</label>
                        <input required type="email" className="w-full p-3 rounded-xl border border-input bg-background outline-none focus:ring-2 focus:ring-primary/20" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Academic Grade</label>
                        <input required className="w-full p-3 rounded-xl border border-input bg-background outline-none focus:ring-2 focus:ring-primary/20" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 font-bold text-muted-foreground">Cancel</button>
                        <button type="submit" disabled={loading} className="px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-lg flex items-center gap-2">
                            {loading ? <Spinner size="sm"/> : 'Confirm Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const StudentManagementTab: React.FC<StudentManagementTabProps> = ({ branchId }) => {
    const [allStudents, setAllStudents] = useState<StudentForAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [quickFilter, setQuickFilter] = useState<'All' | 'Active' | 'Pending' | 'New'>('All');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedStudent, setSelectedStudent] = useState<StudentForAdmin | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [bulkAction, setBulkAction] = useState<BulkStudentActionType | null>(null);

    const itemsPerPage = 12;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_all_students_for_admin', { p_branch_id: branchId });
            if (error) throw error;
            setAllStudents(data || []);
        } catch (e) {
            console.error("Student Fetch Error:", e);
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredStudents = useMemo(() => {
        return allStudents.filter(s => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || 
                s.display_name.toLowerCase().includes(searchLower) || 
                (s.email || '').toLowerCase().includes(searchLower) || 
                (s.student_id_number || '').toLowerCase().includes(searchLower);
            
            let matchesQuick = true;
            if (quickFilter === 'Active') matchesQuick = s.is_active;
            if (quickFilter === 'Pending') matchesQuick = !s.profile_completed;
            
            return matchesSearch && matchesQuick;
        }).sort((a, b) => {
            const dir = sortConfig.direction === 'asc' ? 1 : -1;
            if (sortConfig.key === 'name') return a.display_name.localeCompare(b.display_name) * dir;
            return 0;
        });
    }, [allStudents, searchTerm, quickFilter, sortConfig]);

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredStudents.slice(start, start + itemsPerPage);
    }, [filteredStudents, currentPage]);

    const stats = useMemo(() => ({
        total: allStudents.length,
        active: allStudents.filter(s => s.is_active).length,
        pending: allStudents.filter(s => !s.profile_completed).length,
        new: allStudents.filter(s => new Date(s.created_at || '').toDateString() === new Date().toDateString()).length
    }), [allStudents]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-serif font-black text-foreground tracking-tight">Institutional Enrollment</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Managing lifecycle and data integrity for {stats.total} students.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setBulkAction('import')} className="px-5 py-3 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-2xl border border-border transition-all flex items-center gap-2">
                        <UploadIcon className="w-4 h-4"/> Bulk Import
                    </button>
                    <button onClick={() => setIsAddModalOpen(true)} className="px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2 transform hover:-translate-y-0.5">
                        <PlusIcon className="w-5 h-5"/> Register Student
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Total Roster" value={stats.total} icon={<StudentsIcon className="w-6 h-6"/>} color="bg-blue-600" active={quickFilter === 'All'} onClick={() => setQuickFilter('All')} />
                <KPICard title="Active Enrolled" value={stats.active} icon={<CheckCircleIcon className="w-6 h-6"/>} color="bg-emerald-600" active={quickFilter === 'Active'} onClick={() => setQuickFilter('Active')} />
                <KPICard title="Pending Profiles" value={stats.pending} icon={<ClockIcon className="w-6 h-6"/>} color="bg-purple-600" active={quickFilter === 'Pending'} onClick={() => setQuickFilter('Pending')} />
                <KPICard title="New Inbound" value={stats.new} icon={<GraduationCapIcon className="w-6 h-6"/>} color="bg-amber-600" />
            </div>

            <div className="bg-card border border-border rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col min-h-[600px] ring-1 ring-black/5">
                <div className="p-6 border-b border-border bg-muted/10 flex flex-col md:flex-row gap-6 justify-between items-center">
                    <div className="relative w-full md:max-w-md group">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Find record by name or ID..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-input bg-background text-sm font-medium focus:ring-4 focus:ring-primary/10 transition-all shadow-inner outline-none"
                        />
                    </div>
                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-3 animate-in slide-in-from-right-4">
                            <span className="text-sm font-black text-primary uppercase tracking-widest">{selectedIds.size} Selected</span>
                            <button onClick={() => setBulkAction('message')} className="p-3 bg-muted hover:bg-muted/80 rounded-xl text-muted-foreground hover:text-primary transition-colors"><MailIcon className="w-5 h-5"/></button>
                            <button onClick={() => setBulkAction('delete')} className="p-3 bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-colors"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto flex-grow">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-muted/30 border-b border-border text-[10px] font-black uppercase text-muted-foreground tracking-widest sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th className="p-6 w-12"><input type="checkbox" className="rounded border-input text-primary focus:ring-primary" checked={selectedIds.size === paginatedData.length && paginatedData.length > 0} onChange={() => { if(selectedIds.size === paginatedData.length) setSelectedIds(new Set()); else setSelectedIds(new Set(paginatedData.map(s=>s.id))); }} /></th>
                                <th className="p-6 cursor-pointer hover:text-foreground" onClick={() => handleSort('name')}>Student Context</th>
                                <th className="p-6">Parent Info</th>
                                <th className="p-6">Grade</th>
                                <th className="p-6 text-center">Status</th>
                                <th className="p-6 text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr><td colSpan={6} className="p-20 text-center"><Spinner size="lg" /></td></tr>
                            ) : paginatedData.length === 0 ? (
                                <tr><td colSpan={6} className="p-20 text-center text-muted-foreground font-bold italic">No student records match the current parameters.</td></tr>
                            ) : paginatedData.map(student => (
                                <tr key={student.id} className={`hover:bg-muted/40 transition-all cursor-pointer group ${selectedIds.has(student.id) ? 'bg-primary/5' : ''}`} onClick={() => setSelectedStudent(student)}>
                                    <td className="p-6" onClick={e => e.stopPropagation()}><input type="checkbox" className="rounded border-input text-primary focus:ring-primary" checked={selectedIds.has(student.id)} onChange={() => { const s = new Set(selectedIds); if(s.has(student.id)) s.delete(student.id); else s.add(student.id); setSelectedIds(s); }} /></td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md border-2 border-background overflow-hidden">
                                                {student.profile_photo_url ? <img src={student.profile_photo_url} className="w-full h-full object-cover" alt={student.display_name}/> : student.display_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground group-hover:text-primary transition-colors">{student.display_name}</p>
                                                <p className="text-[10px] text-muted-foreground font-mono mt-0.5 tracking-tighter opacity-60">{student.student_id_number || 'ID_ALLOCATION_PENDING'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 font-medium text-muted-foreground truncate max-w-[200px]">{student.parent_guardian_details || '—'}</td>
                                    <td className="p-6"><span className="px-3 py-1 bg-muted rounded-xl border border-border text-[10px] font-black uppercase text-foreground">{student.grade}</span></td>
                                    <td className="p-6 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${student.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            {student.is_active ? 'Enrolled' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right pr-8" onClick={e => e.stopPropagation()}>
                                        <button className="p-2.5 rounded-xl hover:bg-background text-muted-foreground hover:text-foreground transition-all"><MoreVerticalIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t border-border bg-muted/5 flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Showing Page {currentPage} of {totalPages || 1}</span>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-2 rounded-xl border border-border hover:bg-background disabled:opacity-30 transition-all"><ChevronLeftIcon className="w-5 h-5"/></button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-2 rounded-xl border border-border hover:bg-background disabled:opacity-30 transition-all"><ChevronRightIcon className="w-5 h-5"/></button>
                    </div>
                </div>
            </div>

            {selectedStudent && <StudentProfileModal student={selectedStudent} onClose={() => setSelectedStudent(null)} onUpdate={fetchData} />}
            {isAddModalOpen && <AddStudentModal onClose={() => setIsAddModalOpen(false)} onSave={fetchData} />}
            {bulkAction && <BulkStudentActionsModal action={bulkAction} selectedIds={Array.from(selectedIds)} onClose={() => setBulkAction(null)} onSuccess={() => { fetchData(); setSelectedIds(new Set()); }} />}
        </div>
    );
};

export default StudentManagementTab;