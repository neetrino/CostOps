import { SYNC_NOW_RATE_LIMIT_PER_MINUTE, SYNC_NOW_RATE_WINDOW_MS } from '@/config/constants';

const hitsByIp = new Map<string, number[]>();

export function consumeSyncNowAttempt(ip: string): boolean {
  const now = Date.now();
  const recent = (hitsByIp.get(ip) ?? []).filter((stamp) => now - stamp < SYNC_NOW_RATE_WINDOW_MS);
  if (recent.length >= SYNC_NOW_RATE_LIMIT_PER_MINUTE) {
    hitsByIp.set(ip, recent);
    return false;
  }
  recent.push(now);
  hitsByIp.set(ip, recent);
  return true;
}

export function resetSyncNowRateLimit(): void {
  hitsByIp.clear();
}
