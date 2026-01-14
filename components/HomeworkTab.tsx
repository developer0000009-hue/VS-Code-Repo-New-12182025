
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { BookIcon } from './icons/BookIcon';
import { PlusIcon } from './icons/PlusIcon';
import { SearchIcon } from './icons/SearchIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { XIcon } from './icons/XIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { UploadIcon } from './icons/UploadIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import Spinner from './common/Spinner';
import Stepper from './common/Stepper';
import ConfirmationModal from './common/ConfirmationModal';
import { supabase } from '../services/supabase';
import { SchoolClass, Course, UserProfile } from '../types';

// --- Types ---
type AssignmentStatus = 'Active' | 'Draft' | 'Closed' | 'Overdue' | 'Reviewing';

interface Assignment {
    id: number;
    title: string;
    description: string;
    subject_name: string;
    class_name: string;
    teacher_name: string;
    created_at: string;
    due_date: string;
    status: AssignmentStatus;
    submission_count: number;
    total_students: number;
    max_score: number;
    class_id: number;
    subject_id: number;
    teacher_id: string;
}

interface StudentSubmission {
    submission_id: number | null;
    student_id: string;
    student_name: string;
    submitted_at?: string;
    status: 'Submitted' | 'Late' | 'Pending' | 'Graded' | 'Overdue';
    grade?: string;
    feedback?: string;
    file_path?: string;
    file_name?: string;
}

// --- Helper Functions ---
const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
    return localISOTime;
};

