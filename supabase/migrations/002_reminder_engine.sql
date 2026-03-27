-- VetSteady Migration 002: pg-boss + reminder engine tweaks
-- Run this in Supabase SQL editor after 001_initial_schema.sql

-- pg-boss manages its own "pgboss" schema.
-- We need to ensure the service role has access.
-- (pg-boss creates the schema automatically on first Boss.start())

-- Grant the service role permission to create schemas (needed by pg-boss)
-- Note: In Supabase, the service_role already has full superuser-equivalent rights.
-- This is a no-op reminder that pg-boss uses its own "pgboss" schema.

-- ============================================
-- Reminder engine: additional index
-- Helps the cron job find pending reminders efficiently
-- ============================================
CREATE INDEX IF NOT EXISTS idx_reminders_pending
  ON reminders(status, created_at)
  WHERE status = 'pending';

-- ============================================
-- Add `same_day` reminder_type if not already
-- (schema already supports it via CHECK constraint — no change needed)
-- ============================================

-- ============================================
-- Confirmation token expiry helper
-- Appointments older than 24h from now with token should be considered expired.
-- No schema change needed — token validation is done in application code.
-- ============================================

-- ============================================
-- Public API: allow anonymous reads for confirm/reschedule pages
-- (the /confirm/:token page is public — no auth required)
-- ============================================

-- Allow anon to read an appointment by its confirmation_token
-- (only exposes non-sensitive fields via the API layer)
CREATE POLICY "Public can read appointment by token"
  ON appointments FOR SELECT
  TO anon
  USING (confirmation_token IS NOT NULL);

-- Allow anon to update appointment status (confirm/cancel via SMS link)
-- Restricted to status changes only (enforced in API layer)
CREATE POLICY "Public can confirm/cancel by token"
  ON appointments FOR UPDATE
  TO anon
  USING (confirmation_token IS NOT NULL)
  WITH CHECK (status IN ('confirmed', 'cancelled'));
