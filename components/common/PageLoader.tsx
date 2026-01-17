
import React from 'react';
import { SchoolIcon } from '../icons/SchoolIcon';
import { motion } from 'framer-motion';

interface PageLoaderProps {
    label?: string;
    sublabel?: string;
}

const PageLoader: React.FC<PageLoaderProps> = ({ 
    label = "Synchronizing Node", 
    sublabel = "Securing institutional records..." 
}) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#08090a] text-center p-6 relative overflow-hidden">
            {/* Ambient Background Aura */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none animate-pulse-soft"></div>
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative z-10 flex flex-col items-center gap-8"
            >
                <div className="relative group">
                    <div className="absolute inset-0 rounded-[2rem] bg-primary/20 blur-2xl animate-pulse"></div>
                    <div className="relative w-20 h-20 bg-card border border-white/10 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-black ring-1 ring-white/5">
                        <SchoolIcon className="h-10 w-10 text-primary" />
                    </div>
                </div>
                
                <div className="space-y-4">
                    <h2 className="text-[12px] font-black uppercase tracking-[0.6em] text-white/90 animate-pulse">
                        {label}
                    </h2>
                    <p className="text-[14px] font-serif italic text-white/20 tracking-wide max-w-xs mx-auto leading-relaxed">
                        {sublabel}
                    </p>
                </div>

                {/* Intelligent Progress Bar */}
                <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden relative border border-white/[0.02]">
                    <motion.div 
                        className="absolute top-0 left-0 bottom-0 bg-primary/40 shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                        animate={{ 
                            left: ["-100%", "100%"],
                            width: ["30%", "60%", "30%"]
                        }}
                        transition={{ 
                            duration: 2.5, 
                            repeat: Infinity, 
                            ease: "easeInOut" 
                        }}
                    />
                </div>
            </motion.div>
            
            <div className="absolute bottom-10 text-[9px] font-black uppercase tracking-[0.4em] text-white/5 select-none">
                Gurukul OS • Governance Interface
            </div>
        </div>
    );
};

export default PageLoader;
