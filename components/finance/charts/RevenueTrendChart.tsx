
import React from 'react';

interface RevenueTrendChartProps {
    data?: number[]; // Array of 12 monthly values
    total: number;
}

const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({ data, total }) => {
    // Generate mock trajectory if none provided, scaled to real total
    const chartData = data || [0.4, 0.6, 0.5, 0.8, 0.7, 0.9, 0.85, 1.1, 0.95, 1.2, 1.1, 1.3].map(n => n * (total / 10));
    
    const height = 280;
    const width = 800;
    const padding = 40;
    
    const max = Math.max(...chartData) * 1.2;
    const min = 0;
    
    // Path Generator
    const points = chartData.map((val, i) => {
        const x = (i / (chartData.length - 1)) * (width - padding * 2) + padding;
        const y = height - ((val - min) / (max - min)) * (height - padding * 2) - padding;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Revenue Trajectory</h4>
                    <p className="text-2xl font-serif font-black text-white mt-1 uppercase tracking-tight">Lifecycle Stream</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)] animate-pulse"></div>
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Live Sync active</span>
                    </div>
                </div>
            </div>
            
            <div className="relative flex-grow w-full overflow-hidden">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Horizontal Grid */}
                    {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                        <line 
                            key={i} 
                            x1={padding} 
                            y1={padding + (height - 2*padding) * (1-p)} 
                            x2={width-padding} 
                            y2={padding + (height - 2*padding) * (1-p)} 
                            stroke="white" 
                            strokeOpacity="0.03" 
                            strokeWidth="1"
                        />
                    ))}

                    {/* Area Geometry */}
                    <path 
                        d={`M ${padding},${height-padding} L ${points} L ${width-padding},${height-padding} Z`} 
                        fill="url(#chartGradient)" 
                        className="animate-in fade-in duration-1000"
                    />
                    
                    {/* Trajectory Line */}
                    <polyline 
                        points={points} 
                        fill="none" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth="4" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        vectorEffect="non-scaling-stroke"
                        className="drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                    />
                    
                    {/* Interactive Handshake Dots */}
                    {chartData.map((val, i) => {
                         const x = (i / (chartData.length - 1)) * (width - padding * 2) + padding;
                         const y = height - ((val - min) / (max - min)) * (height - padding * 2) - padding;
                         return (
                             <circle 
                                key={i} cx={x} cy={y} r="5" 
                                className="fill-[#08090a] stroke-primary stroke-[3px] transition-all hover:r-8 cursor-pointer group"
                             />
                         )
                    })}
                </svg>
            </div>
            
            <div className="flex justify-between px-6 mt-4 text-[9px] font-black text-white/10 uppercase tracking-[0.4em]">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => <span key={m}>{m}</span>)}
            </div>
        </div>
    );
};

export default RevenueTrendChart;
