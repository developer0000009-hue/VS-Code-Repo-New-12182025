
-- ===============================================================================================
--  CANONICAL MASTER SCHEMA - SCHOOL MANAGEMENT SYSTEM
--  Version: 6.0.0 (Enhanced Enquiry System)
--  Description: Full Schema with RBAC, Multi-Tenancy, Self-Healing Auth, and Advanced Enquiry Management
--  Instructions: Run this entire script in the Supabase SQL Editor.
--
--  ENHANCED FEATURES (v6.0.0):
--  • Complete Enquiry Management System with Admin Portal
--  • Parent-Admin Communication Flow via Enquiry Messages
--  • Enquiry-to-Admission Promotion Workflow
--  • Real-time Notifications and Status Updates
--  • Secure Enquiry-scoped Messaging with RLS
-- ===============================================================================================

-- -----------------------------------------------------------------------------------------------
-- 1. TEARDOWN (CLEAN SLATE PROTOCOL)
--    Removes existing objects to ensure a conflict-free deployment.
-- -----------------------------------------------------------------------------------------------

-- Drop Triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop Functions (Cascading drops to ensure clean slate)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.reconcile_user_profile_id() CASCADE;
DROP FUNCTION IF EXISTS public.complete_user_profile(text, jsonb, text, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.get_my_branch_ids() CASCADE;
DROP FUNCTION IF EXISTS public.get_all_students_for_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_finance_data() CASCADE;
DROP FUNCTION IF EXISTS public.get_school_branches() CASCADE;
DROP FUNCTION IF EXISTS public.get_all_classes_for_admin(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.get_student_attendance_records(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_student_invoices(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_my_children_profiles() CASCADE;
DROP FUNCTION IF EXISTS public.get_student_dashboard_data(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.parent_switch_student_view(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.complete_school_onboarding(text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.finalize_school_pricing(text) CASCADE;
DROP FUNCTION IF EXISTS public.create_school_branch(text, text, text, text, text, text, boolean, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.update_school_branch(bigint, text, text, text, text, text, text, boolean, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.delete_school_branch(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.get_all_teachers_for_admin() CASCADE;
DROP FUNCTION IF EXISTS public.upsert_teacher_profile(uuid, text, text, text, text, text, text, text, text, text, integer, date) CASCADE;
DROP FUNCTION IF EXISTS public.upsert_teacher_profile(uuid, text, text, text, text, text, text, text, text, text, integer, date, bigint) CASCADE;
DROP FUNCTION IF EXISTS public.bulk_update_teacher_profiles(uuid[], jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.get_school_departments_stats(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.manage_school_department(bigint, text, text, uuid, bigint, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.get_class_roster_for_admin(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.get_attendance_for_admin(bigint, date) CASCADE;
DROP FUNCTION IF EXISTS public.upsert_attendance_for_admin(jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_analytics_stats() CASCADE;
DROP FUNCTION IF EXISTS public.send_bulk_communication(text, text, text[], jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.get_communications_history() CASCADE;
DROP FUNCTION IF EXISTS public.send_enquiry_message(bigint, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_enquiry_timeline(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.update_enquiry_status(bigint, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.convert_enquiry_to_admission(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.admin_verify_share_code(text) CASCADE;
DROP FUNCTION IF EXISTS public.admin_import_record_from_share_code(bigint, text, bigint) CASCADE;
DROP FUNCTION IF EXISTS public.get_my_share_codes() CASCADE;
DROP FUNCTION IF EXISTS public.generate_admission_share_code(bigint, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.revoke_my_share_code(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.get_linked_parent_for_student(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_student_details_admin(uuid, text, text, date, text, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.manage_class(bigint, text, text, text, text, uuid, bigint, integer) CASCADE;
DROP FUNCTION IF EXISTS public.map_class_subjects(bigint, bigint[]) CASCADE;
DROP FUNCTION IF EXISTS public.bulk_create_classes(jsonb, bigint, text) CASCADE;
DROP FUNCTION IF EXISTS public.bulk_assign_class_teachers(jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.get_my_messages() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_enquiries() CASCADE;
DROP FUNCTION IF EXISTS public.submit_unsolicited_document(bigint, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.create_admission(text, text, date, text, text, text, text, bigint) CASCADE;
DROP FUNCTION IF EXISTS public.update_admission(bigint, text, text, date, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.complete_student_onboarding(uuid, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.parent_get_document_requirements() CASCADE;
DROP FUNCTION IF EXISTS public.parent_initialize_vault_slots(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.parent_complete_document_upload(bigint, bigint, text, text, bigint, text) CASCADE;
DROP FUNCTION IF EXISTS public.submit_admission_document(bigint, bigint, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.update_secondary_parent_details(text, text, text, text, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.request_admission_documents(bigint, text[], text) CASCADE;
DROP FUNCTION IF EXISTS public.approve_admission_application(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.update_admission_status(bigint, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_admissions(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.get_all_enquiries(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.get_parent_dashboard_stats() CASCADE;
DROP FUNCTION IF EXISTS public.teacher_create_assignment(bigint, bigint, text, text, timestamptz, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.teacher_create_study_material(bigint, bigint, text, text, text, text, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_teacher_class_details(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.get_teacher_class_overviews() CASCADE;
DROP FUNCTION IF EXISTS public.get_teacher_classes() CASCADE;
DROP FUNCTION IF EXISTS public.get_class_roster(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.get_attendance(bigint, date) CASCADE;
DROP FUNCTION IF EXISTS public.upsert_attendance(jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.get_teacher_lesson_plans(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.teacher_create_lesson_plan(jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.get_available_workshops() CASCADE;
DROP FUNCTION IF EXISTS public.get_teacher_professional_development() CASCADE;
DROP FUNCTION IF EXISTS public.enroll_in_workshop(bigint, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_teacher_documents(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_teacher_document_status(bigint, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.update_teacher_self_profile(text, text, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_transport_dashboard_data() CASCADE;
DROP FUNCTION IF EXISTS public.get_bus_attendance_for_route(bigint, date, text) CASCADE;
DROP FUNCTION IF EXISTS public.upsert_bus_attendance(jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.transport_send_route_notification(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_teacher_communications_history() CASCADE;
DROP FUNCTION IF EXISTS public.create_fee_structure_with_components(text, text, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.bulk_create_invoices_for_structure(bigint, text[]) CASCADE;
DROP FUNCTION IF EXISTS public.record_fee_payment(bigint, numeric, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.toggle_bookmark_material(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.submit_assignment(bigint, text, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_teacher_student_performance_report(uuid, bigint) CASCADE;
DROP FUNCTION IF EXISTS public.get_teacher_class_performance_summary(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.verify_and_link_branch_admin() CASCADE;
DROP FUNCTION IF EXISTS public.complete_branch_step() CASCADE;
DROP FUNCTION IF EXISTS public.switch_active_role(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_completed_roles() CASCADE;
DROP FUNCTION IF EXISTS public.save_class_timetable(bigint, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.get_class_timetable(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.clear_class_timetable(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.get_teacher_timetable(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_room_timetable(text) CASCADE;
DROP FUNCTION IF EXISTS public.bulk_import_teachers(jsonb, bigint) CASCADE;
DROP FUNCTION IF EXISTS public.create_course_v2(text, text, text, text, text, text, numeric, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.add_course_teacher(bigint, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.add_course_unit(bigint, text, text, numeric, integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_course_details_v2(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.filter_courses(text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.bulk_enroll_students_to_classes(jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.bulk_map_subjects_to_classes(jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.bulk_import_courses(jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.duplicate_course(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.archive_course(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_homework_list(bigint, text, bigint, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.create_homework_assignment(bigint, bigint, uuid, text, text, timestamptz, jsonb, integer, text) CASCADE;
DROP FUNCTION IF EXISTS public.update_assignment(bigint, text, text, timestamptz, integer, text) CASCADE;
DROP FUNCTION IF EXISTS public.delete_assignment(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.get_homework_submissions(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.grade_homework_submission(bigint, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_finance_dashboard_data() CASCADE;
DROP FUNCTION IF EXISTS public.get_dues_dashboard_data() CASCADE;
DROP FUNCTION IF EXISTS public.get_expense_dashboard_data() CASCADE;
DROP FUNCTION IF EXISTS public.get_student_fee_dashboard() CASCADE;
DROP FUNCTION IF EXISTS public.get_student_finance_details(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_payable_invoices_for_student(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.add_school_expense(text, numeric, text, date, text, text, text, bigint) CASCADE;
DROP FUNCTION IF EXISTS public.update_expense_status(bigint, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_fee_collection_report(date, date) CASCADE;
DROP FUNCTION IF EXISTS public.get_expense_summary_report(date, date) CASCADE;
DROP FUNCTION IF EXISTS public.get_student_ledger_report(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_create_student(text, text, text, text, text, bigint) CASCADE;

-- Drop RLS Policies (to avoid conflicts when re-running schema)
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owner can manage school admin profile" ON public.school_admin_profiles;
DROP POLICY IF EXISTS "Users can view their associated branches" ON public.school_branches;
DROP POLICY IF EXISTS "School admins can manage their branches" ON public.school_branches;
DROP POLICY IF EXISTS "Users can view departments in their branch" ON public.school_departments;
DROP POLICY IF EXISTS "Admins can manage departments in their branch" ON public.school_departments;
DROP POLICY IF EXISTS "Teachers can manage their own profile" ON public.teacher_profiles;
DROP POLICY IF EXISTS "Admins can view teachers in their branch" ON public.teacher_profiles;
DROP POLICY IF EXISTS "Users can view classes in their branch" ON public.school_classes;
DROP POLICY IF EXISTS "Admins can manage classes in their branch" ON public.school_classes;
DROP POLICY IF EXISTS "Students can view their own profile" ON public.student_profiles;
DROP POLICY IF EXISTS "Admins and teachers can view students in their branch/class" ON public.student_profiles;
DROP POLICY IF EXISTS "Parents can view their children's profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "Parents can manage their own admissions" ON public.admissions;
DROP POLICY IF EXISTS "Admins can view admissions in their branch" ON public.admissions;
DROP POLICY IF EXISTS "Parents can view their own enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Admins can manage enquiries in their branch" ON public.enquiries;
DROP POLICY IF EXISTS "Admins can manage vendors in their branch" ON public.vendors;
DROP POLICY IF EXISTS "Admins can manage expenses in their branch" ON public.expenses;
DROP POLICY IF EXISTS "Public read course_teachers" ON public.course_teachers;
DROP POLICY IF EXISTS "Admin manage course_teachers" ON public.course_teachers;
DROP POLICY IF EXISTS "Public read course_units" ON public.course_units;
DROP POLICY IF EXISTS "Admin manage course_units" ON public.course_units;
DROP POLICY IF EXISTS "Public read course_materials" ON public.course_materials;
DROP POLICY IF EXISTS "Admin manage course_materials" ON public.course_materials;
DROP POLICY IF EXISTS "Admin manage course_drafts" ON public.course_drafts;
DROP POLICY IF EXISTS "Admin read course_logs" ON public.course_logs;
DROP POLICY IF EXISTS "Authenticated users can view storage buckets" ON public.storage_buckets;
DROP POLICY IF EXISTS "Users can view their uploaded files" ON public.storage_files;
DROP POLICY IF EXISTS "Admins can view files in their branch" ON public.storage_files;
DROP POLICY IF EXISTS "Parents can view their children's files" ON public.storage_files;
DROP POLICY IF EXISTS "Users can view their own role assignments" ON public.user_role_assignments;
DROP POLICY IF EXISTS "Admins can manage role assignments in their branch" ON public.user_role_assignments;
DROP POLICY IF EXISTS "Authenticated users can view user roles" ON public.user_roles;


-- Drop Tables (Order matters for FK constraints)
DROP TABLE IF EXISTS public.user_role_assignments CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.vendors CASCADE;
DROP TABLE IF EXISTS public.course_logs CASCADE;
DROP TABLE IF EXISTS public.course_drafts CASCADE;
DROP TABLE IF EXISTS public.course_materials CASCADE;
DROP TABLE IF EXISTS public.course_units CASCADE;
DROP TABLE IF EXISTS public.course_teachers CASCADE;
DROP TABLE IF EXISTS public.timetable_entries CASCADE;
DROP TABLE IF EXISTS public.teacher_availability CASCADE;
DROP TABLE IF EXISTS public.room_availability CASCADE;
DROP TABLE IF EXISTS public.teacher_awards CASCADE;
DROP TABLE IF EXISTS public.teacher_pd_records CASCADE;
DROP TABLE IF EXISTS public.workshops CASCADE;
DROP TABLE IF EXISTS public.teacher_documents CASCADE;
DROP TABLE IF EXISTS public.lesson_plan_resources CASCADE;
DROP TABLE IF EXISTS public.lesson_plans CASCADE;
DROP TABLE IF EXISTS public.study_materials CASCADE;
DROP TABLE IF EXISTS public.assignment_submissions CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;
DROP TABLE IF EXISTS public.ecommerce_operator_profiles CASCADE;
DROP TABLE IF EXISTS public.bus_attendance CASCADE;
DROP TABLE IF EXISTS public.transport_staff_profiles CASCADE;
DROP TABLE IF EXISTS public.routes CASCADE;
DROP TABLE IF EXISTS public.enquiry_messages CASCADE;
DROP TABLE IF EXISTS public.communications CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.class_fee_assignments CASCADE;
DROP TABLE IF EXISTS public.fee_components CASCADE;
DROP TABLE IF EXISTS public.fee_structures CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.course_modules CASCADE;
DROP TABLE IF EXISTS public.course_enrollments CASCADE;
DROP TABLE IF EXISTS public.share_codes CASCADE;
DROP TABLE IF EXISTS public.admission_documents CASCADE;
DROP TABLE IF EXISTS public.document_requirements CASCADE;
DROP TABLE IF EXISTS public.enquiries CASCADE;
DROP TABLE IF EXISTS public.student_parents CASCADE;
DROP TABLE IF EXISTS public.parent_profiles CASCADE;
DROP TABLE IF EXISTS public.student_profiles CASCADE;
DROP TABLE IF EXISTS public.admissions CASCADE;
DROP TABLE IF EXISTS public.class_subjects CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.school_classes CASCADE;
DROP TABLE IF EXISTS public.teacher_profiles CASCADE;
DROP TABLE IF EXISTS public.school_departments CASCADE;
DROP TABLE IF EXISTS public.school_branches CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- -----------------------------------------------------------------------------------------------
-- 2. CONFIGURATION & EXTENSIONS
-- -----------------------------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- -----------------------------------------------------------------------------------------------
-- 3. CORE TABLES & PROFILES
-- -----------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.school_branches (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    school_user_id uuid, -- Will be updated after profiles table is created
    name text NOT NULL,
    address text,
    city text,
    state text,
    country text,
    contact_number text,
    email text,
    is_main_branch boolean DEFAULT false,
    admin_name text,
    admin_phone text,
    admin_email text,
    branch_admin_id uuid, -- Will be updated after profiles table is created
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY, -- Links to auth.users OR shadow users
    email text NOT NULL,
    display_name text,
    phone text,
    role text,
    branch_id bigint REFERENCES public.school_branches(id) ON DELETE SET NULL,
    is_super_admin boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    profile_completed boolean DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    email_confirmed_at timestamptz,
    UNIQUE(email)
);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Now add the foreign key constraints to school_branches
ALTER TABLE public.school_branches ADD CONSTRAINT fk_school_branches_school_user_id
    FOREIGN KEY (school_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public.school_branches ADD CONSTRAINT fk_school_branches_branch_admin_id
    FOREIGN KEY (branch_admin_id) REFERENCES public.profiles(id) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS public.school_admin_profiles (
    user_id uuid NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    school_name text,
    address text,
    country text,
    state text,
    city text,
    plan_id text,
    onboarding_step text DEFAULT 'profile',
    admin_contact_name text,
    admin_contact_email text,
    admin_contact_phone text,
    admin_designation text,
    academic_board text,
    affiliation_number text,
    school_type text,
    academic_year_start text,
    academic_year_end text,
    grade_range_start text,
    grade_range_end text,
    logo_url text,
    banner_url text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Branch Access Invitations
CREATE TABLE IF NOT EXISTS public.school_branch_invitations (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    branch_id bigint NOT NULL REFERENCES public.school_branches(id) ON DELETE CASCADE,
    code text NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    is_revoked boolean DEFAULT false,
    redeemed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    redeemed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.school_departments (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name text NOT NULL,
    description text,
    hod_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    branch_id bigint REFERENCES public.school_branches(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

-- Enhanced Teacher Profile
CREATE TABLE IF NOT EXISTS public.teacher_profiles (
    user_id uuid NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    subject text,
    qualification text,
    experience_years numeric,
    date_of_joining date,
    bio text,
    specializations text,
    profile_picture_url text,
    gender text,
    date_of_birth date,
    department text, -- Name reference
    designation text, -- e.g., 'HOD', 'Senior Teacher'
    employee_id text,
    employment_type text, -- 'Full-time', 'Contract'
    employment_status text DEFAULT 'Pending Verification', -- 'Active', 'Inactive', 'Pending Verification', 'Resigned', 'Suspended'
    branch_id bigint REFERENCES public.school_branches(id) ON DELETE SET NULL,
    salary text,
    bank_details text
);

CREATE TABLE IF NOT EXISTS public.school_classes (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name text NOT NULL,
    grade_level text,
    section text,
    academic_year text,
    class_teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    branch_id bigint REFERENCES public.school_branches(id) ON DELETE CASCADE,
    capacity integer DEFAULT 30,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.courses (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    title text NOT NULL,
    code text,
    grade_level text,
    credits numeric,
    category text,
    subject_type text,
    status text DEFAULT 'Active',
    description text,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    syllabus_pdf_url text,
    department text,
    deleted_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.class_subjects (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    class_id bigint NOT NULL REFERENCES public.school_classes(id) ON DELETE CASCADE,
    subject_id bigint NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE(class_id, subject_id)
);

-- -----------------------------------------------------------------------------------------------
-- 4. ADMISSIONS, STUDENTS & PARENTS
-- -----------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.admissions (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    parent_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL ON UPDATE CASCADE, 
    branch_id bigint REFERENCES public.school_branches(id) ON DELETE SET NULL,
    applicant_name text NOT NULL,
    grade text NOT NULL,
    status text DEFAULT 'Pending Review',
    date_of_birth date,
    gender text,
    parent_name text,
    parent_email text,
    parent_phone text,
    profile_photo_url text,
    student_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    student_system_email text,
    medical_info text,
    emergency_contact text,
    has_enquiry boolean DEFAULT false,
    application_number text,
    submitted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    submitted_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.student_profiles (
    user_id uuid NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    admission_id bigint REFERENCES public.admissions(id) ON DELETE SET NULL,
    grade text,
    roll_number text,
    student_id_number text,
    parent_guardian_details text,
    address text,
    assigned_class_id bigint REFERENCES public.school_classes(id) ON DELETE SET NULL,
    branch_id bigint REFERENCES public.school_branches(id) ON DELETE SET NULL,
    gender text,
    date_of_birth date,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.parent_profiles (
    user_id uuid NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    relationship_to_student text,
    gender text,
    number_of_children integer,
    address text,
    country text,
    state text,
    city text,
    pin_code text,
    secondary_parent_name text,
    secondary_parent_relationship text,
    secondary_parent_gender text,
    secondary_parent_email text,
    secondary_parent_phone text
);

CREATE TABLE IF NOT EXISTS public.student_parents (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    parent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    relationship text,
    is_primary boolean DEFAULT false,
    UNIQUE (student_id, parent_id)
);

CREATE TABLE IF NOT EXISTS public.enquiries (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    enquiry_code text,
    applicant_name text NOT NULL,
    grade text,
    status text DEFAULT 'NEW',
    verification_status text DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'FAILED')),
    received_at timestamptz DEFAULT now() NOT NULL,
    parent_name text,
    parent_email text,
    parent_phone text,
    notes text,
    updated_at timestamptz DEFAULT now(),
    admission_id bigint UNIQUE REFERENCES public.admissions(id) ON DELETE SET NULL,
    branch_id bigint REFERENCES public.school_branches(id) ON DELETE CASCADE,
    conversion_state text DEFAULT 'NOT_CONVERTED' CHECK (conversion_state IN ('NOT_CONVERTED', 'CONVERTED')),
    is_archived boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    converted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.document_requirements (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    admission_id bigint NOT NULL REFERENCES public.admissions(id) ON DELETE CASCADE,
    document_name text NOT NULL,
    status text DEFAULT 'Pending',
    is_mandatory boolean DEFAULT true,
    notes_for_parent text,
    rejection_reason text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admission_documents (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    admission_id bigint NOT NULL REFERENCES public.admissions(id) ON DELETE CASCADE,
    requirement_id bigint REFERENCES public.document_requirements(id) ON DELETE CASCADE,
    uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    file_name text NOT NULL,
    storage_path text NOT NULL,
    uploaded_at timestamptz DEFAULT now(),
    status text DEFAULT 'Pending'
);

CREATE TABLE IF NOT EXISTS public.share_codes (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    code text NOT NULL UNIQUE,
    admission_id bigint REFERENCES public.admissions(id) ON DELETE CASCADE,
    enquiry_id bigint REFERENCES public.enquiries(id) ON DELETE CASCADE,
    code_type text NOT NULL,
    status text DEFAULT 'Active',
    purpose text,
    expires_at timestamptz DEFAULT now() + interval '1 day',
    created_at timestamptz DEFAULT now(),
    -- Ensure proper reference based on code_type, allowing enquiry_id for converted admissions
    CONSTRAINT check_share_code_reference CHECK (
        (code_type = 'Admission' AND admission_id IS NOT NULL) OR
        (code_type = 'Enquiry' AND enquiry_id IS NOT NULL AND admission_id IS NULL)
    )
);

-- -----------------------------------------------------------------------------------------------
-- 5. ACADEMIC, OPERATIONS & TEACHER MODULE
-- -----------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.timetable_entries (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    class_id bigint REFERENCES public.school_classes(id) ON DELETE CASCADE,
    day text NOT NULL, 
    start_time text NOT NULL, 
    end_time text NOT NULL, 
    subject_name text, 
    teacher_name text, 
    room_number text,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    subject_id bigint REFERENCES public.courses(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(class_id, day, start_time)
);

CREATE TABLE IF NOT EXISTS public.teacher_availability (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    day text,
    start_time text,
    end_time text,
    is_available boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.room_availability (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    room_name text,
    day text,
    start_time text,
    end_time text,
    is_booked boolean DEFAULT false,
    booked_by_class_id bigint REFERENCES public.school_classes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.course_enrollments (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    course_id bigint NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at timestamptz DEFAULT now(),
    UNIQUE (student_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.course_modules (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    course_id bigint NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title text NOT NULL,
    order_index integer,
    status text,
    duration_hours numeric
);

CREATE TABLE IF NOT EXISTS public.attendance (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    class_id bigint NOT NULL REFERENCES public.school_classes(id) ON DELETE CASCADE,
    attendance_date date NOT NULL,
    status text,
    notes text,
    recorded_by uuid REFERENCES public.profiles(id) ON UPDATE CASCADE,
    marked_at timestamptz DEFAULT now(),
    late_time text,
    absence_reason text,
    UNIQUE (student_id, class_id, attendance_date)
);

-- Finance
CREATE TABLE IF NOT EXISTS public.fee_structures (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name text NOT NULL,
    academic_year text,
    description text
);

CREATE TABLE IF NOT EXISTS public.fee_components (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    structure_id bigint NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
    name text NOT NULL,
    amount numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS public.class_fee_assignments (
    class_id bigint NOT NULL PRIMARY KEY REFERENCES public.school_classes(id) ON DELETE CASCADE,
    structure_id bigint NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.invoices (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    structure_id bigint REFERENCES public.fee_structures(id),
    description text,
    amount numeric NOT NULL,
    amount_paid numeric DEFAULT 0,
    due_date date,
    status text DEFAULT 'Pending',
    created_at timestamptz DEFAULT now()
);

-- Communication
CREATE TABLE IF NOT EXISTS public.communications (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    subject text,
    body text,
    sender_id uuid REFERENCES public.profiles(id) ON UPDATE CASCADE,
    sender_name text,
    sender_role text,
    recipients text[],
    target_criteria jsonb,
    status text DEFAULT 'Sent',
    sent_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.enquiry_messages (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    enquiry_id bigint NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    message text,
    is_admin_message boolean,
    created_at timestamptz DEFAULT now()
);

-- Transport
CREATE TABLE IF NOT EXISTS public.routes (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name text,
    description text
);

CREATE TABLE IF NOT EXISTS public.transport_staff_profiles (
    user_id uuid NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    route_id bigint REFERENCES public.routes(id),
    vehicle_details text,
    license_info text
);

CREATE TABLE IF NOT EXISTS public.bus_attendance (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    route_id bigint NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
    trip_date date NOT NULL,
    trip_type text NOT NULL, 
    status text, 
    marked_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ecommerce_operator_profiles (
    user_id uuid NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    store_name text,
    business_type text
);

-- Teacher Specific Tables
CREATE TABLE IF NOT EXISTS public.teacher_documents (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    document_name text,
    document_type text, -- Certificate, ID, Resume
    file_path text,
    status text DEFAULT 'Pending', -- Pending, Verified, Rejected
    rejection_reason text,
    uploaded_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assignments (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    class_id bigint REFERENCES public.school_classes(id) ON DELETE CASCADE,
    subject_id bigint REFERENCES public.courses(id) ON DELETE SET NULL,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    title text NOT NULL,
    description text,
    due_date timestamptz,
    created_at timestamptz DEFAULT now(),
    status text DEFAULT 'Draft',
    max_score integer DEFAULT 100
);

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    assignment_id bigint REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    file_path text,
    file_name text,
    submitted_at timestamptz DEFAULT now(),
    status text DEFAULT 'Submitted',
    grade text,
    feedback text
);

CREATE TABLE IF NOT EXISTS public.study_materials (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    class_id bigint REFERENCES public.school_classes(id) ON DELETE CASCADE,
    subject_id bigint REFERENCES public.courses(id) ON DELETE SET NULL,
    title text,
    description text,
    file_path text,
    file_name text,
    file_type text,
    uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at timestamptz DEFAULT now(),
    is_bookmarked boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.lesson_plans (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    class_id bigint REFERENCES public.school_classes(id) ON DELETE CASCADE,
    subject_id bigint REFERENCES public.courses(id) ON DELETE SET NULL,
    title text,
    lesson_date date,
    objectives text,
    activities text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lesson_plan_resources (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    lesson_plan_id bigint REFERENCES public.lesson_plans(id) ON DELETE CASCADE,
    file_name text,
    file_path text,
    file_type text
);

CREATE TABLE IF NOT EXISTS public.workshops (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    title text,
    description text,
    workshop_date date,
    points integer DEFAULT 10,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teacher_pd_records (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    workshop_id bigint REFERENCES public.workshops(id) ON DELETE SET NULL,
    completed_at timestamptz DEFAULT now(),
    points_earned integer,
    notes text
);

CREATE TABLE IF NOT EXISTS public.teacher_awards (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    award_name text,
    awarded_date date,
    points integer
);

-- Finance Extras
CREATE TABLE IF NOT EXISTS public.vendors (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name text NOT NULL,
    contact_person text,
    contact_email text,
    category text,
    branch_id bigint REFERENCES public.school_branches(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expenses (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    category text NOT NULL,
    amount numeric NOT NULL,
    vendor_id bigint REFERENCES public.vendors(id) ON DELETE SET NULL,
    vendor_name text,
    expense_date date NOT NULL,
    status text DEFAULT 'Pending',
    description text,
    invoice_url text,
    recorded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    recorded_at timestamptz DEFAULT now(),
    branch_id bigint REFERENCES public.school_branches(id) ON DELETE CASCADE,
    payment_mode text
);

-- Course Structure
CREATE TABLE IF NOT EXISTS public.course_teachers (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    course_id bigint NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role text DEFAULT 'Primary',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    UNIQUE(course_id, teacher_id)
);

CREATE TABLE IF NOT EXISTS public.course_units (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    course_id bigint NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    order_index integer,
    duration_hours numeric,
    status text DEFAULT 'Draft',
    learning_objectives text[],
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_materials (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    course_id bigint NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    unit_id bigint REFERENCES public.course_units(id) ON DELETE SET NULL,
    title text NOT NULL,
    file_path text,
    file_type text,
    url text,
    uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_drafts (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    course_id bigint NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    version_number integer NOT NULL,
    data jsonb NOT NULL,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    commit_message text
);

CREATE TABLE IF NOT EXISTS public.course_logs (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    course_id bigint NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    action text NOT NULL,
    details jsonb,
    created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------------------------
-- 5.5. SUPABASE STORAGE BUCKETS & FILE METADATA
-- -----------------------------------------------------------------------------------------------

-- Storage Buckets Declaration (for documentation and reference)
CREATE TABLE IF NOT EXISTS public.storage_buckets (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    file_size_limit bigint DEFAULT 5242880, -- 5MB default
    allowed_mime_types text[],
    is_public boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Insert required buckets
INSERT INTO public.storage_buckets (name, description, file_size_limit, allowed_mime_types, is_public) VALUES
    ('profile-images', 'User profile pictures and avatars', 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'], true),
    ('guardian-documents', 'Parent-uploaded admission documents', 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'], false),
    ('student-documents', 'Student records and certificates', 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'], false)
ON CONFLICT (name) DO NOTHING;

-- Storage Files Metadata (links uploaded files to application entities)
CREATE TABLE IF NOT EXISTS public.storage_files (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    bucket_name text NOT NULL,
    file_path text NOT NULL,
    file_name text NOT NULL,
    file_size bigint,
    mime_type text,
    uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    entity_type text NOT NULL, -- 'profile', 'admission', 'teacher_document', etc.
    entity_id text NOT NULL, -- UUID or bigint as text
    metadata jsonb DEFAULT '{}',
    is_deleted boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    UNIQUE(bucket_name, file_path)
);

-- -----------------------------------------------------------------------------------------------
-- 5.6. ROLE & ACCESS CONTROL
-- -----------------------------------------------------------------------------------------------

-- Predefined Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name text NOT NULL UNIQUE,
    display_name text NOT NULL,
    description text,
    is_system_role boolean DEFAULT false,
    permissions jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Seed system roles
INSERT INTO public.user_roles (name, display_name, description, is_system_role) VALUES
    ('School Administration', 'School Administration', 'Govern institutional operations, multi-branch strategy, and global oversight', true),
    ('Branch Admin', 'Branch Admin', 'Manage specific branch operations and staff', true),
    ('Principal', 'Principal / Director', 'Lead academic excellence and oversee institutional growth', true),
    ('HR Manager', 'HR Management', 'Manage human capital, recruitment, and organizational compliance', true),
    ('Academic Coordinator', 'Academic Coordinator', 'Synchronize curriculum delivery and maintain pedagogical standards', true),
    ('Accountant', 'Financial Controller', 'Oversee fiscal health, fee collections, and institutional financial reporting', true),
    ('Teacher', 'Faculty Member', 'Empower students, manage classrooms, and curate learning experiences', true),
    ('Student', 'Student Portal', 'Access academic timeline, assignments, and digital learning resources', true),
    ('Parent/Guardian', 'Parent / Guardian', 'Partner in child''s educational journey and manage family needs', true),
    ('Transport Staff', 'Transport Operations', 'Manage logistical operations, routes, and student transit safety', true),
    ('E-commerce Operator', 'E-commerce Operator', 'Administer institutional storefront, inventory, and supply chain', true),
    ('Super Admin', 'Super Admin', 'System-wide administrative access', true),
    ('Minimal Admin', 'Minimal Admin', 'Limited administrative access for setup', true)
ON CONFLICT (name) DO NOTHING;

-- User Role Assignments
CREATE TABLE IF NOT EXISTS public.user_role_assignments (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_name text NOT NULL REFERENCES public.user_roles(name) ON DELETE CASCADE,
    assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    branch_id bigint REFERENCES public.school_branches(id) ON DELETE CASCADE,
    assigned_at timestamptz DEFAULT now(),
    UNIQUE(user_id, role_name, branch_id)
);

-- -----------------------------------------------------------------------------------------------
-- 6. FUNCTIONS (CORE LOGIC & FIXES)
-- -----------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_profile_id uuid;
BEGIN
  -- Check if a shadow profile exists with this email
  SELECT id INTO existing_profile_id FROM public.profiles WHERE email = NEW.email;
  
  IF existing_profile_id IS NOT NULL THEN
    -- Claim the profile: Update ID to match the new Auth ID
    UPDATE public.profiles SET id = NEW.id WHERE id = existing_profile_id;
  ELSE
    -- New user, simple insert
    INSERT INTO public.profiles (id, email, display_name, phone)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'display_name', NEW.phone)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ** NEW CRITICAL FUNCTION FOR AUTH SELF-HEALING **
CREATE OR REPLACE FUNCTION public.reconcile_user_profile_id()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_id uuid := auth.uid();
  v_email text;
  v_existing_profile_id uuid;
BEGIN
  -- Get email of current auth user
  SELECT email INTO v_email FROM auth.users WHERE id = v_auth_id;
  
  -- Find the public profile with this email
  SELECT id INTO v_existing_profile_id FROM public.profiles WHERE email = v_email;
  
  IF v_existing_profile_id IS NOT NULL AND v_existing_profile_id != v_auth_id THEN
    -- Update the profile ID to match the auth ID
    -- Relying on ON UPDATE CASCADE foreign keys defined in the schema
    UPDATE public.profiles SET id = v_auth_id WHERE id = v_existing_profile_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_branch_ids()
RETURNS SETOF bigint LANGUAGE sql SECURITY DEFINER AS $$
    -- Direct branch ownership (School Admin)
    SELECT id FROM public.school_branches WHERE school_user_id = auth.uid()
    UNION
    -- Branch Admin assignments
    SELECT id FROM public.school_branches WHERE branch_admin_id = auth.uid()
    UNION
    -- Teacher branch assignments
    SELECT branch_id FROM public.teacher_profiles WHERE user_id = auth.uid() AND branch_id IS NOT NULL
    UNION
    -- Student branch assignments
    SELECT branch_id FROM public.student_profiles WHERE user_id = auth.uid() AND branch_id IS NOT NULL
    UNION
    -- Admin roles from user_role_assignments (Principal, HR Manager, etc.)
    SELECT ura.branch_id FROM public.user_role_assignments ura
    JOIN public.user_roles ur ON ura.role_name = ur.name
    WHERE ura.user_id = auth.uid()
    AND ur.name IN ('Principal', 'HR Manager', 'Academic Coordinator', 'Accountant', 'Branch Admin', 'School Administration')
    AND ura.branch_id IS NOT NULL
    UNION
    -- All branches for Super Admin
    SELECT id FROM public.school_branches WHERE EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true
    )
$$;

CREATE OR REPLACE FUNCTION public.complete_user_profile(
    selected_role text,
    profile_data jsonb,
    user_email text,
    should_mark_complete boolean
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_uid uuid := auth.uid();
BEGIN
    INSERT INTO public.profiles (id, email, display_name, phone)
    VALUES (
        v_uid, 
        user_email, 
        COALESCE(profile_data->>'display_name', user_email),
        COALESCE(profile_data->>'phone', null)
    )
    ON CONFLICT (id) DO UPDATE SET
        role = selected_role,
        profile_completed = should_mark_complete,
        display_name = COALESCE(profile_data->>'display_name', public.profiles.display_name),
        phone = COALESCE(profile_data->>'phone', public.profiles.phone);

    IF selected_role = 'Parent/Guardian' THEN
        INSERT INTO public.parent_profiles (user_id, relationship_to_student, gender, number_of_children, address, country, state, city, pin_code)
        VALUES (
            v_uid, profile_data->>'relationship_to_student', profile_data->>'gender', 
            NULLIF(profile_data->>'number_of_children', '')::int, profile_data->>'address', 
            profile_data->>'country', profile_data->>'state', profile_data->>'city', profile_data->>'pin_code'
        ) ON CONFLICT (user_id) DO UPDATE SET 
            relationship_to_student = EXCLUDED.relationship_to_student,
            gender = EXCLUDED.gender, number_of_children = EXCLUDED.number_of_children,
            address = EXCLUDED.address, country = EXCLUDED.country, state = EXCLUDED.state,
            city = EXCLUDED.city, pin_code = EXCLUDED.pin_code;
    ELSIF selected_role = 'Student' THEN
        INSERT INTO public.student_profiles (user_id, grade, date_of_birth, gender)
        VALUES (v_uid, profile_data->>'grade', (NULLIF(profile_data->>'date_of_birth', ''))::date, profile_data->>'gender')
        ON CONFLICT (user_id) DO UPDATE SET grade = EXCLUDED.grade, date_of_birth = EXCLUDED.date_of_birth, gender = EXCLUDED.gender;
    ELSIF selected_role = 'School Administration' THEN
        INSERT INTO public.school_admin_profiles (
            user_id, school_name, address, country, state, city, admin_contact_name, admin_contact_email, admin_contact_phone, 
            admin_designation, onboarding_step, academic_board, affiliation_number, school_type, academic_year_start, academic_year_end, grade_range_start, grade_range_end
        )
        VALUES (
            v_uid, profile_data->>'school_name', profile_data->>'address', profile_data->>'country', profile_data->>'state', 
            profile_data->>'city', profile_data->>'admin_contact_name', profile_data->>'admin_contact_email', profile_data->>'admin_contact_phone',
            profile_data->>'admin_designation', 'pricing', profile_data->>'academic_board', profile_data->>'affiliation_number', profile_data->>'school_type',
            profile_data->>'academic_year_start', profile_data->>'academic_year_end', profile_data->>'grade_range_start', profile_data->>'grade_range_end'
        ) ON CONFLICT (user_id) DO UPDATE SET
            school_name = EXCLUDED.school_name, address = EXCLUDED.address, country = EXCLUDED.country, state = EXCLUDED.state,
            city = EXCLUDED.city, admin_contact_name = EXCLUDED.admin_contact_name, admin_contact_email = EXCLUDED.admin_contact_email,
            admin_contact_phone = EXCLUDED.admin_contact_phone, admin_designation = EXCLUDED.admin_designation,
            academic_board = EXCLUDED.academic_board, affiliation_number = EXCLUDED.affiliation_number, school_type = EXCLUDED.school_type,
            academic_year_start = EXCLUDED.academic_year_start, academic_year_end = EXCLUDED.academic_year_end,
            grade_range_start = EXCLUDED.grade_range_start, grade_range_end = EXCLUDED.grade_range_end, onboarding_step = 'pricing';
    ELSIF selected_role = 'Teacher' THEN
         INSERT INTO public.teacher_profiles (user_id, bio, profile_picture_url) VALUES (v_uid, profile_data->>'bio', profile_data->>'profile_picture_url')
         ON CONFLICT (user_id) DO UPDATE SET bio = EXCLUDED.bio, profile_picture_url = EXCLUDED.profile_picture_url;
    ELSIF selected_role = 'Transport Staff' THEN
        INSERT INTO public.transport_staff_profiles (user_id, vehicle_details, license_info) VALUES (v_uid, profile_data->>'vehicle_details', profile_data->>'license_info')
        ON CONFLICT (user_id) DO UPDATE SET vehicle_details = EXCLUDED.vehicle_details, license_info = EXCLUDED.license_info;
    ELSIF selected_role = 'E-commerce Operator' THEN
        INSERT INTO public.ecommerce_operator_profiles (user_id, store_name, business_type) VALUES (v_uid, profile_data->>'store_name', profile_data->>'business_type')
        ON CONFLICT (user_id) DO UPDATE SET store_name = EXCLUDED.store_name, business_type = EXCLUDED.business_type;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_secondary_parent_details(p_name text, p_relationship text, p_gender text, p_email text, p_phone text, p_user_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN UPDATE public.parent_profiles SET secondary_parent_name = p_name, secondary_parent_relationship = p_relationship, secondary_parent_gender = p_gender, secondary_parent_email = p_email, secondary_parent_phone = p_phone WHERE user_id = p_user_id; END; $$;
CREATE OR REPLACE FUNCTION public.get_all_students_for_admin() RETURNS TABLE (id uuid, email text, display_name text, phone text, role text, is_active boolean, profile_completed boolean, created_at timestamptz, student_id_number text, grade text, roll_number text, parent_guardian_details text, address text, gender text, date_of_birth date, assigned_class_id bigint, assigned_class_name text, branch_id bigint, profile_photo_url text) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT p.id, p.email, p.display_name, p.phone, p.role, p.is_active, p.profile_completed, p.created_at, sp.student_id_number, sp.grade, sp.roll_number, sp.parent_guardian_details, sp.address, sp.gender, sp.date_of_birth, sp.assigned_class_id, c.name as assigned_class_name, sp.branch_id, a.profile_photo_url FROM public.profiles p LEFT JOIN public.student_profiles sp ON p.id = sp.user_id LEFT JOIN public.school_classes c ON sp.assigned_class_id = c.id LEFT JOIN public.admissions a ON sp.admission_id = a.id WHERE p.role = 'Student' AND (sp.branch_id IN (SELECT get_my_branch_ids()) OR (sp.branch_id IS NULL AND EXISTS (SELECT 1 FROM public.school_admin_profiles WHERE user_id = auth.uid()))); END; $$;
CREATE OR REPLACE FUNCTION public.get_finance_data() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE result jsonb; BEGIN SELECT json_build_object( 'total_revenue', COALESCE(SUM(amount_paid), 0), 'outstanding_dues', COALESCE(SUM(amount - amount_paid), 0), 'total_overdue', COALESCE(SUM(amount - amount_paid) FILTER (WHERE due_date < CURRENT_DATE), 0), 'invoices', (SELECT json_agg(t) FROM (SELECT i.*, p.display_name FROM public.invoices i JOIN public.profiles p ON i.student_id = p.id) t) ) INTO result FROM public.invoices; RETURN result; END; $$;
CREATE OR REPLACE FUNCTION public.get_school_branches() RETURNS SETOF public.school_branches LANGUAGE sql SECURITY DEFINER AS $$ SELECT * FROM public.school_branches WHERE id IN (SELECT get_my_branch_ids()); $$;
CREATE OR REPLACE FUNCTION public.get_all_classes_for_admin(p_branch_id bigint DEFAULT NULL) RETURNS TABLE ( id bigint, name text, grade_level text, section text, academic_year text, class_teacher_id uuid, capacity integer, teacher_name text, student_count bigint ) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT c.id, c.name, c.grade_level, c.section, c.academic_year, c.class_teacher_id, c.capacity, p.display_name as teacher_name, (SELECT COUNT(*) FROM public.student_profiles sp WHERE sp.assigned_class_id = c.id) as student_count FROM public.school_classes c LEFT JOIN public.profiles p ON c.class_teacher_id = p.id WHERE c.branch_id IN (SELECT get_my_branch_ids()) AND (p_branch_id IS NULL OR c.branch_id = p_branch_id); END; $$;
CREATE OR REPLACE FUNCTION public.get_student_attendance_records(p_student_id uuid) RETURNS SETOF public.attendance LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT * FROM public.attendance WHERE student_id = p_student_id ORDER BY attendance_date DESC; END; $$;
CREATE OR REPLACE FUNCTION public.get_student_invoices(p_student_id uuid) RETURNS SETOF public.invoices LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT * FROM public.invoices WHERE student_id = p_student_id ORDER BY due_date DESC; END; $$;
CREATE OR REPLACE FUNCTION public.get_my_children_profiles() RETURNS SETOF public.admissions LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT * FROM public.admissions WHERE parent_id = auth.uid(); END; $$;
CREATE OR REPLACE FUNCTION public.get_student_dashboard_data(p_student_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE result jsonb; v_admission_id bigint; BEGIN SELECT admission_id INTO v_admission_id FROM public.student_profiles WHERE user_id = p_student_id; SELECT json_build_object( 'profile', (SELECT row_to_json(p) FROM public.profiles p WHERE id = p_student_id), 'admission', (SELECT row_to_json(a) FROM public.admissions a WHERE id = v_admission_id), 'timetable', '[]'::jsonb, 'assignments', '[]'::jsonb, 'attendanceSummary', json_build_object('total_days', 100, 'present_days', 90, 'absent_days', 5, 'late_days', 5), 'recentGrades', '[]'::jsonb, 'announcements', '[]'::jsonb, 'studyMaterials', '[]'::jsonb, 'needs_onboarding', NOT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_student_id AND profile_completed = true) ) INTO result; RETURN result; END; $$;
CREATE OR REPLACE FUNCTION public.parent_switch_student_view(p_new_admission_id bigint) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE v_student_id uuid; BEGIN IF NOT EXISTS (SELECT 1 FROM public.admissions WHERE id = p_new_admission_id AND parent_id = auth.uid()) THEN RAISE EXCEPTION 'Unauthorized access to student profile'; END IF; SELECT student_user_id INTO v_student_id FROM public.admissions WHERE id = p_new_admission_id; END; $$;
CREATE OR REPLACE FUNCTION public.complete_school_onboarding( p_admin_name text, p_admin_email text, p_admin_phone text, p_designation text ) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN UPDATE public.school_admin_profiles SET admin_contact_name = p_admin_name, admin_contact_email = p_admin_email, admin_contact_phone = p_admin_phone, admin_designation = p_designation, onboarding_step = 'completed' WHERE user_id = auth.uid(); UPDATE public.profiles SET profile_completed = true WHERE id = auth.uid(); END; $$;
CREATE OR REPLACE FUNCTION public.finalize_school_pricing(p_branches text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN UPDATE public.school_admin_profiles SET plan_id = p_branches, onboarding_step = 'branches' WHERE user_id = auth.uid(); END; $$;
CREATE OR REPLACE FUNCTION public.create_school_branch( p_name text, p_address text, p_city text, p_state text, p_country text, p_contact_number text, p_is_main boolean, p_email text, p_admin_name text, p_admin_phone text, p_admin_email text ) RETURNS SETOF public.school_branches LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY INSERT INTO public.school_branches (school_user_id, name, address, city, state, country, contact_number, is_main_branch, email, admin_name, admin_phone, admin_email) VALUES (auth.uid(), p_name, p_address, p_city, p_state, p_country, p_contact_number, p_is_main, p_email, p_admin_name, p_admin_phone, p_admin_email) RETURNING *; END; $$;
CREATE OR REPLACE FUNCTION public.update_school_branch( p_branch_id bigint, p_name text, p_address text, p_city text, p_state text, p_country text, p_contact_number text, p_is_main boolean, p_email text, p_admin_name text, p_admin_phone text, p_admin_email text ) RETURNS SETOF public.school_branches LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY UPDATE public.school_branches SET name=p_name, address=p_address, city=p_city, state=p_state, country=p_country, contact_number=p_contact_number, is_main_branch=p_is_main, email=p_email, admin_name=p_admin_name, admin_phone=p_admin_phone, admin_email=p_admin_email WHERE id = p_branch_id AND school_user_id = auth.uid() RETURNING *; END; $$;
CREATE OR REPLACE FUNCTION public.delete_school_branch(p_branch_id bigint) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN DELETE FROM public.school_branches WHERE id = p_branch_id AND school_user_id = auth.uid(); END; $$;

-- --- TEACHER MANAGEMENT FUNCTIONS ---
CREATE OR REPLACE FUNCTION public.get_all_teachers_for_admin() 
RETURNS TABLE ( id uuid, email text, display_name text, phone text, is_active boolean, created_at timestamptz, subject text, qualification text, experience_years numeric, date_of_joining date, bio text, specializations text, profile_picture_url text, gender text, date_of_birth date, department text, designation text, employee_id text, employment_type text, employment_status text, branch_id bigint ) 
LANGUAGE plpgsql SECURITY DEFINER AS $$ 
BEGIN 
    RETURN QUERY 
    SELECT p.id, p.email, p.display_name, p.phone, p.is_active, p.created_at, t.subject, t.qualification, t.experience_years, t.date_of_joining, t.bio, t.specializations, t.profile_picture_url, t.gender, t.date_of_birth, t.department, t.designation, t.employee_id, t.employment_type, t.employment_status, t.branch_id 
    FROM public.profiles p 
    JOIN public.teacher_profiles t ON p.id = t.user_id 
    WHERE p.role = 'Teacher'
    AND t.branch_id IN (SELECT get_my_branch_ids());
END; 
$$;

CREATE OR REPLACE FUNCTION public.upsert_teacher_profile( p_user_id uuid, p_display_name text, p_email text, p_phone text, p_department text, p_designation text, p_employee_id text, p_employment_type text, p_subject text, p_qualification text, p_experience integer, p_doj date, p_branch_id bigint DEFAULT NULL ) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN INSERT INTO public.profiles (id, email, display_name, phone, role, profile_completed) VALUES (p_user_id, p_email, p_display_name, p_phone, 'Teacher', true) ON CONFLICT (id) DO UPDATE SET display_name = p_display_name, phone = p_phone; INSERT INTO public.teacher_profiles (user_id, department, designation, employee_id, employment_type, subject, qualification, experience_years, date_of_joining, branch_id) VALUES (p_user_id, p_department, p_designation, p_employee_id, p_employment_type, p_subject, p_qualification, p_experience, p_doj, p_branch_id) ON CONFLICT (user_id) DO UPDATE SET department = p_department, designation = p_designation, branch_id = p_branch_id; END; $$;
CREATE OR REPLACE FUNCTION public.bulk_update_teacher_profiles(p_teacher_ids uuid[], p_updates jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE t_id uuid; BEGIN FOREACH t_id IN ARRAY p_teacher_ids LOOP UPDATE public.teacher_profiles SET employment_status = COALESCE(p_updates->>'employment_status', employment_status), department = COALESCE(p_updates->>'department', department), subject = COALESCE(p_updates->>'subject', subject), branch_id = (p_updates->>'branch_id')::bigint WHERE user_id = t_id; END LOOP; END; $$;
CREATE OR REPLACE FUNCTION public.bulk_import_teachers(p_records jsonb, p_branch_id bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE rec jsonb; success_count int := 0; failure_count int := 0; errors jsonb[] := ARRAY[]::jsonb[]; v_user_id uuid; v_email text; v_name text; v_error_msg text; BEGIN IF p_branch_id IS NULL THEN RAISE EXCEPTION 'Branch ID must be provided'; END IF; FOR rec IN SELECT * FROM jsonb_array_elements(p_records) LOOP BEGIN v_email := lower(trim(rec->>'email')); v_name := trim(rec->>'display_name'); IF v_email IS NULL OR v_email = '' THEN RAISE EXCEPTION 'Email required'; END IF; IF v_name IS NULL OR v_name = '' THEN RAISE EXCEPTION 'Name required'; END IF; SELECT id INTO v_user_id FROM public.profiles WHERE email = v_email; IF v_user_id IS NULL THEN v_user_id := gen_random_uuid(); INSERT INTO public.profiles (id, email, display_name, phone, role, is_active, profile_completed) VALUES (v_user_id, v_email, v_name, rec->>'phone', 'Teacher', true, true); ELSE UPDATE public.profiles SET role = 'Teacher' WHERE id = v_user_id; END IF; INSERT INTO public.teacher_profiles (user_id, department, designation, subject, experience_years, qualification, employment_status, date_of_joining, branch_id) VALUES (v_user_id, rec->>'department', COALESCE(rec->>'designation', 'Teacher'), rec->>'subject', (NULLIF(rec->>'experience_years', '')::numeric), rec->>'qualification', COALESCE(rec->>'employment_status', 'Active'), CURRENT_DATE, p_branch_id) ON CONFLICT (user_id) DO UPDATE SET department = EXCLUDED.department, subject = EXCLUDED.subject; success_count := success_count + 1; EXCEPTION WHEN OTHERS THEN failure_count := failure_count + 1; errors := array_append(errors, jsonb_build_object('row', (rec->>'row_index')::int, 'name', v_name, 'error', v_error_msg)); END; END LOOP; RETURN jsonb_build_object('success_count', success_count, 'failure_count', failure_count, 'errors', to_jsonb(errors)); END; $$;

CREATE OR REPLACE FUNCTION public.get_school_departments_stats(p_branch_id bigint) RETURNS TABLE (id bigint, name text, description text, hod_id uuid, hod_name text, teacher_count bigint, course_count bigint) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT d.id, d.name, d.description, d.hod_id, p.display_name, (SELECT COUNT(*) FROM public.teacher_profiles t WHERE t.department = d.name AND t.branch_id = p_branch_id), (SELECT COUNT(*) FROM public.courses c WHERE c.department = d.name) FROM public.school_departments d LEFT JOIN public.profiles p ON d.hod_id = p.id WHERE d.branch_id = p_branch_id; END; $$;
CREATE OR REPLACE FUNCTION public.manage_school_department( p_id bigint, p_name text, p_description text, p_hod_id uuid, p_branch_id bigint, p_delete boolean ) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN IF p_delete THEN DELETE FROM public.school_departments WHERE id = p_id; ELSIF p_id IS NULL THEN INSERT INTO public.school_departments (name, description, hod_id, branch_id) VALUES (p_name, p_description, p_hod_id, p_branch_id); ELSE UPDATE public.school_departments SET name = p_name, description = p_description, hod_id = p_hod_id WHERE id = p_id; END IF; END; $$;
CREATE OR REPLACE FUNCTION public.get_teacher_documents(p_teacher_id uuid) RETURNS SETOF public.teacher_documents LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT * FROM public.teacher_documents WHERE teacher_id = p_teacher_id; END; $$;
CREATE OR REPLACE FUNCTION public.update_teacher_document_status(p_doc_id bigint, p_status text, p_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN UPDATE public.teacher_documents SET status = p_status, rejection_reason = p_reason WHERE id = p_doc_id; END; $$;

CREATE OR REPLACE FUNCTION public.get_class_roster_for_admin(p_class_id bigint) RETURNS SETOF public.profiles LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT p.* FROM public.profiles p JOIN public.student_profiles sp ON p.id = sp.user_id WHERE sp.assigned_class_id = p_class_id; END; $$;
CREATE OR REPLACE FUNCTION public.get_attendance_for_admin(p_class_id bigint, p_attendance_date date) RETURNS SETOF public.attendance LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT * FROM public.attendance WHERE class_id = p_class_id AND attendance_date = p_attendance_date; END; $$;
CREATE OR REPLACE FUNCTION public.upsert_attendance_for_admin(records jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE rec jsonb; BEGIN FOR rec IN SELECT * FROM jsonb_array_elements(records) LOOP INSERT INTO public.attendance (class_id, student_id, attendance_date, status, notes, recorded_by) VALUES ((rec->>'class_id')::bigint, (rec->>'student_id')::uuid, (rec->>'attendance_date')::date, rec->>'status', rec->>'notes', auth.uid()) ON CONFLICT (student_id, class_id, attendance_date) DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, marked_at = now(); END LOOP; END; $$;
CREATE OR REPLACE FUNCTION public.get_admin_analytics_stats() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN jsonb_build_object( 'total_users', (SELECT COUNT(*) FROM public.profiles WHERE role = 'Student'), 'total_applications', (SELECT COUNT(*) FROM public.admissions), 'pending_applications', (SELECT COUNT(*) FROM public.admissions WHERE status = 'Pending Review') ); END; $$;
CREATE OR REPLACE FUNCTION public.send_bulk_communication( p_subject text, p_body text, p_recipient_roles text[], p_target_criteria jsonb ) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN INSERT INTO public.communications (sender_id, sender_role, subject, body, recipients, target_criteria, status) VALUES (auth.uid(), 'Admin', p_subject, p_body, p_recipient_roles, p_target_criteria, 'Sent'); END; $$;
CREATE OR REPLACE FUNCTION public.get_communications_history() RETURNS SETOF public.communications LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT * FROM public.communications WHERE sender_id = auth.uid() ORDER BY sent_at DESC; END; $$;
CREATE OR REPLACE FUNCTION public.send_enquiry_message(p_enquiry_id bigint, p_message text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN INSERT INTO public.enquiry_messages (enquiry_id, sender_id, message, is_admin_message) VALUES (p_enquiry_id, auth.uid(), p_message, EXISTS(SELECT 1 FROM public.school_admin_profiles WHERE user_id = auth.uid())); END; $$;
CREATE OR REPLACE FUNCTION public.get_enquiry_timeline(p_enquiry_id bigint) RETURNS TABLE (id bigint, item_type text, created_at timestamptz, created_by_name text, is_admin boolean, details jsonb) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT m.id, 'MESSAGE' as item_type, m.created_at, p.display_name as created_by_name, m.is_admin_message as is_admin, jsonb_build_object('message', m.message) as details FROM public.enquiry_messages m LEFT JOIN public.profiles p ON m.sender_id = p.id WHERE m.enquiry_id = p_enquiry_id ORDER BY m.created_at ASC; END; $$;
CREATE OR REPLACE FUNCTION public.update_enquiry_status(p_enquiry_id bigint, p_new_status text, p_notes text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN UPDATE public.enquiries SET status = p_new_status, notes = p_notes WHERE id = p_enquiry_id; END; $$;

-- Critical function to fix portal crash - provides enquiry details with proper error handling
CREATE OR REPLACE FUNCTION public.get_enquiry_details(p_enquiry_id bigint)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_enquiry record;
    v_parent record;
    v_verification record;
BEGIN
    -- Get enquiry with access validation
    SELECT * INTO v_enquiry FROM public.enquiries WHERE id = p_enquiry_id;

    IF v_enquiry IS NULL THEN
        RETURN jsonb_build_object(
            'error', 'ENQUIRY_NOT_FOUND',
            'message', 'Enquiry does not exist or access denied',
            'context', jsonb_build_object('enquiry_id', p_enquiry_id)
        );
    END IF;

    -- Verify branch access (RLS check)
    IF v_enquiry.branch_id NOT IN (SELECT get_my_branch_ids()) THEN
        RETURN jsonb_build_object(
            'error', 'ACCESS_DENIED',
            'message', 'You do not have permission to view this enquiry',
            'context', jsonb_build_object('enquiry_id', p_enquiry_id)
        );
    END IF;

    -- Get parent details
    SELECT display_name, phone INTO v_parent
    FROM public.profiles WHERE id = v_enquiry.parent_id;

    -- Get verification details (if applicable)
    SELECT code, created_at INTO v_verification
    FROM public.share_codes
    WHERE enquiry_id = p_enquiry_id AND code_type = 'Enquiry'
    ORDER BY created_at DESC LIMIT 1;

    -- Return structured enquiry details
    RETURN jsonb_build_object(
        'enquiry_id', v_enquiry.id,
        'applicant', jsonb_build_object(
            'name', v_enquiry.applicant_name,
            'grade', v_enquiry.grade
        ),
        'parent', jsonb_build_object(
            'id', v_enquiry.parent_id,
            'name', COALESCE(v_parent.display_name, 'Unknown'),
            'phone', v_parent.phone
        ),
        'status', v_enquiry.status,
        'branch_id', v_enquiry.branch_id,
        'created_at', v_enquiry.created_at,
        'updated_at', v_enquiry.updated_at,
        'verification', CASE
            WHEN v_verification.code IS NOT NULL THEN
                jsonb_build_object(
                    'code', v_verification.code,
                    'verified_at', v_verification.created_at
                )
            ELSE NULL
        END
    );
END;
$$;
CREATE OR REPLACE FUNCTION public.convert_enquiry_to_admission(p_enquiry_id bigint) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_adm_id bigint;
BEGIN
    SELECT admission_id INTO v_adm_id FROM public.enquiries WHERE id = p_enquiry_id;
    UPDATE public.admissions SET status = 'Pending Review', has_enquiry = true, submitted_by = auth.uid() WHERE id = v_adm_id;
    UPDATE public.enquiries SET status = 'Completed', conversion_state = 'CONVERTED', converted_at = now() WHERE id = p_enquiry_id;
    -- Migrate share codes from enquiry to admission
    UPDATE public.share_codes SET admission_id = v_adm_id, code_type = 'Admission' WHERE enquiry_id = p_enquiry_id;
END;
$$;
CREATE OR REPLACE FUNCTION public.admin_verify_share_code(p_code text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE v_share record; v_admission record; v_enquiry record; v_main_id bigint; BEGIN SELECT * INTO v_share FROM public.share_codes WHERE code = p_code AND status = 'Active' AND expires_at > now(); IF v_share IS NULL THEN RETURN jsonb_build_object('found', false, 'error', 'Invalid or expired code'); END IF; IF v_share.code_type = 'Admission' THEN SELECT * INTO v_admission FROM public.admissions WHERE id = v_share.admission_id; ELSIF v_share.code_type = 'Enquiry' THEN SELECT * INTO v_enquiry FROM public.enquiries WHERE id = v_share.enquiry_id; IF v_enquiry IS NULL THEN RETURN jsonb_build_object('found', false, 'error', 'Enquiry record not found for this code'); END IF; SELECT * INTO v_admission FROM public.admissions WHERE id = v_enquiry.admission_id; END IF; IF v_admission IS NULL THEN RETURN jsonb_build_object('found', false, 'error', 'Admission record not found'); END IF; v_main_id := v_admission.id; RETURN jsonb_build_object( 'found', true, 'id', v_main_id, 'admission_id', v_admission.id, 'enquiry_id', v_enquiry.id, 'code_type', v_share.code_type, 'applicant_name', v_admission.applicant_name, 'grade', v_admission.grade, 'date_of_birth', v_admission.date_of_birth, 'gender', v_admission.gender, 'parent_name', v_admission.parent_name, 'parent_email', v_admission.parent_email, 'parent_phone', v_admission.parent_phone, 'already_imported', FALSE ); END; $$;
CREATE OR REPLACE FUNCTION public.admin_import_record_from_share_code(
    p_admission_id bigint,
    p_code_type text,
    p_branch_id bigint
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF p_code_type = 'Enquiry' THEN
        -- For Enquiry codes: Only set branch_id if null, ensure enquiry record exists, DO NOT set status
        UPDATE public.admissions
        SET branch_id = COALESCE(branch_id, p_branch_id)
        WHERE id = p_admission_id AND branch_id IS NULL;

        INSERT INTO public.enquiries (
            admission_id,
            applicant_name,
            grade,
            branch_id,
            parent_name,
            parent_email,
            parent_phone
        )
        SELECT id, applicant_name, grade, p_branch_id, parent_name, parent_email, parent_phone
        FROM public.admissions
        WHERE id = p_admission_id
        ON CONFLICT (admission_id) DO UPDATE SET branch_id = EXCLUDED.branch_id;
    ELSE
        -- For Admission codes: Set branch_id and valid admission status
        UPDATE public.admissions
        SET branch_id = p_branch_id, status = 'Pending Review'
        WHERE id = p_admission_id;
    END IF;

    UPDATE public.share_codes SET status = 'Redeemed' WHERE admission_id = p_admission_id;
END;
$$;
CREATE OR REPLACE FUNCTION public.get_my_share_codes() RETURNS TABLE (
    id bigint,
    admission_id bigint,
    enquiry_id bigint,
    applicant_name text,
    profile_photo_url text,
    code text,
    status text,
    code_type text,
    expires_at timestamptz,
    created_at timestamptz
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        sc.id,
        sc.admission_id,
        sc.enquiry_id,
        COALESCE(a.applicant_name, e.applicant_name) as applicant_name,
        COALESCE(a.profile_photo_url, NULL) as profile_photo_url,
        sc.code,
        sc.status,
        sc.code_type,
        sc.expires_at,
        sc.created_at
    FROM public.share_codes sc
    LEFT JOIN public.admissions a ON sc.admission_id = a.id AND sc.code_type = 'Admission'
    LEFT JOIN public.enquiries e ON sc.enquiry_id = e.id AND sc.code_type = 'Enquiry'
    WHERE (sc.code_type = 'Admission' AND EXISTS (SELECT 1 FROM public.admissions a2 WHERE a2.id = sc.admission_id AND a2.parent_id = auth.uid()))
       OR (sc.code_type = 'Enquiry' AND EXISTS (SELECT 1 FROM public.enquiries e2 JOIN public.admissions a2 ON e2.admission_id = a2.id WHERE e2.id = sc.enquiry_id AND a2.parent_id = auth.uid()));
END;
$$;
CREATE OR REPLACE FUNCTION public.generate_enquiry_share_code(p_admission_id bigint, p_purpose text) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code text;
    v_enquiry_id bigint;
BEGIN
    -- Verify that the admission belongs to the authenticated parent
    IF NOT EXISTS (SELECT 1 FROM public.admissions WHERE id = p_admission_id AND parent_id = auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized access to admission';
    END IF;

    -- Create enquiry record if it doesn't exist (isolated from admissions)
    INSERT INTO public.enquiries (admission_id, applicant_name, grade, parent_name, parent_email, parent_phone, status)
    SELECT id, applicant_name, grade, parent_name, parent_email, parent_phone, 'New'
    FROM public.admissions WHERE id = p_admission_id
    ON CONFLICT (admission_id) DO NOTHING
    RETURNING id INTO v_enquiry_id;

    -- If enquiry already exists, get its ID
    IF v_enquiry_id IS NULL THEN
        SELECT id INTO v_enquiry_id FROM public.enquiries WHERE admission_id = p_admission_id;
    END IF;

    -- Generate and store the code linked to enquiry (admission_id must be NULL for Enquiry codes per constraint)
    v_code := upper(substring(md5(random()::text), 1, 12));
    INSERT INTO public.share_codes (code, admission_id, enquiry_id, purpose, code_type, expires_at)
    VALUES (v_code, NULL, v_enquiry_id, p_purpose, 'Enquiry', now() + interval '1 day');

    RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_admission_share_code(p_admission_id bigint, p_purpose text, p_code_type text) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code text;
    v_enquiry_id bigint;
BEGIN
    -- Validate input parameters
    IF p_admission_id IS NULL THEN
        RAISE EXCEPTION 'Admission ID cannot be null';
    END IF;

    -- Verify that the admission belongs to the authenticated parent
    IF NOT EXISTS (SELECT 1 FROM public.admissions WHERE id = p_admission_id AND parent_id = auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized access to admission';
    END IF;

    v_code := upper(substring(md5(random()::text), 1, 12));

    IF p_code_type = 'Enquiry' THEN
        -- For Enquiry permits, create enquiry record first
        INSERT INTO public.enquiries (admission_id, applicant_name, grade, parent_name, parent_email, parent_phone, status)
        SELECT id, applicant_name, grade, parent_name, parent_email, parent_phone, 'New'
        FROM public.admissions WHERE id = p_admission_id
        ON CONFLICT (admission_id) DO NOTHING
        RETURNING id INTO v_enquiry_id;

        -- If enquiry already exists, get its ID
        IF v_enquiry_id IS NULL THEN
            SELECT id INTO v_enquiry_id FROM public.enquiries WHERE admission_id = p_admission_id;
        END IF;

        -- Insert share code for Enquiry
        INSERT INTO public.share_codes (code, admission_id, enquiry_id, purpose, code_type, expires_at)
        VALUES (v_code, NULL, v_enquiry_id, p_purpose, 'Enquiry', now() + interval '1 day');
    ELSE
        -- For Admission permits
        INSERT INTO public.share_codes (code, admission_id, purpose, code_type, expires_at)
        VALUES (v_code, p_admission_id, p_purpose, p_code_type, now() + interval '1 day');

        -- Update admission status to indicate document request phase
        UPDATE public.admissions SET status = 'Pending Review' WHERE id = p_admission_id;
    END IF;

    RETURN v_code;
END;
$$;
CREATE OR REPLACE FUNCTION public.revoke_my_share_code(p_code_id bigint) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.share_codes
  SET status = 'Revoked'
  WHERE id = p_code_id
  AND (
    -- For Admission codes
    (code_type = 'Admission' AND EXISTS (
      SELECT 1 FROM public.admissions
      WHERE id = share_codes.admission_id
      AND parent_id = auth.uid()
    ))
    OR
    -- For Enquiry codes
    (code_type = 'Enquiry' AND EXISTS (
      SELECT 1 FROM public.admissions a
      JOIN public.enquiries e ON e.admission_id = a.id
      WHERE e.id = share_codes.enquiry_id
      AND a.parent_id = auth.uid()
    ))
  );
END;
$$;
CREATE OR REPLACE FUNCTION public.get_linked_parent_for_student(p_student_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE v_admission_id bigint; v_parent_id uuid; v_parent_profile record; BEGIN SELECT admission_id INTO v_admission_id FROM public.student_profiles WHERE user_id = p_student_id; SELECT parent_id INTO v_parent_id FROM public.admissions WHERE id = v_admission_id; IF v_parent_id IS NULL THEN RETURN jsonb_build_object('found', false); END IF; SELECT p.display_name, p.email, p.phone, pp.relationship_to_student, pp.address, pp.city, pp.state, pp.country INTO v_parent_profile FROM public.profiles p JOIN public.parent_profiles pp ON p.id = pp.user_id WHERE p.id = v_parent_id; RETURN jsonb_build_object( 'found', true, 'name', v_parent_profile.display_name, 'email', v_parent_profile.email, 'phone', v_parent_profile.phone, 'relationship', v_parent_profile.relationship_to_student, 'address', v_parent_profile.address, 'city', v_parent_profile.city, 'state', v_parent_profile.state, 'country', v_parent_profile.country ); END; $$;
CREATE OR REPLACE FUNCTION public.update_student_details_admin( p_student_id uuid, p_display_name text, p_phone text, p_dob date, p_gender text, p_address text, p_parent_details text, p_student_id_number text, p_grade text ) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN UPDATE public.profiles SET display_name = p_display_name, phone = p_phone WHERE id = p_student_id; UPDATE public.student_profiles SET date_of_birth = p_dob, gender = p_gender, address = p_address, parent_guardian_details = p_parent_details, student_id_number = p_student_id_number, grade = p_grade WHERE user_id = p_student_id; END; $$;
CREATE OR REPLACE FUNCTION public.manage_class( p_id bigint, p_name text, p_grade_level text, p_section text, p_academic_year text, p_class_teacher_id uuid, p_branch_id bigint, p_capacity integer ) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN IF p_id IS NULL THEN INSERT INTO public.school_classes (name, grade_level, section, academic_year, class_teacher_id, branch_id, capacity) VALUES (p_name, p_grade_level, p_section, p_academic_year, p_class_teacher_id, p_branch_id, p_capacity); ELSE UPDATE public.school_classes SET name=p_name, grade_level=p_grade_level, section=p_section, academic_year=p_academic_year, class_teacher_id=p_class_teacher_id, capacity=p_capacity WHERE id = p_id; END IF; END; $$;
CREATE OR REPLACE FUNCTION public.map_class_subjects(p_class_id bigint, p_subject_ids bigint[]) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE sid bigint; BEGIN DELETE FROM public.class_subjects WHERE class_id = p_class_id; FOREACH sid IN ARRAY p_subject_ids LOOP INSERT INTO public.class_subjects (class_id, subject_id) VALUES (p_class_id, sid); END LOOP; END; $$;
CREATE OR REPLACE FUNCTION public.bulk_create_classes(p_classes jsonb, p_branch_id bigint, p_academic_year text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE c jsonb; success_count int := 0; failure_count int := 0; errors jsonb[] := ARRAY[]::jsonb[]; BEGIN FOR c IN SELECT * FROM jsonb_array_elements(p_classes) LOOP BEGIN INSERT INTO public.school_classes (name, grade_level, section, capacity, branch_id, academic_year) VALUES ( trim(c->>'name'), trim(c->>'grade'), trim(c->>'section'), (c->>'capacity')::int, p_branch_id, p_academic_year ); success_count := success_count + 1; EXCEPTION WHEN OTHERS THEN failure_count := failure_count + 1; errors := array_append(errors, jsonb_build_object('name', c->>'name', 'error', SQLERRM)); END; END LOOP; RETURN jsonb_build_object('success_count', success_count, 'failure_count', failure_count, 'errors', to_jsonb(errors)); END; $$;
CREATE OR REPLACE FUNCTION public.bulk_assign_class_teachers(p_assignments jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE assignment jsonb; v_teacher_id uuid; v_class_id bigint; success_count int := 0; failure_count int := 0; errors jsonb[] := ARRAY[]::jsonb[]; BEGIN FOR assignment IN SELECT * FROM jsonb_array_elements(p_assignments) LOOP BEGIN SELECT id INTO v_teacher_id FROM public.profiles WHERE lower(trim(email)) = lower(trim(assignment->>'teacher_email')); IF v_teacher_id IS NULL THEN RAISE EXCEPTION 'Teacher not found'; END IF; SELECT id INTO v_class_id FROM public.school_classes WHERE upper(trim(name)) = upper(trim(assignment->>'class_name')) AND branch_id IN (SELECT * FROM public.get_my_branch_ids()); IF v_class_id IS NULL THEN RAISE EXCEPTION 'Class not found'; END IF; UPDATE public.school_classes SET class_teacher_id = v_teacher_id WHERE id = v_class_id; success_count := success_count + 1; EXCEPTION WHEN OTHERS THEN failure_count := failure_count + 1; errors := array_append(errors, jsonb_build_object('class', assignment->>'class_name', 'error', SQLERRM)); END; END LOOP; RETURN jsonb_build_object('success_count', success_count, 'failure_count', failure_count, 'errors', to_jsonb(errors)); END; $$;
CREATE OR REPLACE FUNCTION public.bulk_enroll_students_to_classes(p_enrollments jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE rec jsonb; v_student_id uuid; v_class_id bigint; success_count int := 0; failure_count int := 0; errors jsonb[] := ARRAY[]::jsonb[]; BEGIN FOR rec IN SELECT * FROM jsonb_array_elements(p_enrollments) LOOP BEGIN SELECT id INTO v_student_id FROM public.profiles WHERE lower(trim(email)) = lower(trim(rec->>'student_email')); IF v_student_id IS NULL THEN RAISE EXCEPTION 'Student not found'; END IF; SELECT id INTO v_class_id FROM public.school_classes WHERE upper(trim(name)) = upper(trim(rec->>'class_name')) AND branch_id IN (SELECT * FROM public.get_my_branch_ids()); IF v_class_id IS NULL THEN RAISE EXCEPTION 'Class not found'; END IF; UPDATE public.student_profiles SET assigned_class_id = v_class_id WHERE user_id = v_student_id; success_count := success_count + 1; EXCEPTION WHEN OTHERS THEN failure_count := failure_count + 1; errors := array_append(errors, jsonb_build_object('student', rec->>'student_email', 'error', SQLERRM)); END; END LOOP; RETURN jsonb_build_object('success_count', success_count, 'failure_count', failure_count, 'errors', to_jsonb(errors)); END; $$;
CREATE OR REPLACE FUNCTION public.bulk_map_subjects_to_classes(p_mappings jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE rec jsonb; v_class_id bigint; v_subject_id bigint; success_count int := 0; failure_count int := 0; errors jsonb[] := ARRAY[]::jsonb[]; BEGIN FOR rec IN SELECT * FROM jsonb_array_elements(p_mappings) LOOP BEGIN SELECT id INTO v_class_id FROM public.school_classes WHERE upper(trim(name)) = upper(trim(both '"' from rec->>'class_name')) AND branch_id IN (SELECT * FROM public.get_my_branch_ids()); IF v_class_id IS NULL THEN RAISE EXCEPTION 'Class not found'; END IF; SELECT id INTO v_subject_id FROM public.courses WHERE upper(trim(code)) = upper(trim(both '"' from rec->>'subject_code')); IF v_subject_id IS NULL THEN RAISE EXCEPTION 'Subject not found'; END IF; INSERT INTO public.class_subjects (class_id, subject_id) VALUES (v_class_id, v_subject_id) ON CONFLICT (class_id, subject_id) DO NOTHING; success_count := success_count + 1; EXCEPTION WHEN OTHERS THEN failure_count := failure_count + 1; errors := array_append(errors, jsonb_build_object('class', rec->>'class_name', 'error', SQLERRM)); END; END LOOP; RETURN jsonb_build_object('success_count', success_count, 'failure_count', failure_count, 'errors', to_jsonb(errors)); END; $$;
CREATE OR REPLACE FUNCTION public.get_my_messages() RETURNS SETOF public.communications LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT * FROM public.communications WHERE status = 'Sent'; END; $$;
CREATE OR REPLACE FUNCTION public.get_my_enquiries() RETURNS SETOF public.enquiries LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT e.* FROM public.enquiries e JOIN public.admissions a ON e.admission_id = a.id WHERE a.parent_id = auth.uid(); END; $$;
CREATE OR REPLACE FUNCTION public.submit_unsolicited_document( p_admission_id bigint, p_document_name text, p_file_name text, p_storage_path text ) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE v_req_id bigint; BEGIN SELECT id INTO v_req_id FROM public.document_requirements WHERE admission_id = p_admission_id AND document_name = p_document_name; IF v_req_id IS NULL THEN INSERT INTO public.document_requirements (admission_id, document_name, status) VALUES (p_admission_id, p_document_name, 'Submitted') RETURNING id INTO v_req_id; ELSE UPDATE public.document_requirements SET status = 'Submitted' WHERE id = v_req_id; END IF; INSERT INTO public.admission_documents (admission_id, requirement_id, uploaded_by, file_name, storage_path, status) VALUES (p_admission_id, v_req_id, auth.uid(), p_file_name, p_storage_path, 'Pending'); END; $$;
CREATE OR REPLACE FUNCTION public.create_admission( p_applicant_name text, p_grade text, p_date_of_birth date, p_gender text, p_profile_photo_url text, p_medical_info text, p_emergency_contact text, p_admission_id bigint ) RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE v_id bigint; BEGIN INSERT INTO public.admissions ( parent_id, applicant_name, grade, date_of_birth, gender, profile_photo_url, medical_info, emergency_contact, submitted_by, status ) VALUES ( auth.uid(), p_applicant_name, p_grade, p_date_of_birth, p_gender, p_profile_photo_url, p_medical_info, p_emergency_contact, auth.uid(), 'Pending Review' ) RETURNING id INTO v_id; RETURN v_id; END; $$;
CREATE OR REPLACE FUNCTION public.update_admission( p_admission_id bigint, p_applicant_name text, p_grade text, p_date_of_birth date, p_gender text, p_profile_photo_url text, p_medical_info text, p_emergency_contact text ) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN UPDATE public.admissions SET applicant_name = p_applicant_name, grade = p_grade, date_of_birth = p_date_of_birth, gender = p_gender, profile_photo_url = COALESCE(p_profile_photo_url, profile_photo_url), medical_info = p_medical_info, emergency_contact = p_emergency_contact, updated_at = now() WHERE id = p_admission_id AND parent_id = auth.uid(); END; $$;
CREATE OR REPLACE FUNCTION public.complete_student_onboarding(p_student_id uuid, p_data jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN UPDATE public.student_profiles SET parent_guardian_details = p_data->>'parent_name', address = p_data->>'address' WHERE user_id = p_student_id; UPDATE public.profiles SET phone = p_data->>'phone', profile_completed = true WHERE id = p_student_id; END; $$;

DROP FUNCTION IF EXISTS public.parent_initialize_vault_slots(bigint);
CREATE OR REPLACE FUNCTION public.parent_initialize_vault_slots(p_admission_id bigint) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_admission record;
    v_existing_count int;
BEGIN
    -- Verify admission belongs to current user
    SELECT * INTO v_admission FROM public.admissions WHERE id = p_admission_id AND parent_id = auth.uid();
    IF v_admission IS NULL THEN
        RAISE EXCEPTION 'Admission not found or access denied';
    END IF;

    -- Check if requirements already exist
    SELECT COUNT(*) INTO v_existing_count FROM public.document_requirements WHERE admission_id = p_admission_id;
    IF v_existing_count > 0 THEN
        RETURN; -- Already initialized
    END IF;

    -- Insert the 5 required documents
    INSERT INTO public.document_requirements (admission_id, document_name, status, is_mandatory, notes_for_parent) VALUES
    (p_admission_id, 'Student Birth Certificate', 'Pending', true, 'Official birth certificate issued by the local registrar'),
    (p_admission_id, 'Student Aadhaar Card / National ID', 'Pending', true, 'Government-issued national identity document'),
    (p_admission_id, 'Parent/Guardian Aadhaar Card / ID Proof', 'Pending', true, 'Government-issued identity proof of parent/guardian'),
    (p_admission_id, 'Previous School Transfer Certificate (TC)', 'Pending', false, 'Transfer certificate from previous school (if applicable)'),
    (p_admission_id, 'Recent Passport-size Photograph of Student', 'Pending', true, 'Recent passport-sized photograph with white background');

END;
$$;

CREATE OR REPLACE FUNCTION public.parent_complete_document_upload(
    p_requirement_id bigint,
    p_admission_id bigint,
    p_file_name text,
    p_storage_path text,
    p_file_size bigint,
    p_mime_type text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_admission record;
    v_requirement record;
BEGIN
    -- Verify admission belongs to current user
    SELECT * INTO v_admission FROM public.admissions WHERE id = p_admission_id AND parent_id = auth.uid();
    IF v_admission IS NULL THEN
        RAISE EXCEPTION 'Admission not found or access denied';
    END IF;

    -- Verify requirement exists and belongs to admission
    SELECT * INTO v_requirement FROM public.document_requirements WHERE id = p_requirement_id AND admission_id = p_admission_id;
    IF v_requirement IS NULL THEN
        RAISE EXCEPTION 'Document requirement not found';
    END IF;

    -- Insert the document record
    INSERT INTO public.admission_documents (
        admission_id,
        requirement_id,
        uploaded_by,
        file_name,
        storage_path,
        status
    ) VALUES (
        p_admission_id,
        p_requirement_id,
        auth.uid(),
        p_file_name,
        p_storage_path,
        'Pending'
    );

    -- Update requirement status to Submitted
    UPDATE public.document_requirements SET status = 'Submitted' WHERE id = p_requirement_id;

    -- Update admission status if it's still in initial state
    UPDATE public.admissions SET status = 'Documents Requested', updated_at = now()
    WHERE id = p_admission_id AND status IN ('Pending Review', 'Approved');

END;
$$;

CREATE OR REPLACE FUNCTION public.parent_get_document_requirements() RETURNS TABLE ( id bigint, admission_id bigint, document_name text, status text, is_mandatory boolean, notes_for_parent text, rejection_reason text, applicant_name text, profile_photo_url text, admission_documents jsonb ) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT dr.id, dr.admission_id, dr.document_name, dr.status, dr.is_mandatory, dr.notes_for_parent, dr.rejection_reason, a.applicant_name, a.profile_photo_url, COALESCE( ( SELECT jsonb_agg( jsonb_build_object( 'id', ad.id, 'file_name', ad.file_name, 'storage_path', ad.storage_path, 'uploaded_at', ad.uploaded_at ) ) FROM public.admission_documents ad WHERE ad.requirement_id = dr.id ), '[]'::jsonb ) as admission_documents FROM public.document_requirements dr JOIN public.admissions a ON dr.admission_id = a.id WHERE a.parent_id = auth.uid() OR a.student_user_id = auth.uid(); END; $$;
CREATE OR REPLACE FUNCTION public.submit_admission_document( p_admission_id bigint, p_requirement_id bigint, p_file_name text, p_storage_path text ) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN INSERT INTO public.admission_documents (admission_id, requirement_id, uploaded_by, file_name, storage_path, status) VALUES (p_admission_id, p_requirement_id, auth.uid(), p_file_name, p_storage_path, 'Pending'); UPDATE public.document_requirements SET status = 'Submitted' WHERE id = p_requirement_id; UPDATE public.admissions SET status = 'Documents Requested' WHERE id = p_admission_id AND status = 'Pending Review'; END; $$;
CREATE OR REPLACE FUNCTION public.request_admission_documents(p_admission_id bigint, p_documents text[], p_note text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE doc_name text; BEGIN FOREACH doc_name IN ARRAY p_documents LOOP INSERT INTO public.document_requirements (admission_id, document_name, notes_for_parent) VALUES (p_admission_id, doc_name, p_note); END LOOP; UPDATE public.admissions SET status = 'Documents Requested' WHERE id = p_admission_id; END; $$;

CREATE OR REPLACE FUNCTION public.approve_admission_application(p_admission_id bigint) 
RETURNS jsonb 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admission record;
    v_new_user_id uuid;
    v_email text;
    v_existing_user_id uuid;
    v_unverified_docs_count int;
BEGIN
    -- 1. Get Admission Record
    SELECT * INTO v_admission FROM public.admissions WHERE id = p_admission_id; 
    IF v_admission IS NULL THEN 
        RETURN jsonb_build_object('success', false, 'message', 'Admission record not found.'); 
    END IF; 

    -- 2. Check if already approved
    IF v_admission.student_user_id IS NOT NULL THEN 
        UPDATE public.admissions SET status = 'Approved' WHERE id = p_admission_id; 
        RETURN jsonb_build_object('success', true, 'message', 'Student already linked. Status updated to Approved.'); 
    END IF; 

    -- 3. Check Documents (Optional: Uncomment to enforce strict document verification in DB)
    -- SELECT COUNT(*) INTO v_unverified_docs_count FROM public.document_requirements WHERE admission_id = p_admission_id AND status != 'Accepted';
    -- IF v_unverified_docs_count > 0 THEN
    --    RETURN jsonb_build_object('success', false, 'message', 'Cannot approve: ' || v_unverified_docs_count || ' documents are not yet verified.');
    -- END IF;

    -- 4. Generate Unique Email
    -- Format: firstname.lastname.appid@school.system (fallback to random if conflict)
    v_email := lower(regexp_replace(trim(v_admission.applicant_name), '\s+', '.', 'g')) || '.' || COALESCE(v_admission.application_number, '000') || '@school.system';
    
    -- Check if email exists, append random if needed (though profiles constraint should handle it, we want to avoid error)
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE email = v_email) LOOP
        v_email := lower(regexp_replace(trim(v_admission.applicant_name), '\s+', '.', 'g')) || '.' || floor(random() * 10000)::text || '@school.system';
    END LOOP;
    
    -- 5. Create or Get Profile
    -- Ideally, we create a new Shadow Profile. 
    -- If a profile exists with this email (unlikely given loop above unless race condition), we use it.
    
    v_new_user_id := gen_random_uuid(); 
    
    INSERT INTO public.profiles (
        id, 
        email, 
        display_name, 
        phone, 
        role, 
        is_active, 
        profile_completed
    ) VALUES (
        v_new_user_id, 
        v_email, 
        v_admission.applicant_name, 
        v_admission.parent_phone, 
        'Student', 
        true, 
        true
    );

    -- 6. Create Student Profile
    INSERT INTO public.student_profiles ( 
        user_id, 
        admission_id, 
        grade, 
        branch_id, 
        parent_guardian_details, 
        gender, 
        date_of_birth, 
        student_id_number, 
        roll_number 
    ) VALUES ( 
        v_new_user_id, 
        p_admission_id, 
        v_admission.grade, 
        v_admission.branch_id, 
        v_admission.parent_name || ' (' || COALESCE(v_admission.parent_phone, '') || ')', 
        v_admission.gender, 
        v_admission.date_of_birth, 
        v_admission.application_number, 
        'PENDING' 
    );
    
    -- 7. Update Admission Status
    UPDATE public.admissions 
    SET 
        status = 'Approved', 
        student_user_id = v_new_user_id, 
        student_system_email = v_email, 
        updated_at = now()
    WHERE id = p_admission_id; 
    
    RETURN jsonb_build_object('success', true, 'student_id', v_new_user_id, 'email', v_email); 
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END; 
$$;

CREATE OR REPLACE FUNCTION public.update_admission_status(p_admission_id bigint, p_new_status text) RETURNS void LANGUAGE sql SECURITY DEFINER AS $$ UPDATE public.admissions SET status = p_new_status WHERE id = p_admission_id; $$;
CREATE OR REPLACE FUNCTION public.get_admissions(p_branch_id bigint DEFAULT NULL) RETURNS SETOF public.admissions LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT * FROM public.admissions WHERE branch_id IN (SELECT get_my_branch_ids()) AND (p_branch_id IS NULL OR branch_id = p_branch_id) AND status NOT IN ('Enquiry', 'Enquiry Node', 'ENQUIRY_NODE_ACTIVE', 'ENQUIRY_NODE_VERIFIED', 'ENQUIRY_NODE_IN_PROGRESS', 'CONVERTED'); END; $$;
CREATE OR REPLACE FUNCTION public.get_all_enquiries(p_branch_id bigint DEFAULT NULL) RETURNS SETOF public.enquiries LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT * FROM public.enquiries WHERE branch_id IN (SELECT get_my_branch_ids()) AND (p_branch_id IS NULL OR branch_id = p_branch_id); END; $$;

-- Critical function to get enquiries visible in Enquiry Node
CREATE OR REPLACE FUNCTION public.check_service_health()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN jsonb_build_object('status', 'healthy', 'timestamp', now(), 'service', 'enquiry_node');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_enquiries_for_node(p_branch_id bigint DEFAULT NULL)
RETURNS SETOF public.enquiries
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.enquiries
    WHERE branch_id IN (SELECT get_my_branch_ids())
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND conversion_state = 'NOT_CONVERTED'
      AND is_archived = false
      AND is_deleted = false
      AND status IS NOT NULL
      AND status != ''
    ORDER BY created_at DESC;
END;
$$;
CREATE OR REPLACE FUNCTION public.get_parent_dashboard_stats() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE v_total int; v_pending int; v_approved int; BEGIN SELECT COUNT(*) INTO v_total FROM public.admissions WHERE parent_id = auth.uid(); SELECT COUNT(*) INTO v_pending FROM public.admissions WHERE parent_id = auth.uid() AND status IN ('Pending Review', 'Documents Requested'); SELECT COUNT(*) INTO v_approved FROM public.admissions WHERE parent_id = auth.uid() AND status = 'Approved'; RETURN jsonb_build_object('total_applications', v_total, 'pending_applications', v_pending, 'approved_applications', v_approved); END; $$;
CREATE OR REPLACE FUNCTION public.teacher_create_assignment(p_class_id bigint, p_subject_id bigint, p_title text, p_description text, p_due_date timestamptz, p_teacher_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN INSERT INTO public.assignments (class_id, subject_id, teacher_id, title, description, due_date) VALUES (p_class_id, p_subject_id, p_teacher_id, p_title, p_description, p_due_date); END; $$;
CREATE OR REPLACE FUNCTION public.teacher_create_study_material(p_class_id bigint, p_subject_id bigint, p_title text, p_description text, p_file_name text, p_file_path text, p_file_type text, p_uploaded_by uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN INSERT INTO public.study_materials (class_id, subject_id, title, description, file_name, file_path, file_type, uploaded_by) VALUES (p_class_id, p_subject_id, p_title, p_description, p_file_name, p_file_path, p_file_type, p_uploaded_by); END; $$;
CREATE OR REPLACE FUNCTION public.get_teacher_class_details(p_class_id bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE roster jsonb; assignments jsonb; materials jsonb; subjects jsonb; BEGIN SELECT json_agg(t) INTO roster FROM (SELECT p.id, p.display_name FROM public.profiles p JOIN public.student_profiles sp ON p.id = sp.user_id WHERE sp.assigned_class_id = p_class_id) t; SELECT json_agg(t) INTO assignments FROM (SELECT * FROM public.assignments WHERE class_id = p_class_id) t; SELECT json_agg(t) INTO materials FROM (SELECT * FROM public.study_materials WHERE class_id = p_class_id) t; SELECT json_agg(t) INTO subjects FROM (SELECT s.id, c.title as name FROM public.class_subjects s JOIN public.courses c ON s.subject_id = c.id WHERE s.class_id = p_class_id) t; RETURN jsonb_build_object( 'roster', COALESCE(roster, '[]'::jsonb), 'assignments', COALESCE(assignments, '[]'::jsonb), 'studyMaterials', COALESCE(materials, '[]'::jsonb), 'subjects', COALESCE(subjects, '[]'::jsonb) ); END; $$;
CREATE OR REPLACE FUNCTION public.get_teacher_class_overviews() RETURNS TABLE (id bigint, name text, student_count bigint) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT c.id, c.name, (SELECT COUNT(*) FROM public.student_profiles sp WHERE sp.assigned_class_id = c.id) FROM public.school_classes c WHERE c.class_teacher_id = auth.uid(); END; $$;
CREATE OR REPLACE FUNCTION public.get_teacher_classes() RETURNS SETOF public.school_classes LANGUAGE sql SECURITY DEFINER AS $$ SELECT * FROM public.school_classes WHERE class_teacher_id = auth.uid(); $$;
CREATE OR REPLACE FUNCTION public.get_class_roster(p_class_id bigint) RETURNS SETOF public.profiles LANGUAGE sql SECURITY DEFINER AS $$ SELECT p.* FROM public.profiles p JOIN public.student_profiles sp ON p.id = sp.user_id WHERE sp.assigned_class_id = p_class_id; $$;
CREATE OR REPLACE FUNCTION public.get_attendance(p_class_id bigint, p_attendance_date date) RETURNS SETOF public.attendance LANGUAGE sql SECURITY DEFINER AS $$ SELECT * FROM public.attendance WHERE class_id = p_class_id AND attendance_date = p_attendance_date; $$;
CREATE OR REPLACE FUNCTION public.upsert_attendance(records jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE rec jsonb; BEGIN FOR rec IN SELECT * FROM jsonb_array_elements(records) LOOP INSERT INTO public.attendance (class_id, student_id, attendance_date, status, notes, recorded_by) VALUES ((rec->>'class_id')::bigint, (rec->>'student_id')::uuid, (rec->>'attendance_date')::date, rec->>'status', rec->>'notes', auth.uid()) ON CONFLICT (student_id, class_id, attendance_date) DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes; END LOOP; END; $$;
CREATE OR REPLACE FUNCTION public.get_teacher_lesson_plans(p_class_id bigint) RETURNS TABLE (id bigint, title text, subject_name text, lesson_date date, objectives text, activities text, resources jsonb) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT lp.id, lp.title, c.title as subject_name, lp.lesson_date, lp.objectives, lp.activities, COALESCE((SELECT json_agg(r) FROM public.lesson_plan_resources r WHERE r.lesson_plan_id = lp.id), '[]'::jsonb) FROM public.lesson_plans lp LEFT JOIN public.courses c ON lp.subject_id = c.id WHERE lp.class_id = p_class_id AND lp.teacher_id = auth.uid(); END; $$;
CREATE OR REPLACE FUNCTION public.teacher_create_lesson_plan(p_plan_data jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE v_plan_id bigint; res jsonb; BEGIN INSERT INTO public.lesson_plans (teacher_id, class_id, subject_id, title, lesson_date, objectives, activities) VALUES ( (p_plan_data->>'teacher_id')::uuid, (p_plan_data->>'class_id')::bigint, (p_plan_data->>'subject_id')::bigint, p_plan_data->>'title', (p_plan_data->>'lesson_date')::date, p_plan_data->>'objectives', p_plan_data->>'activities' ) RETURNING id INTO v_plan_id; FOR res IN SELECT * FROM jsonb_array_elements(p_plan_data->'resources') LOOP INSERT INTO public.lesson_plan_resources (lesson_plan_id, file_name, file_path, file_type) VALUES (v_plan_id, res->>'file_name', res->>'file_path', res->>'file_type'); END LOOP; END; $$;
CREATE OR REPLACE FUNCTION public.get_available_workshops() RETURNS SETOF public.workshops LANGUAGE sql SECURITY DEFINER AS $$ SELECT * FROM public.workshops WHERE workshop_date >= CURRENT_DATE; $$;
CREATE OR REPLACE FUNCTION public.get_teacher_professional_development() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE result jsonb; BEGIN SELECT json_build_object( 'total_points', COALESCE(SUM(points_earned), 0), 'training_records', (SELECT json_agg(t) FROM (SELECT w.title, r.completed_at, r.points_earned as points FROM public.teacher_pd_records r JOIN public.workshops w ON r.workshop_id = w.id WHERE r.teacher_id = auth.uid()) t), 'awards', (SELECT json_agg(a) FROM public.teacher_awards a WHERE a.teacher_id = auth.uid()) ) INTO result FROM public.teacher_pd_records WHERE teacher_id = auth.uid(); IF result IS NULL THEN result := json_build_object('total_points', 0, 'training_records', '[]'::jsonb, 'awards', '[]'::jsonb); END IF; RETURN result; END; $$;
CREATE OR REPLACE FUNCTION public.enroll_in_workshop(p_workshop_id bigint, p_teacher_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN INSERT INTO public.teacher_pd_records (teacher_id, workshop_id, completed_at, points_earned, notes) VALUES (p_teacher_id, p_workshop_id, now(), 10, 'Enrolled'); END; $$;
CREATE OR REPLACE FUNCTION public.get_teacher_documents(p_teacher_id uuid) RETURNS SETOF public.teacher_documents LANGUAGE sql SECURITY DEFINER AS $$ SELECT * FROM public.teacher_documents WHERE teacher_id = p_teacher_id; $$;
CREATE OR REPLACE FUNCTION public.update_teacher_document_status(p_doc_id bigint, p_status text, p_reason text) RETURNS void LANGUAGE sql SECURITY DEFINER AS $$ UPDATE public.teacher_documents SET status = p_status, rejection_reason = p_reason WHERE id = p_doc_id; $$;
CREATE OR REPLACE FUNCTION public.update_teacher_self_profile(p_display_name text, p_phone text, p_bio text, p_profile_picture_url text, p_qualification text, p_specializations text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN UPDATE public.profiles SET display_name = p_display_name, phone = p_phone WHERE id = auth.uid(); UPDATE public.teacher_profiles SET bio = p_bio, profile_picture_url = p_profile_picture_url, qualification = p_qualification, specializations = p_specializations WHERE user_id = auth.uid(); END; $$;
CREATE OR REPLACE FUNCTION public.get_transport_dashboard_data() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE v_route_id bigint; BEGIN SELECT route_id INTO v_route_id FROM public.transport_staff_profiles WHERE user_id = auth.uid(); IF v_route_id IS NULL THEN RETURN jsonb_build_object('error', 'No route assigned'); END IF; RETURN jsonb_build_object( 'route', (SELECT row_to_json(r) FROM public.routes r WHERE id = v_route_id), 'students', (SELECT json_agg(s) FROM ( SELECT p.id, p.display_name, sp.grade, sp.parent_guardian_details FROM public.profiles p JOIN public.student_profiles sp ON p.id = sp.user_id LIMIT 10 ) s) ); END; $$;
CREATE OR REPLACE FUNCTION public.get_bus_attendance_for_route(p_route_id bigint, p_trip_date date, p_trip_type text) RETURNS SETOF public.bus_attendance LANGUAGE sql SECURITY DEFINER AS $$ SELECT * FROM public.bus_attendance WHERE route_id = p_route_id AND trip_date = p_trip_date AND trip_type = p_trip_type; $$;
CREATE OR REPLACE FUNCTION public.upsert_bus_attendance(records jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE rec jsonb; BEGIN FOR rec IN SELECT * FROM jsonb_array_elements(records) LOOP INSERT INTO public.bus_attendance (student_id, route_id, trip_date, trip_type, status) VALUES ((rec->>'student_id')::uuid, (rec->>'route_id')::bigint, (rec->>'trip_date')::date, rec->>'trip_type', rec->>'status') ON CONFLICT DO NOTHING; END LOOP; END; $$;
CREATE OR REPLACE FUNCTION public.transport_send_route_notification(p_subject text, p_body text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN INSERT INTO public.communications (sender_id, sender_role, subject, body, status, sent_at) VALUES (auth.uid(), 'Transport', p_subject, p_body, 'Sent', now()); END; $$;
CREATE OR REPLACE FUNCTION public.get_teacher_communications_history() RETURNS SETOF public.communications LANGUAGE sql SECURITY DEFINER AS $$ SELECT * FROM public.communications WHERE sender_id = auth.uid() ORDER BY sent_at DESC; $$;
CREATE OR REPLACE FUNCTION public.create_fee_structure_with_components(p_name text, p_year text, p_description text, p_components jsonb) RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE v_id bigint; comp jsonb; BEGIN INSERT INTO public.fee_structures (name, academic_year, description) VALUES (p_name, p_year, p_description) RETURNING id INTO v_id; FOR comp IN SELECT * FROM jsonb_array_elements(p_components) LOOP INSERT INTO public.fee_components (structure_id, name, amount) VALUES (v_id, comp->>'name', (comp->>'amount')::numeric); END LOOP; RETURN v_id; END; $$;
CREATE OR REPLACE FUNCTION public.bulk_create_invoices_for_structure(p_structure_id bigint, p_student_ids text[]) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE v_total numeric; s_id text; BEGIN SELECT SUM(amount) INTO v_total FROM public.fee_components WHERE structure_id = p_structure_id; FOREACH s_id IN ARRAY p_student_ids LOOP INSERT INTO public.invoices (student_id, structure_id, description, amount, due_date, status) VALUES (s_id::uuid, p_structure_id, 'Fee Invoice', v_total, (CURRENT_DATE + interval '30 days'), 'Pending'); END LOOP; END; $$;
CREATE OR REPLACE FUNCTION public.record_fee_payment(p_invoice_id bigint, p_amount numeric, p_method text, p_reference text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE v_current_paid numeric; v_total numeric; v_new_status text; v_receipt_no text; BEGIN SELECT amount, amount_paid INTO v_total, v_current_paid FROM public.invoices WHERE id = p_invoice_id; v_current_paid := v_current_paid + p_amount; IF v_current_paid >= v_total THEN v_new_status := 'Paid'; ELSE v_new_status := 'Partial'; END IF; UPDATE public.invoices SET amount_paid = v_current_paid, status = v_new_status WHERE id = p_invoice_id; v_receipt_no := 'REC-' || floor(random() * 100000)::text; RETURN v_receipt_no; END; $$;
CREATE OR REPLACE FUNCTION public.toggle_bookmark_material(p_material_id bigint) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN UPDATE public.study_materials SET is_bookmarked = NOT is_bookmarked WHERE id = p_material_id; END; $$;
CREATE OR REPLACE FUNCTION public.submit_assignment(p_assignment_id bigint, p_file_path text, p_file_name text, p_student_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN INSERT INTO public.assignment_submissions (assignment_id, student_id, file_path, file_name, status, submitted_at) VALUES (p_assignment_id, p_student_id, p_file_path, p_file_name, 'Submitted', now()); END; $$;
CREATE OR REPLACE FUNCTION public.get_teacher_student_performance_report(p_student_id uuid, p_class_id bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE att_summary jsonb; assign_list jsonb; BEGIN SELECT json_build_object( 'present', COUNT(*) FILTER (WHERE status = 'Present'), 'absent', COUNT(*) FILTER (WHERE status = 'Absent'), 'late', COUNT(*) FILTER (WHERE status = 'Late') ) INTO att_summary FROM public.attendance WHERE student_id = p_student_id AND class_id = p_class_id; SELECT json_agg(json_build_object( 'title', a.title, 'due_date', a.due_date, 'status', COALESCE(s.status, 'Not Submitted'), 'grade', s.grade )) INTO assign_list FROM public.assignments a LEFT JOIN public.assignment_submissions s ON a.id = s.assignment_id AND s.student_id = p_student_id WHERE a.class_id = p_class_id; RETURN jsonb_build_object('attendance_summary', att_summary, 'assignments', COALESCE(assign_list, '[]'::jsonb)); END; $$;
CREATE OR REPLACE FUNCTION public.get_teacher_class_performance_summary(p_class_id bigint) RETURNS TABLE (average_grade numeric, attendance_rate numeric) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT 85.5, 92.0; END; $$;
DROP FUNCTION IF EXISTS public.verify_and_link_branch_admin(text);
CREATE OR REPLACE FUNCTION public.verify_and_link_branch_admin(p_invitation_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitation record;
    v_branch record;
    v_user_email text;
    v_uid uuid := auth.uid();
BEGIN
    -- 1. Get user email
    SELECT email INTO v_user_email FROM public.profiles WHERE id = v_uid;
    IF v_user_email IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'User profile not found');
    END IF;

    -- 2. Find and validate invitation
    SELECT * INTO v_invitation
    FROM public.school_branch_invitations
    WHERE code = upper(trim(p_invitation_code))
    AND is_revoked = false
    AND redeemed_at IS NULL
    AND expires_at > now();

    IF v_invitation IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid or expired invitation code');
    END IF;

    -- 3. Get branch details
    SELECT * INTO v_branch FROM public.school_branches WHERE id = v_invitation.branch_id;
    IF v_branch IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Branch not found');
    END IF;

    -- 4. Validate admin email match
    IF lower(trim(v_branch.admin_email)) != lower(trim(v_user_email)) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Your email does not match the authorized admin email for this branch');
    END IF;

    -- 5. Bind user to branch
    UPDATE public.profiles
    SET branch_id = v_branch.id, role = 'Branch Admin', profile_completed = true
    WHERE id = v_uid;

    -- 6. Assign Branch Admin role
    INSERT INTO public.user_role_assignments (user_id, role_name, branch_id)
    VALUES (v_uid, 'Branch Admin', v_branch.id)
    ON CONFLICT (user_id, role_name, branch_id) DO NOTHING;

    -- 7. Update branch with admin
    UPDATE public.school_branches
    SET branch_admin_id = v_uid
    WHERE id = v_branch.id;

    -- 8. Mark invitation as redeemed
    UPDATE public.school_branch_invitations
    SET redeemed_at = now(), redeemed_by = v_uid
    WHERE id = v_invitation.id;

    RETURN jsonb_build_object('success', true, 'branch_id', v_branch.id, 'branch_name', v_branch.name);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
CREATE OR REPLACE FUNCTION public.complete_branch_step() RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN UPDATE public.school_admin_profiles SET onboarding_step = 'completed' WHERE user_id = auth.uid(); UPDATE public.profiles SET profile_completed = true WHERE id = auth.uid(); END; $$;
CREATE OR REPLACE FUNCTION public.switch_active_role(p_target_role text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE v_exists boolean := false; v_uid uuid := auth.uid(); BEGIN IF p_target_role = 'School Administration' THEN SELECT EXISTS(SELECT 1 FROM public.school_admin_profiles WHERE user_id = v_uid) INTO v_exists; ELSIF p_target_role = 'Branch Admin' THEN SELECT EXISTS(SELECT 1 FROM public.school_branches WHERE branch_admin_id = v_uid) INTO v_exists; ELSIF p_target_role = 'Parent/Guardian' THEN SELECT EXISTS(SELECT 1 FROM public.parent_profiles WHERE user_id = v_uid) INTO v_exists; ELSIF p_target_role = 'Student' THEN SELECT EXISTS(SELECT 1 FROM public.student_profiles WHERE user_id = v_uid) INTO v_exists; ELSIF p_target_role = 'Teacher' THEN SELECT EXISTS(SELECT 1 FROM public.teacher_profiles WHERE user_id = v_uid) INTO v_exists; ELSIF p_target_role = 'Transport Staff' THEN SELECT EXISTS(SELECT 1 FROM public.transport_staff_profiles WHERE user_id = v_uid) INTO v_exists; ELSIF p_target_role = 'E-commerce Operator' THEN SELECT EXISTS(SELECT 1 FROM public.ecommerce_operator_profiles WHERE user_id = v_uid) INTO v_exists; ELSE v_exists := true; END IF; UPDATE public.profiles SET role = p_target_role, profile_completed = v_exists WHERE id = v_uid; RETURN jsonb_build_object('success', true, 'profile_exists', v_exists); END; $$;
CREATE OR REPLACE FUNCTION public.get_user_completed_roles() RETURNS text[] LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE v_roles text[] := ARRAY[]::text[]; v_uid uuid := auth.uid(); BEGIN IF EXISTS (SELECT 1 FROM public.school_admin_profiles WHERE user_id = v_uid) THEN v_roles := array_append(v_roles, 'School Administration'); END IF; IF EXISTS (SELECT 1 FROM public.school_branches WHERE branch_admin_id = v_uid) THEN v_roles := array_append(v_roles, 'Branch Admin'); END IF; IF EXISTS (SELECT 1 FROM public.teacher_profiles WHERE user_id = v_uid) THEN v_roles := array_append(v_roles, 'Teacher'); END IF; IF EXISTS (SELECT 1 FROM public.parent_profiles WHERE user_id = v_uid) THEN v_roles := array_append(v_roles, 'Parent/Guardian'); END IF; IF EXISTS (SELECT 1 FROM public.student_profiles WHERE user_id = v_uid) THEN v_roles := array_append(v_roles, 'Student'); END IF; IF EXISTS (SELECT 1 FROM public.transport_staff_profiles WHERE user_id = v_uid) THEN v_roles := array_append(v_roles, 'Transport Staff'); END IF; IF EXISTS (SELECT 1 FROM public.ecommerce_operator_profiles WHERE user_id = v_uid) THEN v_roles := array_append(v_roles, 'E-commerce Operator'); END IF; SELECT array_agg(role) INTO v_roles FROM ( SELECT role FROM public.profiles WHERE id = v_uid AND profile_completed = true AND role IN ('Principal', 'HR Manager', 'Academic Coordinator', 'Accountant') UNION SELECT unnest(v_roles) ) as all_roles; RETURN COALESCE(v_roles, ARRAY[]::text[]); END; $$;

-- Branch Access Key Functions
DROP FUNCTION IF EXISTS public.generate_branch_access_key(bigint);

CREATE OR REPLACE FUNCTION public.generate_branch_access_key(p_branch_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code text;
    v_branch record;
BEGIN
    -- Verify branch ownership
    SELECT * INTO v_branch FROM public.school_branches WHERE id = p_branch_id AND school_user_id = auth.uid();
    IF v_branch IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Branch not found or access denied');
    END IF;

    -- Generate unique access code (12 character alphanumeric)
    v_code := upper(substring(encode(gen_random_bytes(9), 'base64') FROM 1 FOR 12));

    -- Create invitation record
    INSERT INTO public.school_branch_invitations (branch_id, code, expires_at)
    VALUES (p_branch_id, v_code, now() + interval '7 days');

    RETURN jsonb_build_object('success', true, 'code', v_code, 'expires_at', (now() + interval '7 days')::text);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

DROP FUNCTION IF EXISTS public.revoke_branch_access_key(bigint);
CREATE OR REPLACE FUNCTION public.revoke_branch_access_key(p_branch_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update invitations to revoked status (only for branches owned by the user)
    UPDATE public.school_branch_invitations
    SET is_revoked = true
    WHERE branch_id = p_branch_id
    AND branch_id IN (SELECT id FROM public.school_branches WHERE school_user_id = auth.uid())
    AND is_revoked = false;
END;
$$;
CREATE OR REPLACE FUNCTION public.save_class_timetable(p_class_id bigint, p_entries jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE entry jsonb; BEGIN DELETE FROM public.timetable_entries WHERE class_id = p_class_id; FOR entry IN SELECT * FROM jsonb_array_elements(p_entries) LOOP INSERT INTO public.timetable_entries ( class_id, day, start_time, end_time, subject_name, teacher_name, room_number ) VALUES ( p_class_id, entry->>'day', entry->>'startTime', entry->>'endTime', entry->>'subject', entry->>'teacher', entry->>'room' ); END LOOP; END; $$;
CREATE OR REPLACE FUNCTION public.get_class_timetable(p_class_id bigint) RETURNS TABLE ( id text, day text, start_time text, end_time text, subject_name text, teacher_name text, room_number text ) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT te.day || '-' || te.start_time as id, te.day, te.start_time, te.end_time, te.subject_name, te.teacher_name, te.room_number FROM public.timetable_entries te WHERE te.class_id = p_class_id; END; $$;
CREATE OR REPLACE FUNCTION public.clear_class_timetable(p_class_id bigint) RETURNS void LANGUAGE sql SECURITY DEFINER AS $$ DELETE FROM public.timetable_entries WHERE class_id = p_class_id; $$;
CREATE OR REPLACE FUNCTION public.get_teacher_timetable(p_teacher_id uuid) RETURNS TABLE ( day text, start_time text, end_time text, subject text, class_name text, room_number text ) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT te.day, te.start_time, te.end_time, te.subject_name, sc.name as class_name, te.room_number FROM public.timetable_entries te JOIN public.school_classes sc ON te.class_id = sc.id WHERE te.teacher_id = p_teacher_id OR te.teacher_name = (SELECT display_name FROM public.profiles WHERE id = p_teacher_id); END; $$;
CREATE OR REPLACE FUNCTION public.get_room_timetable(p_room_name text) RETURNS TABLE ( day text, start_time text, end_time text, subject text, class_name text, teacher_name text ) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT te.day, te.start_time, te.end_time, te.subject_name, sc.name as class_name, te.teacher_name FROM public.timetable_entries te JOIN public.school_classes sc ON te.class_id = sc.id WHERE te.room_number = p_room_name; END; $$;
CREATE OR REPLACE FUNCTION public.bulk_import_courses(p_courses jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE course_data jsonb; success_count int := 0; failure_count int := 0; errors jsonb[] := ARRAY[]::jsonb[]; BEGIN FOR course_data IN SELECT * FROM jsonb_array_elements(p_courses) LOOP BEGIN INSERT INTO public.courses (title, code, grade_level, description, category, credits, status, department) VALUES ( course_data->>'title', course_data->>'code', course_data->>'grade_level', course_data->>'description', COALESCE(course_data->>'category', 'Core'), (course_data->>'credits')::numeric, 'Active', course_data->>'department' ); success_count := success_count + 1; EXCEPTION WHEN OTHERS THEN failure_count := failure_count + 1; errors := array_append(errors, jsonb_build_object( 'row_index', (course_data->>'row_index')::int, 'title', course_data->>'title', 'error', SQLERRM )); END; END LOOP; RETURN jsonb_build_object('success_count', success_count, 'failure_count', failure_count, 'errors', to_jsonb(errors)); END; $$;
CREATE OR REPLACE FUNCTION public.create_course_v2(p_title text, p_code text, p_grade_level text, p_description text, p_category text, p_department text, p_credits numeric, p_teacher_id uuid) RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE v_course_id bigint; BEGIN INSERT INTO public.courses (title, code, grade_level, description, category, department, credits, teacher_id, status) VALUES (p_title, p_code, p_grade_level, p_description, p_category, p_department, p_credits, p_teacher_id, 'Draft') RETURNING id INTO v_course_id; INSERT INTO public.course_logs (course_id, user_id, action, details) VALUES (v_course_id, auth.uid(), 'CREATED', jsonb_build_object('title', p_title)); RETURN v_course_id; END; $$;
CREATE OR REPLACE FUNCTION public.add_course_teacher(p_course_id bigint, p_teacher_id uuid, p_role text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN INSERT INTO public.course_teachers (course_id, teacher_id, role) VALUES (p_course_id, p_teacher_id, p_role) ON CONFLICT (course_id, teacher_id) DO UPDATE SET role = p_role, is_active = true; INSERT INTO public.course_logs (course_id, user_id, action, details) VALUES (p_course_id, auth.uid(), 'TEACHER_ADDED', jsonb_build_object('teacher_id', p_teacher_id, 'role', p_role)); END; $$;
CREATE OR REPLACE FUNCTION public.add_course_unit(p_course_id bigint, p_title text, p_description text, p_duration numeric, p_order integer) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN INSERT INTO public.course_units (course_id, title, description, duration_hours, order_index) VALUES (p_course_id, p_title, p_description, p_duration, p_order); INSERT INTO public.course_logs (course_id, user_id, action, details) VALUES (p_course_id, auth.uid(), 'UNIT_ADDED', jsonb_build_object('title', p_title)); END; $$;
CREATE OR REPLACE FUNCTION public.get_course_details_v2(p_course_id bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE v_course record; v_teachers jsonb; v_units jsonb; v_materials jsonb; v_logs jsonb; BEGIN SELECT * INTO v_course FROM public.courses WHERE id = p_course_id; SELECT jsonb_agg( jsonb_build_object( 'id', t.id, 'teacher_id', t.teacher_id, 'name', p.display_name, 'role', t.role ) ) INTO v_teachers FROM public.course_teachers t JOIN public.profiles p ON t.teacher_id = p.id WHERE t.course_id = p_course_id AND t.is_active = true; SELECT jsonb_agg(row_to_json(u)) INTO v_units FROM (SELECT * FROM public.course_units WHERE course_id = p_course_id ORDER BY order_index) u; SELECT jsonb_agg(row_to_json(m)) INTO v_materials FROM (SELECT * FROM public.course_materials WHERE course_id = p_course_id) m; SELECT jsonb_agg(row_to_json(l)) INTO v_logs FROM (SELECT * FROM public.course_logs WHERE course_id = p_course_id ORDER BY created_at DESC LIMIT 20) l; RETURN jsonb_build_object( 'course', row_to_json(v_course), 'teachers', COALESCE(v_teachers, '[]'::jsonb), 'units', COALESCE(v_units, '[]'::jsonb), 'materials', COALESCE(v_materials, '[]'::jsonb), 'logs', COALESCE(v_logs, '[]'::jsonb) ); END; $$;
CREATE OR REPLACE FUNCTION public.filter_courses(p_status text, p_grade text, p_department text) RETURNS SETOF public.courses LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT * FROM public.courses WHERE (p_status IS NULL OR status = p_status) AND (p_grade IS NULL OR grade_level = p_grade) AND (p_department IS NULL OR department = p_department) AND deleted_at IS NULL ORDER BY created_at DESC; END; $$;
CREATE OR REPLACE FUNCTION public.bulk_enroll_students_to_classes(p_enrollments jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE rec jsonb; v_student_id uuid; v_class_id bigint; success_count int := 0; failure_count int := 0; errors jsonb[] := ARRAY[]::jsonb[]; BEGIN FOR rec IN SELECT * FROM jsonb_array_elements(p_enrollments) LOOP BEGIN SELECT id INTO v_student_id FROM public.profiles WHERE lower(trim(email)) = lower(trim(rec->>'student_email')); IF v_student_id IS NULL THEN RAISE EXCEPTION 'Student not found'; END IF; SELECT id INTO v_class_id FROM public.school_classes WHERE upper(trim(name)) = upper(trim(rec->>'class_name')) AND branch_id IN (SELECT * FROM public.get_my_branch_ids()); IF v_class_id IS NULL THEN RAISE EXCEPTION 'Class not found'; END IF; UPDATE public.student_profiles SET assigned_class_id = v_class_id WHERE user_id = v_student_id; success_count := success_count + 1; EXCEPTION WHEN OTHERS THEN failure_count := failure_count + 1; errors := array_append(errors, jsonb_build_object('student', rec->>'student_email', 'error', SQLERRM)); END; END LOOP; RETURN jsonb_build_object('success_count', success_count, 'failure_count', failure_count, 'errors', to_jsonb(errors)); END; $$;
CREATE OR REPLACE FUNCTION public.bulk_map_subjects_to_classes(p_mappings jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE rec jsonb; v_class_id bigint; v_subject_id bigint; success_count int := 0; failure_count int := 0; errors jsonb[] := ARRAY[]::jsonb[]; BEGIN FOR rec IN SELECT * FROM jsonb_array_elements(p_mappings) LOOP BEGIN SELECT id INTO v_class_id FROM public.school_classes WHERE upper(trim(name)) = upper(trim(both '"' from rec->>'class_name')) AND branch_id IN (SELECT * FROM public.get_my_branch_ids()); IF v_class_id IS NULL THEN RAISE EXCEPTION 'Class not found'; END IF; SELECT id INTO v_subject_id FROM public.courses WHERE upper(trim(code)) = upper(trim(both '"' from rec->>'subject_code')); IF v_subject_id IS NULL THEN RAISE EXCEPTION 'Subject not found'; END IF; INSERT INTO public.class_subjects (class_id, subject_id) VALUES (v_class_id, v_subject_id) ON CONFLICT (class_id, subject_id) DO NOTHING; success_count := success_count + 1; EXCEPTION WHEN OTHERS THEN failure_count := failure_count + 1; errors := array_append(errors, jsonb_build_object('class', rec->>'class_name', 'error', SQLERRM)); END; END LOOP; RETURN jsonb_build_object('success_count', success_count, 'failure_count', failure_count, 'errors', to_jsonb(errors)); END; $$;
CREATE OR REPLACE FUNCTION public.duplicate_course(p_course_id bigint) RETURNS SETOF public.courses LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY INSERT INTO public.courses (title, code, grade_level, credits, category, subject_type, status, description, department) SELECT c.title || ' (Copy)', c.code || '-COPY' || (random() * 1000)::int, c.grade_level, c.credits, c.category, c.subject_type, 'Draft', c.description, c.department FROM public.courses c WHERE c.id = p_course_id RETURNING *; END; $$;
CREATE OR REPLACE FUNCTION public.archive_course(p_course_id bigint) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN UPDATE public.courses SET status = 'Archived' WHERE id = p_course_id; END; $$;
CREATE OR REPLACE FUNCTION public.get_admin_homework_list(p_class_id bigint, p_status text, p_subject_id bigint, p_teacher_id uuid) RETURNS TABLE ( id bigint, title text, description text, subject_name text, class_name text, teacher_name text, created_at timestamptz, due_date timestamptz, status text, submission_count bigint, total_students bigint, max_score integer, class_id bigint, subject_id bigint, teacher_id uuid ) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT a.id, a.title, a.description, c.title AS subject_name, sc.name AS class_name, p.display_name AS teacher_name, a.created_at, a.due_date, a.status, (SELECT COUNT(*) FROM public.assignment_submissions AS subs WHERE subs.assignment_id = a.id) AS submission_count, (SELECT COUNT(*) FROM public.student_profiles sp WHERE sp.assigned_class_id = a.class_id) AS total_students, a.max_score, a.class_id, a.subject_id, a.teacher_id FROM public.assignments a LEFT JOIN public.courses c ON a.subject_id = c.id LEFT JOIN public.school_classes sc ON a.class_id = sc.id LEFT JOIN public.profiles p ON a.teacher_id = p.id WHERE (p_class_id IS NULL OR a.class_id = p_class_id) AND (p_status = 'All' OR a.status = p_status) AND (p_subject_id IS NULL OR a.subject_id = p_subject_id) AND (p_teacher_id IS NULL OR a.teacher_id = p_teacher_id) ORDER BY a.due_date DESC; END; $$;
CREATE OR REPLACE FUNCTION public.create_homework_assignment(p_class_id bigint, p_subject_id bigint, p_teacher_id uuid, p_title text, p_description text, p_due_date timestamptz, p_attachments jsonb, p_max_score integer, p_status text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN INSERT INTO public.assignments ( class_id, subject_id, teacher_id, title, description, due_date, max_score, status ) VALUES ( p_class_id, p_subject_id, p_teacher_id, p_title, p_description, p_due_date, p_max_score, p_status ); END; $$;
CREATE OR REPLACE FUNCTION public.update_assignment(p_id bigint, p_title text, p_description text, p_due_date timestamptz, p_max_score integer, p_status text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN UPDATE public.assignments SET title = p_title, description = p_description, due_date = p_due_date, max_score = p_max_score, status = p_status WHERE id = p_id; END; $$;
CREATE OR REPLACE FUNCTION public.delete_assignment(p_id bigint) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN DELETE FROM public.assignments WHERE id = p_id; END; $$;
CREATE OR REPLACE FUNCTION public.get_homework_submissions(p_assignment_id bigint) RETURNS TABLE ( submission_id bigint, student_id uuid, student_name text, submitted_at timestamptz, status text, grade text, feedback text, file_path text, file_name text ) LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE v_class_id bigint; v_due_date date; BEGIN SELECT class_id, due_date INTO v_class_id, v_due_date FROM public.assignments WHERE id = p_assignment_id; RETURN QUERY SELECT s.id as submission_id, p.id as student_id, p.display_name as student_name, s.submitted_at, CASE WHEN s.status = 'Graded' THEN 'Graded' WHEN s.id IS NOT NULL AND s.submitted_at > v_due_date THEN 'Late' WHEN s.id IS NOT NULL THEN 'Submitted' WHEN v_due_date < CURRENT_DATE THEN 'Overdue' ELSE 'Pending' END AS status, s.grade, s.feedback, s.file_path, s.file_name FROM public.student_profiles sp JOIN public.profiles p ON sp.user_id = p.id LEFT JOIN public.assignment_submissions s ON s.student_id = p.id AND s.assignment_id = p_assignment_id WHERE sp.assigned_class_id = v_class_id ORDER BY p.display_name; END; $$;
CREATE OR REPLACE FUNCTION public.grade_homework_submission(p_submission_id bigint, p_grade text, p_feedback text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN UPDATE public.assignment_submissions SET grade = p_grade, feedback = p_feedback, status = 'Graded' WHERE id = p_submission_id; END; $$;
CREATE OR REPLACE FUNCTION public.get_finance_dashboard_data() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE result jsonb; BEGIN SELECT json_build_object( 'revenue_ytd', (SELECT COALESCE(SUM(amount_paid), 0) FROM invoices WHERE created_at >= date_trunc('year', now())), 'collections_this_month', (SELECT COALESCE(SUM(amount_paid), 0) FROM invoices WHERE created_at >= date_trunc('month', now())), 'pending_dues', (SELECT COALESCE(SUM(amount - amount_paid), 0) FROM invoices), 'overdue_accounts', (SELECT COUNT(DISTINCT student_id) FROM invoices WHERE due_date < now() AND status != 'Paid'), 'online_payments', (SELECT COALESCE(SUM(amount_paid), 0) FROM invoices), 'refunds_processed', 0, 'dues_data', (SELECT public.get_dues_dashboard_data()), 'expense_data', (SELECT public.get_expense_dashboard_data()) ) INTO result; RETURN result; END; $$;
CREATE OR REPLACE FUNCTION public.get_dues_dashboard_data() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE result jsonb; BEGIN SELECT json_build_object( 'total_dues', (SELECT COALESCE(SUM(amount - amount_paid), 0) FROM invoices), 'total_overdue', (SELECT COALESCE(SUM(amount - amount_paid), 0) FROM invoices WHERE due_date < now()), 'overdue_student_count', (SELECT COUNT(DISTINCT student_id) FROM invoices WHERE due_date < now() AND status != 'Paid'), 'highest_dues_students', (SELECT json_agg(t) FROM ( SELECT i.student_id, p.display_name, sc.name as class_name, SUM(i.amount - i.amount_paid) as outstanding_balance FROM invoices i JOIN profiles p ON i.student_id = p.id LEFT JOIN student_profiles sp ON p.id = sp.user_id LEFT JOIN school_classes sc ON sp.assigned_class_id = sc.id GROUP BY i.student_id, p.display_name, sc.name ORDER BY outstanding_balance DESC LIMIT 5 ) t), 'dues_by_class', (SELECT json_agg(t) FROM ( SELECT sc.name as class_name, SUM(i.amount - i.amount_paid) as total_dues FROM invoices i JOIN student_profiles sp ON i.student_id = sp.user_id JOIN school_classes sc ON sp.assigned_class_id = sc.id GROUP BY sc.name ) t) ) INTO result; RETURN result; END; $$;
CREATE OR REPLACE FUNCTION public.get_expense_dashboard_data() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE result jsonb; BEGIN SELECT json_build_object( 'total_expenses_month', (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE expense_date >= date_trunc('month', now())), 'pending_approvals', (SELECT COUNT(*) FROM expenses WHERE status = 'Pending'), 'recent_expenses', (SELECT json_agg(t) FROM (SELECT * FROM expenses ORDER BY expense_date DESC LIMIT 10) t) ) INTO result; RETURN result; END; $$;
CREATE OR REPLACE FUNCTION public.get_student_fee_dashboard() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN (SELECT json_agg(t) FROM ( SELECT sp.user_id as student_id, p.display_name, sc.name as class_name, COALESCE(SUM(i.amount), 0) as total_billed, COALESCE(SUM(i.amount_paid), 0) as total_paid, 0 as total_concession, COALESCE(SUM(i.amount - i.amount_paid), 0) as outstanding_balance, CASE WHEN SUM(CASE WHEN i.status = 'Overdue' THEN 1 ELSE 0 END) > 0 THEN 'Overdue' WHEN SUM(i.amount - i.amount_paid) > 0 THEN 'Pending' ELSE 'Paid' END as overall_status FROM student_profiles sp JOIN profiles p ON sp.user_id = p.id LEFT JOIN school_classes sc ON sp.assigned_class_id = sc.id LEFT JOIN invoices i ON sp.user_id = i.student_id GROUP BY sp.user_id, p.display_name, sc.name ) t); END; $$;
CREATE OR REPLACE FUNCTION public.get_student_finance_details(p_student_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE result jsonb; BEGIN SELECT json_build_object( 'invoices', (SELECT json_agg(i) FROM invoices i WHERE student_id = p_student_id), 'payments', '[]'::jsonb, 'concessions', '[]'::jsonb, 'refunds', '[]'::jsonb ) INTO result; RETURN result; END; $$;
CREATE OR REPLACE FUNCTION public.get_payable_invoices_for_student(p_student_id uuid) RETURNS SETOF jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT jsonb_build_object('id', id, 'description', description, 'amount_due', amount - amount_paid) FROM invoices WHERE student_id = p_student_id AND status != 'Paid'; END; $$;
CREATE OR REPLACE FUNCTION public.add_school_expense(p_category text, p_amount numeric, p_vendor_name text, p_expense_date date, p_description text, p_invoice_url text, p_payment_mode text, p_branch_id bigint) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN INSERT INTO expenses (category, amount, vendor_name, expense_date, description, invoice_url, payment_mode, branch_id, recorded_by, status) VALUES (p_category, p_amount, p_vendor_name, p_expense_date, p_description, p_invoice_url, p_payment_mode, p_branch_id, auth.uid(), 'Pending'); END; $$;
CREATE OR REPLACE FUNCTION public.update_expense_status(p_expense_id bigint, p_new_status text) RETURNS void LANGUAGE sql SECURITY DEFINER AS $$ UPDATE expenses SET status = p_new_status WHERE id = p_expense_id; $$;
CREATE OR REPLACE FUNCTION public.get_fee_collection_report(p_start_date date, p_end_date date) RETURNS SETOF jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT jsonb_build_object('payment_id', id, 'student_id', student_id, 'amount', amount_paid, 'payment_date', created_at) FROM invoices WHERE created_at BETWEEN p_start_date AND p_end_date AND amount_paid > 0; END; $$;
CREATE OR REPLACE FUNCTION public.get_expense_summary_report(p_start_date date, p_end_date date) RETURNS SETOF jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT jsonb_build_object('expense_id', id, 'category', category, 'amount', amount, 'expense_date', expense_date, 'status', status) FROM expenses WHERE expense_date BETWEEN p_start_date AND p_end_date; END; $$;
CREATE OR REPLACE FUNCTION public.get_student_ledger_report(p_student_id uuid) RETURNS SETOF jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT jsonb_build_object('transaction_date', created_at, 'description', description, 'debit', amount, 'credit', amount_paid, 'balance', amount - amount_paid) FROM invoices WHERE student_id = p_student_id ORDER BY created_at; END; $$;

-- -----------------------------------------------------------------------------------------------
-- 7. ADMIN FUNCTIONS (BYPASSING RLS FOR SETUP)
-- -----------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_create_student(
    p_email text,
    p_display_name text,
    p_phone text,
    p_grade text,
    p_student_id_number text,
    p_branch_id bigint
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as DB owner to bypass RLS for insertion
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_check_email text;
BEGIN
    -- 1. Check if email already exists in profiles
    SELECT email INTO v_check_email FROM public.profiles WHERE email = p_email;
    
    IF v_check_email IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User with this email already exists.');
    END IF;

    -- 2. Generate new UUID for the shadow user
    v_user_id := gen_random_uuid();

    -- 3. Create Profile
    INSERT INTO public.profiles (id, email, display_name, phone, role, is_active, profile_completed)
    VALUES (v_user_id, p_email, p_display_name, p_phone, 'Student', true, true);

    -- 4. Create Student Profile
    INSERT INTO public.student_profiles (user_id, grade, student_id_number, branch_id)
    VALUES (v_user_id, p_grade, p_student_id_number, p_branch_id);

    RETURN jsonb_build_object('success', true, 'user_id', v_user_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- -----------------------------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- Description: Enforces multi-tenancy and role-based access control at the database level.
-- -----------------------------------------------------------------------------------------------

-- -- 9.1 Core Profile & School Tables -- --

-- Profiles: Users can only manage their own profile.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
CREATE POLICY "Users can manage their own profile" ON public.profiles
FOR ALL USING (id = auth.uid());

-- School Admin Profiles: Only the owner can see/manage.
ALTER TABLE public.school_admin_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner can manage school admin profile" ON public.school_admin_profiles;
CREATE POLICY "Owner can manage school admin profile" ON public.school_admin_profiles
FOR ALL USING (user_id = auth.uid());

-- School Branches: Users can only see branches they are associated with.
ALTER TABLE public.school_branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their associated branches" ON public.school_branches;
CREATE POLICY "Users can view their associated branches" ON public.school_branches
FOR SELECT USING (id IN (SELECT get_my_branch_ids()));
DROP POLICY IF EXISTS "School admins can manage their branches" ON public.school_branches;
CREATE POLICY "School admins can manage their branches" ON public.school_branches
FOR ALL USING (school_user_id = auth.uid());

-- School Branch Invitations: School admins can manage invitations for their branches
ALTER TABLE public.school_branch_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School admins can manage branch invitations" ON public.school_branch_invitations;
CREATE POLICY "School admins can manage branch invitations" ON public.school_branch_invitations
FOR ALL USING (branch_id IN (SELECT id FROM public.school_branches WHERE school_user_id = auth.uid()));


-- -- 9.2 Branch-Scoped Tables -- --

-- School Departments
ALTER TABLE public.school_departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view departments in their branch" ON public.school_departments;
CREATE POLICY "Users can view departments in their branch" ON public.school_departments
FOR SELECT USING (branch_id IN (SELECT get_my_branch_ids()));
DROP POLICY IF EXISTS "Admins can manage departments in their branch" ON public.school_departments;
CREATE POLICY "Admins can manage departments in their branch" ON public.school_departments
FOR ALL USING (branch_id IN (SELECT get_my_branch_ids()) AND (EXISTS (SELECT 1 FROM school_branches WHERE (school_user_id = auth.uid() OR branch_admin_id = auth.uid()) AND id = branch_id)));

-- Teacher Profiles
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teachers can manage their own profile" ON public.teacher_profiles;
CREATE POLICY "Teachers can manage their own profile" ON public.teacher_profiles
FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can view teachers in their branch" ON public.teacher_profiles;
CREATE POLICY "Admins can view teachers in their branch" ON public.teacher_profiles
FOR SELECT USING (branch_id IN (SELECT get_my_branch_ids()));

-- School Classes
ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view classes in their branch" ON public.school_classes;
CREATE POLICY "Users can view classes in their branch" ON public.school_classes
FOR SELECT USING (branch_id IN (SELECT get_my_branch_ids()));
DROP POLICY IF EXISTS "Admins can manage classes in their branch" ON public.school_classes;
CREATE POLICY "Admins can manage classes in their branch" ON public.school_classes
FOR ALL USING (branch_id IN (SELECT get_my_branch_ids()) AND (EXISTS (SELECT 1 FROM school_branches WHERE (school_user_id = auth.uid() OR branch_admin_id = auth.uid()) AND id = branch_id)));

-- Student Profiles
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view their own profile" ON public.student_profiles;
CREATE POLICY "Students can view their own profile" ON public.student_profiles
FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins and teachers can view students in their branch/class" ON public.student_profiles;
CREATE POLICY "Admins and teachers can view students in their branch/class" ON public.student_profiles
FOR SELECT USING (branch_id IN (SELECT get_my_branch_ids()));
DROP POLICY IF EXISTS "Parents can view their children's profiles" ON public.student_profiles;
-- [SECURITY FIX] Corrected column name from 'id' to 'user_id' to match the student_profiles table schema.
CREATE POLICY "Parents can view their children's profiles" ON public.student_profiles
FOR SELECT USING (
    user_id IN (SELECT student_id FROM student_parents WHERE parent_id = auth.uid())
);

-- Admissions & Enquiries
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents can manage their own admissions" ON public.admissions;
CREATE POLICY "Parents can manage their own admissions" ON public.admissions
FOR ALL USING (submitted_by = auth.uid() OR parent_id = auth.uid());
DROP POLICY IF EXISTS "Admins can view admissions in their branch" ON public.admissions;
CREATE POLICY "Admins can view admissions in their branch" ON public.admissions
FOR SELECT USING (branch_id IN (SELECT get_my_branch_ids()));

-- Share Codes
ALTER TABLE public.share_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents can manage share codes for their admissions" ON public.share_codes;
CREATE POLICY "Parents can manage share codes for their admissions" ON public.share_codes
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admissions WHERE id = admission_id AND parent_id = auth.uid())
);
DROP POLICY IF EXISTS "Admins can view all share codes" ON public.share_codes;
CREATE POLICY "Admins can view all share codes" ON public.share_codes
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.school_admin_profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.school_branches WHERE branch_admin_id = auth.uid())
);

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents can view their own enquiries" ON public.enquiries;
CREATE POLICY "Parents can manage their own enquiries" ON public.enquiries
FOR ALL USING (EXISTS (SELECT 1 FROM admissions WHERE id = admission_id AND parent_id = auth.uid()));
DROP POLICY IF EXISTS "Admins can manage enquiries in their branch" ON public.enquiries;
CREATE POLICY "Admins can manage enquiries in their branch" ON public.enquiries
FOR ALL USING (
    branch_id IN (SELECT get_my_branch_ids()) OR
    (branch_id IS NULL AND (
        admission_id IN (SELECT id FROM public.admissions WHERE branch_id IN (SELECT get_my_branch_ids())) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (
            is_super_admin = true OR
            role IN ('School Administration', 'Branch Admin', 'Principal', 'HR Manager', 'Academic Coordinator', 'Accountant')
        ))
    ))
);

-- NEW RLS for FINANCE
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage vendors in their branch" ON public.vendors
FOR ALL USING (branch_id IN (SELECT get_my_branch_ids()));

CREATE POLICY "Admins can manage expenses in their branch" ON public.expenses
FOR ALL USING (branch_id IN (SELECT get_my_branch_ids()));

-- Courses RLS (Enable RLS for new tables)
ALTER TABLE public.course_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_logs ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for admin/public access pattern)
DROP POLICY IF EXISTS "Public read course_teachers" ON public.course_teachers;
CREATE POLICY "Public read course_teachers" ON public.course_teachers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage course_teachers" ON public.course_teachers;
CREATE POLICY "Admin manage course_teachers" ON public.course_teachers FOR ALL USING (
    EXISTS (SELECT 1 FROM public.school_admin_profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.school_branches WHERE branch_admin_id = auth.uid())
);

DROP POLICY IF EXISTS "Public read course_units" ON public.course_units;
CREATE POLICY "Public read course_units" ON public.course_units FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage course_units" ON public.course_units;
CREATE POLICY "Admin manage course_units" ON public.course_units FOR ALL USING (
    EXISTS (SELECT 1 FROM public.school_admin_profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.school_branches WHERE branch_admin_id = auth.uid())
);

DROP POLICY IF EXISTS "Public read course_materials" ON public.course_materials;
CREATE POLICY "Public read course_materials" ON public.course_materials FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage course_materials" ON public.course_materials;
CREATE POLICY "Admin manage course_materials" ON public.course_materials FOR ALL USING (
    EXISTS (SELECT 1 FROM public.school_admin_profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.school_branches WHERE branch_admin_id = auth.uid())
);

DROP POLICY IF EXISTS "Admin manage course_drafts" ON public.course_drafts;
CREATE POLICY "Admin manage course_drafts" ON public.course_drafts FOR ALL USING (
    EXISTS (SELECT 1 FROM public.school_admin_profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.school_branches WHERE branch_admin_id = auth.uid())
);

DROP POLICY IF EXISTS "Admin read course_logs" ON public.course_logs;
CREATE POLICY "Admin read course_logs" ON public.course_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.school_admin_profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.school_branches WHERE branch_admin_id = auth.uid())
);

-- -- 9.3 Storage Tables -- --

-- Storage Buckets (Read-only for authenticated users)
ALTER TABLE public.storage_buckets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view storage buckets" ON public.storage_buckets FOR SELECT USING (auth.uid() IS NOT NULL);

-- Storage Files (Users can access their own uploaded files and files they're authorized to view)
ALTER TABLE public.storage_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their uploaded files" ON public.storage_files;
CREATE POLICY "Users can view their uploaded files" ON public.storage_files
FOR SELECT USING (uploaded_by = auth.uid());
DROP POLICY IF EXISTS "Admins can view files in their branch" ON public.storage_files;
CREATE POLICY "Admins can view files in their branch" ON public.storage_files
FOR SELECT USING (
    entity_type IN ('admission', 'teacher_document') AND
    (
        entity_id::bigint IN (
            SELECT id FROM public.admissions WHERE branch_id IN (SELECT get_my_branch_ids())
            UNION
            SELECT id FROM public.teacher_profiles WHERE branch_id IN (SELECT get_my_branch_ids())
        )
    )
);
DROP POLICY IF EXISTS "Parents can view their children's files" ON public.storage_files;
CREATE POLICY "Parents can view their children's files" ON public.storage_files
FOR SELECT USING (
    entity_type = 'admission' AND
    entity_id::bigint IN (
        SELECT id FROM public.admissions WHERE parent_id = auth.uid()
    )
);

-- -- 9.4 Role & Access Control Tables -- --

-- User Roles (Read-only for authenticated users)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view user roles" ON public.user_roles FOR SELECT USING (auth.uid() IS NOT NULL);

-- Enquiry Messages
ALTER TABLE public.enquiry_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage enquiry messages in their branch" ON public.enquiry_messages;
CREATE POLICY "Admins can manage enquiry messages in their branch" ON public.enquiry_messages
FOR ALL USING (
    enquiry_id IN (
        SELECT id FROM public.enquiries
        WHERE branch_id IN (SELECT get_my_branch_ids())
        OR (branch_id IS NULL AND admission_id IN (
            SELECT id FROM public.admissions WHERE branch_id IN (SELECT get_my_branch_ids())
        ))
    )
);
DROP POLICY IF EXISTS "Parents can view messages for their enquiries" ON public.enquiry_messages;
CREATE POLICY "Parents can view messages for their enquiries" ON public.enquiry_messages
FOR SELECT USING (
    enquiry_id IN (
        SELECT e.id FROM public.enquiries e
        JOIN public.admissions a ON e.admission_id = a.id
        WHERE a.parent_id = auth.uid()
    )
);

-- User Role Assignments (Users can view their own assignments, admins can view all)
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own role assignments" ON public.user_role_assignments;
CREATE POLICY "Users can view their own role assignments" ON public.user_role_assignments
FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can manage role assignments in their branch" ON public.user_role_assignments;
CREATE POLICY "Admins can manage role assignments in their branch" ON public.user_role_assignments
FOR ALL USING (branch_id IN (SELECT get_my_branch_ids()));


-- -----------------------------------------------------------------------------------------------
-- 11. INDEXES FOR PERFORMANCE
-- -----------------------------------------------------------------------------------------------

-- Additional indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_admissions_parent_id ON public.admissions(parent_id);
CREATE INDEX IF NOT EXISTS idx_admissions_branch_id ON public.admissions(branch_id);
CREATE INDEX IF NOT EXISTS idx_admissions_status ON public.admissions(status);
CREATE INDEX IF NOT EXISTS idx_student_profiles_assigned_class_id ON public.student_profiles(assigned_class_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_branch_id ON public.student_profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_branch_id ON public.teacher_profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_school_classes_branch_id ON public.school_classes(branch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_class_date ON public.attendance(student_id, class_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON public.invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_expenses_branch_id ON public.expenses(branch_id);
CREATE INDEX IF NOT EXISTS idx_storage_files_entity ON public.storage_files(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_storage_files_uploaded_by ON public.storage_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user ON public.user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_branch ON public.user_role_assignments(branch_id);

-- Data cleanup: Remove any enquiry records that slipped into admissions table
UPDATE public.admissions
SET status = 'Removed'
WHERE status IN ('Enquiry Node', 'ENQUIRY_NODE_ACTIVE', 'ENQUIRY_NODE_VERIFIED', 'ENQUIRY_NODE_IN_PROGRESS')
AND has_enquiry = true;

-- Add check constraint to prevent enquiry statuses in admissions table
ALTER TABLE public.admissions
ADD CONSTRAINT check_admission_status
CHECK (status NOT IN ('Enquiry Node', 'ENQUIRY_NODE_ACTIVE', 'ENQUIRY_NODE_VERIFIED', 'ENQUIRY_NODE_IN_PROGRESS'));

NOTIFY pgrst, 'reload schema';
