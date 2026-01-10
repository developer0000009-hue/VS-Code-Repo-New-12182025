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
    SUPER_ADMIN = 'Super Admin',
    MINIMAL_ADMIN = 'Minimal Admin'
}

export interface UserProfile {
    id: string;
    email: string;
    display_name: string;
    role: Role | null;
    phone?: string;
    is_active: boolean;
    profile_completed: boolean;
    branch_id?: string | null;
    created_at?: string;
    address?: string;
    gender?: string;
    date_of_birth?: string;
    student_id_number?: string;
    parent_guardian_details?: string;
    roll_number?: string;
    // Fix: Added email_confirmed_at and grade to resolve "property does not exist" errors in SuperAdminDashboard and student tabs
    email_confirmed_at?: string;
    grade?: string;
}

export type AdmissionStatus = 'Registered' | 'Pending Review' | 'Verified' | 'Approved' | 'Rejected' | 'Cancelled' | 'Enquiry Active' | 'ENQUIRY_ACTIVE' | 'ENQUIRY_VERIFIED' | 'ENQUIRY_IN_PROGRESS' | 'CONVERTED';

export interface AdmissionApplication {
    id: string;
    applicant_name: string;
    grade: string;
    status: AdmissionStatus;
    submitted_at: string;
    registered_at?: string;
    profile_photo_url?: string | null;
    parent_name?: string;
    parent_email?: string;
    parent_phone?: string;
    emergency_contact?: string;
    medical_info?: string;
    application_number?: string;
    date_of_birth?: string;
    gender?: string;
    parent_id?: string;
    student_user_id?: string;
}

export interface StudentDashboardData {
    profile: UserProfile;
    admission: AdmissionApplication;
    attendanceSummary: {
        total_days: number;
        present_days: number;
        absent_days: number;
        late_days: number;
    };
    assignments: StudentAssignment[];
    timetable: TimetableEntry[];
    announcements: Communication[];
    recentGrades: any[];
    classInfo: {
        name: string;
        teacher_name: string;
    };
    studyMaterials: StudyMaterial[];
    needs_onboarding?: boolean;
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
    academic_board?: string;
    affiliation_number?: string;
    school_type?: string;
    academic_year_start?: string;
    academic_year_end?: string;
    grade_range_start?: string;
    grade_range_end?: string;
    onboarding_step?: string;
}

export interface SchoolBranch {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    is_main_branch: boolean;
    admin_name: string;
    admin_email: string;
    admin_phone: string;
    status?: string;
}

export type ShareCodeStatus = 'Active' | 'Expired' | 'Revoked' | 'Redeemed';
export type ShareCodeType = 'Enquiry' | 'Admission';

export interface ShareCode {
    id: string;
    admission_id: string;
    applicant_name: string;
    profile_photo_url?: string | null;
    code: string;
    status: ShareCodeStatus;
    code_type: ShareCodeType;
    expires_at: string;
    created_at: string;
}

export interface SchoolClass {
    id: string;
    name: string;
    grade_level: string;
    section: string;
    academic_year: string;
    class_teacher_id?: string | null;
    capacity: number;
}

