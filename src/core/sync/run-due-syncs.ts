import { evaluateCredentialExpiryForAccounts } from '@/core/alerts/run-credential-expiry';
import { findDueProviderAccounts, findEnabledProviderAccounts } from '@/core/sync/find-accounts';
import { ensureNeonAccountFromEnv } from '@/core/sync/ensure-neon-account';
import {
  currentDayRange,
  runAccountSync,
  type AccountSyncResult,
} from '@/core/sync/run-account-sync';
import { logger } from '@/shared/logger';

export async function runDueAccountSyncs(now: Date = new Date()): Promise<AccountSyncResult[]> {
  await ensureNeonAccountFromEnv();
  try {
    await evaluateCredentialExpiryForAccounts(now);
  } catch (error) {
    logger.error({ err: error }, 'Credential expiry evaluation failed');
  }

  const due = await findDueProviderAccounts(now);
  const results: AccountSyncResult[] = [];
  for (const account of due) {
    results.push(
      await runAccountSync({
        accountId: account.id,
        range: currentDayRange(now),
        mode: 'intraday',
        now,
      }),
    );
  }
  return results;
}

export async function runForcedAccountSyncs(now: Date = new Date()): Promise<AccountSyncResult[]> {
  await ensureNeonAccountFromEnv();
  const accounts = await findEnabledProviderAccounts();
  const results: AccountSyncResult[] = [];
  for (const account of accounts) {
    results.push(
      await runAccountSync({
        accountId: account.id,
        range: currentDayRange(now),
        mode: 'intraday',
        now,
      }),
    );
  }
  return results;
}
