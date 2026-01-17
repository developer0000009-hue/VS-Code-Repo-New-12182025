
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { SchoolClass, Course, TeacherExtended } from '../../types';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { BookIcon } from '../icons/BookIcon';
import { SchoolIcon } from '../icons/SchoolIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { SearchIcon } from '../icons/SearchIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { ClockIcon } from '../icons/ClockIcon';

interface AssignSubjectModalProps {
    teacher: TeacherExtended;
    onClose: () => void;
    onSuccess: () => void;
}

const AssignSubjectModal: React.FC<AssignSubjectModalProps> = ({ teacher, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGrade, setSelectedGrade] = useState<string>('All');
    const [selectedMapping, setSelectedMapping] = useState<any | null>(null);

    // Initial Load
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('class_subjects')
                    .select(`
                        id, class_id, subject_id, teacher_id,
                        school_classes(id, name, grade_level),
                        courses(id, title, code, credits, category)
                    `);
                
                if (error) throw error;
                setAvailableSubjects(data || []);
                
                const { data: classData } = await supabase.from('school_classes').select('*');
                if (classData) setClasses(classData);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const grades = useMemo(() => {
        const distinctGrades = Array.from(new Set(classes.map(c => c.grade_level).filter(Boolean)));
        return ['All', ...distinctGrades.sort((a, b) => Number(a) - Number(b))];
    }, [classes]);

    const filteredItems = useMemo(() => {
        return availableSubjects.filter(item => {
            const matchesGrade = selectedGrade === 'All' || item.school_classes?.grade_level === selectedGrade;
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || 
                item.courses?.title.toLowerCase().includes(searchLower) ||
                item.courses?.code.toLowerCase().includes(searchLower) ||
                item.school_classes?.name.toLowerCase().includes(searchLower);
            
            return matchesGrade && matchesSearch;
        });
    }, [availableSubjects, selectedGrade, searchTerm]);

    const handleAssign = async () => {
        if (!selectedMapping) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('class_subjects')
                .update({ teacher_id: teacher.id })
                .match({ id: selectedMapping.id });
            
            if (error) throw error;
            onSuccess();
            onClose();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Workload Logic
    const currentLoad = teacher.details?.workload_limit || 30;
    const selectedLoadImpact = selectedMapping?.courses?.credits || 4;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-background w-full max-w-5xl rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh] ring-1 ring-black/5" onClick={e => e.stopPropagation()}>
                
                {/* Header Area */}
                <div className="p-8 border-b border-border bg-card/40 backdrop-blur-xl flex justify-between items-center relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                             <div className="p-2 bg-primary/10 rounded-xl text-primary shadow-inner">
                                <BookIcon className="w-5 h-5"/>
                             </div>
                             <h3 className="text-2xl font-black text-foreground tracking-tight">Subject Stewardship</h3>
                        </div>
                        <p className="text-sm text-muted-foreground ml-11">Assign academic responsibility to <span className="text-primary font-bold">{teacher.display_name}</span></p>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-2xl hover:bg-muted text-muted-foreground transition-all">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                {/* Search & Filter Dock */}
                <div className="px-8 py-5 bg-muted/20 border-b border-border flex flex-col md:flex-row gap-5 items-center">
                    <div className="relative flex-grow w-full group">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Filter by subject name, code or class..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-background/50 border border-input rounded-[1.25rem] text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 scrollbar-hide">
                        {grades.map(g => (
                            <button 
                                key={g} 
                                onClick={() => setSelectedGrade(g as string)}
                                className={`px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border ${selectedGrade === g ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' : 'bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                            >
                                {g === 'All' ? 'All Grades' : `Grade ${g}`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Subject Grid */}
                <div className="flex-grow overflow-y-auto p-8 custom-scrollbar bg-background/40">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Spinner size="lg" />
                            <p className="text-xs font-black text-muted-foreground animate-pulse tracking-widest uppercase">Fetching Academic Grid...</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-24 animate-in fade-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-muted/30 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-border group">
                                <BookIcon className="w-12 h-12 text-muted-foreground/30 group-hover:scale-110 transition-transform" />
                            </div>
                            <h4 className="text-xl font-bold text-foreground">No matching subjects found</h4>
                            <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
                                We couldn't find any unmapped courses matching your search for <strong>Grade {selectedGrade}</strong>.
                            </p>
                            <button onClick={() => { setSearchTerm(''); setSelectedGrade('All'); }} className="mt-6 text-primary text-xs font-black uppercase tracking-widest hover:underline">Clear All Filters</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredItems.map(item => {
                                const isSelected = selectedMapping?.id === item.id;
                                const isAssigned = !!item.teacher_id;
                                const isSelf = item.teacher_id === teacher.id;

                                return (
                                    <div 
                                        key={item.id}
                                        onClick={() => !isSelf && setSelectedMapping(item)}
                                        className={`
                                            group relative p-6 rounded-[2rem] border-2 text-left transition-all duration-500 
                                            ${isSelected 
                                                ? 'border-primary bg-primary/5 ring-4 ring-primary/5 shadow-2xl scale-[1.02]' 
                                                : isSelf 
                                                    ? 'border-emerald-500/20 bg-emerald-500/5 opacity-80 cursor-default'
                                                    : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30 hover:shadow-xl hover:-translate-y-1 cursor-pointer'
                                            }
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 rounded-2xl transition-all duration-500 shadow-sm ${isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'}`}>
                                                <BookIcon className="w-6 h-6"/>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                {isSelf ? (
                                                    <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-lg bg-emerald-500 text-white border border-emerald-400 shadow-sm">Current Assignment</span>
                                                ) : isAssigned ? (
                                                    <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-inner">Occupied</span>
                                                ) : (
                                                    <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-inner">Available</span>
                                                )}
                                                <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">{item.courses?.category || 'General'}</span>
                                            </div>
                                        </div>

                                        <h4 className="font-black text-foreground text-lg tracking-tight truncate group-hover:text-primary transition-colors">{item.courses?.title}</h4>
                                        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                                                <SchoolIcon className="w-3.5 h-3.5 opacity-50"/> {item.school_classes?.name}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-primary">
                                                <ClockIcon className="w-3.5 h-3.5"/> {item.courses?.credits || 4} Hrs
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <div className="absolute top-4 right-4 animate-in zoom-in duration-500">
                                                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/40 ring-4 ring-background">
                                                    <CheckCircleIcon className="w-5 h-5" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Analysis Dock */}
                <div className="p-8 border-t border-border bg-card flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                    <div className="flex items-center gap-6 w-full md:w-auto">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Impact Analysis</span>
                            {selectedMapping ? (
                                <div className="flex items-center gap-3">
                                    <p className="text-xl font-black text-foreground">+{selectedLoadImpact} <span className="text-sm font-bold text-muted-foreground">Hrs / Week</span></p>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border animate-pulse ${selectedLoadImpact > 5 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                        High Impact
                                    </span>
                                </div>
                            ) : (
                                <p className="text-sm font-bold text-muted-foreground italic">Select a subject to view workload metrics</p>
                            )}
                        </div>
                        {selectedMapping && (
                            <div className="h-10 w-px bg-border hidden lg:block"></div>
                        )}
                        {selectedMapping && (
                            <div className="hidden lg:flex flex-col">
                                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">New Total Load</span>
                                <p className="text-xl font-black text-primary">{(teacher.details?.workload_limit || 0) + selectedLoadImpact} / 30 <span className="text-xs font-bold opacity-60">Hrs</span></p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button onClick={onClose} className="flex-1 md:flex-none px-8 py-3.5 rounded-2xl text-xs font-black text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95 uppercase tracking-widest">
                            Cancel
                        </button>
                        <button 
                            onClick={handleAssign} 
                            disabled={!selectedMapping || saving}
                            className={`
                                flex-grow md:flex-none px-12 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.1em] shadow-2xl transition-all flex items-center justify-center gap-3 transform active:scale-95
                                ${!selectedMapping 
                                    ? 'bg-muted text-muted-foreground/50 cursor-not-allowed grayscale' 
                                    : 'bg-primary text-primary-foreground shadow-primary/30 hover:bg-primary/90 hover:-translate-y-1'
                                }
                            `}
                        >
                            {saving ? <Spinner size="sm" className="text-current"/> : <><CheckCircleIcon className="w-5 h-5"/> Confirm Mapping</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignSubjectModal;
