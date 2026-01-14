
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { Communication } from '../../types';
import Spinner from '../common/Spinner';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';

const NotificationsTab: React.FC = () => {
    const [history, setHistory] = useState<Communication[]>([]);
    const [loading, setLoading] = useState({ history: true, sending: false });
    const [error, setError] = useState<string | null>(null);

    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const fetchHistory = useCallback(async () => {
        setLoading(prev => ({ ...prev, history: true }));
        // Using get_teacher_communications_history as it serves the same purpose of getting user's sent history
        const { data, error } = await supabase.rpc('get_teacher_communications_history');
        if (error) setError(`Failed to fetch history: ${error.message}`);
        else setHistory(data.map((h: any) => ({...h, recipients: ['Parent/Guardian']})) || []);
        setLoading(prev => ({ ...prev, history: false }));
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage('');
        if (!subject.trim() || !body.trim()) {
            setError("Please fill in both subject and body.");
            return;
        }

        setLoading(prev => ({ ...prev, sending: true }));
        const { error: rpcError } = await supabase.rpc('transport_send_route_notification', {
            p_subject: subject,
            p_body: body
        });
        setLoading(prev => ({ ...prev, sending: false }));

        if (rpcError) {
            setError(rpcError.message);
        } else {
            setSuccessMessage("Notification sent successfully to all parents on your route!");
            setSubject('');
            setBody('');
            fetchHistory();
            setTimeout(() => setSuccessMessage(''), 4000);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="font-bold text-lg mb-4">Send Route Notification</h3>
                <form onSubmit={handleSend} className="space-y-4">
                    <div>
                        <label htmlFor="subject" className="input-label">Subject</label>
                        <input id="subject" type="text" value={subject} onChange={e => setSubject(e.target.value)} required className="input-base" placeholder="e.g., Bus Running Late" />
                    </div>
                    <div>
                        <label htmlFor="body" className="input-label">Message</label>
                        <textarea id="body" value={body} onChange={e => setBody(e.target.value)} required rows={6} className="input-base" placeholder="e.g., Route A bus is running approximately 15 minutes late..."></textarea>
                    </div>

                    {error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{error}</p>}
                    {successMessage && <p className="text-sm text-green-600 bg-green-500/10 p-2 rounded-md flex items-center gap-2"><CheckCircleIcon className="w-4 h-4" /> {successMessage}</p>}
                    
                    <button type="submit" disabled={loading.sending} className="w-full bg-primary text-primary-foreground font-bold py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                        {loading.sending ? <Spinner size="sm"/> : 'Send to Route Parents'}
                    </button>
                </form>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="font-bold text-lg mb-4">Sent History</h3>
                {loading.history ? <div className="flex justify-center"><Spinner/></div> :
                 history.length === 0 ? <p className="text-muted-foreground text-sm">No notifications sent yet.</p> :
                 (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {history.map((msg, index) => (
                            <div key={index} className="p-4 bg-muted/50 rounded-lg border border-border">
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold text-foreground">{msg.subject}</p>
                                    <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">{new Date(msg.sent_at).toLocaleDateString()}</p>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{msg.body}</p>
                            </div>
                        ))}
                    </div>
                 )}
            </div>
            <style>{`
                .input-base { width: 100%; background-color: hsl(var(--background)); border: 1px solid hsl(var(--input)); border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; }
                .input-label { font-size: 0.875rem; font-weight: 500; color: hsl(var(--muted-foreground)); margin-bottom: 0.5rem; display: block; }
            `}</style>
        </div>
    );
};

export default NotificationsTab;
