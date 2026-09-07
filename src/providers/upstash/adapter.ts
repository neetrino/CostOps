import { DEFAULT_SYNC_INTERVAL_MINUTES } from '@/config/constants';
import { upstashCredentialMeta } from '@/providers/upstash/credentials';
import { listUpstashResources, loadUpstashDay } from '@/providers/upstash/load-day';
import type {
  CostProviderAdapter,
  DateRange,
  NormalizedCost,
  NormalizedMetric,
  ProviderContext,
  ResourceSyncResult,
} from '@/providers/types';

export const upstashAdapter: CostProviderAdapter = {
  providerKey: 'UPSTASH',
  supportsIntraday: true,
  supportsBackfill: true,
  recommendedSyncIntervalMinutes: DEFAULT_SYNC_INTERVAL_MINUTES,
  credentials: upstashCredentialMeta,

  syncResources(ctx: ProviderContext): Promise<ResourceSyncResult> {
    return listUpstashResources(ctx);
  },

  async fetchCosts(ctx: ProviderContext, range: DateRange): Promise<NormalizedCost[]> {
    const load = await loadUpstashDay(ctx, range);
    return load.costs;
  },

  async fetchMetrics(ctx: ProviderContext, range: DateRange): Promise<NormalizedMetric[]> {
    const load = await loadUpstashDay(ctx, range);
    return load.metrics;
  },
};
