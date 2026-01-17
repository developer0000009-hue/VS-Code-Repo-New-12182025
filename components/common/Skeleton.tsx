
import React from 'react';

interface SkeletonBaseProps {
    className?: string;
    // FIX: Added key property to satisfy TypeScript compiler when skeleton components are used in mapped lists.
    key?: React.Key;
}

/**
 * Atomic Skeletons for Premium Institutional ERP
 */
export const Skeleton = {
    /**
     * Standard Text Line
     * Mirrored widths (60-90%) for realistic content flow.
     */
    Line: ({ className, variant = 'body', width = '75%' }: SkeletonBaseProps & { variant?: 'title' | 'body' | 'caption', width?: string }) => {
        const heightMap = {
            title: 'h-[18px]',
            body: 'h-[14px]',
            caption: 'h-[10px]'
        };
        return (
            <div 
                style={{ width }}
                className={`bg-skeleton-base rounded-[6px] animate-skeleton border border-white/[0.02] ${heightMap[variant]} ${className}`} 
            />
        );
    },

    /**
     * Profile/Avatar Circles
     */
    Avatar: ({ className, size = 'md' }: SkeletonBaseProps & { size?: 'sm' | 'md' | 'lg' }) => {
        const sizeMap = {
            sm: 'w-8 h-8',
            md: 'w-12 h-12',
            lg: 'w-16 h-16'
        };
        return (
            <div className={`bg-skeleton-base rounded-full animate-skeleton border border-white/[0.05] shadow-inner ${sizeMap[size]} ${className}`} />
        );
    },

    /**
     * Action Placeholder
     */
    Button: ({ className, width = '120px' }: SkeletonBaseProps & { width?: string }) => (
        <div 
            style={{ width }}
            className={`h-10 bg-skeleton-highlight rounded-full animate-skeleton border border-white/[0.05] ${className}`} 
        />
    ),

    /**
     * Main UI Block Foundation
     */
    Card: ({ children, className }: SkeletonBaseProps & { children?: React.ReactNode }) => (
        <div className={`bg-skeleton-base border border-white/[0.03] rounded-[16px] p-6 animate-skeleton shadow-2xl ${className}`}>
            {children || (
                <div className="space-y-4">
                    <Skeleton.Line variant="title" width="40%" />
                    <div className="space-y-2">
                        <Skeleton.Line variant="body" width="90%" />
                        <Skeleton.Line variant="body" width="85%" />
                        <Skeleton.Line variant="body" width="60%" />
                    </div>
                </div>
            )}
        </div>
    ),

    /**
     * High-density Metric Block
     */
    Metric: ({ className }: SkeletonBaseProps) => (
        <div className={`bg-skeleton-base border border-white/[0.03] rounded-[16px] p-6 animate-skeleton relative overflow-hidden flex flex-col justify-between min-h-[140px] ${className}`}>
            <div className="absolute left-0 top-6 bottom-6 w-1 bg-skeleton-glow rounded-r-full opacity-50"></div>
            <div className="space-y-2">
                <Skeleton.Line variant="caption" width="50%" />
                <Skeleton.Line variant="title" width="80%" className="h-8" />
            </div>
            <Skeleton.Line variant="caption" width="30%" />
        </div>
    ),

    /**
     * Input/Select Fields
     */
    Field: ({ className }: SkeletonBaseProps) => (
        <div className={`space-y-2 ${className}`}>
            <Skeleton.Line variant="caption" width="25%" className="ml-1" />
            <div className="h-[44px] bg-skeleton-base rounded-[10px] animate-skeleton border border-white/[0.05] flex items-center px-4">
                <Skeleton.Line variant="body" width="70%" className="opacity-20" />
            </div>
        </div>
    ),

    /**
     * Protocol Step
     */
    TimelineStep: ({ className }: SkeletonBaseProps) => (
        <div className={`flex flex-col items-center gap-3 ${className}`}>
            <div className="w-10 h-10 rounded-full bg-skeleton-base animate-skeleton border border-white/[0.05] flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-skeleton-glow opacity-20"></div>
            </div>
            <Skeleton.Line variant="caption" width="60px" />
        </div>
    )
};

/** Legacy compatibility exports */
export const CardSkeleton = () => <Skeleton.Card />;
export const StatsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <Skeleton.Metric key={i} />)}
    </div>
);
export const ListSkeleton = ({ rows = 5 }: { rows?: number }) => (
    <div className="bg-card/40 border border-white/5 rounded-[3rem] overflow-hidden">
        <div className="p-8 border-b border-white/5">
            <Skeleton.Line variant="title" width="240px" />
        </div>
        <div className="p-8 space-y-8">
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Skeleton.Avatar size="md" />
                        <div className="space-y-2">
                            <Skeleton.Line variant="body" width="180px" />
                            <Skeleton.Line variant="caption" width="100px" />
                        </div>
                    </div>
                    <Skeleton.Button width="100px" />
                </div>
            ))}
        </div>
    </div>
);
