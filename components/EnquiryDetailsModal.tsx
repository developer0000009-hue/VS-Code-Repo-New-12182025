import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, formatError } from '../services/supabase';
import { EnquiryService } from '../services/enquiry';
import { Enquiry, TimelineItem, EnquiryStatus } from '../types';
import Spinner from './common/Spinner';
import { XIcon } from './icons/XIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { GraduationCapIcon } from './icons/GraduationCapIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CommunicationIcon } from './icons/CommunicationIcon';
import { UsersIcon } from './icons/UsersIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { MailIcon } from './icons/MailIcon';
import { AcademicCapIcon } from './icons/AcademicCapIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { EyeIcon } from './icons/EyeIcon';
import { EditIcon } from './icons/EditIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';

const LocalSendIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

const STATUS_CONFIG: Record<string, {
    label: string;
    color: string;
    bg: string;
    progress: number;
    nextAction: string;
    canConvert: boolean;
}> = {
    'New': {
        label: 'New Enquiry',
        color: 'text-blue-700',
        bg: 'bg-blue-50 border-blue-200',
        progress: 10,
        nextAction: 'Contact parent and verify details',
        canConvert: false
    },
    'ENQUIRY_ACTIVE': {
        label: 'Active',
        color: 'text-blue-700',
        bg: 'bg-blue-50 border-blue-200',
        progress: 25,
        nextAction: 'Verify parent contact information',
        canConvert: false
    },
    'ENQUIRY_VERIFIED': {
        label: 'Verified',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50 border-emerald-200',
        progress: 60,
        nextAction: 'Request required documents',
        canConvert: true
    },
    'VERIFIED': {
        label: 'Verified',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50 border-emerald-200',
        progress: 60,
        nextAction: 'Request required documents',
        canConvert: true
    },
    'ENQUIRY_IN_PROGRESS': {
        label: 'In Progress',
        color: 'text-amber-700',
        bg: 'bg-amber-50 border-amber-200',
        progress: 80,
        nextAction: 'Review submitted documents',
        canConvert: true
    },
    'IN_REVIEW': {
        label: 'In Review',
        color: 'text-amber-700',
        bg: 'bg-amber-50 border-amber-200',
        progress: 80,
        nextAction: 'Review submitted documents',
        canConvert: true
    },
    'CONVERTED': {
        label: 'Converted',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50 border-emerald-200',
        progress: 100,
        nextAction: 'Admission process complete',
        canConvert: false
    },
    'Completed': {
        label: 'Completed',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50 border-emerald-200',
        progress: 100,
        nextAction: 'Admission process complete',
        canConvert: false
    },
};

const PROGRESS_STEPS = [
    { label: 'Enquiry Created', status: 'completed' },
    { label: 'Contact Verified', status: 'pending' },
    { label: 'Documents Requested', status: 'pending' },
    { label: 'Review Complete', status: 'pending' },
    { label: 'Ready for Admission', status: 'pending' }
];

interface EnquiryDetailsModalProps {
    enquiry: Enquiry;
    onClose: () => void;
    onUpdate: () => void;
    currentBranchId?: string | null;
    onNavigate?: (component: string) => void;
}

