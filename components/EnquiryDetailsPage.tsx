import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, formatError } from '../services/supabase';
import { EnquiryService } from '../services/enquiry';
import { Enquiry, TimelineItem, EnquiryStatus } from '../types';
import Spinner from './common/Spinner';
import { XIcon } from './icons/XIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { GraduationCapIcon } from './icons/GraduationCapIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CommunicationIcon } from './icons/CommunicationIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { UsersIcon } from './icons/UsersIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { SearchIcon } from './icons/SearchIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { UserIcon } from './icons/UserIcon';
import { MailIcon } from './icons/MailIcon';
import { AcademicCapIcon } from './icons/AcademicCapIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { EyeIcon } from './icons/EyeIcon';
import { EditIcon } from './icons/EditIcon';
import { ArchiveIcon } from './icons/ArchiveIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { CheckIcon } from './icons/CheckIcon';
import { PlusIcon } from './icons/PlusIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';



const LocalSendIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

const STATUS_CONFIG: Record<string, { icon: React.ReactNode, label: string, color: string, ring: string, bg: string }> = {
    'NEW': { icon: <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"/>, label: 'New', color: 'text-gray-700', ring: 'ring-gray-600', bg: 'bg-gray-50' },
    'CONTACTED': { icon: <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"/>, label: 'Contacted', color: 'text-blue-700', ring: 'ring-blue-600', bg: 'bg-blue-50' },
    'VERIFIED': { icon: <ShieldCheckIcon className="w-4 h-4"/>, label: 'Verified', color: 'text-teal-700', ring: 'ring-teal-500', bg: 'bg-teal-50' },
    'APPROVED': { icon: <ShieldCheckIcon className="w-4 h-4"/>, label: 'Approved', color: 'text-teal-700', ring: 'ring-teal-500', bg: 'bg-teal-50' },
    'REJECTED': { icon: <div className="w-4 h-4 rounded-full bg-red-500"/>, label: 'Rejected', color: 'text-red-700', ring: 'ring-red-500', bg: 'bg-red-50' },
    'CONVERTED': { icon: <CheckCircleIcon className="w-4 h-4"/>, label: 'Converted', color: 'text-emerald-700', ring: 'ring-emerald-500', bg: 'bg-emerald-50' },
};

const ORDERED_STATUSES: EnquiryStatus[] = ['NEW', 'CONTACTED', 'VERIFIED', 'APPROVED', 'REJECTED'];

const TimelineEntry: React.FC<{ item: TimelineItem }> = ({ item }) => {
    if (item.item_type === 'MESSAGE') {
        const isParent = !item.is_admin;
        const message = item.details?.message || '[Message content unavailable]';
        const createdByName = item.created_by_name || 'Unknown';

        return (
             <div className={`flex items-end gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full ${isParent ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end gap-5 max-w-[85%] sm:max-w-[75%] ${isParent ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-11 h-11 rounded-[1.1rem] flex items-center justify-center font-black text-sm shadow-2xl text-white flex-shrink-0 border border-white/5 ${isParent ? 'bg-indigo-600' : 'bg-[#252833]'}`}>
                        {createdByName.charAt(0)}
                    </div>
                    <div className={`p-6 md:p-8 rounded-[2.5rem] shadow-2xl ring-1 ring-white/5 overflow-hidden relative ${isParent ? 'bg-[#1a1d23] rounded-br-none' : 'bg-[#221f30] rounded-bl-none text-white/90'}`}>
                         <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                         <p className="text-[15px] md:text-[17px] leading-relaxed relative z-10 whitespace-pre-wrap font-medium">{message}</p>
                         <div className={`flex items-center gap-3 mt-6 relative z-10 opacity-30 ${isParent ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[9px] font-black uppercase tracking-widest">{createdByName}</span>
                            <span className="w-1 h-1 rounded-full bg-white"></span>
                            <span className="text-[9px] font-mono">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center my-10 animate-in fade-in zoom-in-95 duration-1000">
            <div className="flex items-center gap-4 px-6 py-2.5 rounded-full bg-white/[0.02] border border-white/5 shadow-inner backdrop-blur-sm">
                <div className="w-1 h-1 rounded-full bg-primary/40 animate-pulse"></div>
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">
                    {item.item_type?.replace(/_/g, ' ') || 'Unknown Event'} / {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="w-1 h-1 rounded-full bg-primary/40 animate-pulse"></div>
            </div>
        </div>
    );
};

interface EnquiryDetailsPageProps {
    onNavigate?: (component: string) => void;
}

const EnquiryDetailsPage: React.FC<EnquiryDetailsPageProps> = ({ onNavigate }) => {
    const { enquiry_id } = useParams<{ enquiry_id: string }>();
    const navigate = useNavigate();

    const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [formData, setFormData] = useState({
        status: '',
        notes: '',
        applicant_name: '',
    });
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState({ enquiry: true, timeline: false, saving: false, converting: false });
    const [error, setError] = useState<string | null>(null);
    const commsEndRef = useRef<HTMLDivElement>(null);

    const validateEnquiry = (enquiry: Enquiry): { isValid: boolean; error?: string } => {
        if (!enquiry) {
            return { isValid: false, error: 'Enquiry data is missing' };
        }
        if (!enquiry.id) {
            return { isValid: false, error: 'Enquiry ID is required' };
        }
        if (!enquiry.applicant_name) {
            return { isValid: false, error: 'Applicant name is required' };
        }
        // Make parent_name optional for defensive handling
        // if (!enquiry.parent_name) {
        //     return { isValid: false, error: 'Parent name is required' };
        // }
        if (!enquiry.grade) {
            return { isValid: false, error: 'Grade information is required' };
        }
        return { isValid: true };
    };

    const fetchEnquiry = useCallback(async () => {
        if (!enquiry_id) {
            setError('Invalid enquiry ID provided');
            setLoading(prev => ({ ...prev, enquiry: false }));
            return;
        }

        const parsedId = parseInt(enquiry_id);
        if (isNaN(parsedId) || parsedId <= 0) {
            setError('Invalid enquiry ID format');
            setLoading(prev => ({ ...prev, enquiry: false }));
            return;
        }

        setLoading(prev => ({ ...prev, enquiry: true }));
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from('enquiries')
                .select('*')
                .eq('id', parsedId)
                .single();

            if (fetchError) {
                // Handle specific RLS or permission errors
                if (fetchError.code === 'PGRST116') {
                    setError('Enquiry not found or access denied. You may not have permission to view this enquiry.');
                } else if (fetchError.message?.includes('permission denied') || fetchError.message?.includes('RLS')) {
                    setError('Access denied. You do not have permission to view this enquiry.');
                } else {
                    throw fetchError;
                }
                setEnquiry(null);
                return;
            }

            if (!data) {
                setError('Enquiry not found in the system');
                setEnquiry(null);
                return;
            }

            const validation = validateEnquiry(data as Enquiry);
            if (!validation.isValid) {
                setError(validation.error || 'Enquiry data is incomplete or invalid');
                setEnquiry(null);
                return;
            }

            setEnquiry(data as Enquiry);
            setFormData({
                status: data.status,
                notes: data.notes || '',
                applicant_name: data.applicant_name || '',
            });
        } catch (err: any) {
            console.error("Enquiry Fetch Error:", err);
            const formattedError = formatError(err);
            if (formattedError.includes('Synchronization Idle') || formattedError.includes('Institutional system exception')) {
                setError('Unable to load enquiry. Please check your connection and try again.');
            } else {
                setError(formattedError);
            }
        } finally {
            setLoading(prev => ({ ...prev, enquiry: false }));
        }
    }, [enquiry_id]);

    const fetchTimeline = useCallback(async (isSilent = false) => {
        if (!enquiry) return;

        if (!isSilent) setLoading(prev => ({ ...prev, timeline: true }));
        try {
            const { data, error } = await supabase.rpc('get_enquiry_timeline', { p_enquiry_id: enquiry.id });
            if (error) throw error;
            setTimeline(data || []);
        } catch (err) {
            console.error("Timeline Sync Error:", err);
            // Set error for timeline issues
            if (!error) setError("Failed to load conversation timeline. Please try again.");
        } finally {
            if (!isSilent) setLoading(prev => ({ ...prev, timeline: false }));
        }
    }, [enquiry]);

    useEffect(() => {
        fetchEnquiry();
    }, [fetchEnquiry]);

    useEffect(() => {
        if (enquiry) {
            fetchTimeline();
        }
    }, [enquiry, fetchTimeline]);

    useEffect(() => {
        if (commsEndRef.current) {
            commsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [timeline]);



    const handleSaveStatus = async (newStatus: EnquiryStatus) => {
        if (!enquiry) return;

        setLoading(prev => ({ ...prev, saving: true }));
        try {
            const { error } = await supabase
                .from('enquiries')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', enquiry.id);

            if (error) throw error;
            setFormData(prev => ({ ...prev, status: newStatus }));
            setEnquiry(prev => prev ? { ...prev, status: newStatus } : null);
            await fetchTimeline(true);
        } catch (err) {
            alert(`Save failed: ${formatError(err)}`);
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const handleConvert = async () => {
        if (!enquiry) return;

        setLoading(prev => ({ ...prev, converting: true }));
        try {
            const result = await EnquiryService.convertToAdmission(enquiry.id);
            if (result.success) {
                onNavigate?.('Admissions');
                navigate(-1); // Go back to enquiry list
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(prev => ({ ...prev, converting: false }));
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const msg = newMessage.trim();
        if (!msg || !enquiry) return;

        try {
            const { error } = await supabase.rpc('send_enquiry_message', {
                p_enquiry_id: enquiry.id,
                p_message: msg
            });
            if (error) throw error;
            setNewMessage('');
            await fetchTimeline(true);
        } catch (err) {
            alert("Transmit Failure: " + formatError(err));
        }
    };

    if (loading.enquiry) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] text-white">
                {/* Skeleton Hero Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/30 via-slate-800/20 to-slate-900/40 border-b border-slate-700/50">
                    <div className="relative z-10 px-8 py-6 border-b border-slate-700/50 bg-slate-900/20 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <div className="w-32 h-10 bg-slate-700/50 rounded-xl animate-pulse"></div>
                            <div className="flex items-center gap-4">
                                <div className="w-24 h-4 bg-slate-700/30 rounded animate-pulse"></div>
                                <div className="w-8 h-8 bg-slate-700/50 rounded-lg animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                    <div className="relative z-10 px-8 py-12">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-8">
                                    <div className="w-24 h-24 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl animate-pulse"></div>
                                    <div className="space-y-4 flex-1">
                                        <div className="w-64 h-12 bg-slate-700/50 rounded-lg animate-pulse"></div>
                                        <div className="flex gap-4">
                                            <div className="w-20 h-6 bg-slate-700/30 rounded-full animate-pulse"></div>
                                            <div className="w-24 h-6 bg-slate-700/30 rounded-full animate-pulse"></div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="w-24 h-8 bg-slate-700/50 rounded-full animate-pulse"></div>
                                            <div className="w-28 h-8 bg-slate-700/30 rounded-full animate-pulse"></div>
                                            <div className="w-32 h-8 bg-slate-700/30 rounded-full animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="w-20 h-20 bg-slate-700/30 rounded-xl animate-pulse"></div>
                                    <div className="w-20 h-20 bg-slate-700/30 rounded-xl animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Skeleton 3-Column Layout */}
                <div className="flex h-[calc(100vh-280px)] bg-[#0a0a0c]">
                    {/* Left Column Skeleton */}
                    <div className="w-80 bg-slate-900/50 backdrop-blur-xl border-r border-slate-700/50 flex flex-col">
                        <div className="p-6 border-b border-slate-700/50">
                            <div className="w-32 h-6 bg-slate-700/50 rounded animate-pulse mb-2"></div>
                            <div className="w-40 h-4 bg-slate-700/30 rounded animate-pulse"></div>
                        </div>
                        <div className="flex-1 p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="w-24 h-4 bg-slate-700/50 rounded animate-pulse"></div>
                                <div className="space-y-3">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-700/50 rounded-full animate-pulse"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="w-24 h-3 bg-slate-700/30 rounded animate-pulse"></div>
                                                <div className="w-16 h-2 bg-slate-700/20 rounded animate-pulse"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Center Column Skeleton */}
                    <div className="flex-1 flex flex-col bg-[#0a0a0c]">
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 animate-pulse">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-700/50 rounded-lg"></div>
                                            <div className="w-32 h-5 bg-slate-700/50 rounded"></div>
                                        </div>
                                        <div className="w-8 h-8 bg-slate-700/30 rounded-lg"></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <div className="w-16 h-3 bg-slate-700/30 rounded"></div>
                                            <div className="w-24 h-4 bg-slate-700/50 rounded"></div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="w-20 h-3 bg-slate-700/30 rounded"></div>
                                            <div className="w-20 h-4 bg-slate-700/50 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-slate-700/50 p-6 bg-slate-900/50 backdrop-blur-xl">
                            <div className="max-w-4xl mx-auto">
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1 h-24 bg-slate-700/30 rounded-xl animate-pulse"></div>
                                    <div className="w-20 h-12 bg-slate-700/50 rounded-xl animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column Skeleton */}
                    <div className="w-80 bg-slate-900/50 backdrop-blur-xl border-l border-slate-700/50 flex flex-col">
                        <div className="p-6 border-b border-slate-700/50">
                            <div className="w-40 h-6 bg-slate-700/50 rounded animate-pulse mb-2"></div>
                            <div className="w-32 h-4 bg-slate-700/30 rounded animate-pulse"></div>
                        </div>
                        <div className="flex-1 p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="w-24 h-4 bg-slate-700/50 rounded animate-pulse"></div>
                                <div className="w-full h-12 bg-slate-700/50 rounded-xl animate-pulse"></div>
                                <div className="space-y-2">
                                    <div className="w-20 h-3 bg-slate-700/30 rounded animate-pulse"></div>
                                    <div className="w-full h-10 bg-slate-700/30 rounded-lg animate-pulse"></div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="w-24 h-4 bg-slate-700/50 rounded animate-pulse"></div>
                                <div className="space-y-3">
                                    <div className="w-full h-12 bg-slate-700/30 rounded-lg animate-pulse"></div>
                                    <div className="w-full h-12 bg-slate-700/30 rounded-lg animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !enquiry) {
        return (
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/5"
                    >
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-3xl font-serif font-black text-white uppercase tracking-tight">Enquiry Details</h1>
                </div>

                <div className="m-auto flex flex-col items-center gap-6 text-center max-w-md">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
                        <XIcon className="w-8 h-8 text-red-400" />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-2xl font-serif font-black text-white uppercase tracking-tight">Access Error</h3>
                        <p className="text-white/60 font-serif italic">{error || 'Enquiry not found or access denied'}</p>
                        <button
                            onClick={() => onNavigate?.('Enquiries')}
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl text-sm font-bold uppercase tracking-wide transition-all border border-white/10"
                        >
                            Return to Enquiry Node
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Helper function to get status color
    const getStatusColor = (status: string) => {
        const colors = {
            'New': 'bg-blue-500',
            'ENQUIRY_ACTIVE': 'bg-blue-500',
            'ENQUIRY_VERIFIED': 'bg-emerald-500',
            'VERIFIED': 'bg-emerald-500',
            'ENQUIRY_IN_PROGRESS': 'bg-amber-500',
            'IN_REVIEW': 'bg-amber-500',
            'CONVERTED': 'bg-green-600',
            'Completed': 'bg-green-600'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-500';
    };

    // Helper function to get priority color
    const getPriorityColor = () => {
        const daysSinceCreated = Math.floor((new Date().getTime() - new Date(enquiry.received_at).getTime()) / (1000 * 3600 * 24));
        if (daysSinceCreated > 7) return 'bg-red-500';
        if (daysSinceCreated > 3) return 'bg-amber-500';
        return 'bg-green-500';
    };

    // Calculate some stats
    const daysActive = Math.floor((new Date().getTime() - new Date(enquiry.received_at).getTime()) / (1000 * 3600 * 24));
    const messageCount = timeline.filter(t => t.item_type === 'MESSAGE').length;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 font-['Inter','system-ui','-apple-system','sans-serif'] antialiased">
            {/* Premium Hero Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/40 via-slate-800/30 to-slate-900/50 border-b border-slate-700/30">
                {/* Subtle animated background */}
                <div className="absolute inset-0 opacity-[0.03]">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-purple-500/5 animate-pulse"></div>
                </div>

                {/* Navigation */}
                <div className="relative z-10 px-8 py-6 border-b border-slate-700/30 bg-slate-900/20 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="group flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-800/40 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all duration-500 border border-slate-600/30 hover:border-slate-500/40 hover:shadow-lg hover:shadow-indigo-500/10"
                        >
                            <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-300" />
                            <span className="text-sm font-semibold tracking-wide">Back to Enquiries</span>
                        </button>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                                <span className="font-medium">Updated</span>
                                <span className="text-slate-500">
                                    {new Date(enquiry.updated_at).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                            <button className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all duration-300 border border-slate-600/30 hover:border-slate-500/40 hover:shadow-lg hover:shadow-slate-500/10">
                                <SettingsIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 px-8 py-16">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-start justify-between gap-12">
                            <div className="flex items-start gap-10">
                                {/* Premium Student Avatar */}
                                <div className="relative group">
                                    <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-indigo-500/20 border border-white/10 transition-all duration-500 group-hover:shadow-indigo-500/30 group-hover:scale-105">
                                        {enquiry.applicant_name.charAt(0)}
                                    </div>
                                    <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 border-4 border-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                        <CheckIcon className="w-5 h-5 text-white" />
                                    </div>
                                    {/* Ambient glow */}
                                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
                                </div>

                                {/* Student Info */}
                                <div className="space-y-6">
                                    <div>
                                        <h1 className="text-6xl font-black text-white tracking-tight leading-none mb-3">
                                            {enquiry.applicant_name}
                                        </h1>
                                        <div className="flex items-center gap-6">
                                            <span className="px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-300 text-sm font-bold border border-indigo-500/20 backdrop-blur-sm">
                                                Grade {enquiry.grade}
                                            </span>
                                            <span className="text-slate-400 text-sm font-medium tracking-wide">
                                                Enquiry #{enquiry.id.toString().substring(0, 8).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Premium Status Pills */}
                                    <div className="flex items-center gap-4">
                                        <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl text-sm font-bold ${getStatusColor(enquiry.status)} text-white shadow-xl shadow-current/20 backdrop-blur-sm border border-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl`}>
                                            {STATUS_CONFIG[enquiry.status]?.icon}
                                            <span className="tracking-wide">{STATUS_CONFIG[enquiry.status]?.label || enquiry.status}</span>
                                        </div>

                                        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold ${getPriorityColor()} text-white shadow-lg shadow-current/15 backdrop-blur-sm border border-white/10 transition-all duration-300 hover:scale-105`}>
                                            <AlertTriangleIcon className="w-4 h-4" />
                                            <span>{daysActive > 7 ? 'High Priority' : daysActive > 3 ? 'Medium Priority' : 'Normal Priority'}</span>
                                        </div>

                                        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold bg-slate-800/60 text-slate-200 border border-slate-600/30 backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-105 hover:bg-slate-700/60">
                                            <ClockIcon className="w-4 h-4" />
                                            <span>{daysActive} days active</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Premium Quick Stats */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="group text-center p-6 rounded-3xl bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 hover:border-slate-600/60 transition-all duration-500 hover:shadow-xl hover:shadow-slate-500/10 hover:-translate-y-1">
                                    <div className="text-3xl font-black text-white mb-1 group-hover:text-indigo-300 transition-colors duration-300">{messageCount}</div>
                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-[0.15em]">Messages</div>
                                </div>
                                <div className="group text-center p-6 rounded-3xl bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-500 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1">
                                    <div className="text-3xl font-black text-emerald-400 mb-1 group-hover:text-emerald-300 transition-colors duration-300">
                                        {enquiry.status === 'CONVERTED' ? '100%' : enquiry.status === 'ENQUIRY_VERIFIED' ? '75%' : enquiry.status === 'ENQUIRY_IN_PROGRESS' ? '50%' : '25%'}
                                    </div>
                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-[0.15em]">Progress</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Verification Banner - Show when enquiry is verified */}
            {enquiry.verification_status === 'VERIFIED' && (
                <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-green-500/10 border-b border-emerald-500/20 backdrop-blur-xl">
                    <div className="max-w-7xl mx-auto px-8 py-4">
                        <div className="flex items-center justify-center gap-3">
                            <div className="p-2 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                                <ShieldCheckIcon className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-emerald-400 uppercase tracking-[0.2em]">Verified – Ready for follow-up</p>
                                <p className="text-xs text-emerald-300/70 mt-1">This enquiry has been successfully verified and is ready for contact</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium 3-Zone Layout */}
            <div className="flex h-[calc(100vh-320px)] bg-slate-950">
                {/* Left: Intelligence Timeline */}
                <div className="w-96 bg-gradient-to-b from-slate-900/60 to-slate-950/80 backdrop-blur-2xl border-r border-slate-700/30 flex flex-col shadow-2xl">
                    {/* Timeline Header */}
                    <div className="p-8 border-b border-slate-700/30">
                        <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Activity Timeline</h2>
                        <p className="text-sm text-slate-400 font-medium">Real-time enquiry progress</p>
                    </div>

                    {/* Timeline Content */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        {/* Elegant Progress Status */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-[0.2em] letter-spacing-1">Progress Status</h3>
                            <div className="space-y-4">
                                {[
                                    { step: 'Enquiry Created', status: 'completed', date: enquiry.received_at, phase: 'Created' },
                                    { step: 'Documents Requested', status: enquiry.status !== 'New' ? 'completed' : 'pending', phase: 'Docs' },
                                    { step: 'Verification', status: ['ENQUIRY_VERIFIED', 'ENQUIRY_IN_PROGRESS', 'CONVERTED'].includes(enquiry.status) ? 'completed' : 'pending', phase: 'Verify' },
                                    { step: 'Review', status: ['ENQUIRY_IN_PROGRESS', 'CONVERTED'].includes(enquiry.status) ? 'completed' : 'pending', phase: 'Review' },
                                    { step: 'Converted', status: enquiry.status === 'CONVERTED' ? 'completed' : 'pending', phase: 'Convert' }
                                ].map((item, index) => (
                                    <div key={index} className="group flex items-center gap-4 p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30 hover:bg-slate-700/40 hover:border-slate-600/40 transition-all duration-300 hover:shadow-lg hover:shadow-slate-500/5">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${
                                            item.status === 'completed'
                                                ? 'bg-gradient-to-br from-emerald-500 to-teal-500 border-emerald-500/50 text-white shadow-lg shadow-emerald-500/20'
                                                : item.status === 'current'
                                                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                                                : 'border-slate-600 text-slate-500 bg-slate-800/50'
                                        } group-hover:scale-110`}>
                                            {item.status === 'completed' ? (
                                                <CheckIcon className="w-5 h-5" />
                                            ) : (
                                                <div className="w-2.5 h-2.5 rounded-full bg-current animate-pulse"></div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className={`text-sm font-semibold tracking-wide ${item.status === 'completed' ? 'text-white' : 'text-slate-400'}`}>
                                                {item.step}
                                            </div>
                                            <div className="text-xs text-slate-500 font-medium">
                                                {item.phase} • {item.date ? new Date(item.date).toLocaleDateString() : 'Pending'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity Feed */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-[0.2em] letter-spacing-1">Recent Activity</h3>
                            <div className="space-y-4">
                                {timeline.slice(0, 8).map((item, idx) => (
                                    <div key={idx} className="group flex gap-4 p-4 rounded-2xl bg-slate-800/20 border border-slate-700/30 hover:bg-slate-700/30 hover:border-slate-600/40 transition-all duration-300 hover:shadow-lg hover:shadow-slate-500/5 hover:-translate-y-0.5">
                                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 border border-slate-600/30 group-hover:border-indigo-500/30 transition-colors duration-300">
                                            {item.item_type === 'MESSAGE' ? (
                                                <CommunicationIcon className="w-5 h-5 text-indigo-400" />
                                            ) : (
                                                <SettingsIcon className="w-5 h-5 text-indigo-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors duration-300">
                                                {item.item_type === 'MESSAGE' ? 'Message exchanged' : 'Status updated'}
                                            </div>
                                            <div className="text-xs text-slate-400 font-medium">
                                                {new Date(item.created_at).toLocaleString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center: Enquiry Intelligence */}
                <div className="flex-1 flex flex-col bg-slate-950">
                    {/* Premium Information Cards */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        {/* Student Identity Card */}
                        <div className="group bg-gradient-to-br from-slate-800/40 via-slate-900/60 to-slate-800/40 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 hover:border-slate-600/60 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500 hover:-translate-y-1">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/20">
                                    <UserIcon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white tracking-tight">Student Identity</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] letter-spacing-1">Full Name</label>
                                    <p className="text-white font-semibold text-lg tracking-wide">{enquiry.applicant_name}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] letter-spacing-1">Grade Applied</label>
                                    <p className="text-white font-semibold text-lg tracking-wide">Grade {enquiry.grade}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] letter-spacing-1">Enquiry ID</label>
                                    <p className="text-slate-300 font-medium text-lg tracking-wide">#{enquiry.id.toString().slice(-6)}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] letter-spacing-1">Verification Status</label>
                                    <div className="flex items-center gap-2">
                                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                                            enquiry.status === 'ENQUIRY_VERIFIED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                            enquiry.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                            enquiry.status === 'IN_REVIEW' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                            'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                        }`}>
                                            {STATUS_CONFIG[enquiry.status]?.label || enquiry.status}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Parent Contact Card (Read-Only) */}
                        <div className="group bg-gradient-to-br from-slate-800/40 via-slate-900/60 to-slate-800/40 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-500 hover:-translate-y-1">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/20">
                                    <UsersIcon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white tracking-tight">Parent Contact</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] letter-spacing-1">Full Name</label>
                                    <p className="text-white font-semibold text-lg tracking-wide">{enquiry.parent_name || 'Not provided'}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] letter-spacing-1">Phone Number</label>
                                    <p className="text-slate-300 font-medium text-lg tracking-wide">{enquiry.parent_phone || 'Not provided'}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] letter-spacing-1">Email Address</label>
                                    <p className="text-slate-300 font-medium text-lg tracking-wide">{enquiry.parent_email || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Enquiry Progress Timeline */}
                        <div className="group bg-gradient-to-br from-slate-800/40 via-slate-900/60 to-slate-800/40 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 hover:border-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-500 hover:-translate-y-1">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/20">
                                    <ClockIcon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white tracking-tight">Enquiry Progress</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                        <CheckIcon className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold text-white">Enquiry Created</div>
                                        <div className="text-xs text-slate-400">
                                            {new Date(enquiry.received_at).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-4 p-4 rounded-2xl bg-slate-800/30 border ${
                                    ['CONTACTED', 'APPROVED', 'REJECTED', 'CONVERTED'].includes(enquiry.status)
                                        ? 'border-emerald-500/30'
                                        : 'border-slate-700/30'
                                }`}>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                                        ['CONTACTED', 'APPROVED', 'REJECTED', 'CONVERTED'].includes(enquiry.status)
                                            ? 'bg-emerald-500/20 border-emerald-500/30'
                                            : 'bg-slate-800/50 border-slate-600'
                                    }`}>
                                        {['CONTACTED', 'APPROVED', 'REJECTED', 'CONVERTED'].includes(enquiry.status) ? (
                                            <CheckIcon className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className={`text-sm font-semibold ${
                                            ['CONTACTED', 'APPROVED', 'REJECTED', 'CONVERTED'].includes(enquiry.status)
                                                ? 'text-white'
                                                : 'text-slate-400'
                                        }`}>
                                            Contacted Parent
                                        </div>
                                        <div className="text-xs text-slate-500">Initial outreach completed</div>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-4 p-4 rounded-2xl bg-slate-800/30 border ${
                                    ['APPROVED', 'CONVERTED'].includes(enquiry.status)
                                        ? 'border-emerald-500/30'
                                        : 'border-slate-700/30'
                                }`}>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                                        ['APPROVED', 'CONVERTED'].includes(enquiry.status)
                                            ? 'bg-emerald-500/20 border-emerald-500/30'
                                            : 'bg-slate-800/50 border-slate-600'
                                    }`}>
                                        {['APPROVED', 'CONVERTED'].includes(enquiry.status) ? (
                                            <CheckIcon className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className={`text-sm font-semibold ${
                                            ['APPROVED', 'CONVERTED'].includes(enquiry.status)
                                                ? 'text-white'
                                                : 'text-slate-400'
                                        }`}>
                                            Approved for Admission
                                        </div>
                                        <div className="text-xs text-slate-500">Ready for conversion</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Premium Communication Input */}
                    <div className="border-t border-slate-700/50 p-8 bg-gradient-to-r from-slate-900/60 to-slate-950/80 backdrop-blur-2xl">
                        <form onSubmit={handleSendMessage} className="max-w-5xl mx-auto">
                            <div className="flex gap-6 items-end">
                                <div className="flex-1 relative group">
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Send a message to the parent..."
                                        className="w-full p-6 rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/80 border border-slate-600/40 text-white placeholder:text-slate-400 outline-none resize-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all duration-500 text-lg leading-relaxed font-medium backdrop-blur-xl hover:bg-slate-700/60 focus:bg-slate-700/60"
                                        rows={3}
                                        onKeyDown={(e) => {
                                            if(e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(e as any);
                                            }
                                        }}
                                    />
                                    <div className="absolute right-4 bottom-4 text-xs text-slate-400 font-medium tracking-wide">
                                        Press Enter to send
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || loading.saving}
                                    className="px-8 py-4 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-xl shadow-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/30 hover:scale-105 border border-indigo-500/20"
                                >
                                    {loading.saving ? <Spinner size="sm" /> : <ArrowRightIcon className="w-5 h-5" />}
                                    <span className="tracking-wide">Send</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right: Actions & Intelligence Panel */}
                <div className="w-96 bg-gradient-to-b from-slate-900/60 to-slate-950/80 backdrop-blur-2xl border-l border-slate-700/30 flex flex-col shadow-2xl">
                    {/* Actions Header */}
                    <div className="p-8 border-b border-slate-700/30">
                        <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Actions & Intelligence</h2>
                        <p className="text-sm text-slate-400 font-medium">Contextual operations</p>
                    </div>

                    {/* Actions Content */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        {/* Primary Actions */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-[0.2em] letter-spacing-1">Primary Actions</h3>

                            {/* Convert to Admission - HIGHEST PRIORITY */}
                            {enquiry.status !== 'CONVERTED' && (
                                <button
                                    onClick={handleConvert}
                                    disabled={loading.converting || enquiry.status !== 'APPROVED'}
                                    className={`group w-full p-6 rounded-3xl font-bold text-base transition-all duration-500 flex items-center justify-center gap-4 border ${
                                        enquiry.status === 'APPROVED'
                                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-105 border-emerald-500/20'
                                            : 'bg-slate-800/60 text-slate-500 cursor-not-allowed border-slate-600/30'
                                    }`}
                                >
                                    {loading.converting ? <Spinner size="sm" /> : <GraduationCapIcon className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />}
                                    <span className="tracking-wide">Convert to Admission</span>
                                </button>
                            )}

                            {/* Status Management */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-300 uppercase tracking-[0.15em] letter-spacing-1">Update Status</label>
                                <select
                                    value={enquiry.status}
                                    onChange={(e) => handleSaveStatus(e.target.value as EnquiryStatus)}
                                    disabled={loading.saving}
                                    className="w-full p-4 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/80 border border-slate-600/40 text-white outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all duration-300 font-medium backdrop-blur-xl hover:bg-slate-700/60"
                                >
                                    {ORDERED_STATUSES.map(status => (
                                        <option key={status} value={status} className="bg-slate-900 text-white">
                                            {STATUS_CONFIG[status]?.label || status}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Communication Actions */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-[0.2em] letter-spacing-1">Communication</h3>

                            <button
                                onClick={() => {
                                    setNewMessage("Thank you for your interest in our school. We have received your enquiry and will get back to you shortly.");
                                }}
                                className="group w-full p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 text-indigo-300 hover:text-indigo-200 transition-all duration-300 text-left border border-indigo-500/20 hover:border-indigo-500/30 backdrop-blur-sm hover:shadow-lg hover:shadow-indigo-500/10"
                            >
                                <div className="font-semibold text-base mb-1">Send Welcome Message</div>
                                <div className="text-xs opacity-70 font-medium">Automated response</div>
                            </button>

                            <button
                                onClick={() => {
                                    setNewMessage("Please provide the following documents to complete your application:\n\n• Birth Certificate\n• Address Proof\n• Previous School Records\n• Medical Certificate (if applicable)\n\nYou can upload these documents directly through your Parent Portal.");
                                }}
                                className="group w-full p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-300 hover:text-amber-200 transition-all duration-300 text-left border border-amber-500/20 hover:border-amber-500/30 backdrop-blur-sm hover:shadow-lg hover:shadow-amber-500/10"
                            >
                                <div className="font-semibold text-base mb-1">Request Documents</div>
                                <div className="text-xs opacity-70 font-medium">Document checklist</div>
                            </button>

                            <button
                                onClick={() => {
                                    setNewMessage("Dear Parent,\n\nWe wanted to follow up on your enquiry for admission. We're here to help you through the process.\n\nPlease let us know if you have any questions or need assistance with the required documents.\n\nBest regards,\nAdmissions Team");
                                }}
                                className="group w-full p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 text-purple-300 hover:text-purple-200 transition-all duration-300 text-left border border-purple-500/20 hover:border-purple-500/30 backdrop-blur-sm hover:shadow-lg hover:shadow-purple-500/10"
                            >
                                <div className="font-semibold text-base mb-1">Follow-up Reminder</div>
                                <div className="text-xs opacity-70 font-medium">Gentle nudge message</div>
                            </button>
                        </div>

                        {/* Intelligence Panel */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-[0.2em] letter-spacing-1">Intelligence</h3>

                            <div className="space-y-4">
                                <div className="group p-5 rounded-2xl bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 hover:border-slate-600/60 transition-all duration-300 hover:shadow-lg hover:shadow-slate-500/5">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] letter-spacing-1 mb-2">Response Time</div>
                                    <div className="text-2xl font-black text-white group-hover:text-indigo-300 transition-colors duration-300">
                                        {messageCount > 0 ? '< 24h' : 'Pending'}
                                    </div>
                                </div>

                                <div className="group p-5 rounded-2xl bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] letter-spacing-1 mb-2">Engagement Score</div>
                                    <div className="text-2xl font-black text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300">
                                        {Math.min(95, 60 + (messageCount * 10))}%
                                    </div>
                                </div>

                                <div className="group p-5 rounded-2xl bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] letter-spacing-1 mb-2">Priority Level</div>
                                    <div className={`text-lg font-bold ${
                                        daysActive > 7 ? 'text-red-400 group-hover:text-red-300' :
                                        daysActive > 3 ? 'text-amber-400 group-hover:text-amber-300' : 'text-green-400 group-hover:text-green-300'
                                    } transition-colors duration-300`}>
                                        {daysActive > 7 ? 'High' : daysActive > 3 ? 'Medium' : 'Normal'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Administrative Actions */}
                        <div className="space-y-6 border-t border-slate-700/50 pt-8">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-[0.2em] letter-spacing-1">Administrative</h3>

                            <button className="group w-full p-4 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/10 hover:from-red-500/20 hover:to-red-600/20 text-red-400 hover:text-red-300 transition-all duration-300 flex items-center justify-center gap-3 border border-red-500/20 hover:border-red-500/30 backdrop-blur-sm hover:shadow-lg hover:shadow-red-500/10">
                                <ArchiveIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                                <span className="font-semibold text-base tracking-wide">Archive Enquiry</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnquiryDetailsPage;

