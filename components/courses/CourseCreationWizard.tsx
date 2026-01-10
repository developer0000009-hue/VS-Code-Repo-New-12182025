import React, { useState, useEffect, useRef } from 'react';
import { Course, UserProfile } from '../../types';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { BookIcon } from '../icons/BookIcon';
import { TeacherIcon } from '../icons/TeacherIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { XIcon } from '../icons/XIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { FileTextIcon } from '../icons/FileTextIcon';
import { ClockIcon } from '../icons/ClockIcon';
import Spinner from '../common/Spinner';
import { supabase } from '../../services/supabase';
import CustomSelect from '../common/CustomSelect';
import { SparklesIcon } from '../icons/SparklesIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { GoogleGenAI } from '@google/genai';
import { LayersIcon } from '../icons/LayersIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { BellIcon } from '../icons/BellIcon';
import Stepper from '../common/Stepper';

interface WizardProps {
    onClose: () => void;
    onSuccess: () => void;
}

const STEPS = ['Details', 'Mapping', 'Faculty', 'Curriculum', 'Enrollment', 'Publish'];

interface CurriculumUnit {
    title: string;
    objectives: string;
    hours: number;
    files: File[];
}

export const CourseCreationWizard: React.FC<WizardProps> = ({ onClose, onSuccess }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiSyllabusGenerating, setAiSyllabusGenerating] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '', code: '', description: '', category: 'Core', department: '', academic_year: '2025-2026', credits: 3,
        grade_level: '10', sections: [] as string[], auto_sync_timetable: true,
        teacher_id: '', co_teacher_id: '', guest_faculty: '',
        auto_enroll: true, elective_rules: '', max_capacity: 30,
        status: 'Active', publish_date: ''
    });
    
    const [curriculum, setCurriculum] = useState<CurriculumUnit[]>([
        { title: 'Unit 1: Introduction', objectives: '', hours: 5, files: [] }
    ]);
    const [assessments, setAssessments] = useState({ quiz: true, midterm: true, final: true, project: false });
    const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
    const [teachers, setTeachers] = useState<UserProfile[]>([]);
    const [sectionInput, setSectionInput] = useState('');

    useEffect(() => {
        const fetchTeachers = async () => {
            const { data } = await supabase.from('profiles').select('*').eq('role', 'Teacher');
            if (data) setTeachers(data);
        };
        fetchTeachers();
    }, []);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    const generateDescription = async () => {
        if (!formData.title) return alert("Please enter a course title first.");
        setAiGenerating(true);
        try {
             if (!process.env.API_KEY) throw new Error("AI Key Missing");
             const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
             const prompt = `Act as an expert academic curriculum designer. Write a comprehensive course description for a subject titled "${formData.title}" for Grade ${formData.grade_level}. Include a Curriculum Overview, 3-5 Learning Objectives, and Target Audience. Tone: Professional and engaging.`;
             const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
             if (response.text) handleChange('description', response.text);
        } catch (err: any) {
            alert("AI Generation failed: " + err.message);
        } finally {
            setAiGenerating(false);
        }
    };

    const generateSyllabus = async () => {
        if (!formData.title) return alert("Please enter a course title first.");
        setAiSyllabusGenerating(true);
        try {
             if (!process.env.API_KEY) throw new Error("AI Key Missing");
             const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
             const prompt = `Generate a structured syllabus for a high school course titled "${formData.title}" (Grade ${formData.grade_level}). Return ONLY a JSON array of objects, where each object has "title" (string), "objectives" (string summary), and "hours" (integer estimate). Limit to 5 units.`;
             const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
             if (response.text) {
                 const generatedUnits = JSON.parse(response.text.replace(/```json|```/g, '').trim());
                 const mappedUnits = generatedUnits.map((u: any) => ({ title: u.title, objectives: u.objectives, hours: u.hours || 5, files: [] }));
                 setCurriculum(mappedUnits);
             }
        } catch (err: any) {
            alert("AI Syllabus Generation failed: " + err.message);
        } finally {
            setAiSyllabusGenerating(false);
        }
    };

    const addSection = () => { if (sectionInput.trim() && !formData.sections.includes(sectionInput.trim())) { handleChange('sections', [...formData.sections, sectionInput.trim()]); setSectionInput(''); } };
    const removeSection = (sec: string) => handleChange('sections', formData.sections.filter(s => s !== sec));
    const addUnit = () => setCurriculum([...curriculum, { title: `Unit ${curriculum.length + 1}`, objectives: '', hours: 5, files: [] }]);
    const updateUnit = (index: number, field: keyof CurriculumUnit, value: any) => { const newCurriculum = [...curriculum]; newCurriculum[index] = { ...newCurriculum[index], [field]: value }; setCurriculum(newCurriculum); };
    const removeUnit = (index: number) => setCurriculum(curriculum.filter((_, i) => i !== index));

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { data: courseData, error } = await supabase.from('courses').insert({
                title: formData.title, code: formData.code, description: formData.description, credits: formData.credits, category: formData.category, grade_level: formData.grade_level, status: formData.status, teacher_id: formData.teacher_id || null, department: formData.department, subject_type: formData.category
            }).select().single();
            if (error) throw error;
            if (courseData && curriculum.length > 0) {
                 for (let i = 0; i < curriculum.length; i++) {
                     await supabase.from('course_modules').insert({ course_id: courseData.id, title: curriculum[i].title, order_index: i + 1, status: 'Active', duration_hours: curriculum[i].hours });
                 }
                 await supabase.from('course_logs').insert({ course_id: courseData.id, user_id: (await supabase.auth.getUser()).data.user?.id, action: 'CREATED', details: { title: formData.title, modules: curriculum.length } });
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            alert('Failed to create course: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Details
                return (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="md:col-span-2"><label className="input-label">Course Name <span className="text-red-500">*</span></label><input value={formData.title} onChange={e => handleChange('title', e.target.value)} className="input-premium font-medium text-lg" placeholder="e.g. Advanced Physics" autoFocus /></div><div><label className="input-label">Course Code</label><input value={formData.code} onChange={e => handleChange('code', e.target.value.toUpperCase())} className="input-premium font-mono uppercase" placeholder="PHY-101" /></div><div><label className="input-label">Academic Year</label><select value={formData.academic_year} onChange={e => handleChange('academic_year', e.target.value)} className="input-premium"><option>2024-2025</option><option>2025-2026</option></select></div><div><label className="input-label">Category</label><div className="grid grid-cols-2 gap-2 bg-muted/30 p-1 rounded-lg border border-input"><button type="button" onClick={() => handleChange('category', 'Core')} className={`py-2 rounded-md text-xs font-bold transition-all ${formData.category === 'Core' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}>Core Subject</button><button type="button" onClick={() => handleChange('category', 'Elective')} className={`py-2 rounded-md text-xs font-bold transition-all ${formData.category === 'Elective' ? 'bg-purple-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}>Elective</button></div></div><div><label className="input-label">Department</label><select value={formData.department} onChange={e => handleChange('department', e.target.value)} className="input-premium"><option value="">Select...</option><option value="Science">Science</option><option value="Mathematics">Mathematics</option><option value="Languages">Languages</option></select></div></div>
                        <div><div className="flex justify-between items-center mb-1.5"><label className="input-label">Description</label><button type="button" onClick={generateDescription} disabled={aiGenerating || !formData.title} className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-md font-bold flex items-center gap-1 hover:bg-primary/20 transition-colors disabled:opacity-50"><SparklesIcon className="w-3 h-3"/> AI Generate</button></div><textarea value={formData.description} onChange={e => handleChange('description', e.target.value)} className="input-premium h-24 resize-none leading-relaxed" placeholder={aiGenerating ? "Generating description..." : "Enter course objectives..."} disabled={aiGenerating} /></div>
                    </div>
                );
            case 1: // Mapping
                return <div className="space-y-6 animate-in slide-in-from-right-4 duration-300"><div><label className="input-label">Target Grade Level</label><div className="flex flex-wrap gap-2 mt-1">{Array.from({length: 4}, (_,i) => 9+i).map(g => (<button key={g} type="button" onClick={() => handleChange('grade_level', String(g))} className={`w-12 h-12 rounded-xl font-bold border-2 transition-all ${formData.grade_level === String(g) ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-muted-foreground hover:border-primary/50'}`}>{g}</button>))}</div></div><div><label className="input-label">Class Sections</label><div className="flex gap-2 mb-3"><input value={sectionInput} onChange={e => setSectionInput(e.target.value.toUpperCase())} className="input-premium" placeholder="e.g. A, B, ROSE" onKeyDown={e => e.key === 'Enter' && addSection()}/><button type="button" onClick={addSection} className="px-4 bg-muted hover:bg-muted/80 rounded-xl font-bold text-sm border border-input">Add</button></div><div className="flex flex-wrap gap-2">{formData.sections.map(sec => (<span key={sec} className="px-3 py-1 bg-background border border-border rounded-lg text-sm font-medium flex items-center gap-2">{formData.grade_level}-{sec}<button type="button" onClick={() => removeSection(sec)} className="text-muted-foreground hover:text-red-500"><XIcon className="w-3 h-3"/></button></span>))}{formData.sections.length === 0 && <span className="text-xs text-muted-foreground italic">No specific sections assigned.</span>}</div></div></div>;
            case 2: // Faculty
                return <div className="space-y-6 animate-in slide-in-from-right-4 duration-300"><div><label className="input-label mb-2">Main Teacher</label><div className="relative group"><TeacherIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" /><select value={formData.teacher_id} onChange={e => handleChange('teacher_id', e.target.value)} className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"><option value="">Select Faculty...</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.display_name}</option>)}</select></div></div></div>;
            case 3: // Curriculum
                 return <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 h-full flex flex-col"><div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Syllabus Builder</h3><button type="button" onClick={generateSyllabus} disabled={aiSyllabusGenerating || !formData.title} className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 hover:bg-purple-100 transition-colors border border-purple-200">{aiSyllabusGenerating ? <Spinner size="sm" className="text-current"/> : <><SparklesIcon className="w-3.5 h-3.5"/> Auto-Generate Units</>}</button></div><div className="flex-grow overflow-y-auto pr-1 space-y-4 custom-scrollbar">{curriculum.map((unit, idx) => (<div key={idx} className="bg-card border border-border rounded-xl p-4 transition-all hover:border-primary/40 group"><div className="flex items-center gap-3 mb-3"><div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold">{idx + 1}</div><input value={unit.title} onChange={e => updateUnit(idx, 'title', e.target.value)} className="flex-grow bg-transparent border-none p-0 text-sm font-bold focus:ring-0" placeholder="Unit Title"/><button type="button" onClick={() => removeUnit(idx)} className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100"><TrashIcon className="w-4 h-4"/></button></div><div className="grid grid-cols-3 gap-3 pl-9"><div className="col-span-2"><input value={unit.objectives} onChange={e => updateUnit(idx, 'objectives', e.target.value)} className="w-full bg-muted/30 border border-transparent rounded-lg px-2 py-1.5 text-xs focus:bg-background focus:border-primary" placeholder="Objectives..."/></div><div className="relative"><input type="number" value={unit.hours} onChange={e => updateUnit(idx, 'hours', parseInt(e.target.value))} className="w-full bg-muted/30 border border-transparent rounded-lg px-2 py-1.5 text-xs text-right pr-8 focus:bg-background focus:border-primary"/><span className="absolute right-2 top-1.5 text-[10px] text-muted-foreground">Hrs</span></div></div></div>))}<button type="button" onClick={addUnit} className="w-full py-3 border-2 border-dashed border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 flex items-center justify-center gap-2"><PlusIcon className="w-4 h-4"/> Add Unit</button></div></div>;
            case 4: // Enrollment
                 return <div className="space-y-6 animate-in slide-in-from-right-4 duration-300"><div className="p-5 bg-card border border-border rounded-2xl space-y-4 shadow-sm"><div className="flex justify-between items-center"><p className="text-sm font-bold text-foreground">Auto-Enrollment</p><button type="button" onClick={() => handleChange('auto_enroll', !formData.auto_enroll)} className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.auto_enroll ? 'bg-primary' : 'bg-muted-foreground/30'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${formData.auto_enroll ? 'translate-x-6' : 'translate-x-0'}`}></div></button></div></div><div><div className="flex justify-between mb-2"><label className="input-label">Max Class Capacity</label><span className="text-xs font-bold text-primary">{formData.max_capacity} Students</span></div><input type="range" min="10" max="60" value={formData.max_capacity} onChange={e => handleChange('max_capacity', parseInt(e.target.value))} className="w-full accent-primary h-2 bg-muted rounded-lg"/></div></div>;
            case 5: // Publish
                 return <div className="space-y-6 animate-in slide-in-from-right-4 duration-300"><div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl"><div className="flex justify-between items-start mb-6"><div><p className="text-xs font-bold text-slate-400 uppercase">Preview</p><h3 className="text-2xl font-bold mt-1">{formData.title}</h3></div><div className="p-2 bg-white/10 rounded-lg"><BookIcon className="w-6 h-6 text-white"/></div></div><div className="grid grid-cols-2 gap-4 text-sm"><div><p className="text-slate-500 text-xs uppercase font-bold">Grade</p><p className="font-medium">{formData.grade_level}</p></div><div><p className="text-slate-500 text-xs uppercase font-bold">Teacher</p><p className="font-medium">{teachers.find(t => t.id === formData.teacher_id)?.display_name || 'Unassigned'}</p></div></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><button type="button" onClick={() => handleChange('status', 'Draft')} className={`p-4 rounded-xl border-2 text-left transition-all ${formData.status === 'Draft' ? 'border-amber-500 bg-amber-50' : 'border-border bg-card hover:border-amber-300'}`}><div className="flex items-center gap-2 mb-1"><div className={`w-3 h-3 rounded-full ${formData.status === 'Draft' ? 'bg-amber-500' : 'bg-muted-foreground'}`}></div><span className="font-bold text-foreground">Save as Draft</span></div><p className="text-xs text-muted-foreground pl-5">Hidden from students.</p></button><button type="button" onClick={() => handleChange('status', 'Active')} className={`p-4 rounded-xl border-2 text-left transition-all ${formData.status === 'Active' ? 'border-emerald-500 bg-emerald-50' : 'border-border bg-card hover:border-emerald-300'}`}><div className="flex items-center gap-2 mb-1"><div className={`w-3 h-3 rounded-full ${formData.status === 'Active' ? 'bg-emerald-500' : 'bg-muted-foreground'}`}></div><span className="font-bold text-foreground">Publish Now</span></div><p className="text-xs text-muted-foreground pl-5">Visible to students.</p></button></div></div>;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-card w-full max-w-2xl rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-black/5" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border bg-muted/10 flex justify-between items-center"><div className="flex items-center gap-4"><div className="p-3 bg-primary/10 rounded-xl text-primary"><BookIcon className="w-6 h-6"/></div><div><h3 className="text-xl font-extrabold text-foreground">Create Course</h3><p className="text-xs text-muted-foreground font-medium mt-0.5">Step {currentStep + 1}: {STEPS[currentStep]}</p></div></div><button onClick={onClose} className="p-2 hover:bg-muted rounded-full text-muted-foreground"><XIcon className="w-5 h-5"/></button></div>
                <div className="px-10 pt-6 pb-2"><Stepper steps={STEPS} currentStep={currentStep} /></div>
                <div className="p-8 overflow-y-auto flex-grow bg-background custom-scrollbar">{renderStepContent()}</div>
                <div className="p-6 border-t border-border bg-muted/10 flex justify-between items-center">
                    <button onClick={currentStep === 0 ? onClose : handleBack} className="px-6 py-3 rounded-xl font-bold text-muted-foreground hover:bg-background hover:text-foreground border border-transparent hover:border-border text-sm" disabled={loading}>
                        {currentStep === 0 ? 'Cancel' : 'Back'}
                    </button>
                    <button onClick={currentStep === STEPS.length - 1 ? handleSubmit : handleNext} disabled={loading || (currentStep === 0 && (!formData.title || !formData.code))} className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 text-sm">
                        {loading ? <Spinner size="sm" className="text-white"/> : (currentStep === STEPS.length - 1 ? (formData.status === 'Active' ? 'Publish' : 'Save') : <>Next <ChevronRightIcon className="w-4 h-4"/></>)}
                    </button>
                </div>
            </div>
            <style>{`.input-premium { display: block; width: 100%; padding: 0.75rem 1rem; border: 1px solid hsl(var(--input)); border-radius: 0.75rem; background-color: hsl(var(--background)); color: hsl(var(--foreground)); font-size: 0.9rem; } .input-premium:focus { outline: none; border-color: hsl(var(--primary)); box-shadow: 0 0 0 2px hsl(var(--primary) / 0.1); } .input-label { display: block; font-size: 0.75rem; font-weight: 800; color: hsl(var(--muted-foreground)); margin-bottom: 0.4rem; }`}</style>
        </div>
    );
};
