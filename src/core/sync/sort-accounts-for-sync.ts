const PROVIDER_SYNC_ORDER: Record<string, number> = {
  NEON: 0,
  UPSTASH: 1,
  VERCEL: 2,
  HETZNER: 3,
};

/**
 * Fast adapters first so spend alerts can run before a slow Vercel pull times out.
 */
export function sortProviderAccountsForSync<T extends { providerKey: string }>(accounts: T[]): T[] {
  return [...accounts].sort((left, right) => {
    const leftRank = PROVIDER_SYNC_ORDER[left.providerKey] ?? 50;
    const rightRank = PROVIDER_SYNC_ORDER[right.providerKey] ?? 50;
    return leftRank - rightRank;
  });
}
