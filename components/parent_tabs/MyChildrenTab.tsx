
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, formatError } from '../../services/supabase';
import { AdmissionApplication, UserProfile } from '../../types';
import Spinner from '../common/Spinner';
import ChildProfileCard from './ChildProfileCard';
import ChildRegistrationModal from './ChildRegistrationModal';
import { PlusIcon } from '../icons/PlusIcon';
import { SearchIcon } from '../icons/SearchIcon';

type FilterType = 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED';

interface MyChildrenTabProps {
    onManageDocuments: (id: string) => void;
    profile: UserProfile;
}

const MyChildrenTab: React.FC<MyChildrenTabProps> = ({ onManageDocuments, profile }) => {
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
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    }, [profile?.id]);

    useEffect(() => {
        fetchData();
        
        // Setup Realtime Subscription for instant updates
        const channel = supabase.channel('family-nodes-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'admissions' }, () => {
                fetchData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'student_profiles' }, () => {
                fetchData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'student_enrollments' }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData]); 

    const filteredApplications = useMemo(() => {
        return applications.filter(app => {
            const matchesSearch = (app.applicant_name || '').toLowerCase().includes(searchTerm.toLowerCase());
            const status = (app.status || '').toUpperCase();
            
            if (activeFilter === 'APPROVED') return matchesSearch && (status === 'APPROVED' || status === 'VERIFIED' || status === 'ENROLLED');
            if (activeFilter === 'REJECTED') return matchesSearch && status === 'REJECTED';
            if (activeFilter === 'PENDING') {
                return matchesSearch && (status !== 'APPROVED' && status !== 'VERIFIED' && status !== 'REJECTED' && status !== 'ENROLLED');
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
        <div className="w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 font-sans">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-16">
                <div className="max-w-2xl">
                    <div className="flex items-center gap-3 mb-4">
                         <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em] border-l-2 border-primary/40 pl-4">Institutional Roster</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-serif font-black text-white tracking-tighter uppercase leading-none">
                        Family <span className="text-white/20 font-normal italic">Nodes.</span>
                    </h2>
                    <p className="text-white/40 text-[15px] leading-relaxed font-serif italic mt-6 max-w-lg border-l border-white/10 pl-8">
                        Centralized oversight for enrollment identities, academic records, and secure institutional access.
                    </p>
                </div>
                
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <button 
                        onClick={() => { setEditingChild(null); setIsModalOpen(true); }} 
                        className="flex-grow lg:flex-grow-0 h-12 md:h-14 px-10 bg-primary hover:bg-primary/90 text-white font-bold text-[12px] uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all transform active:scale-[0.98] hover:scale-[1.02] flex items-center justify-center gap-3 group"
                    >
                        <PlusIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" /> Provision Node
                    </button>
                </div>
            </div>

            {/* Filter Hub */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/[0.01] p-3 rounded-[2rem] border border-white/5 mb-12 shadow-inner">
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 w-full md:w-auto overflow-x-auto no-scrollbar">
                    {(['ALL', 'APPROVED', 'PENDING', 'REJECTED'] as FilterType[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[10px] font-black tracking-[0.15em] uppercase transition-all duration-300 ${activeFilter === f ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20' : 'text-white/30 hover:text-white/60'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                
                <div className="relative flex-grow w-full md:max-w-md group">
                    <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors duration-300" />
                    <input 
                        type="text" 
                        placeholder="Search identities..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-12 w-full pl-12 pr-6 bg-black/20 border border-white/5 rounded-xl text-sm font-medium text-white focus:bg-black/30 outline-none transition-all placeholder:text-white/10 focus:ring-4 focus:ring-primary/10"
                    />
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center gap-4 animate-in shake">
                    <AlertTriangleIcon className="w-6 h-6 shrink-0" />
                    <p className="text-sm font-bold uppercase tracking-wide">{error}</p>
                </div>
            )}

            {/* Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredApplications.map((app, idx) => (
                    <div key={app.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${idx * 60}ms` }}>
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
                
                {/* Empty State / Add Child Trigger */}
                <button 
                    onClick={() => { setEditingChild(null); setIsModalOpen(true); }}
                    className="flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed border-white/5 hover:border-primary/40 hover:bg-primary/[0.01] transition-all duration-700 group relative overflow-hidden h-full min-h-[340px] bg-black/20"
                >
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-6 transition-all duration-700 group-hover:bg-primary/10 group-hover:scale-110 border border-white/5 shadow-inner">
                        <PlusIcon className="w-6 h-6 text-white/10 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="text-center">
                        <span className="font-sans font-bold text-[13px] text-white/20 group-hover:text-white/60 transition-all uppercase tracking-[0.2em] block mb-2">Enroll Sibling</span>
                        <p className="text-[11px] text-white/10 font-medium italic group-hover:text-white/30 transition-all">Create a new family node to link an additional student.</p>
                    </div>
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

const AlertTriangleIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
);

export default MyChildrenTab;
