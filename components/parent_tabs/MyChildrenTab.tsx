
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { AdmissionApplication, UserProfile } from '../../types';
import Spinner from '../common/Spinner';
import ChildProfileCard from './ChildProfileCard';
import ChildRegistrationModal from './ChildRegistrationModal';
import { PlusIcon } from '../icons/PlusIcon';
import { SearchIcon } from '../icons/SearchIcon';
import { RefreshIcon } from '../icons/RefreshIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';

type FilterType = 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED';

// Fix: Changed onManageDocuments parameter type from number to string to match UUID standard.
const MyChildrenTab: React.FC<{ onManageDocuments: (id: string) => void; profile: UserProfile }> = ({ onManageDocuments, profile }) => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState<AdmissionApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingChild, setEditingChild] = useState<AdmissionApplication | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    
    const fetchData = useCallback(async () => {
        if (!profile?.id) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error: rpcError } = await supabase.rpc('get_my_children_profiles');
            if (rpcError) throw rpcError;
            setApplications((data || []) as AdmissionApplication[]);
        } catch (err: any) {
            setError(err.message || "Identity synchronization protocol failure.");
        } finally {
            setLoading(false);
        }
    }, [profile?.id]);

    useEffect(() => { fetchData(); }, [fetchData]); 

    const filteredApplications = useMemo(() => {
        return applications.filter(app => {
            const matchesSearch = (app.applicant_name || '').toLowerCase().includes(searchTerm.toLowerCase());
            const status = (app.status || '').toUpperCase();
            
            if (activeFilter === 'APPROVED') return matchesSearch && (status === 'APPROVED' || status === 'VERIFIED');
            if (activeFilter === 'REJECTED') return matchesSearch && status === 'REJECTED';
            if (activeFilter === 'PENDING') {
                return matchesSearch && (status !== 'APPROVED' && status !== 'VERIFIED' && status !== 'REJECTED');
            }
            return matchesSearch;
        });
    }, [applications, activeFilter, searchTerm]);

    if (loading && applications.length === 0 && !error) {
        return (
            <div className="flex flex-col items-center justify-center py-40">
                <Spinner size="lg" className="text-primary" />
                <p className="text-[11px] font-black uppercase text-white/20 mt-8 tracking-[0.4em] animate-pulse">Syncing Family Ledger</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto animate-in fade-in duration-1000 pb-20">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                         <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em] border-l-2 border-primary/40 pl-4">Institutional Roster</span>
                    </div>
                    <h2 className="text-[clamp(34px,3.2vw,48px)] font-serif font-black text-white tracking-[-0.03em] leading-none uppercase">
                        FAMILY <span className="text-white/30 font-normal italic">NODES.</span>
                    </h2>
                    <p className="text-white/40 text-[16px] leading-relaxed font-serif italic mt-6 max-w-lg border-l border-white/5 pl-8">
                        Centralized management for enrollment identities, academic milestones, and cryptographic access permits.
                    </p>
                </div>
                
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <button 
                        onClick={() => { setEditingChild(null); setIsModalOpen(true); }} 
                        className="flex-grow lg:flex-grow-0 h-[62px] px-10 bg-primary hover:bg-primary/90 text-white font-black text-[11px] uppercase tracking-[0.25em] rounded-2xl shadow-2xl shadow-primary/20 transition-all transform active:scale-95 flex items-center justify-center gap-3 group"
                    >
                        <PlusIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" /> Provision Node
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/[0.02] p-4 rounded-[2rem] border border-white/5 mb-10 shadow-inner">
                <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 w-full md:w-auto overflow-x-auto no-scrollbar">
                    {(['ALL', 'APPROVED', 'PENDING', 'REJECTED'] as FilterType[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-500 ${activeFilter === f ? 'bg-[#1a1d24] text-primary shadow-2xl ring-1 ring-white/10' : 'text-white/20 hover:text-white/40'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                
                <div className="relative flex-grow w-full md:max-w-md group">
                    <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within:text-primary transition-colors duration-300" />
                    <input 
                        type="text" 
                        placeholder="Search identities..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-[58px] w-full pl-14 pr-6 bg-black/20 border border-white/5 rounded-2xl text-sm font-medium text-white focus:bg-black/40 outline-none transition-all placeholder:text-white/5 focus:border-primary/30"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredApplications.map((app, idx) => (
                    <div key={app.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${idx * 80}ms` }}>
                        <ChildProfileCard 
                            child={app}
                            isExpanded={false}
                            onToggleExpand={() => {}}
                            onEdit={() => { setEditingChild(app); setIsModalOpen(true); }}
                            onManageDocuments={() => onManageDocuments(app.id)}
                            onNavigateDashboard={async () => {
                                const { error } = await supabase.rpc('parent_switch_student_view', { p_new_admission_id: app.id });
                                if (!error) navigate('/student');
                            }}
                            index={idx + 1}
                        />
                    </div>
                ))}
                
                <button 
                    onClick={() => { setEditingChild(null); setIsModalOpen(true); }}
                    className="flex flex-col items-center justify-center p-12 rounded-[2.5rem] border-2 border-dashed border-white/5 hover:border-primary/40 hover:bg-primary/[0.01] transition-all duration-700 group relative overflow-hidden h-full min-h-[300px] bg-black/20"
                >
                    <div className="w-16 h-16 rounded-3xl bg-white/[0.03] flex items-center justify-center mb-6 transition-all duration-700 group-hover:bg-primary/10 group-hover:scale-110 border border-white/5">
                        <PlusIcon className="w-6 h-6 text-white/10 group-hover:text-primary transition-colors" />
                    </div>
                    <span className="font-serif font-black text-xl text-white/10 group-hover:text-white/30 transition-all uppercase tracking-widest">Enroll Sibling</span>
                </button>
            </div>

            {isModalOpen && (
                <ChildRegistrationModal 
                    child={editingChild}
                    onClose={() => { setIsModalOpen(false); setEditingChild(null); }}
                    onSave={fetchData}
                    currentUserId={profile.id}
                />
            )}
        </div>
    );
};

export default MyChildrenTab;
