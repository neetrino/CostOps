/** Normalizes a Date to UTC midnight (calendar date for @db.Date). */
export function toUtcDateOnly(input: Date): Date {
  return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
}

/** Calendar "yesterday" in UTC relative to `now`. */
export function getYesterdayUtc(now: Date = new Date()): Date {
  const day = new Date(now);
  day.setUTCDate(day.getUTCDate() - 1);
  return toUtcDateOnly(day);
}

/** Start of the current UTC calendar day (00:00:00.000Z). */
export function getStartOfTodayUtc(now: Date = new Date()): Date {
  return toUtcDateOnly(now);
}

export function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return toUtcDateOnly(next);
}

/** Inclusive UTC calendar days from `from` through `to`. Empty when from > to. */
export function eachUtcDay(from: Date, to: Date): Date[] {
  const start = toUtcDateOnly(from);
  const end = toUtcDateOnly(to);
  const days: Date[] = [];
  for (let cursor = start; cursor.getTime() <= end.getTime(); cursor = addUtcDays(cursor, 1)) {
    days.push(cursor);
  }
  return days;
}

export function parseIsoDateOnly(iso: string): Date {
  const day = iso.slice(0, 10);
  const [year, month, date] = day.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, date));
}

export function utcDayKey(date: Date): string {
  return toUtcDateOnly(date).toISOString().slice(0, 10);
}

export function isSameUtcDay(left: Date, right: Date): boolean {
  return utcDayKey(left) === utcDayKey(right);
}

export function formatUtcClock(date: Date): string {
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes} UTC`;
}
