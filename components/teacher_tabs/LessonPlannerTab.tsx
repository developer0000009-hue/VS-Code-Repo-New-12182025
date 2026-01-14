
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { SchoolClass, ClassSubject, LessonPlan, FunctionComponentWithIcon } from '../../types';
import Spinner from '../common/Spinner';
import { PlusIcon } from '../icons/PlusIcon';
import { ClipboardListIcon } from '../icons/ClipboardListIcon';
import { XIcon } from '../icons/XIcon';
import { BookOpenIcon } from '../icons/BookOpenIcon';
import { DownloadIcon } from '../icons/DownloadIcon';

interface LessonPlannerTabProps {
    currentUserId: string;
}

const LessonPlannerTab: FunctionComponentWithIcon<LessonPlannerTabProps> = ({ currentUserId }) => {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [subjects, setSubjects] = useState<ClassSubject[]>([]);
    const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [loading, setLoading] = useState({ classes: true, plans: false });
    const [error, setError] = useState<string | null>(null);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [viewingPlan, setViewingPlan] = useState<LessonPlan | null>(null);

    const fetchClasses = useCallback(async () => {
        setLoading({ classes: true, plans: false });
        const { data, error } = await supabase.rpc('get_teacher_classes');
        if (error) setError(`Failed to fetch classes: ${error.message}`);
        else {
            setClasses(data || []);
            if (data && data.length > 0 && !selectedClassId) {
                setSelectedClassId(data[0].id.toString());
            }
        }
        setLoading(prev => ({ ...prev, classes: false }));
    }, [selectedClassId]);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    const fetchLessonPlans = useCallback(async () => {
        if (!selectedClassId) return;
        setLoading(prev => ({ ...prev, plans: true }));
        setError(null);
        
        const [plansRes, subjectsRes] = await Promise.all([
            supabase.rpc('get_teacher_lesson_plans', { p_class_id: parseInt(selectedClassId) }),
            supabase.rpc('get_teacher_class_details', { p_class_id: parseInt(selectedClassId) })
        ]);
        
        if (plansRes.error) setError(plansRes.error.message);
        else setLessonPlans(plansRes.data || []);

        if (subjectsRes.error) setError(subjectsRes.error.message);
        else setSubjects(subjectsRes.data.subjects || []);

        setLoading(prev => ({ ...prev, plans: false }));
    }, [selectedClassId]);
    
    useEffect(() => {
        fetchLessonPlans();
    }, [fetchLessonPlans]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-xl font-bold">Lesson Planner</h2>
                <div className="flex items-center gap-4">
                    <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="input-base w-full sm:w-48">
                        {loading.classes ? <option>Loading...</option> : classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button onClick={() => setIsAddModalOpen(true)} disabled={!selectedClassId || loading.classes} className="btn-primary-sm">
                        <PlusIcon className="w-4 h-4"/> New Plan
                    </button>
                </div>
            </div>

            {loading.plans ? <div className="flex justify-center p-8"><Spinner/></div> :
             error ? <p className="text-destructive p-4 bg-destructive/10 rounded-md">{error}</p> :
             lessonPlans.length === 0 ? (
                <div className="text-center py-16 bg-muted/20 border-2 border-dashed border-border rounded-xl">
                    <ClipboardListIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="font-medium text-foreground">No lesson plans created for this class yet.</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lessonPlans.map(plan => (
                        <div 
                            key={plan.id} 
                            onClick={() => setViewingPlan(plan)} 
                            className="bg-card border border-border rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg group relative hover:border-primary/50"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-semibold text-primary">{plan.subject_name}</p>
                                    <h4 className="font-bold mt-1 text-foreground">{plan.title}</h4>
                                </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{plan.objectives}</p>
                            
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                                <p className="text-xs font-medium text-muted-foreground">Date: {new Date(plan.lesson_date).toLocaleDateString()}</p>
                                <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded border border-border">{plan.resources.length} resource(s)</span>
                            </div>
                        </div>
                    ))}
                </div>
             )}
            
            {isAddModalOpen && selectedClassId && (
                <AddLessonPlanModal 
                    classId={parseInt(selectedClassId)} 
                    subjects={subjects} 
                    onClose={() => setIsAddModalOpen(false)} 
                    onSuccess={fetchLessonPlans}
                    currentUserId={currentUserId}
                />
            )}

            {viewingPlan && (
                <ViewLessonPlanModal
                    plan={viewingPlan}
                    onClose={() => setViewingPlan(null)}
                />
            )}
            
            <style>{`
                .input-base { width: 100%; background-color: hsl(var(--background)); border: 1px solid hsl(var(--input)); border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; }
                .input-label { font-size: 0.875rem; font-weight: 500; color: hsl(var(--muted-foreground)); margin-bottom: 0.5rem; display: block; }
                .btn-primary-sm { display: inline-flex; items-center: center; gap: 0.5rem; background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600; font-size: 0.875rem; transition: background-color 0.2s; } .btn-primary-sm:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>
        </div>
    );
};

const AddLessonPlanModal: React.FC<{classId: number, subjects: ClassSubject[], onClose:()=>void, onSuccess:()=>void, currentUserId: string}> = ({classId, subjects, onClose, onSuccess, currentUserId}) => {
    const [formData, setFormData] = useState({ title: '', subject_id: subjects[0]?.id.toString() || '', lesson_date: '', objectives: '', activities: ''});
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            if (!currentUserId) throw new Error("User not authenticated.");

            const uploadedResources = [];
            for (const file of files) {
                const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
                const filePath = `${currentUserId}/${classId}-${Date.now()}-${file.name}`;
                const { error: uploadError } = await supabase.storage.from('lesson-plan-resources').upload(filePath, file);
                if (uploadError) throw uploadError;
                uploadedResources.push({ file_name: file.name, file_path: filePath, file_type: fileExt });
            }

            const planData = {
                class_id: classId,
                ...formData,
                resources: uploadedResources,
                teacher_id: currentUserId,
            };

            const { error: rpcError } = await supabase.rpc('teacher_create_lesson_plan', { p_plan_data: planData });
            if (rpcError) throw rpcError;

            onSuccess();
            onClose();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-card w-full max-w-2xl rounded-xl shadow-lg border border-border" onClick={e=>e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <header className="p-4 border-b border-border flex justify-between items-center"><h3 className="font-bold text-lg">New Lesson Plan</h3><button type="button" onClick={onClose}><XIcon className="w-5 h-5"/></button></header>
                    <main className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {error && <p className="text-destructive bg-destructive/10 p-2 rounded-md text-sm">{error}</p>}
                        <div><label className="input-label">Title</label><input type="text" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} required className="input-base"/></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="input-label">Subject</label><select value={formData.subject_id} onChange={e=>setFormData({...formData, subject_id: e.target.value})} required className="input-base">{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                            <div><label className="input-label">Lesson Date</label><input type="date" value={formData.lesson_date} onChange={e=>setFormData({...formData, lesson_date: e.target.value})} required className="input-base"/></div>
                        </div>
                        <div><label className="input-label">Learning Objectives</label><textarea value={formData.objectives} onChange={e=>setFormData({...formData, objectives: e.target.value})} rows={3} className="input-base"/></div>
                        <div><label className="input-label">Activities & Tasks</label><textarea value={formData.activities} onChange={e=>setFormData({...formData, activities: e.target.value})} rows={3} className="input-base"/></div>
                        <div><label className="input-label">Attach Resources</label><input type="file" multiple onChange={e => setFiles(Array.from(e.target.files || []))} className="input-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/></div>
                    </main>
                    <footer className="p-4 border-t border-border flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button type="submit" disabled={loading} className="btn-primary min-w-[80px]">{loading ? <Spinner size="sm"/> : 'Save Plan'}</button></footer>
                </form>
            </div>
             <style>{`.btn-primary { padding: 0.5rem 1.25rem; background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; display: flex; justify-content: center; } .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; } .btn-secondary { padding: 0.5rem 1.25rem; background-color: hsl(var(--muted)); color: hsl(var(--foreground)); border-radius: 0.5rem; font-weight: 600; }`}</style>
        </div>
    );
};

const ViewLessonPlanModal: React.FC<{ plan: LessonPlan; onClose: () => void; }> = ({ plan, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-card w-full max-w-2xl rounded-xl shadow-lg border border-border flex flex-col max-h-[90vh]" onClick={e=>e.stopPropagation()}>
                <header className="p-4 border-b border-border flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">{plan.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{plan.subject_name} - {new Date(plan.lesson_date).toLocaleDateString()}</p>
                    </div>
                    <button type="button" onClick={onClose}><XIcon className="w-5 h-5" /></button>
                </header>
                <main className="p-6 space-y-4 overflow-y-auto">
                    <div><h4 className="font-semibold text-sm mb-1 text-foreground">Objectives</h4><p className="text-sm text-muted-foreground whitespace-pre-wrap">{plan.objectives}</p></div>
                    <div><h4 className="font-semibold text-sm mb-1 text-foreground">Activities</h4><p className="text-sm text-muted-foreground whitespace-pre-wrap">{plan.activities}</p></div>
                    {plan.resources.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-sm mb-2 text-foreground">Resources</h4>
                            <div className="space-y-2">
                                {plan.resources.map(res => (
                                    <a key={res.resource_id} href={supabase.storage.from('lesson-plan-resources').getPublicUrl(res.file_path).data.publicUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-muted/50 rounded-md hover:bg-muted transition-colors">
                                        <BookOpenIcon className="w-4 h-4 text-primary" />
                                        <span className="text-sm font-medium text-foreground">{res.file_name}</span>
                                        <DownloadIcon className="w-4 h-4 text-muted-foreground ml-auto"/>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
                <footer className="p-4 border-t border-border flex justify-end">
                    <button onClick={onClose} className="btn-secondary">Close</button>
                </footer>
            </div>
            <style>{`.btn-secondary { padding: 0.5rem 1.25rem; background-color: hsl(var(--muted)); color: hsl(var(--foreground)); border-radius: 0.5rem; font-weight: 600; }`}</style>
        </div>
    );
};

LessonPlannerTab.Icon = ClipboardListIcon;
export default LessonPlannerTab;