// Helper Components
const SkeletonLoader: React.FC<{ className?: string }> = ({ className = "h-4 w-32" }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

const EditableField: React.FC<{
    label: string;
    value: string;
    onSave: (value: string) => void;
    required?: boolean;
    missing?: boolean;
}> = ({ label, value, onSave, required, missing }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);

    const handleSave = () => {
        onSave(editValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(value);
        setIsEditing(false);
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            {isEditing ? (
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') handleCancel();
                        }}
                    />
                    <button
                        onClick={handleSave}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                        <CheckIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleCancel}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div
                    className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border-2 ${
                        missing ? 'border-amber-200 bg-amber-50' : 'border-transparent'
                    }`}
                    onClick={() => setIsEditing(true)}
                >
                    <span className={`text-sm ${!value ? 'text-gray-400 italic' : 'text-gray-900'}`}>
                        {value || 'Not provided'}
                        {required && !value && <span className="text-red-500 ml-1">*</span>}
                    </span>
                    <EditIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            )}
        </div>
    );
};

const SummaryChip: React.FC<{
    label: string;
    value: string;
    icon?: React.ReactNode;
    color?: string;
}> = ({ label, value, icon, color = 'text-gray-600' }) => (
    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
        {icon && <div className="text-gray-400">{icon}</div>}
        <div>
            <div className="text-xs text-gray-500 font-medium">{label}</div>
            <div className={`text-sm font-semibold ${color}`}>{value}</div>
        </div>
    </div>
);

const TimelineStep: React.FC<{
    step: typeof PROGRESS_STEPS[0];
    isCompleted: boolean;
    isCurrent: boolean;
    isLast: boolean;
}> = ({ step, isCompleted, isCurrent, isLast }) => (
    <div className="flex items-start gap-3">
        <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' :
                isCurrent ? 'bg-blue-500 border-blue-500 text-white' :
                'bg-white border-gray-300 text-gray-400'
            }`}>
                {isCompleted ? (
                    <CheckIcon className="w-4 h-4" />
                ) : (
                    <span className="text-xs font-semibold">
                        {isCurrent ? '●' : '○'}
                    </span>
                )}
            </div>
            {!isLast && (
                <div className={`w-0.5 h-12 mt-2 ${
                    isCompleted ? 'bg-emerald-500' : 'bg-gray-300'
                }`} />
            )}
        </div>
        <div className="pb-6">
            <div className={`text-sm font-medium ${
                isCompleted ? 'text-emerald-700' :
                isCurrent ? 'text-blue-700' :
                'text-gray-500'
            }`}>
                {step.label}
            </div>
            {isCurrent && (
                <div className="text-xs text-gray-600 mt-1">Current step</div>
            )}
        </div>
    </div>
);

const MessageBubble: React.FC<{
    message: string;
    isAdmin: boolean;
    timestamp: string;
    sender: string;
}> = ({ message, isAdmin, timestamp, sender }) => (
    <div className={`flex gap-3 ${isAdmin ? 'justify-end' : 'justify-start'} mb-4`}>
        {!isAdmin && (
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
                {sender.charAt(0)}
            </div>
        )}
        <div className={`max-w-[70%] ${isAdmin ? 'order-first' : ''}`}>
            <div className={`p-3 rounded-lg ${
                isAdmin ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'
            }`}>
                <p className="text-sm leading-relaxed">{message}</p>
            </div>
            <div className={`text-xs text-gray-500 mt-1 ${isAdmin ? 'text-right' : 'text-left'}`}>
                {sender} • {timestamp}
            </div>
        </div>
        {isAdmin && (
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                {sender.charAt(0)}
            </div>
        )}
    </div>
);

