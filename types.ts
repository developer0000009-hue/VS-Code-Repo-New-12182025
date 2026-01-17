
// Fix: Added React import to resolve 'Cannot find namespace React' errors when using React.FC and React.SVGProps.
import React from 'react';

export type Role = string;

export enum BuiltInRoles {
    SCHOOL_ADMINISTRATION = 'School Administration',
    BRANCH_ADMIN = 'Branch Admin',
    PARENT_GUARDIAN = 'Parent/Guardian',
    STUDENT = 'Student',
    TEACHER = 'Teacher',
    TRANSPORT_STAFF = 'Transport Staff',
    ECOMMERCE_OPERATOR = 'E-commerce Operator',
    PRINCIPAL = 'Principal',
    HR_MANAGER = 'HR Manager',
    ACADEMIC_COORDINATOR = 'Academic Coordinator',
    ACCOUNTANT = 'Accountant',
    SUPER_ADMIN = 'Super Admin'
}

// Unified EnquiryStatus to strictly follow the institutional lifecycle protocol
export type EnquiryStatus = 
    | 'ENQUIRY_ACTIVE' 
    | 'ENQUIRY_VERIFIED' 
    | 'ENQUIRY_IN_REVIEW' 
    | 'ENQUIRY_CONTACTED'
    | 'ENQUIRY_REJECTED'
    | 'ENQUIRY_CONVERTED';

export type AdmissionStatus = 'Registered' | 'Pending Review' | 'Verified' | 'Approved' | 'Rejected' | 'Cancelled' | 'Enrolled';

export interface UserProfile {
    id: string;
    email: string;
    display_name: string;
    role?: Role;
    phone?: string;
    is_active: boolean;
    profile_completed: boolean;
    created_at: string;
    branch_id?: number | null;
    email_confirmed_at?: string | null;
    address?: string;
    gender?: string;
    date_of_birth?: string;
    // Fix: Added profile_photo_url to resolve errors in StudentManagementTab and StudentProfileModal
    profile_photo_url?: string | null;
}

export interface Enquiry {
    id: string;
    admission_id?: string | null;
    branch_id: number;
    applicant_name: string;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
    grade: string;
    status: EnquiryStatus;
    notes?: string;
    received_at: string;
    updated_at: string;
}

// Alias for Enquiry often used in messaging context
export type MyEnquiry = Enquiry;

export interface TimelineItem {
    id: string;
    item_type: 'MESSAGE' | 'STATUS_CHANGE' | 'NOTE_ADDED' | 'ADMISSION_STATUS_CHANGE' | 'DOCUMENTS_REQUESTED' | 'ENQUIRY_VERIFIED';
    details: any;
    created_at: string;
    created_by_name: string;
    is_admin: boolean;
}

export interface AdmissionApplication {
    id: string;
    applicant_name: string;
    parent_id?: string;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
    grade: string;
    status: AdmissionStatus;
    submitted_at: string;
    registered_at?: string;
    profile_photo_url?: string | null;
    medical_info?: string;
    emergency_contact?: string;
    application_number?: string;
    student_user_id?: string;
    // Fix: Added date_of_birth and gender to resolve errors in ChildRegistrationModal and StudentOnboardingWizard
    date_of_birth?: string;
    gender?: string;
    // Extended fields for display in Family Nodes
    section?: string;
    class_name?: string;
    student_id_number?: string;
    // Fix: Added notes to resolve schema mismatch during enquiry promotion
    notes?: string;
}

export interface SchoolAdminProfileData {
    user_id: string;
    school_name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    admin_contact_name: string;
    admin_contact_phone: string;
    admin_contact_email: string;
    admin_designation?: string;
    onboarding_step: 'profile' | 'pricing' | 'branches' | 'completed';
    academic_board?: string;
    affiliation_number?: string;
    school_type?: string;
    academic_year_start?: string;
    academic_year_end?: string;
    grade_range_start?: string;
    grade_range_end?: string;
}

export interface ParentProfileData {
    user_id: string;
    relationship_to_student: string;
    gender: string;
    number_of_children: number;
    address: string;
    city: string;
    state: string;
    country: string;
    pin_code: string;
    secondary_parent_name?: string | null;
    secondary_parent_relationship?: string | null;
    secondary_parent_email?: string | null;
    secondary_parent_phone?: string | null;
    secondary_parent_gender?: string | null;
}

export interface TeacherProfileData {
    user_id: string;
    bio?: string;
    gender?: string;
    date_of_birth?: string;
    department?: string;
    designation?: string;
    employee_id?: string;
    employment_type?: string;
    employment_status?: string;
    date_of_joining?: string;
    qualification?: string;
    specializations?: string;
    subject?: string;
    profile_picture_url?: string;
    workload_limit?: number;
    salary?: string;
    bank_details?: string;
    // Fix: Added experience_years and branch_id to resolve errors in TeacherForm, TeacherProfileView, and TeachersManagementTab
    experience_years?: number;
    branch_id?: number | null;
}

