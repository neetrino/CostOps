import { HETZNER_FIXED_SYNC_INTERVAL_MINUTES } from '@/config/constants';
import { hetznerCredentialMeta } from '@/providers/hetzner/credentials';
import { filterFixedCostsForRewrite, fixedResourcesToCosts } from '@/providers/hetzner/map-costs';
import type {
  CostProviderAdapter,
  DateRange,
  NormalizedCost,
  ProviderContext,
  ResourceSyncResult,
} from '@/providers/types';

export const hetznerAdapter: CostProviderAdapter = {
  providerKey: 'HETZNER',
  supportsIntraday: false,
  supportsBackfill: true,
  recommendedSyncIntervalMinutes: HETZNER_FIXED_SYNC_INTERVAL_MINUTES,
  requiresCredentials: false,
  credentials: hetznerCredentialMeta,

  syncResources(): Promise<ResourceSyncResult> {
    return Promise.resolve({ discovered: [] });
  },

  async fetchCosts(ctx: ProviderContext, range: DateRange): Promise<NormalizedCost[]> {
    const { loadActiveFixedVpsResources, loadPastFixedMonthRewrite } =
      await import('@/providers/hetzner/load-resources');
    const resources = await loadActiveFixedVpsResources(ctx.account.id);
    const past = await loadPastFixedMonthRewrite(ctx.account.id, ctx.now);
    const costs = fixedResourcesToCosts(resources, range, past.lumpAmounts);
    return filterFixedCostsForRewrite(costs, past.skipKeys, ctx.now);
  },
};
