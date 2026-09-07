import { DEFAULT_SYNC_INTERVAL_MINUTES } from '@/config/constants';
import { tryGetAdapter } from '@/providers/registry';

export type DueAccountInput = {
  providerKey: string;
  lastSuccessfulSyncAt: Date | null;
  recommendedSyncIntervalMinutes: number | null;
};

export function isAccountDue(account: DueAccountInput, now: Date): boolean {
  const adapter = tryGetAdapter(account.providerKey);
  if (!adapter) {
    return false;
  }
  const interval =
    account.recommendedSyncIntervalMinutes ??
    adapter.recommendedSyncIntervalMinutes ??
    DEFAULT_SYNC_INTERVAL_MINUTES;
  if (!account.lastSuccessfulSyncAt) {
    return true;
  }
  const elapsedMs = now.getTime() - account.lastSuccessfulSyncAt.getTime();
  return elapsedMs >= interval * 60_000;
}