export interface TeacherExtended extends UserProfile {
    details?: TeacherProfileData;
}

export interface StudentProfileData {
    user_id: string;
    grade: string;
    roll_number?: string;
    student_id_number?: string;
    assigned_class_id?: number | null;
}

export interface StudentForAdmin extends UserProfile {
    student_id_number?: string;
    grade: string;
    roll_number?: string;
    parent_guardian_details?: string;
    assigned_class_id?: number | null;
    assigned_class_name?: string | null;
}

export interface TransportProfileData {
    user_id: string;
    route_id?: number | null;
    vehicle_details?: string;
    license_info?: string;
}

// Fix: Added EcommerceProfileData to resolve the import error in EcommerceForm.tsx.
export interface EcommerceProfileData {
    user_id: string;
    store_name: string;
    business_type?: string;
}

export interface BusRoute {
    id: number;
    name: string;
    description?: string;
}

export interface UIWrapperProps {
    children: React.ReactNode;
}

export interface SchoolBranch {
    id: number;
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    is_main_branch: boolean;
    admin_name?: string;
    admin_phone?: string;
    admin_email?: string;
    status?: string;
}

export type ShareCodeStatus = 'Active' | 'Expired' | 'Revoked' | 'Redeemed';
export type ShareCodeType = 'Enquiry' | 'Admission';

export interface ShareCode {
    id: number;
    code: string;
    admission_id: string;
    applicant_name: string;
    status: ShareCodeStatus;
    code_type: ShareCodeType;
    expires_at: string;
    profile_photo_url?: string | null;
    purpose?: string;
}

export interface VerifiedShareCodeData {
    found: boolean;
    admission_id: string;
    applicant_name: string;
    grade: string;
    code_type: ShareCodeType;
    error?: string;
}

export interface SchoolClass {
    id: number;
    name: string;
    grade_level: string;
    section: string;
    academic_year: string;
    class_teacher_id?: string | null;
}

export interface StudentRosterItem {
    id: string;
    display_name: string;
    roll_number?: string;
}

