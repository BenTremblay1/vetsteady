-- Migration 004: Fix public booking + allow anonymous appointment creation
-- Fixes: "new row violates row-level security policy for appointments"
-- Run this in Supabase SQL Editor

-- Allow anonymous users to INSERT appointments (for public booking portal)
-- and to SELECT appointments by confirmation_token (for confirm/cancel pages)
DROP POLICY IF EXISTS "public_appointments_insert" ON appointments;
CREATE POLICY "public_appointments_insert" ON appointments FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "public_appointments_read" ON appointments;
CREATE POLICY "public_appointments_read" ON appointments FOR SELECT TO anon USING (true);