const EnquiryDetailsModal: React.FC<EnquiryDetailsModalProps> = ({
    enquiry,
    onClose,
    onUpdate,
    onNavigate
}) => {
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [formData, setFormData] = useState({
        applicant_name: enquiry.applicant_name || '',
        parent_name: enquiry.parent_name || '',
        parent_email: enquiry.parent_email || '',
        parent_phone: enquiry.parent_phone || '',
        notes: enquiry.notes || '',
    });
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState({
        timeline: true,
        saving: false,
        converting: false,
        sending: false
    });
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'communication'>('overview');
    const commsEndRef = useRef<HTMLDivElement>(null);

    // Calculate derived data
    const daysActive = Math.floor((new Date().getTime() - new Date(enquiry.received_at || enquiry.updated_at).getTime()) / (1000 * 3600 * 24));
    const priorityLevel = daysActive > 7 ? 'High' : daysActive > 3 ? 'Medium' : 'Low';
    const priorityColor = priorityLevel === 'High' ? 'text-red-600' :
                         priorityLevel === 'Medium' ? 'text-amber-600' : 'text-green-600';
    const currentStatus = STATUS_CONFIG[enquiry.status] || STATUS_CONFIG['New'];
    const lastActivity = timeline.length > 0 ? timeline[0].created_at : enquiry.updated_at;

    const fetchTimeline = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(prev => ({ ...prev, timeline: true }));
        try {
            const { data, error } = await supabase.rpc('get_enquiry_timeline', { p_enquiry_id: enquiry.id });
            if (error) throw error;
            setTimeline(data || []);
        } catch (err) {
            console.error("Timeline fetch error:", err);
            setError("Failed to load timeline. Please refresh the page.");
        } finally {
            if (!isSilent) setLoading(prev => ({ ...prev, timeline: false }));
        }
    }, [enquiry.id]);

    useEffect(() => {
        fetchTimeline();
    }, [fetchTimeline]);

    useEffect(() => {
        if (commsEndRef.current && activeTab === 'communication') {
            commsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [timeline, activeTab]);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const handleSaveField = async (field: string, value: string) => {
        setLoading(prev => ({ ...prev, saving: true }));
        setError(null);
        try {
            const { error } = await supabase
                .from('enquiries')
                .update({ [field]: value, updated_at: new Date().toISOString() })
                .eq('id', enquiry.id);

            if (error) throw error;
            setFormData(prev => ({ ...prev, [field]: value }));
            setSuccessMessage('Information updated successfully');
            onUpdate();
        } catch (err) {
            console.error('Save error:', err);
            setError(`Failed to update ${field.replace('_', ' ')}: ${formatError(err)}`);
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const handleStatusChange = async (newStatus: EnquiryStatus) => {
        setLoading(prev => ({ ...prev, saving: true }));
        setError(null);
        try {
            const { error } = await supabase
                .from('enquiries')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', enquiry.id);

            if (error) throw error;
            setSuccessMessage('Status updated successfully');
            onUpdate();
            await fetchTimeline(true);
        } catch (err) {
            console.error('Status update error:', err);
            setError(`Failed to update status: ${formatError(err)}`);
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const handleConvert = async () => {
        if (!currentStatus.canConvert) {
            setError('Cannot convert: enquiry must be verified first');
            return;
        }

        setLoading(prev => ({ ...prev, converting: true }));
        setError(null);
        try {
            const result = await EnquiryService.convertToAdmission(enquiry.id);
            if (result.success) {
                setSuccessMessage('Successfully converted to admission');
                onUpdate();
                setTimeout(() => {
                    onClose();
                    onNavigate?.('Admissions');
                }, 1500);
            } else {
                throw new Error(result.message || 'Conversion failed');
            }
        } catch (err: any) {
            console.error('Conversion error:', err);
            setError(`Conversion failed: ${err.message || 'Please try again'}`);
        } finally {
            setLoading(prev => ({ ...prev, converting: false }));
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const msg = newMessage.trim();
        if (!msg) return;

        setLoading(prev => ({ ...prev, sending: true }));
        setError(null);
        try {
            const { error } = await supabase.rpc('send_enquiry_message', {
                p_enquiry_id: enquiry.id,
                p_message: msg
            });
            if (error) throw error;
            setNewMessage('');
            setSuccessMessage('Message sent successfully');
            await fetchTimeline(true);
        } catch (err) {
            console.error('Send message error:', err);
            setError(`Failed to send message: ${formatError(err)}`);
        } finally {
            setLoading(prev => ({ ...prev, sending: false }));
        }
    };

    const handleQuickAction = (action: string) => {
        let message = '';
        switch (action) {
            case 'welcome':
                message = `Dear ${formData.parent_name || 'Parent'},

Thank you for your interest in our school! We've received your enquiry for ${formData.applicant_name} in Grade ${enquiry.grade}.

Our admissions team will contact you shortly to discuss next steps.

Best regards,
Admissions Team`;
                break;
            case 'documents':
                message = `Dear ${formData.parent_name || 'Parent'},

To proceed with ${formData.applicant_name}'s admission process, please provide the following documents:

• Birth Certificate
• Address Proof
• Previous School Records
• Medical Certificate (if applicable)

You can upload these documents securely through your Parent Portal.

Best regards,
Admissions Team`;
                break;
        }
        setNewMessage(message);
        setActiveTab('communication');
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">

                {/* Success/Error Messages */}
                {(successMessage || error) && (
                    <div className={`px-6 py-3 text-sm font-medium ${
                        successMessage ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        'bg-red-50 text-red-800 border-red-200'
                    } border-b`}>
                        {successMessage || error}
                    </div>
                )}

                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg font-semibold text-gray-700">
                                    {formData.applicant_name.charAt(0)}
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">{formData.applicant_name}</h1>
                                    <p className="text-sm text-gray-600">Grade {enquiry.grade} • Enquiry #{enquiry.id.toString().slice(-6)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            {/* Status */}
                            <div className={`px-3 py-1 rounded-lg text-sm font-semibold border ${currentStatus.bg} ${currentStatus.color}`}>
                                {currentStatus.label}
                            </div>

                            {/* Progress */}
                            <div className="flex items-center gap-3 min-w-[120px]">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-300"
                                        style={{ width: `${currentStatus.progress}%` }}
                                    />
                                </div>
                                <span className="text-sm font-medium text-gray-600 min-w-[35px]">
                                    {currentStatus.progress}%
                                </span>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <XIcon className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* At-a-Glance Summary */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center gap-4">
                        <SummaryChip
                            label="Priority"
                            value={priorityLevel}
                            icon={<AlertTriangleIcon className="w-4 h-4" />}
                            color={priorityColor}
                        />
                        <SummaryChip
                            label="Days Active"
                            value={daysActive.toString()}
                            icon={<ClockIcon className="w-4 h-4" />}
                        />
                        <SummaryChip
                            label="Enquiry Source"
                            value={enquiry.admission_id ? 'Parent Portal' : 'Direct Enquiry'}
                            icon={<DocumentTextIcon className="w-4 h-4" />}
                        />
                        <SummaryChip
                            label="Last Activity"
                            value={new Date(lastActivity).toLocaleDateString()}
                            icon={<CalendarIcon className="w-4 h-4" />}
                        />
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                        {/* Timeline */}
                        <div className="flex-1 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Progress Timeline</h2>
                            <div className="space-y-1">
                                {PROGRESS_STEPS.map((step, index) => {
                                    const isCompleted = index < Math.floor(currentStatus.progress / 20);
                                    const isCurrent = index === Math.floor(currentStatus.progress / 20);

                                    return (
                                        <TimelineStep
                                            key={index}
                                            step={step}
                                            isCompleted={isCompleted}
                                            isCurrent={isCurrent}
                                            isLast={index === PROGRESS_STEPS.length - 1}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Next Action */}
                        <div className="p-6 border-t border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Next Action</h3>
                            <p className="text-sm text-gray-600">{currentStatus.nextAction}</p>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col">
                        {/* Tab Navigation */}
                        <div className="bg-white border-b border-gray-200">
                            <div className="flex">
                                {[
                                    { id: 'overview', label: 'Details' },
                                    { id: 'timeline', label: 'Timeline' },
                                    { id: 'communication', label: 'Messages' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                            activeTab === tab.id
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto">
                            {activeTab === 'overview' ? (
                                <div className="p-6 space-y-6">
                                    {/* Student Details */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <AcademicCapIcon className="w-5 h-5 text-gray-600" />
                                            <h3 className="text-lg font-semibold text-gray-900">Student Information</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <EditableField
                                                label="Full Name"
                                                value={formData.applicant_name}
                                                onSave={(value) => handleSaveField('applicant_name', value)}
                                                required
                                                missing={!formData.applicant_name}
                                            />
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">Grade Level</label>
                                                <div className="p-3 bg-gray-50 rounded-lg border-2 border-transparent">
                                                    <span className="text-sm text-gray-900 font-medium">Grade {enquiry.grade}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Parent/Guardian Details */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <UsersIcon className="w-5 h-5 text-gray-600" />
                                            <h3 className="text-lg font-semibold text-gray-900">Parent/Guardian Information</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <EditableField
                                                label="Full Name"
                                                value={formData.parent_name}
                                                onSave={(value) => handleSaveField('parent_name', value)}
                                                required
                                                missing={!formData.parent_name}
                                            />
                                            <EditableField
                                                label="Email Address"
                                                value={formData.parent_email}
                                                onSave={(value) => handleSaveField('parent_email', value)}
                                                missing={!formData.parent_email}
                                            />
                                            <EditableField
                                                label="Phone Number"
                                                value={formData.parent_phone}
                                                onSave={(value) => handleSaveField('parent_phone', value)}
                                                missing={!formData.parent_phone}
                                            />
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">Relationship</label>
                                                <div className="p-3 bg-gray-50 rounded-lg border-2 border-transparent">
                                                    <span className="text-sm text-gray-900 font-medium">Parent</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="mt-6 pt-6 border-t border-gray-200">
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => window.open(`mailto:${formData.parent_email}`, '_blank')}
                                                    disabled={!formData.parent_email}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                                >
                                                    <MailIcon className="w-4 h-4" />
                                                    Email
                                                </button>
                                                <button
                                                    onClick={() => window.open(`tel:${formData.parent_phone}`, '_blank')}
                                                    disabled={!formData.parent_phone}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                                >
                                                    <PhoneIcon className="w-4 h-4" />
                                                    Call
                                                </button>
                                                <button
                                                    onClick={() => handleQuickAction('welcome')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                                                >
                                                    <CommunicationIcon className="w-4 h-4" />
                                                    Message
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Enquiry Source */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                                            <h3 className="text-lg font-semibold text-gray-900">Enquiry Source</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">Source Type</label>
                                                <div className="p-3 bg-gray-50 rounded-lg border-2 border-transparent">
                                                    <span className="text-sm text-gray-900 font-medium">
                                                        {enquiry.admission_id ? 'Parent Portal Registration' : 'Direct School Enquiry'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">Created Date</label>
                                                <div className="p-3 bg-gray-50 rounded-lg border-2 border-transparent">
                                                    <span className="text-sm text-gray-900 font-medium">
                                                        {new Date(enquiry.received_at || enquiry.updated_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : activeTab === 'timeline' ? (
                                <div className="p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Activity Timeline</h2>
                                    {loading.timeline ? (
                                        <div className="space-y-4">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className="flex gap-4">
                                                    <SkeletonLoader className="w-8 h-8 rounded-full" />
                                                    <div className="space-y-2 flex-1">
                                                        <SkeletonLoader className="h-4 w-32" />
                                                        <SkeletonLoader className="h-3 w-48" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : timeline.length === 0 ? (
                                        <div className="text-center py-12">
                                            <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
                                            <p className="text-gray-600">Timeline events will appear here</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {timeline.map((item, idx) => (
                                                <div key={idx} className="flex gap-4">
                                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                        {item.item_type === 'MESSAGE' ? (
                                                            <CommunicationIcon className="w-4 h-4 text-gray-600" />
                                                        ) : (
                                                            <CheckCircleIcon className="w-4 h-4 text-gray-600" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {item.item_type === 'MESSAGE' ? 'Message sent' : 'Status updated'}
                                                        </div>
                                                        <div className="text-sm text-gray-600 mt-1">
                                                            {item.details?.message || item.item_type?.replace(/_/g, ' ')}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-2">
                                                            {new Date(item.created_at).toLocaleString()} • {item.created_by_name}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Communication Tab */
                                <div className="flex flex-col h-full">
                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-6">
                                        {loading.timeline ? (
                                            <div className="space-y-4">
                                                {[...Array(3)].map((_, i) => (
                                                    <div key={i} className="flex gap-4">
                                                        <SkeletonLoader className="w-8 h-8 rounded-full" />
                                                        <div className="space-y-2 flex-1">
                                                            <SkeletonLoader className="h-16 w-full rounded-lg" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : timeline.filter(t => t.item_type === 'MESSAGE').length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-center">
                                                <CommunicationIcon className="w-16 h-16 text-gray-300 mb-4" />
                                                <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                                                <p className="text-gray-600">Start the conversation with the parent</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {timeline
                                                    .filter(t => t.item_type === 'MESSAGE')
                                                    .map((item, idx) => (
                                                        <MessageBubble
                                                            key={idx}
                                                            message={item.details?.message || ''}
                                                            isAdmin={!item.is_admin}
                                                            timestamp={new Date(item.created_at).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                            sender={item.created_by_name || 'Unknown'}
                                                        />
                                                    ))}
                                                <div ref={commsEndRef} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Message Input */}
                                    <div className="border-t border-gray-200 bg-white p-6">
                                        <form onSubmit={handleSendMessage} className="flex gap-4">
                                            <div className="flex-1">
                                                <textarea
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    placeholder="Type your message..."
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                                                    rows={3}
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={!newMessage.trim() || loading.sending}
                                                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
                                            >
                                                {loading.sending ? <Spinner size="sm" /> : <LocalSendIcon className="w-4 h-4" />}
                                                Send
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <select
                                value={enquiry.status}
                                onChange={(e) => handleStatusChange(e.target.value as EnquiryStatus)}
                                disabled={loading.saving}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                    <option key={key} value={key}>{config.label}</option>
                                ))}
                            </select>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleQuickAction('welcome')}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                >
                                    Send Welcome
                                </button>
                                <button
                                    onClick={() => handleQuickAction('documents')}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                >
                                    Request Documents
                                </button>
                            </div>
                        </div>

                        {enquiry.status !== 'CONVERTED' && (
                            <button
                                onClick={handleConvert}
                                disabled={loading.converting || !currentStatus.canConvert}
                                className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
                                    currentStatus.canConvert
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {loading.converting ? (
                                    <div className="flex items-center gap-2">
                                        <Spinner size="sm" />
                                        Converting...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <GraduationCapIcon className="w-4 h-4" />
                                        Convert to Admission
                                    </div>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnquiryDetailsModal;
