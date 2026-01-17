
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { StudentDashboardData, StudentAttendanceRecord } from '../../types';
import Spinner from '../common/Spinner';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { ClockIcon } from '../icons/ClockIcon';

interface AttendanceTabProps {
    data: StudentDashboardData;
    studentId: string | null;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
    <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
        <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-semibold text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
    </div>
);

const AttendanceTab: React.FC<AttendanceTabProps> = ({ data, studentId }) => {
    const [detailedRecords, setDetailedRecords] = useState<StudentAttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDetailedRecords = useCallback(async () => {
        if (!studentId) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.rpc('get_student_attendance_records', { p_student_id: studentId });
            if (error) throw error;
            setDetailedRecords(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [studentId]);

    useEffect(() => {
        fetchDetailedRecords();
    }, [fetchDetailedRecords]);

    const { total_days, present_days, absent_days, late_days } = data.attendanceSummary;
    const attendancePercent = total_days > 0 ? Math.round((present_days / total_days) * 100) : 100;

    const statusDisplay = {
        Present: { icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />, text: 'text-green-500' },
        Absent: { icon: <XCircleIcon className="w-5 h-5 text-red-500" />, text: 'text-red-500' },
        Late: { icon: <ClockIcon className="w-5 h-5 text-amber-500" />, text: 'text-amber-500' },
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h2 className="text-2xl font-bold text-foreground">Attendance Record</h2>
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 shadow-sm">
                    Request Approved Leave
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Overall" value={`${attendancePercent}%`} icon={<CheckCircleIcon className="w-6 h-6 text-white" />} color="bg-green-500" />
                <StatCard title="Total Days Present" value={present_days} icon={<CheckCircleIcon className="w-6 h-6 text-white" />} color="bg-blue-500" />
                <StatCard title="Days Absent" value={absent_days} icon={<XCircleIcon className="w-6 h-6 text-white" />} color="bg-red-500" />
                <StatCard title="Late Arrivals" value={late_days} icon={<ClockIcon className="w-6 h-6 text-white" />} color="bg-amber-500" />
            </div>

            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                <h3 className="font-bold text-foreground text-lg mb-4">Detailed Log</h3>
                {loading ? <div className="flex justify-center p-8"><Spinner /></div> : 
                 error ? <p className="text-center text-red-500">{error}</p> :
                 detailedRecords.length === 0 ? <p className="text-center text-muted-foreground py-8">No attendance records found.</p> : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="text-left text-sm text-muted-foreground">
                                <tr>
                                    <th className="p-3 font-semibold">Date</th>
                                    <th className="p-3 font-semibold">Status</th>
                                    <th className="p-3 font-semibold">Notes / Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detailedRecords.map(record => (
                                    <tr key={record.date} className="border-t border-border">
                                        <td className="p-3 font-medium text-foreground">{new Date(record.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                        <td className="p-3">
                                            <span className={`flex items-center gap-2 font-semibold ${statusDisplay[record.status]?.text || ''}`}>
                                                {statusDisplay[record.status]?.icon} {record.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-muted-foreground italic">{record.notes || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default AttendanceTab;
