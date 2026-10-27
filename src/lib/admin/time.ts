/**
 * Calendar days in Europe/Amsterdam for the admin reports.
 *
 * "Vandaag", "de laatste 7 dagen" and a daily chart all mean Dutch calendar
 * days, not rolling 24-hour blocks counted back from the server clock (which
 * runs in UTC). A window of N days is today plus the N-1 full days before it,
 * so the headline total and the bars of the daily chart cover exactly the
 * same rows.
 */

export const ADMIN_TIMEZONE = 'Europe/Amsterdam';

const DAY_MS = 24 * 60 * 60 * 1000;

const PARTS = new Intl.DateTimeFormat('en-GB', {
  timeZone: ADMIN_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

/** Amsterdam's offset from UTC at this instant, in ms (+1h or +2h). */
function offsetMs(instant: number): number {
  const parts = Object.fromEntries(PARTS.formatToParts(new Date(instant)).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((asUtc - Math.floor(instant / 1000) * 1000) / 60000) * 60000;
}

/** `YYYY-MM-DD` of the Amsterdam calendar day this instant falls on. */
export function amsterdamDayKey(date: Date | number = Date.now()): string {
  return new Date(date).toLocaleDateString('en-CA', { timeZone: ADMIN_TIMEZONE });
}

/** The `YYYY-MM-DD` key `days` calendar days after (negative: before) `key`. */
export function shiftDayKey(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + days));
  return shifted.toISOString().slice(0, 10);
}

/** The instant Amsterdam midnight starts the day `key` (DST-safe). */
export function startOfAmsterdamDay(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d);
  // Two passes: the offset at "UTC midnight" can differ from the offset at
  // the local midnight only on a DST day, and the second pass settles it.
  const first = guess - offsetMs(guess);
  return new Date(guess - offsetMs(first));
}

/** Start of today in Amsterdam. */
export function startOfAmsterdamToday(now: Date | number = Date.now()): Date {
  return startOfAmsterdamDay(amsterdamDayKey(now));
}

/**
 * Start of an N-day window that ends now: Amsterdam midnight of the day
 * N-1 days before today. `windowDays` 1 is "today".
 */
export function amsterdamWindowStart(windowDays: number, now: Date | number = Date.now()): Date {
  const days = Math.max(1, Math.floor(windowDays));
  return startOfAmsterdamDay(shiftDayKey(amsterdamDayKey(now), -(days - 1)));
}

/** The day keys of that window, oldest first. */
export function amsterdamWindowDays(windowDays: number, now: Date | number = Date.now()): string[] {
  const days = Math.max(1, Math.floor(windowDays));
  const today = amsterdamDayKey(now);
  return Array.from({ length: days }, (_, index) => shiftDayKey(today, index - (days - 1)));
}

/** "26 okt" for a day key, as the chart axis prints it. */
export function dayKeyLabel(key: string): string {
  // Noon UTC is the same calendar day in Amsterdam all year round.
  return new Date(`${key}T12:00:00Z`).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    timeZone: ADMIN_TIMEZONE,
  });
}

export { DAY_MS };
