-- VetSteady Initial Schema
-- Run this in your Supabase SQL editor or via: supabase db push

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PRACTICES (tenants)
-- ============================================
CREATE TABLE practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  phone TEXT,
  email TEXT,
  address JSONB,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  settings JSONB DEFAULT '{}',
  subscription_status TEXT DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'paused', 'cancelled')),
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STAFF
-- ============================================
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'receptionist'
    CHECK (role IN ('admin', 'vet', 'receptionist')),
  is_bookable BOOLEAN DEFAULT TRUE,
  color TEXT DEFAULT '#4F46E5',
  auth_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CLIENTS (pet owners)
-- ============================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  preferred_contact TEXT DEFAULT 'sms'
    CHECK (preferred_contact IN ('sms', 'email', 'both')),
  no_show_count INT DEFAULT 0,
  late_cancel_count INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PETS
-- ============================================
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  date_of_birth DATE,
  weight_kg DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- APPOINTMENT TYPES
-- ============================================
CREATE TABLE appointment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 30,
  color TEXT DEFAULT '#10B981',
  allow_online_booking BOOLEAN DEFAULT TRUE,
  requires_deposit BOOLEAN DEFAULT FALSE,
  deposit_amount_cents INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- APPOINTMENTS
-- ============================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES staff(id),
  client_id UUID REFERENCES clients(id) NOT NULL,
  pet_id UUID REFERENCES pets(id) NOT NULL,
  appointment_type_id UUID REFERENCES appointment_types(id),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'confirmed', 'completed', 'no_show', 'cancelled')),
  confirmation_token TEXT UNIQUE,
  notes TEXT,
  deposit_paid BOOLEAN DEFAULT FALSE,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REMINDERS
-- ============================================
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  practice_id UUID REFERENCES practices(id),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  reminder_type TEXT NOT NULL
    CHECK (reminder_type IN ('booking_confirm', '2_week', '4_day', '2_day', 'same_day')),
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WAITLIST
-- ============================================
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  pet_id UUID REFERENCES pets(id),
  appointment_type_id UUID REFERENCES appointment_types(id),
  staff_id UUID REFERENCES staff(id),
  earliest_date DATE,
  latest_date DATE,
  notes TEXT,
  notified_at TIMESTAMPTZ,
  status TEXT DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'offered', 'booked', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_appointments_practice_starts ON appointments(practice_id, starts_at);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_confirmation_token ON appointments(confirmation_token);
CREATE INDEX idx_reminders_appointment ON reminders(appointment_id);
CREATE INDEX idx_reminders_status ON reminders(status);
CREATE INDEX idx_clients_practice ON clients(practice_id);
CREATE INDEX idx_pets_client ON pets(client_id);
CREATE INDEX idx_staff_practice ON staff(practice_id);
CREATE INDEX idx_staff_auth_user ON staff(auth_user_id);

-- ============================================
-- ROW-LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Helper: get the practice_id for the current authenticated staff member
CREATE OR REPLACE FUNCTION get_current_practice_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT practice_id FROM staff WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Practices: staff can only see their own practice
CREATE POLICY "Staff can view own practice"
  ON practices FOR SELECT
  USING (id = get_current_practice_id());

CREATE POLICY "Admins can update own practice"
  ON practices FOR UPDATE
  USING (id = get_current_practice_id());

-- Staff: can see colleagues in same practice
CREATE POLICY "Staff can view same practice staff"
  ON staff FOR SELECT
  USING (practice_id = get_current_practice_id());

-- Clients: practice-scoped
CREATE POLICY "Staff can view practice clients"
  ON clients FOR SELECT
  USING (practice_id = get_current_practice_id());

CREATE POLICY "Staff can insert clients"
  ON clients FOR INSERT
  WITH CHECK (practice_id = get_current_practice_id());

CREATE POLICY "Staff can update clients"
  ON clients FOR UPDATE
  USING (practice_id = get_current_practice_id());

-- Pets: practice-scoped
CREATE POLICY "Staff can view practice pets"
  ON pets FOR SELECT
  USING (practice_id = get_current_practice_id());

CREATE POLICY "Staff can insert pets"
  ON pets FOR INSERT
  WITH CHECK (practice_id = get_current_practice_id());

CREATE POLICY "Staff can update pets"
  ON pets FOR UPDATE
  USING (practice_id = get_current_practice_id());

-- Appointment types: practice-scoped
CREATE POLICY "Staff can manage appointment types"
  ON appointment_types FOR ALL
  USING (practice_id = get_current_practice_id());

-- Appointments: practice-scoped
CREATE POLICY "Staff can view practice appointments"
  ON appointments FOR SELECT
  USING (practice_id = get_current_practice_id());

CREATE POLICY "Staff can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (practice_id = get_current_practice_id());

CREATE POLICY "Staff can update appointments"
  ON appointments FOR UPDATE
  USING (practice_id = get_current_practice_id());

-- Reminders: practice-scoped
CREATE POLICY "Staff can view reminders"
  ON reminders FOR SELECT
  USING (practice_id = get_current_practice_id());

-- Waitlist: practice-scoped
CREATE POLICY "Staff can manage waitlist"
  ON waitlist FOR ALL
  USING (practice_id = get_current_practice_id());

-- ============================================
-- SEED: Default appointment types
-- (insert after creating a practice)
-- ============================================
-- INSERT INTO appointment_types (practice_id, name, duration_minutes, color) VALUES
--   ('<your-practice-id>', 'Wellness Exam', 30, '#10B981'),
--   ('<your-practice-id>', 'Vaccination', 15, '#3B82F6'),
--   ('<your-practice-id>', 'Dental Cleaning', 60, '#8B5CF6'),
--   ('<your-practice-id>', 'Surgery Consult', 45, '#F59E0B'),
--   ('<your-practice-id>', 'Emergency', 30, '#EF4444');
