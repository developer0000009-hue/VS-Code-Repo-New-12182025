
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { SchoolClass, StudentRosterItem, AttendanceRecord, AttendanceStatus, FunctionComponentWithIcon } from '../types';
import Spinner from './common/Spinner';
import { SearchIcon } from './icons/SearchIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { ClockIcon } from './icons/ClockIcon';
import { ChecklistIcon } from './icons/ChecklistIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { SaveIcon } from './icons/SaveIcon'; 
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { BellIcon } from './icons/BellIcon';
import { RotateCcwIcon } from './icons/RotateCcwIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { MicIcon } from './icons/MicIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { FilterIcon } from './icons/FilterIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import { XIcon } from './icons/XIcon';
import { MailIcon } from './icons/MailIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { SettingsIcon } from './icons/SettingsIcon';

// --- Icons ---

const RefreshIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
        <path d="M16 16h5v5" />
    </svg>
);

// --- Types & Constants ---

type ViewMode = 'marking' | 'analytics';

type ExtendedAttendanceStatus = AttendanceStatus | 'Half-Day' | 'Excused';

interface ExtendedAttendanceRecord {
    student_id: string;
    status: ExtendedAttendanceStatus | null;
    notes?: string;
    late_time?: string;
    absence_reason?: string;
    marked_at?: string; // For "Time Marked" column
    recorded_by?: string; // UUID
}

type CombinedRecord = StudentRosterItem & {
    attendance: ExtendedAttendanceRecord;
    isModified?: boolean;
};

interface ActivityLogItem {
    id: string;
    user_name: string;
    role: string;
    action: string;
    timestamp: string;
    details?: string;
}

interface NotificationSettings {
    enabled: boolean;
    notifyAbsent: boolean;
    notifyLate: boolean;
    absentTemplate: string;
    lateTemplate: string;
}

const ABSENCE_REASONS = ['Sick', 'Personal reason', 'Travel', 'Unknown', 'Other'];
const QUICK_TAGS = ['Improper Uniform', 'No Homework', 'Disruptive', 'Excellent Participation', 'Forgot ID', 'Health Issue'];

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// --- Helper Hooks ---

const useAnimatedCounter = (endValue: number, duration = 1000) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const increment = endValue / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= endValue) {
                setCount(endValue);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [endValue, duration]);
    return count;
};

// --- Sub-Components ---

