
import React from 'react';

const RevenueChart: React.FC = () => {
    // Mock data for the chart. In a real app, this would come from props/API.
    const data = [
        { month: 'Jan', revenue: 15000 },
        { month: 'Feb', revenue: 22000 },
        { month: 'Mar', revenue: 18000 },
        { month: 'Apr', revenue: 27000 },
        { month: 'May', revenue: 32000 },
        { month: 'Jun', revenue: 29000 },
        { month: 'Jul', revenue: 35000 },
        { month: 'Aug', revenue: 41000 },
    ];

    const width = 500;
    const height = 200;
    const padding = 20;

    const maxValue = Math.max(...data.map(d => d.revenue), 0) * 1.1; // Add 10% buffer
    const points = data.map((point, i) => {
        const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
        const y = height - padding - (point.revenue / maxValue) * (height - 2 * padding);
        return `${x},${y}`;
    }).join(' ');

    const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

    return (
        <div className="h-full w-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                {/* Gradient Definition */}
                <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Y-axis grid lines */}
                {[0.25, 0.5, 0.75, 1].map(v => (
                    <line
                        key={v}
                        x1={padding}
                        y1={height - padding - (v * (height - 2 * padding))}
                        x2={width - padding}
                        y2={height - padding - (v * (height - 2 * padding))}
                        stroke="hsl(var(--border))"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                ))}

                {/* Area fill */}
                <polygon points={areaPoints} fill="url(#revenueGradient)" />

                {/* Line */}
                <polyline
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                />

                {/* Points */}
                {data.map((point, i) => {
                    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
                    const y = height - padding - (point.revenue / maxValue) * (height - 2 * padding);
                    return (
                        <g key={i} className="group">
                            <circle
                                cx={x}
                                cy={y}
                                r="5"
                                fill="hsl(var(--card))"
                                stroke="hsl(var(--primary))"
                                strokeWidth="2"
                                className="transition-all duration-200"
                            />
                            <circle
                                cx={x}
                                cy={y}
                                r="10"
                                fill="hsl(var(--primary))"
                                opacity="0"
                                className="cursor-pointer group-hover:opacity-20 transition-opacity"
                            />
                            <text
                                x={x}
                                y={y - 15}
                                textAnchor="middle"
                                fill="hsl(var(--foreground))"
                                className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                ${point.revenue.toLocaleString()}
                            </text>
                        </g>
                    );
                })}
                
                {/* X-axis labels */}
                {data.map((point, i) => (
                    <text
                        key={i}
                        x={padding + (i / (data.length - 1)) * (width - 2 * padding)}
                        y={height - 5}
                        textAnchor="middle"
                        fill="hsl(var(--muted-foreground))"
                        className="text-[10px] font-semibold"
                    >
                        {point.month}
                    </text>
                ))}
            </svg>
        </div>
    );
};

export default RevenueChart;
