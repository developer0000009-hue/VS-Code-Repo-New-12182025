import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase, formatError } from '../services/supabase';
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
import { UploadIcon } from './icons/UploadIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { UserPlusIcon } from './icons/UserPlusIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import StudentProfileModal, { AssignClassModal } from './students/StudentProfileModal';
import BulkStudentActionsModal, { BulkStudentActionType } from './students/BulkStudentActionsModal';
import PremiumAvatar from './common/PremiumAvatar';

interface StudentManagementTabProps {
    branchId?: number | null;
}

const KPICard: React.FC<{ 
    title: string; 
    value: number; 
    icon: React.ReactNode; 
    color: string; 
    onClick?: () => void; 
    active?: boolean;
    description?: string;
    loading?: boolean;
}> = ({ title, value, icon, color, onClick, active, description, loading }) => {
    const colorBase = color.split('-')[1] || 'primary';

    return (
        <div 
            onClick={onClick}
            className={`relative overflow-hidden p-6 rounded-[2rem] border transition-all duration-500 cursor-pointer group ${active ? 'bg-card border-primary ring-4 ring-primary/5 shadow-2xl scale-[1.02] z-10' : 'bg-card/40 border-white/5 hover:border-primary/40 hover:bg-card/60 shadow-sm'}`}
        >
            <div className={`absolute -right-8 -top-8 w-32 h-32 bg-${colorBase}-500 opacity-0 group-hover:opacity-10 transition-opacity duration-700 rounded-full blur-3xl`}></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`p-4 rounded-2xl text-white shadow-xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ${color} ring-1 ring-white/10`}>
                    {icon}
                </div>
                {active && <div className="p-1.5 bg-primary/10 rounded-full animate-in zoom-in"><CheckCircleIcon className="w-4 h-4 text-primary" /></div>}
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">{title}</p>
                <div className="flex items-center gap-2 min-h-[40px]">
                    {loading ? (
                        <div className="h-8 w-24 bg-white/5 rounded animate-pulse" />
                    ) : (
                        <h3 className="text-4xl font-serif font-black text-foreground tracking-tighter animate-in fade-in">{value.toLocaleString()}</h3>
                    )}
                </div>
                {description && <p className="text-[10px] text-muted-foreground/60 mt-2 font-medium italic">{description}</p>}
            </div>
        </div>
    );
};

