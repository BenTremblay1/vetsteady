// ──────────────────────────────────────────────────────────────────────────────
// VetSteady — Core Types
// ──────────────────────────────────────────────────────────────────────────────

export interface Practice {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  address: Record<string, string> | null;
  timezone: string;
  settings: PracticeSettings;
  subscription_status: 'trial' | 'active' | 'paused' | 'cancelled';
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffInvite {
  token: string;
  role: string;
  created_at: string;
  used: boolean;
}

export interface PracticeSettings {
  reminder_timing?: {
    booking_confirm: boolean;
    two_week: boolean;
    four_day: boolean;
    two_day: boolean;
    same_day: boolean;
  };
  deposit_required?: boolean;
  deposit_amount_cents?: number;
  booking_advance_days?: number; // how far in advance clients can book
  invites?: StaffInvite[];
}

export interface Staff {
  id: string;
  practice_id: string;
  name: string;
  email: string;
  role: 'admin' | 'vet' | 'receptionist';
  is_bookable: boolean;
  color: string;
  auth_user_id: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  practice_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  preferred_contact: 'sms' | 'email' | 'both';
  no_show_count: number;
  late_cancel_count: number;
  notes: string | null;
  created_at: string;
}

export interface Pet {
  id: string;
  client_id: string;
  practice_id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'other';
  breed: string | null;
  date_of_birth: string | null;
  weight_kg: number | null;
  notes: string | null;
  created_at: string;
}

export interface AppointmentType {
  id: string;
  practice_id: string;
  name: string;
  duration_minutes: number;
  color: string;
  allow_online_booking: boolean;
  requires_deposit: boolean;
  deposit_amount_cents: number;
  is_active: boolean;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'no_show'
  | 'cancelled';

export type ReminderType =
  | 'booking_confirm'
  | '2_week'
  | '4_day'
  | '2_day'
  | 'same_day';

export interface Appointment {
  id: string;
  practice_id: string;
  staff_id: string;
  client_id: string;
  pet_id: string;
  appointment_type_id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  confirmation_token: string;
  notes: string | null;
  deposit_paid: boolean;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  staff?: Staff;
  client?: Client;
  pet?: Pet;
  appointment_type?: AppointmentType;
}

export interface CreateAppointmentInput {
  practice_id: string;
  staff_id: string;
  client_id: string;
  pet_id: string;
  appointment_type_id: string;
  starts_at: string;
  notes?: string;
}

export interface Reminder {
  id: string;
  appointment_id: string;
  practice_id: string;
  channel: 'sms' | 'email';
  reminder_type: ReminderType;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  provider_message_id: string | null;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface Waitlist {
  id: string;
  practice_id: string;
  client_id: string;
  pet_id: string;
  appointment_type_id: string;
  staff_id: string | null;
  earliest_date: string | null;
  latest_date: string | null;
  notes: string | null;
  notified_at: string | null;
  status: 'waiting' | 'offered' | 'booked' | 'expired';
  created_at: string;
}

export interface CreateClientInput {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  preferred_contact?: 'sms' | 'email' | 'both';
  notes?: string;
}

export interface CreatePetInput {
  client_id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'other';
  breed?: string;
  date_of_birth?: string;
  weight_kg?: number;
  notes?: string;
}

// UI-only helpers
export interface CalendarDay {
  date: Date;
  isToday: boolean;
  appointments: Appointment[];
}

export interface TimeSlot {
  hour: number;
  minute: number;
  label: string; // "9:00 AM"
}
