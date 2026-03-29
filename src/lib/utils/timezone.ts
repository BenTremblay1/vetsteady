/**
 * Returns the offset from UTC for a given IANA timezone on a given date.
 * e.g. 'America/New_York' on 2026-03-29 → -4 (EDT, UTC-4)
 *      'America/New_York' on 2026-01-15 → -5 (EST, UTC-5)
 *      'UTC' → 0
 */
export function getTimezoneOffsetMinutes(tz: string, date: Date): number {
  try {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
    return (utcDate.getTime() - tzDate.getTime()) / 60_000;
  } catch {
    return 0;
  }
}
