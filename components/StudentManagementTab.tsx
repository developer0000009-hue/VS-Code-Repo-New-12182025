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
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { UserPlusIcon } from './icons/UserPlusIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import StudentProfileModal from './students/StudentProfileModal';
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
}> = ({ title, value, icon, color, onClick, active, description }) => {
    const colorBase = color.split('-')[1];

    return (
        <div 
            onClick={onClick}
            className={`
                relative overflow-hidden p-6 rounded-[2rem] border transition-all duration-500 cursor-pointer group
                ${active 
                    ? 'bg-card border-primary ring-4 ring-primary/5 shadow-2xl scale-[1.02] z-10' 
                    : 'bg-card/40 border-white/5 hover:border-primary/40 hover:bg-card/60 shadow-sm'
                }
            `}
        >
            <div className={`absolute -right-8 -top-8 w-32 h-32 bg-${colorBase}-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`p-4 rounded-2xl text-white shadow-xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ${color} ring-1 ring-white/10`}>
                    {icon}
                </div>
                {active && <div className="p-1.5 bg-primary/10 rounded-full animate-in zoom-in"><CheckCircleIcon className="w-4 h-4 text-primary" /></div>}
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-serif font-black text-foreground tracking-tighter">{value.toLocaleString()}</h3>
                </div>
                {description && <p className="text-[10px] text-muted-foreground/60 mt-2 font-medium italic">{description}</p>}
            </div>
        </div>
    );
};

export const AddStudentModal: React.FC<{ onClose: () => void; onSave: () => void }> = ({ onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        display_name: '',
        email: '',
        grade: '',
        parent_guardian_details: ''
    });

    const handleSave = async (e: React.FormEvent) => {
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
            alert(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-6 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold">Quick Student Registration</h3>
                    <button onClick={onClose}><XIcon className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Full Name</label>
                        <input required value={formData.display_name} onChange={e => setFormData({...formData, display_name: e.target.value})} className="w-full p-3 bg-muted/30 border border-input rounded-xl text-sm" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Email</label>
                        <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 bg-muted/30 border border-input rounded-xl text-sm" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Grade</label>
                        <input required value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} className="w-full p-3 bg-muted/30 border border-input rounded-xl text-sm" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Parent Details</label>
                        <input value={formData.parent_guardian_details} onChange={e => setFormData({...formData, parent_guardian_details: e.target.value})} className="w-full p-3 bg-muted/30 border border-input rounded-xl text-sm" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <button type="button" onClick={onClose} className="px-4 py-2 font-bold text-muted-foreground">Cancel</button>
                        <button type="submit" disabled={loading} className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg flex items-center gap-2">
                            {loading ? <Spinner size="sm" /> : "Register"}
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
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedStudent, setSelectedStudent] = useState<StudentForAdmin | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [bulkAction, setBulkAction] = useState<BulkStudentActionType | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [highlightedId, setHighlightedId] = useState<string | null>(null);

    const itemsPerPage = 12;

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: rpcError } = await supabase.rpc('get_all_students_for_admin', { 
                p_branch_id: branchId 
            });
            if (rpcError) throw rpcError;
            setAllStudents(data || []);
        } catch (e: any) {
            setError(formatError(e));
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    // FIX: Listen to hash changes to trigger data refresh and highlighting.
    useEffect(() => {
        const handleHashChange = () => {
            if (window.location.hash.startsWith('#/Student Management')) {
                setRefreshKey(Date.now()); // Trigger re-fetch
                const params = new URLSearchParams(window.location.hash.split('?')[1]);
                const idToHighlight = params.get('highlight');
                if (idToHighlight) {
                    setHighlightedId(idToHighlight);
                    setTimeout(() => setHighlightedId(null), 3000); // Clear highlight after 3s
                }
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Run once on mount
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    useEffect(() => { 
        fetchData(); 
    }, [fetchData, refreshKey]); // Re-fetch when refreshKey changes

    const filteredStudents = useMemo(() => {
        return allStudents.filter(s => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || s.display_name.toLowerCase().includes(searchLower) || (s.email || '').toLowerCase().includes(searchLower);
            let matchesQuick = true;
            if (quickFilter === 'Active') matchesQuick = s.is_active;
            if (quickFilter === 'Pending') matchesQuick = !s.assigned_class_id;
            if (quickFilter === 'New') {
                const today = new Date().toDateString();
                matchesQuick = new Date(s.created_at).toDateString() === today;
            }
            return matchesSearch && matchesQuick;
        }).sort((a, b) => {
            const dir = sortConfig.direction === 'asc' ? 1 : -1;
            if (sortConfig.key === 'name') return a.display_name.localeCompare(b.display_name) * dir;
            return 0;
        });
    }, [allStudents, searchTerm, quickFilter, sortConfig]);

    const stats = useMemo(() => ({
        total: allStudents.length,
        active: allStudents.filter(s => s.is_active).length,
        pending: allStudents.filter(s => !s.assigned_class_id).length,
        new: allStudents.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString()).length
    }), [allStudents]);

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedData = useMemo(() => filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredStudents, currentPage]);

    return (
        <div className="space-y-10 pb-24 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
                <div className="max-w-2xl">
                    <h1 className="text-4xl md:text-6xl font-serif font-black text-foreground tracking-tighter uppercase leading-none">
                        Student <span className="text-white/20 italic">Directory.</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4 w-full xl:w-auto">
                    <button onClick={() => setBulkAction('import')} className="flex-grow xl:flex-none px-10 py-5 bg-white/5 hover:bg-white/10 text-foreground font-black text-[11px] uppercase tracking-[0.25em] rounded-2xl border border-white/10 transition-all active:scale-95 flex items-center justify-center gap-3"><UploadIcon className="w-5 h-5 text-muted-foreground"/> Bulk Import</button>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex-grow xl:flex-none px-12 py-5 bg-primary text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 transform active:scale-95"><PlusIcon className="w-5 h-5"/> Register Node</button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Total Roster" value={stats.total} icon={<StudentsIcon className="w-8 h-8"/>} color="bg-indigo-600" active={quickFilter === 'All'} onClick={() => setQuickFilter('All')} description="Global identity count" />
                <KPICard title="Active Stream" value={stats.active} icon={<CheckCircleIcon className="w-8 h-8"/>} color="bg-emerald-600" active={quickFilter === 'Active'} onClick={() => setQuickFilter('Active')} description="Live portal sessions" />
                <KPICard title="Placement Pending" value={stats.pending} icon={<ClockIcon className="w-8 h-8"/>} color="bg-amber-600" active={quickFilter === 'Pending'} onClick={() => setQuickFilter('Pending')} description="Unassigned units" />
                <KPICard title="Newly Registered" value={stats.new} icon={<GraduationCapIcon className="w-8 h-8"/>} color="bg-purple-600" active={quickFilter === 'New'} onClick={() => setQuickFilter('New')} description="Enrolled today" />
            </div>

            <div className="bg-card border border-white/10 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,1)] overflow-hidden flex flex-col min-h-[650px] ring-1 ring-white/5 relative">
                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row gap-8 justify-between items-center relative z-10 bg-card/60 backdrop-blur-xl">
                    <div className="relative w-full md:max-w-md group">
                        <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-white/10 group-focus-within:text-primary transition-colors duration-300" />
                        <input type="text" placeholder="Filter registry by name or ID..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-14 pr-6 py-4 rounded-2xl border border-white/5 bg-black/20 text-sm font-medium text-white focus:bg-black/40 outline-none transition-all placeholder:text-white/5 focus:border-primary/40" />
                    </div>
                    <button onClick={fetchData} className="p-4 rounded-2xl bg-white/5 text-white/20 hover:text-primary transition-all border border-white/5 shadow-inner group"><RefreshIcon className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} /></button>
                </div>

                <div className="overflow-x-auto flex-grow relative z-10 custom-scrollbar">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#0f1115]/80 border-b border-white/5 text-[10px] font-black uppercase text-white/20 tracking-[0.3em] sticky top-0 z-20 backdrop-blur-xl">
                            <tr>
                                <th className="p-8 pl-10">Subject Identity</th>
                                <th className="p-8">Arbiter / Parent</th>
                                <th className="p-8">Placement Status</th>
                                <th className="p-8 text-center">Lifecycle Status</th>
                                <th className="p-8 text-right pr-10">Protocols</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-transparent">
                            {loading ? (
                                <tr><td colSpan={5} className="p-40 text-center"><Spinner size="lg" className="text-primary" /><p className="text-[10px] font-black uppercase text-white/10 mt-6 tracking-[0.5em] animate-pulse">Syncing Registry...</p></td></tr>
                            ) : paginatedData.map(student => (
                                <tr key={student.id} className={`hover:bg-white/[0.02] cursor-pointer group transition-all duration-300 ${student.id === highlightedId ? 'bg-primary/10 animate-pulse' : ''}`} onClick={() => setSelectedStudent(student)}>
                                    <td className="p-8 pl-10">
                                        <div className="flex items-center gap-6">
                                            <PremiumAvatar src={student.profile_photo_url} name={student.display_name} size="xs" className="w-14 h-14 rounded-2xl border border-white/10 shadow-2xl relative z-10" />
                                            <div>
                                                <p className="font-serif font-black text-white text-lg tracking-tight uppercase group-hover:text-primary transition-colors">{student.display_name}</p>
                                                <p className="text-[10px] text-white/30 font-mono tracking-widest mt-1 uppercase">NODE_{student.student_id_number || student.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-8"><div className="space-y-1"><p className="text-sm font-bold text-white/80">{student.parent_guardian_details || 'Unlinked'}</p></div></td>
                                    <td className="p-8">
                                        {student.assigned_class_id ? (
                                            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center font-black text-indigo-400 text-xs shadow-inner">{student.assigned_class_name}</div></div>
                                        ) : (
                                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 animate-pulse">PENDING PLACEMENT</span>
                                        )}
                                    </td>
                                    <td className="p-8 text-center"><span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-inner ${student.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{student.is_active ? 'Active' : 'Offline'}</span></td>
                                    <td className="p-8 text-right pr-10"><button className="p-4 rounded-2xl bg-white/5 text-white/10 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/5 shadow-xl"><MoreVerticalIcon className="w-5 h-5"/></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-8 border-t border-white/5 bg-[#0a0a0c]/80 flex justify-between items-center relative z-10">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Sequence <span className="text-white/60">{currentPage}</span> of {totalPages || 1}</span>
                    <div className="flex gap-3">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-4 rounded-2xl border border-white/5 bg-white/5 text-white/40 hover:text-white disabled:opacity-20 transition-all shadow-lg"><ChevronLeftIcon className="w-6 h-6"/></button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-4 rounded-2xl border border-white/5 bg-white/5 text-white/40 hover:text-white disabled:opacity-20 transition-all shadow-lg"><ChevronRightIcon className="w-6 h-6"/></button>
                    </div>
                </div>
            </div>

            {selectedStudent && <StudentProfileModal student={selectedStudent} onClose={() => setSelectedStudent(null)} onUpdate={fetchData} />}
            {isAddModalOpen && <AddStudentModal onClose={() => setIsAddModalOpen(false)} onSave={fetchData} />}
            {bulkAction && <BulkStudentActionsModal action={bulkAction} selectedIds={[]} onClose={() => setBulkAction(null)} onSuccess={fetchData} />}
        </div>
    );
};

export default StudentManagementTab;
