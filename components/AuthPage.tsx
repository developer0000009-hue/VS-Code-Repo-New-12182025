import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import ThemeSwitcher from './common/ThemeSwitcher';
import { SchoolIcon } from './icons/SchoolIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

type AuthView = 'login' | 'signup' | 'forgot';

const AuthPage: React.FC = () => {
    const [view, setView] = useState<AuthView>('login');
    const [signupSuccess, setSignupSuccess] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    const handleSignupSuccess = (email: string) => {
        setUserEmail(email);
        setSignupSuccess(true);
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 30 : -30,
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 30 : -30,
            opacity: 0,
        })
    };

    return (
        <div className="min-h-screen flex bg-[#08090a] selection:bg-primary/20 selection:text-primary overflow-hidden relative font-sans">
            {/* Ambient Background */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)`, backgroundSize: '40px 40px' }}></div>
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-[160px] pointer-events-none"></div>

            {/* Left Column: Institutional Branding (Desktop Only) */}
            <div className="hidden lg:flex lg:w-[45%] xl:w-[55%] relative overflow-hidden bg-[#0c0d12] border-r border-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50"></div>
                
                <div className="relative z-20 flex flex-col justify-between w-full p-16 xl:p-24 text-white h-full">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-2xl backdrop-blur-3xl border border-white/10 shadow-2xl">
                            <SchoolIcon className="h-8 w-8 text-white" />
                        </div>
                        <span className="text-2xl font-serif font-black tracking-[0.3em] text-white uppercase">Gurukul</span>
                    </div>
                    
                    <div className="max-w-2xl">
                        <h1 className="text-6xl xl:text-8xl font-serif font-black leading-[1] mb-8 tracking-tighter uppercase">
                            Modern <br/> <span className="text-white/30 italic">Governance.</span>
                        </h1>
                        <p className="text-xl text-white/40 leading-relaxed font-serif italic max-w-md border-l-2 border-primary/40 pl-8">
                            A unified institutional portal for administrative oversight, faculty orchestration, and parental engagement.
                        </p>
                    </div>

                    <div className="text-[10px] text-white/10 font-black uppercase tracking-[0.5em]">
                        &copy; 2025 Gurukul OS • Secure Node Deployment
                    </div>
                </div>
            </div>

            {/* Right Column: Auth Node */}
            <div className="w-full lg:w-[55%] xl:w-[45%] flex flex-col relative overflow-y-auto bg-[#08090a] custom-scrollbar h-screen">
                <div className="absolute top-6 right-6 z-30 flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                        <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Type-Safe Identity Node</span>
                    </div>
                    <ThemeSwitcher />
                </div>

                <div className="flex-grow flex items-center justify-center p-6 sm:p-12 relative">
                    <div className="w-full max-w-[440px] z-10 relative">
                        <AnimatePresence mode="wait">
                            {signupSuccess ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-[#0d0f14]/80 backdrop-blur-3xl p-10 md:p-14 rounded-[3rem] border border-white/10 text-center shadow-2xl relative overflow-hidden"
                                >
                                    <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-emerald-500/20">
                                        <CheckCircleIcon animate className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-3xl font-serif font-black text-white mb-4 tracking-tighter uppercase">Protocol Initialized.</h3>
                                    <p className="text-white/50 mb-10 text-sm leading-relaxed font-serif italic">
                                        Your institutional node has been provisioned. A verification link has been dispatched to <strong className="text-white">{userEmail}</strong>.
                                    </p>
                                    <button
                                        onClick={() => { setSignupSuccess(false); setView('login'); }}
                                        className="w-full h-14 flex items-center justify-center py-3.5 px-8 rounded-2xl text-[10px] font-black text-white bg-primary hover:bg-primary/90 transition-all transform active:scale-95 uppercase tracking-[0.4em] shadow-xl shadow-primary/20"
                                    >
                                        Proceed to Dashboard
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key={view}
                                    custom={view === 'signup' ? 1 : -1}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                >
                                    {view === 'login' && (
                                        <LoginForm 
                                            onSwitchToSignup={() => setView('signup')} 
                                            onForgotPassword={() => setView('forgot')} 
                                        />
                                    )}
                                    {view === 'signup' && (
                                        <SignupForm 
                                            onSuccess={handleSignupSuccess} 
                                            onSwitchToLogin={() => setView('login')} 
                                        />
                                    )}
                                    {view === 'forgot' && (
                                        <ForgotPasswordForm 
                                            onBack={() => setView('login')} 
                                        />
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;