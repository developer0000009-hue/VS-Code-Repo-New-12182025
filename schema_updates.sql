-- ===============================================================================================
--  ENROLLMENT WORKFLOW FIX - PROTOCOL FAILURE RESOLUTION
--  Version: 1.0.0 (Critical Enrollment Schema Fix)
-- ===============================================================================================

-- Fix 1: Create the missing 'enrollments' table that the RPC function expects
-- This table captures the final enrollment state after admission approval

CREATE TABLE IF NOT EXISTS public.enrollments (
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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_branch_id ON public.enrollments(branch_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_admission_id ON public.enrollments(admission_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(application_status, enrollment_status);

-- Fix 2: Ensure student_enrollments has branch_id for consistency
-- This maintains backward compatibility while adding branch reference
ALTER TABLE public.student_enrollments
ADD COLUMN IF NOT EXISTS branch_id BIGINT REFERENCES public.school_branches(id);

-- Update existing student_enrollments to populate branch_id from class relationship
UPDATE public.student_enrollments
SET branch_id = sc.branch_id
FROM public.school_classes sc
WHERE student_enrollments.class_id = sc.id AND student_enrollments.branch_id IS NULL;

-- Make branch_id NOT NULL after populating existing data
ALTER TABLE public.student_enrollments
ALTER COLUMN branch_id SET NOT NULL;

-- Add index for the new column
CREATE INDEX IF NOT EXISTS idx_student_enrollments_branch_id ON public.student_enrollments(branch_id);

-- Fix 3: Create RPC function for admin_transition_admission if it doesn't exist
-- This function handles the transition from admission to enrollment

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
        -- Get or create student user profile
        v_student_user_id := v_admission_record.student_user_id;

        -- Create enrollment record
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
            'ACTIVE',
            p_admission_id,
            CURRENT_DATE
        )
        RETURNING id INTO v_enrollment_id;

        -- Update student profile to mark as active
        UPDATE public.profiles
        SET role = 'Student',
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_transition_admission(BIGINT, TEXT) TO authenticated;

-- Fix 4: Create RPC function for admin_verify_document if it doesn't exist
CREATE OR REPLACE FUNCTION public.admin_verify_document(
    p_requirement_id BIGINT,
    p_status TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_requirement RECORD;
    v_result JSON;
BEGIN
    -- Validate status
    IF p_status NOT IN ('Accepted', 'Rejected', 'Verified') THEN
        RETURN json_build_object('success', false, 'message', 'Invalid document status');
    END IF;

    -- Get requirement
    SELECT * INTO v_requirement
    FROM public.document_requirements
    WHERE id = p_requirement_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Document requirement not found');
    END IF;

    -- Update document requirement
    UPDATE public.document_requirements
    SET status = p_status,
        rejection_reason = CASE WHEN p_status = 'Rejected' THEN p_reason ELSE rejection_reason END,
        verified_by = auth.uid(),
        verified_at = now()
    WHERE id = p_requirement_id;

    -- Update admission documents if they exist
    UPDATE public.admission_documents
    SET verified_by = auth.uid(),
        verified_at = now()
    WHERE requirement_id = p_requirement_id;

    v_result := json_build_object(
        'success', true,
        'message', 'Document status updated to ' || p_status
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Database error: ' || SQLERRM
        );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_verify_document(BIGINT, TEXT, TEXT) TO authenticated;

-- Fix 5: Create RPC function for admin_request_additional_document if it doesn't exist
CREATE OR REPLACE FUNCTION public.admin_request_additional_document(
    p_admission_id BIGINT,
    p_document_name TEXT,
    p_is_mandatory BOOLEAN DEFAULT true,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_requirement_id BIGINT;
    v_result JSON;
BEGIN
    -- Insert new document requirement
    INSERT INTO public.document_requirements (
        admission_id,
        document_name,
        is_mandatory,
        status,
        notes_for_parent
    )
    VALUES (
        p_admission_id,
        p_document_name,
        p_is_mandatory,
        'Pending',
        p_notes
    )
    RETURNING id INTO v_requirement_id;

    v_result := json_build_object(
        'success', true,
        'message', 'Additional document requested',
        'requirement_id', v_requirement_id
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Database error: ' || SQLERRM
        );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_request_additional_document(BIGINT, TEXT, BOOLEAN, TEXT) TO authenticated;

-- Fix 6: Update get_all_students_for_admin to query enrollments table instead of student_enrollments
-- This fixes the core issue where admitted students don't appear in Student Directory

CREATE OR REPLACE FUNCTION public.get_all_students_for_admin(
    p_branch_id BIGINT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    email TEXT,
    display_name TEXT,
    phone TEXT,
    role TEXT,
    profile_completed BOOLEAN,
    is_active BOOLEAN,
    branch_id BIGINT,
    profile_photo_url TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    pin_code TEXT,
    date_of_birth DATE,
    gender TEXT,
    emergency_contact TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    email_confirmed_at TIMESTAMPTZ,
    student_id_number TEXT,
    grade TEXT,
    parent_guardian_details TEXT,
    assigned_class_id BIGINT,
    assigned_class_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
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
        p.profile_photo_url,
        p.address,
        p.city,
        p.state,
        p.country,
        p.pin_code,
        p.date_of_birth,
        p.gender,
        p.emergency_contact,
        p.created_at,
        p.updated_at,
        p.email_confirmed_at,
        e.student_id_number,
        e.grade,
        e.parent_guardian_details,
        e.class_id as assigned_class_id,
        sc.name as assigned_class_name
    FROM public.profiles p
    LEFT JOIN public.enrollments e ON p.id = e.student_id
    LEFT JOIN public.school_classes sc ON e.class_id = sc.id
    WHERE p.role = 'Student'
        AND (p_branch_id IS NULL OR p.branch_id = p_branch_id)
        AND e.enrollment_status IN ('FINALIZED', 'ACTIVE')
    ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_students_for_admin(BIGINT) TO authenticated;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';

COMMIT;
