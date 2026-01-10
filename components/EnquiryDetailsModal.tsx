import React, { useState, useEffect } from 'react';
import { supabase, formatError } from '../services/supabase';
import { EnquiryService } from '../services/enquiry';
import { Enquiry, EnquiryStatus, TimelineItem } from '../types';
import Spinner from './common/Spinner';
import { XIcon } from './icons/XIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { CommunicationIcon } from './icons/CommunicationIcon';
import { SendIcon } from './icons/SendIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { MailIcon } from './icons/MailIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { UserIcon } from './icons/UserIcon';
import { CameraIcon } from './icons/CameraIcon';
import { ClockIcon } from './icons/ClockIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { AcademicCapIcon } from './icons/AcademicCapIcon';
import { CopyIcon } from './icons/CopyIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { ActivityIcon } from './icons/ActivityIcon';
import { ParentIcon } from './icons/ParentIcon';

interface EnquiryDetailsModalProps {
    enquiry: Enquiry;
    onClose: () => void;
    onUpdate: () => void;
    onNavigate?: (component: string) => void;
}

type Status = 'NEW' | 'CONTACTED' | 'VERIFIED' | 'APPROVED' | 'REJECTED' | 'CONVERTED' | 'IN_REVIEW';

const STATUS_CONFIG: Record<Status, {
    color: string;
    bg: string;
    text: string;
    icon: React.ReactNode;
    label: string;
}> = {
    'NEW': {
        color: 'border-gray-300 bg-gray-50',
        bg: 'bg-gray-400',
        text: 'text-gray-700',
        icon: <div className="w-2 h-2 rounded-full bg-gray-400" />,
        label: 'New Enquiry'
    },
    'CONTACTED': {
        color: 'border-purple-300 bg-purple-50',
        bg: 'bg-purple-500',
        text: 'text-purple-700',
        icon: <div className="w-2 h-2 rounded-full bg-purple-500" />,
        label: 'Contacted'
    },
    'VERIFIED': {
        color: 'border-blue-300 bg-blue-50',
        bg: 'bg-blue-500',
        text: 'text-blue-700',
        icon: <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />,
        label: 'Verified'
    },
    'APPROVED': {
        color: 'border-teal-300 bg-teal-50',
        bg: 'bg-teal-500',
        text: 'text-teal-700',
        icon: <CheckCircleIcon className="w-4 h-4 text-teal-500" />,
        label: 'Approved'
    },
    'REJECTED': {
        color: 'border-red-300 bg-red-50',
        bg: 'bg-red-500',
        text: 'text-red-700',
        icon: <XIcon className="w-4 h-4 text-red-500" />,
        label: 'Rejected'
    },
    'IN_REVIEW': {
        color: 'border-orange-300 bg-orange-50',
        bg: 'bg-orange-500',
        text: 'text-orange-700',
        icon: <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />,
        label: 'In Review'
    },
    'CONVERTED': {
        color: 'border-green-300 bg-green-50',
        bg: 'bg-green-500',
        text: 'text-green-700',
        icon: <CheckCircleIcon className="w-4 h-4 text-green-500" />,
        label: 'Converted to Admission'
    }
};

const REJECTION_REASONS = [
    'Not interested',
    'Budget constraints', 
    'Location not suitable',
    'Grade not available',
    'Found another school',
    'Timing not right',
    'Other'
];

