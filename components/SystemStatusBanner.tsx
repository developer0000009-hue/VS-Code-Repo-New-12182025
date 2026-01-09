import React from 'react';
import { ServiceStatus } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { ClockIcon } from './icons/ClockIcon';
import Spinner from './common/Spinner';

interface SystemStatusBannerProps {
    status: ServiceStatus;
    message: string;
    lastSync?: Date;
    pendingCount?: number;
    onRetry?: () => Promise<void>;
    isRetrying?: boolean;
}

const SystemStatusBanner: React.FC<SystemStatusBannerProps> = ({
    status,
    message,
    lastSync,
    pendingCount = 0,
    onRetry,
    isRetrying = false
}) => {
    const getStatusConfig = () => {
        switch (status) {
            case 'online':
                return {
                    bgColor: 'bg-emerald-500/5',
                    borderColor: 'border-emerald-500/20',
                    textColor: 'text-emerald-400',
                    dotColor: 'bg-emerald-400',
                    icon: CheckCircleIcon,
                    showRetry: false,
                    title: 'Verification Service Online'
                };
            case 'degraded':
                return {
                    bgColor: 'bg-yellow-500/5',
                    borderColor: 'border-yellow-500/20',
                    textColor: 'text-yellow-400',
                    dotColor: 'bg-yellow-400',
                    icon: AlertTriangleIcon,
                    showRetry: true,
                    title: 'Service Experiencing Delays'
                };
            case 'offline':
                return {
                    bgColor: 'bg-slate-500/5',
                    borderColor: 'border-slate-500/20',
                    textColor: 'text-slate-400',
                    dotColor: 'bg-slate-400',
                    icon: null, // No alarming icon for offline
                    showRetry: true,
                    title: 'Verification Service Offline'
                };
            case 'syncing':
                return {
                    bgColor: 'bg-primary/5',
                    borderColor: 'border-primary/20',
                    textColor: 'text-primary',
                    dotColor: 'bg-primary',
                    icon: null,
                    showRetry: false,
                    title: 'Reconnecting Services'
                };
            default:
                return {
                    bgColor: 'bg-gray-500/5',
                    borderColor: 'border-gray-500/20',
                    textColor: 'text-gray-400',
                    dotColor: 'bg-gray-400',
                    icon: AlertTriangleIcon,
                    showRetry: true,
                    title: 'Checking Service Status'
                };
        }
    };

    const config = getStatusConfig();
    const IconComponent = config.icon;

    const getRelativeTime = (date: Date) => {
        const diff = Date.now() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'now';
    };

    return (
        <div className={`p-6 rounded-[2rem] border shadow-xl ${config.bgColor} ${config.borderColor}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className={`w-3 h-3 rounded-full ${config.dotColor} shadow-lg ${status === 'syncing' ? 'animate-pulse' : ''}`} />
                        {status === 'syncing' && (
                            <div className="absolute inset-0 w-3 h-3 rounded-full bg-primary/30 animate-ping" />
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            {IconComponent && <IconComponent className="w-4 h-4" />}
                            <span className={`text-xs font-black uppercase tracking-[0.15em] ${config.textColor}`}>
                                {config.title}
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            <p className={`text-sm font-medium ${config.textColor}/80 leading-relaxed`}>
                                {message}
                            </p>

                            {pendingCount > 0 && (
                                <div className="flex items-center gap-1 text-xs text-white/60 bg-white/5 px-2 py-1 rounded-full">
                                    <ClockIcon className="w-3 h-3" />
                                    <span>{pendingCount} queued for verification</span>
                                </div>
                            )}

                            {lastSync && status !== 'syncing' && (
                                <div className="flex items-center gap-1 text-xs text-white/40">
                                    <ClockIcon className="w-3 h-3" />
                                    <span>Last sync: {getRelativeTime(lastSync)}</span>
                                </div>
                            )}
                        </div>

                        {/* Additional reassuring message for offline state */}
                        {status === 'offline' && (
                            <div className="text-xs text-white/50 mt-1">
                                Your data is safe and cached. Verification will resume automatically when service returns.
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-3">
                    {status === 'syncing' ? (
                        <div className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-primary">
                            <Spinner size="sm" />
                            Connecting...
                        </div>
                    ) : config.showRetry && onRetry ? (
                        <button
                            onClick={onRetry}
                            disabled={isRetrying}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                                status === 'offline'
                                    ? 'bg-slate-600/20 hover:bg-slate-600/30 text-slate-400 border border-slate-600/30'
                                    : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                            } disabled:opacity-50`}
                        >
                            {isRetrying ? (
                                <div className="flex items-center gap-2">
                                    <Spinner size="sm" />
                                    Checking...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <RefreshIcon className="w-3 h-3" />
                                    {status === 'offline' ? 'Check Status' : 'Retry'}
                                </div>
                            )}
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default SystemStatusBanner;