import { findEnabledProviderAccounts } from '@/core/sync/find-accounts';
import { ensureRegisteredAccountsFromEnv } from '@/core/sync/ensure-accounts';
import { runAccountSync, type AccountSyncResult } from '@/core/sync/run-account-sync';
import { getYesterdayUtc } from '@/shared/dates';

/**
 * Fetches the previous UTC day and marks CostEntry rows FINAL / not partial.
 */
export async function reconcileYesterday(now: Date = new Date()): Promise<AccountSyncResult[]> {
  await ensureRegisteredAccountsFromEnv();
  const yesterday = getYesterdayUtc(now);
  const accounts = await findEnabledProviderAccounts();
  const results: AccountSyncResult[] = [];
  for (const account of accounts) {
    results.push(
      await runAccountSync({
        accountId: account.id,
        range: { from: yesterday, to: yesterday },
        mode: 'reconcile',
        now,
      }),
    );
  }
  return results;
}
