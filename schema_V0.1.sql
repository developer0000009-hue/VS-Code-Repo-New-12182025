-- ===============================================================================================
--  GURUKUL OS - COMPLETE PRODUCTION SCHEMA
--  Version: 12.0.0 (Production-Ready with RLS, Multi-Tenant Support)
--  Description: Single authoritative schema for complete school management system
--  Features: Row Level Security, Multi-Tenant Architecture, Audit Logging, Soft Deletes
--  Roles: Super Admin, School Admin, Teacher, Student, Parent/Guardian, Transport, E-commerce
-- ===============================================================================================

BEGIN;

-- ===============================================================================================
-- 1. EXTENSIONS
-- ===============================================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================================================================================
-- 2. ENUMS / CUSTOM TYPES
-- ===============================================================================================

-- User roles enum
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM (
    'super_admin',
    'school_admin',
    'branch_admin',
    'teacher',
    'student',
    'parent',
    'transport_staff',
    'ecommerce_operator',
    'principal',
    'hr_manager',
    'academic_coordinator',
    'accountant',
    'minimal_admin'
);

-- Admission status enum
DROP TYPE IF EXISTS admission_status CASCADE;
CREATE TYPE admission_status AS ENUM (
    'enquiry',
    'pending_review',
    'documents_requested',
    'approved',
    'rejected',
    'waitlisted',
    'converted'
);

-- Enquiry status enum
DROP TYPE IF EXISTS enquiry_status CASCADE;
CREATE TYPE enquiry_status AS ENUM (
    'new',
    'contacted',
    'verified',
    'in_review',
    'completed',
    'converted'
);

-- Attendance status enum
DROP TYPE IF EXISTS attendance_status CASCADE;
CREATE TYPE attendance_status AS ENUM (
    'present',
    'absent',
    'late',
    'excused'
);

-- Branch status enum
DROP TYPE IF EXISTS branch_status CASCADE;
CREATE TYPE branch_status AS ENUM (
    'active',
    'inactive',
    'linked',
    'pending'
);

-- Course status enum
DROP TYPE IF EXISTS course_status CASCADE;
CREATE TYPE course_status AS ENUM (
    'active',
    'draft',
    'archived',
    'pending',
    'inactive'
);

-- Subject type enum
DROP TYPE IF EXISTS subject_type CASCADE;
CREATE TYPE subject_type AS ENUM (
    'academic',
    'elective',
    'co_curricular',
    'sports',
    'arts'
);

-- Enrollment status enum
DROP TYPE IF EXISTS enrollment_status CASCADE;
CREATE TYPE enrollment_status AS ENUM (
    'active',
    'inactive',
    'transferred',
    'graduated',
    'dropped'
);

-- Assignment type enum
DROP TYPE IF EXISTS assignment_type CASCADE;
CREATE TYPE assignment_type AS ENUM (
    'homework',
    'project',
    'quiz',
    'exam',
    'lab'
);

-- Assignment status enum
DROP TYPE IF EXISTS assignment_status CASCADE;
CREATE TYPE assignment_status AS ENUM (
    'active',
    'draft',
    'published',
    'closed'
);

-- Submission status enum
DROP TYPE IF EXISTS submission_status CASCADE;
CREATE TYPE submission_status AS ENUM (
    'not_submitted',
    'submitted',
    'late',
    'graded'
);

-- Exam type enum
DROP TYPE IF EXISTS exam_type CASCADE;
CREATE TYPE exam_type AS ENUM (
    'midterm',
    'final',
    'quiz',
    'test',
    'practical',
    'assignment'
);

-- Exam status enum
DROP TYPE IF EXISTS exam_status CASCADE;
CREATE TYPE exam_status AS ENUM (
    'scheduled',
    'in_progress',
    'completed',
    'cancelled'
);

-- Result status enum
DROP TYPE IF EXISTS result_status CASCADE;
CREATE TYPE result_status AS ENUM (
    'pending',
    'published',
    'corrected'
);

-- Document status enum
DROP TYPE IF EXISTS document_status CASCADE;
CREATE TYPE document_status AS ENUM (
    'pending',
    'submitted',
    'accepted',
    'rejected',
    'verified'
);

-- Fee status enum
DROP TYPE IF EXISTS fee_status CASCADE;
CREATE TYPE fee_status AS ENUM (
    'active',
    'inactive',
    'draft'
);

-- Fee assignment status enum
DROP TYPE IF EXISTS fee_assignment_status CASCADE;
CREATE TYPE fee_assignment_status AS ENUM (
    'active',
    'inactive',
    'waived'
);

-- Invoice status enum
DROP TYPE IF EXISTS invoice_status CASCADE;
CREATE TYPE invoice_status AS ENUM (
    'pending',
    'partial',
    'paid',
    'overdue',
    'cancelled'
);

-- Payment method enum
DROP TYPE IF EXISTS payment_method CASCADE;
CREATE TYPE payment_method AS ENUM (
    'cash',
    'cheque',
    'online',
    'bank_transfer',
    'card'
);

-- Expense status enum
DROP TYPE IF EXISTS expense_status CASCADE;
CREATE TYPE expense_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'paid'
);

-- Transport status enum
DROP TYPE IF EXISTS transport_status CASCADE;
CREATE TYPE transport_status AS ENUM (
    'active',
    'inactive',
    'maintenance'
);

-- Vehicle status enum
DROP TYPE IF EXISTS vehicle_status CASCADE;
CREATE TYPE vehicle_status AS ENUM (
    'active',
    'inactive',
    'maintenance',
    'retired'
);

-- Academic year status enum
DROP TYPE IF EXISTS academic_year_status CASCADE;
CREATE TYPE academic_year_status AS ENUM (
    'active',
    'inactive',
    'completed'
);

-- Class timetable status enum
DROP TYPE IF EXISTS timetable_status CASCADE;
CREATE TYPE timetable_status AS ENUM (
    'active',
    'inactive'
);

-- ===============================================================================================
-- 3. SEQUENCES
-- ===============================================================================================

-- Application number sequence
DROP SEQUENCE IF EXISTS application_number_seq CASCADE;
CREATE SEQUENCE application_number_seq START WITH 10000 INCREMENT BY 1;

-- Invoice number sequence
DROP SEQUENCE IF EXISTS invoice_number_seq CASCADE;
CREATE SEQUENCE invoice_number_seq START WITH 100000 INCREMENT BY 1;

-- ===============================================================================================
-- 4. TABLES
-- ===============================================================================================

-- Audit logs table
DROP TABLE IF EXISTS public.audit_logs CASCADE;
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT now(),
    ip_address INET,
    user_agent TEXT
);

-- User profiles table
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    phone TEXT,
    role user_role,
    profile_completed BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    branch_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    email_confirmed_at TIMESTAMPTZ,
    -- Common fields for all users
    profile_photo_url TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    pin_code TEXT,
    date_of_birth DATE,
    gender TEXT,
    emergency_contact TEXT
);

-- School branches table
DROP TABLE IF EXISTS public.school_branches CASCADE;
CREATE TABLE public.school_branches (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    is_main_branch BOOLEAN DEFAULT false,
    admin_name TEXT,
    admin_phone TEXT,
    admin_email TEXT,
    status branch_status DEFAULT 'active',
    academic_year_start DATE,
    academic_year_end DATE,
    grade_range_start TEXT,
    grade_range_end TEXT,
    contact_person_name TEXT,
    contact_person_phone TEXT,
    contact_person_email TEXT,
    established_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- School departments table
DROP TABLE IF EXISTS public.school_departments CASCADE;
CREATE TABLE public.school_departments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    branch_id BIGINT REFERENCES public.school_branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    hod_id UUID REFERENCES public.profiles(id),
    teacher_count INT DEFAULT 0,
    course_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Academic years table
DROP TABLE IF EXISTS public.academic_years CASCADE;
CREATE TABLE public.academic_years (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    branch_id BIGINT REFERENCES public.school_branches(id) ON DELETE CASCADE,
    year_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    status academic_year_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- School classes table
DROP TABLE IF EXISTS public.school_classes CASCADE;
CREATE TABLE public.school_classes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    branch_id BIGINT REFERENCES public.school_branches(id) ON DELETE CASCADE,
    academic_year_id BIGINT REFERENCES public.academic_years(id),
    name TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    section TEXT,
    academic_year TEXT,
    class_teacher_id UUID REFERENCES public.profiles(id),
    department_id BIGINT REFERENCES public.school_departments(id),
    capacity INT DEFAULT 30,
    student_count INT DEFAULT 0,
    description TEXT,
    room_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Courses table
DROP TABLE IF EXISTS public.courses CASCADE;
CREATE TABLE public.courses (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    branch_id BIGINT REFERENCES public.school_branches(id) ON DELETE CASCADE,
    department_id BIGINT REFERENCES public.school_departments(id),
    title TEXT NOT NULL,
    code TEXT UNIQUE,
    grade_level TEXT,
    description TEXT,
    credits INT DEFAULT 1,
    category TEXT,
    subject_type subject_type DEFAULT 'academic',
    status course_status DEFAULT 'active',
    syllabus TEXT,
    objectives TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Teacher subject assignments table
DROP TABLE IF EXISTS public.teacher_subject_assignments CASCADE;
CREATE TABLE public.teacher_subject_assignments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id BIGINT REFERENCES public.courses(id) ON DELETE CASCADE,
    class_id BIGINT REFERENCES public.school_classes(id) ON DELETE CASCADE,
    academic_year TEXT,
    workload_hours INT DEFAULT 1,
    is_primary BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Pending')),
    assigned_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Student enrollments table
DROP TABLE IF EXISTS public.student_enrollments CASCADE;
CREATE TABLE public.student_enrollments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id BIGINT REFERENCES public.school_classes(id) ON DELETE CASCADE,
    academic_year TEXT,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status enrollment_status DEFAULT 'active',
    roll_number TEXT,
    student_id_number TEXT,
    parent_guardian_details TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Class timetables table
DROP TABLE IF EXISTS public.class_timetables CASCADE;
CREATE TABLE public.class_timetables (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    class_id BIGINT REFERENCES public.school_classes(id) ON DELETE CASCADE,
    day_of_week TEXT CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    course_id BIGINT REFERENCES public.courses(id),
    teacher_id UUID REFERENCES public.profiles(id),
    room_number TEXT,
    subject_name TEXT,
    status timetable_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Attendance records table
DROP TABLE IF EXISTS public.attendance_records CASCADE;
CREATE TABLE public.attendance_records (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id BIGINT REFERENCES public.school_classes(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status attendance_status DEFAULT 'present',
    notes TEXT,
    marked_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(student_id, class_id, attendance_date)
);

-- Assignments table
DROP TABLE IF EXISTS public.assignments CASCADE;
CREATE TABLE public.assignments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    course_id BIGINT REFERENCES public.courses(id) ON DELETE CASCADE,
    class_id BIGINT REFERENCES public.school_classes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    assignment_type assignment_type DEFAULT 'homework',
    due_date TIMESTAMPTZ,
    total_marks INT DEFAULT 100,
    attachments TEXT[],
    status assignment_status DEFAULT 'active',
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Assignment submissions table
DROP TABLE IF EXISTS public.assignment_submissions CASCADE;
CREATE TABLE public.assignment_submissions (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    assignment_id BIGINT REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    submission_text TEXT,
    file_paths TEXT[],
    submitted_at TIMESTAMPTZ DEFAULT now(),
    is_late BOOLEAN DEFAULT false,
    status submission_status DEFAULT 'not_submitted',
    marks_obtained INT,
    teacher_feedback TEXT,
    graded_by UUID REFERENCES public.profiles(id),
    graded_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(assignment_id, student_id)
);

-- Exams table
DROP TABLE IF EXISTS public.exams CASCADE;
CREATE TABLE public.exams (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    course_id BIGINT REFERENCES public.courses(id) ON DELETE CASCADE,
    class_id BIGINT REFERENCES public.school_classes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    exam_type exam_type,
    exam_date TIMESTAMPTZ NOT NULL,
    duration_minutes INT,
    total_marks INT DEFAULT 100,
    instructions TEXT,
    room_number TEXT,
    status exam_status DEFAULT 'scheduled',
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Exam results table
DROP TABLE IF EXISTS public.exam_results CASCADE;
CREATE TABLE public.exam_results (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    exam_id BIGINT REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    marks_obtained INT,
    grade TEXT,
    rank INT,
    status result_status DEFAULT 'pending',
    remarks TEXT,
    graded_by UUID REFERENCES public.profiles(id),
    graded_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(exam_id, student_id)
);

-- Admissions table
DROP TABLE IF EXISTS public.admissions CASCADE;
CREATE TABLE public.admissions (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    applicant_name TEXT NOT NULL,
    grade TEXT NOT NULL,
    status admission_status DEFAULT 'enquiry',
    submitted_at TIMESTAMPTZ DEFAULT now(),
    submitted_by UUID REFERENCES public.profiles(id),
    parent_id UUID REFERENCES public.profiles(id),
    parent_name TEXT,
    parent_email TEXT,
    parent_phone TEXT,
    date_of_birth DATE,
    gender TEXT,
    profile_photo_url TEXT,
    medical_info TEXT,
    emergency_contact TEXT,
    application_number TEXT UNIQUE DEFAULT 'APP-' || nextval('application_number_seq')::TEXT,
    student_user_id UUID REFERENCES public.profiles(id),
    branch_id BIGINT REFERENCES public.school_branches(id),
    previous_school TEXT,
    previous_grade TEXT,
    transport_required BOOLEAN DEFAULT false,
    special_requirements TEXT,
    notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Document requirements table
DROP TABLE IF EXISTS public.document_requirements CASCADE;
CREATE TABLE public.document_requirements (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    admission_id BIGINT REFERENCES public.admissions(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    status document_status DEFAULT 'pending',
    notes_for_parent TEXT,
    rejection_reason TEXT,
    is_mandatory BOOLEAN DEFAULT true,
    document_type TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Admission documents table
DROP TABLE IF EXISTS public.admission_documents CASCADE;
CREATE TABLE public.admission_documents (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    requirement_id BIGINT REFERENCES public.document_requirements(id) ON DELETE CASCADE,
    admission_id BIGINT REFERENCES public.admissions(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Fee structures table
DROP TABLE IF EXISTS public.fee_structures CASCADE;
CREATE TABLE public.fee_structures (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    branch_id BIGINT REFERENCES public.school_branches(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    name TEXT NOT NULL,
    target_grade TEXT,
    description TEXT,
    currency TEXT DEFAULT 'INR',
    total_amount DECIMAL(12,2),
    status fee_status DEFAULT 'active',
    effective_from DATE,
    effective_to DATE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Fee components table
DROP TABLE IF EXISTS public.fee_components CASCADE;
CREATE TABLE public.fee_components (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    fee_structure_id BIGINT REFERENCES public.fee_structures(id) ON DELETE CASCADE,
    component_name TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    is_mandatory BOOLEAN DEFAULT true,
    due_date DATE,
    late_fee DECIMAL(8,2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Student fee assignments table
DROP TABLE IF EXISTS public.student_fee_assignments CASCADE;
CREATE TABLE public.student_fee_assignments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    fee_structure_id BIGINT REFERENCES public.fee_structures(id) ON DELETE CASCADE,
    assigned_date DATE DEFAULT CURRENT_DATE,
    status fee_assignment_status DEFAULT 'active',
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    assigned_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Fee invoices table
DROP TABLE IF EXISTS public.fee_invoices CASCADE;
CREATE TABLE public.fee_invoices (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    fee_structure_id BIGINT REFERENCES public.fee_structures(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE DEFAULT 'INV-' || nextval('invoice_number_seq')::TEXT,
    due_date DATE NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    status invoice_status DEFAULT 'pending',
    payment_method payment_method,
    academic_year TEXT,
    description TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Fee payments table
DROP TABLE IF EXISTS public.fee_payments CASCADE;
CREATE TABLE public.fee_payments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    invoice_id BIGINT REFERENCES public.fee_invoices(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT now(),
    payment_method payment_method,
    transaction_id TEXT,
    receipt_number TEXT,
    collected_by UUID REFERENCES public.profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Expenses table
DROP TABLE IF EXISTS public.expenses CASCADE;
CREATE TABLE public.expenses (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    branch_id BIGINT REFERENCES public.school_branches(id) ON DELETE CASCADE,
    expense_date DATE NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    amount DECIMAL(12,2) NOT NULL,
    vendor_name TEXT,
    description TEXT,
    receipt_url TEXT,
    status expense_status DEFAULT 'pending',
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Transport routes table
DROP TABLE IF EXISTS public.transport_routes CASCADE;
CREATE TABLE public.transport_routes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    branch_id BIGINT REFERENCES public.school_branches(id) ON DELETE CASCADE,
    route_name TEXT NOT NULL,
    description TEXT,
    start_location TEXT,
    end_location TEXT,
    estimated_duration_minutes INT,
    fare DECIMAL(8,2),
    capacity INT,
    status transport_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Transport vehicles table
DROP TABLE IF EXISTS public.transport_vehicles CASCADE;
CREATE TABLE public.transport_vehicles (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    route_id BIGINT REFERENCES public.transport_routes(id),
    vehicle_number TEXT UNIQUE NOT NULL,
    vehicle_type TEXT,
    capacity INT,
    driver_id UUID REFERENCES public.profiles(id),
    conductor_id UUID REFERENCES public.profiles(id),
    fuel_type TEXT,
    purchase_date DATE,
    insurance_expiry DATE,
    fitness_expiry DATE,
    status vehicle_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Student transport assignments table
DROP TABLE IF EXISTS public.student_transport_assignments CASCADE;
CREATE TABLE public.student_transport_assignments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    route_id BIGINT REFERENCES public.transport_routes(id) ON DELETE CASCADE,
    pickup_location TEXT,
    drop_location TEXT,
    is_active BOOLEAN DEFAULT true,
    assigned_date DATE DEFAULT CURRENT_DATE,
    assigned_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Enrollments table for tracking student enrollments
DROP TABLE IF EXISTS public.enrollments CASCADE;
CREATE TABLE public.enrollments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    branch_id BIGINT REFERENCES public.school_branches(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    grade TEXT NOT NULL,
    application_status TEXT DEFAULT 'ADMITTED' CHECK (application_status IN ('ADMITTED', 'REJECTED', 'PENDING')),
    enrollment_status TEXT DEFAULT 'FINALIZED' CHECK (enrollment_status IN ('FINALIZED', 'ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED', 'DROPPED')),
    class_id BIGINT REFERENCES public.school_classes(id),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    roll_number TEXT,
    student_id_number TEXT,
    parent_guardian_details TEXT,
    admission_id BIGINT REFERENCES public.admissions(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===============================================================================================
-- 5. FOREIGN KEYS / CONSTRAINTS / INDEXES
-- ===============================================================================================

-- Add foreign key constraints (already defined in table creation, but explicit here for clarity)

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_branch_id ON public.profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_school_branches_status ON public.school_branches(status);
CREATE INDEX IF NOT EXISTS idx_school_branches_created_at ON public.school_branches(created_at);

CREATE INDEX IF NOT EXISTS idx_school_departments_branch_id ON public.school_departments(branch_id);
CREATE INDEX IF NOT EXISTS idx_school_departments_hod_id ON public.school_departments(hod_id);

CREATE INDEX IF NOT EXISTS idx_academic_years_branch_id ON public.academic_years(branch_id);
CREATE INDEX IF NOT EXISTS idx_academic_years_is_current ON public.academic_years(is_current) WHERE is_current = true;

CREATE INDEX IF NOT EXISTS idx_school_classes_branch_id ON public.school_classes(branch_id);
CREATE INDEX IF NOT EXISTS idx_school_classes_class_teacher_id ON public.school_classes(class_teacher_id);
CREATE INDEX IF NOT EXISTS idx_school_classes_academic_year_id ON public.school_classes(academic_year_id);

CREATE INDEX IF NOT EXISTS idx_courses_branch_id ON public.courses(branch_id);
CREATE INDEX IF NOT EXISTS idx_courses_department_id ON public.courses(department_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);

CREATE INDEX IF NOT EXISTS idx_teacher_subject_assignments_teacher_id ON public.teacher_subject_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subject_assignments_course_id ON public.teacher_subject_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subject_assignments_class_id ON public.teacher_subject_assignments(class_id);

CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_id ON public.student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_class_id ON public.student_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_status ON public.student_enrollments(status);

CREATE INDEX IF NOT EXISTS idx_class_timetables_class_id ON public.class_timetables(class_id);
CREATE INDEX IF NOT EXISTS idx_class_timetables_day_of_week ON public.class_timetables(day_of_week);

CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON public.attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_class_id ON public.attendance_records(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON public.attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_created_at ON public.attendance_records(created_at);

CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON public.assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON public.assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.assignments(due_date);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON public.assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status ON public.assignment_submissions(status);

CREATE INDEX IF NOT EXISTS idx_exams_course_id ON public.exams(course_id);
CREATE INDEX IF NOT EXISTS idx_exams_class_id ON public.exams(class_id);
CREATE INDEX IF NOT EXISTS idx_exams_exam_date ON public.exams(exam_date);

CREATE INDEX IF NOT EXISTS idx_exam_results_exam_id ON public.exam_results(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student_id ON public.exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_status ON public.exam_results(status);

CREATE INDEX IF NOT EXISTS idx_admissions_status ON public.admissions(status);
CREATE INDEX IF NOT EXISTS idx_admissions_branch_id ON public.admissions(branch_id);
CREATE INDEX IF NOT EXISTS idx_admissions_submitted_by ON public.admissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_admissions_parent_id ON public.admissions(parent_id);
CREATE INDEX IF NOT EXISTS idx_admissions_student_user_id ON public.admissions(student_user_id);
CREATE INDEX IF NOT EXISTS idx_admissions_created_at ON public.admissions(created_at);

CREATE INDEX IF NOT EXISTS idx_document_requirements_admission_id ON public.document_requirements(admission_id);
CREATE INDEX IF NOT EXISTS idx_document_requirements_status ON public.document_requirements(status);

CREATE INDEX IF NOT EXISTS idx_admission_documents_requirement_id ON public.admission_documents(requirement_id);
CREATE INDEX IF NOT EXISTS idx_admission_documents_admission_id ON public.admission_documents(admission_id);

CREATE INDEX IF NOT EXISTS idx_fee_structures_branch_id ON public.fee_structures(branch_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_status ON public.fee_structures(status);

CREATE INDEX IF NOT EXISTS idx_fee_components_fee_structure_id ON public.fee_components(fee_structure_id);

CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_student_id ON public.student_fee_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_fee_structure_id ON public.student_fee_assignments(fee_structure_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_status ON public.student_fee_assignments(status);

CREATE INDEX IF NOT EXISTS idx_fee_invoices_student_id ON public.fee_invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_status ON public.fee_invoices(status);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_due_date ON public.fee_invoices(due_date);

CREATE INDEX IF NOT EXISTS idx_fee_payments_invoice_id ON public.fee_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_payment_date ON public.fee_payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_expenses_branch_id ON public.expenses(branch_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);

CREATE INDEX IF NOT EXISTS idx_transport_routes_branch_id ON public.transport_routes(branch_id);
CREATE INDEX IF NOT EXISTS idx_transport_routes_status ON public.transport_routes(status);

CREATE INDEX IF NOT EXISTS idx_transport_vehicles_route_id ON public.transport_vehicles(route_id);
CREATE INDEX IF NOT EXISTS idx_transport_vehicles_status ON public.transport_vehicles(status);

CREATE INDEX IF NOT EXISTS idx_student_transport_assignments_student_id ON public.student_transport_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_transport_assignments_route_id ON public.student_transport_assignments(route_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON public.audit_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON public.audit_logs(changed_at);



-- ===============================================================================================
-- 6. FUNCTIONS
-- ===============================================================================================

-- Function to check if user is admin
DROP FUNCTION IF EXISTS public.is_admin(UUID);
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND role IN ('super_admin', 'school_admin', 'branch_admin', 'principal', 'minimal_admin')
    AND is_active = true
    AND deleted_at IS NULL
  );
$$;

-- Function to get user's role
DROP FUNCTION IF EXISTS public.get_my_role();
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles
  WHERE id = auth.uid()
  AND is_active = true
  AND deleted_at IS NULL;
$$;

-- Function to get user's branch IDs
DROP FUNCTION IF EXISTS public.get_my_branch_ids();
CREATE OR REPLACE FUNCTION public.get_my_branch_ids()
RETURNS BIGINT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(branch_id) FROM profiles
  WHERE id = auth.uid()
  AND is_active = true
  AND deleted_at IS NULL;
$$;

-- Function to check if user can access branch
DROP FUNCTION IF EXISTS public.can_access_branch(BIGINT);
CREATE OR REPLACE FUNCTION public.can_access_branch(branch_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'school_admin') THEN true
    WHEN (SELECT branch_id FROM profiles WHERE id = auth.uid()) = branch_id THEN true
    ELSE false
  END;
$$;

-- Function to switch active role
DROP FUNCTION IF EXISTS public.switch_active_role(TEXT);
CREATE OR REPLACE FUNCTION public.switch_active_role(p_target_role TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_current_role TEXT;
    v_profile_restored BOOLEAN := false;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Get current role
    SELECT role INTO v_current_role
    FROM profiles
    WHERE id = v_user_id;

    -- Update the role
    UPDATE profiles
    SET role = p_target_role,
        updated_at = now()
    WHERE id = v_user_id;

    -- Check if this is restoring an existing profile
    IF v_current_role IS NOT NULL AND v_current_role != p_target_role THEN
        v_profile_restored := true;
    END IF;

    -- Return result
    RETURN jsonb_build_object(
        'success', true,
        'profile_restored', v_profile_restored,
        'target_role', p_target_role
    );
END;
$$;

-- ===============================================================================================
-- 7. TRIGGERS
-- ===============================================================================================

-- Function for updated_at trigger
DROP FUNCTION IF EXISTS public.handle_updated_at();
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Function for profile creation on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Temporarily disable RLS for profile creation
    SET LOCAL row_security = off;
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name');
    SET LOCAL row_security = on;
    RETURN NEW;
END;
$$;

-- Apply updated_at trigger to all tables
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_school_branches_updated_at
    BEFORE UPDATE ON public.school_branches
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_school_departments_updated_at
    BEFORE UPDATE ON public.school_departments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_academic_years_updated_at
    BEFORE UPDATE ON public.academic_years
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_school_classes_updated_at
    BEFORE UPDATE ON public.school_classes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_teacher_subject_assignments_updated_at
    BEFORE UPDATE ON public.teacher_subject_assignments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_student_enrollments_updated_at
    BEFORE UPDATE ON public.student_enrollments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_class_timetables_updated_at
    BEFORE UPDATE ON public.class_timetables
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_attendance_records_updated_at
    BEFORE UPDATE ON public.attendance_records
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_assignments_updated_at
    BEFORE UPDATE ON public.assignments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_assignment_submissions_updated_at
    BEFORE UPDATE ON public.assignment_submissions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_exams_updated_at
    BEFORE UPDATE ON public.exams
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_exam_results_updated_at
    BEFORE UPDATE ON public.exam_results
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_admissions_updated_at
    BEFORE UPDATE ON public.admissions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_document_requirements_updated_at
    BEFORE UPDATE ON public.document_requirements
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_admission_documents_updated_at
    BEFORE UPDATE ON public.admission_documents
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_fee_structures_updated_at
    BEFORE UPDATE ON public.fee_structures
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_fee_components_updated_at
    BEFORE UPDATE ON public.fee_components
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_student_fee_assignments_updated_at
    BEFORE UPDATE ON public.student_fee_assignments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_fee_invoices_updated_at
    BEFORE UPDATE ON public.fee_invoices
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_fee_payments_updated_at
    BEFORE UPDATE ON public.fee_payments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_transport_routes_updated_at
    BEFORE UPDATE ON public.transport_routes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_transport_vehicles_updated_at
    BEFORE UPDATE ON public.transport_vehicles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_student_transport_assignments_updated_at
    BEFORE UPDATE ON public.student_transport_assignments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for auto-creating profiles
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===============================================================================================
-- 8. VIEWS
-- ===============================================================================================

-- Admin dashboard view for user statistics
DROP VIEW IF EXISTS public.admin_user_stats;
CREATE VIEW public.admin_user_stats AS
SELECT
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as total_students,
    COUNT(CASE WHEN role = 'teacher' THEN 1 END) as total_teachers,
    COUNT(CASE WHEN role = 'parent' THEN 1 END) as total_parents,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_users
FROM public.profiles
WHERE deleted_at IS NULL;

-- Admin dashboard view for admission statistics
DROP VIEW IF EXISTS public.admin_admission_stats;
CREATE VIEW public.admin_admission_stats AS
SELECT
    COUNT(*) as total_applications,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_applications,
    COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending_applications,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_applications
FROM public.admissions
WHERE deleted_at IS NULL;

-- Admin dashboard view for finance statistics
DROP VIEW IF EXISTS public.admin_finance_stats;
CREATE VIEW public.admin_finance_stats AS
SELECT
    SUM(total_amount) as total_billed,
    SUM(paid_amount) as total_paid,
    SUM(total_amount - paid_amount) as total_outstanding,
    COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_invoices
FROM public.fee_invoices
WHERE deleted_at IS NULL;

-- ===============================================================================================
-- 9. ENABLE ROW LEVEL SECURITY
-- ===============================================================================================

-- Enable RLS on all user-facing tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subject_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admission_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_transport_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- ===============================================================================================
-- 10. RLS POLICIES
-- ===============================================================================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (is_admin(auth.uid()));

-- School branches policies
DROP POLICY IF EXISTS "Admins can manage school branches" ON public.school_branches;
CREATE POLICY "Admins can manage school branches" ON public.school_branches
    FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view branches they belong to" ON public.school_branches;
CREATE POLICY "Users can view branches they belong to" ON public.school_branches
    FOR SELECT USING (can_access_branch(id));

-- School departments policies
DROP POLICY IF EXISTS "Admins can manage departments" ON public.school_departments;
CREATE POLICY "Admins can manage departments" ON public.school_departments
    FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view departments in their branch" ON public.school_departments;
CREATE POLICY "Users can view departments in their branch" ON public.school_departments
    FOR SELECT USING (can_access_branch(branch_id));

-- Academic years policies
DROP POLICY IF EXISTS "Admins can manage academic years" ON public.academic_years;
CREATE POLICY "Admins can manage academic years" ON public.academic_years
    FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view academic years in their branch" ON public.academic_years;
CREATE POLICY "Users can view academic years in their branch" ON public.academic_years
    FOR SELECT USING (can_access_branch(branch_id));

-- School classes policies
DROP POLICY IF EXISTS "Admins can manage classes" ON public.school_classes;
CREATE POLICY "Admins can manage classes" ON public.school_classes
    FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Teachers can view classes they teach" ON public.school_classes;
CREATE POLICY "Teachers can view classes they teach" ON public.school_classes
    FOR SELECT USING (
        class_teacher_id = auth.uid() OR
        EXISTS (SELECT 1 FROM teacher_subject_assignments WHERE teacher_id = auth.uid() AND class_id = school_classes.id)
    );

DROP POLICY IF EXISTS "Students can view their classes" ON public.school_classes;
CREATE POLICY "Students can view their classes" ON public.school_classes
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM student_enrollments WHERE student_id = auth.uid() AND class_id = school_classes.id)
    );

-- Courses policies
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
CREATE POLICY "Admins can manage courses" ON public.courses
    FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view courses in their branch" ON public.courses;
CREATE POLICY "Users can view courses in their branch" ON public.courses
    FOR SELECT USING (can_access_branch(branch_id));

-- Teacher subject assignments policies
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.teacher_subject_assignments;
CREATE POLICY "Admins can manage assignments" ON public.teacher_subject_assignments
    FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Teachers can view their assignments" ON public.teacher_subject_assignments;
CREATE POLICY "Teachers can view their assignments" ON public.teacher_subject_assignments
    FOR SELECT USING (teacher_id = auth.uid());

-- Student enrollments policies
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.student_enrollments;
CREATE POLICY "Admins can manage enrollments" ON public.student_enrollments
    FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Students can view their enrollments" ON public.student_enrollments;
CREATE POLICY "Students can view their enrollments" ON public.student_enrollments
    FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Parents can view their children's enrollments" ON public.student_enrollments;
CREATE POLICY "Parents can view their children's enrollments" ON public.student_enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'parent'
            AND student_enrollments.parent_guardian_details ILIKE '%' || p.display_name || '%'
        )
    );

-- Attendance records policies
DROP POLICY IF EXISTS "Admins can manage attendance" ON public.attendance_records;
CREATE POLICY "Admins can manage attendance" ON public.attendance_records
    FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Teachers can manage attendance in their classes" ON public.attendance_records;
CREATE POLICY "Teachers can manage attendance in their classes" ON public.attendance_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM school_classes
            WHERE id = attendance_records.class_id
            AND (class_teacher_id = auth.uid() OR
                 EXISTS (SELECT 1 FROM teacher_subject_assignments WHERE teacher_id = auth.uid() AND class_id = school_classes.id))
        )
    );

DROP POLICY IF EXISTS "Students can view their attendance" ON public.attendance_records;
CREATE POLICY "Students can view their attendance" ON public.attendance_records
    FOR SELECT USING (student_id = auth.uid());

-- Assignments policies
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.assignments;
CREATE POLICY "Admins can manage assignments" ON public.assignments
    FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Teachers can manage assignments in their classes" ON public.assignments;
CREATE POLICY "Teachers can manage assignments in their classes" ON public.assignments
    FOR ALL USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM teacher_subject_assignments
            WHERE teacher_id = auth.uid() AND course_id = assignments.course_id AND class_id = assignments.class_id
        )
    );

DROP POLICY IF EXISTS "Students can view assignments in their classes" ON public.assignments;
CREATE POLICY "Students can view assignments in their classes" ON public.assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM student_enrollments
            WHERE student_id = auth.uid() AND class_id = assignments.class_id
        )
    );

-- Assignment submissions policies
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.assignment_submissions;
CREATE POLICY "Admins can view all submissions" ON public.assignment_submissions
    FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Teachers can manage submissions for their assignments" ON public.assignment_submissions;
CREATE POLICY "Teachers can manage submissions for their assignments" ON public.assignment_submissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM assignments
            WHERE id = assignment_submissions.assignment_id
            AND (created_by = auth.uid() OR
                 EXISTS (SELECT 1 FROM teacher_subject_assignments WHERE teacher_id = auth.uid() AND course_id = assignments.course_id AND class_id = assignments.class_id))
        )
    );

DROP POLICY IF EXISTS "Students can manage their submissions" ON public.assignment_submissions;
CREATE POLICY "Students can manage their submissions" ON public.assignment_submissions
    FOR ALL USING (student_id = auth.uid());

-- Admissions policies
DROP POLICY IF EXISTS "Admins can manage admissions" ON public.admissions;
CREATE POLICY "Admins can manage admissions" ON public.admissions
    FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view admissions they submitted" ON public.admissions;
CREATE POLICY "Users can view admissions they submitted" ON public.admissions
    FOR SELECT USING (submitted_by = auth.uid());

DROP POLICY IF EXISTS "Parents can view their children's admissions" ON public.admissions;
CREATE POLICY "Parents can view their children's admissions" ON public.admissions
    FOR SELECT USING (
        parent_id = auth.uid() OR
        (student_user_id IS NOT NULL AND student_user_id = auth.uid())
    );

-- Document requirements policies
DROP POLICY IF EXISTS "Admins can manage document requirements" ON public.document_requirements;
CREATE POLICY "Admins can manage document requirements" ON public.document_requirements
    FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view document requirements for their admissions" ON public.document_requirements;
CREATE POLICY "Users can view document requirements for their admissions" ON public.document_requirements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admissions
            WHERE id = document_requirements.admission_id
            AND (submitted_by = auth.uid() OR parent_id = auth.uid() OR student_user_id = auth.uid())
        )
    );

-- Admission documents policies
DROP POLICY IF EXISTS "Admins can manage admission documents" ON public.admission_documents;
CREATE POLICY "Admins can manage admission documents" ON public.admission_documents
    FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can manage documents for their admissions" ON public.admission_documents;
CREATE POLICY "Users can manage documents for their admissions" ON public.admission_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admissions
            WHERE id = admission_documents.admission_id
            AND (submitted_by = auth.uid() OR parent_id = auth.uid() OR student_user_id = auth.uid())
        )
    );

-- Fee structures policies
DROP POLICY IF EXISTS "Admins can manage fee structures" ON public.fee_structures;
CREATE POLICY "Admins can manage fee structures" ON public.fee_structures
    FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view fee structures in their branch" ON public.fee_structures;
CREATE POLICY "Users can view fee structures in their branch" ON public.fee_structures
    FOR SELECT USING (can_access_branch(branch_id));

-- Fee invoices policies
DROP POLICY IF EXISTS "Admins can manage fee invoices" ON public.fee_invoices;
CREATE POLICY "Admins can manage fee invoices" ON public.fee_invoices
    FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Students can view their invoices" ON public.fee_invoices;
CREATE POLICY "Students can view their invoices" ON public.fee_invoices
    FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Parents can view their children's invoices" ON public.fee_invoices;
CREATE POLICY "Parents can view their children's invoices" ON public.fee_invoices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'parent'
            AND fee_invoices.student_id IN (
                SELECT student_id FROM student_enrollments
                WHERE parent_guardian_details ILIKE '%' || p.display_name || '%'
            )
        )
    );

-- Audit logs policies (admins only)
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (is_admin(auth.uid()));

-- Enrollments policies
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.enrollments;
CREATE POLICY "Admins can manage enrollments" ON public.enrollments
    FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Students can view their enrollments" ON public.enrollments;
CREATE POLICY "Students can view their enrollments" ON public.enrollments
    FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Parents can view their children's enrollments" ON public.enrollments;
CREATE POLICY "Parents can view their children's enrollments" ON public.enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'parent'
            AND enrollments.parent_guardian_details ILIKE '%' || p.display_name || '%'
        )
    );

-- Add indexes for enrollments table
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_branch_id ON public.enrollments(branch_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_admission_id ON public.enrollments(admission_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(application_status, enrollment_status);

-- Add branch_id column to student_enrollments and populate it
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS branch_id BIGINT REFERENCES public.school_branches(id);
UPDATE public.student_enrollments
SET branch_id = sc.branch_id
FROM public.school_classes sc
WHERE student_enrollments.class_id = sc.id AND student_enrollments.branch_id IS NULL;
ALTER TABLE public.student_enrollments ALTER COLUMN branch_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_student_enrollments_branch_id ON public.student_enrollments(branch_id);

-- Additional functions for enrollment workflow
DROP FUNCTION IF EXISTS public.admin_transition_admission(BIGINT, TEXT);
CREATE OR REPLACE FUNCTION public.admin_transition_admission(
    p_admission_id BIGINT,
    p_next_status TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admission_record RECORD;
    v_student_user_id UUID;
    v_enrollment_id BIGINT;
    v_result JSON;
BEGIN
    -- Validate input
    IF p_next_status NOT IN ('Approved', 'Rejected') THEN
        RETURN json_build_object('success', false, 'message', 'Invalid status transition');
    END IF;

    -- Get admission record
    SELECT * INTO v_admission_record
    FROM public.admissions
    WHERE id = p_admission_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Admission record not found');
    END IF;

    -- Update admission status
    UPDATE public.admissions
    SET status = p_next_status,
        reviewed_at = now(),
        reviewed_by = auth.uid()
    WHERE id = p_admission_id;

    -- If approved, create enrollment record
    IF p_next_status = 'Approved' THEN
        v_student_user_id := v_admission_record.student_user_id;

        INSERT INTO public.enrollments (
            student_id,
            branch_id,
            academic_year,
            grade,
            application_status,
            enrollment_status,
            admission_id,
            enrollment_date
        )
        VALUES (
            v_student_user_id,
            v_admission_record.branch_id,
            EXTRACT(YEAR FROM now()) || '-' || (EXTRACT(YEAR FROM now()) + 1)::TEXT,
            v_admission_record.grade,
            'ADMITTED',
            'FINALIZED',
            p_admission_id,
            CURRENT_DATE
        )
        RETURNING id INTO v_enrollment_id;

        -- Update student profile
        UPDATE public.profiles
        SET role = 'student',
            profile_completed = true
        WHERE id = v_student_user_id;

        v_result := json_build_object(
            'success', true,
            'message', 'Student successfully admitted and enrolled',
            'enrollment_id', v_enrollment_id
        );
    ELSE
        v_result := json_build_object(
            'success', true,
            'message', 'Admission status updated to ' || p_next_status
        );
    END IF;

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Database error: ' || SQLERRM
        );
END;
$$;

-- Function to get all students for admin
DROP FUNCTION IF EXISTS public.get_all_students_for_admin();
CREATE OR REPLACE FUNCTION public.get_all_students_for_admin()
RETURNS TABLE (
    id UUID,
    email TEXT,
    display_name TEXT,
    phone TEXT,
    role user_role,
    profile_completed BOOLEAN,
    is_active BOOLEAN,
    branch_id BIGINT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    enrollment_id BIGINT,
    academic_year TEXT,
    grade TEXT,
    application_status TEXT,
    enrollment_status TEXT,
    class_id BIGINT,
    enrollment_date DATE,
    roll_number TEXT,
    student_id_number TEXT,
    parent_guardian_details TEXT,
    admission_id BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.email,
        p.display_name,
        p.phone,
        p.role,
        p.profile_completed,
        p.is_active,
        p.branch_id,
        p.created_at,
        p.updated_at,
        e.id as enrollment_id,
        e.academic_year,
        e.grade,
        e.application_status,
        e.enrollment_status,
        e.class_id,
        e.enrollment_date,
        e.roll_number,
        e.student_id_number,
        e.parent_guardian_details,
        e.admission_id
    FROM public.profiles p
    LEFT JOIN public.enrollments e ON p.id = e.student_id
    WHERE p.role = 'student'
    AND p.is_active = true
    AND p.deleted_at IS NULL
    ORDER BY p.created_at DESC;
END;
$$;

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION public.admin_transition_admission(BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_students_for_admin() TO authenticated;

COMMIT;
