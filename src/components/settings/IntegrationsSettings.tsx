'use client';

import { useState, useEffect } from 'react';
import { Link2, CheckCircle2, AlertCircle, RefreshCw, Trash2, ChevronRight, Zap } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShepherdIntegration {
  id: string;
  status: 'active' | 'paused' | 'error' | 'revoked';
  shepherd_practice_id: string | null;
  last_synced_at: string | null;
  last_error: string | null;
  error_count: number;
  settings: {
    sync_enabled: boolean;
    sync_interval_min: number;
  };
}

// ─── Consent Disclosure ──────────────────────────────────────────────────────
// Shown before the practice initiates the Shepherd OAuth flow.
// Meets the standard for a data-sharing disclosure under a DSA framework.

const SHEPHERD_SCOPE_DESCRIPTIONS = [
  {
    scope: 'appointments:read',
    icon: '📅',
    label: 'Appointments',
    description: 'View all scheduled, confirmed, and completed appointments in Shepherd.',
  },
  {
    scope: 'clients:read',
    icon: '👤',
    label: 'Client Records',
    description: 'Import client names, phone numbers, and email addresses.',
  },
  {
    scope: 'patients:read',
    icon: '🐾',
    label: 'Patient Records',
    description: 'Import pet names, species, breed, and date of birth.',
  },
  {
    scope: 'staff:read',
    icon: '👩‍⚕️',
    label: 'Staff Records',
    description: 'Import veterinarian and staff names for appointment assignment.',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [integration, setIntegration] = useState<ShepherdIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [disconnectConfirm, setDisconnectConfirm] = useState(false);

  useEffect(() => {
    fetch('/api/integrations/shepherd/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { setIntegration(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // ── Connect (initiate OAuth) ───────────────────────────────────────────────
  const handleConnect = async () => {
    if (!consentChecked) return;
    setConnecting(true);
    try {
      const res = await fetch('/api/integrations/shepherd/connect');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        // Staging / demo mode: show consent modal instead
        setShowConsent(true);
      }
    } catch {
      // Fallback: show the consent modal for demo
      setShowConsent(true);
    } finally {
      setConnecting(false);
    }
  };

  // ── Disconnect ─────────────────────────────────────────────────────────────
  const handleDisconnect = async () => {
    if (!disconnectConfirm) { setDisconnectConfirm(true); return; }
    setDisconnecting(true);
    try {
      await fetch('/api/integrations/shepherd', { method: 'DELETE' });
      setIntegration(null);
    } finally {
      setDisconnecting(false);
      setDisconnectConfirm(false);
    }
  };

  // ── Manual sync trigger ────────────────────────────────────────────────────
  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/integrations/shepherd/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) setIntegration(data);
    } finally {
      setSyncing(false);
    }
  };

  // ── Pause / resume sync ────────────────────────────────────────────────────
  const handleToggleSync = async () => {
    const updated = { ...integration!, settings: { ...integration!.settings, sync_enabled: !integration!.settings.sync_enabled } };
    setIntegration(updated);
    await fetch('/api/integrations/shepherd/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: updated.settings }),
    });
  };

  const isConnected = integration != null && integration.status !== 'revoked';
  const isError = integration?.status === 'error';
  const isActive = integration?.status === 'active';

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect third-party tools to extend VetSteady&apos;s capabilities.
        </p>
      </div>

      {/* ── Shepherd Card ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 flex items-start gap-4">
          {/* Shepherd logo placeholder */}
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🐑</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-gray-900 text-lg">Shepherd PIMS</h2>
              {isConnected && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isActive ? 'bg-green-50 text-green-700' :
                  isError ? 'bg-red-50 text-red-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {isActive ? '● Connected' : isError ? '⚠ Error' : integration?.status}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Two-way sync with Shepherd Practice Management software. Appointments sync automatically — no more double-entry.
            </p>

            {/* Sync status row */}
            {isConnected && integration && (
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                {integration.last_synced_at && (
                  <span>Last synced {formatRelative(integration.last_synced_at)}</span>
                )}
                {integration.error_count > 0 && (
                  <span className="text-red-500">{integration.error_count} consecutive error{integration.error_count !== 1 ? 's' : ''}</span>
                )}
                {integration.last_error && (
                  <span className="text-red-400 truncate max-w-xs" title={integration.last_error}>
                    {integration.last_error}
                  </span>
                )}
                <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
                  <span className="text-gray-500">Auto-sync</span>
                  <button
                    onClick={handleToggleSync}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      integration.settings.sync_enabled ? 'bg-teal-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      integration.settings.sync_enabled ? 'translate-x-4' : ''
                    }`} />
                  </button>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex gap-3 flex-wrap">
          {!isConnected ? (
            <button
              onClick={() => setShowConsent(true)}
              disabled={connecting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#0D7377' }}
            >
              <Link2 size={14} />
              {connecting ? 'Redirecting…' : 'Connect Shepherd'}
            </button>
          ) : (
            <>
              <button
                onClick={handleSyncNow}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
              >
                <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing…' : 'Sync Now'}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  disconnectConfirm
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Trash2 size={14} />
                {disconnecting ? 'Removing…' : disconnectConfirm ? 'Confirm Remove' : 'Disconnect'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Other Integrations (coming soon stubs) ────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Coming Soon</h3>
        {['IDEXXX Neo', 'AVImark', 'PetDesk'].map((name) => (
          <div key={name} className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center justify-between opacity-60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <span className="text-lg">🔌</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{name}</p>
                <p className="text-xs text-gray-400">Coming in Q3 2026</p>
              </div>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Planned</span>
          </div>
        ))}
      </div>

      {/* ── Consent Modal ─────────────────────────────────────────────────── */}
      {showConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !connecting && setShowConsent(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🐑</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Connect Shepherd</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Review what VetSteady will access before connecting your account.
                </p>
              </div>
            </div>

            {/* What we access */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">VetSteady will request access to:</p>
              <div className="space-y-2">
                {SHEPHERD_SCOPE_DESCRIPTIONS.map((s) => (
                  <div key={s.scope} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                    <span className="text-lg mt-0.5">{s.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{s.label}</p>
                      <p className="text-xs text-gray-500">{s.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy assurances */}
            <div className="rounded-lg bg-teal-50 border border-teal-100 p-4 space-y-1.5">
              <p className="text-sm font-medium text-teal-800 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-teal-600" />
                Privacy assurances
              </p>
              <ul className="text-xs text-teal-700 space-y-1">
                <li>• Data stays in your VetSteady account — never shared with third parties</li>
                <li>• Appointments sync locally; raw Shepherd data is stored encrypted in Supabase</li>
                <li>• No clinical notes or treatment data is imported</li>
                <li>• Disconnect at any time to stop syncing and delete stored data</li>
              </ul>
            </div>

            {/* HIPAA note */}
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
              <p className="text-xs text-amber-800">
                <strong>HIPAA Note:</strong> Importing client names and contact information from Shepherd
                may constitute Protected Health Information (PHI) under HIPAA. VetSteady maintains a
                Business Associate Agreement (BAA) with Supabase and stores all data in HIPAA-compliant
                infrastructure. Ensure your Shepherd Data Sharing Agreement covers this use case.
              </p>
            </div>

            {/* Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-600">
                I have reviewed the data access scope and consent to VetSteady importing my
                Shepherd appointment and client data as described above.
              </span>
            </label>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-1">
              <button
                onClick={() => setShowConsent(false)}
                disabled={connecting}
                className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={!consentChecked || connecting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#0D7377' }}
              >
                <ChevronRight size={14} />
                {connecting ? 'Redirecting to Shepherd…' : 'Continue to Shepherd'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
