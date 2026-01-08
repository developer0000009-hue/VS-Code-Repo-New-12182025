import React, { useState } from 'react';
import { supabase, formatError } from '../services/supabase';
import { EnquiryService } from '../services/enquiry';
import { Enquiry, EnquiryStatus } from '../types';
import Spinner from './common/Spinner';
import { XIcon } from './icons/XIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { CommunicationIcon } from './icons/CommunicationIcon';
import { SendIcon } from './icons/SendIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface EnquiryDetailsModalProps {
    enquiry: Enquiry;
    onClose: () => void;
    onUpdate: () => void;
    onNavigate?: (component: string) => void;
}

type NewEnquiryStatus = 'In Progress' | 'Converted' | 'Rejected';

const STATUS_CONFIG: Record<string, { 
    color: string; 
    bg: string; 
    text: string;
    icon: React.ReactNode;
}> = {
    'In Progress': { 
        color: 'border-blue-500 bg-blue-50', 
        bg: 'bg-blue-500', 
        text: 'text-blue-700',
        icon: <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
    },
    'Converted': { 
        color: 'border-green-500 bg-green-50', 
        bg: 'bg-green-500', 
        text: 'text-green-700',
        icon: <CheckCircleIcon className="w-4 h-4 text-green-500" />
    },
    'Rejected': { 
        color: 'border-red-500 bg-red-50', 
        bg: 'bg-red-500', 
        text: 'text-red-700',
        icon: <div className="w-2 h-2 rounded-full bg-red-500" />
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
    const [status, setStatus] = useState<NewEnquiryStatus>('In Progress');
    const [interestDecision, setInterestDecision] = useState<'interested' | 'not_interested' | null>(null);
    const [followUpNote, setFollowUpNote] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [loading, setLoading] = useState({ 
        converting: false, 
        rejecting: false, 
        saving: false,
        messaging: false 
    });

    // Convert legacy status to new format
    React.useEffect(() => {
        if (enquiry.status === 'CONVERTED') setStatus('Converted');
        else if (enquiry.status === 'REJECTED') setStatus('Rejected');
        else setStatus('In Progress');
    }, [enquiry.status]);

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
            const { error } = await supabase.rpc('send_enquiry_message', { 
                p_node_id: enquiry.id, 
                p_message: followUpNote 
            });
            if (error) throw error;
            setFollowUpNote('');
        } catch (err) {
            alert("Message send failed: " + formatError(err));
        } finally {
            setLoading(prev => ({ ...prev, messaging: false }));
        }
    };

    const handleConvert = async () => {
        setLoading(prev => ({ ...prev, converting: true }));
        try {
            const result = await EnquiryService.convertToAdmission(enquiry.id);
            if (result.success) {
                onUpdate();
                onClose();
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
            setStatus('Rejected');
            onUpdate();
        } catch (err) {
            alert(`Rejection failed: ${formatError(err)}`);
        } finally {
            setLoading(prev => ({ ...prev, rejecting: false }));
        }
    };

    const handleInterestDecision = (decision: 'interested' | 'not_interested') => {
        setInterestDecision(decision);
    };

    const handleMarkContacted = () => {
        setFollowUpNote(prev => prev + `[${new Date().toLocaleDateString()}] Marked as contacted. `);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header Section */}
                <div className="bg-gray-50 px-8 py-6 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-3xl font-bold text-gray-900">{enquiry.applicant_name}</h2>
                        <span className="text-sm text-gray-500 font-medium">
                            ID: #{enquiry.id.toString().slice(-6).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className={`px-4 py-2 rounded-full border-2 ${
                            STATUS_CONFIG[status].color
                        } flex items-center space-x-2`}>
                            {STATUS_CONFIG[status].icon}
                            <span className={`text-sm font-bold ${STATUS_CONFIG[status].text}`}>
                                {status}
                            </span>
                        </div>
                        <div className="flex space-x-2">
                            <button 
                                onClick={handleCallParent}
                                className="p-3 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors"
                                title="Call Parent"
                            >
                                <PhoneIcon className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={handleWhatsApp}
                                className="p-3 rounded-full bg-green-100 hover:bg-green-200 text-green-600 transition-colors"
                                title="WhatsApp"
                            >
                                <CommunicationIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                        >
                            <XIcon className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="p-8 space-y-8 max-h-[calc(95vh-120px)] overflow-y-auto">
                    {/* Student & Enquiry Info */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Student Information</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <span className="text-sm font-medium text-gray-500">Student Name</span>
                                <p className="text-base text-gray-900 font-semibold">{enquiry.applicant_name}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-500">Age</span>
                                <p className="text-base text-gray-900 font-semibold">{enquiry.age || 'N/A'}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-500">Grade Applied For</span>
                                <p className="text-base text-gray-900 font-semibold">{enquiry.grade}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-500">Enquiry Date</span>
                                <p className="text-base text-gray-900 font-semibold">
                                    {new Date(enquiry.updated_at || enquiry.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-500">Source</span>
                                <p className="text-base text-gray-900 font-semibold">{enquiry.source || 'Website'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Parent Contact & Communication */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Parent Contact & Communication</h3>
                            <button 
                                onClick={handleMarkContacted}
                                className="px-4 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                            >
                                Mark as Contacted
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <span className="text-sm font-medium text-gray-500">Parent Name</span>
                                <p className="text-base text-gray-900 font-semibold">{enquiry.parent_name}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-500">Phone Number</span>
                                <p className="text-base text-gray-900 font-semibold">{enquiry.parent_phone}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-500">Email</span>
                                <p className="text-base text-gray-900 font-semibold">{enquiry.parent_email}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-500">Last Contacted On</span>
                                <p className="text-base text-gray-900 font-semibold">Today</p>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Add Follow-up Note
                            </label>
                            <textarea 
                                value={followUpNote}
                                onChange={(e) => setFollowUpNote(e.target.value)}
                                placeholder="Enter follow-up notes..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                rows={3}
                            />
                            <button 
                                onClick={handleSendMessage}
                                disabled={!followUpNote.trim() || loading.messaging}
                                className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center space-x-2"
                            >
                                {loading.messaging ? (
                                    <Spinner size="sm" />
                                ) : (
                                    <>
                                        <SendIcon className="w-4 h-4" />
                                        <span>Add Note</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Admission Interest Decision */}
                    {status === 'In Progress' && (
                        <div className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                                Admission Interest Decision
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Is the parent interested in proceeding with admission?
                            </p>
                            
                            <div className="flex space-x-6 mb-6">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input 
                                        type="radio"
                                        name="interest"
                                        value="interested"
                                        checked={interestDecision === 'interested'}
                                        onChange={() => handleInterestDecision('interested')}
                                        className="w-4 h-4 text-green-600"
                                    />
                                    <span className="text-green-700 font-semibold">✅ Interested</span>
                                </label>
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input 
                                        type="radio"
                                        name="interest"
                                        value="not_interested"
                                        checked={interestDecision === 'not_interested'}
                                        onChange={() => handleInterestDecision('not_interested')}
                                        className="w-4 h-4 text-red-600"
                                    />
                                    <span className="text-red-700 font-semibold">❌ Not Interested</span>
                                </label>
                            </div>

                            {/* Conditional Actions */}
                            {interestDecision === 'interested' && (
                                <div className="space-y-4">
                                    <button 
                                        onClick={handleConvert}
                                        disabled={loading.converting}
                                        className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2"
                                    >
                                        {loading.converting ? (
                                            <Spinner size="sm" />
                                        ) : (
                                            <>
                                                <CheckCircleIcon className="w-5 h-5" />
                                                <span>Convert to Admission</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {interestDecision === 'not_interested' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                                            Reason for Rejection
                                        </label>
                                        <div className="relative">
                                            <select 
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none"
                                            >
                                                <option value="">Select a reason...</option>
                                                {REJECTION_REASONS.map(reason => (
                                                    <option key={reason} value={reason}>{reason}</option>
                                                ))}
                                            </select>
                                            <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleReject}
                                        disabled={loading.rejecting || !rejectionReason}
                                        className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2"
                                    >
                                        {loading.rejecting ? (
                                            <Spinner size="sm" />
                                        ) : (
                                            <>
                                                <span>Reject Enquiry</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Status & Progress */}
                    {status !== 'In Progress' && (
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Progress Summary</h3>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                    <span className="text-gray-700">Enquiry Created</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                    <span className="text-gray-700">Parent Contacted</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    {status === 'Converted' ? (
                                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-red-500 bg-red-500" />
                                    )}
                                    <span className="text-gray-700">Decision Taken</span>
                                    <span className="text-sm text-gray-500 ml-2">
                                        ({status === 'Converted' ? 'Converted to Admission' : 'Enquiry Rejected'})
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EnquiryDetailsModal;
