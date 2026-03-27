-- VetSteady Migration 003: Practice onboarding helper function
-- Run in Supabase SQL Editor after migrations 001 and 002

-- ============================================
-- Function: create_practice_with_admin
-- One-shot onboarding: creates a practice + admin staff member
-- linked to the authenticated Supabase user.
-- ============================================

CREATE OR REPLACE FUNCTION create_practice_with_admin(
  p_practice_name TEXT,
  p_practice_slug TEXT,
  p_timezone TEXT DEFAULT 'America/New_York',
  p_staff_name TEXT DEFAULT NULL,
  p_staff_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_practice_id UUID;
  v_staff_id UUID;
  v_user_id UUID := auth.uid();
  v_email TEXT;
BEGIN
  -- Get user email if not provided
  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  
  -- Create practice
  INSERT INTO practices (name, slug, timezone)
  VALUES (p_practice_name, p_practice_slug, p_timezone)
  RETURNING id INTO v_practice_id;

  -- Create admin staff record linked to auth user
  INSERT INTO staff (practice_id, name, email, role, auth_user_id)
  VALUES (
    v_practice_id,
    COALESCE(p_staff_name, split_part(v_email, '@', 1)),
    COALESCE(p_staff_email, v_email),
    'admin',
    v_user_id
  )
  RETURNING id INTO v_staff_id;

  -- Seed default appointment types
  INSERT INTO appointment_types (practice_id, name, duration_minutes, color) VALUES
    (v_practice_id, 'Wellness Exam',    30, '#10B981'),
    (v_practice_id, 'Vaccination',      15, '#3B82F6'),
    (v_practice_id, 'Dental Cleaning',  60, '#8B5CF6'),
    (v_practice_id, 'Surgery Consult',  45, '#F59E0B'),
    (v_practice_id, 'Emergency',        30, '#EF4444');

  RETURN jsonb_build_object(
    'practice_id', v_practice_id,
    'staff_id', v_staff_id
  );
END;
$$;

-- ============================================
-- Grant execute to authenticated users only
-- ============================================
REVOKE ALL ON FUNCTION create_practice_with_admin FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_practice_with_admin TO authenticated;
