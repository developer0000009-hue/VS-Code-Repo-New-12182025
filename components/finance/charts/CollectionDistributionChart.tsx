
import React from 'react';

interface DistributionProps {
    paid: number;
    pending: number;
    overdue: number;
}

const CollectionDistributionChart: React.FC<DistributionProps> = ({ paid, pending, overdue }) => {
    const total = paid + pending + overdue || 1;
    
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    
    const paidStroke = (paid / total) * circumference;
    const pendingStroke = (pending / total) * circumference;
    const overdueStroke = (overdue / total) * circumference;

    return (
        <div className="flex flex-col items-center justify-between h-full w-full">
            <div className="relative w-48 h-48 group">
                <div className="absolute inset-0 bg-primary/5 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 relative z-10">
                    {/* Background Ring */}
                    <circle cx="50" cy="50" r={radius} fill="none" stroke="white" strokeOpacity="0.03" strokeWidth="10" />
                    
                    {/* Overdue (Red) - Bottom layer */}
                    <circle cx="50" cy="50" r={radius} fill="none" stroke="#ef4444" strokeWidth="10" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={0} strokeLinecap="round" opacity="0.2" />
                    
                    {/* Pending (Amber) */}
                    <circle cx="50" cy="50" r={radius} fill="none" stroke="#f59e0b" strokeWidth="10" strokeDasharray={`${pendingStroke + overdueStroke} ${circumference}`} strokeDashoffset={-paidStroke} strokeLinecap="round" className="transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]" />
                    
                    {/* Paid (Emerald) - Top layer */}
                    <circle cx="50" cy="50" r={radius} fill="none" stroke="#10b981" strokeWidth="10" strokeDasharray={`${paidStroke} ${circumference}`} strokeDashoffset={0} strokeLinecap="round" className="transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center relative z-20">
                    <span className="text-4xl font-black text-white tracking-tighter leading-none">{Math.round((paid/total)*100)}%</span>
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mt-2">Collected</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 w-full mt-10">
                {[
                    { label: 'Synchronized', value: paid, color: 'bg-emerald-500', text: 'text-emerald-500' },
                    { label: 'Pending', value: pending, color: 'bg-amber-500', text: 'text-amber-500' },
                    { label: 'Risk/Overdue', value: overdue, color: 'bg-red-500', text: 'text-red-500' }
                ].map((item, i) => {
                    const percent = Math.round((item.value / total) * 100);
                    return (
                        <div key={i} className="flex items-center justify-between group/row">
                            <div className="flex items-center gap-4">
                                <div className={`w-1.5 h-1.5 rounded-full ${item.color} shadow-lg shadow-black/50`}></div>
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] group-hover/row:text-white/60 transition-colors">{item.label}</span>
                            </div>
                            <span className={`text-[12px] font-mono font-black ${item.text}`}>{percent}%</span>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default CollectionDistributionChart;
