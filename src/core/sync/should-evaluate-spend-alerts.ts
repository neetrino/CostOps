import { getYesterdayUtc, isSameUtcDay } from '@/shared/dates';

/**
 * Alerts run after today or yesterday reconcile — not historical backfill days.
 */
export function shouldEvaluateSpendAlerts(budgetDate: Date, now: Date): boolean {
  return isSameUtcDay(budgetDate, now) || isSameUtcDay(budgetDate, getYesterdayUtc(now));
}
