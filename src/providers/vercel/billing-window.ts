import { VERCEL_BILLING_TIME_ZONE } from '@/config/constants';
import { addUtcDays, utcDayKey } from '@/shared/dates';

/**
 * Vercel FOCUS ChargePeriodStart is midnight in America/Los_Angeles (07:00Z PDT / 08:00Z PST).
 * CostOps UTC day D maps to that Pacific billing date, not UTC midnight-to-midnight.
 */
export function vercelBillingWindowUtc(utcDay: Date): { from: Date; to: Date } {
  const startKey = utcDayKey(utcDay);
  const endKey = utcDayKey(addUtcDays(utcDay, 1));
  return {
    from: zonedCalendarMidnightToUtc(startKey, VERCEL_BILLING_TIME_ZONE),
    to: zonedCalendarMidnightToUtc(endKey, VERCEL_BILLING_TIME_ZONE),
  };
}

export function zonedCalendarMidnightToUtc(dateKey: string, timeZone: string): Date {
  const utcMidnight = new Date(`${dateKey}T00:00:00.000Z`);
  const offsetMinutes = timeZoneOffsetMinutes(utcMidnight, timeZone);
  return new Date(utcMidnight.getTime() - offsetMinutes * 60_000);
}

function timeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const value = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
  );
  const asUtc = Date.UTC(
    Number(value.year),
    Number(value.month) - 1,
    Number(value.day),
    Number(value.hour),
    Number(value.minute),
    Number(value.second),
  );
  return (asUtc - date.getTime()) / 60_000;
}
