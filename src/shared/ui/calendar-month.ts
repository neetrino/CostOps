import { addUtcDays, parseIsoDateOnly, startOfUtcMonth, utcDayKey } from '@/shared/dates';

/** Monday-first labels for the CostOps calendar grid. */
export const UTC_WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

const DAYS_IN_GRID = 42;
const MONDAY = 1;

export type CalendarDayCell = {
  dayKey: string;
  day: number;
  inCurrentMonth: boolean;
};

/** First UTC day of the month that contains `dayKey` (`YYYY-MM-DD`). */
export function utcMonthFromDayKey(dayKey: string): Date {
  return startOfUtcMonth(parseIsoDateOnly(dayKey));
}

/** Shift a UTC month by `delta` calendar months. */
export function shiftUtcMonth(month: Date, delta: number): Date {
  return new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + delta, 1));
}

/** Shift a UTC day key by `days`. */
export function shiftUtcDayKey(dayKey: string, days: number): string {
  return utcDayKey(addUtcDays(parseIsoDateOnly(dayKey), days));
}

/**
 * Six Monday-start weeks covering `month`, including leading/trailing days
 * from adjacent months. All keys are UTC calendar days.
 */
export function buildUtcMondayGrid(month: Date): CalendarDayCell[] {
  const first = startOfUtcMonth(month);
  const weekday = first.getUTCDay();
  const leading = (weekday - MONDAY + 7) % 7;
  const start = addUtcDays(first, -leading);
  const cells: CalendarDayCell[] = [];
  for (let index = 0; index < DAYS_IN_GRID; index += 1) {
    const date = addUtcDays(start, index);
    cells.push({
      dayKey: utcDayKey(date),
      day: date.getUTCDate(),
      inCurrentMonth: date.getUTCMonth() === first.getUTCMonth(),
    });
  }
  return cells;
}

/** Compact trigger label, e.g. `10 Sep 2026`. */
export function formatUtcDayLabel(dayKey: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatToParts(parseIsoDateOnly(dayKey));
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  return `${day} ${month} ${year}`;
}

/** Calendar header parts for a UTC month. */
export function formatUtcMonthTitle(month: Date): { month: string; year: string } {
  return {
    month: new Intl.DateTimeFormat('en-US', {
      month: 'long',
      timeZone: 'UTC',
    }).format(month),
    year: String(month.getUTCFullYear()),
  };
}
