-- Fix for enquiry node connection issue
-- This script fixes the get_enquiries_for_node RPC function to use the correct column names

-- Fix the RPC function to use received_at instead of created_at
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
    ORDER BY received_at DESC;
END;
$$;

-- Test the function works
SELECT get_enquiries_for_node(NULL) LIMIT 1;