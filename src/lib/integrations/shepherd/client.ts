// lib/integrations/shepherd/client.ts
// Low-level Shepherd API client.

export const SHEPHERD_API_BASE =
  process.env.SHEPHERD_API_BASE ?? 'https://api.shepherdvet.com/v1';

export interface ShepherdAppointment {
  id: string;
  practice_id: string;
  client: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  patient: {
    id: string;
    name: string;
    species: string;
    breed?: string;
    dob?: string;
  };
  provider: {
    id: string;
    name: string;
  };
  appointment_type: {
    id: string;
    name: string;
    duration_minutes: number;
  };
  start_time: string;
  end_time: string;
  status:
    | 'scheduled'
    | 'confirmed'
    | 'checked_in'
    | 'completed'
    | 'no_show'
    | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ShepherdPaginatedResponse<T> {
  data: T[];
  next_cursor?: string;
  total_count?: number;
}

export class ShepherdApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public body?: unknown
  ) {
    super(message);
    this.name = 'ShepherdApiError';
  }
}

async function shepherdFetch(
  path: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${SHEPHERD_API_BASE}${path}`;
  const resp = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return resp;
}

/**
 * Fetch appointments updated since `since`, paginating through all pages.
 * Returns a flat array of all appointments.
 */
export async function fetchAppointments(
  accessToken: string,
  options: {
    since?: Date;
    cursor?: string;
    limit?: number;
    practiceId?: string;
  } = {}
): Promise<ShepherdPaginatedResponse<ShepherdAppointment>> {
  const params = new URLSearchParams();
  if (options.since) params.set('updated_since', options.since.toISOString());
  if (options.cursor) params.set('cursor', options.cursor);
  params.set('limit', String(options.limit ?? 100));
  if (options.practiceId) params.set('practice_id', options.practiceId);

  const resp = await shepherdFetch(`/appointments?${params}`, accessToken);

  if (resp.status === 429) {
    throw new ShepherdApiError('Rate limited', 429);
  }

  if (!resp.ok) {
    const body = await resp.text().catch(() => null);
    throw new ShepherdApiError(`Shepherd API error: ${resp.status}`, resp.status, body);
  }

  return resp.json();
}

/**
 * Fetch a single appointment by ID.
 */
export async function fetchAppointment(
  accessToken: string,
  shepherdAppointmentId: string
): Promise<ShepherdAppointment> {
  const resp = await shepherdFetch(
    `/appointments/${shepherdAppointmentId}`,
    accessToken
  );

  if (!resp.ok) {
    throw new ShepherdApiError(`Failed to fetch appointment ${shepherdAppointmentId}`, resp.status);
  }

  const data = await resp.json();
  return data.data ?? data;
}

/**
 * Get the practice profile (used to get the Shepherd practice_id after OAuth).
 */
export async function fetchPracticeProfile(
  accessToken: string
): Promise<{ id: string; name: string }> {
  const resp = await shepherdFetch('/practice', accessToken);
  if (!resp.ok) throw new ShepherdApiError('Failed to fetch practice profile', resp.status);
  const data = await resp.json();
  return data.data ?? data;
}

/**
 * Patch an appointment status (used for write-sync: VetSteady → Shepherd).
 */
export async function updateAppointmentStatus(
  accessToken: string,
  shepherdAppointmentId: string,
  status: string
): Promise<void> {
  const resp = await shepherdFetch(
    `/appointments/${shepherdAppointmentId}`,
    accessToken,
    { method: 'PATCH', body: JSON.stringify({ status }) }
  );
  if (!resp.ok) {
    throw new ShepherdApiError(`Failed to update appointment ${shepherdAppointmentId}`, resp.status);
  }
}
