import { revalidateTag, unstable_cache } from 'next/cache';
import type { ResolvedDashboardQuery } from '@/shared/dashboard-query';

/** Shared tag for every dashboard read. Writes and syncs bust the whole set. */
export const DASHBOARD_READS_TAG = 'dashboard-reads';

/**
 * Next.js 16 requires a cacheLife profile. `max` expires the tag immediately
 * for the next request; CostOps then rebuilds from Postgres.
 */
const REVALIDATE_PROFILE = 'max';

export function dashboardReadCacheKey(query: ResolvedDashboardQuery): string {
  return [
    query.fromKey,
    query.toKey,
    query.preset,
    query.groupBy,
    query.projectId ?? '',
    query.providerKey ?? '',
    query.metric,
  ].join('|');
}

/**
 * Persist a JSON-serializable dashboard read until the next write or sync.
 */
export function cacheDashboardRead<T>(
  scope: string,
  key: string,
  load: () => Promise<T>,
): Promise<T> {
  return unstable_cache(load, [scope, key], { tags: [DASHBOARD_READS_TAG] })();
}

export function revalidateDashboardReads(): void {
  revalidateTag(DASHBOARD_READS_TAG, REVALIDATE_PROFILE);
}
