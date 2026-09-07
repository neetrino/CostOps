import { utcDayKey } from '@/shared/dates';
import type { UpstashTimeSeriesPoint } from '@/providers/upstash/schemas';

/**
 * Upstash series `x` is a UTC timestamp like `2026-09-07 09:50:16.123 +0000 UTC`.
 * Calendar day is the first 10 characters.
 */
export function upstashSeriesUtcDayKey(x: string): string {
  const day = x.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new Error('Invalid Upstash series timestamp');
  }
  return day;
}

/**
 * Sum `y` for one UTC day. `null` when the series does not include that day
 * (Redis window is shorter than a month — do not invent $0).
 */
export function sumSeriesForUtcDay(
  points: readonly UpstashTimeSeriesPoint[],
  utcDay: Date,
): number | null {
  const dayKey = utcDayKey(utcDay);
  let found = false;
  let total = 0;
  for (const point of points) {
    if (upstashSeriesUtcDayKey(point.x) !== dayKey) {
      continue;
    }
    found = true;
    total += point.y;
  }
  return found ? total : null;
}
