
import React, { useState, useEffect } from 'react';
import { SparklesIcon } from '../icons/SparklesIcon';
import { XIcon } from '../icons/XIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { FileTextIcon } from '../icons/FileTextIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import Spinner from '../common/Spinner';

interface AuditIssue {
    id: number;
    type: 'conflict' | 'workload' | 'compliance' | 'attendance';
    severity: 'critical' | 'warning' | 'info';
    teacher: string;
    message: string;
    action: string;
}

const MOCK_ISSUES: AuditIssue[] = [
    { id: 1, type: 'conflict', severity: 'critical', teacher: 'Sarah Jenkins', message: 'Double-booked on Mondays at 10:00 AM (Grade 10-A & Grade 9-B).', action: 'Resolve Schedule' },
    { id: 2, type: 'workload', severity: 'warning', teacher: 'Robert Fox', message: 'Teaching load is 36 periods/week. Recommended limit is 30.', action: 'View Timetable' },
    { id: 3, type: 'compliance', severity: 'critical', teacher: 'Emily Davis', message: 'Teaching Certification expired on Nov 30, 2025.', action: 'Request Renewal' },
    { id: 4, type: 'attendance', severity: 'warning', teacher: 'Michael Brown', message: 'Late arrival recorded 3 times this week.', action: 'Check Logs' },
    { id: 5, type: 'compliance', severity: 'info', teacher: 'Jessica Wilson', message: 'Background check renewal due in 30 days.', action: 'Notify' },
];

const TeacherAiAuditModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [analyzing, setAnalyzing] = useState(true);
    const [progress, setProgress] = useState(0);
    const [issues, setIssues] = useState<AuditIssue[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setAnalyzing(false);
                    setIssues(MOCK_ISSUES);
                    return 100;
                }
                return prev + 2;
            });
        }, 30);
        return () => clearInterval(interval);
    }, []);

    const resolveIssue = (id: number) => {
        setIssues(prev => prev.filter(i => i.id !== id));
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-white/10 flex flex-col overflow-hidden max-h-[85vh] ring-1 ring-black/5" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-6 border-b border-border bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: analyzing ? `${progress}%` : '100%', transition: 'width 0.1s linear' }}></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-2.5 bg-background/50 rounded-xl border border-white/20 shadow-sm">
                            <SparklesIcon className={`w-6 h-6 ${analyzing ? 'text-violet-500 animate-pulse' : 'text-violet-600'}`} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-foreground">AI Faculty Audit</h3>
                            <p className="text-xs text-muted-foreground font-medium">
                                {analyzing ? `Scanning rosters & schedules... ${progress}%` : 'Analysis Complete'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><XIcon className="w-5 h-5"/></button>
                </div>

                <div className="flex-grow overflow-y-auto p-0 bg-muted/5 custom-scrollbar">
                    {analyzing ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-6">
                            <Spinner size="lg" className="text-violet-500"/>
                            <div className="space-y-2 text-center">
                                <p className="text-sm font-bold text-foreground">Detecting Conflicts...</p>
                                <p className="text-xs text-muted-foreground">Checking cross-branch schedules and compliance docs.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-center">
                                    <p className="text-2xl font-black text-red-500">{issues.filter(i => i.severity === 'critical').length}</p>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Critical Alerts</p>
                                </div>
                                <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-center">
                                    <p className="text-2xl font-black text-amber-500">{issues.filter(i => i.severity === 'warning').length}</p>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Warnings</p>
                                </div>
                                <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-center">
                                    <p className="text-2xl font-black text-emerald-500">94%</p>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Health Score</p>
                                </div>
                            </div>

                            {/* Issues List */}
                            <div className="space-y-3">
                                {issues.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <CheckCircleIcon className="w-12 h-12 mx-auto text-emerald-500/50 mb-3"/>
                                        <p>All systems operational. No issues found.</p>
                                    </div>
                                ) : (
                                    issues.map(issue => (
                                        <div key={issue.id} className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow group">
                                            <div className={`p-2.5 rounded-lg flex-shrink-0 mt-1 ${
                                                issue.type === 'conflict' ? 'bg-red-100 text-red-600 dark:bg-red-900/20' : 
                                                issue.type === 'workload' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/20' : 
                                                issue.type === 'compliance' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20' : 
                                                'bg-purple-100 text-purple-600 dark:bg-purple-900/20'
                                            }`}>
                                                {issue.type === 'conflict' ? <AlertTriangleIcon className="w-5 h-5"/> : 
                                                 issue.type === 'workload' ? <ClockIcon className="w-5 h-5"/> : 
                                                 issue.type === 'compliance' ? <FileTextIcon className="w-5 h-5"/> : 
                                                 <CheckCircleIcon className="w-5 h-5"/>}
                                            </div>
                                            <div className="flex-grow">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-sm text-foreground">{issue.teacher}</h4>
                                                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                                                        issue.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        issue.severity === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                        'bg-blue-50 text-blue-700 border-blue-200'
                                                    }`}>{issue.type}</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{issue.message}</p>
                                            </div>
                                            <button 
                                                onClick={() => resolveIssue(issue.id)}
                                                className="self-center px-4 py-2 bg-muted hover:bg-foreground hover:text-background text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                                            >
                                                {issue.action}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherAiAuditModal;
