import React, { useState } from 'react';
import { supabase, formatError } from '../services/supabase'; 
import Spinner from './common/Spinner';
import { MailIcon } from './icons/MailIcon';
import { LockIcon } from './icons/LockIcon';
import { EyeIcon } from './icons/EyeIcon';
import { EyeOffIcon } from './icons/EyeOffIcon';
// Fix: Added missing ChevronRightIcon import to resolve compiler error on line 123.
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginFormProps {
    onSwitchToSignup: () => void;
    onForgotPassword: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignup, onForgotPassword }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) {
                setError(formatError(signInError));
                setLoading(false);
                return;
            }
        } catch (err: any) {
            setError("Connectivity Protocol Failure: " + formatError(err));
            setLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0d0f14]/80 backdrop-blur-3xl p-8 sm:p-12 md:p-16 rounded-[3.5rem] border border-white/10 space-y-12 shadow-[0_64px_128px_-32px_rgba(0,0,0,1)] relative overflow-hidden ring-1 ring-white/5 font-sans w-full"
        >
            {/* Animated Scanning Line */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-scanner-move pointer-events-none opacity-40"></div>
            
            <div className="text-center space-y-4 relative z-10">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Identity Authentication</span>
                </div>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-black text-white tracking-tighter leading-none uppercase">Initialize.</h2>
                <p className="text-white/30 text-[11px] sm:text-xs md:text-sm font-serif italic tracking-tight leading-relaxed max-w-xs mx-auto">Access the core institutional cluster through your verified credentials node.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6 sm:space-y-8 relative z-10">
                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest p-5 rounded-3xl flex items-start gap-4 shadow-xl ring-1 ring-red-500/10"
                        >
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-0.5 shrink-0 shadow-[0_0_10px_#ef4444]"></div>
                            <span className="flex-1 leading-relaxed">{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-3 group">
                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-1 transition-colors group-focus-within:text-primary">Identity Identifier</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-white/10 group-focus-within:text-primary transition-all duration-500">
                            <MailIcon className="h-6 w-6" />
                        </div>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full h-[72px] sm:h-[84px] pl-16 pr-6 bg-black/40 border border-white/5 rounded-3xl text-base text-white placeholder:text-white/5 focus:outline-none focus:ring-[12px] focus:ring-primary/5 focus:border-primary/50 focus:bg-black/80 transition-all duration-500 font-mono font-bold tracking-wider shadow-inner"
                            placeholder="ADMIN@NODE.PROTOCOL"
                        />
                    </div>
                </div>

                <div className="space-y-3 group">
                    <div className="flex justify-between items-center ml-1">
                        <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] transition-colors group-focus-within:text-primary">Access Cipher</label>
                        <button type="button" onClick={onForgotPassword} className="text-[10px] font-black text-primary/40 hover:text-primary transition-colors uppercase tracking-[0.2em] underline underline-offset-4">Lost Key?</button>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-white/10 group-focus-within:text-primary transition-all duration-500">
                            <LockIcon className="h-6 w-6" />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full h-[72px] sm:h-[84px] pl-16 pr-16 bg-black/40 border border-white/5 rounded-3xl text-base text-white placeholder:text-white/5 focus:outline-none focus:ring-[12px] focus:ring-primary/5 focus:border-primary/50 focus:bg-black/80 transition-all duration-500 font-mono font-bold tracking-widest shadow-inner"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-6 flex items-center text-white/20 hover:text-primary transition-colors active:scale-90"
                        >
                            {showPassword ? <EyeOffIcon className="h-6 w-6" /> : <EyeIcon className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-[72px] sm:h-[84px] flex items-center justify-center py-4 px-10 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(var(--primary),0.4)] text-[12px] font-black text-white bg-primary hover:bg-primary/90 focus:outline-none transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 uppercase tracking-[0.5em] ring-8 ring-primary/5 group"
                    >
                        {loading ? <Spinner size="md" className="text-white" /> : <div className="flex items-center gap-4">Confirm Identity Node <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform"/></div>}
                    </button>
                </div>
            </form>

            <div className="text-center relative z-10 pt-4">
                <p className="text-[11px] text-white/20 font-serif italic uppercase tracking-[0.3em]">
                    Unlisted Entity?{' '}
                    <button onClick={onSwitchToSignup} className="font-black text-primary hover:text-white transition-all uppercase tracking-widest ml-2 not-italic underline underline-offset-8">Provision Access</button>
                </p>
            </div>
        </motion.div>
    );
};

export default LoginForm;