import { DEFAULT_SYNC_INTERVAL_MINUTES } from '@/config/constants';
import { neonCredentialMeta } from '@/providers/neon/credentials';
import {
  listNeonResources,
  loadNeonDay,
  neonDayToCosts,
  neonDayToMetrics,
} from '@/providers/neon/load-day';
import type {
  CostProviderAdapter,
  DateRange,
  NormalizedCost,
  NormalizedMetric,
  ProviderContext,
  ResourceSyncResult,
} from '@/providers/types';

export const neonAdapter: CostProviderAdapter = {
  providerKey: 'NEON',
  supportsIntraday: true,
  supportsBackfill: true,
  recommendedSyncIntervalMinutes: DEFAULT_SYNC_INTERVAL_MINUTES,
  credentials: neonCredentialMeta,

  syncResources(ctx: ProviderContext): Promise<ResourceSyncResult> {
    return listNeonResources(ctx);
  },

  async fetchCosts(ctx: ProviderContext, range: DateRange): Promise<NormalizedCost[]> {
    const load = await loadNeonDay(ctx, range);
    return neonDayToCosts(load);
  },

  async fetchMetrics(ctx: ProviderContext, range: DateRange): Promise<NormalizedMetric[]> {
    const load = await loadNeonDay(ctx, range);
    return neonDayToMetrics(load);
  },
};
