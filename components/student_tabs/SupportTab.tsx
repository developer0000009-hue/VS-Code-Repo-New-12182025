
import React, { useState } from 'react';
import { SupportIcon } from '../icons/SupportIcon';
import { MailIcon } from '../icons/MailIcon';
import Spinner from '../common/Spinner';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';

const SupportTab: React.FC = () => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [category, setCategory] = useState('General');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setLoading(false);
        setSuccess(true);
        setSubject('');
        setMessage('');
        setTimeout(() => setSuccess(false), 3000);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-2xl font-bold text-foreground">Help & Support</h2>
                <p className="text-muted-foreground mt-1">Contact your teachers or school administration.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Contact Form */}
                <div className="lg:col-span-2 bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm">
                    <h3 className="font-bold text-foreground text-lg mb-6 flex items-center gap-2">
                        <MailIcon className="w-5 h-5 text-primary" /> Send a Message
                    </h3>
                    
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                <CheckCircleIcon className="w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-bold text-foreground">Message Sent!</h4>
                            <p className="text-muted-foreground mt-2">Your query has been forwarded to the relevant department.</p>
                            <button onClick={() => setSuccess(false)} className="mt-6 text-primary font-bold hover:underline">Send another</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
                                    <select 
                                        value={category} 
                                        onChange={e => setCategory(e.target.value)}
                                        className="w-full p-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                                    >
                                        <option>General Enquiry</option>
                                        <option>Academic Support</option>
                                        <option>Technical Issue</option>
                                        <option>Fee Related</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Subject</label>
                                    <input 
                                        type="text" 
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        required
                                        placeholder="Brief topic..."
                                        className="w-full p-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Message</label>
                                <textarea 
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    required
                                    rows={6} 
                                    placeholder="Describe your issue or request in detail..." 
                                    className="w-full p-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm resize-none"
                                ></textarea>
                            </div>
                            <div className="flex justify-end">
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="bg-primary text-primary-foreground font-bold py-3 px-8 rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading ? <Spinner size="sm" className="text-current"/> : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                        <h3 className="font-bold text-foreground text-lg mb-4">Quick Contacts</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><SupportIcon className="w-5 h-5"/></div>
                                <div>
                                    <p className="font-semibold text-foreground text-sm">IT Support</p>
                                    <p className="text-xs text-muted-foreground">support@school.system</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                                <div className="bg-purple-100 text-purple-600 p-2 rounded-lg"><MailIcon className="w-5 h-5"/></div>
                                <div>
                                    <p className="font-semibold text-foreground text-sm">Administration</p>
                                    <p className="text-xs text-muted-foreground">admin@school.system</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl shadow-lg text-white">
                        <h3 className="font-bold text-lg mb-2">Office Hours</h3>
                        <p className="text-white/80 text-sm mb-4">Our administrative staff is available during school hours.</p>
                        <div className="space-y-2 text-sm font-medium">
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span>Mon - Fri</span>
                                <span>8:00 AM - 4:00 PM</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Saturday</span>
                                <span>9:00 AM - 1:00 PM</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportTab;
