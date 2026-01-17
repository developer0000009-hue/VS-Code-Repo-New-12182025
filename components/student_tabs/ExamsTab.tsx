import React from 'react';
import { StudentDashboardData } from '../../types';
import { BarChartIcon } from '../icons/BarChartIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { ClockIcon } from '../icons/ClockIcon';

interface ExamsTabProps {
    data: StudentDashboardData;
}

const getGradeColor = (grade: string) => {
    if (['A', 'A+'].includes(grade)) return 'bg-green-500 shadow-green-500/30';
    if (['B', 'B+'].includes(grade)) return 'bg-blue-500 shadow-blue-500/30';
    if (['C', 'C+'].includes(grade)) return 'bg-yellow-500 shadow-yellow-500/30';
    return 'bg-red-500 shadow-red-500/30';
};

const UPCOMING_EXAMS = [
    { id: 1, subject: 'Mathematics', title: 'Mid-Term Assessment', date: '2025-05-10', time: '09:00 AM', duration: '2h 30m', location: 'Hall A' },
    { id: 2, subject: 'Physics', title: 'Practical Lab Exam', date: '2025-05-12', time: '11:00 AM', duration: '1h 30m', location: 'Science Lab' },
    { id: 3, subject: 'English', title: 'Literature Review', date: '2025-05-15', time: '10:00 AM', duration: '2h 00m', location: 'Room 304' },
];

const ExamsTab: React.FC<ExamsTabProps> = ({ data }) => {
    const recentGrades = data?.recentGrades ?? [];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Exams & Results</h2>
                    <p className="text-muted-foreground text-sm mt-1">Track your performance and prepare for upcoming tests.</p>
                </div>
            </div>

            {/* Upcoming Schedule */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center">
                    <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-primary" /> Upcoming Schedule
                    </h3>
                    <button className="text-xs font-bold text-primary hover:underline">Download Date Sheet</button>
                </div>
                <div className="divide-y divide-border">
                    {UPCOMING_EXAMS.map((exam) => (
                        <div key={exam.id} className="p-5 flex flex-col md:flex-row items-start md:items-center gap-6 hover:bg-muted/10 transition-colors">
                            <div className="flex-shrink-0 w-16 text-center bg-muted/50 rounded-lg p-2 border border-border">
                                <span className="block text-xs font-bold text-muted-foreground uppercase">{new Date(exam.date).toLocaleString('default', { month: 'short' })}</span>
                                <span className="block text-xl font-extrabold text-foreground">{new Date(exam.date).getDate()}</span>
                            </div>
                            <div className="flex-grow">
                                <h4 className="font-bold text-foreground text-base">{exam.subject}</h4>
                                <p className="text-sm text-muted-foreground">{exam.title}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm text-muted-foreground w-full md:w-auto">
                                <div className="flex items-center gap-2">
                                    <ClockIcon className="w-4 h-4 text-primary/70" />
                                    <span>{exam.time} ({exam.duration})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    <span>{exam.location}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Results */}
            <div>
                <h3 className="font-bold text-foreground text-lg mb-4 flex items-center gap-2">
                    <BarChartIcon className="w-5 h-5 text-primary" /> Academic Performance
                </h3>
                {recentGrades.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recentGrades.map((grade, index) => (
                            <div key={index} className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-1">{grade.subject}</p>
                                        <p className="font-bold text-foreground text-sm">{grade.exam_name}</p>
                                    </div>
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg ${getGradeColor(grade.grade)}`}>
                                        {grade.grade}
                                    </div>
                                </div>
                                
                                <div className="w-full bg-muted/50 rounded-full h-2 mb-4 overflow-hidden">
                                    <div className={`h-full rounded-full ${grade.grade.startsWith('A') ? 'bg-green-500' : grade.grade.startsWith('B') ? 'bg-blue-500' : 'bg-yellow-500'}`} style={{ width: `${(grade.marks_obtained / (grade.total_marks || 1)) * 100}%` }}></div>
                                </div>

                                <div className="flex justify-between items-end text-sm">
                                    <span className="text-muted-foreground font-medium">Score</span>
                                    <span className="font-mono font-bold text-foreground text-lg">
                                        {grade.marks_obtained}<span className="text-muted-foreground text-sm">/{grade.total_marks}</span>
                                    </span>
                                </div>
                                {grade.remarks && (
                                    <p className="text-xs italic text-muted-foreground mt-3 pt-3 border-t border-border/50">"{grade.remarks}"</p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-card border border-border rounded-xl">
                        <BarChartIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="font-semibold text-foreground">No grades recorded yet.</p>
                        <p className="text-sm text-muted-foreground mt-1">Your recent scores will appear here after exams.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExamsTab;