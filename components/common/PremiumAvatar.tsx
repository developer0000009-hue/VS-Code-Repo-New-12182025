
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { BUCKETS } from '../../services/storage';

interface PremiumAvatarProps {
    src?: string | null; 
    name: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    statusColor?: string;
    className?: string;
}

const PremiumAvatar: React.FC<PremiumAvatarProps> = ({ src, name, size = 'md', statusColor, className }) => {
    const [imgStatus, setImgStatus] = useState<'loading' | 'loaded' | 'error'>(src ? 'loading' : 'error');
    const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
    
    useEffect(() => {
        if (!src) {
            setImgStatus('error');
            return;
        }

        if (src.startsWith('http')) {
            setResolvedUrl(src);
            setImgStatus('loading');
            return;
        }

        const { data } = supabase.storage
            .from(BUCKETS.PROFILES)
            .getPublicUrl(src);
        
        setResolvedUrl(`${data.publicUrl}?t=${Date.now()}`);
        setImgStatus('loading');
    }, [src]);

    const sizeMap = {
        xs: 'w-10 h-10 text-[10px]',
        sm: 'w-14 h-14 text-xs',
        md: 'w-24 h-24 text-2xl',
        lg: 'w-32 h-32 md:w-40 md:h-40 text-3xl',
        xl: 'w-48 h-48 text-5xl'
    };

    const getInitials = (n: string) => {
        if (!n) return '?';
        return n.split(' ').map(i => i[0]).slice(0, 2).join('').toUpperCase();
    };

    const getColorFromHash = (n: string) => {
        const colors = [
            'from-indigo-600 to-blue-700',
            'from-purple-700 to-pink-600',
            'from-emerald-600 to-teal-700',
            'from-rose-600 to-orange-600',
            'from-cyan-600 to-sky-700'
        ];
        let hash = 0;
        for (let i = 0; i < n.length; i++) {
            hash = n.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className={`relative flex-shrink-0 ${sizeMap[size]} ${className} group/avatar`}>
            <div className={`absolute -inset-2 rounded-[35%] blur-2xl opacity-20 transition-all duration-1000 ${statusColor || 'bg-primary'} group-hover/avatar:opacity-50`}></div>
            
            <div className="relative w-full h-full rounded-[2.2rem] md:rounded-[2.8rem] overflow-hidden bg-[#13151b] border border-white/10 shadow-3xl ring-1 ring-white/5 flex items-center justify-center transition-all duration-700 group-hover/avatar:scale-[1.05] group-hover/avatar:rotate-2">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.01] to-white/[0.05] pointer-events-none z-20"></div>

                {resolvedUrl && imgStatus !== 'error' && (
                    <img 
                        src={resolvedUrl} 
                        alt={name}
                        onLoad={() => setImgStatus('loaded')}
                        onError={() => setImgStatus('error')}
                        className={`w-full h-full object-cover transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] z-10 ${imgStatus === 'loaded' ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
                    />
                )}

                {imgStatus === 'loading' && (
                    <div className="absolute inset-0 bg-[#1a1d23] overflow-hidden z-10">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                )}

                {imgStatus === 'error' && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${getColorFromHash(name)} flex items-center justify-center shadow-inner z-10`}>
                        <span className="font-serif font-black text-white/90 drop-shadow-2xl tracking-tighter">
                            {getInitials(name)}
                        </span>
                    </div>
                )}
            </div>
            
            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};

export default PremiumAvatar;
