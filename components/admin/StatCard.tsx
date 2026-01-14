import React, { useEffect, useState } from 'react';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend: string;
    colorClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, colorClass = "bg-primary text-primary-foreground" }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const numericValue = parseFloat(value.replace(/[^0-9.-]+/g,""));
        if (isNaN(numericValue)) return;

        let start = 0;
        const duration = 2000; // Slower, more premium feel
        const startTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Premium exponential easing
            const easedProgress = 1 - Math.pow(1 - progress, 4); 
            
            setDisplayValue(easedProgress * numericValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setDisplayValue(numericValue);
            }
        };

        requestAnimationFrame(animate);
    }, [value]);

    const isNumeric = !isNaN(parseFloat(value.replace(/[^0-9.-]+/g,"")));
    let formattedValue = value;
    if (isNumeric) {
        const prefix = value.startsWith('$') ? '$' : '';
        const suffix = value.endsWith('%') ? '%' : '';
        formattedValue = `${prefix}${Math.round(displayValue).toLocaleString()}${suffix}`;
    }
    
    const isPositive = trend.includes('+') || trend === 'Stable';
    
    return (
        <div className="bg-card border border-white/5 rounded-[2rem] p-7 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5 group relative overflow-hidden ring-1 ring-black/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/[0.02] to-transparent rounded-bl-full pointer-events-none transition-transform group-hover:scale-125 duration-700"></div>
            
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`p-3.5 rounded-2xl ${colorClass} transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-xl ring-1 ring-white/10`}>
                    {icon}
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300 ${
                    trend === 'Stable' ? 'bg-white/5 text-white/30 border-white/5' :
                    isPositive 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                    : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                }`}>
                    {trend !== 'Stable' && (isPositive ? '↑' : '↓')} {trend}
                </span>
            </div>
            
            <div className="relative z-10">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">{title}</p>
                <h3 className="text-4xl font-black text-white tracking-tighter leading-none">{formattedValue}</h3>
            </div>
        </div>
    );
};

export default StatCard;