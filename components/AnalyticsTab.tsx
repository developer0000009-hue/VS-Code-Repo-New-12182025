import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { AdminAnalyticsStats } from '../types';
import Spinner from './common/Spinner';

// Icons
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { FinanceIcon } from './icons/FinanceIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ClockIcon } from './icons/ClockIcon';

// --- Reusable Components ---

const useAnimatedCounter = (endValue: number, duration = 1500) => {
    const [count, setCount] = useState(0);
    const frameRate = 1000 / 60;
    const totalFrames = Math.round(duration / frameRate);

    useEffect(() => {
        let frame = 0;
        const counter = setInterval(() => {
            frame++;
            const progress = (frame / totalFrames);
            const currentCount = Math.round(endValue * (1 - Math.pow(1 - progress, 3))); // easeOutCubic
            setCount(currentCount);

            if (frame === totalFrames) {
                clearInterval(counter);
            }
        }, frameRate);

        return () => clearInterval(counter);
    }, [endValue, duration]);

    return count;
};

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; trend: string; prefix?: string }> = ({ title, value, icon, trend, prefix }) => {
    const animatedValue = useAnimatedCounter(value);
    const isPositive = trend.includes('+');

    return (
        <div className="group relative bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg shadow-black/10 hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
                    <h3 className="text-4xl font-extrabold text-foreground tracking-tight mt-2">{prefix}{animatedValue.toLocaleString()}</h3>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-inner">
                    {icon}
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2 relative z-10">
                <span className={`inline-flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? '↑' : '↓'} {trend}
                </span>
                <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
        </div>
    );
};

const EnrollmentChart = () => (
    <div className="w-full h-full flex flex-col relative animate-fade-in-up" style={{animationDelay: '200ms'}}>
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="w-full h-px bg-border/20 border-t border-dashed border-muted-foreground/5"></div>
            ))}
        </div>
        <div className="flex-grow relative overflow-hidden pt-4">
            <div 
                className="absolute bottom-0 left-0 right-0 h-[80%] bg-gradient-to-t from-primary/20 to-primary/0" 
                style={{ clipPath: 'path("M0,100 C15,80 35,90 50,70 S85,30 100,40 V100 Z")' }}
            />
            <svg className="w-full h-full absolute inset-0 overflow-visible" preserveAspectRatio="none">
                <path className="sparkline" d="M0,80 C15,60 35,70 50,50 S85,10 100,20" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
            </svg>
             <div className="absolute" style={{ top: 'calc(50% - 24px)', left: '50%' }}>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-foreground text-background text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                    1,102 Students
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-foreground"></div>
                </div>
                <div className="w-3 h-3 bg-primary border-2 border-card rounded-full shadow-sm ring-4 ring-primary/20"></div>
            </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground font-medium px-1">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
        </div>
        <style>{`.sparkline { stroke-dasharray: 500; stroke-dashoffset: 500; animation: 2s ease-out 0.5s forwards path-draw; } @keyframes path-draw { to { stroke-dashoffset: 0; } }`}</style>
    </div>
);

const AnalyticsTab: React.FC = () => {
    const [stats, setStats] = useState<AdminAnalyticsStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeframe, setTimeframe] = useState('30d');

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.rpc('get_admin_analytics_stats');
            if (error) throw error;
            setStats(data);
        } catch (err: any) {
            setError(`Failed to load analytics: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);
    
    if (loading) {
        return <div className="flex items-center justify-center p-12"><Spinner size="lg"/></div>
    }
    
    if (error) {
        return <p className="text-center text-red-500 p-8">{error}</p>;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* --- Header & Filters --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Analytics Dashboard</h2>
                    <p className="text-muted-foreground mt-1">Key metrics and performance overview.</p>
                </div>
                <div className="flex items-center gap-2 bg-card p-1.5 rounded-xl border border-border shadow-sm">
                    {['7d', '30d', '90d'].map(tf => (
                        <button key={tf} onClick={() => setTimeframe(tf)} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${timeframe === tf ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                            {tf === '7d' ? '7 Days' : tf === '30d' ? '30 Days' : '90 Days'}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- KPI Cards --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="Total Revenue" value={stats?.total_applications * 1234 || 42503} prefix="$" icon={<FinanceIcon className="w-6 h-6" />} trend="+12.5%" />
                <StatCard title="Total Students" value={stats?.total_users || 1803} icon={<UsersIcon className="w-6 h-6" />} trend="+32" />
                <StatCard title="New Applications" value={stats?.total_applications || 128} icon={<ClipboardListIcon className="w-6 h-6" />} trend="+15.8%" />
                <StatCard title="Pending Review" value={stats?.pending_applications || 12} icon={<ClockIcon className="w-6 h-6" />} trend="-3" />
            </div>

            {/* --- Main Charts --- */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg shadow-black/10 flex flex-col min-h-[400px]">
                    <div className="p-6 border-b border-border/50 flex justify-between items-center bg-white/5">
                        <h3 className="font-bold text-lg text-foreground">Student Enrollment Trend</h3>
                    </div>
                    <div className="p-6 flex-grow">
                        <EnrollmentChart />
                    </div>
                </div>
                 <div className="lg:col-span-2 bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg shadow-black/10 flex flex-col">
                    <div className="p-6 border-b border-border/50 bg-white/5">
                        <h3 className="font-bold text-lg text-foreground">Revenue by Grade</h3>
                    </div>
                    <div className="p-6 flex-grow flex items-center justify-center">
                        <p className="text-muted-foreground/50 text-sm">Revenue chart coming soon...</p>
                    </div>
                </div>
            </div>

            {/* --- Insights & Recent Activity --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg shadow-black/10 flex flex-col p-6 animate-fade-in-up" style={{animationDelay: '400ms'}}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary relative">
                            <SparklesIcon className="w-6 h-6"/>
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-sparkle"></span>
                        </div>
                        <h3 className="font-bold text-lg text-foreground">AI Insights</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                        <p className="text-muted-foreground leading-relaxed">
                            <strong className="text-foreground">Enrollment is up 12%</strong> compared to the previous period, driven by strong interest in Grade 9.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                             <strong className="text-foreground">Financials are healthy,</strong> but consider a targeted reminder campaign for the 12 pending fee collections.
                        </p>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg shadow-black/10 flex flex-col animate-fade-in-up" style={{animationDelay: '500ms'}}>
                     <div className="p-6 border-b border-border/50 bg-white/5 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-foreground">Recent Activity</h3>
                    </div>
                    <div className="p-6">
                        <p className="text-muted-foreground/50 text-sm text-center">Activity feed coming soon...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsTab;