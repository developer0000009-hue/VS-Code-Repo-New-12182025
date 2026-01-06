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
import { SparklesIcon } from './icons/SparklesIcon';
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
import { ArrowRightIcon } from './icons/ArrowRightIcon';
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
}> = {
    'New': {
        label: 'New Enquiry',
        color: 'text-blue-700',
        bg: 'bg-blue-50 border-blue-200',
        progress: 10,
        nextAction: 'Contact parent and verify details'
    },
    'ENQUIRY_ACTIVE': {
        label: 'Active',
        color: 'text-blue-700',
        bg: 'bg-blue-50 border-blue-200',
        progress: 25,
        nextAction: 'Verify parent contact information'
    },
    'ENQUIRY_VERIFIED': {
        label: 'Verified',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50 border-emerald-200',
        progress: 60,
        nextAction: 'Request required documents'
    },
    'VERIFIED': {
        label: 'Verified',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50 border-emerald-200',
        progress: 60,
        nextAction: 'Request required documents'
    },
    'ENQUIRY_IN_PROGRESS': {
        label: 'In Progress',
        color: 'text-amber-700',
        bg: 'bg-amber-50 border-amber-200',
        progress: 80,
        nextAction: 'Review submitted documents'
    },
    'IN_REVIEW': {
        label: 'In Review',
        color: 'text-amber-700',
        bg: 'bg-amber-50 border-amber-200',
        progress: 80,
        nextAction: 'Review submitted documents'
    },
    'CONVERTED': {
        label: 'Converted',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50 border-emerald-200',
        progress: 100,
        nextAction: 'Admission process complete'
    },
    'Completed': {
        label: 'Completed',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50 border-emerald-200',
        progress: 100,
        nextAction: 'Admission process complete'
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
    icon?: React.ReactNode;
    required?: boolean;
}> = ({ label, value, onSave, icon, required }) => {
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
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-sm font-medium text-gray-600">{label}</span>
                {required && <span className="text-red-500">*</span>}
            </div>
            {isEditing ? (
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        autoFocus
                    />
                    <button
                        onClick={handleSave}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
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
                    className="group flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setIsEditing(true)}
                >
                    <span className={`text-sm ${!value ? 'text-gray-400 italic' : 'text-gray-900'}`}>
                        {value || 'Not provided'}
                    </span>
                    <EditIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            )}
        </div>
    );
};

