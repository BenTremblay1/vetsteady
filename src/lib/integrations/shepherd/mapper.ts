// lib/integrations/shepherd/mapper.ts
// Maps Shepherd API entities to VetSteady entities.

import { createClient } from '@/lib/supabase/server';
import { ShepherdAppointment } from './client';
import type { AppointmentStatus } from '@/types';

// ── Status mapping ─────────────────────────────────────────────────────────────

export function mapShepherdStatus(shepherdStatus: string): AppointmentStatus {
  const map: Record<string, AppointmentStatus> = {
    scheduled:  'scheduled',
    confirmed:  'confirmed',
    checked_in: 'confirmed',   // treat as confirmed
    completed:  'completed',
    no_show:    'no_show',
    cancelled:  'cancelled',
  };
  return map[shepherdStatus] ?? 'scheduled';
}

// ── Find-or-create helpers ────────────────────────────────────────────────────

async function findOrCreateClient(practiceId: string, shepherdClient: ShepherdAppointment['client']) {
  const db = createClient();

  // Try to find by Shepherd ID first
  const { data: existing } = await db
    .from('clients')
    .select('id')
    .eq('practice_id', practiceId)
    .eq('shepherd_id', shepherdClient.id)
    .single();

  if (existing) return { id: existing.id, isNew: false };

  // Try to find by name+phone (fallback for pre-existing clients)
  if (shepherdClient.phone) {
    const { data: byPhone } = await db
      .from('clients')
      .select('id')
      .eq('practice_id', practiceId)
      .eq('phone', shepherdClient.phone)
      .limit(1)
      .single();
    if (byPhone) return { id: byPhone.id, isNew: false };
  }

  // Create new
  const { data: newClient } = await db
    .from('clients')
    .insert({
      practice_id: practiceId,
      first_name: shepherdClient.first_name,
      last_name: shepherdClient.last_name,
      email: shepherdClient.email ?? null,
      phone: shepherdClient.phone ?? null,
      preferred_contact: shepherdClient.phone ? 'sms' : 'email',
    })
    .select('id')
    .single();

  return { id: newClient!.id, isNew: true };
}

async function findOrCreatePet(
  practiceId: string,
  clientId: string,
  shepherdPatient: ShepherdAppointment['patient']
) {
  const db = createClient();

  const { data: existing } = await db
    .from('pets')
    .select('id')
    .eq('client_id', clientId)
    .eq('shepherd_id', shepherdPatient.id)
    .single();

  if (existing) return { id: existing.id };

  const { data: newPet } = await db
    .from('pets')
    .insert({
      client_id: clientId,
      practice_id: practiceId,
      name: shepherdPatient.name,
      species: shepherdPatient.species,
      breed: shepherdPatient.breed ?? null,
      date_of_birth: shepherdPatient.dob ?? null,
    })
    .select('id')
    .single();

  return { id: newPet!.id };
}

async function findOrCreateStaff(
  practiceId: string,
  shepherdProvider: ShepherdAppointment['provider']
) {
  const db = createClient();

  const { data: existing } = await db
    .from('staff')
    .select('id')
    .eq('practice_id', practiceId)
    .eq('shepherd_id', shepherdProvider.id)
    .single();

  if (existing) return { id: existing.id };

  // Fall back to first admin staff
  const { data: admin } = await db
    .from('staff')
    .select('id')
    .eq('practice_id', practiceId)
    .eq('role', 'admin')
    .limit(1)
    .single();

  return { id: admin?.id ?? null };
}

async function findOrCreateAppointmentType(
  practiceId: string,
  shepherdType: ShepherdAppointment['appointment_type']
) {
  const db = createClient();

  const { data: existing } = await db
    .from('appointment_types')
    .select('id')
    .eq('practice_id', practiceId)
    .eq('shepherd_id', shepherdType.id)
    .single();

  if (existing) return { id: existing.id };

  const { data: newType } = await db
    .from('appointment_types')
    .insert({
      practice_id: practiceId,
      name: shepherdType.name,
      duration_minutes: shepherdType.duration_minutes,
      allow_online_booking: true,
      is_active: true,
    })
    .select('id')
    .single();

  return { id: newType!.id };
}

// ── Generate confirmation token ──────────────────────────────────────────────

function generateToken(): string {
  const { randomUUID } = require('crypto');
  return randomUUID();
}

// ── Main mapper: Shepherd appointment → VetSteady appointment ─────────────────

