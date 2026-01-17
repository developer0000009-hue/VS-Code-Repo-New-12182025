import React from 'react';
import { StudentDashboardData, Day } from '../../types';
import { ClockIcon } from '../icons/ClockIcon';
import { ChecklistIcon } from '../icons/ChecklistIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { VideoIcon } from '../icons/VideoIcon';

interface DashboardTabProps {
    data: StudentDashboardData;
}

const GreetingHeader: React.FC<{ name: string }> = ({ name }) => {
    const hour = new Date().getHours();
    let greeting = 'Welcome back';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 18) greeting = 'Good afternoon';
    else greeting = 'Good evening';

    return (
        <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground tracking-tight">
                {greeting}, {(name || '').split(' ')[0]}!
            </h1>
            <p className="mt-2 text-muted-foreground text-lg">
                Ready to learn? Here’s your summary for today.
            </p>
        </div>
    );
};

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-start gap-4 transition-transform hover:-translate-y-1 duration-300">
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${color} text-white shadow-md`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-semibold text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        </div>
    </div>
);


const UpcomingAssignments: React.FC<{ data: StudentDashboardData }> = ({ data }) => {
    const assignments = data?.assignments || [];
    return (
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-foreground text-lg">Assignments Due</h3>
                <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-md">{assignments.length} Pending</span>
            </div>
            {assignments.length > 0 ? (
                <ul className="space-y-4">
                    {assignments.slice(0, 3).map(assignment => (
                        <li key={assignment.id} className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-xl bg-muted/50 border border-border text-foreground flex flex-col items-center justify-center flex-shrink-0 group-hover:border-primary/50 transition-colors">
                                 <span className="text-[10px] font-bold uppercase text-muted-foreground">{new Date(assignment.due_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                 <span className="text-lg font-extrabold -mt-1">{new Date(assignment.due_date).getDate()}</span>
                            </div>
                            <div className="flex-grow min-w-0">
                                <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">{assignment.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{assignment.subject}</p>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${new Date(assignment.due_date) < new Date() ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-12">
                    <ChecklistIcon className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">You're all caught up!</p>
                </div>
            )}
        </div>
    );
};

const TodaysSchedule: React.FC<{ data: StudentDashboardData }> = ({ data }) => {
    const DAYS_ARRAY: Day[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = DAYS_ARRAY[new Date().getDay()];

    const timetable = data?.timetable || [];
    const todaysClasses = timetable
        .filter(t => t.day === todayName)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const currentHour = new Date().getHours();
    const isLive = (start: string) => parseInt(start.split(':')[0]) === currentHour;

    return (
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-foreground text-lg">Today's Schedule</h3>
                <span className="text-xs text-muted-foreground font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
            
            {todaysClasses.length > 0 ? (
                <div className="space-y-4 relative before:absolute before:left-[4.5rem] before:top-2 before:bottom-2 before:w-px before:bg-border/50">
                    {todaysClasses.map((cls, idx) => {
                        const live = isLive(cls.startTime);
                        return (
                         <div key={`${cls.startTime}-${idx}`} className="relative flex items-center gap-6 group">
                            <div className="text-right flex-shrink-0 w-12">
                                <p className="text-xs font-bold text-foreground">{cls.startTime.slice(0, 5)}</p>
                                <p className="text-[10px] text-muted-foreground">{cls.endTime.slice(0, 5)}</p>
                            </div>
                            
                            <div className={`absolute left-[4.2rem] w-3 h-3 rounded-full border-2 border-card z-10 ${live ? 'bg-red-500 ring-4 ring-red-500/20' : 'bg-muted-foreground/30'}`}></div>
                            
                            <div className={`flex-grow p-4 rounded-xl border transition-all duration-300 ${live ? 'bg-gradient-to-r from-red-500/5 to-transparent border-red-500/30 shadow-sm' : 'bg-muted/30 border-transparent hover:bg-muted/50 hover:border-border'}`}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className={`font-bold text-sm ${live ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>{cls.subject}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{cls.teacher}</p>
                                    </div>
                                    {live && (
                                        <button className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-lg shadow-red-600/20 flex items-center gap-1.5 transition-all animate-pulse">
                                            <VideoIcon className="w-3 h-3" /> Join
                                        </button>
                                    )}
                                </div>
                            </div>
                         </div>
                    )})}
                </div>
            ) : (
                 <div className="text-center py-12">
                    <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">No classes scheduled for today.</p>
                </div>
            )}
        </div>
    );
}

const DashboardTab: React.FC<DashboardTabProps> = ({ data }) => {
    const summary = data?.attendanceSummary;
    const assignments = data?.assignments || [];
    const attendancePercent = summary && summary.total_days > 0
        ? Math.round((summary.present_days / summary.total_days) * 100)
        : 100;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GreetingHeader name={data?.profile?.display_name || 'Student'} />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <StatCard 
                    title="Attendance Rate"
                    value={`${attendancePercent}%`}
                    icon={<ChecklistIcon className="w-6 h-6" />}
                    color="bg-emerald-500"
                 />
                 <StatCard 
                    title="Assignments Due"
                    value={assignments.length}
                    icon={<ClockIcon className="w-6 h-6" />}
                    color="bg-amber-50"
                 />
                 <StatCard 
                    title="School Events"
                    value={3}
                    icon={<CalendarIcon className="w-6 h-6" />}
                    color="bg-blue-500"
                 />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
                <div className="lg:col-span-3">
                     <TodaysSchedule data={data} />
                </div>
                <div className="lg:col-span-2">
                    <UpcomingAssignments data={data} />
                </div>
            </div>
        </div>
    );
};

export default DashboardTab;