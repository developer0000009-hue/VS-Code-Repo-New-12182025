import React from 'react';

const AreaChart: React.FC = () => {
    return (
        <div className="w-full h-full flex flex-col relative">
            {/* Y-Axis Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-full h-px bg-border/20 border-t border-dashed border-muted-foreground/5"></div>
                ))}
            </div>
            
            {/* Chart Content Simulation */}
            <div className="flex-grow relative overflow-hidden pt-4">
                {/* Gradient Area */}
                <div 
                    className="absolute bottom-0 left-0 right-0 h-[80%] bg-gradient-to-t from-primary/20 to-primary/0 animate-fade-in-up" 
                    style={{ clipPath: 'path("M0,100 C15,80 35,90 50,70 S85,30 100,40 V100 Z")' }}
                />
                
                {/* Line */}
                <svg className="w-full h-full absolute inset-0 overflow-visible" preserveAspectRatio="none">
                    <defs>
                        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    <path 
                        className="path-draw"
                        d="M0,80 C15,60 35,70 50,50 S85,10 100,20" 
                        fill="none" 
                        stroke="url(#line-gradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                    />
                    <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(var(--primary) / 0.8)" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" />
                    </linearGradient>
                </svg>
                
                {/* Hover Tooltip Simulation */}
                <div className="absolute" style={{ top: 'calc(50% - 16px)', left: '50%' }}>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-foreground text-background text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                        1,102 Students
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-foreground"></div>
                    </div>
                    <div className="w-3 h-3 bg-primary border-2 border-card rounded-full shadow-sm ring-4 ring-primary/20"></div>
                </div>
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between mt-2 text-xs text-muted-foreground font-medium px-1">
                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
            </div>
             <style>{`
                @keyframes path-draw {
                    from { stroke-dashoffset: 500; }
                    to { stroke-dashoffset: 0; }
                }
                .path-draw {
                    stroke-dasharray: 500;
                    animation: path-draw 2s ease-out forwards;
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 1s ease-out forwards;
                    animation-delay: 0.2s;
                    opacity: 0;
                }
            `}</style>
        </div>
    );
};

export default AreaChart;