import type { GroupBy } from '@/shared/dashboard-query';
import { addUtcDays, toUtcDateOnly, utcDayKey } from '@/shared/dates';

/** UTC Monday of the week containing `date`. */
export function utcMonday(date: Date): Date {
  const day = toUtcDateOnly(date);
  const weekday = day.getUTCDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  return addUtcDays(day, offset);
}

export function monthKey(date: Date): string {
  return utcDayKey(date).slice(0, 7);
}

export function periodKeyForDate(date: Date, groupBy: GroupBy): string {
  if (groupBy === 'month') {
    return monthKey(date);
  }
  if (groupBy === 'week') {
    return utcDayKey(utcMonday(date));
  }
  return utcDayKey(date);
}

export function daysInUtcMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function periodHoursForKey(period: string, groupBy: GroupBy): number {
  if (groupBy === 'week') {
    return 7 * 24;
  }
  if (groupBy === 'month') {
    const [year, month] = period.split('-').map(Number);
    return daysInUtcMonth(year, month - 1) * 24;
  }
  return 24;
}

export function enumeratePeriodKeys(from: Date, to: Date, groupBy: GroupBy): string[] {
  if (groupBy === 'month') {
    return enumerateMonthKeys(from, to);
  }
  if (groupBy === 'week') {
    return enumerateWeekKeys(from, to);
  }
  return enumerateDayKeys(from, to);
}

function enumerateDayKeys(from: Date, to: Date): string[] {
  const keys: string[] = [];
  let cursor = toUtcDateOnly(from);
  const end = toUtcDateOnly(to);
  while (cursor <= end) {
    keys.push(utcDayKey(cursor));
    cursor = addUtcDays(cursor, 1);
  }
  return keys;
}

function enumerateWeekKeys(from: Date, to: Date): string[] {
  const keys: string[] = [];
  let cursor = utcMonday(from);
  const end = utcMonday(to);
  while (cursor <= end) {
    keys.push(utcDayKey(cursor));
    cursor = addUtcDays(cursor, 7);
  }
  return keys;
}

function enumerateMonthKeys(from: Date, to: Date): string[] {
  const keys: string[] = [];
  let year = from.getUTCFullYear();
  let month = from.getUTCMonth();
  const endYear = to.getUTCFullYear();
  const endMonth = to.getUTCMonth();
  while (year < endYear || (year === endYear && month <= endMonth)) {
    keys.push(`${year}-${String(month + 1).padStart(2, '0')}`);
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return keys;
}
