import { z } from 'zod';
import { MAX_BACKFILL_DAYS } from '@/config/constants';
import { findEnabledProviderAccounts } from '@/core/sync/find-accounts';
import { planBackfillDays } from '@/core/sync/plan-backfill-days';
import { runAccountSync, type AccountSyncResult } from '@/core/sync/run-account-sync';
import { ProviderKey } from '@/generated/prisma/enums';
import { tryGetAdapter } from '@/providers/registry';
import { parseIsoDateOnly } from '@/shared/dates';

export const backfillBodySchema = z.object({
  providerKey: z.nativeEnum(ProviderKey),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type ProviderBackfillResult =
  | { ok: true; results: AccountSyncResult[] }
  | { ok: false; code: 'UNSUPPORTED' | 'NOT_FOUND' | 'RANGE'; message: string };

export async function runProviderBackfill(input: {
  providerKey: ProviderKey;
  from: Date;
  to: Date;
  now?: Date;
}): Promise<ProviderBackfillResult> {
  const now = input.now ?? new Date();
  const adapter = tryGetAdapter(input.providerKey);
  if (!adapter?.supportsBackfill) {
    return { ok: false, code: 'UNSUPPORTED', message: 'Provider does not support backfill' };
  }
  const days = planBackfillDays(input.from, input.to, now);
  if (days.length === 0) {
    return { ok: false, code: 'RANGE', message: 'from must be <= to' };
  }
  if (days.length > MAX_BACKFILL_DAYS) {
    return {
      ok: false,
      code: 'RANGE',
      message: `Backfill is limited to ${MAX_BACKFILL_DAYS} days`,
    };
  }
  const accounts = (await findEnabledProviderAccounts()).filter(
    (account) => account.providerKey === input.providerKey,
  );
  if (accounts.length === 0) {
    return { ok: false, code: 'NOT_FOUND', message: 'No enabled account for this provider' };
  }
  const results: AccountSyncResult[] = [];
  for (const account of accounts) {
    for (const planned of days) {
      results.push(
        await runAccountSync({
          accountId: account.id,
          range: { from: planned.day, to: planned.day },
          mode: planned.mode,
          now,
        }),
      );
    }
  }
  return { ok: true, results };
}

export function parseBackfillRange(from: string, to: string): { from: Date; to: Date } {
  return { from: parseIsoDateOnly(from), to: parseIsoDateOnly(to) };
}
