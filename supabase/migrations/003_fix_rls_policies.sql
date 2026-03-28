-- Migration 003: Fix RLS recursion bug
-- Run this AFTER migrations 001 and 002

-- Step 1: Drop all existing RLS policies and the old helper function
DROP POLICY IF EXISTS "Staff can view own practice" ON practices;
DROP POLICY IF EXISTS "Admins can update own practice" ON practices;
DROP POLICY IF EXISTS "Staff can view same practice staff" ON staff;
DROP POLICY IF EXISTS "Staff can view practice clients" ON clients;
DROP POLICY IF EXISTS "Staff can insert clients" ON clients;
DROP POLICY IF EXISTS "Staff can update clients" ON clients;
DROP POLICY IF EXISTS "Staff can view practice pets" ON pets;
DROP POLICY IF EXISTS "Staff can insert pets" ON pets;
DROP POLICY IF EXISTS "Staff can update pets" ON pets;
DROP POLICY IF EXISTS "Staff can manage appointment types" ON appointment_types;
DROP POLICY IF EXISTS "Staff can view practice appointments" ON appointments;
DROP POLICY IF EXISTS "Staff can create appointments" ON appointments;
DROP POLICY IF EXISTS "Staff can update appointments" ON appointments;
DROP POLICY IF EXISTS "Staff can view reminders" ON reminders;
DROP POLICY IF EXISTS "Staff can manage waitlist" ON waitlist;
DROP POLICY IF EXISTS "Public can read appointment by token" ON appointments;
DROP POLICY IF EXISTS "Public can confirm/cancel by token" ON appointments;
DROP FUNCTION IF EXISTS get_current_practice_id();

-- Step 2: Create helper function with SECURITY DEFINER (breaks RLS recursion)
-- This runs as the table owner, not as the querying user, so no RLS recursion
CREATE FUNCTION get_current_practice_id() RETURNS UUID AS '
DECLARE
  result_uuid UUID;
BEGIN
  SELECT practice_id INTO result_uuid
  FROM staff
  WHERE staff.auth_user_id = auth.uid()
  LIMIT 1;
  RETURN result_uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
' LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Step 3: Simplified RLS policies using auth.uid() directly
-- Each policy checks: does the current user have a staff record in this practice?

CREATE POLICY "practices_all" ON practices FOR ALL USING (
  get_current_practice_id() IS NOT NULL AND practices.id = get_current_practice_id()
);

CREATE POLICY "staff_all" ON staff FOR ALL USING (
  get_current_practice_id() IS NOT NULL AND staff.practice_id = get_current_practice_id()
);

CREATE POLICY "clients_all" ON clients FOR ALL USING (
  get_current_practice_id() IS NOT NULL AND clients.practice_id = get_current_practice_id()
);

CREATE POLICY "pets_all" ON pets FOR ALL USING (
  get_current_practice_id() IS NOT NULL AND pets.practice_id = get_current_practice_id()
);

CREATE POLICY "appointment_types_all" ON appointment_types FOR ALL USING (
  get_current_practice_id() IS NOT NULL AND appointment_types.practice_id = get_current_practice_id()
);

CREATE POLICY "appointments_all" ON appointments FOR ALL USING (
  get_current_practice_id() IS NOT NULL AND appointments.practice_id = get_current_practice_id()
);

CREATE POLICY "reminders_all" ON reminders FOR ALL USING (
  get_current_practice_id() IS NOT NULL AND reminders.practice_id = get_current_practice_id()
);

CREATE POLICY "waitlist_all" ON waitlist FOR ALL USING (
  get_current_practice_id() IS NOT NULL AND waitlist.practice_id = get_current_practice_id()
);

-- Step 4: Public access for appointment confirmation via token (no auth required)
CREATE POLICY "public_appointment_read" ON appointments FOR SELECT TO anon USING (
  confirmation_token IS NOT NULL
);

CREATE POLICY "public_appointment_update" ON appointments FOR UPDATE TO anon USING (
  confirmation_token IS NOT NULL
) WITH CHECK (
  status IN ('confirmed', 'cancelled')
);
