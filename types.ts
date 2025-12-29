
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

export type AdmissionStatus = 'Registered' | 'Pending Review' | 'Verified' | 'Approved' | 'Rejected' | 'Cancelled';

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
    // Fix: Added email_confirmed_at to resolve 'Property does not exist' errors in SuperAdminDashboard
    email_confirmed_at?: string | null;
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
    onboarding_step: string;
    academic_board?: string;
    affiliation_number?: string;
    school_type?: string;
    academic_year_start?: string;
    academic_year_end?: string;
    grade_range_start?: string;
    grade_range_end?: string;
    workload_limit?: number;
    // Fix: Added admin_designation to resolve 'Property does not exist' error in SchoolAdminForm
    admin_designation?: string;
}

export interface SchoolBranch {
    id: number;
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    admin_name: string;
    admin_phone: string;
    admin_email: string;
    is_main_branch: boolean;
    status: 'Active' | 'Linked' | 'Pending';
}

export interface AdmissionApplication {
    id: string;
    applicant_name: string;
    grade: string;
    status: AdmissionStatus;
    submitted_at: string;
    registered_at?: string;
    parent_name: string;
    parent_phone: string;
    parent_email: string;
    date_of_birth: string;
    gender: string;
    profile_photo_url: string | null;
    medical_info?: string;
    emergency_contact?: string;
    application_number?: string;
    branch_id: number;
}

export interface SchoolClass {
    id: number;
    name: string;
    grade_level: string;
    section: string;
    academic_year: string;
    class_teacher_id?: string | null;
    branch_id: number;
    capacity: number;
}

export interface StudentRosterItem {
    id: string;
    display_name: string;
    roll_number?: string;
}