// --- Styled Components ---

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const styles: Record<string, string> = {
        'Active': 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800',
        'Reviewing': 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800',
        'Draft': 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
        'Closed': 'bg-slate-100 text-slate-600 border-slate-200',
        'Overdue': 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-800',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border shadow-sm ${styles[status] || styles['Active']}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-current'}`}></span>
            {status}
        </span>
    );
};

// --- Modals ---

const CreateEditHomeworkModal: React.FC<{ 
    assignment?: Assignment | null;
    onClose: () => void; 
    onSuccess: () => void;
}> = ({ assignment, onClose, onSuccess }) => {
    const isEdit = !!assignment;
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);
    
    // Data Sources
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [subjects, setSubjects] = useState<Course[]>([]);
    const [teachers, setTeachers] = useState<UserProfile[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        class_id: '',
        subject_id: '',
        teacher_id: '',
        due_date: '',
        status: 'Active',
        max_score: 100,
    });

    useEffect(() => {
        const fetchResources = async () => {
            const [classRes, subjectRes, teacherRes] = await Promise.all([
                supabase.rpc('get_all_classes_for_admin'),
                supabase.from('courses').select('*'),
                supabase.rpc('get_all_teachers_for_admin')
            ]);
            if(classRes.data) setClasses(classRes.data);
            if(subjectRes.data) setSubjects(subjectRes.data);
            if(teacherRes.data) setTeachers(teacherRes.data);
            
            if (isEdit && assignment) {
                setFormData({
                    title: assignment.title,
                    description: assignment.description || '',
                    class_id: assignment.class_id.toString(),
                    subject_id: assignment.subject_id?.toString() || '',
                    teacher_id: assignment.teacher_id || '',
                    due_date: formatDateForInput(assignment.due_date),
                    status: assignment.status || 'Active',
                    max_score: assignment.max_score || 100
                });
            }
        };
        fetchResources();
    }, [isEdit, assignment]);

    const steps = ['Details', 'Configuration'];

    const handleNext = () => setStep(p => Math.min(p + 1, steps.length - 1));
    const handleBack = () => setStep(p => Math.max(p - 1, 0));

    // AI Generation Logic
    const handleAISuggest = async () => {
        if (!formData.title) return alert("Please enter a title first.");
        setAiGenerating(true);
        try {
            if (!process.env.API_KEY) throw new Error("AI Key missing");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Create a homework description for "${formData.title}". Include 3 questions.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            if (response.text) setFormData(prev => ({ ...prev, description: response.text || '' }));
        } catch (err: any) {
            alert(`AI Suggestion Failed: ${err.message}`);
        } finally {
            setAiGenerating(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.due_date) return alert("Title and Due Date are required.");
        
        setLoading(true);
        try {
            // Ensure numeric values are valid
            const classId = parseInt(formData.class_id);
            const subjectId = parseInt(formData.subject_id);
            const maxScore = parseInt(String(formData.max_score));

            if (isNaN(classId) || isNaN(subjectId)) {
                throw new Error("Invalid Class or Subject selection.");
            }

            if (isEdit && assignment) {
                const { error } = await supabase.rpc('update_assignment', {
                    p_id: assignment.id,
                    p_title: formData.title,
                    p_description: formData.description,
                    p_due_date: new Date(formData.due_date).toISOString(),
                    p_max_score: isNaN(maxScore) ? 100 : maxScore,
                    p_status: formData.status
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.rpc('create_homework_assignment', {
                    p_class_id: classId,
                    p_subject_id: subjectId,
                    p_teacher_id: formData.teacher_id,
                    p_title: formData.title,
                    p_description: formData.description,
                    p_due_date: new Date(formData.due_date).toISOString(),
                    p_max_score: isNaN(maxScore) ? 100 : maxScore,
                    p_status: formData.status,
                    p_attachments: [] // Add attachments handling if needed
                });
                if (error) throw error;
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        if (step === 0) {
            return (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                             <label className="input-label">Title</label>
                             <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="input-premium font-medium" placeholder="Assignment Title" autoFocus />
                        </div>
                         {/* Only allow changing mapping on creation, not edit (simplification) */}
                        {!isEdit && (
                            <>
                                <div>
                                    <label className="input-label">Class</label>
                                    <select value={formData.class_id} onChange={e => setFormData({...formData, class_id: e.target.value})} className="input-premium">
                                        <option value="">Select Class...</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="input-label">Subject</label>
                                    <select value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: e.target.value})} className="input-premium">
                                        <option value="">Select Subject...</option>
                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="input-label">Assigning Teacher</label>
                                    <select value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})} className="input-premium">
                                        <option value="">Select Teacher...</option>
                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.display_name}</option>)}
                                    </select>
                                </div>
                            </>
                        )}
                        {isEdit && (
                            <div className="md:col-span-2 p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground border border-border">
                                Editing: {assignment?.subject_name} for {assignment?.class_name}
                            </div>
                        )}
                    </div>
                </div>
            );
        } else {
             return (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="input-label">Instructions / Description</label>
                            <button onClick={handleAISuggest} disabled={aiGenerating} className="ai-btn"><SparklesIcon className="w-3 h-3"/> AI Assist</button>
                        </div>
                        <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-premium h-32 resize-none" placeholder="Detailed instructions..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="input-label">Due Date & Time</label>
                            <input type="datetime-local" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="input-premium" />
                        </div>
                        <div>
                            <label className="input-label">Max Score</label>
                            <input type="number" value={formData.max_score} onChange={e => setFormData({...formData, max_score: parseInt(e.target.value)})} className="input-premium" />
                        </div>
                         <div className="md:col-span-2">
                            <label className="input-label">Status</label>
                            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="input-premium">
                                <option value="Active">Active (Visible to Students)</option>
                                <option value="Reviewing">Reviewing (Submissions Closed)</option>
                                <option value="Draft">Draft (Hidden)</option>
                                <option value="Closed">Closed (Archived)</option>
                            </select>
                        </div>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in zoom-in-95 max-h-[90vh]">
                <div className="p-6 border-b border-border flex justify-between items-center bg-muted/10">
                    <h3 className="text-xl font-bold text-foreground">{isEdit ? 'Edit Assignment' : 'New Assignment'}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors"><XIcon className="w-5 h-5"/></button>
                </div>
                
                <div className="px-8 pt-6 pb-2">
                    <Stepper steps={steps} currentStep={step} />
                </div>

                <div className="p-8 pt-4 flex-grow overflow-y-auto">
                    {renderStep()}
                </div>

                <div className="p-6 border-t border-border bg-muted/10 flex justify-between items-center">
                    <button onClick={step === 0 ? onClose : handleBack} className="px-6 py-2.5 rounded-xl font-bold text-sm text-muted-foreground hover:bg-background border border-transparent hover:border-border transition-all">
                        {step === 0 ? 'Cancel' : 'Back'}
                    </button>
                    <button onClick={step === steps.length - 1 ? handleSubmit : handleNext} disabled={loading} className="px-8 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50">
                        {loading ? <Spinner size="sm" className="text-white"/> : step === steps.length - 1 ? (isEdit ? 'Update' : 'Create') : <>Next <ChevronRightIcon className="w-4 h-4"/></>}
                    </button>
                </div>
            </div>
             <style>{`
                .input-premium { width: 100%; padding: 0.75rem 1rem; background-color: hsl(var(--background)); border: 1px solid hsl(var(--input)); border-radius: 0.75rem; font-size: 0.875rem; outline: none; transition: all 0.2s; }
                .input-premium:focus { border-color: hsl(var(--primary)); box-shadow: 0 0 0 2px hsl(var(--primary) / 0.1); }
                .input-label { display: block; font-size: 0.75rem; font-weight: 700; color: hsl(var(--muted-foreground)); text-transform: uppercase; margin-bottom: 0.4rem; letter-spacing: 0.05em; }
                .ai-btn { font-size: 0.65rem; font-weight: 700; background-color: hsl(270 95% 95%); color: hsl(270 90% 40%); padding: 0.2rem 0.5rem; border-radius: 9999px; display: flex; align-items: center; gap: 0.25rem; transition: background-color 0.2s; }
            `}</style>
        </div>
    );
};

// --- Submission Drawer ---

const SubmissionsDrawer: React.FC<{ assignment: Assignment, onClose: () => void }> = ({ assignment, onClose }) => {
    const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

    const fetchSubmissions = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_homework_submissions', { p_assignment_id: assignment.id });
        if (!error && data) {
            setSubmissions(data);
        }
        setLoading(false);
    }, [assignment.id]);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    const handleGradeSubmit = async (submissionId: number | null, studentId: string, grade: string, feedback: string) => {
        if (!submissionId) return alert("No submission to grade.");

        const { error } = await supabase.rpc('grade_homework_submission', {
            p_submission_id: submissionId,
            p_grade: grade,
            p_feedback: feedback
        });

        if (error) alert(error.message);
        else {
            fetchSubmissions();
            setExpandedStudentId(null);
        }
    };

    const stats = useMemo(() => ({
        total: assignment.total_students,
        submitted: submissions.filter(s => s.status !== 'Pending' && s.status !== 'Overdue').length,
        pending: submissions.filter(s => s.status === 'Pending').length,
    }), [submissions, assignment.total_students]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-end animate-in fade-in duration-300" onClick={onClose}>
            <div className="w-full max-w-4xl bg-background h-full shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border bg-card flex justify-between items-start z-10 shadow-sm">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <StatusBadge status={assignment.status} />
                             <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">{assignment.subject_name} • {assignment.class_name}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground leading-tight">{assignment.title}</h2>
                        <p className="text-xs text-muted-foreground mt-1">Due: {new Date(assignment.due_date).toLocaleString()}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors"><XIcon className="w-6 h-6 text-muted-foreground"/></button>
                </div>

                <div className="grid grid-cols-3 divide-x divide-border border-b border-border bg-muted/10">
                    <div className="p-4 text-center"><p className="text-2xl font-black text-foreground">{stats.total}</p><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Assigned</p></div>
                    <div className="p-4 text-center"><p className="text-2xl font-black text-emerald-600">{stats.submitted}</p><p className="text-[10px] font-bold text-emerald-700/70 uppercase tracking-wider">Submitted</p></div>
                    <div className="p-4 text-center"><p className="text-2xl font-black text-amber-600">{stats.pending}</p><p className="text-[10px] font-bold text-amber-700/70 uppercase tracking-wider">Pending</p></div>
                </div>

                <div className="flex-grow overflow-y-auto p-0 bg-muted/5 custom-scrollbar">
                    {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
                        <div className="divide-y divide-border">
                            {submissions.map(sub => {
                                const isExpanded = expandedStudentId === sub.student_id;
                                return (
                                    <div key={sub.student_id} className={`transition-all ${isExpanded ? 'bg-card shadow-sm' : 'hover:bg-card'}`}>
                                        <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedStudentId(isExpanded ? null : sub.student_id)}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">{sub.student_name.charAt(0)}</div>
                                                <div>
                                                    <p className="font-bold text-sm text-foreground">{sub.student_name}</p>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                                                        sub.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                                                        sub.status === 'Overdue' ? 'bg-red-50 text-red-600 border-red-200' :
                                                        sub.status === 'Graded' ? 'bg-green-50 text-green-600 border-green-200' :
                                                        'bg-blue-50 text-blue-600 border-blue-200'
                                                    }`}>{sub.status}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                 {sub.grade ? <span className="font-bold text-sm bg-green-100 text-green-800 px-3 py-1 rounded-lg border border-green-200">{sub.grade}/{assignment.max_score}</span> : <span className="text-xs text-muted-foreground italic">Not Graded</span>}
                                                 <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}/>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="px-6 pb-6 pt-2 bg-muted/10 border-t border-border/50">
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Submission</p>
                                                        {sub.file_path ? (
                                                            <div className="flex items-center gap-2 p-3 bg-background border border-border rounded-lg cursor-pointer hover:border-primary/50" onClick={() => {
                                                                const { data } = supabase.storage.from('assignment-submissions').getPublicUrl(sub.file_path!);
                                                                window.open(data.publicUrl, '_blank');
                                                            }}>
                                                                <DocumentTextIcon className="w-5 h-5 text-primary"/>
                                                                <span className="text-sm font-medium">{sub.file_name || 'View File'}</span>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground italic">No file submitted.</p>
                                                        )}
                                                        {sub.submitted_at && <p className="text-[10px] text-muted-foreground mt-2">Submitted: {new Date(sub.submitted_at).toLocaleString()}</p>}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Assessment</p>
                                                        <div className="flex gap-2 mb-2">
                                                            <input id={`grade-${sub.student_id}`} defaultValue={sub.grade || ''} placeholder="Score" className="w-24 p-2 rounded border bg-background text-center font-bold text-sm"/>
                                                            <input id={`feedback-${sub.student_id}`} defaultValue={sub.feedback || ''} placeholder="Feedback..." className="flex-grow p-2 rounded border bg-background text-sm"/>
                                                        </div>
                                                        <button 
                                                            onClick={() => {
                                                                const g = (document.getElementById(`grade-${sub.student_id}`) as HTMLInputElement).value;
                                                                const f = (document.getElementById(`feedback-${sub.student_id}`) as HTMLInputElement).value;
                                                                handleGradeSubmit(sub.submission_id, sub.student_id, g, f);
                                                            }}
                                                            disabled={!sub.submission_id}
                                                            className="w-full py-2 bg-primary text-primary-foreground font-bold text-xs rounded shadow-sm hover:bg-primary/90 disabled:opacity-50"
                                                        >
                                                            Save Grade
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