export interface StudentRosterItem {
    id: string;
    display_name: string;
    roll_number?: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late';

export interface AttendanceRecord {
    id?: string;
    student_id: string;
    class_id: string;
    attendance_date: string;
    status: AttendanceStatus;
    notes?: string;
}

export type FunctionComponentWithIcon<P = {}> = React.FC<P> & { Icon: React.FC<React.SVGProps<SVGSVGElement>> };

export interface FinanceData {
    revenue_ytd: number;
    collections_this_month: number;
    pending_dues: number;
    online_payments: number;
}

export interface FeeStructure {
    id: string;
    name: string;
    academic_year: string;
    target_grade: string;
    description: string;
    currency: string;
    status: 'Active' | 'Draft';
    components?: any[];
    created_at: string;
    is_active?: boolean;
}

export interface StudentFeeSummary {
    student_id: string;
    display_name: string;
    class_name: string;
    total_billed: number;
    total_paid: number;
    outstanding_balance: number;
    overall_status: 'Paid' | 'Overdue' | 'Pending';
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
    sender_name: string;
    sender_role?: string;
    sent_at: string;
    status?: 'Sent' | 'Delivered' | 'Failed';
    recipients: string[];
    target_criteria?: any;
}

export type EnquiryStatus = 'New' | 'Contacted' | 'Verified' | 'ENQUIRY_VERIFIED' | 'In Review' | 'ENQUIRY_IN_PROGRESS' | 'ENQUIRY_ACTIVE' | 'Completed' | 'CONVERTED';

export interface MyEnquiry {
    id: string;
    applicant_name: string;
    grade: string;
    status: EnquiryStatus;
    updated_at: string;
    parent_email?: string;
}

export interface Enquiry extends MyEnquiry {
    parent_name: string;
    notes?: string;
}

export interface TimelineItem {
    item_type: 'MESSAGE' | 'STATUS_CHANGE' | 'DOCUMENT_UPLOAD' | 'ARTIFACT_VERIFICATION' | 'ENQUIRY_CREATED';
    is_admin: boolean;
    created_by_name: string;
    created_at: string;
    details: {
        message?: string;
        [key: string]: any;
    };
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
    secondary_parent_name?: string;
    secondary_parent_relationship?: string;
    secondary_parent_email?: string;
    secondary_parent_phone?: string;
    secondary_parent_gender?: string;
}

export interface StudentProfileData {
    user_id: string;
    grade: string;
    parent_guardian_details: string;
}

export interface TeacherProfileData {
    user_id: string;
    bio: string;
    gender: string;
    date_of_birth: string;
    department: string;
    designation: string;
    employee_id: string;
    employment_type: string;
    employment_status: string;
    date_of_joining: string;
    qualification: string;
    specializations: string;
    subject: string;
    profile_picture_url?: string;
    workload_limit?: number;
    branch_id?: string | null;
    salary?: string;
    bank_details?: string;
    // Fix: Added experience_years to resolve "property does not exist" errors in TeacherForm and profile views
    experience_years?: number;
}

export interface TeacherExtended extends UserProfile {
    details: Partial<TeacherProfileData>;
    dailyStatus?: string;
}

export interface TransportProfileData {
    user_id: string;
    route_id: string;
    vehicle_details: string;
    license_info: string;
}

export interface BusRoute {
    id: string;
    name: string;
    description: string;
}

export type BusTripType = 'Morning Pickup' | 'Afternoon Drop-off';
export type BusAttendanceStatus = 'Boarded' | 'Absent';

export interface BusStudent {
    id: string;
    display_name: string;
    grade: string;
    parent_guardian_details: string;
    status?: BusAttendanceStatus;
}

export interface BusAttendanceRecord {
    student_id: string;
    status: BusAttendanceStatus;
    trip_date: string;
    trip_type: BusTripType;
}

export interface TransportDashboardData {
    route: BusRoute;
    students: BusStudent[];
    error?: string;
}

export interface EcommerceProfileData {
    user_id: string;
    store_name: string;
    business_type: string;
}

export type CourseStatus = 'Active' | 'Draft' | 'Archived' | 'Pending' | 'Inactive';

export interface Course {
    id: string;
    title: string;
    code: string;
    grade_level: string;
    description: string;
    credits: number;
    category: string;
    status: CourseStatus;
    teacher_id?: string | null;
    teacher_name?: string;
    department?: string;
    subject_type?: string;
    modules_count?: number;
    enrolled_count?: number;
    branch_id?: string | null;
    created_at?: string;
}

export interface CourseModule {
    id: string;
    course_id: string;
    title: string;
    order_index: number;
    status?: string;
    duration_hours?: number;
}

export interface StudentForAdmin extends UserProfile {
    student_id_number?: string;
    grade: string;
    parent_guardian_details: string;
    assigned_class_id?: string | null;
    assigned_class_name?: string | null;
    // Fix: Added profile_photo_url to resolve "property does not exist" errors in StudentManagementTab
    profile_photo_url?: string | null;
}

export interface VerifiedShareCodeData {
    id?: string;
    found: boolean;
    admission_id: string;
    applicant_name: string;
    grade: string;
    code_type: ShareCodeType;
    error?: string;
}

export interface TeacherClassOverview {
    id: string;
    name: string;
    student_count: number;
}

export interface ClassSubject {
    id: string;
    name: string;
}

export interface TeacherClassDetails {
    roster: StudentRosterItem[];
    assignments: any[];
    studyMaterials: any[];
    subjects: ClassSubject[];
}

export interface LessonPlan {
    id: string;
    title: string;
    subject_name: string;
    objectives: string;
    activities: string;
    lesson_date: string;
    resources: any[];
}

export interface StudentAttendanceRecord {
    date: string;
    status: AttendanceStatus;
    notes?: string;
}

export interface StudentAssignment {
    id: string;
    title: string;
    description: string;
    subject: string;
    due_date: string;
    status: SubmissionStatus;
    submission_grade?: string;
    teacher_feedback?: string;
    file_path?: string;
}

export type SubmissionStatus = 'Not Submitted' | 'Submitted' | 'Late' | 'Graded';

export interface StudyMaterial {
    id: string;
    title: string;
    subject: string;
    file_path: string;
    file_name: string;
    file_type: string;
    created_at: string;
    is_bookmarked?: boolean;
}

export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue' | 'Partial';

export interface StudentInvoice {
    id: string;
    description: string;
    amount: number;
    amount_paid: number;
    due_date: string;
    status: InvoiceStatus;
}

export interface Workshop {
    id: string;
    title: string;
    description: string;
    workshop_date: string;
}

export interface TeacherProfessionalDevelopmentData {
    total_points: number;
    training_records: any[];
    awards: any[];
}

export interface DocumentRequirement {
    id: string;
    admission_id: string;
    document_name: string;
    status: 'Pending' | 'Submitted' | 'Verified' | 'Rejected';
    is_mandatory: boolean;
    notes_for_parent?: string;
    rejection_reason?: string | null;
    applicant_name?: string;
    profile_photo_url?: string | null;
    admission_documents?: any[];
}

export interface TeacherDocument {
    id: string;
    document_name: string;
    document_type: string;
    file_path: string;
    status: string;
    uploaded_at: string;
}

export interface TeacherSubjectMapping {
    id: string;
    teacher_id: string;
    subject_id: string;
    class_id: string;
    academic_year: string;
    class_name: string;
    subject_name: string;
    credits?: number;
    category?: string;
}

export interface BulkImportResult {
    success_count: number;
    failure_count: number;
    errors: any[];
}

export interface SchoolDepartment {
    id: string;
    name: string;
    description?: string;
    hod_id?: string;
    hod_name?: string;
    teacher_count?: number;
    course_count?: number;
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

export interface DuesDashboardData {
    total_dues: number;
    total_overdue: number;
    overdue_student_count: number;
    dues_by_class: ClassDuesInfo[];
    highest_dues_students: StudentDuesInfo[];
}

export interface Expense {
    id: string;
    expense_date: string;
    category: string;
    description: string;
    vendor_name?: string;
    amount: number;
    status: 'Pending' | 'Approved' | 'Rejected';
    invoice_url?: string;
}

export interface ExpenseDashboardData {
    total_expenses_month: number;
    pending_approvals: number;
    recent_expenses: Expense[];
}

export interface FeeCollectionReportItem {
    payment_date: string;
    student_name: string;
    class_name: string;
    amount: number;
    payment_method: string;
}

export interface ExpenseReportItem {
    expense_date: string;
    category: string;
    description: string;
    amount: number;
}

export interface StudentLedgerEntry {
    transaction_date: string;
    description: string;
    type: 'invoice' | 'payment';
    amount: number;
    balance: number;
}

export interface Payment {
    id: string;
    amount: number;
    payment_date: string;
    receipt_number: string;
}

export interface StudentFinanceDetails {
    invoices: StudentInvoice[];
    payments: Payment[];
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

export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export type TimeSlot = string;

export interface TimetableEntry {
    id: string;
    day: Day;
    startTime: TimeSlot;
    endTime: TimeSlot;
    subject: string;
    teacher: string;
    room: string;
    class_name?: string;
    isConflict?: boolean;
}
