-- Migration: Fix RLS recursion bug
-- The get_current_practice_id() function was causing stack depth errors
-- because auth.uid() inside an RLS policy context triggers Supabase's
-- internal RLS evaluation chain.

-- 1. Drop the buggy helper function
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

-- 2. Re-create with SECURITY DEFINER to break the recursion chain
CREATE OR REPLACE FUNCTION get_current_practice_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_practice_id', true), '')::UUID;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- Set the practice_id for the current session (called from middleware/auth)
-- This runs as the authenticated user but bypasses RLS during the set
CREATE OR REPLACE FUNCTION set_practice_session(p_practice_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_practice_id', p_practice_id::TEXT, false);
END;
$$;

-- 3. Staff: let anyone read their own record (needed for auth lookup)
CREATE POLICY "Staff can view own staff record"
  ON staff FOR SELECT USING (auth.uid() = auth_user_id);

-- 4. Simpler policies using direct auth.uid() — no function call chain
-- practices: user must have a staff record in this practice
CREATE POLICY "practices_access"
  ON practices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.auth_user_id = auth.uid()
      AND staff.practice_id = practices.id
    )
  );

-- staff: same practice colleagues
CREATE POLICY "staff_access"
  ON staff FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff AS my_staff
      WHERE my_staff.auth_user_id = auth.uid()
      AND staff.practice_id = my_staff.practice_id
    )
  );

-- clients
CREATE POLICY "clients_access"
  ON clients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.auth_user_id = auth.uid()
      AND staff.practice_id = clients.practice_id
    )
  );

-- pets
CREATE POLICY "pets_access"
  ON pets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.auth_user_id = auth.uid()
      AND staff.practice_id = pets.practice_id
    )
  );

-- appointment_types
CREATE POLICY "appointment_types_access"
  ON appointment_types FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.auth_user_id = auth.uid()
      AND staff.practice_id = appointment_types.practice_id
    )
  );

-- appointments
CREATE POLICY "appointments_access"
  ON appointments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.auth_user_id = auth.uid()
      AND staff.practice_id = appointments.practice_id
    )
  );

-- reminders
CREATE POLICY "reminders_access"
  ON reminders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.auth_user_id = auth.uid()
      AND staff.practice_id = reminders.practice_id
    )
  );

-- waitlist
CREATE POLICY "waitlist_access"
  ON waitlist FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.auth_user_id = auth.uid()
      AND staff.practice_id = waitlist.practice_id
    )
  );

-- Public: appointment confirm/cancel by token (no auth required)
CREATE POLICY "public_appointment_read"
  ON appointments FOR SELECT
  TO anon
  USING (confirmation_token IS NOT NULL);

CREATE POLICY "public_appointment_update"
  ON appointments FOR UPDATE
  TO anon
  USING (confirmation_token IS NOT NULL)
  WITH CHECK (status IN ('confirmed', 'cancelled'));
