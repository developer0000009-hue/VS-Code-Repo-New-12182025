
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { 
    FeeCollectionReportItem, 
    ExpenseReportItem, 
    StudentLedgerEntry,
    StudentFeeSummary
} from '../../types';
import Spinner from '../common/Spinner';
import { FileTextIcon } from '../icons/FileTextIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { UsersIcon } from '../icons/UsersIcon';

const REPORT_TYPES = [
    { id: 'fee_collection', label: 'Fee Collection Report', available: true },
    { id: 'expense_summary', label: 'Expense Summary', available: true },
    { id: 'student_ledger', label: 'Student Ledger', available: true },
    { id: 'revenue_vs_dues', label: 'Revenue vs Dues', available: false },
    { id: 'component_wise', label: 'Component-wise Report', available: false },
    { id: 'class_wise', label: 'Class-wise Report', available: false },
];

const FinanceReports: React.FC = () => {
    const [reportType, setReportType] = useState('fee_collection');
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        studentId: ''
    });
    
    const [students, setStudents] = useState<StudentFeeSummary[]>([]);
    const [reportData, setReportData] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch students for ledger dropdown
    useEffect(() => {
        const fetchStudents = async () => {
            const { data, error } = await supabase.rpc('get_student_fee_dashboard');
            if (data) setStudents(data);
        };
        fetchStudents();
    }, []);

    const handleGenerateReport = async () => {
        setLoading(true);
        setError(null);
        setReportData(null);
        
        try {
            let data, rpcError;
            switch (reportType) {
                case 'fee_collection':
                    ({ data, error: rpcError } = await supabase.rpc('get_fee_collection_report', { p_start_date: filters.startDate, p_end_date: filters.endDate }));
                    break;
                case 'expense_summary':
                     ({ data, error: rpcError } = await supabase.rpc('get_expense_summary_report', { p_start_date: filters.startDate, p_end_date: filters.endDate }));
                    break;
                case 'student_ledger':
                    if (!filters.studentId) throw new Error("Please select a student.");
                    ({ data, error: rpcError } = await supabase.rpc('get_student_ledger_report', { p_student_id: filters.studentId }));
                    break;
                default:
                    throw new Error("This report is not yet available.");
            }
            if (rpcError) throw rpcError;
            setReportData(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!reportData || reportData.length === 0) return;

        const headers = Object.keys(reportData[0]).join(',');
        const csv = reportData.map(row => 
            Object.values(row).map(value => 
                typeof value === 'string' && value.includes(',') ? `"${value}"` : value
            ).join(',')
        ).join('\n');

        const csvContent = `data:text/csv;charset=utf-8,${headers}\n${csv}`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const columns = useMemo(() => {
        if (!reportData || reportData.length === 0) return [];
        return Object.keys(reportData[0]).map(key => ({
            key,
            label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }));
    }, [reportData]);

    return (
        <div className="space-y-6">
             <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="input-label">Report Type</label>
                        <select value={reportType} onChange={e => setReportType(e.target.value)} className="input-base w-full">
                            {REPORT_TYPES.map(rt => <option key={rt.id} value={rt.id} disabled={!rt.available}>{rt.label}{!rt.available ? ' (Coming Soon)' : ''}</option>)}
                        </select>
                    </div>
                    {reportType !== 'student_ledger' ? (
                        <>
                            <div>
                                <label className="input-label">Start Date</label>
                                <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({...f, startDate: e.target.value}))} className="input-base w-full" />
                            </div>
                             <div>
                                <label className="input-label">End Date</label>
                                <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({...f, endDate: e.target.value}))} className="input-base w-full" />
                            </div>
                        </>
                    ) : (
                        <div className="md:col-span-2">
                             <label className="input-label">Select Student</label>
                             <select value={filters.studentId} onChange={e => setFilters(f => ({...f, studentId: e.target.value}))} className="input-base w-full">
                                <option value="">-- Select a Student --</option>
                                {students.map(s => <option key={s.student_id} value={s.student_id}>{s.display_name} ({s.class_name})</option>)}
                            </select>
                        </div>
                    )}
                </div>
                <div className="flex justify-end">
                    <button onClick={handleGenerateReport} disabled={loading} className="btn-primary flex items-center gap-2 min-w-[150px] justify-center">
                        {loading ? <Spinner size="sm" /> : <>Generate Report</>}
                    </button>
                </div>
            </div>

            {error && <div className="bg-destructive/10 text-destructive p-4 rounded-lg">{error}</div>}
            
            {loading ? (
                <div className="flex justify-center p-12"><Spinner size="lg" /></div>
            ) : reportData && (
                <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-center mb-4 px-2">
                         <div>
                            <h3 className="font-bold text-foreground text-lg">{REPORT_TYPES.find(r => r.id === reportType)?.label}</h3>
                            <p className="text-sm text-muted-foreground">
                                {reportType !== 'student_ledger' ? `For period: ${filters.startDate} to ${filters.endDate}` : `For: ${students.find(s => s.student_id === filters.studentId)?.display_name}`}
                            </p>
                        </div>
                        <button onClick={handleExport} className="btn-secondary text-xs"><DownloadIcon className="w-4 h-4"/> Export to CSV</button>
                    </div>
                    
                    {reportData.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">No data available for the selected criteria.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                                    <tr>{columns.map(c => <th key={c.key} className="p-3">{c.label}</th>)}</tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {reportData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-muted/30">
                                            {columns.map(col => (
                                                <td key={col.key} className="p-3 whitespace-nowrap">
                                                    {['payment_date', 'expense_date', 'transaction_date'].includes(col.key)
                                                        ? new Date(row[col.key]).toLocaleString()
                                                        : (['amount', 'debit', 'credit', 'balance'].includes(col.key)
                                                            ? `$${Number(row[col.key]).toFixed(2)}`
                                                            : row[col.key])
                                                    }
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FinanceReports;
