
import React from 'react';
import { CreditCardIcon } from '../../icons/CreditCardIcon';
import { DollarSignIcon } from '../../icons/DollarSignIcon';

const PaymentModesChart: React.FC = () => {
    // Mock data. In a real app, this would come from props/API.
    const data = [
        { name: 'Online', value: 65, color: 'hsl(var(--primary))' },
        { name: 'Cash', value: 25, color: 'hsl(220, 80%, 70%)' },
        { name: 'Cheque', value: 10, color: 'hsl(var(--muted-foreground))' },
    ];

    const total = data.reduce((acc, d) => acc + d.value, 0);
    const radius = 85;
    const circumference = 2 * Math.PI * radius;
    let accumulated = 0;

    return (
        <div className="h-full w-full flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="relative w-48 h-48 flex-shrink-0">
                <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                    {data.map((item, index) => {
                        const dasharray = (item.value / total) * circumference;
                        const dashoffset = accumulated;
                        accumulated += dasharray;
                        return (
                            <circle
                                key={index}
                                cx="100"
                                cy="100"
                                r={radius}
                                fill="transparent"
                                stroke={item.color}
                                strokeWidth="30"
                                strokeDasharray={`${dasharray} ${circumference}`}
                                strokeDashoffset={-dashoffset}
                                className="transition-all duration-500"
                            />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-foreground tracking-tight">{total}%</span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total</span>
                </div>
            </div>
            <div className="space-y-4">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="font-bold text-foreground flex-1">{item.name}</span>
                        <span className="font-mono text-muted-foreground font-semibold">{item.value}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PaymentModesChart;
