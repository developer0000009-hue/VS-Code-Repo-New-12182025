import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { StudentDashboardData, SubmissionStatus, StudentAssignment, StudyMaterial } from '../../types';
import { supabase } from '../../services/supabase';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';
import { BookIcon } from '../icons/BookIcon';
import { ChecklistIcon } from '../icons/ChecklistIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { BookmarkIcon } from '../icons/BookmarkIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { VideoIcon } from '../icons/VideoIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { BookOpenIcon } from '../icons/BookOpenIcon';


// --- MODALS ---
const SyllabusModal: React.FC<{ subject: string; courseClass: string; onClose: () => void; }> = ({ subject, courseClass, onClose }) => {
    const [syllabus, setSyllabus] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const generateSyllabus = async () => {
            setLoading(true);
            setError(null);
            try {
                if (!process.env.API_KEY) {
                    throw new Error("API Key is not configured. Cannot generate syllabus.");
                }
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `
                Generate a detailed syllabus for the subject "${subject}" for a student in Class ${courseClass}. The syllabus should include:\n1. A brief course overview (1-2 paragraphs).\n2. A week-by-week topic breakdown for a 12-week semester.\n3. A list of 3-5 key learning objectives.\nFormat the output clearly with headings for each section.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });

            setSyllabus(response.text || "No syllabus generated.");
        } catch (err: any) {
            console.error("Syllabus generation failed:", err);
            setError("Could not generate syllabus at this time. The AI service may be busy or unavailable.");
        } finally {
            setLoading(false);
        }
        };

        generateSyllabus();
    }, [subject, courseClass]);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-card w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border border-border" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-border flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-full text-primary"><BookOpenIcon className="w-6 h-6" /></div>
                        <div>
                            <h2 className="text-lg font-bold text-card-foreground">{subject} - Syllabus</h2>
                            <p className="text-sm text-muted-foreground">Class {courseClass}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted"><XIcon className="w-5 h-5 text-muted-foreground" /></button>
                </header>
                <main className="p-6 overflow-y-auto">
                    {loading && <div className="flex flex-col items-center justify-center p-8"><Spinner /><p className="mt-2 text-sm text-muted-foreground animate-pulse">AI is generating syllabus...</p></div>}
                    {error && <p className="text-destructive text-center p-4 bg-destructive/10 rounded-lg">{error}</p>}
                    {syllabus && <div className="prose dark:prose-invert prose-sm max-w-none whitespace-pre-wrap">{syllabus}</div>}
                </main>
            </div>
        </div>
    );
};

const AssignmentSubmissionModal: React.FC<{ assignment: StudentAssignment; onClose: () => void; onSuccess: () => void; currentUserId: string }> = ({ assignment, onClose, onSuccess, currentUserId }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleDragEvents = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragover') setIsDragOver(true);
        if (e.type === 'dragleave' || e.type === 'drop') setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        handleDragEvents(e);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFile(e.dataTransfer.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        setError(null);

        try {
            if (!currentUserId) throw new Error("User not authenticated.");

            const fileExt = file.name.split('.').pop();
            const filePath = `${currentUserId}/${assignment.id}-${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage.from('assignment-submissions').upload(filePath, file);
            if (uploadError) throw uploadError;

            const { error: rpcError } = await supabase.rpc('submit_assignment', {
                p_assignment_id: assignment.id,
                p_file_path: filePath,
                p_file_name: file.name,
                p_student_id: currentUserId
            });
            if (rpcError) throw rpcError;

            onSuccess();
        } catch (err: any) {
            setError(`Upload failed: ${err.message}`);
            setIsUploading(false);
        }
    };

    return (
         <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl flex flex-col border border-border" onClick={e => e.stopPropagation()}>
                <header className="p-5 border-b border-border flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-card-foreground">Submit Assignment</h2>
                        <p className="text-sm text-muted-foreground">{assignment.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted"><XIcon className="w-5 h-5 text-muted-foreground" /></button>
                </header>
                <main className="p-6 space-y-4">
                    {error && <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm border border-destructive/20">{error}</div>}
                    <label 
                        onDragOver={handleDragEvents}
                        onDragLeave={handleDragEvents}
                        onDrop={handleDrop}
                        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                    >
                        <UploadIcon className={`w-10 h-10 mb-3 transition-colors ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`}/>
                        <span className="text-sm font-semibold text-foreground">
                            {file ? file.name : 'Drag & drop file or click to browse'}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">Max file size: 10MB</span>
                        <input ref={inputRef} type="file" onChange={handleFileChange} className="hidden" />
                    </label>
                </main>
                 <footer className="p-5 border-t border-border flex justify-end gap-3 bg-muted/20">
                    <button onClick={onClose} disabled={isUploading} className="bg-background border border-border px-4 py-2 rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50">Cancel</button>
                    <button 
                        onClick={handleUpload} 
                        disabled={isUploading || !file} 
                        className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                        {isUploading ? <Spinner size="sm"/> : 'Upload & Submit'}
                    </button>
                </footer>
            </div>
        </div>
    )
};


// --- MAIN COMPONENT ---
interface AcademicsTabProps {
    data: StudentDashboardData;
    onRefresh: () => void;
    currentUserId: string;
}

const statusConfig: { [key in SubmissionStatus | 'Overdue']: { text: string; bg: string; icon: React.ReactNode } } = {
    'Not Submitted': { text: 'text-amber-600', bg: 'bg-amber-100/50', icon: <ClockIcon className="w-3.5 h-3.5" /> },
    'Submitted': { text: 'text-blue-600', bg: 'bg-blue-100/50', icon: <UploadIcon className="w-3.5 h-3.5" /> },
    'Late': { text: 'text-orange-600', bg: 'bg-orange-100/50', icon: <ClockIcon className="w-3.5 h-3.5" /> },
    'Graded': { text: 'text-green-600', bg: 'bg-green-100/50', icon: <CheckCircleIcon className="w-4 h-4" /> },
    'Overdue': { text: 'text-red-600', bg: 'bg-red-100/50', icon: <ClockIcon className="w-3.5 h-3.5" /> },
};

const fileTypeIcons: { [key: string]: React.ReactNode } = {
    'pdf': <DocumentTextIcon className="w-6 h-6 text-red-500" />,
    'docx': <DocumentTextIcon className="w-6 h-6 text-blue-500" />,
    'mp4': <VideoIcon className="w-6 h-6 text-indigo-500" />,
    'default': <DocumentTextIcon className="w-6 h-6 text-gray-500" />
};

const AcademicsTab: React.FC<AcademicsTabProps> = ({ data, onRefresh, currentUserId }) => {
    const [viewingSyllabusFor, setViewingSyllabusFor] = useState<string | null>(null);
    const [submittingAssignment, setSubmittingAssignment] = useState<StudentAssignment | null>(null);
    const [localStudyMaterials, setLocalStudyMaterials] = useState<StudyMaterial[]>(Array.isArray(data?.studyMaterials) ? data.studyMaterials : []);
    // FIX: downloadingFileId should be string to match StudyMaterial ID type.
    const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

    useEffect(() => {
        setLocalStudyMaterials(Array.isArray(data?.studyMaterials) ? data.studyMaterials : []);
    }, [data?.studyMaterials]);

    const subjects = useMemo(() => {
        const subjectSet = new Set<string>();
        (data?.timetable ?? []).forEach(item => subjectSet.add(item.subject));
        (data?.assignments ?? []).forEach(item => subjectSet.add(item.subject));
        (Array.isArray(data?.studyMaterials) ? data.studyMaterials : []).forEach(item => subjectSet.add(item.subject));
        return Array.from(subjectSet).sort();
    }, [data?.timetable, data?.assignments, data?.studyMaterials]);
    
    const groupedMaterials = useMemo(() => {
        return (localStudyMaterials || []).reduce((acc: Record<string, StudyMaterial[]>, material) => {
            (acc[material.subject] = acc[material.subject] || []).push(material);
            return acc;
        }, {} as Record<string, StudyMaterial[]>);
    }, [localStudyMaterials]);
    
    const handleDownload = async (material: StudyMaterial) => {
        setDownloadingFileId(material.id);
        try {
            const { data, error } = await supabase.storage.from('study-materials').download(material.file_path);
            if (error) throw error;
            const blob = new Blob([data]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = material.file_name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Could not download file.');
        } finally {
            setDownloadingFileId(null);
        }
    };

    // FIX: Parameter materialId should be string to match StudyMaterial ID type.
    const handleToggleBookmark = async (materialId: string) => {
        const originalMaterials = [...localStudyMaterials];
        setLocalStudyMaterials(currentMaterials =>
            currentMaterials.map(m =>
                m.id === materialId ? { ...m, is_bookmarked: !m.is_bookmarked } : m
            )
        );

        const { error } = await supabase.rpc('toggle_bookmark_material', { p_material_id: materialId });
        if (error) {
            console.error('Failed to toggle bookmark:', error);
            setLocalStudyMaterials(originalMaterials); 
            alert('Failed to update bookmark.');
        } else {
            onRefresh(); 
        }
    };

    return (
        <div className="space-y-12">
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <AcademicCapIcon className="w-7 h-7 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">My Subjects</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {subjects.map(subject => (
                        <div key={subject} className="bg-card p-4 rounded-xl border border-border shadow-sm text-center flex flex-col items-center justify-center">
                            <BookIcon className="w-8 h-8 text-muted-foreground/50 mb-2" />
                            <h4 className="font-semibold text-foreground text-sm mb-3">{subject}</h4>
                            <button 
                                onClick={() => setViewingSyllabusFor(subject)}
                                className="w-full text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 py-2 rounded-lg transition-colors"
                            >
                                View Syllabus
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <div className="flex items-center gap-3 mb-4">
                    <BookOpenIcon className="w-7 h-7 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Study Resources</h2>
                </div>
                {Object.keys(groupedMaterials).length > 0 ? (
                    <div className="space-y-6">
                        {Object.keys(groupedMaterials).map((subject) => {
                            const materials = groupedMaterials[subject];
                            return (
                                <div key={subject}>
                                    <h3 className="font-bold text-lg text-foreground mb-3">{subject}</h3>
                                    <div className="bg-card p-4 rounded-xl border border-border shadow-sm space-y-3">
                                        {materials.map(material => (
                                            <div key={material.id} className="flex items-center gap-4 p-3 hover:bg-muted/30 rounded-lg transition-colors group">
                                                <div className="flex-shrink-0">
                                                    {fileTypeIcons[material.file_type] || fileTypeIcons.default}
                                                </div>
                                                <div className="flex-grow">
                                                    <p className="font-semibold text-foreground text-sm line-clamp-1">{material.title}</p>
                                                    <p className="text-xs text-muted-foreground line-clamp-1">{material.file_name}</p>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <button onClick={() => handleToggleBookmark(material.id)} className={`p-2 rounded-full transition-colors ${material.is_bookmarked ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted/50'}`}>
                                                        <BookmarkIcon className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDownload(material)} disabled={downloadingFileId === material.id} className="p-2 text-muted-foreground hover:bg-muted/50 rounded-full flex items-center justify-center">
                                                        {downloadingFileId === material.id ? <Spinner size="sm" /> : <DownloadIcon className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <BookOpenIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">No study materials available yet.</p>
                    </div>
                )}
            </section>

            <section>
                <div className="flex items-center gap-3 mb-4">
                    <ChecklistIcon className="w-7 h-7 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">My Assignments</h2>
                </div>
                {(data?.assignments ?? []).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.assignments.map(assignment => {
                            let status: SubmissionStatus | 'Overdue' = assignment.status;
                            const now = new Date();
                            const due = new Date(assignment.due_date);
                            
                            if (status === 'Not Submitted' && due < now) {
                                status = 'Overdue';
                            }
                            
                            const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Not Submitted'];
                            
                            return (
                                <div key={assignment.id} className="bg-card p-5 rounded-2xl border border-border shadow-sm flex flex-col">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{assignment.subject}</p>
                                            <h3 className="font-bold text-foreground text-lg mt-1">{assignment.title}</h3>
                                        </div>
                                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${config.text} ${config.bg}`}>
                                            {config.icon} {status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2 flex-grow">{assignment.description}</p>
                                    
                                    {status === 'Overdue' && (
                                        <div className="mt-4 p-2 bg-red-500/10 text-red-600 text-xs font-medium rounded-md flex items-center gap-2">
                                            <ClockIcon className="w-3.5 h-3.5" /> Submission Closed / Overdue
                                        </div>
                                    )}

                                    {assignment.status === 'Graded' && (
                                        <div className="mt-4 p-3 bg-green-500/10 text-green-700 text-sm rounded-lg border border-green-500/20">
                                            <p className="font-bold">Grade: {assignment.submission_grade}</p>
                                            {assignment.teacher_feedback && <p className="text-xs mt-1 italic">Feedback: {assignment.teacher_feedback}</p>}
                                        </div>
                                    )}

                                    <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                                        <span>Due: {new Date(assignment.due_date).toLocaleString()}</span>
                                        {(status === 'Not Submitted' || status === 'Late' || status === 'Overdue') ? (
                                            <button onClick={() => setSubmittingAssignment(assignment)} className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg font-bold transition-colors">
                                                {status === 'Overdue' ? 'Submit Late' : 'Submit'}
                                            </button>
                                        ) : assignment.file_path ? (
                                            <button onClick={() => {
                                                if (assignment.file_path) {
                                                    const publicUrl = supabase.storage.from('assignment-submissions').getPublicUrl(assignment.file_path).data.publicUrl;
                                                    window.open(publicUrl, '_blank');
                                                }
                                            }} className="bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-lg font-bold transition-colors border border-border">
                                                View Submission
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <AcademicCapIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">No assignments posted yet.</p>
                    </div>
                )}
            </section>

            {viewingSyllabusFor && (
                <SyllabusModal 
                    subject={viewingSyllabusFor} 
                    courseClass={data?.profile?.grade || ''} 
                    onClose={() => setViewingSyllabusFor(null)} 
                />
            )}
            {submittingAssignment && (
                <AssignmentSubmissionModal
                    assignment={submittingAssignment}
                    onClose={() => setSubmittingAssignment(null)}
                    onSuccess={() => {
                        setSubmittingAssignment(null);
                        onRefresh(); 
                    }}
                    currentUserId={currentUserId}
                />
            )}
        </div>
    );
};

export default AcademicsTab;
