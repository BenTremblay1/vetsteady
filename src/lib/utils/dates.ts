import { format, parseISO, addMinutes } from 'date-fns';

/** Format a UTC ISO string for display (naive — use with practice timezone) */
export function formatApptTime(isoString: string): string {
  return format(parseISO(isoString), 'h:mm a');
}

export function formatApptDate(isoString: string): string {
  return format(parseISO(isoString), 'EEEE, MMMM d, yyyy');
}

export function formatApptDateShort(isoString: string): string {
  return format(parseISO(isoString), 'MMM d, yyyy');
}

/** Compute ends_at from starts_at + duration in minutes */
export function computeEndsAt(startsAt: string, durationMinutes: number): string {
  return addMinutes(parseISO(startsAt), durationMinutes).toISOString();
}