const TimelineEntry: React.FC<{ item: TimelineItem; isLast?: boolean }> = ({ item, isLast }) => {
    if (item.item_type === 'MESSAGE') {
        const isParent = !item.is_admin;
        const message = item.details?.message || '[Message content unavailable]';
        const createdByName = item.created_by_name || 'Unknown';

        return (
            <div className={`flex gap-4 ${isParent ? 'justify-start' : 'justify-end'} mb-6`}>
                <div className={`flex gap-3 max-w-[70%] ${isParent ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                        isParent ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                        {createdByName.charAt(0)}
                    </div>
                    <div className={`p-4 rounded-2xl shadow-sm border ${
                        isParent ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
                    }`}>
                        <p className="text-sm text-gray-900 leading-relaxed">{message}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <span className="font-medium">{createdByName}</span>
                            <span>•</span>
                            <span>{new Date(item.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center my-8">
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    {item.item_type?.replace(/_/g, ' ') || 'Unknown Event'}
                </span>
                <span className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
    );
};

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
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'communication'>('overview');
    const commsEndRef = useRef<HTMLDivElement>(null);

    // Calculate derived data
    const daysActive = Math.floor((new Date().getTime() - new Date(enquiry.received_at || enquiry.updated_at).getTime()) / (1000 * 3600 * 24));
    const priorityLevel = daysActive > 7 ? 'High' : daysActive > 3 ? 'Medium' : 'Low';
    const priorityColor = priorityLevel === 'High' ? 'text-red-700 bg-red-50 border-red-200' :
                         priorityLevel === 'Medium' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                         'text-green-700 bg-green-50 border-green-200';

    const currentStatus = STATUS_CONFIG[enquiry.status] || STATUS_CONFIG['New'];

    const fetchTimeline = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(prev => ({ ...prev, timeline: true }));
        try {
            const { data, error } = await supabase.rpc('get_enquiry_timeline', { p_enquiry_id: enquiry.id });
            if (error) throw error;
            setTimeline(data || []);
        } catch (err) {
            console.error("Timeline Sync Error:", err);
            setError("Failed to load conversation history");
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

    const handleSaveField = async (field: string, value: string) => {
        setLoading(prev => ({ ...prev, saving: true }));
        try {
            const { error } = await supabase
                .from('enquiries')
                .update({ [field]: value, updated_at: new Date().toISOString() })
                .eq('id', enquiry.id);

            if (error) throw error;
            setFormData(prev => ({ ...prev, [field]: value }));
            onUpdate();
        } catch (err) {
            alert(`Save failed: ${formatError(err)}`);
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const msg = newMessage.trim();
        if (!msg) return;

        setLoading(prev => ({ ...prev, sending: true }));
        try {
            const { error } = await supabase.rpc('send_enquiry_message', {
                p_enquiry_id: enquiry.id,
                p_message: msg
            });
            if (error) throw error;
            setNewMessage('');
            await fetchTimeline(true);
        } catch (err) {
            alert("Failed to send message: " + formatError(err));
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

Our admissions team will contact you shortly to discuss next steps. In the meantime, please feel free to reach out with any questions.

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
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
                {/* Sticky Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                                    {formData.applicant_name.charAt(0)}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{formData.applicant_name}</h1>
                                    <p className="text-sm text-gray-600">Grade {enquiry.grade} • Enquiry #{enquiry.id.toString().slice(-6)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Status Badge */}
                            <div className={`px-4 py-2 rounded-full border text-sm font-semibold ${currentStatus.bg} ${currentStatus.color}`}>
                                {currentStatus.label}
                            </div>

                            {/* Progress */}
                            <div className="flex items-center gap-3">
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                                        style={{ width: `${currentStatus.progress}%` }}
                                    />
                                </div>
                                <span className="text-sm font-medium text-gray-600">{currentStatus.progress}%</span>
                            </div>

                            {/* Last Updated */}
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Last updated</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {new Date(enquiry.updated_at).toLocaleDateString()}
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <XIcon className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-hidden">
                    <div className="h-full flex">
                        {/* Left Sidebar - Overview */}
                        <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
                            {/* Overview Section */}
                            <div className="p-6 space-y-6">
                                <h2 className="text-lg font-semibold text-gray-900">Overview</h2>

                                {/* Verification State */}
                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <div className="flex items-center gap-3 mb-3">
                                        <ShieldCheckIcon className="w-5 h-5 text-emerald-600" />
                                        <span className="font-medium text-gray-900">Verification Status</span>
                                    </div>
                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${currentStatus.bg} ${currentStatus.color}`}>
                                        {currentStatus.label}
                                    </div>
                                </div>

                                {/* Priority */}
                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <div className="flex items-center gap-3 mb-3">
                                        <AlertTriangleIcon className="w-5 h-5 text-amber-600" />
                                        <span className="font-medium text-gray-900">Priority Level</span>
                                    </div>
                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityColor}`}>
                                        {priorityLevel} Priority
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2">{daysActive} days active</p>
                                </div>

                                {/* Next Action */}
                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <div className="flex items-center gap-3 mb-3">
                                        <ArrowRightIcon className="w-5 h-5 text-blue-600" />
                                        <span className="font-medium text-gray-900">Next Action</span>
                                    </div>
                                    <p className="text-sm text-gray-700">{currentStatus.nextAction}</p>
                                </div>
                            </div>

                            {/* Timeline Progress */}
                            <div className="px-6 pb-6">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4">Progress Timeline</h3>
                                <div className="space-y-3">
                                    {PROGRESS_STEPS.map((step, index) => {
                                        const isCompleted = index < Math.floor(currentStatus.progress / 20);
                                        const isCurrent = index === Math.floor(currentStatus.progress / 20);

                                        return (
                                            <div key={index} className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                    isCompleted ? 'bg-emerald-500 text-white' :
                                                    isCurrent ? 'bg-blue-500 text-white' :
                                                    'bg-gray-200 text-gray-400'
                                                }`}>
                                                    {isCompleted ? <CheckIcon className="w-3 h-3" /> : index + 1}
                                                </div>
                                                <span className={`text-sm ${
                                                    isCompleted ? 'text-emerald-700 font-medium' :
                                                    isCurrent ? 'text-blue-700 font-medium' :
                                                    'text-gray-500'
                                                }`}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 flex flex-col">
                            {/* Tab Navigation */}
                            <div className="bg-white border-b border-gray-200 px-6">
                                <div className="flex gap-8">
                                    <button
                                        onClick={() => setActiveTab('overview')}
                                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                                            activeTab === 'overview'
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        Details & Information
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('communication')}
                                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                                            activeTab === 'communication'
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        Communication
                                    </button>
                                </div>
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 overflow-y-auto">
                                {activeTab === 'overview' ? (
                                    <div className="p-6 space-y-6">
                                        {/* Student Details Card */}
                                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <AcademicCapIcon className="w-6 h-6 text-blue-600" />
                                                    <h3 className="text-lg font-semibold text-gray-900">Student Information</h3>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <EditableField
                                                    label="Full Name"
                                                    value={formData.applicant_name}
                                                    onSave={(value) => handleSaveField('applicant_name', value)}
                                                    required
                                                />
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <AcademicCapIcon className="w-4 h-4 text-gray-400" />
                                                        <span className="text-sm font-medium text-gray-600">Grade Level</span>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 rounded-lg">
                                                        <span className="text-sm text-gray-900 font-medium">Grade {enquiry.grade}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Parent/Guardian Details */}
                                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <UsersIcon className="w-6 h-6 text-emerald-600" />
                                                    <h3 className="text-lg font-semibold text-gray-900">Parent/Guardian Information</h3>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <EditableField
                                                    label="Full Name"
                                                    value={formData.parent_name}
                                                    onSave={(value) => handleSaveField('parent_name', value)}
                                                    icon={<UsersIcon className="w-4 h-4 text-gray-400" />}
                                                    required
                                                />
                                                <EditableField
                                                    label="Email Address"
                                                    value={formData.parent_email}
                                                    onSave={(value) => handleSaveField('parent_email', value)}
                                                    icon={<MailIcon className="w-4 h-4 text-gray-400" />}
                                                />
                                                <EditableField
                                                    label="Phone Number"
                                                    value={formData.parent_phone || ''}
                                                    onSave={(value) => handleSaveField('parent_phone', value)}
                                                    icon={<PhoneIcon className="w-4 h-4 text-gray-400" />}
                                                />
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <UsersIcon className="w-4 h-4 text-gray-400" />
                                                        <span className="text-sm font-medium text-gray-600">Relationship</span>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 rounded-lg">
                                                        <span className="text-sm text-gray-900 font-medium">Parent</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Quick Communication Actions */}
                                            <div className="mt-6 pt-6 border-t border-gray-200">
                                                <h4 className="text-sm font-medium text-gray-900 mb-4">Quick Actions</h4>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => window.open(`mailto:${formData.parent_email}`, '_blank')}
                                                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                                                    >
                                                        <MailIcon className="w-4 h-4" />
                                                        Email
                                                    </button>
                                                    <button
                                                        onClick={() => window.open(`tel:${formData.parent_phone}`, '_blank')}
                                                        className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
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
                                    </div>
                                ) : (
                                    /* Communication Tab */
                                    <div className="flex flex-col h-full">
                                        {/* Messages Area */}
                                        <div className="flex-1 overflow-y-auto p-6">
                                            {loading.timeline ? (
                                                <div className="space-y-4">
                                                    {[...Array(3)].map((_, i) => (
                                                        <div key={i} className="flex gap-4">
                                                            <SkeletonLoader className="w-10 h-10 rounded-full" />
                                                            <div className="space-y-2 flex-1">
                                                                <SkeletonLoader className="h-4 w-24" />
                                                                <SkeletonLoader className="h-16 w-full" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : timeline.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-full text-center">
                                                    <CommunicationIcon className="w-16 h-16 text-gray-300 mb-4" />
                                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                                                    <p className="text-gray-600">Start the conversation with the parent</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {timeline.map((item, idx) => (
                                                        <TimelineEntry
                                                            key={idx}
                                                            item={item}
                                                            isLast={idx === timeline.length - 1}
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
                                                        placeholder="Type your message to the parent..."
                                                        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                                                        rows={3}
                                                        onKeyDown={(e) => {
                                                            if(e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                handleSendMessage(e);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={!newMessage.trim() || loading.sending}
                                                    className="px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
                                                >
                                                    {loading.sending ? <Spinner size="sm" /> : <LocalSendIcon className="w-5 h-5" />}
                                                    Send
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Primary Action Zone */}
                <div className="bg-gray-50 border-t border-gray-200 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-4">
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

                        <div className="flex gap-4">
                            {enquiry.status !== 'CONVERTED' && (
                                <button
                                    onClick={handleConvert}
                                    disabled={loading.converting || enquiry.status === 'ENQUIRY_ACTIVE'}
                                    className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                                        enquiry.status !== 'ENQUIRY_ACTIVE'
                                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:shadow-xl'
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
        </div>
    );
};

export default EnquiryDetailsModal;
