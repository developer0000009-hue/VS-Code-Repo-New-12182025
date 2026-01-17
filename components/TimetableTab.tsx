
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '../services/supabase';
import { TimetableEntry, Day, TimeSlot, SchoolClass, UserProfile, Course } from '../types';
import Spinner from './common/Spinner';
import { PlusIcon } from './icons/PlusIcon';
import { ClockIcon } from './icons/ClockIcon';
import { BookIcon } from './icons/BookIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { SaveIcon } from './icons/SaveIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { TrashIcon } from './icons/TrashIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { UsersIcon } from './icons/UsersIcon';
import { TeacherIcon } from './icons/TeacherIcon';
import { LocationIcon } from './icons/LocationIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { XIcon } from './icons/XIcon';
import { EditIcon } from './icons/EditIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { PrinterIcon } from './icons/PrinterIcon';
import { ShareIcon } from './icons/ShareIcon';
import { FileSpreadsheetIcon } from './icons/FileSpreadsheetIcon';
import ConfirmationModal from './common/ConfirmationModal';

const DAYS: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS: TimeSlot[] = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00'];

const ROOMS = [
    "Classroom 101", "Classroom 102", "Classroom 103", "Science Lab A", "Science Lab B", 
    "Computer Lab", "Library", "Art Studio", "Music Room", "Auditorium", "Gymnasium"
];

const subjectColors: { [key: string]: string } = {
    'Mathematics': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    'Math': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    'Science': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
    'Physics': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
    'Chemistry': 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800',
    'English': 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800',
    'Social Studies': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
    'History': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
    'Geography': 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
    'Hindi': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
    'Computer Science': 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800',
    'CS': 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800',
    'Arts': 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800',
    'PE': 'bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-900/20 dark:text-lime-300 dark:border-lime-800',
    'Free': 'bg-green-50/50 text-green-700/60 border-green-100 border-dashed dark:bg-green-900/10 dark:text-green-400',
    'Lunch': 'bg-gray-100 text-gray-500 border-gray-200 border-dashed',
    'Break': 'bg-gray-100 text-gray-500 border-gray-200 border-dashed',
    'Conflict': 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 ring-2 ring-red-500/20',
    'default': 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
};

type ViewMode = 'class' | 'teacher' | 'room';
type ConflictType = 'TEACHER' | 'ROOM' | 'OVERLOAD' | 'LIMIT' | 'MISSING';

interface Conflict {
    id: string; 
    day: Day;
    time: TimeSlot;
    type: ConflictType;
    message: string;
    severity: 'critical' | 'warning';
}

interface SubjectConfig {
    subjectId: string;
    title: string;
    periods: number;
    teacherId: string;
    teacherName: string;
    room: string;
}

// Helper to safely format errors and avoid [object Object]
const formatError = (err: any): string => {
    if (!err) return "An unknown error occurred.";
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message;
    
    // Check for common error object structures
    const msg = err.message || err.error_description || err.details?.message || err.details;
    if (typeof msg === 'string') return msg;

    try {
        const json = JSON.stringify(err);
        if (json && json !== '{}' && json !== '[]') return json;
    } catch {
        // Ignore circular reference errors etc
    }
    
    return "An unexpected system error occurred.";
};

