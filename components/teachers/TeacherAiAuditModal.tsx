
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon } from '../icons/SparklesIcon';
import { XIcon } from '../icons/XIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { FileTextIcon } from '../icons/FileTextIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import Spinner from '../common/Spinner';
import { GoogleGenAI } from '@google/genai';

interface AuditIssue {
    id: number;
    type: 'conflict' | 'workload' | 'compliance' | 'attendance';
    severity: 'critical' | 'warning' | 'info';
    teacher: string;
    message: string;
    action: string;
}

const TeacherAiAuditModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [analyzing, setAnalyzing] = useState(true);
    const [progress, setProgress] = useState(0);
    const [issues, setIssues] = useState<AuditIssue[]>([]);
    const [aiInsight, setAiInsight] = useState<string | null>(null);

    const runAudit = useCallback(async () => {
        setAnalyzing(true);
        setAiInsight(null);
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Perform a virtual institutional audit of faculty rosters. Identify hypothetical critical risks in cross-branch scheduling, document compliance, and teaching workload distribution. Return an executive summary (approx 40 words) focusing on institutional resilience.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt
            });
            
            setAiInsight(response.text || null);
            setIssues([
                { id: 1, type: 'conflict', severity: 'critical', teacher: 'Sarah Jenkins', message: 'Atomic collision detected on Mondays 10:00 AM (Node B & C).', action: 'Sync Schedule' },
                { id: 2, type: 'compliance', severity: 'critical', teacher: 'Emily Davis', message: 'Governance Certification expired 12 days ago.', action: 'Archive Record' },
                { id: 3, type: 'workload', severity: 'warning', teacher: 'Robert Fox', message: 'Operational burn exceeds 32 hrs/week standard.', action: 'Review Load' }
            ]);
        } catch (e) {
            console.error(e);
        } finally {
            setAnalyzing(false);
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    runAudit();
                    return 100;
                }
                return prev + 2;
            });
        }, 40);
        return () => clearInterval(interval);
    }, [runAudit]);

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-[#0a0a0c] w-full max-w-3xl rounded-[3.5rem] shadow-[0_64px_128px_-24px_rgba(0,0,0,1)] border border-white/10 flex flex-col overflow-hidden max-h-[85vh] ring-1 ring-white/5" 
                onClick={e => e.stopPropagation()}
            >
                <div className="p-10 border-b border-white/5 bg-gradient-to-r from-violet-500/[0.03] to-transparent flex justify-between items-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-400 to-indigo-500" style={{ width: analyzing ? `${progress}%` : '100%', transition: 'width 0.1s linear shadow-[0_0_15px_rgba(139,92,246,0.6)]' }}></div>
                    
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="p-4 bg-violet-500/10 rounded-2xl text-violet-400 border border-violet-500/20 shadow-inner group-hover:rotate-12 transition-transform duration-700">
                            <SparklesIcon className={`w-8 h-8 ${analyzing ? 'animate-pulse' : ''}`} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-serif font-black text-white tracking-tighter uppercase leading-none">Intelligence <span className="text-white/20 italic">Audit.</span></h3>
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mt-2">
                                {analyzing ? `Analyzing identity lattice... ${progress}%` : 'Analysis synchronized'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-all"><XIcon className="w-6 h-6"/></button>
                </div>

                <div className="flex-grow overflow-y-auto p-10 bg-transparent custom-scrollbar space-y-10">
                    <AnimatePresence mode="wait">
                        {analyzing ? (
                            <motion.div 
                                key="analyzing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="py-20 flex flex-col items-center justify-center gap-10"
                            >
                                <Spinner size="lg" className="text-violet-500"/>
                                <div className="text-center space-y-4">
                                    <p className="text-xl font-serif italic text-white/40">Detecting node collisions and compliance drift...</p>
                                    <div className="flex items-center justify-center gap-2 text-[10px] font-black text-violet-400/40 uppercase tracking-[0.5em]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-ping"></div>
                                        Secure Stream Established
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="results"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-10"
                            >
                                {/* Summary Box */}
                                <div className="bg-violet-500/5 border border-violet-500/20 p-8 rounded-[2.5rem] relative overflow-hidden ring-1 ring-violet-500/10">
                                     <div className="absolute top-0 right-0 p-8 opacity-[0.02]"><SparklesIcon className="w-40 h-40" /></div>
                                     <p className="text-[10px] font-black uppercase text-violet-400 tracking-[0.4em] mb-5">AI Executive Summary</p>
                                     <p className="text-lg font-serif italic text-white/70 leading-relaxed font-medium">"{aiInsight}"</p>
                                </div>

                                {/* Issue Ledger */}
                                <div className="space-y-4">
                                    <p className="px-2 text-[10px] font-black uppercase text-white/20 tracking-[0.4em]">Critical Exceptions ({issues.length})</p>
                                    {issues.map(issue => (
                                        <div key={issue.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center justify-between group hover:border-white/20 transition-all hover:shadow-2xl">
                                            <div className="flex items-center gap-6">
                                                <div className={`p-4 rounded-2xl shadow-inner ${
                                                    issue.severity === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                                                }`}>
                                                    <AlertTriangleIcon className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-white text-base tracking-tight uppercase">{issue.teacher}</h4>
                                                    <p className="text-xs text-white/40 mt-1 font-medium leading-relaxed max-w-sm">{issue.message}</p>
                                                </div>
                                            </div>
                                            <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all">
                                                {issue.action}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                
                <div className="p-8 border-t border-white/5 bg-black/40 text-center">
                    <button onClick={runAudit} className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-primary transition-colors">Force Global Re-Scan</button>
                </div>
            </motion.div>
        </div>
    );
};

export default TeacherAiAuditModal;
