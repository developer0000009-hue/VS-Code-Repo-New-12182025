
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { UserProfile, Course } from '../../types';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { SchoolIcon } from '../icons/SchoolIcon';
import { TeacherIcon } from '../icons/TeacherIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { BookIcon } from '../icons/BookIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { GraduationCapIcon } from '../icons/GraduationCapIcon';
import { LayersIcon } from '../icons/LayersIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import Stepper from '../common/Stepper';
import CustomSelect from '../common/CustomSelect';

interface CreateClassWizardProps {
    onClose: () => void;
    onSuccess: () => void;
    branchId?: string | null;
}

const STEPS = ['Basic Details', 'Faculty', 'Capacity', 'Subjects', 'Review'];

const formatError = (err: any): string => {
    if (!err) return "An unknown error occurred.";
    if (typeof err === 'string') return (err === "[object Object]" || err === "{}") ? "Protocol error." : err;
    const message = err.message || err.error_description || err.details?.message || err.details || err.hint;
    if (message && typeof message === 'string' && !message.includes("[object Object]")) return message;
    try {
        const json = JSON.stringify(err);
        if (json && json !== '{}' && json !== '[]' && !json.includes("[object Object]")) return json;
    } catch { }
    return "An unexpected error occurred.";
};

const CreateClassWizard: React.FC<CreateClassWizardProps> = ({ onClose, onSuccess, branchId }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ grade: '', section: '', teacher_id: '', academic_year: '2025-2026', capacity: 30, subjects: [] as string[] });
    const [teachers, setTeachers] = useState<UserProfile[]>([]);
    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);

    useEffect(() => {
        const fetchResources = async () => {
            const [teacherRes, courseRes] = await Promise.all([supabase.rpc('get_all_teachers_for_admin'), supabase.from('courses').select('*').eq('status', 'Active')]);
            if (teacherRes.data) setTeachers(teacherRes.data);
            if (courseRes.data) setAvailableCourses(courseRes.data);
        };
        fetchResources();
    }, []);

    const handleNext = () => setCurrentStep(p => Math.min(p+1, STEPS.length-1));
    const handleBack = () => setCurrentStep(p => Math.max(p-1, 0));

    const handleSubmit = async () => {
        if (!branchId) { alert("Error: No branch context selected."); return; }
        setLoading(true);
        try {
            const name = `Grade ${formData.grade} - ${formData.section}`;
            const { error: classError } = await supabase.rpc('manage_class', { p_id: null, p_name: name, p_grade_level: formData.grade, p_section: formData.section, p_academic_year: formData.academic_year, p_class_teacher_id: formData.teacher_id || null, p_branch_id: branchId, p_capacity: formData.capacity });
            if (classError) throw classError;
            const { data: newClass, error: fetchError } = await supabase.from('school_classes').select('id').eq('name', name).eq('academic_year', formData.academic_year).eq('branch_id', branchId).order('created_at', { ascending: false }).limit(1).single();
            if (fetchError || !newClass) throw new Error("ID retrieval failed.");
            if (formData.subjects.length > 0) {
                const { error: mapError } = await supabase.rpc('map_class_subjects', { p_class_id: newClass.id, p_subject_ids: formData.subjects });
                if (mapError) throw mapError;
            }
            onSuccess(); onClose();
        } catch(err:any) { alert(`Failed to create class: ${formatError(err)}`); } finally { setLoading(false); }
    };

    const gradeCourses = useMemo(() => availableCourses.filter(c => c.grade_level === formData.grade), [availableCourses, formData.grade]);

    const renderStepContent = () => {
        switch(currentStep) {
            case 0: return (<div className="space-y-6 animate-in slide-in-from-right-4 duration-300"><h3 className="text-lg font-bold text-foreground mb-4">Academic Details</h3><div className="grid grid-cols-1 gap-6"><CustomSelect label="Academic Year" options={[{ label: '2025-2026', value: '2025-2026' }]} value={formData.academic_year} onChange={v => setFormData({...formData, academic_year: v})} icon={<CalendarIcon className="w-4 h-4"/>} required /><div className="grid grid-cols-2 gap-5"><CustomSelect label="Grade Level" options={Array.from({length:12},(_,i)=>({label:`Grade ${i+1}`, value:String(i+1)}))} value={formData.grade} onChange={v=>setFormData({...formData, grade:v})} placeholder="Select Grade" icon={<GraduationCapIcon className="w-4 h-4"/>} required /><div className="relative group"><div className="absolute top-1/2 -translate-y-1/2 left-4 text-muted-foreground/60 pointer-events-none"><LayersIcon className="w-4 h-4"/></div><input placeholder=" " value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} className="peer block w-full rounded-xl border border-input bg-background px-4 py-3.5 pl-11 text-sm shadow-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"/><label className="absolute left-11 top-0 -translate-y-1/2 bg-background px-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-primary pointer-events-none">Section</label></div></div></div></div>);
            case 1: return (<div className="space-y-6 animate-in slide-in-from-right-4 duration-300"><h3 className="text-lg font-bold text-foreground mb-4">Assign Class Teacher</h3><div className="bg-muted/30 p-6 rounded-xl border border-border"><label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Select Teacher</label><div className="relative group"><select value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})} className="w-full p-4 pl-12 rounded-xl border border-input bg-background outline-none appearance-none cursor-pointer shadow-sm transition-all"><option value="">No Class Teacher</option>{teachers.map(t => (<option key={t.id} value={t.id}>{t.display_name}</option>))}</select><TeacherIcon className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" /></div></div></div>);
            case 2: return (<div className="space-y-6 animate-in slide-in-from-right-4 duration-300"><h3 className="text-lg font-bold text-foreground mb-4">Class Capacity</h3><div className="relative group"><div className="absolute top-1/2 -translate-y-1/2 left-4 text-muted-foreground/60 pointer-events-none"><ChartBarIcon className="w-4 h-4"/></div><input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} className="peer block w-full rounded-xl border border-input bg-background px-4 py-3.5 pl-11 text-sm shadow-sm focus:border-primary outline-none" placeholder=" "/><label className="absolute left-11 top-0 -translate-y-1/2 bg-background px-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-primary pointer-events-none">Capacity</label></div></div>);
            case 3: return (<div className="space-y-5 animate-in slide-in-from-right-4 duration-300 h-full flex flex-col"><div className="flex justify-between items-center"><h3 className="font-bold text-lg text-foreground">Course Mapping</h3><span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-lg font-bold">{formData.subjects.length} Selected</span></div>{gradeCourses.length === 0 ? (<div className="p-10 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-border mt-4"><BookIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3"/><p className="text-muted-foreground text-sm font-medium">No courses for Grade {formData.grade}.</p></div>) : (<div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[320px] pr-2 custom-scrollbar mt-2">{gradeCourses.map(course => (<div key={course.id} onClick={() => setFormData(p => ({...p, subjects: p.subjects.includes(course.id.toString()) ? p.subjects.filter(id => id !== course.id.toString()) : [...p.subjects, course.id.toString()]}))} className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${formData.subjects.includes(course.id.toString()) ? 'bg-primary/5 border-primary shadow-md' : 'bg-card border-border hover:border-primary/50 shadow-sm'}`}><div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${formData.subjects.includes(course.id.toString()) ? 'bg-primary border-primary' : 'bg-background border-muted-foreground/40'}`}>{formData.subjects.includes(course.id.toString()) && <CheckCircleIcon className="w-4 h-4 text-primary-foreground"/>}</div><div className="flex-grow"><p className="text-sm font-bold">{course.title}</p><p className="text-xs text-muted-foreground mt-0.5">{course.code}</p></div></div>))}</div>)}</div>);
            case 4: return (<div className="space-y-6 animate-in slide-in-from-right-4 duration-300"><h3 className="text-lg font-bold text-foreground text-center mb-6">Review & Confirm</h3><div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm"><div className="grid grid-cols-2 gap-6 text-sm"><div><p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Class Name</p><p className="font-bold text-lg text-foreground mt-0.5">Grade {formData.grade} - {formData.section}</p></div><div><p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Teacher</p><p className="font-medium mt-0.5">{teachers.find(t => t.id === formData.teacher_id)?.display_name || <span className="text-amber-600">Unassigned</span>}</p></div></div></div></div>);
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}><div className="bg-card w-full max-w-2xl rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}><div className="p-6 border-b border-border bg-muted/10 flex justify-between items-center"><div><h3 className="text-xl font-extrabold text-foreground">Create New Class</h3><p className="text-xs text-muted-foreground font-medium mt-0.5">Step {currentStep + 1} of 5</p></div><button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground"><XIcon className="w-5 h-5"/></button></div><div className="px-10 pt-6 pb-2"><Stepper steps={STEPS} currentStep={currentStep} /></div><div className="p-8 flex-grow overflow-y-auto custom-scrollbar bg-background">{renderStepContent()}</div><div className="p-6 border-t border-border bg-muted/10 flex justify-between items-center"><button onClick={currentStep === 0 ? onClose : handleBack} className="px-6 py-3 rounded-xl font-bold text-sm text-muted-foreground hover:bg-background">Back</button><button onClick={currentStep === STEPS.length - 1 ? handleSubmit : handleNext} disabled={loading || (currentStep === 0 && (!formData.grade || !formData.section))} className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg hover:bg-primary/90 flex items-center gap-2 text-sm">{loading ? <Spinner size="sm" className="text-white"/> : (currentStep === STEPS.length - 1 ? 'Create' : <>Next <ChevronRightIcon className="w-4 h-4"/></>)}</button></div></div></div>
    );
};

export default CreateClassWizard;