export const AddStudentModal: React.FC<{ onClose: () => void; onSave: () => void; branchId?: number | null }> = ({ onClose, onSave, branchId }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        display_name: '',
        email: '',
        grade: '',
        parent_guardian_details: ''
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { data, error: rpcError } = await supabase.rpc('admin_quick_add_student', {
                p_display_name: formData.display_name,
                p_email: formData.email,
                p_grade: formData.grade,
                p_parent_details: formData.parent_guardian_details
            });

            if (rpcError) throw rpcError;
            if (data && data.success === false) throw new Error(data.message || "Registration failed");

            if (branchId && data?.user_id) {
                await supabase.from('student_profiles').update({ branch_id: branchId }).eq('user_id', data.user_id);
            }

            onSave();
            onClose();
        } catch (err: any) {
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-[#0f1115] w-full max-w-md rounded-[2rem] shadow-2xl border border-white/10 p-8 animate-in zoom-in-95 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight font-serif">Register Node</h3>
                        <p className="text-sm font-bold text-white/30 uppercase tracking-widest mt-1">Quick Enrollment</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><XIcon className="w-5 h-5 text-white/50 hover:text-white"/></button>
                </div>

                <form onSubmit={handleSave} className="space-y-5 relative z-10">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-500">
                            <AlertTriangleIcon className="w-5 h-5 shrink-0 mt-0.5" />
                            <p className="text-xs font-bold leading-relaxed">{error}</p>
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-white/40 tracking-widest ml-1">Full Name</label>
                        <input required value={formData.display_name} onChange={e => setFormData({...formData, display_name: e.target.value})} className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl text-sm font-bold text-white focus:border-primary/50 outline-none" placeholder="e.g. Alex Doe" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-white/40 tracking-widest ml-1">Email Access</label>
                        <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl text-sm font-bold text-white focus:border-primary/50 outline-none" placeholder="student@school.id" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-white/40 tracking-widest ml-1">Grade</label>
                            <input required value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl text-sm font-bold text-white focus:border-primary/50 outline-none" placeholder="e.g. 10" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-white/40 tracking-widest ml-1">Parent Info</label>
                            <input value={formData.parent_guardian_details} onChange={e => setFormData({...formData, parent_guardian_details: e.target.value})} className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl text-sm font-bold text-white focus:border-primary/50 outline-none" placeholder="Optional" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                        <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest">Cancel</button>
                        <button type="submit" disabled={loading} className="px-8 py-3 bg-primary text-white font-black text-xs rounded-xl shadow-lg hover:bg-primary/90 flex items-center gap-2 transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50">
                            {loading ? <Spinner size="sm" className="text-white" /> : "Confirm Registration"}
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
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [quickFilter, setQuickFilter] = useState<'All' | 'Active' | 'Pending' | 'New'>('All');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
    const [gradeFilter, setGradeFilter] = useState<string>('All');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedStudent, setSelectedStudent] = useState<StudentForAdmin | null>(null);
    const [assigningStudent, setAssigningStudent] = useState<StudentForAdmin | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [bulkAction, setBulkAction] = useState<BulkStudentActionType | null>(null);

    const itemsPerPage = 12;

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let query = supabase.from('student_profiles').select(`*, profiles!inner (email, display_name, phone, role, is_active, profile_completed, created_at), school_classes (name)` ).eq('profiles.role', 'Student');
            if (branchId !== null && branchId !== undefined) query = query.eq('branch_id', branchId);

            const { data, error: dbError } = await query;
            if (dbError) throw dbError;

            const mappedStudents: StudentForAdmin[] = (data || []).map((s: any) => ({
                id: s.user_id,
                email: s.profiles?.email || '',
                display_name: s.profiles?.display_name || 'Unknown Student',
                phone: s.profiles?.phone,
                role: s.profiles?.role,
                is_active: s.profiles?.is_active,
                profile_completed: s.profiles?.profile_completed,
                created_at: s.created_at || s.profiles?.created_at,
                profile_photo_url: s.profile_photo_url, 
                gender: s.gender,
                date_of_birth: s.date_of_birth,
                address: s.address,
                student_id_number: s.student_id_number,
                grade: s.grade,
                roll_number: s.roll_number,
                parent_guardian_details: s.parent_guardian_details,
                assigned_class_id: s.assigned_class_id,
                assigned_class_name: s.school_classes?.name || null
            }));

            setAllStudents(mappedStudents);
        } catch (e: any) {
            setError(formatError(e));
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const uniqueGrades = useMemo(() => {
        const grades = new Set(allStudents.map(s => s.grade).filter(Boolean));
        return Array.from(grades).sort((a, b) => (parseInt(String(a)) || 0) - (parseInt(String(b)) || 0));
    }, [allStudents]);

    const filteredStudents = useMemo(() => {
        return allStudents.filter(s => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || s.display_name.toLowerCase().includes(searchLower) || (s.email || '').toLowerCase().includes(searchLower) || (s.student_id_number || '').toLowerCase().includes(searchLower);
            let matchesQuick = true;
            if (quickFilter === 'Active') matchesQuick = s.is_active;
            if (quickFilter === 'Pending') matchesQuick = !s.assigned_class_id;
            if (quickFilter === 'New') {
                const today = new Date().toDateString();
                const created = s.created_at ? new Date(s.created_at).toDateString() : '';
                matchesQuick = created === today;
            }
            const matchesStatus = statusFilter === 'All' ? true : statusFilter === 'Active' ? s.is_active : !s.is_active;
            const matchesGrade = gradeFilter === 'All' || s.grade === gradeFilter;
            return matchesSearch && matchesQuick && matchesStatus && matchesGrade;
        }).sort((a: any, b: any) => {
            const dir = sortConfig.direction === 'asc' ? 1 : -1;
            if (sortConfig.key === 'created_at') return (new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()) * dir;
            if (sortConfig.key === 'name') return a.display_name.localeCompare(b.display_name) * dir;
            return 0;
        });
    }, [allStudents, searchTerm, quickFilter, statusFilter, gradeFilter, sortConfig]);

    const handleSort = (key: string) => {
        setSortConfig(current => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }));
    };

    const stats = useMemo(() => ({
        total: allStudents.length,
        active: allStudents.filter(s => s.is_active).length,
        pending: allStudents.filter(s => !s.assigned_class_id).length,
        new: allStudents.filter(s => s.created_at && new Date(s.created_at).toDateString() === new Date().toDateString()).length
    }), [allStudents]);

    const paginatedData = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

    return (
        <div className="space-y-10 pb-24 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
                <h1 className="text-4xl md:text-6xl font-serif font-black text-foreground tracking-tighter uppercase leading-none">
                    Student <span className="text-white/20 italic">Directory.</span>
                </h1>
                <div className="flex items-center gap-4 w-full xl:w-auto">
                    <button onClick={() => setBulkAction('import')} className="flex-grow xl:flex-none px-10 py-5 bg-white/5 hover:bg-white/10 text-foreground font-black text-[11px] uppercase tracking-[0.25em] rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-3">Import</button>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex-grow xl:flex-none px-12 py-5 bg-primary text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 active:scale-95">Register Node</button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Total Roster" value={stats.total} icon={<StudentsIcon className="w-8 h-8"/>} color="bg-indigo-600" active={quickFilter === 'All'} onClick={() => setQuickFilter('All')} />
                <KPICard title="Active Stream" value={stats.active} icon={<CheckCircleIcon className="w-8 h-8"/>} color="bg-emerald-600" active={quickFilter === 'Active'} onClick={() => setQuickFilter('Active')} />
                <KPICard title="Placement Pending" value={stats.pending} icon={<ClockIcon className="w-8 h-8"/>} color="bg-amber-600" active={quickFilter === 'Pending'} onClick={() => setQuickFilter('Pending')} />
                <KPICard title="Newly Registered" value={stats.new} icon={<GraduationCapIcon className="w-8 h-8"/>} color="bg-purple-600" active={quickFilter === 'New'} onClick={() => setQuickFilter('New')} />
            </div>

            <div className="bg-card border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col min-h-[650px] relative">
                <div className="p-8 border-b border-white/5 flex flex-col xl:flex-row gap-6 justify-between items-center bg-card/60 backdrop-blur-xl">
                    <div className="relative flex-grow w-full group">
                        <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/10 group-focus-within:text-primary transition-colors duration-300" />
                        <input type="text" placeholder="Search identities..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-14 pr-6 py-4 rounded-2xl border border-white/5 bg-black/20 text-sm font-medium text-white focus:bg-black/40 outline-none" />
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as any); setCurrentPage(1); }} className="h-14 px-6 bg-black/20 border border-white/5 rounded-2xl text-sm font-bold text-white focus:outline-none min-w-[140px]">
                            <option value="All">All Status</option>
                            <option value="Active">Active Only</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                        <select value={gradeFilter} onChange={e => { setGradeFilter(e.target.value); setCurrentPage(1); }} className="h-14 px-6 bg-black/20 border border-white/5 rounded-2xl text-sm font-bold text-white focus:outline-none min-w-[140px]">
                            <option value="All">All Grades</option>
                            {uniqueGrades.map(g => <option key={String(g)} value={String(g)}>Grade {String(g)}</option>)}
                        </select>
                        <button onClick={() => fetchData()} className="p-4 rounded-2xl bg-white/5 text-white/20 hover:text-primary border border-white/5"><RefreshIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
                    </div>
                </div>

                <div className="overflow-x-auto flex-grow custom-scrollbar">
                    {loading && allStudents.length > 0 ? (
                        <div className="p-20 flex justify-center"><Spinner size="lg" className="text-primary"/></div>
                    ) : paginatedData.length === 0 ? (
                        <div className="p-32 text-center opacity-40">
                            <StudentsIcon className="w-16 h-16 mx-auto mb-4"/>
                            <p className="text-lg font-bold uppercase tracking-widest">No Records Found</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-[#0f1115]/80 border-b border-white/5 text-[10px] font-black uppercase text-white/20 tracking-[0.3em] sticky top-0 z-20 backdrop-blur-xl">
                                <tr>
                                    <th className="p-8 pl-10 cursor-pointer" onClick={() => handleSort('name')}>Identity Node</th>
                                    <th className="p-8">Guardian Context</th>
                                    <th className="p-8">Placement Status</th>
                                    <th className="p-8 text-center">Protocol Status</th>
                                    <th className="p-8 text-right pr-10">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {paginatedData.map(student => (
                                    <tr key={student.id} className="hover:bg-white/[0.02] cursor-pointer group transition-all duration-300" onClick={() => setSelectedStudent(student)}>
                                        <td className="p-8 pl-10">
                                            <div className="flex items-center gap-6">
                                                <PremiumAvatar src={student.profile_photo_url} name={student.display_name} size="xs" className="w-14 h-14 rounded-2xl border border-white/10 shadow-2xl" />
                                                <div>
                                                    <p className="font-serif font-black text-white text-lg tracking-tight uppercase group-hover:text-primary transition-colors">{student.display_name}</p>
                                                    <p className="text-[10px] text-white/30 font-mono tracking-widest uppercase">{student.student_id_number || 'ID_PENDING'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8"><p className="text-sm font-bold text-white/80">{student.parent_guardian_details || 'Unlinked'}</p></td>
                                        <td className="p-8">
                                            {student.assigned_class_id ? (
                                                <span className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest shadow-sm">{student.assigned_class_name}</span>
                                            ) : (
                                                <button onClick={(e) => { e.stopPropagation(); setAssigningStudent(student); }} className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-500/20 transition-all flex items-center gap-2 shadow-inner"><SparklesIcon className="w-3 h-3" /> Assign Class</button>
                                            )}
                                        </td>
                                        <td className="p-8 text-center">
                                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border ${student.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{student.is_active ? 'Active' : 'Suspended'}</span>
                                        </td>
                                        <td className="p-8 text-right pr-10">
                                            <button className="p-4 rounded-2xl bg-white/5 text-white/10 opacity-0 group-hover:opacity-100 hover:text-white transition-all"><MoreVerticalIcon className="w-5 h-5"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="p-8 border-t border-white/5 bg-[#0a0a0c]/80 flex justify-between items-center relative z-10">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Sequence <span className="text-white/60">{currentPage}</span> of {totalPages || 1}</span>
                    <div className="flex gap-3">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-4 rounded-2xl border border-white/5 bg-white/5 text-white/40 hover:text-white disabled:opacity-20 transition-all"><ChevronLeftIcon className="w-6 h-6"/></button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-4 rounded-2xl border border-white/5 bg-white/5 text-white/40 hover:text-white disabled:opacity-20 transition-all"><ChevronRightIcon className="w-6 h-6"/></button>
                    </div>
                </div>
            </div>

            {selectedStudent && <StudentProfileModal student={selectedStudent} onClose={() => setSelectedStudent(null)} onUpdate={fetchData} />}
            {assigningStudent && <AssignClassModal student={assigningStudent} onClose={() => setAssigningStudent(null)} onSuccess={() => { setAssigningStudent(null); fetchData(); }} />}
            {isAddModalOpen && <AddStudentModal onClose={() => setIsAddModalOpen(false)} onSave={fetchData} branchId={branchId} />}
            {bulkAction && <BulkStudentActionsModal action={bulkAction} selectedIds={[]} onClose={() => setBulkAction(null)} onSuccess={fetchData} />}
        </div>
    );
};

export default StudentManagementTab;