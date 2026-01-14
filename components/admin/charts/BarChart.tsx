import React from 'react';

const BarChart: React.FC = () => {
    const data = [
        { label: 'Mon', height: '60%' },
        { label: 'Tue', height: '80%' },
        { label: 'Wed', height: '75%' },
        { label: 'Thu', height: '90%' },
        { label: 'Fri', height: '85%' },
        { label: 'Sat', height: '40%' },
        { label: 'Sun', height: '30%' },
    ];

    return (
        <div className="w-full h-full flex items-end justify-between gap-3 pb-2">
            {data.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer h-full justify-end">
                    <div 
                        className="w-full rounded-md bg-gradient-to-t from-primary/40 to-primary/80 group-hover:from-primary/60 group-hover:to-primary transition-all duration-300 relative animate-grow-up"
                        style={{ height: item.height, animationDelay: `${index * 50}ms` }}
                    >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                            {item.height}
                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-foreground"></div>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase">{item.label}</span>
                </div>
            ))}
            <style>{`
                @keyframes grow-up {
                    from { transform: scaleY(0); }
                    to { transform: scaleY(1); }
                }
                .animate-grow-up {
                    transform-origin: bottom;
                    animation: grow-up 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default BarChart;