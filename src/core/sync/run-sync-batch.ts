import { CRON_MAX_DURATION_SECONDS, SYNC_BATCH_RESERVE_SECONDS } from '@/config/constants';
import {
  runAccountSync,
  type AccountSyncResult,
  type SyncMode,
} from '@/core/sync/run-account-sync';
import { logger } from '@/shared/logger';
import type { DateRange } from '@/providers/types';

/**
 * Syncs accounts sequentially and stops before the Vercel function hard-timeout.
 * Already-finished accounts keep SUCCESS + spend alerts.
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