const HomeworkTab: React.FC = () => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ subject: 'All', class: 'All', status: 'All', teacher: 'All' });
    
    // Dropdown Data
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [subjects, setSubjects] = useState<Course[]>([]);
    const [teachers, setTeachers] = useState<UserProfile[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
    const [viewingSubmission, setViewingSubmission] = useState<Assignment | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<Assignment | null>(null);

    // Initial Data Fetch
    useEffect(() => {
        const loadResources = async () => {
             const [classRes, subjectRes, teacherRes] = await Promise.all([
                supabase.rpc('get_all_classes_for_admin'),
                supabase.from('courses').select('id, title, code').eq('status', 'Active'),
                supabase.rpc('get_all_teachers_for_admin')
            ]);
            if(classRes.data) setClasses(classRes.data);
            if(subjectRes.data) setSubjects(subjectRes.data);
            if(teacherRes.data) setTeachers(teacherRes.data);
        };
        loadResources();
    }, []);

    const fetchAssignments = useCallback(async () => {
        setLoading(true);
        // Robust fetch with strict type checking to avoid RPC errors
        const classId = filters.class !== 'All' && filters.class ? parseInt(filters.class) : null;
        const subjectId = filters.subject !== 'All' && filters.subject ? parseInt(filters.subject) : null;
        const teacherId = filters.teacher !== 'All' && filters.teacher ? filters.teacher : null;

        const { data, error } = await supabase.rpc('get_admin_homework_list', {
            p_class_id: isNaN(Number(classId)) ? null : classId,
            p_status: filters.status,
            p_subject_id: isNaN(Number(subjectId)) ? null : subjectId,
            p_teacher_id: teacherId
        });
        
        if (error) console.error("Fetch Error:", error.message);
        else setAssignments(data || []);
        setLoading(false);
    }, [filters]);

    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        const { error } = await supabase.rpc('delete_assignment', { p_id: deleteConfirm.id });
        if (error) alert("Delete failed: " + error.message);
        else fetchAssignments();
        setDeleteConfirm(null);
    };

    const filteredAssignments = useMemo(() => {
        return assignments.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [assignments, searchTerm]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-foreground tracking-tight">Homework & Assignments</h2>
                    <p className="text-muted-foreground mt-2 text-lg">Track assignments across all classes.</p>
                </div>
                <div className="flex gap-3">
                    <button className="hidden sm:flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-card border border-border text-foreground transition-colors hover:bg-muted">
                        <UploadIcon className="w-4 h-4"/> Bulk Upload
                    </button>
                    <button onClick={() => { setEditingAssignment(null); setIsModalOpen(true); }} className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl shadow-lg hover:bg-purple-700 transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:scale-95">
                        <PlusIcon className="w-5 h-5" /> Assign Homework
                    </button>
                </div>
            </div>

            {/* Enhanced Filter Bar */}
            <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-4 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center sticky top-24 z-30">
                <div className="relative w-full xl:w-64 group">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    />
                </div>
                
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide w-full xl:w-auto">
                    {/* Class Filter */}
                    <select 
                        value={filters.class} 
                        onChange={e => setFilters({...filters, class: e.target.value})} 
                        className="bg-muted/40 hover:bg-muted border border-border rounded-lg px-3 py-2 text-xs font-bold cursor-pointer transition-colors outline-none focus:ring-2 focus:ring-primary/20 max-w-[150px]"
                    >
                        <option value="All">All Classes</option>
                        {classes.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
                    </select>

                    {/* Subject Filter */}
                    <select 
                        value={filters.subject} 
                        onChange={e => setFilters({...filters, subject: e.target.value})} 
                        className="bg-muted/40 hover:bg-muted border border-border rounded-lg px-3 py-2 text-xs font-bold cursor-pointer transition-colors outline-none focus:ring-2 focus:ring-primary/20 max-w-[150px]"
                    >
                        <option value="All">All Subjects</option>
                        {subjects.map(s => <option key={s.id} value={s.id.toString()}>{s.title} ({s.code})</option>)}
                    </select>

                    {/* Teacher Filter */}
                    <select 
                        value={filters.teacher} 
                        onChange={e => setFilters({...filters, teacher: e.target.value})} 
                        className="bg-muted/40 hover:bg-muted border border-border rounded-lg px-3 py-2 text-xs font-bold cursor-pointer transition-colors outline-none focus:ring-2 focus:ring-primary/20 max-w-[150px]"
                    >
                        <option value="All">All Teachers</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.display_name}</option>)}
                    </select>

                    {/* Status Filter */}
                    <select 
                        value={filters.status} 
                        onChange={e => setFilters({...filters, status: e.target.value})} 
                        className="bg-muted/40 hover:bg-muted border border-border rounded-lg px-3 py-2 text-xs font-bold cursor-pointer transition-colors outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Reviewing">Reviewing</option>
                        <option value="Closed">Closed</option>
                    </select>
                </div>
            </div>

            {loading ? <div className="flex justify-center p-20"><Spinner size="lg"/></div> : filteredAssignments.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground bg-muted/10 border-2 border-dashed border-border rounded-2xl">
                    <BookIcon className="w-12 h-12 mx-auto opacity-30 mb-4"/>
                    <p className="font-bold">No assignments found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredAssignments.map(assignment => {
                        // Calculate overdue status if active but date passed
                        let displayStatus = assignment.status;
                        if(displayStatus === 'Active' && new Date(assignment.due_date) < new Date()){
                             displayStatus = 'Overdue';
                        }
                        
                        return (
                        <div key={assignment.id} className="group bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative flex flex-col h-full">
                             <div className={`absolute top-0 left-0 w-full h-1 ${displayStatus === 'Active' ? 'bg-emerald-500' : displayStatus === 'Overdue' ? 'bg-red-500' : 'bg-slate-400'}`}></div>
                             
                             <div className="flex justify-between items-start mb-5">
                                 <div>
                                     <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{assignment.subject_name}</p>
                                     <p className="text-[10px] font-bold text-primary mt-0.5">{assignment.class_name}</p>
                                 </div>
                                 <StatusBadge status={displayStatus} />
                             </div>

                             <div className="flex-grow mb-6">
                                 <h3 className="text-xl font-extrabold text-foreground leading-tight mb-2 line-clamp-2">{assignment.title}</h3>
                                 <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground font-medium">
                                     <span>By {assignment.teacher_name}</span>
                                     <span>•</span>
                                     <span>{new Date(assignment.created_at).toLocaleDateString()}</span>
                                 </div>

                                 <div className="p-4 rounded-xl border border-border/60 bg-muted/30">
                                     <div className="flex justify-between items-center mb-2 text-xs font-medium">
                                         <div className="flex items-center gap-1.5 text-muted-foreground">
                                             <ClockIcon className="w-3.5 h-3.5"/>
                                             <span className={new Date(assignment.due_date) < new Date() ? 'text-red-500 font-bold' : ''}>
                                                 Due {new Date(assignment.due_date).toLocaleDateString()}
                                             </span>
                                         </div>
                                         <span className="text-[10px] font-bold">{assignment.submission_count || 0} / {assignment.total_students || 0} Done</span>
                                     </div>
                                     <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full" style={{ width: `${((assignment.submission_count || 0) / (assignment.total_students || 1)) * 100}%` }}></div>
                                     </div>
                                 </div>
                             </div>

                             <div className="pt-2 flex justify-between items-center border-t border-border/50 mt-2">
                                 <div className="flex gap-1">
                                    <button onClick={() => { setEditingAssignment(assignment); setIsModalOpen(true); }} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary"><EditIcon className="w-4 h-4"/></button>
                                    <button onClick={() => setDeleteConfirm(assignment)} className="p-2 hover:bg-red-50 rounded-lg text-muted-foreground hover:text-red-600"><TrashIcon className="w-4 h-4"/></button>
                                 </div>
                                 <button onClick={() => setViewingSubmission(assignment)} className="bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-2">
                                     Submissions <ChevronRightIcon className="w-3.5 h-3.5"/>
                                 </button>
                             </div>
                        </div>
                    )})}
                </div>
            )}

            {isModalOpen && <CreateEditHomeworkModal assignment={editingAssignment} onClose={() => setIsModalOpen(false)} onSuccess={fetchAssignments} />}
            {viewingSubmission && <SubmissionsDrawer assignment={viewingSubmission} onClose={() => setViewingSubmission(null)} />}
            {deleteConfirm && (
                <ConfirmationModal 
                    isOpen={!!deleteConfirm} 
                    onClose={() => setDeleteConfirm(null)} 
                    onConfirm={handleDelete} 
                    title="Delete Assignment" 
                    message={`Are you sure you want to delete "${deleteConfirm.title}"?`} 
                    confirmText="Yes, Delete" 
                    cancelText="Cancel"
                />
            )}
        </div>
    );
};

export default HomeworkTab;
