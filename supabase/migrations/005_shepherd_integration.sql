-- Migration 005: Shepherd PIMS Integration
-- Adds integrations table (per-practice OAuth provider connections)
-- and shepherd_appointments table (sync mapping / audit log)

-- Enable pgcrypto for gen_random_uuid() and key generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Integrations ──────────────────────────────────────────────────────────────
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,                         -- 'shepherd'
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'error', 'revoked')),
  access_token TEXT,                              -- encrypted at rest via Supabase Vault
  refresh_token TEXT,                             -- encrypted at rest via Supabase Vault
  token_expires_at TIMESTAMPTZ,
  shepherd_practice_id TEXT,                     -- Shepherd's internal ID for this practice
  sync_cursor TEXT,                              -- last pagination cursor for incremental sync
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  error_count INT DEFAULT 0,
  settings JSONB DEFAULT '{"sync_enabled": true, "sync_interval_min": 15}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(practice_id, provider)
);

CREATE INDEX idx_integrations_practice  ON integrations(practice_id);
CREATE INDEX idx_integrations_provider   ON integrations(provider, status);

-- ── Shepherd Appointments (sync mapping + raw audit) ────────────────────────
CREATE TABLE shepherd_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id        UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
  integration_id     UUID REFERENCES integrations(id) ON DELETE CASCADE NOT NULL,
  shepherd_appointment_id  TEXT NOT NULL,
  vetsteady_appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  shepherd_raw       JSONB NOT NULL,              -- raw Shepherd payload; aids debugging / replay
  last_synced_at     TIMESTAMPTZ DEFAULT NOW(),
  sync_status        TEXT DEFAULT 'synced'
    CHECK (sync_status IN ('synced', 'conflict', 'error', 'deleted')),
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(practice_id, shepherd_appointment_id)
);

CREATE INDEX idx_shepherd_appts_external   ON shepherd_appointments(shepherd_appointment_id);
CREATE INDEX idx_shepherd_appts_vetsteady ON shepherd_appointments(vetsteady_appointment_id);
CREATE INDEX idx_shepherd_appts_practice  ON shepherd_appointments(practice_id);

-- ── RLS for integrations ──────────────────────────────────────────────────────
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Staff/admins can view and manage their practice's integrations
CREATE POLICY "Staff can view own practice integrations"
  ON integrations FOR SELECT
  USING (practice_id = get_current_practice_id());

CREATE POLICY "Staff can manage own practice integrations"
  ON integrations FOR ALL
  USING (practice_id = get_current_practice_id());

ALTER TABLE shepherd_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view own practice shepherd appointments"
  ON shepherd_appointments FOR SELECT
  USING (practice_id = get_current_practice_id());

-- ── Auto-update updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
