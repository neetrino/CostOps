import { evaluateCredentialExpiryForAccounts } from '@/core/alerts/run-credential-expiry';
import { findDueProviderAccounts, findEnabledProviderAccounts } from '@/core/sync/find-accounts';
import { ensureRegisteredAccountsFromEnv } from '@/core/sync/ensure-accounts';
import { currentDayRange, type AccountSyncResult } from '@/core/sync/run-account-sync';
import { runAccountSyncBatch } from '@/core/sync/run-sync-batch';
import { logger } from '@/shared/logger';

export async function runDueAccountSyncs(now: Date = new Date()): Promise<AccountSyncResult[]> {
  await ensureRegisteredAccountsFromEnv();
  try {
    await evaluateCredentialExpiryForAccounts(now);
  } catch (error) {
    logger.error({ err: error }, 'Credential expiry evaluation failed');
  }

  const due = await findDueProviderAccounts(now);
  return runAccountSyncBatch({
    accountIds: due.map((account) => account.id),
    range: currentDayRange(now),
    mode: 'intraday',
    now,
  });
}

export async function runForcedAccountSyncs(now: Date = new Date()): Promise<AccountSyncResult[]> {
  await ensureRegisteredAccountsFromEnv();
  const accounts = await findEnabledProviderAccounts();
  return runAccountSyncBatch({
    accountIds: accounts.map((account) => account.id),
    range: currentDayRange(now),
    mode: 'intraday',
    now,
  });
}