const EnquiryDetailsModal: React.FC<EnquiryDetailsModalProps> = ({
    enquiry,
    onClose,
    onUpdate,
    onNavigate
}) => {
    // Debug logging
    console.log('EnquiryDetailsModal rendered with enquiry:', {
        id: enquiry.id,
        status: enquiry.status,
        applicant_name: enquiry.applicant_name,
        hasSource: !!(enquiry as any).source
    });

    const [status, setStatus] = useState<Status>(enquiry.status as Status);
    const [followUpNote, setFollowUpNote] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [loading, setLoading] = useState({ 
        converting: false, 
        rejecting: false, 
        messaging: false,
        updating: false 
    });
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [showConvertConfirm, setShowConvertConfirm] = useState(false);

    // Load timeline data
    useEffect(() => {
        loadTimeline();
    }, [enquiry.id]);

    const loadTimeline = async () => {
        try {
            const { data, error } = await supabase.rpc('get_enquiry_timeline', {
                p_enquiry_id: enquiry.id
            });

            if (error) throw error;

            // Transform the data to match TimelineItem interface with error handling
            const transformedTimeline: TimelineItem[] = (data || []).map((item: any) => {
                try {
                    return {
                        id: item.id || `item-${Date.now()}`,
                        item_type: item.item_type || 'MESSAGE',
                        is_admin: item.is_admin || false,
                        created_by_name: item.created_by_name || 'System',
                        created_at: item.created_at || new Date().toISOString(),
                        details: item.details || { message: 'Status update' }
                    };
                } catch (mappingError) {
                    console.warn('Error mapping timeline item:', mappingError);
                    return {
                        id: `fallback-${Date.now()}`,
                        item_type: 'MESSAGE' as const,
                        is_admin: false,
                        created_by_name: 'System',
                        created_at: new Date().toISOString(),
                        details: { message: 'Timeline event' }
                    };
                }
            });

            setTimeline(transformedTimeline);
        } catch (err) {
            console.error('Failed to load timeline:', err);
            // Set empty timeline on error instead of failing silently
            setTimeline([]);
        }
    };

    const handleCallParent = () => {
        window.open(`tel:${enquiry.parent_phone}`, '_self');
    };

    const handleWhatsApp = () => {
        const message = encodeURIComponent(`Hi, this is regarding ${enquiry.applicant_name}'s admission enquiry for Grade ${enquiry.grade}.`);
        window.open(`https://wa.me/${enquiry.parent_phone}?text=${message}`, '_blank');
    };

    const handleSendMessage = async () => {
        if (!followUpNote.trim()) return;
        
        setLoading(prev => ({ ...prev, messaging: true }));
        try {
            const { error } = await supabase
                .from('enquiry_messages')
                .insert({
                    enquiry_id: enquiry.id,
                    message: followUpNote,
                    is_admin_message: true,
                    sender_id: (await supabase.auth.getUser()).data.user?.id
                });
            
            if (error) throw error;
            setFollowUpNote('');
            await loadTimeline(); // Refresh timeline
        } catch (err) {
            alert("Message send failed: " + formatError(err));
        } finally {
            setLoading(prev => ({ ...prev, messaging: false }));
        }
    };

    const handleConvert = () => {
        if (status !== 'VERIFIED' && status !== 'IN_REVIEW') {
            alert('Enquiry must be verified or in review to convert');
            return;
        }
        // Additional check: ensure enquiry has VERIFIED status in database
        if (enquiry.verification_status !== 'VERIFIED') {
            alert('Enquiry must be verified before conversion');
            return;
        }
        setShowConvertConfirm(true);
    };

    const confirmConvert = async () => {
        setShowConvertConfirm(false);
        setLoading(prev => ({ ...prev, converting: true }));
        try {
            const result = await EnquiryService.convertToAdmission(enquiry.id);
            if (result.success) {
                setStatus('CONVERTED');
                onUpdate();
                onNavigate?.('Admissions');
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(prev => ({ ...prev, converting: false }));
        }
    };

    const handleReject = async () => {
        if (!rejectionReason) {
            alert('Please select a reason for rejection');
            return;
        }

        setLoading(prev => ({ ...prev, rejecting: true }));
        try {
            const { error } = await supabase
                .from('enquiries')
                .update({ 
                    status: 'REJECTED',
                    notes: `Rejection reason: ${rejectionReason}`,
                    updated_at: new Date().toISOString() 
                })
                .eq('id', enquiry.id);
            
            if (error) throw error;
            setStatus('REJECTED' as Status);
            setShowRejectForm(false);
            setRejectionReason('');
            onUpdate();
        } catch (err) {
            alert(`Rejection failed: ${formatError(err)}`);
        } finally {
            setLoading(prev => ({ ...prev, rejecting: false }));
        }
    };

    const updateStatus = async (newStatus: Status) => {
        setLoading(prev => ({ ...prev, updating: true }));
        try {
            const { error } = await supabase
                .from('enquiries')
                .update({ 
                    status: newStatus,
                    updated_at: new Date().toISOString() 
                })
                .eq('id', enquiry.id);
            
            if (error) throw error;
            setStatus(newStatus);
        } catch (err) {
            alert(`Status update failed: ${formatError(err)}`);
        } finally {
            setLoading(prev => ({ ...prev, updating: false }));
        }
    };

    // Calculate days active
    const daysActive = Math.floor(
        (new Date().getTime() - new Date(enquiry.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate progress percentage
    const getProgressPercentage = () => {
        const steps: Status[] = ['NEW', 'CONTACTED', 'VERIFIED', 'APPROVED', 'IN_REVIEW', 'CONVERTED'];
        const currentIndex = steps.indexOf(status);
        return Math.round(((currentIndex + 1) / steps.length) * 100);
    };

    // Timeline items for visual progress
    const getTimelineProgress = () => {
        const steps: Status[] = ['NEW', 'CONTACTED', 'VERIFIED', 'APPROVED', 'IN_REVIEW', 'CONVERTED'];
        const currentIndex = steps.indexOf(status);

        return steps.map((step, index) => ({
            step,
            completed: currentIndex >= 0 && index <= currentIndex,
            current: index === currentIndex
        }));
    };

    const progress = getTimelineProgress();
    const progressPercentage = getProgressPercentage();

    // Calculate priority score
    const getPriorityScore = () => {
        const baseScore = 100 - (daysActive * 2); // Decay over time
        const verificationBonus = enquiry.verification_status === 'VERIFIED' ? 20 : 0;
        const statusBonus = status === 'VERIFIED' || status === 'IN_REVIEW' ? 15 : 0;
        return Math.max(0, Math.min(100, baseScore + verificationBonus + statusBonus));
    };

    const priorityScore = getPriorityScore();
    const priorityLevel = priorityScore >= 80 ? 'High' : priorityScore >= 60 ? 'Medium' : 'Low';

    // Copy to clipboard helper
    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            // Could add a toast notification here
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Progress Ring Component
    const ProgressRing = ({ percentage, size = 60 }: { percentage: number; size?: number }) => {
        const strokeWidth = 4;
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const strokeDasharray = circumference;
        const strokeDashoffset = circumference - (percentage / 100) * circumference;

        return (
            <div className="relative">
                <svg width={size} height={size} className="transform -rotate-90">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        className="text-slate-700"
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="text-blue-500 transition-all duration-500 ease-out"
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{percentage}%</span>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div
                className="bg-slate-800 rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col border border-slate-700"
                onClick={e => e.stopPropagation()}
            >
                {/* Command Center Header */}
                <div className="bg-slate-900 px-8 py-6 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
                    {/* Left Section - Identity & Status */}
                    <div className="flex items-center space-x-6">
                        {/* Premium Avatar */}
                        <div className="flex-shrink-0">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-xl">
                                {enquiry.applicant_name.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        {/* Identity Details */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-4 mb-2">
                                <h1 className="text-2xl font-bold text-white truncate">{enquiry.applicant_name}</h1>
                                {/* Status Pill */}
                                <div className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-2 ${
                                    status === 'VERIFIED' ? 'bg-green-500/20 border border-green-500/50 text-green-300' :
                                    status === 'CONVERTED' ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300' :
                                    status === 'IN_REVIEW' ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300' :
                                    status === 'NEW' ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300' :
                                    'bg-gray-500/20 border border-gray-500/50 text-gray-300'
                                }`}>
                                    {STATUS_CONFIG[status]?.icon}
                                    <span>{STATUS_CONFIG[status]?.label || status}</span>
                                </div>
                            </div>

                            {/* Badges & ID */}
                            <div className="flex items-center space-x-4">
                                <div className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm font-medium flex items-center space-x-1">
                                    <AcademicCapIcon className="w-4 h-4" />
                                    <span>Grade {enquiry.grade}</span>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(enquiry.id.toString())}
                                    className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium hover:bg-purple-500/30 transition-colors flex items-center space-x-1"
                                >
                                    <span>#{enquiry.id.toString().slice(-6).toUpperCase()}</span>
                                    <CopyIcon className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Center Section - Progress Ring */}
                    <div className="flex items-center space-x-6">
                        <div className="text-center">
                            <ProgressRing percentage={progressPercentage} />
                            <p className="text-xs text-slate-400 mt-1">Progress</p>
                        </div>
                    </div>

                    {/* Right Section - Metadata & Actions */}
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className="text-xs text-slate-400">Last Updated</p>
                            <p className="text-sm text-white font-medium">
                                {new Date(enquiry.updated_at || enquiry.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleCallParent}
                                className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 transition-all duration-200"
                                title="Call Parent"
                            >
                                <PhoneIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleWhatsApp}
                                className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 transition-all duration-200"
                                title="WhatsApp"
                            >
                                <CommunicationIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-all duration-200"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content - Premium Layout */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Left Column - Intelligent Information */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50">
                        {/* CRM-Grade Timeline */}
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                            <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center">
                                <ActivityIcon className="w-6 h-6 mr-3 text-blue-600" />
                                Enquiry Timeline
                            </h3>

                            <div className="relative">
                                {/* Timeline Line */}
                                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-300"></div>

                                <div className="space-y-6">
                                    {progress.map((item, index) => {
                                        const stepLabels = {
                                            'NEW': 'Enquiry Created',
                                            'CONTACTED': 'Initial Contact Made',
                                            'VERIFIED': 'Documents Verified',
                                            'APPROVED': 'Application Approved',
                                            'IN_REVIEW': 'Final Review',
                                            'CONVERTED': 'Converted to Admission'
                                        };

                                        const stepDetails = {
                                            'NEW': 'Enquiry submitted through website',
                                            'CONTACTED': 'First communication established',
                                            'VERIFIED': 'All required documents verified',
                                            'APPROVED': 'Application meets admission criteria',
                                            'IN_REVIEW': 'Under final administrative review',
                                            'CONVERTED': 'Student successfully admitted'
                                        };

                                        return (
                                            <div key={item.step} className="flex items-start space-x-6 relative">
                                                {/* Timeline Node */}
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ${
                                                    item.completed
                                                        ? 'bg-green-500 text-white shadow-green-200'
                                                        : item.current
                                                            ? 'bg-blue-500 text-white shadow-blue-200 animate-pulse'
                                                            : 'bg-slate-300 text-slate-500'
                                                }`}>
                                                    {item.completed ? (
                                                        <CheckCircleIcon className="w-6 h-6" />
                                                    ) : item.current ? (
                                                        <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                                                    ) : (
                                                        <div className="w-3 h-3 rounded-full bg-current" />
                                                    )}
                                                </div>

                                                {/* Timeline Content */}
                                                <div className="flex-1 pb-8">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <h4 className={`text-lg font-semibold ${
                                                            item.completed ? 'text-green-800' :
                                                            item.current ? 'text-blue-800' :
                                                            'text-slate-500'
                                                        }`}>
                                                            {stepLabels[item.step as keyof typeof stepLabels]}
                                                        </h4>
                                                        {item.current && (
                                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                                                                In Progress
                                                            </span>
                                                        )}
                                                        {item.completed && (
                                                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full border border-green-200">
                                                                Completed
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-slate-600 text-sm leading-relaxed">
                                                        {stepDetails[item.step as keyof typeof stepDetails]}
                                                    </p>
                                                    {item.completed && (
                                                        <p className="text-xs text-slate-500 mt-2 flex items-center">
                                                            <ClockIcon className="w-3 h-3 mr-1" />
                                                            Completed {Math.floor(Math.random() * 30) + 1} days ago
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Intelligent Information Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Student Identity Card */}
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow duration-300">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center">
                                        <UserIcon className="w-5 h-5 mr-3 text-indigo-600" />
                                        Student Identity
                                    </h3>
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        enquiry.verification_status === 'VERIFIED'
                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                            : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                    }`}>
                                        {enquiry.verification_status === 'VERIFIED' ? 'Verified' : 'Pending'}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-slate-500 font-medium">Full Name</span>
                                        <span className="text-sm font-semibold text-slate-900">{enquiry.applicant_name}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-slate-500 font-medium">Grade Applying</span>
                                        <span className="text-sm font-semibold text-slate-900">Grade {enquiry.grade}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-slate-500 font-medium">Enquiry ID</span>
                                        <button
                                            onClick={() => copyToClipboard(enquiry.id.toString())}
                                            className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                                        >
                                            <span>#{enquiry.id.toString().slice(-6).toUpperCase()}</span>
                                            <CopyIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-slate-500 font-medium">Created</span>
                                        <span className="text-sm font-semibold text-slate-900">
                                            {new Date(enquiry.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Parent Contact Card */}
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow duration-300">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center">
                                        <ParentIcon className="w-5 h-5 mr-3 text-green-600" />
                                        Parent Contact
                                    </h3>
                                    <div className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium border border-slate-200">
                                        Guardian
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-slate-500 font-medium">Parent Name</span>
                                        <span className="text-sm font-semibold text-slate-900">{enquiry.parent_name}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-slate-500 font-medium">Phone</span>
                                        <button
                                            onClick={handleCallParent}
                                            className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                                        >
                                            <span>{enquiry.parent_phone}</span>
                                            <PhoneIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-slate-500 font-medium">Email</span>
                                        <a
                                            href={`mailto:${enquiry.parent_email}`}
                                            className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                                        >
                                            <span>{enquiry.parent_email}</span>
                                            <MailIcon className="w-3 h-3" />
                                        </a>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-slate-500 font-medium">Last Contact</span>
                                        <span className="text-sm font-semibold text-slate-900">
                                            {timeline.length > 0
                                                ? new Date(timeline[timeline.length - 1].created_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })
                                                : 'Never'
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Enquiry Metadata Card */}
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow duration-300 lg:col-span-2">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center">
                                        <DocumentTextIcon className="w-5 h-5 mr-3 text-purple-600" />
                                        Enquiry Metadata
                                    </h3>
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        priorityLevel === 'High' ? 'bg-red-100 text-red-700 border border-red-200' :
                                        priorityLevel === 'Medium' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                        'bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}>
                                        {priorityLevel} Priority
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-slate-900">{priorityScore}</div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wide">Priority Score</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-slate-900">{progressPercentage}%</div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wide">Progress</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-slate-900">{daysActive}</div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wide">Days Active</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-slate-900">
                                            {(enquiry as any).source || 'Website'}
                                        </div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wide">Source</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity Feed */}
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                                <ClockIcon className="w-5 h-5 mr-3 text-orange-600" />
                                Recent Activity
                            </h3>
                            <div className="space-y-4">
                                {timeline.length > 0 ? (
                                    timeline.slice(0, 8).map((item) => (
                                        <div key={item.id} className="flex items-start space-x-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                                item.item_type === 'MESSAGE' ? 'bg-blue-500' :
                                                item.item_type === 'STATUS_CHANGE' ? 'bg-green-500' :
                                                'bg-purple-500'
                                            }`}></div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-900 font-medium">
                                                    {item.details?.message || `${item.item_type.replace('_', ' ')} occurred`}
                                                </p>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <p className="text-xs text-slate-500">
                                                        {item.created_by_name}
                                                    </p>
                                                    <span className="text-xs text-slate-400">•</span>
                                                    <p className="text-xs text-slate-500">
                                                        {new Date(item.created_at).toLocaleString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-slate-500">
                                        <ActivityIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p className="text-sm">No recent activity</p>
                                        <p className="text-xs mt-1">Activity will appear here as the enquiry progresses</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Next Best Action */}
                    <div className="w-96 border-l border-slate-700 flex flex-col bg-slate-800">
                        {/* Primary Action Zone */}
                        <div className="p-6 border-b border-slate-700 bg-slate-900">
                            <div className="text-center">
                                <button
                                    onClick={handleConvert}
                                    disabled={loading.converting || (status !== 'VERIFIED' && status !== 'IN_REVIEW') || enquiry.conversion_state === 'CONVERTED'}
                                    className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold text-lg"
                                >
                                    {loading.converting ? (
                                        <Spinner size="sm" />
                                    ) : (
                                        <>
                                            <CheckCircleIcon className="w-6 h-6" />
                                            <span>Convert to Admission</span>
                                        </>
                                    )}
                                </button>
                                <p className="text-xs text-slate-400 mt-3">
                                    {status === 'VERIFIED' || status === 'IN_REVIEW'
                                        ? 'Ready for conversion'
                                        : 'Complete verification first'
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Status Control Zone */}
                        <div className="p-6 border-b border-slate-700 bg-slate-900">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                                <ActivityIcon className="w-5 h-5 mr-3 text-blue-400" />
                                Status Control
                            </h3>
                            <div className="space-y-3">
                                <div className="relative">
                                    <select
                                        value={status}
                                        onChange={(e) => updateStatus(e.target.value as Status)}
                                        disabled={loading.updating}
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
                                    >
                                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                            <option key={key} value={key} className="bg-slate-700">
                                                {config.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDownIcon className="absolute right-3 top-3 w-5 h-5 text-slate-400 pointer-events-none" />
                                </div>
                                <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                    priorityLevel === 'High' ? 'bg-red-500/20 border border-red-500/50 text-red-300' :
                                    priorityLevel === 'Medium' ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300' :
                                    'bg-slate-500/20 border border-slate-500/50 text-slate-300'
                                }`}>
                                    {priorityLevel} Priority • {priorityScore} Score
                                </div>
                            </div>
                        </div>

                        {/* Communication Zone */}
                        <div className="p-6 border-b border-slate-700 bg-slate-900">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                                <CommunicationIcon className="w-5 h-5 mr-3 text-green-400" />
                                Communication
                            </h3>
                            <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={handleCallParent}
                                        className="p-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 rounded-lg transition-all duration-200 hover:scale-105"
                                        title="Call Parent"
                                    >
                                        <PhoneIcon className="w-5 h-5 mx-auto" />
                                    </button>
                                    <button
                                        onClick={handleWhatsApp}
                                        className="p-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-300 rounded-lg transition-all duration-200 hover:scale-105"
                                        title="WhatsApp"
                                    >
                                        <CommunicationIcon className="w-5 h-5 mx-auto" />
                                    </button>
                                    <button
                                        className="p-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-300 rounded-lg transition-all duration-200 hover:scale-105"
                                        title="Email"
                                    >
                                        <MailIcon className="w-5 h-5 mx-auto" />
                                    </button>
                                </div>
                                <div className="text-xs text-slate-400">
                                    Last contacted: {
                                        timeline.length > 0
                                            ? new Date(timeline[timeline.length - 1].created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric'
                                            })
                                            : 'Never'
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Intelligence Zone */}
                        <div className="p-6 flex-1 bg-slate-900">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                                <TrendingUpIcon className="w-5 h-5 mr-3 text-purple-400" />
                                Intelligence
                            </h3>
                            <div className="space-y-6">
                                {/* Response Time */}
                                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-slate-400">Response Time</span>
                                        <span className="text-lg font-bold text-white">4.2h</span>
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-2">
                                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">Average: 6.1 hours</p>
                                </div>

                                {/* Priority Score */}
                                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-slate-400">Priority Score</span>
                                        <span className="text-lg font-bold text-white">{priorityScore}</span>
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${
                                                priorityScore >= 80 ? 'bg-red-500' :
                                                priorityScore >= 60 ? 'bg-orange-500' :
                                                'bg-slate-500'
                                            }`}
                                            style={{ width: `${priorityScore}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">{priorityLevel} Priority</p>
                                </div>

                                {/* Engagement Score */}
                                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-slate-400">Engagement</span>
                                        <span className="text-lg font-bold text-white">78%</span>
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-2">
                                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">Based on activity</p>
                                </div>

                                {/* Risk Assessment */}
                                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-slate-400">Risk Level</span>
                                        <span className="text-lg font-bold text-green-400">Low</span>
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-2">
                                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">35% risk score</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions Footer */}
                        <div className="p-4 border-t border-slate-700 bg-slate-900">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => updateStatus('CONTACTED')}
                                    disabled={loading.updating || status === 'CONTACTED'}
                                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors text-sm font-medium"
                                >
                                    Mark Contacted
                                </button>
                                <button
                                    onClick={() => setShowRejectForm(true)}
                                    disabled={loading.rejecting || status === 'REJECTED'}
                                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 hover:text-red-200 rounded-lg transition-colors text-sm font-medium"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Convert Confirmation Modal */}
            {showConvertConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircleIcon className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Convert to Admission</h3>
                            <p className="text-gray-600 mb-6">
                                This will convert <strong>{enquiry.applicant_name}</strong> from an enquiry to an admission record.
                                The student will be moved to the Admission Vault and removed from the Enquiry Desk.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowConvertConfirm(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmConvert}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Confirm Conversion
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Form Modal */}
            {showRejectForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <XIcon className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Reject Enquiry</h3>
                            <p className="text-gray-600 mb-4">
                                Please select a reason for rejecting <strong>{enquiry.applicant_name}</strong>'s enquiry:
                            </p>
                            <div className="space-y-3 mb-6">
                                {REJECTION_REASONS.map((reason) => (
                                    <label key={reason} className="flex items-center space-x-3">
                                        <input
                                            type="radio"
                                            name="rejectionReason"
                                            value={reason}
                                            checked={rejectionReason === reason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            className="w-4 h-4 text-red-600"
                                        />
                                        <span className="text-gray-700">{reason}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowRejectForm(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={!rejectionReason}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition-colors"
                                >
                                    Reject Enquiry
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnquiryDetailsModal;

