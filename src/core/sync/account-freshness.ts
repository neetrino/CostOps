import { DEFAULT_SYNC_INTERVAL_MINUTES, STALE_INTERVAL_MULTIPLIER } from '@/config/constants';
import type { Freshness } from '@/providers/types';
import { tryGetAdapter } from '@/providers/registry';

export function accountFreshness(input: {
  lastSuccessfulSyncAt: Date | null;
  lastErrorAt: Date | null;
  recommendedSyncIntervalMinutes: number | null;
  providerKey: string;
  now: Date;
}): Freshness {
  if (
    input.lastErrorAt &&
    (!input.lastSuccessfulSyncAt || input.lastErrorAt > input.lastSuccessfulSyncAt)
  ) {
    return 'error';
  }
  if (!input.lastSuccessfulSyncAt) {
    return 'missing';
  }
  const adapter = tryGetAdapter(input.providerKey);
  const interval =
    input.recommendedSyncIntervalMinutes ??
    adapter?.recommendedSyncIntervalMinutes ??
    DEFAULT_SYNC_INTERVAL_MINUTES;
  const staleAfterMs = interval * 60_000 * STALE_INTERVAL_MULTIPLIER;
  if (input.now.getTime() - input.lastSuccessfulSyncAt.getTime() > staleAfterMs) {
    return 'stale';
  }
  return 'fresh';
}