export interface AttendanceRecord {
    id?: number;
    student_id: string;
    class_id: number;
    attendance_date: string;
    status: AttendanceStatus;
    notes?: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late';

export interface Course {
    id: number;
    title: string;
    code: string;
    description: string;
    credits: number;
    category: string;
    grade_level: string;
    status: CourseStatus;
    teacher_id?: string | null;
    teacher_name?: string;
    department?: string;
    modules_count?: number;
    enrolled_count?: number;
    subject_type?: string;
    created_at?: string;
}

export type CourseStatus = 'Active' | 'Draft' | 'Archived' | 'Pending' | 'Inactive';

export interface CourseModule {
    id: number;
    course_id: number;
    title: string;
    order_index: number;
    status?: string;
    duration_hours?: number;
}

export interface StudentForAdmin extends UserProfile {
    student_id_number?: string;
    grade: string;
    parent_guardian_details: string;
    assigned_class_id?: number | null;
    assigned_class_name?: string | null;
    gender?: string;
    date_of_birth?: string;
    address?: string;
    // Fix: Added profile_photo_url to resolve 'Property does not exist' errors in StudentManagementTab and StudentProfileModal
    profile_photo_url?: string | null;
}

export interface StudentDashboardData {
    profile: UserProfile & { roll_number?: string; student_id_number?: string; grade: string; parent_guardian_details: string };
    assignments: StudentAssignment[];
    timetable: TimetableEntry[];
    attendanceSummary: StudentAttendanceSummary;
    recentGrades: RecentGrade[];
    classInfo: { name: string; teacher_name: string } | null;
    studyMaterials: StudyMaterial[];
    announcements: Communication[];
    needs_onboarding?: boolean;
    admission: Partial<AdmissionApplication>;
}

export interface StudentAssignment {
    id: number;
    title: string;
    subject: string;
    due_date: string;
    description: string;
    status: SubmissionStatus;
    submission_grade?: string;
    teacher_feedback?: string;
    file_path?: string;
}

export type SubmissionStatus = 'Not Submitted' | 'Submitted' | 'Late' | 'Graded';

export interface TimetableEntry {
    id: string;
    day: Day;
    startTime: string;
    endTime: string;
    subject: string;
    teacher: string;
    room?: string;
    isConflict?: boolean;
    class_name?: string;
}

export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export type TimeSlot = string;

export interface StudentAttendanceSummary {
    total_days: number;
    present_days: number;
    absent_days: number;
    late_days: number;
}

export interface RecentGrade {
    subject: string;
    exam_name: string;
    grade: string;
    marks_obtained: number;
    total_marks: number;
    remarks?: string;
}

export interface StudyMaterial {
    id: number;
    subject: string;
    title: string;
    file_name: string;
    file_path: string;
    file_type: string;
    is_bookmarked: boolean;
    created_at: string;
}

export interface Communication {
    id: string;
    subject: string;
    body: string;
    sent_at: string;
    sender_name: string;
    sender_role: string;
    status?: string;
    recipients: string[];
    target_criteria?: any;
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
    status: string;
    currency: string;
    description?: string;
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
}

export interface AdminAnalyticsStats {
    total_applications: number;
    total_users: number;
    pending_applications: number;
}

export interface MyEnquiry {
    id: string;
    applicant_name: string;
    grade: string;
    status: EnquiryStatus;
    last_updated: string;
}

export interface Enquiry extends MyEnquiry {
    parent_name: string;
    parent_email: string;
    parent_phone: string;
    notes?: string;
    admission_id?: string | null;
    received_at: string;
}

export type EnquiryStatus = 'New' | 'Contacted' | 'In Review' | 'Completed';

export interface TimelineItem {
    id: string;
    item_type: 'MESSAGE' | 'STATUS_CHANGE' | 'NOTE_ADDED' | 'ADMISSION_STATUS_CHANGE' | 'DOCUMENTS_REQUESTED';
    details: any;
    created_at: string;
    created_by_name: string;
    is_admin: boolean;
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

export interface StudentProfileData {
    user_id: string;
    grade: string;
    roll_number?: string;
    student_id_number?: string;
    date_of_birth: string;
    gender: string;
    parent_guardian_details: string;
}

export interface TeacherProfileData {
    user_id: string;
    subject: string;
    qualification: string;
    experience_years: number;
    date_of_joining: string;
    bio?: string;
    specializations?: string;
    profile_picture_url?: string;
    gender: string;
    date_of_birth: string;
    department: string;
    designation: string;
    employee_id: string;
    employment_type: string;
    employment_status: string;
    branch_id?: number | null;
    workload_limit?: number;
    salary?: string;
    bank_details?: string;
}

export interface TeacherExtended extends UserProfile {
    details?: Partial<TeacherProfileData>;
    dailyStatus?: 'Present' | 'Absent' | 'Late';
}

export interface TransportProfileData {
    user_id: string;
    route_id: number;
    vehicle_details: string;
    license_info: string;
}

export interface BusRoute {
    id: number;
    name: string;
    description?: string;
}

export interface EcommerceProfileData {
    user_id: string;
    store_name: string;
    business_type: string;
}

export interface TeacherDocument {
    id: number;
    document_name: string;
    document_type: string;
    file_path: string;
    status: string;
    uploaded_at: string;
}

export interface TeacherSubjectMapping {
    id: number;
    teacher_id: string;
    subject_id: number;
    class_id: number;
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
    id: number;
    name: string;
    description: string;
    hod_id?: string | null;
    hod_name?: string | null;
    teacher_count?: number;
    course_count?: number;
}

export interface DocumentRequirement {
    id: number;
    admission_id: string;
    document_name: string;
    status: 'Pending' | 'Submitted' | 'Accepted' | 'Rejected' | 'Verified';
    is_mandatory: boolean;
    notes_for_parent?: string;
    rejection_reason?: string;
    admission_documents?: any[];
}

export interface StudentInvoice {
    id: number;
    due_date: string;
    description: string;
    amount: number;
    amount_paid: number;
    status: InvoiceStatus;
}

export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue' | 'Partial';

export interface TransportDashboardData {
    route: BusRoute;
    students: BusStudent[];
}

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
}

export type BusTripType = 'Morning Pickup' | 'Afternoon Drop-off';
export type BusAttendanceStatus = 'Boarded' | 'Absent';

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

export interface ExpenseDashboardData {
    total_expenses_month: number;
    pending_approvals: number;
    recent_expenses: Expense[];
}

export interface Expense {
    id: number;
    expense_date: string;
    category: string;
    description: string;
    vendor_name: string;
    amount: number;
    status: 'Pending' | 'Approved' | 'Rejected';
    invoice_url?: string;
}

export interface FeeCollectionReportItem {
    payment_date: string;
    student_name: string;
    amount: number;
    method: string;
}

export interface ExpenseReportItem {
    expense_date: string;
    category: string;
    amount: number;
    status: string;
}

export interface StudentLedgerEntry {
    transaction_date: string;
    description: string;
    type: string;
    amount: number;
}

export interface StudentFinanceDetails {
    invoices: StudentInvoice[];
    payments: Payment[];
}

export interface Payment {
    id: number;
    payment_date: string;
    amount: number;
    receipt_number: string;
    method: string;
}

export interface ShareCode {
    id: number;
    admission_id: string;
    applicant_name: string;
    code: string;
    status: ShareCodeStatus;
    expires_at: string;
    code_type: ShareCodeType;
    profile_photo_url?: string | null;
}

export type ShareCodeStatus = 'Active' | 'Expired' | 'Revoked' | 'Redeemed';
export type ShareCodeType = 'Enquiry' | 'Admission';

export interface VerifiedShareCodeData {
    found: boolean;
    admission_id: string;
    applicant_name: string;
    grade: string;
    parent_name: string;
    parent_phone: string;
    code_type: string;
    error?: string;
}

export interface TeacherClassOverview {
    id: number;
    name: string;
    student_count: number;
}

export interface TeacherClassDetails {
    roster: StudentRosterItem[];
    assignments: any[];
    studyMaterials: any[];
    subjects: ClassSubject[];
}

export interface ClassSubject {
    id: number;
    name: string;
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

export interface ClassPerformanceSummary {
    average_grade: number;
    attendance_rate: number;
}

export interface StudentPerformanceReport {
    attendance_summary: { present: number, absent: number, late: number };
    assignments: any[];
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

export type FunctionComponentWithIcon<T> = React.FC<T> & { Icon?: React.FC<React.SVGProps<SVGSVGElement>> };

export interface StudentAttendanceRecord {
    date: string;
    status: 'Present' | 'Absent' | 'Late';
    notes?: string;
}
