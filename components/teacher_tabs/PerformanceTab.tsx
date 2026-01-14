
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { TeacherClassOverview, StudentRosterItem, ClassPerformanceSummary, StudentPerformanceReport, FunctionComponentWithIcon } from '../../types';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';


interface PerformanceTabProps {
    currentUserId: string;
}

export const PerformanceTab: FunctionComponentWithIcon<PerformanceTabProps> = ({ currentUserId }) => {
    const [classes, setClasses] = useState<TeacherClassOverview[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [roster, setRoster] = useState<StudentRosterItem[]>([]);
    const [summary, setSummary] = useState<ClassPerformanceSummary | null>(null);
    const [loading, setLoading] = useState({ classes: true, details: false });
    const [error, setError] = useState<string | null>(null);
    
    const [viewingStudent, setViewingStudent] = useState<StudentRosterItem | null>(null);

    const fetchClasses = useCallback(async () => {
        setLoading({ classes: true, details: false });
        const { data, error } = await supabase.rpc('get_teacher_class_overviews');
        if (error) setError(error.message);
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

    const fetchClassDetails = useCallback(async () => {
        if (!selectedClassId) return;
        setLoading(prev => ({ ...prev, details: true }));
        setError(null);
        setRoster([]);
        setSummary(null);

        const classIdNum = parseInt(selectedClassId);

        const [rosterRes, summaryRes] = await Promise.all([
            supabase.rpc('get_class_roster_for_admin', { p_class_id: classIdNum }),
            supabase.rpc('get_teacher_class_performance_summary', { p_class_id: classIdNum })
        ]);

        if (rosterRes.error) setError(rosterRes.error.message);
        else setRoster(rosterRes.data || []);

        if (summaryRes.error) setError(summaryRes.error.message);
        else setSummary(summaryRes.data ? summaryRes.data[0] : null);

        setLoading(prev => ({ ...prev, details: false }));
    }, [selectedClassId]);

    useEffect(() => {
        fetchClassDetails();
    }, [fetchClassDetails]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <h2 className="text-xl font-bold">Class Performance</h2>
                {loading.classes ? <Spinner/> : (
                    <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="input-base w-full sm:w-64 mt-2 sm:mt-0">
                        {classes.length === 0 && <option>No classes assigned</option>}
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                )}
            </div>

            {error && <p className="text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>}
            
            {loading.details ? <div className="flex justify-center p-8"><Spinner size="lg"/></div> :
            !selectedClassId ? <p className="text-center text-muted-foreground py-8">Select a class to view performance data.</p> :
            (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-card p-4 rounded-lg border border-border">
                            <p className="text-sm font-medium text-muted-foreground">Class Average Grade</p>
                            <p className="text-3xl font-bold text-primary">{summary ? `${summary.average_grade.toFixed(1)}%` : 'N/A'}</p>
                        </div>
                        <div className="bg-card p-4 rounded-lg border border-border">
                            <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                            <p className="text-3xl font-bold text-primary">{summary ? `${summary.attendance_rate.toFixed(1)}%` : 'N/A'}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Student Roster ({roster.length})</h3>
                        <div className="bg-card p-4 rounded-lg border border-border space-y-2">
                            {roster.map(student => (
                                <button key={student.id} onClick={() => setViewingStudent(student)} className="w-full text-left p-2 rounded-md hover:bg-muted/50 flex justify-between items-center">
                                    <span className="font-medium text-foreground">{student.display_name}</span>
                                    <span className="text-xs text-primary font-semibold">View Report &rarr;</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {viewingStudent && selectedClassId && (
                <StudentReportModal 
                    student={viewingStudent} 
                    classId={parseInt(selectedClassId)}
                    onClose={() => setViewingStudent(null)}
                    currentUserId={currentUserId}
                />
            )}
            <style>{`.input-base { width: 100%; background-color: hsl(var(--background)); border: 1px solid hsl(var(--input)); border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; }`}</style>
        </div>
    );
};

const StudentReportModal: React.FC<{student: StudentRosterItem, classId: number, onClose:()=>void, currentUserId: string}> = ({student, classId, onClose, currentUserId}) => {
    const [report, setReport] = useState<StudentPerformanceReport | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            const { data, error } = await supabase.rpc('get_teacher_student_performance_report', { p_student_id: student.id, p_class_id: classId });
            if (!error) setReport(data);
            setLoading(false);
        };
        fetchReport();
    }, [student.id, classId, currentUserId]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-card w-full max-w-2xl max-h-[90vh] rounded-xl shadow-lg border border-border flex flex-col" onClick={e=>e.stopPropagation()}>
                <header className="p-4 border-b border-border flex justify-between items-center">
                    <h3 className="font-bold text-lg">Report for {student.display_name}</h3>
                    <button onClick={onClose}><XIcon className="w-5 h-5 text-muted-foreground"/></button>
                </header>
                <main className="p-6 overflow-y-auto">
                    {loading ? <div className="flex justify-center p-8"><Spinner/></div> : !report ? <p>Could not load report.</p> : (
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-semibold mb-2">Attendance Summary</h4>
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div className="bg-green-500/10 p-3 rounded-md"><p className="text-2xl font-bold text-green-600">{report.attendance_summary.present}</p><p className="text-xs font-medium text-green-700">Present</p></div>
                                    <div className="bg-red-500/10 p-3 rounded-md"><p className="text-2xl font-bold text-red-600">{report.attendance_summary.absent}</p><p className="text-xs font-medium text-red-700">Absent</p></div>
                                    <div className="bg-amber-500/10 p-3 rounded-md"><p className="text-2xl font-bold text-amber-600">{report.attendance_summary.late}</p><p className="text-xs font-medium text-amber-700">Late</p></div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Assignments Performance</h4>
                                {report.assignments.length === 0 ? <p className="text-muted-foreground text-sm">No assignments recorded.</p> : (
                                    <div className="space-y-3">
                                        {report.assignments.map((assignment, idx) => (
                                            <div key={idx} className="p-3 bg-muted/50 rounded-md border border-border flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-foreground text-sm">{assignment.title}</p>
                                                    <p className="text-xs text-muted-foreground">Due: {new Date(assignment.due_date).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {assignment.grade && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">{assignment.grade}</span>}
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${assignment.status === 'Graded' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{assignment.status}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
                <footer className="p-4 border-t border-border flex justify-end">
                    <button onClick={onClose} className="btn-secondary">Close</button>
                </footer>
            </div>
        </div>
    );
};

PerformanceTab.Icon = ChartBarIcon;
