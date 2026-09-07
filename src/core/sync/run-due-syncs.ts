import { evaluateCredentialExpiryForAccounts } from '@/core/alerts/run-credential-expiry';
import { findDueProviderAccounts, findEnabledProviderAccounts } from '@/core/sync/find-accounts';
import { ensureRegisteredAccountsFromEnv } from '@/core/sync/ensure-accounts';
import { currentDayRange, type AccountSyncResult } from '@/core/sync/run-account-sync';
import { runAccountSyncBatch } from '@/core/sync/run-sync-batch';
import { logger } from '@/shared/logger';
import type { RegisteredProviderKey } from '@/shared/registered-providers';

export async function runDueAccountSyncs(input: {
  now?: Date;
  providerKey: RegisteredProviderKey;
}): Promise<AccountSyncResult[]> {
  const now = input.now ?? new Date();
  await ensureRegisteredAccountsFromEnv();
  try {
    await evaluateCredentialExpiryForAccounts(now);
  } catch (error) {
    logger.error({ err: error }, 'Credential expiry evaluation failed');
  }

  const due = await findDueProviderAccounts(now, input.providerKey);
  return runAccountSyncBatch({
    accountIds: due.map((account) => account.id),
    range: currentDayRange(now),
    mode: 'intraday',
    now,
  });
}

export async function runForcedAccountSyncs(input: {
  now?: Date;
  providerKey: RegisteredProviderKey;
}): Promise<AccountSyncResult[]> {
  const now = input.now ?? new Date();
  await ensureRegisteredAccountsFromEnv();
  const accounts = await findEnabledProviderAccounts(input.providerKey);
  return runAccountSyncBatch({
    accountIds: accounts.map((account) => account.id),
    range: currentDayRange(now),
    mode: 'intraday',
    now,
  });
}
