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
