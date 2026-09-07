import { eachUtcDay, getStartOfTodayUtc, isSameUtcDay } from '@/shared/dates';

export type BackfillDayPlan = {
  day: Date;
  mode: 'intraday' | 'reconcile';
};

export function planBackfillDays(from: Date, to: Date, now: Date): BackfillDayPlan[] {
  const today = getStartOfTodayUtc(now);
  return eachUtcDay(from, to).map((day) => ({
    day,
    mode: isSameUtcDay(day, today) ? 'intraday' : 'reconcile',
  }));
}
