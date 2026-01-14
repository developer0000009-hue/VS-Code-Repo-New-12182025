import React, { useState } from 'react';
import { supabase, formatError } from '../services/supabase'; 
import Spinner from './common/Spinner';
import { MailIcon } from './icons/MailIcon';
import { LockIcon } from './icons/LockIcon';
import { UserIcon } from './icons/UserIcon';
import { EyeIcon } from './icons/EyeIcon';
import { EyeOffIcon } from './icons/EyeOffIcon';
import { motion } from 'framer-motion';

interface SignupFormProps {
    onSuccess: (email: string) => void;
    onSwitchToLogin: () => void;
}

/**
 * FIX: Use 'SignupFormProps' as the generic type for React.FC instead of 'SignupForm' 
 * to resolve the "refers to a value, but is being used as a type" error.
 * The component is now fully implemented with logic for identity provisioning via Supabase.
 */
const SignupForm: React.FC<SignupFormProps> = ({ onSuccess, onSwitchToLogin }) => {
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: displayName,
                    }
                }
            });

            if (signUpError) {
                setError(formatError(signUpError));
                setLoading(false);
                return;
            }

            onSuccess(email);
        } catch (err: any) {
            setError("Provisioning Protocol Failure: " + formatError(err));
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#0d0f14]/80 backdrop-blur-3xl p-8 sm:p-12 rounded-[3.5rem] border border-white/10 space-y-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,1)] relative overflow-hidden ring-1 ring-white/5 font-sans">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent animate-scanner-move pointer-events-none"></div>
            
            <div className="text-center space-y-3 relative z-10">
                <h2 className="text-4xl md:text-5xl font-serif font-black text-white tracking-tighter leading-none uppercase">Provision.</h2>
                <p className="text-white/30 text-xs md:text-sm font-serif italic tracking-tight">Initialize your institutional identity node.</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-6 md:space-y-8 relative z-10">
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest p-4 rounded-2xl flex items-center gap-3"
                    >
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="flex-1">{error}</span>
                    </motion.div>
                )}

                <div className="space-y-3 group">
                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-1 transition-colors group-focus-within:text-primary">Legal Handle</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
                            <UserIcon className="h-5 w-5" />
                        </div>
                        <input
                            type="text"
                            required
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="block w-full h-[64px] md:h-[72px] pl-16 pr-6 bg-black/40 border border-white/5 rounded-2xl text-sm text-white placeholder:text-white/10 focus:outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary focus:bg-black/60 transition-all duration-300 font-mono font-bold tracking-wider"
                            placeholder="IDENTITY NAME"
                        />
                    </div>
                </div>

                <div className="space-y-3 group">
                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-1 transition-colors group-focus-within:text-primary">Communication Uplink</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
                            <MailIcon className="h-5 w-5" />
                        </div>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full h-[64px] md:h-[72px] pl-16 pr-6 bg-black/40 border border-white/5 rounded-2xl text-sm text-white placeholder:text-white/10 focus:outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary focus:bg-black/60 transition-all duration-300 font-mono font-bold tracking-wider"
                            placeholder="ADMIN@NODE.NET"
                        />
                    </div>
                </div>

                <div className="space-y-3 group">
                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-1 transition-colors group-focus-within:text-primary">Cipher Key</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
                            <LockIcon className="h-5 w-5" />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full h-[64px] md:h-[72px] pl-16 pr-16 bg-black/40 border border-white/5 rounded-2xl text-sm text-white placeholder:text-white/10 focus:outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary focus:bg-black/60 transition-all duration-300 font-mono font-bold tracking-widest"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-6 flex items-center text-white/20 hover:text-white transition-colors"
                        >
                            {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-[64px] md:h-[72px] flex items-center justify-center py-3.5 px-8 rounded-2xl shadow-2xl shadow-primary/20 text-[11px] font-black text-white bg-primary hover:bg-primary/90 focus:outline-none transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 uppercase tracking-[0.5em]"
                    >
                        {loading ? <Spinner size="sm" className="text-white" /> : 'Request Initialization'}
                    </button>
                </div>
            </form>

            <div className="text-center relative z-10">
                <p className="text-xs text-white/20 font-serif italic">
                    New Identity?{' '}
                    <button onClick={onSwitchToLogin} className="font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-widest ml-2 not-italic underline underline-offset-8">Access Console</button>
                </p>
            </div>
        </div>
    );
};

// FIX: Added missing default export to resolve the "no default export" error in AuthPage.tsx.
export default SignupForm;