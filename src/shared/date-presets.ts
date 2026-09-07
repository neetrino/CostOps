import { addUtcDays, parseIsoDateOnly, utcDayKey } from '@/shared/dates';

export type RollingDayPreset = '1' | '7' | '30' | '60';
export type DatePreset = 'current_month' | 'previous_month' | RollingDayPreset | 'custom';

export const DATE_PRESETS = [
  'current_month',
  'previous_month',
  '1',
  '7',
  '30',
  '60',
  'custom',
] as const;

export const ROLLING_DAY_PRESETS: readonly RollingDayPreset[] = ['1', '7', '30', '60'];

/** Inclusive UTC date range as YYYY-MM-DD. */
export function rangeLastDays(days: number, now: Date = new Date()): { from: string; to: string } {
  const end = utcToday(now);
  const start = addDays(end, -(days - 1));
  return { from: start, to: end };
}

export function rangeCurrentMonthUtc(now: Date = new Date()): { from: string; to: string } {
  const today = utcToday(now);
  const [year, month] = today.split('-').map(Number);
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  return { from, to: today };
}

export function rangePreviousMonthUtc(now: Date = new Date()): { from: string; to: string } {
  const today = utcToday(now);
  const [year, month] = today.split('-').map(Number);
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const from = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
  const daysInPrevMonth = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate();
  const to = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(daysInPrevMonth).padStart(2, '0')}`;
  return { from, to };
}

export function utcToday(now: Date = new Date()): string {
  return utcDayKey(now);
}

/** Single UTC calendar day (inclusive). */
export function rangeSingleDayUtc(dayIso: string): { from: string; to: string } {
  return { from: dayIso, to: dayIso };
}

/**
 * Resolve a non-custom preset to an inclusive UTC from/to pair.
 */
export function resolveDatePreset(
  preset: Exclude<DatePreset, 'custom'>,
  now: Date = new Date(),
): { from: string; to: string } {
  switch (preset) {
    case 'current_month':
      return rangeCurrentMonthUtc(now);
    case 'previous_month':
      return rangePreviousMonthUtc(now);
    case '1':
      return rangeLastDays(1, now);
    case '7':
      return rangeLastDays(7, now);
    case '30':
      return rangeLastDays(30, now);
    case '60':
      return rangeLastDays(60, now);
  }
}

export function isRollingDayPreset(preset: string): preset is RollingDayPreset {
  return (ROLLING_DAY_PRESETS as readonly string[]).includes(preset);
}

function addDays(iso: string, delta: number): string {
  return utcDayKey(addUtcDays(parseIsoDateOnly(iso), delta));
}
