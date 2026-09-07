import { findEnabledProviderAccounts } from '@/core/sync/find-accounts';
import { ensureRegisteredAccountsFromEnv } from '@/core/sync/ensure-accounts';
import type { AccountSyncResult } from '@/core/sync/run-account-sync';
import { runAccountSyncBatch } from '@/core/sync/run-sync-batch';
import { getYesterdayUtc } from '@/shared/dates';
import type { RegisteredProviderKey } from '@/shared/registered-providers';

/**
 * Fetches the previous UTC day and marks CostEntry rows FINAL / not partial.
 */
export async function reconcileYesterday(input: {
  now?: Date;
  providerKey: RegisteredProviderKey;
}): Promise<AccountSyncResult[]> {
  const now = input.now ?? new Date();
  await ensureRegisteredAccountsFromEnv();
  const yesterday = getYesterdayUtc(now);
  const accounts = await findEnabledProviderAccounts(input.providerKey);
  return runAccountSyncBatch({
    accountIds: accounts.map((account) => account.id),
    range: { from: yesterday, to: yesterday },
    mode: 'reconcile',
    now,
  });
}
