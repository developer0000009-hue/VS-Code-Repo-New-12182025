
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import Spinner from './common/Spinner';
import { MailIcon } from './icons/MailIcon';

interface ForgotPasswordFormProps {
    onBack: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email address.');
            return;
        }
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });

        setLoading(false);

        if (error) {
            setError(error.message);
        } else {
            setSuccess(true);
        }
    };

    if (success) {
        return (
            <div className="bg-card/60 dark:bg-card/50 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-border/50 text-center animate-in fade-in zoom-in-95 duration-500 w-full max-w-md">
                <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-primary/5 shadow-[0_0_30px_rgba(var(--primary),0.1)]">
                    <MailIcon className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-serif font-extrabold text-foreground mb-3 tracking-tight">Check Your Email</h3>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
                    We've sent a password reset link to <strong className="text-foreground">{email}</strong>.
                </p>
                <button
                    onClick={onBack}
                    className="w-full h-[52px] flex items-center justify-center py-3.5 px-6 rounded-xl shadow-lg shadow-primary/25 text-sm font-bold text-white bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform hover:-translate-y-0.5"
                >
                    Back to Sign In
                </button>
            </div>
        );
    }

    return (
         <div className="bg-card/60 dark:bg-card/50 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-border/50 space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center mb-2">
                <h2 className="text-3xl font-serif font-extrabold text-foreground tracking-tight">Forgot Password?</h2>
                <p className="text-sm text-muted-foreground mt-2">
                    No worries, we'll send you reset instructions.
                </p>
            </div>
            
            <form onSubmit={handleReset} className="space-y-6">
                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-start gap-2">
                        <span>•</span> {error}
                    </div>
                )}

                <div className="space-y-2 group">
                    <label htmlFor="email" className="block text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary">Email</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                            <MailIcon className="h-5 w-5" />
                        </div>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full h-[52px] pl-12 pr-4 bg-muted/30 border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background transition-all duration-200"
                            placeholder="name@example.com"
                            required
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-[52px] flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-primary/25 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <Spinner size="sm" className="text-primary-foreground" /> : 'Send Reset Link'}
                    </button>
                </div>
            </form>
            
            <div className="text-center">
                 <button
                    type="button"
                    onClick={onBack}
                    className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors focus:outline-none group flex items-center gap-2 mx-auto"
                >
                    <span aria-hidden="true" className="transition-transform group-hover:-translate-x-1">&larr;</span> Back to Sign In
                </button>
            </div>
        </div>
    );
};

export default ForgotPasswordForm;