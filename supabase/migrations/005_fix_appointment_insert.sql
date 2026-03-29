-- Migration 005: Fix appointment INSERT — use SECURITY DEFINER function to bypass RLS
-- Run in Supabase SQL Editor

-- Create a function that inserts appointments with elevated privileges
-- This bypasses the circular RLS chain (staff -> practice -> appointments)
CREATE OR REPLACE FUNCTION insert_appointment(
  p_practice_id UUID,
  p_staff_id UUID,
  p_client_id UUID,
  p_pet_id UUID,
  p_appointment_type_id UUID,
  p_starts_at TIMESTAMPTZ,
  p_ends_at TIMESTAMPTZ,
  p_status TEXT DEFAULT 'scheduled',
  p_confirmation_token TEXT DEFAULT gen_random_uuid()::TEXT,
  p_notes TEXT DEFAULT NULL,
  p_deposit_paid BOOLEAN DEFAULT FALSE
) RETURNS appointments AS $$
DECLARE
  v_appointment appointments;
BEGIN
  -- Insert with the practice_id set from the staff record
  -- SECURITY DEFINER means this runs as the function owner (service role), not the calling user
  INSERT INTO appointments (
    practice_id, staff_id, client_id, pet_id, appointment_type_id,
    starts_at, ends_at, status, confirmation_token, notes, deposit_paid
  ) VALUES (
    p_practice_id, p_staff_id, p_client_id, p_pet_id, p_appointment_type_id,
    p_starts_at, p_ends_at, p_status, p_confirmation_token, p_notes, p_deposit_paid
  )
  RETURNING * INTO v_appointment;
  RETURN v_appointment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION insert_appointment TO authenticated;
GRANT EXECUTE ON FUNCTION insert_appointment TO anon;

-- Also make appointment_types readable by authenticated users (needed for the dropdown)
DROP POLICY IF EXISTS "authenticated_read_appointment_types" ON appointment_types;
CREATE POLICY "authenticated_read_appointment_types" ON appointment_types
  FOR SELECT TO authenticated USING (true);

-- Verify we can read appointment_types (needed for the "new appointment" dropdown)
DROP POLICY IF EXISTS "authenticated_read_staff" ON staff;
CREATE POLICY "authenticated_read_staff" ON staff
  FOR SELECT TO authenticated USING (true);
