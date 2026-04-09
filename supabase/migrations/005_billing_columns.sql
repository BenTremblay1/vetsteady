-- Migration 005: Add billing-related columns for Stripe integration
-- Run this in your Supabase SQL editor

-- Add trial_ends_at to track when the 15-day trial expires
ALTER TABLE practices
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 days');

-- Ensure stripe_customer_id exists (should already from 001, but just in case)
-- ALTER TABLE practices ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Index for fast lookup by Stripe customer ID (used in webhook handlers)
CREATE INDEX IF NOT EXISTS idx_practices_stripe_customer
  ON practices(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
