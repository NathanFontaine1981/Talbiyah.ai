// Timezone-aware formatting for lesson / session times.
//
// Lesson times are stored as UTC `timestamptz` values. They must be displayed
// in the *user's* chosen timezone (profiles.timezone), NOT the browser's local
// timezone — otherwise a teacher whose device clock is on the wrong zone (e.g.
// travelling, VPN, mis-set OS clock) sees the wrong wall-clock time.
//
// Uses the native Intl `timeZone` option (supports IANA zones like
// "Africa/Cairo"), so no extra date library dependency is required.
//
// The time formatters append a friendly zone label (e.g. "1:00 PM (Cairo)") so
// users across timezones are never confused about which clock a time refers to.

function toDate(value: string | number | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

/** The timezone to display in: the user's saved zone, or the browser zone as a fallback. */
export function resolveTimeZone(timeZone?: string | null): string {
  return timeZone && timeZone.length > 0
    ? timeZone
    : Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Friendly city label from an IANA zone, e.g. "Africa/Cairo" -> "Cairo", "Europe/London" -> "London". */
export function timeZoneCity(timeZone?: string | null): string {
  const tz = resolveTimeZone(timeZone);
  const city = tz.includes('/') ? tz.split('/').pop()! : tz;
  return city.replace(/_/g, ' ');
}

/** Short timezone abbreviation for the given instant, e.g. "BST", "GMT+3". */
export function timeZoneLabel(
  value: string | number | Date,
  timeZone?: string | null,
): string {
  const tz = resolveTimeZone(timeZone);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    timeZoneName: 'short',
  }).formatToParts(toDate(value));
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
}

/** 24-hour clock with zone label, e.g. "13:00 (Cairo)". */
export function formatLessonTime(
  value: string | number | Date,
  timeZone?: string | null,
): string {
  const tz = resolveTimeZone(timeZone);
  const time = toDate(value).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tz,
  });
  return `${time} (${timeZoneCity(tz)})`;
}

/** 12-hour clock with zone label, e.g. "1:00 PM (Cairo)". */
export function formatLessonTime12(
  value: string | number | Date,
  timeZone?: string | null,
): string {
  const tz = resolveTimeZone(timeZone);
  const time = toDate(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: tz,
  });
  return `${time} (${timeZoneCity(tz)})`;
}

/**
 * Date in the user's timezone. Defaults to "Jun 20, 2026" (matches date-fns
 * 'MMM d, yyyy'); pass `options` to override (e.g. weekday/short forms).
 * No zone label — dates rarely cross a day boundary in practice and a label
 * would be noise; the accompanying time carries the zone.
 */
export function formatLessonDate(
  value: string | number | Date,
  timeZone?: string | null,
  options?: Intl.DateTimeFormatOptions,
): string {
  return toDate(value).toLocaleDateString('en-US', {
    ...(options ?? { month: 'short', day: 'numeric', year: 'numeric' }),
    timeZone: resolveTimeZone(timeZone),
  });
}