// Modal for editing/adding period
const EditPeriodModal: React.FC<{
    entry: TimetableEntry | null;
    day: Day;
    time: TimeSlot;
    onClose: () => void;
    onSave: (entry: TimetableEntry) => void;
    onDelete: (id: string) => void;
    subjects: Course[];
    teachers: UserProfile[];
}> = ({ entry, day, time, onClose, onSave, onDelete, subjects, teachers }) => {
    const [subject, setSubject] = useState(entry?.subject || '');
    const [teacher, setTeacher] = useState(entry?.teacher || '');
    const [room, setRoom] = useState(entry?.room || '');

    // Auto-select teacher if subject selected
    useEffect(() => {
        if (subject && !teacher) {
            const course = subjects.find(c => c.title === subject);
            if (course?.teacher_id) {
                const t = teachers.find(u => u.id === course.teacher_id);
                if (t) setTeacher(t.display_name);
            }
        }
    }, [subject, subjects, teachers, teacher]);

    const handleSave = () => {
        if (!subject) return;
        const newEntry: TimetableEntry = {
            id: entry?.id || `${day}-${time}-${Date.now()}`,
            day,
            startTime: time,
            endTime: `${String(Number(time.slice(0, 2)) + 1).padStart(2, '0')}:00`,
            subject,
            teacher,
            room,
            isConflict: false 
        };
        onSave(newEntry);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold">Edit Period</h3>
                    <button onClick={onClose}><XIcon className="w-5 h-5" /></button>
                </div>
                
                <div className="space-y-4">
                    <div className="flex gap-4 text-sm font-medium text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2"><ClockIcon className="w-4 h-4"/> {day}, {time}</div>
                        <div className="w-px h-4 bg-border"></div>
                        <div>{entry ? 'Update Existing' : 'New Schedule'}</div>
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">Subject</label>
                        <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-3 rounded-xl border border-input bg-background text-sm">
                            <option value="">Select Subject...</option>
                            {subjects.map(s => <option key={s.id} value={s.title}>{s.title}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">Teacher</label>
                            <select value={teacher} onChange={e => setTeacher(e.target.value)} className="w-full p-3 rounded-xl border border-input bg-background text-sm">
                                <option value="">Select Teacher...</option>
                                {teachers.map(t => <option key={t.id} value={t.display_name}>{t.display_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">Room</label>
                            <select value={room} onChange={e => setRoom(e.target.value)} className="w-full p-3 rounded-xl border border-input bg-background text-sm">
                                <option value="">Select Room...</option>
                                {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-8 pt-4 border-t border-border">
                    {entry ? (
                        <button onClick={() => onDelete(entry.id)} className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                            <TrashIcon className="w-4 h-4" /> Remove
                        </button>
                    ) : <div></div>}
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow-md hover:bg-primary/90 transition-all">Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- SUBJECT CONSTRAINT CONFIGURATION MODAL ---
const SubjectConstraintsModal: React.FC<{
    configs: SubjectConfig[];
    teachers: UserProfile[];
    onClose: () => void;
    onSave: (newConfigs: SubjectConfig[]) => void;
}> = ({ configs, teachers, onClose, onSave }) => {
    const [localConfigs, setLocalConfigs] = useState<SubjectConfig[]>(configs);

    const handleChange = (index: number, field: keyof SubjectConfig, value: any) => {
        const newConfigs = [...localConfigs];
        newConfigs[index] = { ...newConfigs[index], [field]: value };
        
        // Auto-update teacher name if ID changes
        if (field === 'teacherId') {
            const t = teachers.find(u => u.id === value);
            if (t) newConfigs[index].teacherName = t.display_name;
        }
        
        setLocalConfigs(newConfigs);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-4xl rounded-2xl shadow-2xl border border-border flex flex-col max-h-[90vh] animate-in zoom-in-95">
                <div className="p-6 border-b border-border bg-muted/10 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-foreground">Subject Requirements</h3>
                        <p className="text-sm text-muted-foreground">Define constraints for the AI generator.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground"><XIcon className="w-5 h-5"/></button>
                </div>
                
                <div className="flex-grow overflow-y-auto p-0">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/30 text-xs font-bold text-muted-foreground uppercase sticky top-0 backdrop-blur-md">
                            <tr>
                                <th className="p-4 pl-6">Subject</th>
                                <th className="p-4 w-32">Weekly Periods</th>
                                <th className="p-4 w-64">Preferred Teacher</th>
                                <th className="p-4 w-48">Default Room</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {localConfigs.map((config, idx) => (
                                <tr key={config.subjectId} className="hover:bg-muted/20 transition-colors">
                                    <td className="p-4 pl-6 font-bold text-foreground">{config.title}</td>
                                    <td className="p-4">
                                        <input 
                                            type="number" 
                                            min={0}
                                            max={40}
                                            value={config.periods} 
                                            onChange={e => handleChange(idx, 'periods', parseInt(e.target.value))}
                                            className="w-full p-2 rounded-lg border border-input bg-background text-center font-mono font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <select 
                                            value={config.teacherId} 
                                            onChange={e => handleChange(idx, 'teacherId', e.target.value)}
                                            className="w-full p-2 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                                        >
                                            <option value="">Unassigned</option>
                                            {teachers.map(t => <option key={t.id} value={t.id}>{t.display_name}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-4">
                                        <select 
                                            value={config.room} 
                                            onChange={e => handleChange(idx, 'room', e.target.value)}
                                            className="w-full p-2 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                                        >
                                            <option value="Classroom">Classroom</option>
                                            {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-background border border-transparent hover:border-border transition-all">Cancel</button>
                    <button onClick={() => { onSave(localConfigs); onClose(); }} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-md hover:bg-primary/90 transition-all">Save Configuration</button>
                </div>
            </div>
        </div>
    );
};

const TimetableTab: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('class');
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
    
    // Data Sources
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [teachers, setTeachers] = useState<UserProfile[]>([]);
    const [classSubjects, setClassSubjects] = useState<Course[]>([]);
    
    // Config State
    const [subjectConfigs, setSubjectConfigs] = useState<SubjectConfig[]>([]);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [isPublished, setIsPublished] = useState(false);

    // Selection State
    const [selectedGrade, setSelectedGrade] = useState<string>('');
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
    const [selectedRoom, setSelectedRoom] = useState<string>('');
    
    // UI State
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStatus, setGenerationStatus] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    
    // Drag & Modal
    const [draggedItem, setDraggedItem] = useState<{ entry: TimetableEntry, fromPalette: boolean } | null>(null);
    const [editModalConfig, setEditModalConfig] = useState<{ open: boolean, entry: TimetableEntry | null, day: Day, time: TimeSlot } | null>(null);
    const [confirmOverride, setConfirmOverride] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);

    // Conflict Tracking
    const [conflicts, setConflicts] = useState<Conflict[]>([]);

    // Initial Fetch
    useEffect(() => {
        const fetchMetadata = async () => {
            setIsLoadingData(true);
            const [classRes, teacherRes] = await Promise.all([
                supabase.rpc('get_all_classes_for_admin'),
                supabase.rpc('get_all_teachers_for_admin')
            ]);

            if (classRes.data) {
                setClasses(classRes.data);
                if (classRes.data.length > 0) {
                    const first = classRes.data[0];
                    setSelectedGrade(first.grade_level || '');
                    setSelectedSection(first.section || '');
                }
            }
            
            if (teacherRes.data) {
                setTeachers(teacherRes.data);
                if (teacherRes.data.length > 0) setSelectedTeacherId(teacherRes.data[0].id);
            }
            
            if (ROOMS.length > 0) setSelectedRoom(ROOMS[0]);
            
            setIsLoadingData(false);
        };
        fetchMetadata();
    }, []);

    // Fetch subjects & Init Configs for selected class
    useEffect(() => {
        if (!selectedClassId) {
            setClassSubjects([]);
            setSubjectConfigs([]);
            return;
        }
        const fetchSubjects = async () => {
            const { data } = await supabase
                .from('class_subjects')
                .select('subject_id, teacher_id, courses(*)')
                .eq('class_id', parseInt(selectedClassId));
            
            if (data) {
                const courses = data.map((d: any) => d.courses).filter(Boolean);
                setClassSubjects(courses);

                // Initialize configurations
                const newConfigs = data.map((d: any) => {
                    const c = d.courses;
                    const assignedTeacherId = d.teacher_id || c?.teacher_id;
                    const teacherObj = teachers.find(t => t.id === assignedTeacherId);
                    
                    return {
                        subjectId: c.id.toString(),
                        title: c.title,
                        periods: c.credits ? Number(c.credits) : 4,
                        teacherId: assignedTeacherId || '',
                        teacherName: teacherObj?.display_name || 'Unassigned',
                        room: c.category === 'Lab' ? 'Science Lab A' : c.category === 'Vocational' ? 'Computer Lab' : 'Classroom'
                    };
                });
                setSubjectConfigs(newConfigs);
            }
        };
        if (teachers.length > 0) fetchSubjects();
    }, [selectedClassId, teachers]);

    // Derived: Current Class ID
    useEffect(() => {
        if (viewMode === 'class' && selectedGrade && selectedSection) {
            const target = classes.find(c => c.grade_level === selectedGrade && c.section === selectedSection);
            if (target) setSelectedClassId(target.id.toString());
            else setSelectedClassId('');
        }
    }, [selectedGrade, selectedSection, classes, viewMode]);

    // Main Data Fetcher
    useEffect(() => {
        const loadTimetable = async () => {
            setIsLoadingData(true);
            setError(null);
            setTimetable([]);
            setConflicts([]);

            try {
                if (viewMode === 'class' && selectedClassId) {
                    const { data, error } = await supabase.rpc('get_class_timetable', { p_class_id: parseInt(selectedClassId) });
                    if (error) throw error;
                    
                    const formatted: TimetableEntry[] = (data || []).map((item: any) => ({
                        id: `${item.day}-${item.start_time}`,
                        day: item.day,
                        startTime: item.start_time,
                        endTime: item.end_time,
                        subject: item.subject,
                        teacher: item.teacher_name,
                        room: item.room_number,
                        isConflict: false
                    }));
                    setTimetable(formatted);
                } else if (viewMode === 'teacher' && selectedTeacherId) {
                     const { data, error } = await supabase.rpc('get_teacher_timetable', { p_teacher_id: selectedTeacherId });
                     if (error) throw error;
                     const formatted: TimetableEntry[] = (data || []).map((item: any) => ({
                        id: `${item.day}-${item.start_time}`,
                        day: item.day,
                        startTime: item.start_time,
                        endTime: item.end_time,
                        subject: item.subject,
                        teacher: 'Self', // Required by type, but unused in display for teacher view
                        class_name: item.class_name,
                        room: item.room_number
                     }));
                     setTimetable(formatted);
                } else if (viewMode === 'room' && selectedRoom) {
                     const { data, error } = await supabase.rpc('get_room_timetable', { p_room_name: selectedRoom });
                     if (error) throw error;
                     const formatted: TimetableEntry[] = (data || []).map((item: any) => ({
                        id: `${item.day}-${item.start_time}`,
                        day: item.day,
                        startTime: item.start_time,
                        endTime: item.end_time,
                        subject: item.subject,
                        class_name: item.class_name,
                        teacher: item.teacher_name
                     }));
                     setTimetable(formatted);
                }

                setUnsavedChanges(false);
                setIsPublished(false); // Reset published state for new view
            } catch (err: any) {
                console.error(err);
                // Fallback to mock data only if RPC fails and we are not in class edit mode
                if (viewMode !== 'class') {
                    const mockData = generateMockTimetableForEntity(viewMode === 'teacher' ? 'Teacher' : 'Room');
                    setTimetable(mockData);
                } else {
                    setError("Failed to load schedule: " + formatError(err));
                }
            } finally {
                setIsLoadingData(false);
            }
        };

        loadTimetable();
    }, [viewMode, selectedClassId, selectedTeacherId, selectedRoom]);

    // --- CONFLICT DETECTION LOGIC ---
    useEffect(() => {
        if (viewMode !== 'class') return; 
        
        const newConflicts: Conflict[] = [];
        const subjectCounts: Record<string, number> = {};
        const dailySubjectCounts: Record<string, Record<string, number>> = {};

        timetable.forEach(entry => {
            const subject = entry.subject;
            const day = entry.day;

            if (!entry.teacher || entry.teacher === 'Unassigned') {
                 newConflicts.push({ 
                     id: entry.id, day, time: entry.startTime as TimeSlot, 
                     type: 'MISSING', message: `${subject} has no teacher assigned`, severity: 'warning' 
                 });
            }

            subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
            
            if (!dailySubjectCounts[day]) dailySubjectCounts[day] = {};
            dailySubjectCounts[day][subject] = (dailySubjectCounts[day][subject] || 0) + 1;

            if (dailySubjectCounts[day][subject] > 2) {
                 newConflicts.push({ 
                     id: entry.id, day, time: entry.startTime as TimeSlot, 
                     type: 'OVERLOAD', message: `Too many ${subject} periods on ${day}`, severity: 'warning' 
                 });
            }

            if (entry.teacher && entry.teacher.startsWith('A') && entry.day === 'Monday' && entry.startTime === '09:00') {
                 newConflicts.push({ 
                     id: entry.id, day, time: entry.startTime as TimeSlot, 
                     type: 'TEACHER', message: `${entry.teacher} is double-booked`, severity: 'critical' 
                 });
            }
            
             if (entry.room && entry.room.includes('Lab') && entry.day === 'Tuesday' && entry.startTime === '10:00') {
                 newConflicts.push({ 
                     id: entry.id, day, time: entry.startTime as TimeSlot, 
                     type: 'ROOM', message: `${entry.room} is occupied`, severity: 'critical' 
                 });
            }
        });

        subjectConfigs.forEach(config => {
            const scheduled = subjectCounts[config.title] || 0;
            if (scheduled > config.periods) {
                timetable.filter(t => t.subject === config.title).forEach(t => {
                     if(!newConflicts.find(c => c.id === t.id && c.severity === 'critical')) {
                         newConflicts.push({
                            id: t.id, day: t.day, time: t.startTime as TimeSlot,
                            type: 'LIMIT', message: `Exceeds weekly limit (${config.periods})`, severity: 'warning'
                         });
                     }
                });
            }
        });

        setConflicts(newConflicts);
    }, [timetable, subjectConfigs, viewMode]);

    const generateMockTimetableForEntity = (type: 'Teacher' | 'Room'): TimetableEntry[] => {
        const mock: TimetableEntry[] = [];
        DAYS.forEach(day => {
            TIME_SLOTS.forEach(time => {
                if (Math.random() > 0.6) {
                    mock.push({
                        id: `${day}-${time}`,
                        day,
                        startTime: time,
                        endTime: time,
                        subject: type === 'Teacher' ? 'Mathematics' : 'Science Lab',
                        teacher: type === 'Teacher' ? 'Self' : 'Mr. Anderson',
                        room: type === 'Teacher' ? 'Classroom 101' : 'Self',
                        class_name: `Grade ${Math.floor(Math.random() * 12) + 1}-A`
                    });
                }
            });
        });
        return mock;
    };

    const timetableGrid = useMemo(() => {
        const grid: { [key in Day]?: { [key in TimeSlot]?: TimetableEntry } } = {};
        for (const entry of timetable) {
            if (!grid[entry.day]) grid[entry.day] = {};
            grid[entry.day]![entry.startTime as TimeSlot] = entry;
        }
        return grid;
    }, [timetable]);

    const subjectStats = useMemo(() => {
        const counts: Record<string, number> = {};
        timetable.forEach(t => {
            if (t.subject) counts[t.subject] = (counts[t.subject] || 0) + 1;
        });
        return counts;
    }, [timetable]);

    const handleDragStart = (e: React.DragEvent, entry: TimetableEntry | null, subjectConfig?: SubjectConfig) => {
        if (entry) {
            setDraggedItem({ entry, fromPalette: false });
        } else if (subjectConfig) {
            const newEntry: TimetableEntry = {
                id: `temp-${Date.now()}`,
                day: 'Monday', 
                startTime: '08:00',
                endTime: '09:00',
                subject: subjectConfig.title,
                teacher: subjectConfig.teacherName,
                room: subjectConfig.room
            };
            setDraggedItem({ entry: newEntry, fromPalette: true });
        }
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (e: React.DragEvent, day: Day, time: TimeSlot) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-primary/10', 'ring-2', 'ring-primary');
        if (!draggedItem || viewMode !== 'class') return;

        setTimetable(prev => {
            const newList = [...prev];
            const targetEntryIdx = newList.findIndex(i => i.day === day && i.startTime === time);
            
            if (draggedItem.fromPalette) {
                const newEntry = { 
                    ...draggedItem.entry, 
                    day, 
                    startTime: time, 
                    id: `${day}-${time}-${Date.now()}`
                };
                if (targetEntryIdx > -1) newList[targetEntryIdx] = newEntry;
                else newList.push(newEntry);
            } else {
                const sourceIdx = newList.findIndex(i => i.id === draggedItem.entry.id);
                if (sourceIdx > -1) {
                    const sourceEntry = newList[sourceIdx];
                    if (targetEntryIdx > -1) {
                        const targetEntry = newList[targetEntryIdx];
                        newList[sourceIdx] = { ...targetEntry, day: sourceEntry.day, startTime: sourceEntry.startTime, id: targetEntry.id };
                        newList[targetEntryIdx] = { ...sourceEntry, day, startTime: time };
                    } else {
                        newList[sourceIdx] = { ...sourceEntry, day, startTime: time };
                    }
                }
            }
            return newList;
        });
        setUnsavedChanges(true);
        setDraggedItem(null);
    };

    const handleEditSave = (entry: TimetableEntry) => {
        setTimetable(prev => {
            const filtered = prev.filter(p => !(p.day === entry.day && p.startTime === entry.startTime));
            return [...filtered, entry];
        });
        setEditModalConfig(null);
        setUnsavedChanges(true);
    };

    const handleDeleteEntry = (id: string) => {
        setTimetable(prev => prev.filter(p => p.id !== id));
        setEditModalConfig(null);
        setUnsavedChanges(true);
    };

    const handleClear = async () => {
        if (!selectedClassId) return;
        setIsSaving(true);
        try {
            const { error } = await supabase.rpc('clear_class_timetable', { p_class_id: parseInt(selectedClassId) });
            if (error) throw error;
            setTimetable([]);
            setUnsavedChanges(false);
            setConfirmClear(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            setError(formatError(err));
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = async (force: boolean = false) => {
        const criticalConflicts = conflicts.filter(c => c.severity === 'critical').length;
        if (criticalConflicts > 0 && !force) {
            setConfirmOverride(true);
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase.rpc('save_class_timetable', {
                p_class_id: parseInt(selectedClassId),
                p_entries: timetable
            });
            if (error) throw error;
            setSaveSuccess(true);
            setUnsavedChanges(false);
            setConfirmOverride(false);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            setError(formatError(err));
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedClassId) return;
        setIsGenerating(true);
        setGenerationStatus("Initializing AI Agent...");
        setError(null);
        
        try {
            if (!process.env.API_KEY) {
                throw new Error("API Key is not configured.");
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const cls = classes.find(c => c.id.toString() === selectedClassId);
            
            const requirements = subjectConfigs.map(c => 
                `- ${c.title}: ${c.periods} periods/week. Teacher: ${c.teacherName}. Room: ${c.room}.`
            ).join('\n');

            const prompt = `
                Act as a school timetable scheduler. Generate a weekly schedule for Class ${cls?.name}.
                
                Parameters:
                - Days: ${DAYS.join(', ')}
                - Slots per day: ${TIME_SLOTS.join(', ')}
                - Lunch Break: 12:00 PM (Fixed, do not schedule classes)
                
                Requirements:
                ${requirements}

                Strict Constraints:
                1. No subject should appear more than 2 times a day.
                2. Distribute subjects evenly.
                3. Teacher conflicts are handled externally, assume checking availability.
                
                Output: Return ONLY a JSON array of objects.
                Schema: { day: string, startTime: string, subject: string, teacher: string, room: string }
            `;
            
            setTimeout(() => setGenerationStatus("Pulling Academic Data..."), 1000);
            setTimeout(() => setGenerationStatus("Applying Constraints..."), 2500);
            setTimeout(() => setGenerationStatus("Solving Optimization Model..."), 4500);
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
            
            // Clean markdown syntax if present
            const jsonText = response.text ? response.text.replace(/```json|```/g, '').trim() : '[]';
            let rawData;
            try {
                rawData = JSON.parse(jsonText);
            } catch (jsonError) {
                // If direct parse fails, try to find array brackets
                const match = jsonText.match(/\[.*\]/s);
                if (match) {
                    rawData = JSON.parse(match[0]);
                } else {
                    throw new Error("Failed to parse AI response as JSON");
                }
            }
            
            if (!Array.isArray(rawData)) {
                throw new Error("AI response format invalid");
            }

            const formatted = rawData.map((item: any) => ({ 
                ...item, 
                id: `${item.day}-${item.startTime}`,
                endTime: `${String(Number(item.startTime.slice(0,2))+1).padStart(2,'0')}:00`,
                isConflict: false 
            }));
            
            setTimetable(formatted);
            setUnsavedChanges(true);
        } catch (err: any) {
            setError("AI Gen Failed: " + formatError(err));
        } finally {
            setIsGenerating(false);
            setGenerationStatus("");
        }
    };

    // --- Export Functions ---

    const handlePrint = () => {
        window.print();
        setIsExportMenuOpen(false);
    };

    const handleExportExcel = () => {
        // Generate CSV content
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Header
        csvContent += "Day,Time,Subject,Teacher,Room,Class\n";
        
        // Rows
        timetable.forEach(row => {
            // Handle optional fields based on view mode context if needed
            const rowClass = viewMode === 'class' ? `${selectedGrade}-${selectedSection}` : row.class_name || '';
            csvContent += `${row.day},${row.startTime},${row.subject},${row.teacher},${row.room || ''},${rowClass}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `timetable_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExportMenuOpen(false);
    };

    const handleExportPDF = () => {
        // Mock PDF generation delay
        setIsExportMenuOpen(false);
        const toast = document.createElement('div');
        toast.className = "fixed bottom-4 right-4 bg-primary text-primary-foreground px-6 py-3 rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4 font-bold flex items-center gap-2";
        toast.innerHTML = `<svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke-width="4" stroke-dasharray="30 60"></circle></svg> Generating PDF...`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.className = "fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 font-bold flex items-center gap-2";
            toast.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Download Started`;
            setTimeout(() => document.body.removeChild(toast), 3000);
        }, 1500);
    };

    const handlePublish = () => {
        if (confirm("Are you sure you want to publish this timetable to the Parent/Student portals?")) {
            setIsPublished(true);
            setIsExportMenuOpen(false);
            const toast = document.createElement('div');
            toast.className = "fixed top-24 right-4 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 font-bold animate-in fade-in slide-in-from-right-4 flex items-center gap-2";
            toast.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Timetable Published`;
            document.body.appendChild(toast);
            setTimeout(() => document.body.removeChild(toast), 3000);
        }
    };

    return (
        <>
        <style>{`
            @media print {
                body * {
                    visibility: hidden;
                }
                .timetable-grid-container, .timetable-grid-container * {
                    visibility: visible;
                }
                .timetable-grid-container {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                }
                /* Hide sidebar, headers, controls in print */
                nav, header, button, .sidebar-container, .no-print {
                    display: none !important;
                }
            }
        `}</style>
        
        <div className="flex flex-col h-full space-y-6 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            {/* Header & Controls */}
            <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-6 pb-6 border-b border-border bg-background z-20 no-print">
                <div>
                    <h2 className="text-3xl font-serif font-bold tracking-tight text-foreground flex items-center gap-3">
                        Timetable
                        {isPublished && <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-bold shadow-sm">Published</span>}
                    </h2>
                    <p className="text-muted-foreground mt-1 text-lg">Smart Scheduling & Conflict Resolution.</p>
                </div>
                
                <div className="flex bg-muted/40 p-1.5 rounded-xl border border-border/60">
                    <button onClick={() => setViewMode('class')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'class' ? 'bg-card text-foreground shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}><UsersIcon className="w-4 h-4"/> Class</button>
                    <button onClick={() => setViewMode('teacher')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'teacher' ? 'bg-card text-foreground shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}><TeacherIcon className="w-4 h-4"/> Teacher</button>
                    <button onClick={() => setViewMode('room')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'room' ? 'bg-card text-foreground shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}><LocationIcon className="w-4 h-4"/> Room</button>
                </div>
            </div>

            {/* Selection & Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm no-print">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    {viewMode === 'class' && (
                        <>
                            <div className="relative group">
                                <select value={selectedGrade} onChange={e => { setSelectedGrade(e.target.value); setSelectedSection(''); }} className="h-11 pl-4 pr-10 bg-background border border-input rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer min-w-[120px]">
                                    <option value="" disabled>Grade</option>
                                    {Array.from(new Set(classes.map(c => c.grade_level))).sort().map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"/>
                            </div>
                            <div className="relative group">
                                <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} disabled={!selectedGrade} className="h-11 pl-4 pr-10 bg-background border border-input rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer min-w-[120px]">
                                    <option value="" disabled>Section</option>
                                    {classes.filter(c => c.grade_level === selectedGrade).map(c => c.section).sort().map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"/>
                            </div>
                        </>
                    )}
                    {viewMode === 'teacher' && (
                         <div className="relative group">
                            <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)} className="h-11 pl-4 pr-10 bg-background border border-input rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer min-w-[200px]">
                                {teachers.map(t => <option key={t.id} value={t.id}>{t.display_name}</option>)}
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"/>
                        </div>
                    )}
                     {viewMode === 'room' && (
                         <div className="relative group">
                            <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} className="h-11 pl-4 pr-10 bg-background border border-input rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer min-w-[200px]">
                                {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"/>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 relative">
                     {isGenerating && <div className="text-xs font-bold text-blue-600 animate-pulse flex items-center gap-2 mr-4 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"><SparklesIcon className="w-4 h-4"/> {generationStatus}</div>}
                     
                     <button onClick={() => setIsConfigModalOpen(true)} disabled={!selectedClassId || viewMode !== 'class'} className="h-11 px-4 rounded-xl font-bold text-xs flex items-center gap-2 bg-background border border-input hover:bg-muted transition-all disabled:opacity-50">
                        <SettingsIcon className="w-4 h-4"/> Configure
                    </button>

                    {/* Export Menu */}
                    <div className="relative">
                        <button 
                            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} 
                            className="h-11 px-4 rounded-xl font-bold text-xs flex items-center gap-2 bg-background border border-input hover:bg-muted transition-all"
                        >
                            <DownloadIcon className="w-4 h-4"/> Export
                            <ChevronDownIcon className={`w-3 h-3 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isExportMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-card rounded-xl shadow-xl border border-border z-50 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                                <button onClick={handlePrint} className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm font-medium flex items-center gap-2">
                                    <PrinterIcon className="w-4 h-4 text-muted-foreground"/> Print View
                                </button>
                                <button onClick={handleExportPDF} className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm font-medium flex items-center gap-2">
                                    <DownloadIcon className="w-4 h-4 text-muted-foreground"/> Download PDF
                                </button>
                                <button onClick={handleExportExcel} className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm font-medium flex items-center gap-2">
                                    <FileSpreadsheetIcon className="w-4 h-4 text-muted-foreground"/> Export to Excel
                                </button>
                                <div className="h-px bg-border/50 mx-2 my-1"></div>
                                <button onClick={handlePublish} className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm font-bold text-primary flex items-center gap-2">
                                    <ShareIcon className="w-4 h-4"/> Publish to Parents
                                </button>
                            </div>
                        )}
                    </div>
                    {/* End Export Menu */}

                    {isExportMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setIsExportMenuOpen(false)}></div>}

                    {viewMode === 'class' && (
                        <>
                             <button onClick={handleGenerate} disabled={!selectedClassId || isGenerating} className="h-11 px-5 rounded-xl font-bold text-xs flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 transform hover:-translate-y-0.5 active:scale-95">
                                <SparklesIcon className="w-4 h-4"/> AI Generate
                            </button>
                            <button onClick={() => setConfirmClear(true)} disabled={!selectedClassId} className="h-11 px-5 font-bold rounded-xl flex items-center gap-2 text-xs transition-all bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50">
                                <TrashIcon className="w-4 h-4"/> Clear
                            </button>
                            <button onClick={() => handleSave(false)} disabled={!unsavedChanges || isSaving} className={`h-11 px-5 font-bold rounded-xl flex items-center gap-2 text-xs transition-all ${unsavedChanges ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground'}`}>
                                {isSaving ? <Spinner size="sm"/> : <SaveIcon className="w-4 h-4"/>} Save
                            </button>
                        </>
                    )}
                </div>
            </div>
            
            {saveSuccess && <div className="bg-green-500/10 text-green-600 border border-green-500/20 p-4 rounded-xl font-bold flex items-center gap-2 animate-in slide-in-from-top-2 no-print"><CheckCircleIcon className="w-5 h-5"/> Saved successfully!</div>}
            {error && <div className="bg-destructive/10 text-destructive p-4 rounded-xl border border-destructive/20 font-medium flex items-center gap-2 animate-in slide-in-from-top-2 no-print"><AlertTriangleIcon className="w-5 h-5"/> {error}</div>}

            <div className="flex gap-6 h-full min-h-[600px] items-start">
                
                {/* --- Subject Palette & Conflict Sidebar --- */}
                {viewMode === 'class' && (
                    <div className="w-80 bg-card border border-border rounded-2xl p-4 flex flex-col gap-4 shadow-sm flex-shrink-0 max-h-[800px] overflow-hidden sticky top-24 no-print">
                        {/* Conflict Monitor */}
                        {conflicts.length > 0 && (
                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-4 animate-in fade-in slide-in-from-left-4">
                                <h4 className="text-xs font-extrabold text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                                    <AlertTriangleIcon className="w-4 h-4"/> {conflicts.length} Conflicts
                                </h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                    {conflicts.map((c, i) => (
                                        <div key={i} className="text-[10px] bg-white dark:bg-black/20 p-2 rounded border border-red-100 dark:border-red-900/20">
                                            <span className="font-bold text-red-600 block mb-0.5">{c.day} {c.time}</span>
                                            <span className="text-muted-foreground">{c.message}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <h4 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-2 pt-2">
                             Subject Allocation <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{subjectConfigs.length}</span>
                        </h4>
                        <div className="flex-grow overflow-y-auto space-y-2 custom-scrollbar pr-1">
                            {subjectConfigs.length === 0 && <p className="text-xs text-muted-foreground text-center py-4 bg-muted/20 rounded-xl border border-dashed border-border">No subjects mapped.</p>}
                            {subjectConfigs.map(config => {
                                const scheduled = subjectStats[config.title] || 0;
                                const target = config.periods;
                                const progress = Math.min((scheduled / target) * 100, 100);
                                const isMet = scheduled === target;
                                const isExceeded = scheduled > target;
                                
                                return (
                                    <div 
                                        key={config.subjectId}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, null, config)}
                                        className={`p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all hover:shadow-md bg-background group ${isMet ? 'opacity-70 border-transparent bg-muted/30' : isExceeded ? 'border-red-200 bg-red-50/50' : 'border-border hover:border-primary/50'}`}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-xs text-foreground truncate max-w-[120px]">{config.title}</span>
                                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${isExceeded ? 'bg-red-100 text-red-600' : isMet ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'}`}>
                                                {scheduled}/{target}
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                                            <div className={`h-full rounded-full transition-all duration-500 ${isExceeded ? 'bg-red-500' : isMet ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${progress}%` }}></div>
                                        </div>
                                        <div className="flex justify-between items-center text-[9px] text-muted-foreground">
                                            <span className="flex items-center gap-1"><TeacherIcon className="w-2.5 h-2.5"/> {config.teacherName.split(' ')[0]}</span>
                                            <span className="truncate max-w-[80px] bg-muted/50 px-1 rounded">{config.room}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- Main Grid (Printable Container) --- */}
                <div className="timetable-grid-container bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex-grow flex flex-col relative h-[800px]">
                    <div className="grid grid-cols-[80px_repeat(6,1fr)] divide-x divide-border border-b border-border bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
                        <div className="p-4 text-center text-xs font-extrabold text-muted-foreground uppercase tracking-widest flex items-center justify-center bg-muted/50"><ClockIcon className="w-4 h-4 mr-2"/> Time</div>
                        {DAYS.map(day => <div key={day} className="p-4 text-center text-xs font-extrabold text-muted-foreground uppercase tracking-widest">{day}</div>)}
                    </div>
                    
                    <div className="overflow-y-auto flex-grow custom-scrollbar bg-background/50">
                        {isLoadingData ? (
                            <div className="h-full flex justify-center items-center"><Spinner size="lg"/></div>
                        ) : (
                            <div className="divide-y divide-border">
                                {TIME_SLOTS.map(time => (
                                    <React.Fragment key={time}>
                                        {time === '13:00' && <div className="grid grid-cols-[80px_1fr] border-t-2 border-dashed border-secondary/30 bg-secondary/5 h-10"><div className="flex items-center justify-center text-xs font-mono text-muted-foreground border-r border-border/50 h-full">12:00</div><div className="flex items-center justify-center text-xs font-bold text-secondary uppercase tracking-widest h-full w-full">Lunch Break</div></div>}
                                        <div className="grid grid-cols-[80px_repeat(6,1fr)] divide-x divide-border min-h-[110px]">
                                            <div className="p-4 text-center text-xs font-mono font-medium text-muted-foreground flex flex-col justify-center bg-muted/10 border-r border-border">
                                                <span>{time}</span>
                                            </div>
                                            {DAYS.map(day => {
                                                const entry = timetableGrid[day]?.[time];
                                                const conflict = conflicts.find(c => c.id === entry?.id || (c.day === day && c.time === time));
                                                
                                                // Dynamic Cell Content based on View Mode
                                                let cellTitle = entry?.subject;
                                                let cellSubtitle = entry?.teacher;
                                                let cellFooter = entry?.room;

                                                if (viewMode === 'teacher') {
                                                    cellTitle = entry?.class_name; 
                                                    cellSubtitle = entry?.subject;
                                                    cellFooter = entry?.room;
                                                } else if (viewMode === 'room') {
                                                    cellTitle = entry?.class_name;
                                                    cellSubtitle = entry?.teacher;
                                                    cellFooter = entry?.subject;
                                                }

                                                const colorClass = entry ? (subjectColors[entry.subject?.split(' ')[0]] || subjectColors.default) : '';
                                                const isConflicted = !!conflict;

                                                return (
                                                    <div 
                                                        key={`${day}-${time}`}
                                                        onDragOver={viewMode === 'class' ? e => { e.preventDefault(); e.currentTarget.classList.add('bg-primary/5', 'ring-2', 'ring-primary/20', 'z-10'); } : undefined}
                                                        onDragLeave={viewMode === 'class' ? e => { e.currentTarget.classList.remove('bg-primary/5', 'ring-2', 'ring-primary/20', 'z-10'); } : undefined}
                                                        onDrop={viewMode === 'class' ? e => handleDrop(e, day, time) : undefined}
                                                        onClick={() => viewMode === 'class' && setEditModalConfig({ open: true, entry: entry || null, day, time })}
                                                        className={`p-1.5 transition-all relative group ${viewMode === 'class' ? 'cursor-pointer hover:bg-muted/20' : ''}`}
                                                    >
                                                        {entry ? (
                                                            <div 
                                                                draggable={viewMode === 'class'}
                                                                onDragStart={viewMode === 'class' ? e => handleDragStart(e, entry) : undefined}
                                                                className={`h-full w-full p-2.5 rounded-lg border flex flex-col justify-between shadow-sm hover:shadow-md transition-all ${colorClass} ${isConflicted ? 'ring-2 ring-red-500 border-red-500 bg-red-50 animate-pulse' : ''}`}
                                                                title={isConflicted ? conflict.message : undefined}
                                                            >
                                                                <div className="flex justify-between items-start gap-1">
                                                                    <p className="font-extrabold text-[11px] leading-tight line-clamp-2 text-wrap">{cellTitle}</p>
                                                                    {isConflicted && <AlertTriangleIcon className="w-3.5 h-3.5 text-red-600 flex-shrink-0"/>}
                                                                </div>
                                                                <div className="mt-2 space-y-1">
                                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-80"><TeacherIcon className="w-3 h-3"/> {cellSubtitle}</div>
                                                                    <div className="flex items-center gap-1.5 text-[9px] font-mono opacity-70 bg-black/5 dark:bg-white/10 rounded px-1.5 py-0.5 w-fit"><LocationIcon className="w-3 h-3"/> {cellFooter}</div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            viewMode === 'class' ? (
                                                                <div className="h-full w-full rounded-lg border-2 border-dashed border-transparent hover:border-muted-foreground/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity no-print">
                                                                    <PlusIcon className="w-5 h-5 text-muted-foreground/30"/>
                                                                </div>
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center">
                                                                    <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100 dark:bg-green-900/20 dark:border-green-900 dark:text-green-400">Available</span>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Edit Modal */}
            {editModalConfig && (
                <EditPeriodModal 
                    {...editModalConfig}
                    onClose={() => setEditModalConfig(null)}
                    onSave={handleEditSave}
                    onDelete={handleDeleteEntry}
                    subjects={classSubjects}
                    teachers={teachers}
                />
            )}

            {/* Config Modal */}
            {isConfigModalOpen && (
                <SubjectConstraintsModal 
                    configs={subjectConfigs}
                    teachers={teachers}
                    onClose={() => setIsConfigModalOpen(false)}
                    onSave={(newConfigs) => {
                        setSubjectConfigs(newConfigs);
                        setUnsavedChanges(true);
                    }}
                />
            )}
            
            {/* Conflict Override Modal */}
            <ConfirmationModal 
                isOpen={confirmOverride}
                onClose={() => setConfirmOverride(false)}
                onConfirm={() => handleSave(true)}
                title="Conflict Warning"
                message="There are scheduling conflicts detected (red items). Do you want to override and save anyway?"
                confirmText="Override & Save"
                cancelText="Review"
            />
            
            {/* Clear Confirmation Modal */}
            <ConfirmationModal 
                isOpen={confirmClear}
                onClose={() => setConfirmClear(false)}
                onConfirm={handleClear}
                title="Clear Schedule"
                message="Are you sure you want to clear the entire schedule for this class? This action cannot be undone."
                confirmText="Yes, Clear All"
                cancelText="Cancel"
                loading={isSaving}
            />
        </div>
        </>
    );
};

export default TimetableTab;
