import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { BUCKETS } from '../../services/storage';

interface PremiumAvatarProps {
    src?: string | null; 
    name: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const PremiumAvatar: React.FC<PremiumAvatarProps> = ({ src, name, size = 'md', className }) => {
    const [imgStatus, setImgStatus] = useState<'loading' | 'loaded' | 'error'>(src ? 'loading' : 'error');
    const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
    
    useEffect(() => {
        if (!src) {
            setImgStatus('error');
            return;
        }

        if (typeof src === 'string' && src.startsWith('http')) {
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
        xs: 'w-10 h-10 text-xs',
        sm: 'w-16 h-16 text-lg',
        md: 'w-24 h-24 text-2xl',
        lg: 'w-32 h-32 text-3xl',
        xl: 'w-48 h-48 text-5xl'
    };

    const getInitials = (n: string) => {
        if (!n || typeof n !== 'string') return '?';
        const parts = n.split(' ').filter(Boolean);
        if (parts.length === 0) return '?';
        return parts.map(i => i[0]).slice(0, 2).join('').toUpperCase();
    };

    const getColorFromHash = (n: string) => {
        const colors = [
            'from-indigo-500 to-blue-600',
            'from-purple-600 to-pink-500',
            'from-emerald-500 to-teal-600',
            'from-rose-500 to-orange-600',
            'from-cyan-500 to-sky-600'
        ];
        if (!n || typeof n !== 'string') return colors[0];
        let hash = 0;
        for (let i = 0; i < n.length; i++) {
            hash = n.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className={`relative flex-shrink-0 ${sizeMap[size]} ${className} group/avatar`}>
            <div className={`absolute -inset-1.5 rounded-full blur-xl opacity-30 transition-all duration-1000 bg-primary group-hover/avatar:opacity-60`}></div>
            
            <div className="relative w-full h-full rounded-full overflow-hidden bg-[#13151b] border-2 border-white/10 shadow-2xl ring-1 ring-white/5 flex items-center justify-center transition-all duration-700 group-hover/avatar:scale-[1.03]">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.01] to-white/[0.05] pointer-events-none z-20"></div>

                {resolvedUrl && imgStatus !== 'error' ? (
                    <img 
                        src={resolvedUrl} 
                        alt={name || 'Avatar'}
                        onLoad={() => setImgStatus('loaded')}
                        onError={() => setImgStatus('error')}
                        className={`w-full h-full object-cover transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] z-10 ${imgStatus === 'loaded' ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
                    />
                ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${getColorFromHash(name)} flex items-center justify-center shadow-inner z-10`}>
                        <span className="font-serif font-black text-white/90 drop-shadow-lg tracking-tighter">
                            {getInitials(name)}
                        </span>
                    </div>
                )}

                {imgStatus === 'loading' && (
                    <div className="absolute inset-0 bg-[#1a1d23] overflow-hidden z-10">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                )}
            </div>
            
            <style>{`
                @keyframes shimmer { 100% { transform: translateX(100%); } }
            `}</style>
        </div>
    );
};

export default PremiumAvatar;
