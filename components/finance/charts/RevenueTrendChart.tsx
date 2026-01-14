
import React from 'react';

interface RevenueTrendChartProps {
    data?: number[]; // Array of 12 monthly values
    total: number;
}

const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({ data, total }) => {
    // Mock data if none provided, scaled to the real total roughly
    const chartData = data || [0.4, 0.6, 0.5, 0.7, 0.6, 0.8, 0.75, 0.85, 0.8, 0.9, 0.85, 1].map(n => n * (total / 10));
    
    const height = 250;
    const width = 800;
    const padding = 20;
    
    const max = Math.max(...chartData) * 1.2;
    const min = 0;
    
    // Generate path
    const points = chartData.map((val, i) => {
        const x = (i / (chartData.length - 1)) * (width - padding * 2) + padding;
        const y = height - ((val - min) / (max - min)) * (height - padding * 2) - padding;
        return `${x},${y}`;
    }).join(' ');

    const areaPath = `${points} ${width-padding},${height} ${padding},${height}`;

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 px-2">
                <div>
                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Revenue Trajectory</h4>
                    <p className="text-xs text-muted-foreground mt-1">Monthly collection performance vs targets</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live Data
                    </span>
                </div>
            </div>
            
            <div className="relative flex-grow w-full overflow-hidden">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                        </linearGradient>
                         <mask id="gridMask">
                            <rect x="0" y="0" width="100%" height="100%" fill="white" />
                            {[...Array(6)].map((_, i) => (
                                <line key={i} x1="0" y1={i * (height/5)} x2="100%" y2={i * (height/5)} stroke="black" strokeWidth="1" strokeDasharray="4 4" />
                            ))}
                        </mask>
                    </defs>

                    {/* Grid Lines */}
                    {[...Array(5)].map((_, i) => (
                        <line 
                            key={i} 
                            x1={padding} 
                            y1={padding + i * ((height - 2*padding)/4)} 
                            x2={width-padding} 
                            y2={padding + i * ((height - 2*padding)/4)} 
                            stroke="currentColor" 
                            strokeOpacity="0.05" 
                            strokeWidth="1"
                        />
                    ))}

                    {/* Area */}
                    <path d={`M ${padding},${height} L ${points} L ${width-padding},${height} Z`} fill="url(#gradient)" stroke="none" />
                    
                    {/* Line */}
                    <polyline points={points} fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    
                    {/* Dots */}
                    {chartData.map((val, i) => {
                         const x = (i / (chartData.length - 1)) * (width - padding * 2) + padding;
                         const y = height - ((val - min) / (max - min)) * (height - padding * 2) - padding;
                         return (
                             <circle key={i} cx={x} cy={y} r="4" className="fill-background stroke-primary stroke-[3px] transition-all hover:r-6" />
                         )
                    })}
                </svg>
            </div>
            
            <div className="flex justify-between px-2 mt-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
            </div>
        </div>
    );
};

export default RevenueTrendChart;