export interface UpsertResult {
  isNew: boolean;
  conflict: boolean;
  vetsteadyId?: string;
}

export async function upsertAppointmentFromShepherd(
  integrationId: string,
  practiceId: string,
  shepherdAppt: ShepherdAppointment
): Promise<UpsertResult> {
  const db = createClient();

  // Check if we've already mapped this Shepherd appointment
  const { data: existing } = await db
    .from('shepherd_appointments')
    .select('id, vetsteady_appointment_id, sync_status')
    .eq('practice_id', practiceId)
    .eq('shepherd_appointment_id', shepherdAppt.id)
    .single();

  if (existing) {
    // Check for conflict
    const { data: appt } = await db
      .from('appointments')
      .select('id, status')
      .eq('id', existing.vetsteady_appointment_id)
      .single();

    const shepherdStatus = mapShepherdStatus(shepherdAppt.status);

    if (appt && appt.status !== shepherdStatus && appt.status !== 'scheduled') {
      // Conflict: Shepherd says X, VetSteady user manually confirmed/changed to Y
      await db
        .from('shepherd_appointments')
        .update({
          sync_status: 'conflict',
          shepherd_raw: shepherdAppt,
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      return { isNew: false, conflict: true, vetsteadyId: appt.id };
    }

    // Apply Shepherd's update
    await db
      .from('appointments')
      .update({
        starts_at: shepherdAppt.start_time,
        ends_at: shepherdAppt.end_time,
        status: shepherdStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.vetsteady_appointment_id);

    await db
      .from('shepherd_appointments')
      .update({
        shepherd_raw: shepherdAppt,
        last_synced_at: new Date().toISOString(),
        sync_status: 'synced',
      })
      .eq('id', existing.id);

    return { isNew: false, conflict: false, vetsteadyId: existing.vetsteady_appointment_id };
  }

  // New appointment — create all related entities
  const client = await findOrCreateClient(practiceId, shepherdAppt.client);
  const pet = await findOrCreatePet(practiceId, client.id, shepherdAppt.patient);
  const staff = await findOrCreateStaff(practiceId, shepherdAppt.provider);
  const apptType = await findOrCreateAppointmentType(practiceId, shepherdAppt.appointment_type);

  const confirmationToken = generateToken();

  const { data: newAppt } = await db
    .from('appointments')
    .insert({
      practice_id: practiceId,
      staff_id: staff.id,
      client_id: client.id,
      pet_id: pet.id,
      appointment_type_id: apptType.id,
      starts_at: shepherdAppt.start_time,
      ends_at: shepherdAppt.end_time,
      status: mapShepherdStatus(shepherdAppt.status),
      confirmation_token: confirmationToken,
      notes: shepherdAppt.notes ?? null,
    })
    .select('id')
    .single();

  await db.from('shepherd_appointments').insert({
    practice_id: practiceId,
    integration_id: integrationId,
    shepherd_appointment_id: shepherdAppt.id,
    vetsteady_appointment_id: newAppt!.id,
    shepherd_raw: shepherdAppt,
    sync_status: 'synced',
  });

  // Schedule reminder jobs if appointment is in the future
  if (new Date(shepherdAppt.start_time) > new Date()) {
    await scheduleReminderJobs(newAppt!.id, practiceId);
  }

  return { isNew: true, conflict: false, vetsteadyId: newAppt!.id };
}

async function scheduleReminderJobs(appointmentId: string, practiceId: string): Promise<void> {
  const db = createClient();

  // Get practice settings for reminder timing
  const { data: practice } = await db
    .from('practices')
    .select('settings')
    .eq('id', practiceId)
    .single();

  const reminderTiming = practice?.settings?.reminder_timing ?? {
    booking_confirm: true,
    two_week: true,
    four_day: true,
    two_day: true,
    same_day: false,
  };

  const { data: appointment } = await db
    .from('appointments')
    .select('starts_at, client_id')
    .eq('id', appointmentId)
    .single();

  if (!appointment) return;

  const startsAt = new Date(appointment.starts_at);
  const reminderTypes = Object.entries(reminderTiming)
    .filter(([, enabled]) => enabled)
    .map(([type]) => type);

  const records = reminderTypes.map((reminder_type) => ({
    appointment_id: appointmentId,
    practice_id: practiceId,
    channel: 'sms',
    reminder_type,
    status: 'pending',
  }));

  if (records.length > 0) {
    await db.from('reminders').insert(records);
  }
}
