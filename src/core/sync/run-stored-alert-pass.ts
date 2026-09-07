import { evaluateSpendAlertsForDay } from '@/core/alerts/evaluate-spend';
import { getStartOfTodayUtc } from '@/shared/dates';

/**
 * Telegram pass over spend already in the DB. No provider pull.
 */
export async function runStoredSpendAlertPass(now: Date = new Date()): Promise<void> {
  await evaluateSpendAlertsForDay({
    budgetDate: getStartOfTodayUtc(now),
    lastSyncAt: now,
    now,
  });
}
