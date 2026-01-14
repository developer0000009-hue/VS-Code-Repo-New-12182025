
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { TransportDashboardData, BusStudent, BusAttendanceRecord, BusTripType, BusAttendanceStatus } from '../../types';
import Spinner from '../common/Spinner';

const MyRouteTab: React.FC = () => {
    const [dashboardData, setDashboardData] = useState<TransportDashboardData | null>(null);
    const [attendance, setAttendance] = useState<BusAttendanceRecord[]>([]);
    const [updatedAttendance, setUpdatedAttendance] = useState<Record<string, BusAttendanceStatus>>({});
    
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTrip, setSelectedTrip] = useState<BusTripType>('Morning Pickup');
    
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase.rpc('get_transport_dashboard_data');
        if (error) {
            setError(error.message);
        } else if (data.error) {
            setError(data.error);
        } else {
            setDashboardData(data);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const fetchAttendance = useCallback(async () => {
        if (!dashboardData?.route.id) return;

        setUpdatedAttendance({}); // Clear changes when date/trip changes
        const { data, error } = await supabase.rpc('get_bus_attendance_for_route', {
            p_route_id: dashboardData.route.id,
            p_trip_date: selectedDate,
            p_trip_type: selectedTrip
        });

        if (error) {
            setError(`Failed to fetch attendance: ${error.message}`);
        } else {
            setAttendance(data || []);
        }
    }, [dashboardData, selectedDate, selectedTrip]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    const combinedStudentData = useMemo(() => {
        if (!dashboardData) return [];
        return dashboardData.students.map(student => {
            const updatedStatus = updatedAttendance[student.id];
            const originalRecord = attendance.find(a => a.student_id === student.id);
            const currentStatus = updatedStatus || originalRecord?.status;
            return { ...student, status: currentStatus };
        });
    }, [dashboardData, attendance, updatedAttendance]);

    const handleStatusChange = (studentId: string, status: BusAttendanceStatus) => {
        setUpdatedAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSaveChanges = async () => {
        if (!dashboardData?.route.id || Object.keys(updatedAttendance).length === 0) return;

        setIsSaving(true);
        const recordsToUpsert = Object.entries(updatedAttendance).map(([student_id, status]) => ({
            student_id,
            status,
            route_id: dashboardData.route.id,
            trip_date: selectedDate,
            trip_type: selectedTrip
        }));

        const { error: rpcError } = await supabase.rpc('upsert_bus_attendance', { records: recordsToUpsert });
        setIsSaving(false);

        if (rpcError) {
            alert(`Failed to save: ${rpcError.message}`);
        } else {
            fetchAttendance(); // Refresh data
        }
    };
    
    if (loading) {
        return <div className="flex justify-center p-8"><Spinner size="lg" /></div>;
    }

    if (error) {
        return <div className="p-4 text-center bg-destructive/10 text-destructive rounded-lg border border-destructive/20">{error}</div>;
    }
    
    if (!dashboardData?.route.id) {
        return <div className="p-4 text-center bg-muted/50 text-muted-foreground rounded-lg border border-border">You are not assigned to a route. Please contact an administrator.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="text-xl font-bold">{dashboardData.route.name}</h3>
                <p className="text-muted-foreground">{dashboardData.route.description}</p>
            </div>

            <div className="bg-card p-4 rounded-lg border border-border flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="input-base" />
                    <select value={selectedTrip} onChange={e => setSelectedTrip(e.target.value as BusTripType)} className="input-base">
                        <option value="Morning Pickup">Morning Pickup</option>
                        <option value="Afternoon Drop-off">Afternoon Drop-off</option>
                    </select>
                </div>
                 <button onClick={handleSaveChanges} disabled={isSaving || Object.keys(updatedAttendance).length === 0} className="w-full sm:w-auto btn-primary">
                    {isSaving ? <Spinner size="sm" /> : 'Save Attendance'}
                </button>
            </div>

            <div className="space-y-3">
                {combinedStudentData.map(student => (
                    <div key={student.id} className="bg-card p-4 rounded-lg border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <p className="font-semibold text-foreground">{student.display_name} <span className="text-sm text-muted-foreground font-normal">(Grade {student.grade})</span></p>
                            <p className="text-xs text-muted-foreground">{student.parent_guardian_details}</p>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <button 
                                onClick={() => handleStatusChange(student.id, 'Boarded')}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${student.status === 'Boarded' ? 'bg-green-600 text-white' : 'bg-muted hover:bg-muted/80'}`}
                            >
                                Boarded
                            </button>
                            <button 
                                onClick={() => handleStatusChange(student.id, 'Absent')}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${student.status === 'Absent' ? 'bg-red-600 text-white' : 'bg-muted hover:bg-muted/80'}`}
                            >
                                Absent
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <style>{`
                .input-base { width: auto; background-color: hsl(var(--background)); border: 1px solid hsl(var(--input)); border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; }
                .btn-primary { padding: 0.5rem 1rem; background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; display: flex; justify-content: center; } .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
            `}</style>
        </div>
    );
};

export default MyRouteTab;
