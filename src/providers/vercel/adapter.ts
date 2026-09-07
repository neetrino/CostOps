import { DEFAULT_SYNC_INTERVAL_MINUTES } from '@/config/constants';
import { vercelCredentialMeta } from '@/providers/vercel/credentials';
import { listVercelResources, loadVercelDay } from '@/providers/vercel/load-day';
import type {
  CostProviderAdapter,
  DateRange,
  NormalizedCost,
  NormalizedMetric,
  ProviderContext,
  ResourceSyncResult,
} from '@/providers/types';

export const vercelAdapter: CostProviderAdapter = {
  providerKey: 'VERCEL',
  supportsIntraday: false,
  supportsBackfill: true,
  recommendedSyncIntervalMinutes: DEFAULT_SYNC_INTERVAL_MINUTES,
  credentials: vercelCredentialMeta,

  syncResources(ctx: ProviderContext): Promise<ResourceSyncResult> {
    return listVercelResources(ctx);
  },

  async fetchCosts(ctx: ProviderContext, range: DateRange): Promise<NormalizedCost[]> {
    const load = await loadVercelDay(ctx, range);
    return load.costs;
  },

  async fetchMetrics(ctx: ProviderContext, range: DateRange): Promise<NormalizedMetric[]> {
    const load = await loadVercelDay(ctx, range);
    return load.metrics;
  },
};
