'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, User, Dog, Phone, Mail, AlertTriangle } from 'lucide-react';
import { Client, Pet, CreateClientInput, CreatePetInput } from '@/types';
import { cn } from '@/lib/utils/cn';

// ─── Client List ─────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/clients');
      const json = await res.json();
      setClients(json.data ?? []);
    } catch (e) {
      console.error('[clients] load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">{clients.length} pet owner{clients.length !== 1 ? 's' : ''} on record</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#0D7377' }}
        >
          <Plus size={16} />
          Add Client
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Search by name, email or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-sm text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-sm text-gray-400 gap-2">
            <User size={32} className="text-gray-200" />
            <p>{search ? 'No clients match your search.' : 'No clients yet. Add your first one!'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Channel</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">No-shows</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedClient(c)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {c.first_name} {c.last_name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    <div className="flex flex-col gap-0.5">
                      {c.phone && <span className="flex items-center gap-1"><Phone size={12} />{c.phone}</span>}
                      {c.email && <span className="flex items-center gap-1"><Mail size={12} />{c.email}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      c.preferred_contact === 'sms' ? 'bg-blue-50 text-blue-700' :
                      c.preferred_contact === 'email' ? 'bg-purple-50 text-purple-700' :
                      'bg-green-50 text-green-700'
                    )}>
                      {c.preferred_contact.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.no_show_count > 0 ? (
                      <span className="flex items-center gap-1 text-red-500 font-medium">
                        <AlertTriangle size={12} />{c.no_show_count}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onCreated={load}
        />
      )}
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onUpdated={load}
        />
      )}
    </div>
  );
}

// ─── Add Client Modal ─────────────────────────────────────────────────────────

function AddClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addPet, setAddPet] = useState(false);

  const [form, setForm] = useState<CreateClientInput>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    preferred_contact: 'sms',
    notes: '',
  });

  const [petForm, setPetForm] = useState<Omit<CreatePetInput, 'client_id'>>({
    name: '',
    species: 'dog',
    breed: '',
    date_of_birth: '',
    weight_kg: undefined,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name) return;
    setSubmitting(true);
    setError(null);

    try {
      // Create client
      const res = await fetch('/api/v1/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to create client');

      const clientId: string = json.data.id;

      // Optionally create pet
      if (addPet && petForm.name) {
        const petRes = await fetch(`/api/v1/clients/${clientId}/pets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...petForm, client_id: clientId }),
        });
        if (!petRes.ok) {
          const petJson = await petRes.json();
          console.error('[clients] pet create failed:', petJson.error);
        }
      }

      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-y-auto max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Add Client</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
              <input
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
              <input
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone ?? ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={form.email ?? ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
            />
          </div>

          {/* Preferred contact */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Preferred Contact</label>
            <select
              value={form.preferred_contact}
              onChange={(e) => setForm({ ...form, preferred_contact: e.target.value as 'sms' | 'email' | 'both' })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white"
              style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
            >
              <option value="sms">SMS</option>
              <option value="email">Email</option>
              <option value="both">Both</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none"
              style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
            />
          </div>

          {/* Add pet toggle */}
          <div className="pt-2 border-t border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={addPet}
                onChange={(e) => setAddPet(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Dog size={14} /> Add a pet too
              </span>
            </label>
          </div>

          {addPet && (
            <div className="space-y-3 bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pet Info</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Pet Name *</label>
                  <input
                    required={addPet}
                    value={petForm.name}
                    onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white"
                    style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Species *</label>
                  <select
                    value={petForm.species}
                    onChange={(e) => setPetForm({ ...petForm, species: e.target.value as Pet['species'] })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white"
                    style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
                  >
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="bird">Bird</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Breed</label>
                <input
                  value={petForm.breed ?? ''}
                  onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white"
                  style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={petForm.date_of_birth ?? ''}
                    onChange={(e) => setPetForm({ ...petForm, date_of_birth: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white"
                    style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={petForm.weight_kg ?? ''}
                    onChange={(e) => setPetForm({ ...petForm, weight_kg: parseFloat(e.target.value) || undefined })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white"
                    style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-60"
              style={{ backgroundColor: '#0D7377' }}
            >
              {submitting ? 'Saving…' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Client Detail Modal ──────────────────────────────────────────────────────

function ClientDetailModal({
  client,
  onClose,
  onUpdated,
}: {
  client: Client;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: client.first_name,
    last_name: client.last_name,
    email: client.email ?? '',
    phone: client.phone ?? '',
    preferred_contact: client.preferred_contact,
    notes: client.notes ?? '',
  });

  // Add pet state
  const [addingPet, setAddingPet] = useState(false);
  const [savingPet, setSavingPet] = useState(false);
  const [petError, setPetError] = useState<string | null>(null);
  const [petForm, setPetForm] = useState({
    name: '',
    species: 'dog' as Pet['species'],
    breed: '',
    date_of_birth: '',
    weight_kg: undefined as number | undefined,
    notes: '',
  });

  useEffect(() => {
    fetch(`/api/v1/clients/${client.id}/pets`)
      .then((r) => r.json())
      .then((j) => setPets(j.data ?? []))
      .catch(console.error)
      .finally(() => setLoadingPets(false));
  }, [client.id]);

  async function handleAddPet(e: React.FormEvent) {
    e.preventDefault();
    if (!petForm.name.trim()) return;
    setSavingPet(true);
    setPetError(null);
    try {
      const res = await fetch(`/api/v1/clients/${client.id}/pets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...petForm, client_id: client.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to add pet');
      setPets((prev) => [...prev, json.data]);
      setPetForm({ name: '', species: 'dog', breed: '', date_of_birth: '', weight_kg: undefined, notes: '' });
      setAddingPet(false);
    } catch (err: any) {
      setPetError(err.message);
    } finally {
      setSavingPet(false);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/v1/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to update');
      onUpdated();
      onClose();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const speciesEmoji: Record<string, string> = {
    dog: '🐕', cat: '🐈', bird: '🦜', other: '🐾',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-y-auto max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {editing ? 'Edit Client' : `${client.first_name} ${client.last_name}`}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {editing ? 'Update client details' : 'Client profile'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-medium"
              >
                Edit
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>
        </div>

        {/* Body */}
        {editing ? (
          <form onSubmit={handleSave} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
                <input required value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
                <input required value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Preferred Contact</label>
              <select value={editForm.preferred_contact} onChange={(e) => setEditForm({ ...editForm, preferred_contact: e.target.value as 'sms' | 'email' | 'both' })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white" style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none" style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties} />
            </div>
            {editError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{editError}</div>}
            <div className="flex gap-3">
              <button type="button" onClick={() => setEditing(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60" style={{ backgroundColor: '#0D7377' }}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-5">
            {/* Contact */}
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Contact</h3>
              <div className="space-y-1 text-sm text-gray-700">
                {client.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" />{client.phone}</div>}
                {client.email && <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400" />{client.email}</div>}
                <div className="text-xs text-gray-400 mt-1">Preferred: <strong>{client.preferred_contact.toUpperCase()}</strong></div>
              </div>
            </section>

            {/* Stats */}
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">History</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'No-shows', value: client.no_show_count, danger: client.no_show_count > 0 },
                  { label: 'Late cancels', value: client.late_cancel_count, danger: client.late_cancel_count > 1 },
                ].map((s) => (
                  <div key={s.label} className={cn('rounded-xl p-3 text-center border', s.danger ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50')}>
                    <p className={cn('text-2xl font-bold', s.danger ? 'text-red-500' : 'text-gray-700')}>{s.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Notes */}
            {client.notes && (
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Notes</h3>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{client.notes}</p>
              </section>
            )}

            {/* Pets */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pets</h3>
                {!addingPet && (
                  <button
                    onClick={() => setAddingPet(true)}
                    className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Plus size={11} /> Add Pet
                  </button>
                )}
              </div>

              {loadingPets ? (
                <p className="text-xs text-gray-400">Loading…</p>
              ) : pets.length === 0 && !addingPet ? (
                <p className="text-sm text-gray-400">No pets on record.</p>
              ) : (
                <div className="space-y-2">
                  {pets.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                      <span className="text-xl">{speciesEmoji[p.species] ?? '🐾'}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.species}{p.breed ? ` · ${p.breed}` : ''}{p.weight_kg ? ` · ${p.weight_kg} kg` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Pet inline form */}
              {addingPet && (
                <form onSubmit={handleAddPet} className="mt-3 space-y-2 bg-gray-50 rounded-xl p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Pet Name *</label>
                      <input
                        required
                        value={petForm.name}
                        onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                        placeholder="Buddy"
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 bg-white"
                        style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Species *</label>
                      <select
                        value={petForm.species}
                        onChange={(e) => setPetForm({ ...petForm, species: e.target.value as Pet['species'] })}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 bg-white"
                        style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
                      >
                        <option value="dog">Dog</option>
                        <option value="cat">Cat</option>
                        <option value="bird">Bird</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Breed</label>
                    <input
                      value={petForm.breed}
                      onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
                      placeholder="Golden Retriever"
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 bg-white"
                      style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={petForm.date_of_birth}
                        onChange={(e) => setPetForm({ ...petForm, date_of_birth: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 bg-white"
                        style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={petForm.weight_kg ?? ''}
                        onChange={(e) => setPetForm({ ...petForm, weight_kg: parseFloat(e.target.value) || undefined })}
                        placeholder="12.5"
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 bg-white"
                        style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
                      />
                    </div>
                  </div>
                  {petError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-2.5 py-1.5 text-xs">{petError}</div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setAddingPet(false); setPetError(null); }}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingPet}
                      className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-60"
                      style={{ backgroundColor: '#0D7377' }}
                    >
                      {savingPet ? 'Saving…' : 'Add Pet'}
                    </button>
                  </div>
                </form>
              )}
            </section>

            <div className="text-xs text-gray-300 text-right">
              Client since {new Date(client.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
