
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { TeacherClassOverview, TeacherClassDetails, ClassSubject, LessonPlan, FunctionComponentWithIcon } from '../../types';
import Spinner from '../common/Spinner';
import { UsersIcon } from '../icons/UsersIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { BookOpenIcon } from '../icons/BookOpenIcon';
import { XIcon } from '../icons/XIcon';

type DetailTab = 'roster' | 'assignments' | 'materials';

interface MyClassesTabProps {
    currentUserId: string;
}

const MyClassesTab: FunctionComponentWithIcon<MyClassesTabProps> = ({ currentUserId }) => {
    const [overviews, setOverviews] = useState<TeacherClassOverview[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [classDetails, setClassDetails] = useState<TeacherClassDetails | null>(null);
    const [loading, setLoading] = useState({ overviews: true, details: false });
    const [error, setError] = useState<string | null>(null);

    const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>('roster');
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);

    const fetchOverviews = useCallback(async () => {
        setLoading({ overviews: true, details: false });
        setError(null);
        const { data, error } = await supabase.rpc('get_teacher_class_overviews');
        if (error) setError(`Failed to fetch classes: ${error.message}`);
        else setOverviews(data || []);
        setLoading(prev => ({ ...prev, overviews: false }));
    }, []);

    useEffect(() => {
        fetchOverviews();
    }, [fetchOverviews]);

    const handleSelectClass = useCallback(async (classId: number) => {
        if (selectedClassId === classId) {
            setSelectedClassId(null);
            setClassDetails(null);
            return;
        }
        setSelectedClassId(classId);
        setLoading(prev => ({ ...prev, details: true }));
        setError(null);
        const { data, error } = await supabase.rpc('get_teacher_class_details', { p_class_id: classId });
        if (error) setError(`Failed to fetch class details: ${error.message}`);
        else setClassDetails(data);
        setLoading(prev => ({ ...prev, details: false }));
    }, [selectedClassId]);

    const refreshDetails = () => {
        if (selectedClassId) handleSelectClass(selectedClassId);
    }
    
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">My Classes</h2>
            {loading.overviews ? <div className="flex justify-center p-4"><Spinner /></div> :
             error && !classDetails ? <p className="text-red-500 p-4">{error}</p> :
             (overviews ?? []).length === 0 ? <p className="text-muted-foreground text-center">You are not assigned to any classes.</p> :
            (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {overviews.map(cls => (
                        <ClassCard 
                            key={cls.id} 
                            classOverview={cls} 
                            isSelected={selectedClassId === cls.id} 
                            onClick={() => handleSelectClass(cls.id)}
                        />
                    ))}
                </div>
            )}

            {loading.details && <div className="flex justify-center p-8"><Spinner size="lg" /></div>}

            {selectedClassId && classDetails && !loading.details && (
                <div className="mt-8 bg-card border border-border rounded-xl shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <h3 className="font-bold text-lg text-foreground">{overviews.find(c=>c.id === selectedClassId)?.name} - Class Details</h3>
                        <div className="flex bg-muted p-1 rounded-lg mt-2 sm:mt-0">
                            {(['roster', 'assignments', 'materials'] as DetailTab[]).map(tab => (
                                <button key={tab} onClick={() => setActiveDetailTab(tab)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeDetailTab === tab ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="p-6">
                        {activeDetailTab === 'roster' && <RosterView details={classDetails} />}
                        {activeDetailTab === 'assignments' && <AssignmentsView details={classDetails} onAdd={() => setIsAssignmentModalOpen(true)} />}
                        {activeDetailTab === 'materials' && <MaterialsView details={classDetails} onAdd={() => setIsMaterialModalOpen(true)} />}
                    </div>
                </div>
            )}

            {isAssignmentModalOpen && selectedClassId && classDetails && (
                <AddAssignmentModal 
                    classId={selectedClassId} 
                    subjects={classDetails.subjects ?? []} 
                    onClose={() => setIsAssignmentModalOpen(false)} 
                    onSuccess={refreshDetails}
                    currentUserId={currentUserId}
                />
            )}
            {isMaterialModalOpen && selectedClassId && classDetails && (
                <AddMaterialModal 
                    classId={selectedClassId} 
                    subjects={classDetails.subjects ?? []} 
                    onClose={() => setIsMaterialModalOpen(false)} 
                    onSuccess={refreshDetails}
                    currentUserId={currentUserId}
                />
            )}
        </div>
    );
};

// Sub-components for detail view
const ClassCard: React.FC<{classOverview: TeacherClassOverview, isSelected: boolean, onClick: ()=>void}> = ({classOverview, isSelected, onClick}) => (
    <button onClick={onClick} className={`p-6 rounded-xl border-2 text-left transition-all duration-300 ${isSelected ? 'bg-primary/10 border-primary shadow-lg' : 'bg-card hover:bg-muted/50 border-border hover:border-primary/50'}`}>
        <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg text-foreground">{classOverview.name}</h3>
            <div className={`flex items-center gap-1.5 text-sm font-semibold ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                <UsersIcon className="w-4 h-4" />
                <span>{classOverview.student_count}</span>
            </div>
        </div>
        <p className={`text-sm mt-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>Click to manage</p>
    </button>
);

const RosterView: React.FC<{details: TeacherClassDetails}> = ({details}) => {
    const roster = details?.roster ?? [];
    return (
        <div>
            {roster.length === 0 ? <p className="text-muted-foreground text-center py-8">No students in this class.</p> : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roster.map(student => (
                        <li key={student.id} className="p-4 bg-card rounded-xl border border-border flex items-center gap-4 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                            <div className="h-12 w-12 rounded-full overflow-hidden bg-muted flex-shrink-0 border border-border/50">
                                <img className="h-full w-full object-cover" src={`https://api.dicebear.com/8.x/initials/svg?seed=${student.display_name}`} alt="" />
                            </div>
                            <div>
                                <p className="font-bold text-foreground">{student.display_name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {student.roll_number ? `Roll No. ${student.roll_number}` : 'Student'}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const AssignmentsView: React.FC<{details: TeacherClassDetails, onAdd: ()=>void}> = ({details, onAdd}) => {
    const assignments = details?.assignments ?? [];
    return (
        <div>
            <div className="flex justify-end mb-4"><button onClick={onAdd} className="btn-primary-sm"><PlusIcon className="w-4 h-4"/>Add Assignment</button></div>
            {assignments.length === 0 ? <p className="text-muted-foreground">No assignments posted for this class yet.</p> : (
                <div className="space-y-3">
                    {assignments.map(a => (
                        <div key={a.id} className="p-4 rounded-lg border border-border bg-muted/20">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-foreground">{a.title}</p>
                                    <p className="text-xs text-muted-foreground">{a.subject}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-medium text-muted-foreground">Due: {new Date(a.due_date).toLocaleDateString()}</p>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">{a.status}</span>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">{a.description}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const MaterialsView: React.FC<{details: TeacherClassDetails, onAdd: ()=>void}> = ({details, onAdd}) => {
    const materials = details?.studyMaterials ?? [];
    return (
        <div>
            <div className="flex justify-end mb-4"><button onClick={onAdd} className="btn-primary-sm"><PlusIcon className="w-4 h-4"/>Add Material</button></div>
            {materials.length === 0 ? <p className="text-muted-foreground">No study materials uploaded for this class yet.</p> : (
                <div className="space-y-3">
                    {materials.map(m => (
                        <div key={m.id} className="p-3 rounded-lg border border-border bg-muted/20 flex items-center gap-3">
                            <BookOpenIcon className="w-5 h-5 text-primary flex-shrink-0"/>
                            <div className="flex-grow">
                                <p className="font-semibold text-foreground text-sm">{m.title}</p>
                                <p className="text-xs text-muted-foreground">{m.file_name}</p>
                            </div>
                            <p className="text-xs text-muted-foreground flex-shrink-0">{new Date(m.created_at).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            )}
            <style>{`.btn-primary-sm { display: inline-flex; items-center: center; gap: 0.5rem; background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600; font-size: 0.875rem; transition: background-color 0.2s; } .btn-primary-sm:hover { background-color: hsl(var(--primary) / 0.9); }`}</style>
        </div>
    );
};

const AddAssignmentModal: React.FC<{classId: number, subjects: ClassSubject[], onClose:()=>void, onSuccess:()=>void, currentUserId: string}> = ({classId, subjects, onClose, onSuccess, currentUserId}) => {
    const [title, setTitle] = useState('');
    const [subjectId, setSubjectId] = useState<string>(subjects?.[0]?.id?.toString() || '');
    const [dueDate, setDueDate] = useState('');
    const [description, setDescription] = useState('');
    const [maxScore, setMaxScore] = useState(100);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        const isoDate = new Date(dueDate).toISOString();

        const { error: rpcError } = await supabase.rpc('create_homework_assignment', {
            p_class_id: classId,
            p_subject_id: parseInt(subjectId),
            p_teacher_id: currentUserId, 
            p_title: title,
            p_description: description,
            p_due_date: isoDate,
            p_attachments: [], 
            p_max_score: maxScore,
            p_status: 'Active'
        });

        if (rpcError) setError(rpcError.message);
        else {
            onSuccess();
            onClose();
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-card w-full max-w-lg rounded-xl shadow-lg border border-border" onClick={e=>e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <header className="p-4 border-b border-border flex justify-between items-center"><h3 className="font-bold text-lg">New Assignment</h3><button type="button" onClick={onClose}><XIcon className="w-5 h-5"/></button></header>
                    <main className="p-6 space-y-4">
                        {error && <p className="text-destructive bg-destructive/10 p-2 rounded-md text-sm">{error}</p>}
                        <div><label className="input-label">Title</label><input type="text" value={title} onChange={e=>setTitle(e.target.value)} required className="input-base"/></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="input-label">Subject</label><select value={subjectId} onChange={e=>setSubjectId(e.target.value)} required className="input-base">{(subjects ?? []).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                            <div><label className="input-label">Due Date & Time</label><input type="datetime-local" value={dueDate} onChange={e=>setDueDate(e.target.value)} required className="input-base"/></div>
                        </div>
                        <div><label className="input-label">Max Score</label><input type="number" value={maxScore} onChange={e=>setMaxScore(parseInt(e.target.value))} required className="input-base"/></div>
                        <div><label className="input-label">Description</label><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={4} className="input-base"/></div>
                    </main>
                    <footer className="p-4 border-t border-border flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button type="submit" disabled={loading} className="btn-primary min-w-[80px]">{loading ? <Spinner size="sm"/> : 'Create'}</button></footer>
                </form>
            </div>
            <style>{`
                .input-base { width: 100%; background-color: hsl(var(--background)); border: 1px solid hsl(var(--input)); border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; }
                .input-label { font-size: 0.875rem; font-weight: 500; color: hsl(var(--muted-foreground)); margin-bottom: 0.5rem; display: block; }
                .btn-primary { padding: 0.5rem 1.25rem; background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; display: flex; justify-content: center; } .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
                .btn-secondary { padding: 0.5rem 1.25rem; background-color: hsl(var(--muted)); color: hsl(var(--foreground)); border-radius: 0.5rem; font-weight: 600; }
            `}</style>
        </div>
    );
};

const AddMaterialModal: React.FC<{classId: number, subjects: ClassSubject[], onClose:()=>void, onSuccess:()=>void, currentUserId: string}> = ({classId, subjects, onClose, onSuccess, currentUserId}) => {
    const [title, setTitle] = useState('');
    const [subjectId, setSubjectId] = useState<string>(subjects?.[0]?.id?.toString() || '');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File|null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) { setError('Please select a file to upload.'); return; }
        setLoading(true);
        setError('');

        try {
            if (!currentUserId) throw new Error("User not authenticated.");

            const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
            const filePath = `${currentUserId}/${classId}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage.from('study-materials').upload(filePath, file);
            if (uploadError) throw uploadError;

            const { error: rpcError } = await supabase.rpc('teacher_create_study_material', {
                p_class_id: classId,
                p_subject_id: parseInt(subjectId),
                p_title: title,
                p_description: description,
                p_file_name: file.name,
                p_file_path: filePath,
                p_file_type: fileExt,
                p_uploaded_by: currentUserId
            });
            if (rpcError) throw rpcError;

            onSuccess();
            onClose();

        } catch(err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-card w-full max-w-lg rounded-xl shadow-lg border border-border" onClick={e=>e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <header className="p-4 border-b border-border flex justify-between items-center"><h3 className="font-bold text-lg">Add Study Material</h3><button type="button" onClick={onClose}><XIcon className="w-5 h-5"/></button></header>
                    <main className="p-6 space-y-4">
                        {error && <p className="text-destructive bg-destructive/10 p-2 rounded-md text-sm">{error}</p>}
                        <div><label className="input-label">Title</label><input type="text" value={title} onChange={e=>setTitle(e.target.value)} required className="input-base"/></div>
                        <div><label className="input-label">Subject</label><select value={subjectId} onChange={e=>setSubjectId(e.target.value)} required className="input-base">{(subjects ?? []).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                        <div><label className="input-label">Description</label><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} className="input-base"/></div>
                        <div><label className="input-label">File</label><input type="file" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} required className="input-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/></div>
                    </main>
                    <footer className="p-4 border-t border-border flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button type="submit" disabled={loading} className="btn-primary min-w-[80px]">{loading ? <Spinner size="sm"/> : 'Upload'}</button></footer>
                </form>
            </div>
            <style>{`
                .input-base { width: 100%; background-color: hsl(var(--background)); border: 1px solid hsl(var(--input)); border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; }
                .input-label { font-size: 0.875rem; font-weight: 500; color: hsl(var(--muted-foreground)); margin-bottom: 0.5rem; display: block; }
                .btn-primary { padding: 0.5rem 1.25rem; background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; display: flex; justify-content: center; } .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
                .btn-secondary { padding: 0.5rem 1.25rem; background-color: hsl(var(--muted)); color: hsl(var(--foreground)); border-radius: 0.5rem; font-weight: 600; }
            `}</style>
        </div>
    );
};


MyClassesTab.Icon = UsersIcon;
export default MyClassesTab;
