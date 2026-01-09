import React, { useState, useEffect } from 'react';
import { ServiceStatus, VerificationStatus } from '../types';
import { ClockIcon } from './icons/ClockIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { RefreshIcon } from './icons/RefreshIcon';

interface VerificationStatusWidgetProps {
    status: ServiceStatus;
    lastSync?: Date;
    pendingCount?: number;
    isRefreshing?: boolean;
    onRetry?: () => void;
}

const VerificationStatusWidget: React.FC<VerificationStatusWidgetProps> = ({
    status,
    lastSync,
    pendingCount = 0,
    isRefreshing = false,
    onRetry
}) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every minute for relative time display
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const getStatusConfig = () => {
        switch (status) {
            case 'online':
                return {
                    dotColor: 'bg-teal-400',
                    textColor: 'text-teal-300',
                    label: 'Online',
                    description: pendingCount > 0 ? `${pendingCount} pending` : 'All verified'
                };
            case 'degraded':
                return {
                    dotColor: 'bg-yellow-400',
                    textColor: 'text-yellow-300',
                    label: 'Degraded',
                    description: 'Slow responses'
                };
            case 'offline':
                return {
                    dotColor: 'bg-gray-400',
                    textColor: 'text-gray-300',
                    label: 'Offline',
                    description: 'Service unavailable'
                };
            default:
                return {
                    dotColor: 'bg-gray-400',
                    textColor: 'text-gray-300',
                    label: 'Checking...',
                    description: 'Status unknown'
                };
        }
    };

    const config = getStatusConfig();

    const getRelativeTime = (date: Date) => {
        const diff = currentTime.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'now';
    };

    return (
        <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-300 group">
            {/* Status Dot */}
            <div className="relative">
                <div className={`w-3 h-3 rounded-full ${config.dotColor} shadow-lg ${isRefreshing ? 'animate-pulse' : ''}`} />
                {isRefreshing && (
                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-teal-400/30 animate-ping" />
                )}
            </div>

            {/* Status Text */}
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${config.textColor}`}>
                        {config.label}
                    </span>
                    {status === 'online' && pendingCount === 0 && (
                        <CheckCircleIcon className="w-3 h-3 text-teal-400" />
                    )}
                    {status === 'degraded' && (
                        <AlertTriangleIcon className="w-3 h-3 text-yellow-400" />
                    )}
                </div>
                <div className="flex items-center gap-2 text-[9px] text-white/40 font-mono tracking-wider">
                    {lastSync && (
                        <>
                            <ClockIcon className="w-2.5 h-2.5" />
                            {getRelativeTime(lastSync)}
                        </>
                    )}
                    <span className="text-white/20">•</span>
                    <span>{config.description}</span>
                </div>
            </div>

            {/* Retry Button (only show when offline or degraded) */}
            {(status === 'offline' || status === 'degraded') && onRetry && (
                <button
                    onClick={onRetry}
                    disabled={isRefreshing}
                    className="ml-2 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-[0.1em] text-white/60 hover:text-white transition-all duration-200 disabled:opacity-50"
                >
                    {isRefreshing ? '...' : 'Retry'}
                </button>
            )}
        </div>
    );
};

export default VerificationStatusWidget;