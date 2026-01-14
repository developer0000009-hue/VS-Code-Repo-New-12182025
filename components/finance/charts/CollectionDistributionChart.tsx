
import React from 'react';

interface DistributionProps {
    paid: number;
    pending: number;
    overdue: number;
}

const CollectionDistributionChart: React.FC<DistributionProps> = ({ paid, pending, overdue }) => {
    const total = paid + pending + overdue || 1;
    
    // Calculate segments
    // We'll use a simple donut chart using SVG stroke-dasharray
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    
    const paidOffset = 0;
    const pendingOffset = (paid / total) * circumference;
    const overdueOffset = ((paid + pending) / total) * circumference;

    const paidStroke = (paid / total) * circumference;
    const pendingStroke = (pending / total) * circumference;
    const overdueStroke = (overdue / total) * circumference;

    return (
        <div className="flex items-center justify-between h-full w-full">
            <div className="relative w-40 h-40 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {/* Background */}
                    <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeOpacity="0.05" strokeWidth="12" />
                    
                    {/* Paid Segment */}
                    {paid > 0 && <circle cx="50" cy="50" r={radius} fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray={`${paidStroke} ${circumference}`} strokeDashoffset={0} strokeLinecap="round" className="transition-all duration-1000 ease-out" />}
                    
                    {/* Pending Segment */}
                    {pending > 0 && <circle cx="50" cy="50" r={radius} fill="none" stroke="#f59e0b" strokeWidth="12" strokeDasharray={`${pendingStroke} ${circumference}`} strokeDashoffset={-paidOffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />}
                    
                    {/* Overdue Segment */}
                    {overdue > 0 && <circle cx="50" cy="50" r={radius} fill="none" stroke="#ef4444" strokeWidth="12" strokeDasharray={`${overdueStroke} ${circumference}`} strokeDashoffset={-overdueOffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-foreground">{Math.round((paid/total)*100)}%</span>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Collected</span>
                </div>
            </div>

            <div className="flex flex-col gap-4 flex-grow pl-6">
                <div>
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Collected</span>
                        <span className="text-sm font-bold text-emerald-600">{Math.round((paid/total)*100)}%</span>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(paid/total)*100}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Pending</span>
                        <span className="text-sm font-bold text-amber-500">{Math.round((pending/total)*100)}%</span>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(pending/total)*100}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Overdue</span>
                        <span className="text-sm font-bold text-red-500">{Math.round((overdue/total)*100)}%</span>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${(overdue/total)*100}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CollectionDistributionChart;
