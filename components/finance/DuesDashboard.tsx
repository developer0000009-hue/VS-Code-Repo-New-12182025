
import React from 'react';
import { DuesDashboardData, StudentDuesInfo, ClassDuesInfo } from '../../types';
import { DollarSignIcon } from '../icons/DollarSignIcon';
import { AlarmClockIcon } from '../icons/AlarmClockIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { BellIcon } from '../icons/BellIcon';
import { FilterIcon } from '../icons/FilterIcon';

const DuesByClassChart: React.FC<{ data: ClassDuesInfo[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.total_dues), 1);
    return (
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm h-80 flex flex-col">
            <h4 className="font-bold text-foreground text-sm mb-4">Dues Breakdown by Class</h4>
            <div className="flex-grow flex items-end gap-4 px-2">
                {data.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        <div className="relative w-full h-full flex items-end">
                            <div 
                                className="w-full bg-primary/20 group-hover:bg-primary/40 rounded-t-lg transition-all duration-300"
                                style={{ height: `${(item.total_dues / maxValue) * 100}%` }}
                            >
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    ${item.total_dues.toLocaleString()}
                                </div>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-muted-foreground truncate">{item.class_name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DuesDashboard: React.FC<{ data: DuesDashboardData }> = ({ data }) => {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Pending Dues</h3>
                        <DollarSignIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-4xl font-black text-foreground">${data.total_dues.toLocaleString()}</p>
                </div>
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Overdue</h3>
                         <AlarmClockIcon className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="text-4xl font-black text-red-500">${data.total_overdue.toLocaleString()}</p>
                </div>
                 <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Overdue Students</h3>
                        <UsersIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-4xl font-black text-foreground">{data.overdue_student_count}</p>
                </div>
            </div>

            <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                     <FilterIcon className="w-4 h-4 text-muted-foreground"/>
                     <select className="input-base text-sm py-2"><option>All Classes</option></select>
                     <select className="input-base text-sm py-2"><option>All Statuses</option><option>Overdue</option><option>Pending</option></select>
                </div>
                 <div className="flex items-center gap-3">
                     <button onClick={() => alert('Automated reminder schedule is being configured.')} className="btn-secondary text-xs"><BellIcon className="w-4 h-4"/> Schedule Reminders</button>
                     <button onClick={() => alert(`Sending alerts to ${data.overdue_student_count} overdue accounts.`)} className="btn-primary text-xs bg-red-600 hover:bg-red-700"><BellIcon className="w-4 h-4"/> Send Overdue Alerts Now</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                     <DuesByClassChart data={data.dues_by_class} />
                </div>
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <h4 className="font-bold text-foreground text-sm mb-4">Students with Highest Dues</h4>
                    <div className="space-y-3">
                        {data.highest_dues_students.length > 0 ? data.highest_dues_students.map(student => (
                            <div key={student.student_id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/50">
                                <div>
                                    <p className="font-semibold text-sm text-foreground">{student.display_name}</p>
                                    <p className="text-xs text-muted-foreground">{student.class_name}</p>
                                </div>
                                <p className="font-bold text-sm text-foreground">${student.outstanding_balance.toLocaleString()}</p>
                            </div>
                        )) : <p className="text-sm text-muted-foreground text-center pt-8">No outstanding dues found.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DuesDashboard;