export interface AttendanceRecord {
    id: number;
    student_id: string;
    status: AttendanceStatus;
    notes?: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late';

export type CourseStatus = 'Active' | 'Draft' | 'Archived' | 'Pending' | 'Inactive';

export interface Course {
    id: number;
    title: string;
    code: string;
    description?: string;
    credits?: number;
    category?: string;
    grade_level?: string;
    status: CourseStatus;
    teacher_id?: string | null;
    teacher_name?: string;
    department?: string;
    enrolled_count?: number;
    subject_type?: string;
    created_at?: string;
}

export interface CourseModule {
    id: number;
    course_id: number;
    title: string;
    order_index: number;
}

export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export type TimeSlot = string;

export interface TimetableEntry {
    id: string;
    day: Day;
    startTime: string;
    endTime: string;
    subject: string;
    teacher: string;
    room: string;
    isConflict?: boolean;
    class_name?: string;
}

export interface FinanceData {
    revenue_ytd: number;
    collections_this_month: number;
    pending_dues: number;
    online_payments: number;
}

export interface FeeStructure {
    id: number;
    name: string;
    academic_year: string;
    target_grade: string;
    currency: string;
    status: 'Active' | 'Draft';
    components?: any[];
}

export interface StudentFeeSummary {
    student_id: string;
    display_name: string;
    class_name: string;
    total_billed: number;
    total_paid: number;
    outstanding_balance: number;
    overall_status: 'Paid' | 'Overdue' | 'Pending';
    // Fix: Added currency to resolve errors in FinanceTab and StudentFinanceDetailView
    currency?: string;
}

export interface AdminAnalyticsStats {
    total_users: number;
    total_applications: number;
    pending_applications: number;
}

export interface Communication {
    id: string;
    subject: string;
    body: string;
    sent_at: string;
    sender_name?: string;
    sender_role?: string;
    status?: string;
    recipients: string[];
    target_criteria?: any;
}

export type FunctionComponentWithIcon<T = {}> = React.FC<T> & { Icon: React.FC<React.SVGProps<SVGSVGElement>> };

export interface TeacherClassOverview {
    id: number;
    name: string;
    student_count: number;
}

export interface ClassSubject {
    id: number;
    name: string;
}

export interface TeacherClassDetails {
    roster: StudentRosterItem[];
    assignments: any[];
    studyMaterials: any[];
    subjects: ClassSubject[];
}

export interface LessonPlan {
    id: number;
    title: string;
    subject_name: string;
    objectives: string;
    activities: string;
    lesson_date: string;
    resources: any[];
}

export interface StudentDashboardData {
    profile: StudentForAdmin;
    attendanceSummary: {
        total_days: number;
        present_days: number;
        absent_days: number;
        late_days: number;
    };
    assignments: StudentAssignment[];
    timetable: TimetableEntry[];
    announcements: Communication[];
    studyMaterials: StudyMaterial[];
    classInfo?: {
        name: string;
        teacher_name: string;
    };
    recentGrades: any[];
    admission: AdmissionApplication;
    needs_onboarding: boolean;
}

export type SubmissionStatus = 'Not Submitted' | 'Submitted' | 'Late' | 'Graded';

export interface StudentAssignment {
    id: number;
    title: string;
    description: string;
    subject: string;
    due_date: string;
    status: SubmissionStatus;
    submission_grade?: string;
    teacher_feedback?: string;
    file_path?: string;
}

export interface StudyMaterial {
    id: number;
    title: string;
    subject: string;
    file_name: string;
    file_path: string;
    file_type: string;
    is_bookmarked: boolean;
}

export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue' | 'Partial';

export interface StudentInvoice {
    id: number;
    description: string;
    amount: number;
    amount_paid: number;
    due_date: string;
    status: InvoiceStatus;
}

export interface StudentAttendanceRecord {
    date: string;
    status: AttendanceStatus;
    notes?: string;
}

export interface Workshop {
    id: number;
    title: string;
    description: string;
    workshop_date: string;
}

export interface TeacherProfessionalDevelopmentData {
    total_points: number;
    training_records: any[];
    awards: any[];
}

export interface TransportDashboardData {
    route: {
        id: number;
        name: string;
        description?: string;
    };
    students: BusStudent[];
}

export interface BusStudent {
    id: string;
    display_name: string;
    grade: string;
    parent_guardian_details: string;
    status?: BusAttendanceStatus;
}

export type BusAttendanceStatus = 'Boarded' | 'Absent';
export type BusTripType = 'Morning Pickup' | 'Afternoon Drop-off';

export interface BusAttendanceRecord {
    student_id: string;
    status: BusAttendanceStatus;
}

export interface StudentFinanceDetails {
    invoices: StudentInvoice[];
    payments: Payment[];
}

export interface Payment {
    id: number;
    amount: number;
    payment_date: string;
    receipt_number: string;
    // Fix: Added payment_method to resolve error in StudentFinanceDetailView
    payment_method?: string;
}

export interface ClassPerformanceSummary {
    average_grade: number;
    attendance_rate: number;
}

export interface StudentPerformanceReport {
    attendance_summary: {
        present: number;
        absent: number;
        late: number;
    };
    assignments: any[];
}

export interface DuesDashboardData {
    total_dues: number;
    total_overdue: number;
    overdue_student_count: number;
    dues_by_class: ClassDuesInfo[];
    highest_dues_students: StudentDuesInfo[];
}

export interface StudentDuesInfo {
    student_id: string;
    display_name: string;
    class_name: string;
    outstanding_balance: number;
}

export interface ClassDuesInfo {
    class_name: string;
    total_dues: number;
}

export interface Expense {
    id: number;
    category: string;
    amount: number;
    vendor_name?: string;
    expense_date: string;
    description: string;
    status: string;
    invoice_url?: string;
}

export interface ExpenseDashboardData {
    total_expenses_month: number;
    pending_approvals: number;
    recent_expenses: Expense[];
}

export interface FeeCollectionReportItem {
    payment_date: string;
    amount: number;
}

export interface ExpenseReportItem {
    expense_date: string;
    amount: number;
}

export interface StudentLedgerEntry {
    transaction_date: string;
    debit?: number;
    currency?: string;
    credit?: number;
    balance: number;
}

export interface TeacherSubjectMapping {
    id: number;
    teacher_id: string;
    subject_id: number;
    class_id: number;
    academic_year: string;
    class_name?: string;
    subject_name?: string;
    credits?: number;
    category?: string;
}

export interface DocumentRequirement {
  id: number;
  admission_id: string;
  document_name: string;
  status: 'Pending' | 'Submitted' | 'Verified' | 'Rejected';
  is_mandatory: boolean;
  notes_for_parent?: string;
  rejection_reason?: string;
  applicant_name: string;
  profile_photo_url?: string | null;
  admission_documents?: {
    id: number;
    file_name: string;
    storage_path: string;
    uploaded_at: string;
    // Fix: Added missing properties to reflect database schema and resolve type errors in UI components
    file_size?: number;
    mime_type?: string;
  }[];
}

export interface TeacherDocument {
    id: number;
    document_name: string;
    document_type: string;
    uploaded_at: string;
    file_path: string;
    status: string;
}

export interface BulkImportResult {
    success_count: number;
    failure_count: number;
    errors: any[];
}

export interface SchoolDepartment {
    id: number;
    name: string;
    description?: string;
    hod_id?: string;
    hod_name?: string;
    teacher_count?: number;
    course_count?: number;
}