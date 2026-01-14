
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { TeacherExtended, UserProfile, SchoolClass, Course, SchoolDepartment } from '../../types';
import Spinner from '../common/Spinner';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { BookIcon } from '../icons/BookIcon';
import { BriefcaseIcon } from '../icons/BriefcaseIcon';
import { XIcon } from '../icons/XIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { ArrowRightIcon } from '../icons/ArrowRightIcon';

interface OffboardingModalProps {
    teacher: TeacherExtended;
    onClose: () => void;
    onSuccess: () => void;
}

interface ImpactAnalysis {
    hodOf: SchoolDepartment[];
    classTeacherOf: SchoolClass[];
    courses: Course[];
}

const OffboardingModal: React.FC<OffboardingModalProps> = ({ teacher, onClose, onSuccess }) => {
    const [step, setStep] = useState<'analyzing' | 'resolve' | 'processing'>('analyzing');
    const [impact, setImpact] = useState<ImpactAnalysis>({ hodOf: [], classTeacherOf: [], courses: [] });
    const [colleagues, setColleagues] = useState<UserProfile[]>([]);
    
    // Reassignment State
    const [reassignments, setReassignments] = useState<{
        hod: Record<number, string>; // deptId -> newTeacherId
        classTeacher: Record<number, string>; // classId -> newTeacherId
        courses: Record<number, string>; // courseId -> newTeacherId
    }>({ hod: {}, classTeacher: {}, courses: {} });

    // 1. Analyze Impact & Fetch Colleagues
    useEffect(() => {
        const analyze = async () => {
            try {
                // Fetch potential replacements (other teachers)
                const { data: teachersData } = await supabase.rpc('get_all_teachers_for_admin');
                const others = (teachersData || []).filter((t: any) => t.id !== teacher.id);
                setColleagues(others);

                // Fetch Responsibilities
                const [deptRes, classRes, courseRes] = await Promise.all([
                    supabase.from('school_departments').select('*').eq('hod_id', teacher.id),
                    supabase.from('school_classes').select('*').eq('class_teacher_id', teacher.id),
                    supabase.from('courses').select('*').eq('teacher_id', teacher.id).eq('status', 'Active')
                ]);

                setImpact({
                    hodOf: deptRes.data || [],
                    classTeacherOf: classRes.data || [],
                    courses: courseRes.data || []
                });

                setStep('resolve');
            } catch (err) {
                console.error("Analysis failed:", err);
                alert("Failed to analyze teacher responsibilities. Please try again.");
                onClose();
            }
        };
        analyze();
    }, [teacher.id]);

    const handleReassignChange = (type: 'hod' | 'classTeacher' | 'courses', id: number, value: string) => {
        setReassignments(prev => ({
            ...prev,
            [type]: { ...prev[type], [id]: value }
        }));
    };

    const executeOffboarding = async () => {
        setStep('processing');
        try {
            const updates = [];

            // 1. Reassign Departments
            for (const dept of impact.hodOf) {
                const newHead = reassignments.hod[dept.id];
                updates.push(supabase.from('school_departments').update({ hod_id: newHead || null }).eq('id', dept.id));
            }

            // 2. Reassign Classes
            for (const cls of impact.classTeacherOf) {
                const newTeacher = reassignments.classTeacher[cls.id];
                updates.push(supabase.from('school_classes').update({ class_teacher_id: newTeacher || null }).eq('id', cls.id));
            }

            // 3. Reassign Courses
            for (const course of impact.courses) {
                const newTeacher = reassignments.courses[course.id];
                const status = newTeacher ? 'Active' : 'Pending'; // Mark pending if unassigned
                updates.push(supabase.from('courses').update({ teacher_id: newTeacher || null, status }).eq('id', course.id));
            }

            // 4. Update Teacher Profile
            updates.push(supabase.from('teacher_profiles').update({ employment_status: 'Resigned', branch_id: null }).eq('user_id', teacher.id));
            updates.push(supabase.from('profiles').update({ is_active: false }).eq('id', teacher.id));

            await Promise.all(updates);
            
            // Wait a moment for UX
            setTimeout(() => {
                onSuccess();
            }, 800);

        } catch (err: any) {
            console.error("Offboarding failed:", err);
            alert("An error occurred during offboarding. Some changes may have been applied.");
            setStep('resolve');
        }
    };

    const hasResponsibilities = impact.hodOf.length > 0 || impact.classTeacherOf.length > 0 || impact.courses.length > 0;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-border bg-red-50/50 dark:bg-red-900/10 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 rounded-xl shadow-sm">
                            <AlertTriangleIcon className="w-6 h-6"/>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-foreground">Offboard Faculty</h3>
                            <p className="text-sm text-muted-foreground">{teacher.display_name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={step === 'processing'} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <XIcon className="w-5 h-5 opacity-70"/>
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 bg-background custom-scrollbar">
                    {step === 'analyzing' && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Spinner size="lg"/>
                            <p className="text-muted-foreground font-medium animate-pulse">Analyzing responsibilities...</p>
                        </div>
                    )}

                    {step === 'resolve' && (
                        <div className="space-y-8">
                            {!hasResponsibilities ? (
                                <div className="p-6 bg-green-50 border border-green-200 rounded-xl flex items-center gap-4 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
                                    <CheckCircleIcon className="w-8 h-8"/>
                                    <div>
                                        <h4 className="font-bold">Clean Slate</h4>
                                        <p className="text-sm mt-1">This teacher has no active assignments. Safe to offboard immediately.</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Please reassign the following responsibilities to ensure academic continuity. 
                                    Unassigned items will be left vacant.
                                </p>
                            )}

                            {/* HOD Resolutions */}
                            {impact.hodOf.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                                        <BriefcaseIcon className="w-4 h-4"/> Department Leadership
                                    </h4>
                                    {impact.hodOf.map(dept => (
                                        <div key={dept.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm">
                                            <div>
                                                <p className="font-bold text-foreground">{dept.name}</p>
                                                <p className="text-xs text-muted-foreground">Current Head</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <ArrowRightIcon className="w-4 h-4 text-muted-foreground"/>
                                                <select 
                                                    className="bg-muted border border-input text-sm rounded-lg p-2 w-48 focus:ring-2 focus:ring-primary/20 outline-none"
                                                    onChange={(e) => handleReassignChange('hod', dept.id, e.target.value)}
                                                    value={reassignments.hod[dept.id] || ''}
                                                >
                                                    <option value="">Leave Vacant</option>
                                                    {colleagues.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Class Teacher Resolutions */}
                            {impact.classTeacherOf.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                                        <UsersIcon className="w-4 h-4"/> Class Management
                                    </h4>
                                    {impact.classTeacherOf.map(cls => (
                                        <div key={cls.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm">
                                            <div>
                                                <p className="font-bold text-foreground">{cls.name}</p>
                                                <p className="text-xs text-muted-foreground">Class Teacher</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <ArrowRightIcon className="w-4 h-4 text-muted-foreground"/>
                                                <select 
                                                    className="bg-muted border border-input text-sm rounded-lg p-2 w-48 focus:ring-2 focus:ring-primary/20 outline-none"
                                                    onChange={(e) => handleReassignChange('classTeacher', cls.id, e.target.value)}
                                                    value={reassignments.classTeacher[cls.id] || ''}
                                                >
                                                    <option value="">Leave Vacant</option>
                                                    {colleagues.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Course Resolutions */}
                            {impact.courses.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                                        <BookIcon className="w-4 h-4"/> Active Courses
                                    </h4>
                                    <div className="border border-border rounded-xl overflow-hidden">
                                        {impact.courses.map((course, idx) => (
                                            <div key={course.id} className={`flex items-center justify-between p-4 bg-card ${idx !== 0 ? 'border-t border-border' : ''}`}>
                                                <div>
                                                    <p className="font-bold text-foreground text-sm">{course.title} <span className="font-normal text-muted-foreground">({course.code})</span></p>
                                                    <p className="text-xs text-muted-foreground">Grade {course.grade_level}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <ArrowRightIcon className="w-4 h-4 text-muted-foreground"/>
                                                    <select 
                                                        className="bg-muted border border-input text-sm rounded-lg p-2 w-48 focus:ring-2 focus:ring-primary/20 outline-none"
                                                        onChange={(e) => handleReassignChange('courses', course.id, e.target.value)}
                                                        value={reassignments.courses[course.id] || ''}
                                                    >
                                                        <option value="">Unassign (Pending)</option>
                                                        {colleagues.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                             <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-800 text-sm mt-4 dark:bg-red-900/20 dark:border-red-900 dark:text-red-300">
                                <p className="font-bold mb-1">Final Confirmation:</p>
                                <p>This action will mark the teacher as <strong>Resigned</strong> and disable their portal access immediately. This cannot be undone easily.</p>
                            </div>
                        </div>
                    )}
                    
                    {step === 'processing' && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Spinner size="lg"/>
                            <h4 className="text-lg font-bold text-foreground">Processing Offboarding...</h4>
                            <p className="text-muted-foreground text-sm">Reassigning classes and archiving profile.</p>
                        </div>
                    )}
                </div>

                {step === 'resolve' && (
                    <div className="p-6 border-t border-border bg-muted/20 flex justify-end gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-background transition-colors">Cancel</button>
                        <button 
                            onClick={executeOffboarding} 
                            className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg hover:shadow-red-500/20 flex items-center gap-2"
                        >
                            Confirm Resignation <ChevronRightIcon className="w-4 h-4"/>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OffboardingModal;