const KPICard: React.FC<{ title: string; value: number | string; total?: number; color: string; icon: React.ReactNode }> = ({ title, value, total, color, icon }) => {
    const numValue = typeof value === 'number' ? value : parseFloat(value as string);
    const displayValue = typeof value === 'number' ? useAnimatedCounter(value) : value;
    const percentage = total && total > 0 ? Math.round((numValue / total) * 100) : 0;
    
    return (
        <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm flex items-center justify-between relative overflow-hidden group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1">
            <div className={`absolute right-0 top-0 w-24 h-24 ${color} opacity-5 rounded-bl-full transform translate-x-4 -translate-y-4 transition-transform group-hover:scale-110 duration-500`}></div>
            <div className="relative z-10">
                <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1.5">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-foreground tracking-tight">{displayValue}</h3>
                    {total !== undefined && <span className="text-xs font-semibold text-muted-foreground/70">/ {total}</span>}
                </div>
                {total !== undefined && (
                    <div className="mt-3 flex items-center gap-2">
                        <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden shadow-inner">
                            <div className={`h-full rounded-full ${color.replace('text-', 'bg-')} transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }}></div>
                        </div>
                        <span className={`text-[10px] font-bold ${color}`}>{percentage}%</span>
                    </div>
                )}
            </div>
            <div className={`p-3.5 rounded-xl ${color} bg-opacity-10 shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/5`}>
                {icon}
            </div>
        </div>
    );
};

const InsightAlert: React.FC<{ type: 'warning' | 'success' | 'info'; title: string; message: string }> = ({ type, title, message }) => {
    const styles = {
        warning: 'bg-amber-50/50 border-amber-200 text-amber-900 dark:bg-amber-900/10 dark:border-amber-800 dark:text-amber-200',
        success: 'bg-emerald-50/50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/10 dark:border-emerald-800 dark:text-emerald-200',
        info: 'bg-blue-50/50 border-blue-200 text-blue-900 dark:bg-blue-900/10 dark:border-blue-800 dark:text-blue-200',
    };
    const icon = {
        warning: <AlertTriangleIcon className="w-5 h-5" />,
        success: <TrendingUpIcon className="w-5 h-5" />,
        info: <BellIcon className="w-5 h-5" />,
    };

    return (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${styles[type]} shadow-sm animate-in slide-in-from-top-2 duration-500`}>
            <div className="mt-0.5 flex-shrink-0">{icon[type]}</div>
            <div>
                <h4 className="text-sm font-bold tracking-tight">{title}</h4>
                <p className="text-xs font-medium opacity-90 mt-1 leading-relaxed">{message}</p>
            </div>
        </div>
    );
};

const StatusSegmentedControl: React.FC<{ 
    status: ExtendedAttendanceStatus | null; 
    onChange: (s: ExtendedAttendanceStatus) => void; 
}> = ({ status, onChange }) => {
    return (
        <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50 shadow-inner w-fit">
            {[
                { id: 'Present', label: 'P', fullLabel: 'Present', icon: <CheckCircleIcon className="w-4 h-4"/>, color: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-1 ring-emerald-400' },
                { id: 'Absent', label: 'A', fullLabel: 'Absent', icon: <XCircleIcon className="w-4 h-4"/>, color: 'bg-red-500 text-white shadow-lg shadow-red-500/30 ring-1 ring-red-400' },
                { id: 'Late', label: 'L', fullLabel: 'Late', icon: <ClockIcon className="w-4 h-4"/>, color: 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 ring-1 ring-amber-400' },
                { id: 'Half-Day', label: 'HD', fullLabel: 'Half-Day', icon: <ClockIcon className="w-4 h-4"/>, color: 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-400' },
                { id: 'Excused', label: 'E', fullLabel: 'Excused', icon: <BriefcaseIcon className="w-4 h-4"/>, color: 'bg-purple-500 text-white shadow-lg shadow-purple-500/30 ring-1 ring-purple-400' },
            ].map((opt) => {
                const isActive = status === opt.id;
                return (
                    <button
                        key={opt.id}
                        onClick={() => onChange(opt.id as ExtendedAttendanceStatus)}
                        className={`
                            relative flex items-center justify-center w-9 h-8 rounded-md transition-all duration-200 group overflow-hidden
                            ${isActive ? `${opt.color} scale-105 font-bold z-10` : 'text-muted-foreground hover:bg-background hover:text-foreground'}
                        `}
                        title={opt.fullLabel}
                    >
                        <span className="text-[10px] relative z-10">{opt.label}</span>
                        {!isActive && <span className="absolute inset-0 bg-background opacity-0 group-hover:opacity-100 transition-opacity -z-0"></span>}
                    </button>
                );
            })}
        </div>
    );
};

const NotificationSettingsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    settings: NotificationSettings;
    onSave: (settings: NotificationSettings) => void;
}> = ({ isOpen, onClose, settings, onSave }) => {
    const [formData, setFormData] = useState(settings);

    useEffect(() => {
        if (isOpen) setFormData(settings);
    }, [isOpen, settings]);

    const handleChange = (key: keyof NotificationSettings, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in zoom-in-95 ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border bg-muted/10 flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-foreground"><BellIcon className="w-5 h-5 text-primary"/> Automation Settings</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><XIcon className="w-5 h-5"/></button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                    <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl shadow-sm">
                        <div>
                            <h4 className="font-bold text-sm text-foreground">Auto-Send Notifications</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">Send alerts to parents when attendance is marked.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={formData.enabled} onChange={e => handleChange('enabled', e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                        </label>
                    </div>

                    <div className={`space-y-6 transition-all duration-300 ${!formData.enabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="notifyAbsent" checked={formData.notifyAbsent} onChange={e => handleChange('notifyAbsent', e.target.checked)} className="rounded border-input text-primary focus:ring-primary w-4 h-4" />
                                <label htmlFor="notifyAbsent" className="text-sm font-bold text-foreground">Notify on Absence</label>
                            </div>
                            <textarea 
                                className="w-full p-3 bg-background border border-input rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none shadow-sm transition-shadow"
                                rows={3}
                                value={formData.absentTemplate}
                                onChange={e => handleChange('absentTemplate', e.target.value)}
                                placeholder="Enter message template..."
                            />
                            <p className="text-[10px] text-muted-foreground font-mono flex gap-2">Variables: <span className="bg-muted px-1.5 py-0.5 rounded border border-border">{`{student_name}`}</span> <span className="bg-muted px-1.5 py-0.5 rounded border border-border">{`{date}`}</span></p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="notifyLate" checked={formData.notifyLate} onChange={e => handleChange('notifyLate', e.target.checked)} className="rounded border-input text-primary focus:ring-primary w-4 h-4" />
                                <label htmlFor="notifyLate" className="text-sm font-bold text-foreground">Notify on Late Arrival</label>
                            </div>
                            <textarea 
                                className="w-full p-3 bg-background border border-input rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none shadow-sm transition-shadow"
                                rows={3}
                                value={formData.lateTemplate}
                                onChange={e => handleChange('lateTemplate', e.target.value)}
                                placeholder="Enter message template..."
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-colors border border-transparent hover:border-border">Cancel</button>
                    <button onClick={() => { onSave(formData); onClose(); }} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all transform active:scale-95">Save Settings</button>
                </div>
            </div>
        </div>
    );
};

const ActivityLogPanel: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    logs: ActivityLogItem[];
    onApprove: () => void;
    isApproved: boolean;
}> = ({ isOpen, onClose, logs, onApprove, isApproved }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative w-full max-w-md bg-card h-full border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 ring-1 ring-white/10">
                <div className="p-5 border-b border-border bg-muted/10 flex justify-between items-center backdrop-blur-md">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                        <ClockIcon className="w-5 h-5 text-primary"/> Activity Log
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><XIcon className="w-5 h-5"/></button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {logs.length === 0 ? (
                        <div className="text-center py-12 opacity-50">
                            <ClockIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground"/>
                            <p className="text-muted-foreground text-sm">No activity recorded for this date.</p>
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-border/60 ml-3 space-y-8 py-2">
                            {logs.map((log, idx) => (
                                <div key={log.id} className="relative pl-8 group">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-muted-foreground/30 group-hover:border-primary transition-colors z-10 flex items-center justify-center shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-foreground">{log.action}</span>
                                        <span className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                            by <span className="font-semibold text-foreground/80">{log.user_name}</span> <span className="bg-muted px-1.5 py-0.5 rounded border border-border text-[9px] uppercase tracking-wide">{log.role}</span>
                                        </span>
                                        <span className="text-[10px] text-muted-foreground/60 mt-1 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        {log.details && <p className="text-xs text-muted-foreground mt-2 bg-muted/40 p-3 rounded-lg border border-border/50 leading-relaxed">{log.details}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-border bg-muted/10 backdrop-blur-md">
                    {isApproved ? (
                         <div className="flex items-center justify-center gap-2 p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold shadow-sm">
                             <CheckCircleIcon className="w-5 h-5"/> Attendance Verified
                         </div>
                    ) : (
                        <button 
                            onClick={onApprove} 
                            className="w-full py-3.5 bg-gradient-to-r from-primary to-indigo-600 text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 transform active:scale-95"
                        >
                            <CheckCircleIcon className="w-5 h-5"/> Mark as Reviewed
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

const AttendanceTab: FunctionComponentWithIcon<{}> = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('marking');
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    
    // Marking Filter States
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedSession, setSelectedSession] = useState('Daily');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Analytics Filter States
    const [analyticsClassId, setAnalyticsClassId] = useState<string>('');
    const [analyticsStudentId, setAnalyticsStudentId] = useState<string>(''); // For specific student report
    const [analyticsMonth, setAnalyticsMonth] = useState(new Date().getMonth());
    const [analyticsYear, setAnalyticsYear] = useState(new Date().getFullYear());

    const [roster, setRoster] = useState<StudentRosterItem[]>([]);
    const [localAttendance, setLocalAttendance] = useState<Record<string, ExtendedAttendanceRecord>>({});
    const [prevAttendance, setPrevAttendance] = useState<Record<string, ExtendedAttendanceRecord> | null>(null);
    
    const [loading, setLoading] = useState({ classes: true, data: false, saving: false, analytics: false });
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
    const [showUndo, setShowUndo] = useState(false);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    
    // Activity Log State
    const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
    const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
    const [isDayReviewed, setIsDayReviewed] = useState(false); 
    
    // Notification Settings State
    const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
        enabled: false,
        notifyAbsent: true,
        notifyLate: false,
        absentTemplate: "Dear Parent, {student_name} has been marked absent today ({date}). Please contact the school if this is an error.",
        lateTemplate: "Dear Parent, {student_name} arrived late to school today ({date})."
    });

    // Auto-save indicators per student row
    const [typingStatus, setTypingStatus] = useState<Record<string, 'saved' | 'typing'>>({});
    const [recordingState, setRecordingState] = useState<string | null>(null);

    const undoTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const typingTimeoutRef = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    // --- Initial Data ---

    useEffect(() => {
        const fetchClasses = async () => {
            setLoading(prev => ({ ...prev, classes: true }));
            const { data } = await supabase.rpc('get_all_classes_for_admin');
            if (data) {
                setClasses(data);
                if (data.length > 0) {
                    const firstId = String(data[0].id);
                    if (!selectedClassId) setSelectedClassId(firstId);
                    if (!analyticsClassId) setAnalyticsClassId(firstId);
                }
            }
            setLoading(prev => ({ ...prev, classes: false }));
        };
        fetchClasses();
    }, []);

    // --- Fetch Roster & Attendance (Marking Mode) ---

    useEffect(() => {
        if (!selectedClassId) return;
        
        const fetchData = async () => {
            setLoading(prev => ({ ...prev, data: true }));
            
            const [rosterRes, attendanceRes] = await Promise.all([
                supabase.rpc('get_class_roster_for_admin', { p_class_id: parseInt(selectedClassId) }),
                supabase.rpc('get_attendance_for_admin', { p_class_id: parseInt(selectedClassId), p_attendance_date: selectedDate })
            ]);
            
            const students = rosterRes.data || [];
            const existingRecords: (AttendanceRecord & { recorded_by?: string })[] = attendanceRes.data || [];
            
            // Fetch recorder names if any
            const recorderIds = Array.from(new Set(existingRecords.map(r => r.recorded_by).filter(Boolean)));
            let recorderMap: Record<string, string> = {};
            
            if (recorderIds.length > 0) {
                const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', recorderIds);
                if (profiles) {
                    profiles.forEach((p: any) => recorderMap[p.id] = p.display_name);
                }
            }
            
            const initialMap: Record<string, ExtendedAttendanceRecord> = {};
            const logs: ActivityLogItem[] = [];

            // Reset Approval Status on new fetch (Mock Logic)
            setIsDayReviewed(existingRecords.length > 0 && Math.random() > 0.7);

            existingRecords.forEach(rec => {
                initialMap[rec.student_id] = {
                    student_id: rec.student_id,
                    status: rec.status as ExtendedAttendanceStatus,
                    notes: rec.notes || '',
                    marked_at: '09:00 AM',
                    recorded_by: rec.recorded_by
                };
                
                if (rec.recorded_by) {
                    // Create synthetic logs for demo
                    logs.push({
                        id: `log-${rec.id || Math.random()}`,
                        user_name: recorderMap[rec.recorded_by] || 'Unknown User',
                        role: 'Teacher',
                        action: 'Marked Attendance',
                        timestamp: new Date().toISOString(), 
                        details: `Marked ${rec.status} for student.`
                    });
                }
            });
            
            const uniqueLogs = logs.length > 0 ? [logs[0]] : []; 

            setRoster(students);
            setLocalAttendance(initialMap);
            setActivityLogs(uniqueLogs);
            setPrevAttendance(null);
            setShowUndo(false);
            setLoading(prev => ({ ...prev, data: false }));
        };

        if (viewMode === 'marking') fetchData();
    }, [selectedClassId, selectedDate, viewMode]);

    // --- Analytics Fetching (Mocked for Demo) ---
    
    const [analyticsData, setAnalyticsData] = useState<any>(null);

    useEffect(() => {
        if (viewMode === 'analytics' && analyticsClassId) {
            setLoading(prev => ({ ...prev, analytics: true }));
            // Simulate fetch delay
            setTimeout(() => {
                // Generate Mock Data for the month
                const daysInMonth = new Date(analyticsYear, analyticsMonth + 1, 0).getDate();
                const mockTrend = Array.from({ length: daysInMonth }, (_, i) => ({
                    day: i + 1,
                    present: Math.floor(Math.random() * 20) + 80, // 80-100%
                    absent: Math.floor(Math.random() * 10),
                    late: Math.floor(Math.random() * 5)
                }));
                
                const mockStudentPerformance = roster.map(s => ({
                    ...s,
                    attendancePercentage: Math.floor(Math.random() * 30) + 70, // 70-100%
                    daysPresent: Math.floor(Math.random() * 20) + 10,
                    daysAbsent: Math.floor(Math.random() * 5),
                    status: Math.random() > 0.8 ? 'At Risk' : 'Good'
                })).sort((a,b) => a.attendancePercentage - b.attendancePercentage);

                setAnalyticsData({
                    trend: mockTrend,
                    studentPerformance: mockStudentPerformance,
                    averageAttendance: 92,
                    bestDay: 'Wednesdays',
                    chronicAbsenteeism: 5 // %
                });
                setLoading(prev => ({ ...prev, analytics: false }));
            }, 800);
        }
    }, [viewMode, analyticsClassId, analyticsMonth, analyticsYear, roster]);


    // --- Computed Data ---

    const processedData: CombinedRecord[] = useMemo(() => {
        const lowerQuery = searchQuery.toLowerCase();
        return roster
            .filter(s => 
                s.display_name.toLowerCase().includes(lowerQuery) ||
                (s.roll_number && s.roll_number.toLowerCase().includes(lowerQuery)) ||
                (s.id && s.id.toLowerCase().includes(lowerQuery))
            )
            .map(student => {
                const record = localAttendance[student.id] || { student_id: student.id, status: null };
                return {
                    ...student,
                    attendance: record,
                    isModified: !!localAttendance[student.id]
                };
            });
    }, [roster, localAttendance, searchQuery]);

    const stats = useMemo(() => {
        const total = roster.length;
        const counts = {
            Present: 0, Absent: 0, Late: 0, Excused: 0, 'Half-Day': 0, Pending: 0
        };
        
        const records = Object.values(localAttendance) as ExtendedAttendanceRecord[];
        records.forEach(rec => {
            if (rec.status && Object.prototype.hasOwnProperty.call(counts, rec.status)) {
                counts[rec.status as keyof typeof counts]++;
            }
        });
        
        counts.Pending = total - (counts.Present + counts.Absent + counts.Late + counts.Excused + counts['Half-Day']);
        const attendanceRate = total > 0 ? Math.round(((counts.Present + counts.Late) / total) * 100) : 0;

        return { counts, total, attendanceRate };
    }, [roster, localAttendance]);

    // --- Handlers ---

    const handleResetFilters = () => {
        if (classes.length > 0) setSelectedClassId(String(classes[0].id));
        setSelectedDate(new Date().toISOString().split('T')[0]);
        setSearchQuery('');
        setSelectedSession('Daily');
    };

    const updateStatus = (studentId: string, status: ExtendedAttendanceStatus) => {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLocalAttendance(prev => ({
            ...prev,
            [studentId]: { 
                ...prev[studentId], 
                student_id: studentId, 
                status,
                marked_at: status === 'Present' ? '09:00 AM' : status === 'Late' ? now : status === 'Half-Day' ? '12:00 PM' : '--',
                late_time: status === 'Late' ? now : undefined,
                absence_reason: status === 'Absent' ? (prev[studentId]?.absence_reason || 'Unknown') : undefined 
            }
        }));
        if (status === 'Absent' || status === 'Late' || status === 'Half-Day' || status === 'Excused') {
            setExpandedRow(studentId);
        }
        setSaveSuccess(null);
    };

    const updateDetails = (studentId: string, field: keyof ExtendedAttendanceRecord, value: string) => {
         setLocalAttendance(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], student_id: studentId, [field]: value }
        }));
        setSaveSuccess(null);
        setTypingStatus(prev => ({ ...prev, [studentId]: 'typing' }));
        if (typingTimeoutRef.current[studentId]) clearTimeout(typingTimeoutRef.current[studentId]);
        typingTimeoutRef.current[studentId] = setTimeout(() => {
            setTypingStatus(prev => ({ ...prev, [studentId]: 'saved' }));
            setTimeout(() => setTypingStatus(prev => { const newState = { ...prev }; delete newState[studentId]; return newState; }), 2000);
        }, 800);
    };

    const addQuickRemark = (studentId: string, tag: string) => {
        const currentNote = localAttendance[studentId]?.notes || '';
        const separator = currentNote ? ', ' : '';
        updateDetails(studentId, 'notes', `${currentNote}${separator}${tag}`);
    };

    const handleVoiceInput = (studentId: string) => {
        setRecordingState(studentId);
        setTimeout(() => {
            const currentNote = localAttendance[studentId]?.notes || '';
            const separator = currentNote ? ' ' : '';
            updateDetails(studentId, 'notes', `${currentNote}${separator}[Voice Note]`);
            setRecordingState(null);
        }, 2000);
    };

    const handleBulkMark = (status: ExtendedAttendanceStatus) => {
        setPrevAttendance({ ...localAttendance });
        setShowUndo(true);
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
        undoTimeoutRef.current = setTimeout(() => setShowUndo(false), 5000);

        const updates: Record<string, ExtendedAttendanceRecord> = { ...localAttendance };
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const targets = processedData.length > 0 ? processedData : roster;

        targets.forEach(s => {
             updates[s.id] = { 
                ...updates[s.id], 
                student_id: s.id, 
                status,
                marked_at: status === 'Present' ? '09:00 AM' : status === 'Late' ? now : '--',
                late_time: status === 'Late' ? now : undefined,
                absence_reason: status === 'Absent' ? 'Unknown' : undefined
            };
        });
        setLocalAttendance(updates);
        setSaveSuccess(null);
    };

    const handleUndo = () => {
        if (prevAttendance) {
            setLocalAttendance(prevAttendance);
            setPrevAttendance(null);
            setShowUndo(false);
            if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
        }
    };

    const handleSave = async () => {
        setLoading(prev => ({ ...prev, saving: true }));
        const recordsData = Object.values(localAttendance) as ExtendedAttendanceRecord[];
        const records = recordsData.filter(r => r.status).map(r => ({
            class_id: parseInt(selectedClassId),
            student_id: r.student_id,
            attendance_date: selectedDate,
            status: r.status === 'Half-Day' || r.status === 'Excused' ? 'Present' : r.status,
            notes: [r.notes, r.absence_reason ? `Reason: ${r.absence_reason}` : '', r.late_time ? `Late: ${r.late_time}` : ''].filter(Boolean).join(' | ')
        }));

        const { error } = await supabase.rpc('upsert_attendance_for_admin', { records });
        
        if (!error) {
            // NOTIFICATION LOGIC
            let notificationCount = 0;
            if (notificationSettings.enabled) {
                // Filter for Absent or Late students based on settings
                const targets = recordsData.filter(r => 
                    (notificationSettings.notifyAbsent && r.status === 'Absent') ||
                    (notificationSettings.notifyLate && r.status === 'Late')
                );
                
                // Simulate sending notifications
                if (targets.length > 0) {
                     notificationCount = targets.length;
                     console.log(`Sending ${notificationCount} automated messages...`);
                }
            }

            setSaveSuccess(notificationCount > 0 ? `Attendance Saved & ${notificationCount} Notifications Queued` : "Saved Successfully!");
            setTimeout(() => setSaveSuccess(null), 3000);
            setShowUndo(false);
            
            // Add self to activity log mock
            setActivityLogs(prev => [{
                id: `log-${Date.now()}`,
                user_name: 'You',
                role: 'Admin',
                action: 'Updated Attendance',
                timestamp: new Date().toISOString(),
                details: `Updated ${records.length} records.${notificationCount > 0 ? ` Sent ${notificationCount} alerts.` : ''}`
            }, ...prev]);
        } else {
            alert('Save failed: ' + error.message);
        }
        setLoading(prev => ({ ...prev, saving: false }));
    };
    
    const handleExportReport = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Name,Status,Percentage,Days Present\n"
            + (analyticsData?.studentPerformance || []).map((s: any) => 
                `"${s.display_name}","${s.status}","${s.attendancePercentage}%","${s.daysPresent}"`
            ).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `attendance_report_${analyticsMonth+1}_${analyticsYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleApproveReview = () => {
        setIsDayReviewed(true);
        setActivityLogs(prev => [{
            id: `log-${Date.now()}`,
            user_name: 'You',
            role: 'Admin',
            action: 'Approved Attendance',
            timestamp: new Date().toISOString(),
            details: 'Verified attendance log for the day.'
        }, ...prev]);
        setIsActivityLogOpen(false);
    };

    // --- Render Functions ---

    const renderAnalyticsInterface = () => {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Filter Bar */}
                <div className="bg-card/80 backdrop-blur-md p-5 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center justify-between sticky top-24 z-20">
                    <div className="flex flex-wrap gap-4 items-end w-full md:w-auto">
                        <div className="w-full sm:w-48">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1">Class</label>
                            <select 
                                value={analyticsClassId} 
                                onChange={(e) => setAnalyticsClassId(e.target.value)}
                                className="w-full h-11 pl-3 pr-8 rounded-xl border border-input bg-background text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none hover:bg-muted/30 transition-colors cursor-pointer"
                            >
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="w-full sm:w-32">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1">Month</label>
                            <select 
                                value={analyticsMonth} 
                                onChange={(e) => setAnalyticsMonth(parseInt(e.target.value))}
                                className="w-full h-11 pl-3 pr-8 rounded-xl border border-input bg-background text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none hover:bg-muted/30 transition-colors cursor-pointer"
                            >
                                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                            </select>
                        </div>
                        <div className="w-full sm:w-24">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1">Year</label>
                            <select 
                                value={analyticsYear} 
                                onChange={(e) => setAnalyticsYear(parseInt(e.target.value))}
                                className="w-full h-11 pl-3 pr-8 rounded-xl border border-input bg-background text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none hover:bg-muted/30 transition-colors cursor-pointer"
                            >
                                {[2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className="w-full sm:w-56">
                             <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1">Student (Optional)</label>
                             <input 
                                type="text" 
                                placeholder="Search student..." 
                                value={analyticsStudentId}
                                onChange={e => setAnalyticsStudentId(e.target.value)}
                                className="w-full h-11 pl-3 pr-4 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/50 transition-all"
                             />
                        </div>
                    </div>
                    <button 
                        onClick={handleExportReport}
                        className="h-11 px-5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-primary/20 hover:-translate-y-0.5"
                    >
                        <DownloadIcon className="w-4 h-4" /> Export Report
                    </button>
                </div>

                {loading.analytics || !analyticsData ? (
                    <div className="flex justify-center p-12"><Spinner size="lg"/></div>
                ) : (
                    <>
                         {/* KPI Summary */}
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <KPICard title="Avg. Attendance" value={`${analyticsData.averageAttendance}%`} color="text-blue-600" icon={<ChartBarIcon className="w-6 h-6"/>} />
                            <KPICard title="Best Day" value={analyticsData.bestDay} color="text-emerald-600" icon={<CalendarIcon className="w-6 h-6"/>} />
                            <KPICard title="Chronic Absence Rate" value={`${analyticsData.chronicAbsenteeism}%`} color="text-red-600" icon={<AlertTriangleIcon className="w-6 h-6"/>} />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Trend Chart (Mock CSS Bar) */}
                            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col hover:shadow-md transition-all">
                                <h3 className="font-bold text-lg mb-6">Daily Attendance Trend ({MONTHS[analyticsMonth]})</h3>
                                <div className="flex-grow flex items-end justify-between gap-1 h-64 px-2">
                                    {analyticsData.trend.map((d: any, i: number) => (
                                        <div key={i} className="w-full bg-primary/5 rounded-t-sm relative group h-full flex items-end">
                                            <div 
                                                className="w-full bg-primary rounded-t-sm group-hover:bg-primary/80 transition-all duration-500 ease-out" 
                                                style={{ height: `${d.present}%` }}
                                            >
                                                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded shadow-lg transition-opacity whitespace-nowrap z-10">
                                                    Day {d.day}: {d.present}%
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                    <span>Start</span>
                                    <span>Mid</span>
                                    <span>End</span>
                                </div>
                            </div>
                            
                            {/* Heatmap */}
                            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                                <h3 className="font-bold text-lg mb-6">Attendance Heatmap</h3>
                                <div className="grid grid-cols-7 gap-2">
                                    {['S','M','T','W','T','F','S'].map((d,i) => (
                                        <div key={i} className="text-center text-xs font-bold text-muted-foreground">{d}</div>
                                    ))}
                                    {Array.from({ length: 30 }).map((_, i) => {
                                        const status = Math.random() > 0.9 ? 'absent' : Math.random() > 0.8 ? 'late' : 'present';
                                        return (
                                            <div 
                                                key={i} 
                                                className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-bold transition-transform hover:scale-110 cursor-default 
                                                ${status === 'present' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : status === 'absent' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}
                                            >
                                                {i+1}
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="flex gap-4 justify-center mt-6 text-xs font-medium text-muted-foreground">
                                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-emerald-500 rounded-full"/> Present</span>
                                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-red-500 rounded-full"/> Absent</span>
                                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-amber-500 rounded-full"/> Late</span>
                                </div>
                            </div>
                        </div>

                        {/* Student Performance Table */}
                        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                            <div className="p-6 border-b border-border bg-muted/20">
                                <h3 className="font-bold text-lg text-foreground">Student Performance Report</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        <tr>
                                            <th className="p-4 pl-6">Student</th>
                                            <th className="p-4">Attendance %</th>
                                            <th className="p-4">Days Present</th>
                                            <th className="p-4">Days Absent</th>
                                            <th className="p-4 text-right pr-6">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {analyticsData.studentPerformance.map((s: any) => (
                                            <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="p-4 pl-6 font-medium text-foreground">{s.display_name}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-8 text-right font-mono font-bold">{s.attendancePercentage}%</span>
                                                        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${s.attendancePercentage < 75 ? 'bg-red-500' : s.attendancePercentage < 90 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{width: `${s.attendancePercentage}%`}}></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-emerald-600 font-bold">{s.daysPresent}</td>
                                                <td className="p-4 text-red-600 font-bold">{s.daysAbsent}</td>
                                                <td className="p-4 pr-6 text-right">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${s.status === 'At Risk' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300'}`}>
                                                        {s.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    }

    const renderMarkingInterface = () => {
        const currentClassName = classes.find(c => c.id.toString() === selectedClassId)?.name || 'Class';

        return (
        <>
            {/* Smart Automation Insights */}
            {processedData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {stats.attendanceRate < 80 && (
                        <InsightAlert 
                            type="warning" 
                            title="Attendance Alert" 
                            message={`Class attendance is critical at ${stats.attendanceRate}%. Target is 90%.`} 
                        />
                    )}
                    {stats.counts.Absent >= 3 && (
                        <InsightAlert 
                            type="warning" 
                            title="Chronic Absenteeism" 
                            message={`${stats.counts.Absent} students marked absent today. Check frequent absentees.`} 
                        />
                    )}
                    {stats.attendanceRate >= 95 && (
                        <InsightAlert 
                            type="success" 
                            title="High Performance" 
                            message="Class attendance is excellent today! Keep up the streak." 
                        />
                    )}
                    {/* Mock Streak Insight */}
                    <InsightAlert 
                        type="info" 
                        title="Engagement Streak" 
                        message="12 students have maintained a 10-day attendance streak." 
                    />
                </div>
            )}

            {/* Advanced Filter Bar */}
            <div className="bg-card/80 backdrop-blur-md p-5 rounded-2xl border border-border shadow-sm mb-6 flex flex-col lg:flex-row gap-5 items-end lg:items-center justify-between animate-in slide-in-from-top-2 duration-500 sticky top-24 z-20 transition-all">
                
                {/* Left Side: Filters */}
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    {/* Class Selector */}
                    <div className="flex-1 sm:w-56">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1">Class / Grade</label>
                        <div className="relative">
                            <select 
                                value={selectedClassId} 
                                onChange={(e) => setSelectedClassId(e.target.value)}
                                className="w-full h-12 pl-4 pr-10 rounded-xl border border-input bg-background text-sm font-semibold shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none transition-all cursor-pointer hover:bg-muted/20"
                            >
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    {/* Date Picker */}
                    <div className="flex-1 sm:w-44">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1">Date</label>
                        <div className="relative">
                            <input 
                                type="date" 
                                value={selectedDate} 
                                onChange={(e) => setSelectedDate(e.target.value)} 
                                className="w-full h-12 pl-4 pr-4 rounded-xl border border-input bg-background text-sm font-semibold shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer hover:bg-muted/20"
                            />
                        </div>
                    </div>

                    {/* Session Selector */}
                    <div className="flex-1 sm:w-40">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block ml-1">Session</label>
                        <div className="relative">
                             <select 
                                value={selectedSession} 
                                onChange={(e) => setSelectedSession(e.target.value)}
                                className="w-full h-12 pl-4 pr-10 rounded-xl border border-input bg-background text-sm font-semibold shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none transition-all cursor-pointer hover:bg-muted/20"
                            >
                                <option value="Daily">Daily</option>
                                <option value="Morning">Morning</option>
                                <option value="Afternoon">Afternoon</option>
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Right Side: Search & Quick Tools */}
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-end">
                    <div className="relative flex-grow sm:w-64">
                        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input 
                            type="text" 
                            placeholder="Search name, roll no..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 pl-10 pr-4 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                        />
                    </div>
                    
                    <div className="flex gap-1 bg-muted/50 p-1 rounded-xl border border-border/50 shadow-sm">
                         <button 
                            onClick={() => setIsActivityLogOpen(true)}
                            className={`h-10 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${isDayReviewed ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-card hover:bg-white text-muted-foreground hover:text-foreground border border-transparent hover:border-border'}`}
                            title="View Activity & Approvals"
                        >
                            {isDayReviewed ? <CheckCircleIcon className="w-3.5 h-3.5"/> : <ClockIcon className="w-3.5 h-3.5"/>} 
                            {isDayReviewed ? 'Verified' : 'Review'}
                        </button>

                        <button 
                            onClick={() => setIsNotifyModalOpen(true)}
                            className={`h-10 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${notificationSettings.enabled ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-card hover:bg-white text-muted-foreground hover:text-foreground border border-transparent hover:border-border'}`}
                            title="Communication Settings"
                        >
                            <BellIcon className="w-3.5 h-3.5"/>
                            {notificationSettings.enabled ? 'On' : 'Off'}
                        </button>

                        <div className="w-px h-6 bg-border mx-1 self-center"></div>
                        
                        <button 
                            onClick={() => handleBulkMark('Present')} 
                            className="h-10 px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5" 
                            title="Mark All Present"
                        >
                            <CheckCircleIcon className="w-3.5 h-3.5"/> Present
                        </button>
                        <button 
                            onClick={() => handleBulkMark('Absent')} 
                            className="h-10 px-3 bg-card hover:bg-red-50 text-muted-foreground hover:text-red-600 border border-transparent hover:border-red-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5" 
                            title="Mark All Absent"
                        >
                            <XCircleIcon className="w-3.5 h-3.5"/> Absent
                        </button>
                         <button 
                            onClick={() => handleBulkMark('Late')} 
                            className="h-10 px-3 bg-card hover:bg-amber-50 text-muted-foreground hover:text-amber-600 border border-transparent hover:border-amber-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5" 
                            title="Mark All Late"
                        >
                            <ClockIcon className="w-3.5 h-3.5"/> Late
                        </button>
                    </div>
                    
                    <button 
                        onClick={handleResetFilters}
                        className="h-12 w-12 rounded-xl border border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted hover:border-muted-foreground/30 transition-all flex items-center justify-center shadow-sm active:scale-95"
                        title="Reset Filters"
                    >
                        <FilterIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* World-Class Student Table */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md">
                {loading.data ? (
                    <div className="flex flex-col items-center justify-center h-96">
                        <Spinner size="lg" />
                        <p className="text-muted-foreground text-sm mt-4 animate-pulse">Loading {currentClassName} roster...</p>
                    </div>
                ) : processedData.length === 0 ? (
                    <div className="text-center py-32 bg-muted/5">
                        <UsersIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-bold text-foreground">No Students Found</h3>
                        <p className="text-muted-foreground text-sm mt-1">Adjust filters or search criteria.</p>
                    </div>
                ) : (
                    <div className="w-full overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/30 border-b border-border text-xs font-bold uppercase text-muted-foreground tracking-wider sticky top-0 z-10 backdrop-blur-md">
                                    <th className="p-5 pl-6 w-[30%]">Student Details</th>
                                    <th className="p-5 w-[15%]">Class</th>
                                    <th className="p-5 w-[25%]">Attendance Status</th>
                                    <th className="p-5 w-[15%]">Time Marked</th>
                                    <th className="p-5 pr-6 text-right w-[15%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {processedData.map((student) => {
                                    const status = student.attendance.status;
                                    const isExpanded = expandedRow === student.id;
                                    const isRowModified = student.isModified;

                                    return (
                                        <React.Fragment key={student.id}>
                                            <tr className={`group transition-all duration-200 hover:bg-muted/20 ${isRowModified ? 'bg-primary/5' : ''}`}>
                                                <td className="p-5 pl-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <img 
                                                                src={`https://api.dicebear.com/8.x/initials/svg?seed=${student.display_name}`} 
                                                                alt={student.display_name}
                                                                className="w-12 h-12 rounded-full bg-background border-2 border-border shadow-sm object-cover transition-transform group-hover:scale-110"
                                                            />
                                                            {status && (
                                                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-card shadow-sm flex items-center justify-center ${
                                                                    status === 'Present' ? 'bg-emerald-500' : 
                                                                    status === 'Absent' ? 'bg-red-500' : 
                                                                    status === 'Late' ? 'bg-amber-500' : 
                                                                    status === 'Half-Day' ? 'bg-blue-500' :
                                                                    'bg-purple-500'
                                                                }`}>
                                                                    {status === 'Present' && <CheckCircleIcon className="w-3 h-3 text-white"/>}
                                                                    {status === 'Absent' && <XCircleIcon className="w-3 h-3 text-white"/>}
                                                                    {(status === 'Late' || status === 'Half-Day') && <ClockIcon className="w-3 h-3 text-white"/>}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{student.display_name}</p>
                                                            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                                                ID: {student.roll_number || '---'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-muted text-xs font-bold text-muted-foreground border border-border">
                                                        {currentClassName}
                                                    </span>
                                                </td>
                                                <td className="p-5">
                                                    <StatusSegmentedControl 
                                                        status={status} 
                                                        onChange={(s) => updateStatus(student.id, s)} 
                                                    />
                                                </td>
                                                <td className="p-5">
                                                    {status === 'Late' ? (
                                                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 w-fit">
                                                            <ClockIcon className="w-3.5 h-3.5 text-amber-600" />
                                                            <input 
                                                                type="time" 
                                                                value={student.attendance.late_time || ''}
                                                                onChange={(e) => updateDetails(student.id, 'late_time', e.target.value)}
                                                                className="bg-transparent border-none text-xs font-bold text-amber-800 focus:ring-0 p-0 w-16 outline-none"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <p className={`text-sm font-mono font-medium ${status ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                                                            {student.attendance.marked_at || '--:--'}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="p-5 pr-6 text-right">
                                                    <button 
                                                        onClick={() => setExpandedRow(isExpanded ? null : student.id)}
                                                        className={`
                                                            p-2.5 rounded-xl transition-all duration-200
                                                            ${isExpanded || student.attendance.notes 
                                                                ? 'bg-primary/10 text-primary ring-1 ring-primary/20' 
                                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                            }
                                                        `}
                                                        title={student.attendance.notes ? "View/Edit Remarks" : "Add Remarks"}
                                                    >
                                                        <FileTextIcon className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                            
                                            {/* Smart Remarks Card */}
                                            <tr className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${isExpanded ? 'bg-muted/20' : 'hidden'}`}>
                                                <td colSpan={5} className="px-6 pb-6 pt-0 border-b border-border/50">
                                                    <div className="mt-2 bg-card border border-border rounded-2xl p-5 shadow-sm animate-in slide-in-from-top-4 duration-300">
                                                        
                                                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                                                            {/* Status Context */}
                                                            {status === 'Absent' && (
                                                                <div className="w-full sm:w-56 flex-shrink-0">
                                                                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-2 block tracking-wider">Absence Reason</label>
                                                                    <div className="relative">
                                                                        <select 
                                                                            value={student.attendance.absence_reason || ''}
                                                                            onChange={(e) => updateDetails(student.id, 'absence_reason', e.target.value)}
                                                                            className="w-full h-12 pl-4 pr-10 rounded-xl border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none cursor-pointer transition-all"
                                                                        >
                                                                            <option value="">Select Reason...</option>
                                                                            {ABSENCE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                                                        </select>
                                                                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            {/* Smart Text Area */}
                                                            <div className="flex-grow w-full relative group/note">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Remarks / Notes</label>
                                                                    <div className="flex items-center gap-2 text-[10px]">
                                                                         {typingStatus[student.id] === 'typing' && <span className="text-primary font-bold animate-pulse">Saving...</span>}
                                                                         {typingStatus[student.id] === 'saved' && <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircleIcon className="w-3 h-3"/> Saved</span>}
                                                                    </div>
                                                                </div>
                                                                <div className="relative">
                                                                    <textarea 
                                                                        value={student.attendance.notes || ''}
                                                                        onChange={(e) => updateDetails(student.id, 'notes', e.target.value)}
                                                                        className="w-full p-4 pr-12 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm min-h-[100px] resize-none leading-relaxed placeholder:text-muted-foreground/40"
                                                                        placeholder="Add a note regarding attendance, behavior, or participation..."
                                                                    />
                                                                    <button 
                                                                        onClick={() => handleVoiceInput(student.id)}
                                                                        className={`absolute right-3 top-3 p-2 rounded-lg transition-all ${recordingState === student.id ? 'bg-red-100 text-red-600 animate-pulse shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-primary'}`}
                                                                        title="Add Voice Note"
                                                                    >
                                                                        <MicIcon className="w-5 h-5" />
                                                                    </button>
                                                                </div>

                                                                {/* Quick Tags */}
                                                                <div className="flex flex-wrap gap-2 mt-3">
                                                                    {QUICK_TAGS.map(tag => (
                                                                        <button
                                                                            key={tag}
                                                                            onClick={() => addQuickRemark(student.id, tag)}
                                                                            className="px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary border border-transparent hover:border-primary/20 text-[10px] font-bold uppercase tracking-wide transition-all active:scale-95"
                                                                        >
                                                                            + {tag}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Floating Save Bar */}
            <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out ${Object.keys(localAttendance).length > 0 || saveSuccess ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-24 opacity-0 scale-90'}`}>
                <div className="bg-foreground text-background px-2 py-2 rounded-full shadow-2xl flex items-center gap-4 pl-6 border border-white/10 ring-1 ring-black/20 backdrop-blur-xl">
                    <div className="text-sm font-bold whitespace-nowrap">
                        {saveSuccess ? saveSuccess : `${Object.keys(localAttendance).length} Updates Pending`}
                    </div>
                    <div className="flex items-center gap-2">
                         {!saveSuccess && (
                            <button onClick={() => setLocalAttendance({})} className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full transition-colors">
                                Discard
                            </button>
                        )}
                        <button 
                            onClick={handleSave} 
                            disabled={loading.saving || !!saveSuccess}
                            className={`
                                px-6 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all transform active:scale-95 shadow-lg
                                ${saveSuccess ? 'bg-green-500 text-white cursor-default' : 'bg-background text-foreground hover:bg-muted'}
                            `}
                        >
                            {loading.saving ? <Spinner size="sm" className="text-current"/> : saveSuccess ? <><CheckCircleIcon className="w-4 h-4"/> Done</> : <><SaveIcon className="w-4 h-4"/> Save All</>}
                        </button>
                    </div>
                </div>
            </div>

             {/* Undo Toast */}
             <div className={`fixed bottom-32 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${showUndo ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
                <div className="bg-card border border-border px-6 py-3 rounded-xl shadow-xl flex items-center gap-4 text-sm font-medium ring-1 ring-black/5">
                    <span className="text-muted-foreground">Bulk action applied.</span>
                    <button onClick={handleUndo} className="text-primary hover:text-primary/80 font-bold flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                        <RotateCcwIcon className="w-3.5 h-3.5" /> Undo
                    </button>
                </div>
            </div>

            <ActivityLogPanel 
                isOpen={isActivityLogOpen} 
                onClose={() => setIsActivityLogOpen(false)} 
                logs={activityLogs}
                isApproved={isDayReviewed}
                onApprove={handleApproveReview}
            />
            
            <NotificationSettingsModal 
                isOpen={isNotifyModalOpen}
                onClose={() => setIsNotifyModalOpen(false)}
                settings={notificationSettings}
                onSave={setNotificationSettings}
            />
        </>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Attendance</h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Daily attendance tracking, history logs, and analytics.
                    </p>
                </div>
                
                {/* View Switcher */}
                <div className="flex bg-muted/40 p-1.5 rounded-xl border border-border/60">
                    <button 
                        onClick={() => setViewMode('marking')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${viewMode === 'marking' ? 'bg-card text-foreground shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}
                    >
                        Daily Marking
                    </button>
                    <button 
                        onClick={() => setViewMode('analytics')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${viewMode === 'analytics' ? 'bg-card text-foreground shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}
                    >
                        Analytics & Reports
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Attendance Rate" value={stats.attendanceRate} total={100} icon={<ChartBarIcon className="w-6 h-6 text-blue-600"/>} color="text-blue-600 bg-blue-50 dark:bg-blue-900/20" />
                <KPICard title="Present Today" value={stats.counts.Present} total={stats.total} icon={<CheckCircleIcon className="w-6 h-6 text-emerald-600"/>} color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" />
                <KPICard title="Absent Today" value={stats.counts.Absent} total={stats.total} icon={<XCircleIcon className="w-6 h-6 text-red-600"/>} color="text-red-600 bg-red-50 dark:bg-red-900/20" />
                <KPICard title="Late Arrivals" value={stats.counts.Late} total={stats.total} icon={<ClockIcon className="w-6 h-6 text-amber-600"/>} color="text-amber-600 bg-amber-50 dark:bg-amber-900/20" />
            </div>

            {viewMode === 'marking' ? renderMarkingInterface() : renderAnalyticsInterface()}
        </div>
    );
};

AttendanceTab.Icon = ChecklistIcon;

export default AttendanceTab;
