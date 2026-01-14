import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { SchoolClass, StudentRosterItem, AttendanceRecord, AttendanceStatus, FunctionComponentWithIcon } from '../../types';
import Spinner from '../common/Spinner';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { ChecklistIcon } from '../icons/ChecklistIcon';


type CombinedAttendanceRecord = StudentRosterItem & { 
    status: AttendanceStatus | null;
    notes: string | null;
};

const AttendanceTab: FunctionComponentWithIcon<{}> = () => {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [roster, setRoster] = useState<StudentRosterItem[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [updatedAttendance, setUpdatedAttendance] = useState<Record<string, Partial<{ status: AttendanceStatus; notes: string }>>>({});
    
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    
    const [loading, setLoading] = useState({ classes: true, roster: false });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchClasses = useCallback(async () => {
        setLoading(prev => ({ ...prev, classes: true }));
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

    useEffect(() => {
        const fetchRosterAndAttendance = async () => {
            if (!selectedClassId) return;

            setLoading(prev => ({ ...prev, roster: true }));
            setError(null);
            setRoster([]);
            setAttendance([]);
            setUpdatedAttendance({});
            
            const [rosterRes, attendanceRes] = await Promise.all([
                supabase.rpc('get_class_roster', { p_class_id: parseInt(selectedClassId) }),
                supabase.rpc('get_attendance', { p_class_id: parseInt(selectedClassId), p_attendance_date: selectedDate })
            ]);

            if (rosterRes.error) setError(`Failed to fetch roster: ${rosterRes.error.message}`);
            else setRoster(rosterRes.data || []);
            
            if (attendanceRes.error) setError(`Failed to fetch attendance: ${attendanceRes.error.message}`);
            else setAttendance(attendanceRes.data || []);

            setLoading(prev => ({ ...prev, roster: false }));
        };

        fetchRosterAndAttendance();
    }, [selectedClassId, selectedDate]);
    
    const combinedData = useMemo<CombinedAttendanceRecord[]>(() => {
        return roster.map(student => {
            const originalRecord = attendance.find(a => a.student_id === student.id);
            const changedRecord = updatedAttendance[student.id] || {};
            
            const currentStatus = (changedRecord.status ?? originalRecord?.status ?? 'Present') as AttendanceStatus;
            const currentNotes = (changedRecord.notes !== undefined) ? changedRecord.notes : originalRecord?.notes ?? null;
            
            return { 
                ...student, 
                status: currentStatus,
                notes: currentNotes,
            };
        });
    }, [roster, attendance, updatedAttendance]);

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setUpdatedAttendance(prev => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
    };
    
    const handleNotesChange = (studentId: string, notes: string) => {
        setUpdatedAttendance(prev => ({ ...prev, [studentId]: { ...prev[studentId], notes } }));
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        const recordsToUpsert = Object.entries(updatedAttendance).map(([student_id, rawChanges]) => {
            const changes = rawChanges as Partial<{ status: AttendanceStatus; notes: string }>;
            const originalRecord = attendance.find(a => a.student_id === student_id);
            const originalStatus = originalRecord?.status ?? 'Present';
            const originalNotes = originalRecord?.notes ?? '';

            return {
                class_id: parseInt(selectedClassId),
                student_id,
                attendance_date: selectedDate,
                status: changes.status ?? originalStatus,
                notes: 'notes' in changes ? changes.notes : originalNotes,
            };
        });

        if (recordsToUpsert.length === 0) {
            setIsSaving(false);
            return;
        }

        const { error } = await supabase.rpc('upsert_attendance', { records: recordsToUpsert });
        if (error) {
            alert(`Failed to save changes: ${error.message}`);
        } else {
            setUpdatedAttendance({});
            const { data } = await supabase.rpc('get_attendance', { p_class_id: parseInt(selectedClassId), p_attendance_date: selectedDate });
            if (data) setAttendance(data);
        }
        setIsSaving(false);
    };

    const hasChanges = Object.keys(updatedAttendance).length > 0;

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Mark Attendance</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-muted/30 rounded-lg border border-border">
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Select Class</label>
                    {loading.classes ? <Spinner/> : 
                        <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full input-base">
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    }
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Select Date</label>
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full input-base" />
                </div>
                 <div className="flex justify-end items-end">
                    <button onClick={handleSaveChanges} disabled={!hasChanges || isSaving} className="w-full md:w-auto bg-primary text-primary-foreground font-bold py-2 px-6 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSaving ? <Spinner size="sm"/> : 'Save Changes'}
                    </button>
                </div>
            </div>

            {loading.roster ? <div className="flex justify-center p-8"><Spinner size="lg" /></div> :
             error ? <p className="text-center text-red-400 py-8">{error}</p> :
             roster.length === 0 && selectedClassId ? <p className="text-center text-muted-foreground py-8">No students in this class.</p> :
            (
                <div className="overflow-x-auto bg-card rounded-lg border border-border">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase w-4/12">Student Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase w-3/12">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase w-5/12">Notes (Optional)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {combinedData.map(student => (
                                <tr key={student.id} className="hover:bg-muted/30">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{student.display_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select value={student.status || 'Present'} onChange={(e) => handleStatusChange(student.id, e.target.value as AttendanceStatus)} className="input-base text-sm !py-1">
                                            <option value="Present">Present</option>
                                            <option value="Absent">Absent</option>
                                            <option value="Late">Late</option>
                                        </select>
                                    </td>
                                     <td className="px-6 py-4 whitespace-nowrap">
                                        <input 
                                            type="text" 
                                            value={student.notes || ''} 
                                            onChange={(e) => handleNotesChange(student.id, e.target.value)}
                                            placeholder="e.g. Left early for appointment"
                                            className="input-base text-sm !py-1 w-full"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <style>{`.input-base { appearance: none; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid hsl(var(--input)); border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); background-color: hsl(var(--background)); color: hsl(var(--foreground)); } .input-base:focus { outline: none; box-shadow: 0 0 0 1px hsl(var(--ring)); border-color: hsl(var(--primary)); }`}</style>
        </div>
    );
};

AttendanceTab.Icon = ChecklistIcon;
export default AttendanceTab;