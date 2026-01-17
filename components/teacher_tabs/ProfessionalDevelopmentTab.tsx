
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { Workshop, TeacherProfessionalDevelopmentData, FunctionComponentWithIcon } from '../../types';
import Spinner from '../common/Spinner';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';

interface ProfessionalDevelopmentTabProps {
    currentUserId: string;
}

const ProfessionalDevelopmentTab: FunctionComponentWithIcon<ProfessionalDevelopmentTabProps> = ({ currentUserId }) => {
    const [workshops, setWorkshops] = useState<Workshop[]>([]);
    const [pdData, setPdData] = useState<TeacherProfessionalDevelopmentData | null>(null);
    const [loading, setLoading] = useState({ workshops: true, pd: true });
    const [error, setError] = useState<string | null>(null);
    const [enrollingId, setEnrollingId] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        setLoading({ workshops: true, pd: true });
        setError(null);
        
        const [workshopsRes, pdRes] = await Promise.all([
            supabase.rpc('get_available_workshops'),
            supabase.rpc('get_teacher_professional_development')
        ]);

        if (workshopsRes.error) setError(prev => (prev ? prev + '\n' : '') + `Failed to fetch workshops: ${workshopsRes.error.message}`);
        else setWorkshops(workshopsRes.data || []);

        if (pdRes.error) setError(prev => (prev ? prev + '\n' : '') + `Failed to fetch your data: ${pdRes.error.message}`);
        else setPdData(pdRes.data);
        
        setLoading({ workshops: false, pd: false });
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleEnroll = async (workshopId: number) => {
        setEnrollingId(workshopId);
        const { error } = await supabase.rpc('enroll_in_workshop', { p_workshop_id: workshopId, p_teacher_id: currentUserId });
        if (error) alert(`Enrollment failed: ${error.message}`);
        else await fetchData();
        setEnrollingId(null);
    };
    
    const generatePortfolio = () => {
        if (!pdData) return;
        let content = "Professional Development Portfolio\n";
        content += "===================================\n\n";
        
        content += "COMPLETED TRAINING:\n";
        pdData.training_records.forEach(t => {
            content += `- ${t.title} (Completed: ${new Date(t.completed_at).toLocaleDateString()}, Points: ${t.points})\n`;
        });
        
        content += "\n\n AWARDS & RECOGNITIONS:\n";
        pdData.awards.forEach(a => {
             content += `- ${a.award_name} (Awarded: ${new Date(a.awarded_date).toLocaleDateString()}, Points: ${a.points})\n`;
        });
        
        content += `\n\n===================================\n`;
        content += `TOTAL GROWTH POINTS: ${pdData.total_points}`;

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = "portfolio.txt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            <h2 className="text-xl font-bold">Professional Development</h2>
            {error && <p className="text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-card p-4 rounded-lg border border-border">
                        <p className="text-sm font-medium text-muted-foreground">Total Growth Points</p>
                        <p className="text-4xl font-bold text-primary">{loading.pd ? <Spinner/> : pdData?.total_points || 0}</p>
                    </div>
                     <div className="bg-card p-4 rounded-lg border border-border">
                        <p className="text-sm font-medium text-muted-foreground">Awards Received</p>
                        <p className="text-4xl font-bold text-primary">{loading.pd ? <Spinner/> : pdData?.awards.length || 0}</p>
                    </div>
                     <button onClick={generatePortfolio} disabled={!pdData} className="w-full bg-secondary text-secondary-foreground font-bold py-2 px-4 rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50">Generate Portfolio</button>
                </div>
                
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h3 className="font-semibold mb-2">My Completed Training & Awards</h3>
                        {loading.pd ? <div className="flex justify-center"><Spinner/></div> : !pdData || (pdData.training_records.length === 0 && pdData.awards.length === 0) ? <p className="text-sm text-muted-foreground">No records found.</p> :
                         (
                            <div className="space-y-2">
                                {pdData.training_records.map((t,i) => <div key={`t-${i}`} className="text-sm p-2 bg-muted/50 rounded-md"><strong>{t.title}</strong> - Completed {new Date(t.completed_at).toLocaleDateString()}</div>)}
                                {pdData.awards.map((a,i) => <div key={`a-${i}`} className="text-sm p-2 bg-muted/50 rounded-md"><strong>{a.award_name}</strong> - Awarded {new Date(a.awarded_date).toLocaleDateString()}</div>)}
                            </div>
                         )}
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Available Workshops</h3>
                        {loading.workshops ? <div className="flex justify-center"><Spinner/></div> : workshops.length === 0 ? <p className="text-sm text-muted-foreground">No new workshops available.</p> :
                         (
                            <div className="space-y-3">
                                {workshops.map(w => (
                                    <div key={w.id} className="p-4 bg-card rounded-lg border border-border flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                        <div>
                                            <p className="font-bold text-foreground">{w.title}</p>
                                            <p className="text-sm text-muted-foreground mt-1">{w.description}</p>
                                            <p className="text-xs mt-2 text-primary font-semibold">Date: {new Date(w.workshop_date).toLocaleDateString()}</p>
                                        </div>
                                        <button onClick={() => handleEnroll(w.id)} disabled={enrollingId === w.id} className="btn-primary-sm w-full sm:w-auto">
                                            {enrollingId === w.id ? <Spinner size="sm" className="text-current"/> : 'Enroll'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                         )}
                    </div>
                </div>
            </div>
            <style>{`.btn-primary-sm { display: inline-flex; justify-content: center; items-center; gap: 0.5rem; background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600; font-size: 0.875rem; transition: background-color 0.2s; } .btn-primary-sm:disabled { opacity: 0.5; cursor: not-allowed; }`}</style>
        </div>
    );
};

ProfessionalDevelopmentTab.Icon = TrendingUpIcon;
export default ProfessionalDevelopmentTab;
