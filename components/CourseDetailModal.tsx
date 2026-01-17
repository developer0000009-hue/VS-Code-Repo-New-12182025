
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Course, CourseModule } from '../types';
import Spinner from './common/Spinner';
import { BookIcon } from './icons/BookIcon';
import { XIcon } from './icons/XIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface CourseDetailModalProps {
    course: Course;
    initialMode: 'view' | 'manage';
    onClose: () => void;
}

const CourseDetailModal: React.FC<CourseDetailModalProps> = ({ course, onClose }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'enrollments'>('overview');
    const [modules, setModules] = useState<CourseModule[]>([]);
    const [loading, setLoading] = useState(false);
    const [enrollmentCount, setEnrollmentCount] = useState(0);

    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [isAddingModule, setIsAddingModule] = useState(false);

    const fetchDetails = useCallback(async () => {
        setLoading(true);
        const [modsRes, enrollRes] = await Promise.all([
            supabase.from('course_modules').select('*').eq('course_id', course.id).order('order_index'),
            supabase.from('course_enrollments').select('id', { count: 'exact' }).eq('course_id', course.id)
        ]);
        
        if (modsRes.data) setModules(modsRes.data);
        if (enrollRes.count !== null) setEnrollmentCount(enrollRes.count);
        setLoading(false);
    }, [course.id]);

    useEffect(() => { fetchDetails(); }, [fetchDetails]);

    const handleAddModule = async () => {
        if (!newModuleTitle.trim()) return;
        setIsAddingModule(true);
        const { error } = await supabase.from('course_modules').insert({
            course_id: course.id,
            title: newModuleTitle,
            order_index: modules.length + 1
        });
        setIsAddingModule(false);
        if (!error) {
            setNewModuleTitle('');
            fetchDetails();
        }
    };

    const handleDeleteModule = async (id: number) => {
        if (!confirm('Delete this module?')) return;
        await supabase.from('course_modules').delete().eq('id', id);
        fetchDetails();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-card w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col border border-border overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-primary/10 to-transparent border-b border-border flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className="p-3 bg-primary/20 rounded-xl text-primary"><BookIcon className="w-8 h-8" /></div>
                        <div>
                            <h2 className="text-2xl font-bold text-card-foreground">{course.title}</h2>
                            <p className="text-sm text-muted-foreground flex gap-2 items-center mt-1">
                                <span className="font-mono bg-muted px-1.5 rounded text-xs">{course.code}</span>
                                <span>•</span>
                                <span>Grade {course.grade_level}</span>
                                <span>•</span>
                                <span>{enrollmentCount} Students Enrolled</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors"><XIcon className="w-6 h-6 text-muted-foreground" /></button>
                </div>

                {/* Navigation */}
                <div className="flex border-b border-border px-6 bg-muted/10">
                    {['overview', 'curriculum', 'enrollments'].map((tab) => (
                        <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <main className="flex-grow overflow-y-auto p-6 bg-card/50">
                    {loading ? <div className="flex justify-center py-12"><Spinner size="lg"/></div> : (
                        <>
                            {activeTab === 'overview' && (
                                <div className="space-y-6 max-w-2xl">
                                    <div>
                                        <h3 className="text-sm font-bold uppercase text-muted-foreground mb-2">About this course</h3>
                                        <p className="text-foreground leading-relaxed">{course.description || 'No description provided.'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-muted/30 rounded-lg border border-border">
                                            <p className="text-xs text-muted-foreground uppercase font-bold">Credits</p>
                                            <p className="text-xl font-bold text-foreground">{course.credits}</p>
                                        </div>
                                        <div className="p-4 bg-muted/30 rounded-lg border border-border">
                                            <p className="text-xs text-muted-foreground uppercase font-bold">Category</p>
                                            <p className="text-xl font-bold text-foreground">{course.category}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg">
                                        <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">Instructor: {course.teacher_name || 'Pending Assignment'}</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'curriculum' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-lg">Course Modules</h3>
                                    </div>
                                    
                                    {modules.length === 0 ? (
                                        <p className="text-muted-foreground italic">No modules defined yet.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {modules.map((mod, idx) => (
                                                <div key={mod.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">{idx + 1}</div>
                                                        <span className="font-medium text-foreground">{mod.title}</span>
                                                    </div>
                                                    <button onClick={() => handleDeleteModule(mod.id)} className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon className="w-4 h-4" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex gap-2 mt-6 pt-6 border-t border-border">
                                        <input 
                                            type="text" 
                                            value={newModuleTitle} 
                                            onChange={e => setNewModuleTitle(e.target.value)}
                                            placeholder="New Module Title..." 
                                            className="flex-grow p-2 rounded-lg border border-input bg-background"
                                        />
                                        <button onClick={handleAddModule} disabled={isAddingModule || !newModuleTitle} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold flex items-center gap-2 disabled:opacity-50">
                                            {isAddingModule ? <Spinner size="sm"/> : <><PlusIcon className="w-4 h-4"/> Add Module</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'enrollments' && (
                                <div className="text-center py-12 text-muted-foreground bg-muted/20 border-2 border-dashed border-border rounded-xl">
                                    <p>Student enrollment list view is coming in the next update.</p>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default CourseDetailModal;
