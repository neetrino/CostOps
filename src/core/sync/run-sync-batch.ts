import { CRON_MAX_DURATION_SECONDS, SYNC_BATCH_RESERVE_SECONDS } from '@/config/constants';
import { evaluateSpendAlertsForDay } from '@/core/alerts/evaluate-spend';
import {
  runAccountSync,
  type AccountSyncResult,
  type SyncMode,
} from '@/core/sync/run-account-sync';
import { shouldEvaluateSpendAlerts } from '@/core/sync/should-evaluate-spend-alerts';
import { logger } from '@/shared/logger';
import type { DateRange } from '@/providers/types';

async function evaluateSpendAlertsFromStoredDay(budgetDate: Date, now: Date): Promise<void> {
  if (!shouldEvaluateSpendAlerts(budgetDate, now)) {
    return;
  }
  try {
    await evaluateSpendAlertsForDay({
      budgetDate,
      lastSyncAt: now,
      now,
    });
  } catch (error) {
    logger.error({ err: error }, 'Spend alert evaluation failed before sync batch');
  }
}

/**
 * Syncs accounts sequentially and stops before the Vercel function hard-timeout.
 * Evaluates stored today/yesterday spend first so a timeout mid-pull still alerts.
 */
export async function runAccountSyncBatch(input: {
  accountIds: string[];
  range: DateRange;
  mode: SyncMode;
  now?: Date;
  startedAt?: number;
  deadlineMs?: number;
  reserveMs?: number;
}): Promise<AccountSyncResult[]> {
  const now = input.now ?? new Date();
  const startedAt = input.startedAt ?? now.getTime();
  const deadlineMs = input.deadlineMs ?? CRON_MAX_DURATION_SECONDS * 1000;
  const reserveMs = input.reserveMs ?? SYNC_BATCH_RESERVE_SECONDS * 1000;
  await evaluateSpendAlertsFromStoredDay(input.range.from, now);
  const results: AccountSyncResult[] = [];

  for (const accountId of input.accountIds) {
    if (results.length > 0 && Date.now() - startedAt > deadlineMs - reserveMs) {
      logger.warn(
        { remainingAccountIds: input.accountIds.slice(results.length) },
        'Sync batch stopped to avoid function timeout',
      );
      break;
    }
    results.push(
      await runAccountSync({
        accountId,
        range: input.range,
        mode: input.mode,
        now,
      }),
    );
  }
  return results;
}
