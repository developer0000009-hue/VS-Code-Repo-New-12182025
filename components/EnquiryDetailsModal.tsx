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

interface EnquiryDetailsModalProps {
    enquiry: Enquiry;
    onClose: () => void;
    onUpdate: () => void;
    onNavigate?: (component: string) => void;
}

type Status = 'NEW' | 'VERIFIED' | 'IN_REVIEW' | 'CONVERTED';

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
    'VERIFIED': { 
        color: 'border-blue-300 bg-blue-50', 
        bg: 'bg-blue-500', 
        text: 'text-blue-700',
        icon: <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />,
        label: 'Verified'
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
            const { data, error } = await supabase
                .from('enquiry_timeline')
                .select('*')
                .eq('enquiry_id', enquiry.id)
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            setTimeline(data || []);
        } catch (err) {
            console.error('Failed to load timeline:', err);
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

    // Timeline items for visual progress
    const getTimelineProgress = () => {
        const steps = ['NEW', 'VERIFIED', 'IN_REVIEW', 'CONVERTED'];
        const currentIndex = steps.indexOf(status);
        
        return steps.map((step, index) => ({
            step,
            completed: index <= currentIndex,
            current: index === currentIndex
        }));
    };

    const progress = getTimelineProgress();

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div 
                className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header - Clean & Minimal */}
                <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center space-x-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{enquiry.applicant_name}</h2>
                            <div className="flex items-center space-x-4 mt-1">
                                <span className="text-sm text-gray-500">
                                    Grade {enquiry.grade} • ID #{enquiry.id.toString().slice(-6).toUpperCase()}
                                </span>
                                <span className="text-sm text-gray-400">•</span>
                                <span className="text-sm text-gray-500">{daysActive} days active</span>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center space-x-2 ${STATUS_CONFIG[status].color}`}>
                            {STATUS_CONFIG[status].icon}
                            <span className={STATUS_CONFIG[status].text}>
                                {STATUS_CONFIG[status].label}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={handleCallParent}
                            className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                            title="Call Parent"
                        >
                            <PhoneIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={handleWhatsApp}
                            className="p-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
                            title="WhatsApp"
                        >
                            <CommunicationIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Main Content - Two Column Layout */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Left Column - Information */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Quick Overview */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Verification</div>
                                <div className={`text-sm font-semibold mt-1 ${status === 'VERIFIED' || status === 'CONVERTED' ? 'text-green-600' : 'text-gray-400'}`}>
                                    {status === 'VERIFIED' || status === 'CONVERTED' ? 'Verified' : 'Pending'}
                                </div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Priority</div>
                                <div className="text-sm font-semibold mt-1 text-orange-600">
                                    {daysActive > 7 ? 'High' : daysActive > 3 ? 'Medium' : 'Normal'}
                                </div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Days Active</div>
                                <div className="text-sm font-semibold mt-1 text-gray-900">{daysActive}</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Source</div>
                                <div className="text-sm font-semibold mt-1 text-gray-900">
                                    {enquiry.source || 'Website'}
                                </div>
                            </div>
                        </div>

                        {/* Student & Enquiry Details */}
                        <div className="bg-gray-50 rounded-lg p-5">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <UserIcon className="w-5 h-5 mr-2" />
                                Student Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm text-gray-500">Student Name</span>
                                    <p className="text-base font-medium text-gray-900">{enquiry.applicant_name}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">Grade Applied For</span>
                                    <p className="text-base font-medium text-gray-900">Grade {enquiry.grade}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">Enquiry Date</span>
                                    <p className="text-base font-medium text-gray-900">
                                        {new Date(enquiry.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">Enquiry ID</span>
                                    <p className="text-base font-medium text-gray-900">#{enquiry.id.toString().slice(-6).toUpperCase()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Parent Contact Details */}
                        <div className="bg-gray-50 rounded-lg p-5">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <UserIcon className="w-5 h-5 mr-2" />
                                Parent Contact
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm text-gray-500">Parent Name</span>
                                    <p className="text-base font-medium text-gray-900">{enquiry.parent_name}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">Phone Number</span>
                                    <button 
                                        onClick={handleCallParent}
                                        className="text-base font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center"
                                    >
                                        {enquiry.parent_phone}
                                        <PhoneIcon className="w-4 h-4 ml-1" />
                                    </button>
                                </div>
                                <div className="md:col-span-2">
                                    <span className="text-sm text-gray-500">Email</span>
                                    <a 
                                        href={`mailto:${enquiry.parent_email}`}
                                        className="text-base font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center"
                                    >
                                        {enquiry.parent_email}
                                        <MailIcon className="w-4 h-4 ml-1" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Status Timeline - Simplified */}
                        <div className="bg-gray-50 rounded-lg p-5">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Timeline</h3>
                            <div className="space-y-3">
                                {progress.map((item, index) => (
                                    <div key={item.step} className="flex items-center space-x-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                            item.completed 
                                                ? 'bg-green-500 text-white' 
                                                : item.current 
                                                    ? 'bg-blue-500 text-white animate-pulse' 
                                                    : 'bg-gray-200 text-gray-400'
                                        }`}>
                                            {item.completed ? (
                                                <CheckCircleIcon className="w-4 h-4" />
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-current" />
                                            )}
                                        </div>
                                        <span className={`text-sm font-medium ${
                                            item.completed ? 'text-green-700' : 
                                            item.current ? 'text-blue-700' : 'text-gray-400'
                                        }`}>
                                            {STATUS_CONFIG[item.step as Status].label}
                                        </span>
                                        {item.current && (
                                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Actions & Communication */}
                    <div className="w-80 border-l border-gray-200 flex flex-col">
                        {/* Actions Panel */}
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={handleConvert}
                                    disabled={loading.converting || (status !== 'VERIFIED' && status !== 'IN_REVIEW') || enquiry.conversion_state === 'CONVERTED'}
                                    className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                                >
                                    {loading.converting ? (
                                        <Spinner size="sm" />
                                    ) : (
                                        <>
                                            <CheckCircleIcon className="w-4 h-4" />
                                            <span>Convert to Admission</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => setShowRejectForm(true)}
                                    disabled={loading.rejecting || status === 'REJECTED'}
                                    className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                                >
                                    {loading.rejecting ? (
                                        <Spinner size="sm" />
                                    ) : (
                                        <>
                                            <XIcon className="w-4 h-4" />
                                            <span>Reject Enquiry</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Communication Panel */}
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Communication</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Send Message to Parent
                                    </label>
                                    <textarea
                                        value={followUpNote}
                                        onChange={(e) => setFollowUpNote(e.target.value)}
                                        placeholder="Type your message..."
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={3}
                                    />
                                </div>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={loading.messaging || !followUpNote.trim()}
                                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                                >
                                    {loading.messaging ? (
                                        <Spinner size="sm" />
                                    ) : (
                                        <>
                                            <SendIcon className="w-4 h-4" />
                                            <span>Send Message</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Timeline Panel */}
                        <div className="p-6 border-t border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {timeline.length > 0 ? (
                                    timeline.map((item) => (
                                        <div key={item.id} className="flex items-start space-x-3">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-700">{item.details?.message || 'Status update'}</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(item.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-4">No timeline events yet</p>
                                )}
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
        </div>
    );
};

export default EnquiryDetailsModal;
