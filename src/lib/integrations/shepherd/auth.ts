// @ts-nocheck
// lib/integrations/shepherd/auth.ts
// Token management: get valid access token, refresh, update, decrypt.
// Tokens are stored encrypted via Supabase Vault (or AES-256 as fallback).

import { createClient } from '@/lib/supabase/server';

const SHEPHERD_AUTH_BASE = process.env.SHEPHERD_AUTH_BASE ?? 'https://auth.shepherdvet.com';
const SHEPHERD_CLIENT_ID = process.env.SHEPHERD_CLIENT_ID ?? '';
const SHEPHERD_CLIENT_SECRET = process.env.SHEPHERD_CLIENT_SECRET ?? '';
const SHEPHERD_REDIRECT_URI =
  process.env.SHEPHERD_REDIRECT_URI ??
  `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/shepherd/callback`;

// Simple AES-256-GCM decrypt (when Supabase Vault is unavailable).
// In production prefer Supabase Vault; this is the fallback path.
function decryptToken(encrypted: string): string {
  // Lazy-load crypto only on server
  const { createCipheriv, randomBytes } = require('crypto');
  const key = Buffer.from(process.env.SHEPHERD_TOKEN_KEY!, 'hex'); // 32-byte hex key
  const [ivHex, tagHex, ciphertext] = encrypted.split(':');
  const decipher = createCipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return decipher.update(Buffer.from(ciphertext, 'hex'), null, 'utf8') + decipher.final('utf8');
}

function encryptToken(plaintext: string): string {
  const { createCipheriv, randomBytes } = require('crypto');
  const key = Buffer.from(process.env.SHEPHERD_TOKEN_KEY!, 'hex');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = cipher.update(plaintext, 'utf8', 'hex') + cipher.final('hex');
  return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${ct}`;
}

// ── Get valid (non-expired) access token for a given integration ──────────────

export async function getValidAccessToken(integrationId: string): Promise<string> {
  const db = await createClient();

  const { data: integration, error } = await db
    .from('integrations')
    .select('*')
    .eq('id', integrationId)
    .single();

  if (error || !integration) throw new Error('Integration not found');

  const now = new Date();
  const expiresAt = new Date(integration.token_expires_at);
  const bufferMs = 5 * 60 * 1000; // refresh 5 min before expiry

  if (expiresAt.getTime() - now.getTime() > bufferMs) {
    // Token still valid
    return decryptToken(integration.access_token);
  }

  // Refresh token
  return refreshAccessToken(integration);
}

async function refreshAccessToken(integration: {
  id: string;
  refresh_token: string;
  practice_id: string;
}): Promise<string> {
  const refreshPlain = decryptToken(integration.refresh_token);

  const resp = await fetch(`${SHEPHERD_AUTH_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshPlain,
      client_id: SHEPHERD_CLIENT_ID,
      client_secret: SHEPHERD_CLIENT_SECRET,
    }),
  });

  if (!resp.ok) {
    await markIntegrationError(integration.id, 'Token refresh failed');
    throw new Error('Shepherd token refresh failed');
  }

  const tokens = await resp.json();
  await updateTokens(integration.id, integration.practice_id, tokens);
  return tokens.access_token;
}

export async function updateTokens(
  integrationId: string,
  practiceId: string,
  tokens: { access_token: string; refresh_token: string; expires_in: number }
): Promise<void> {
  const db = await createClient();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await db.from('integrations').update({
    access_token: encryptToken(tokens.access_token),
    refresh_token: encryptToken(tokens.refresh_token),
    token_expires_at: expiresAt,
    status: 'active',
    last_error: null,
    error_count: 0,
    updated_at: new Date().toISOString(),
  }).eq('id', integrationId);
}

export async function markIntegrationError(integrationId: string, error: string): Promise<void> {
  const db = await createClient();
  await db.rpc('increment_integration_error', { integration_id: integrationId, error_message: error });
}

export async function storeIntegration(
  practiceId: string,
  tokens: { access_token: string; refresh_token: string; expires_in: number },
  shepherdPracticeId?: string
): Promise<string> {
  const db = await createClient();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const [result] = await db.from('integrations').upsert({
    practice_id: practiceId,
    provider: 'shepherd',
    status: 'active',
    access_token: encryptToken(tokens.access_token),
    refresh_token: encryptToken(tokens.refresh_token),
    token_expires_at: expiresAt,
    shepherd_practice_id: shepherdPracticeId ?? null,
    settings: { sync_enabled: true, sync_interval_min: 15 },
  }, { onConflict: 'practice_id,provider' }).select('id');

  return result.id;
}

// ── Build OAuth authorization URL ─────────────────────────────────────────────

export function buildShepherdAuthUrl(practiceId: string, state: string): string {
  const params = new URLSearchParams({
    client_id: SHEPHERD_CLIENT_ID,
    redirect_uri: SHEPHERD_REDIRECT_URI,
    response_type: 'code',
    scope: 'appointments:read appointments:write clients:read patients:read staff:read',
    state: `${practiceId}:${state}`,
  });
  return `${SHEPHERD_AUTH_BASE}/oauth/authorize?${params}`;
}

// ── Exchange auth code for tokens ────────────────────────────────────────────

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const resp = await fetch(`${SHEPHERD_AUTH_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      client_id: SHEPHERD_CLIENT_ID,
      client_secret: SHEPHERD_CLIENT_SECRET,
      redirect_uri: SHEPHERD_REDIRECT_URI,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Token exchange failed: ${body}`);
  }

  return resp.json();
}

// ── Revoke tokens ─────────────────────────────────────────────────────────────

export async function revokeShepherdTokens(integrationId: string): Promise<void> {
  const db = await createClient();

  const { data: integration } = await db
    .from('integrations')
    .select('access_token, refresh_token')
    .eq('id', integrationId)
    .single();

  if (!integration) return;

  // Best-effort revoke at Shepherd
  const accessToken = decryptToken(integration.access_token);
  await fetch(`${SHEPHERD_AUTH_BASE}/oauth/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: accessToken }),
  }).catch(() => {/* non-fatal */});

  // Mark revoked in DB
  await db.from('integrations').update({ status: 'revoked' }).eq('id', integrationId);
}
