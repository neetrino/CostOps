import { isSameUtcDay, toUtcDateOnly, utcDayKey } from '@/shared/dates';
import { withBackoff } from '@/shared/retry';
import { resolveUpstashCredentials } from '@/providers/upstash/credentials';
import { isUpstashAuthFailure } from '@/providers/upstash/errors';
import { fetchUpstashResourceStats } from '@/providers/upstash/fetch-stats';
import {
  listAllUpstashResources,
  toResourceSyncResult,
  type UpstashResourceRef,
} from '@/providers/upstash/list-resources';
import { upstashStatsToCosts, upstashStatsToMetrics } from '@/providers/upstash/map-costs';
import type {
  DateRange,
  NormalizedCost,
  NormalizedMetric,
  ProviderContext,
  ResourceSyncResult,
} from '@/providers/types';

export type UpstashDayLoad = {
  bucketDate: Date;
  isPartial: boolean;
  costs: NormalizedCost[];
  metrics: NormalizedMetric[];
};

let cachedLoad: { key: string; value: UpstashDayLoad } | null = null;
let cachedResources: { key: string; value: UpstashResourceRef[] } | null = null;

function retryUnlessAuth(error: unknown): boolean {
  return !isUpstashAuthFailure(error);
}

function assertSingleUtcDay(range: DateRange): Date {
  const from = toUtcDateOnly(range.from);
  const to = toUtcDateOnly(range.to);
  if (from.getTime() !== to.getTime()) {
    throw new Error('Upstash adapter expects a single UTC day range');
  }
  return from;
}

export async function listUpstashResources(ctx: ProviderContext): Promise<ResourceSyncResult> {
  const resources = await loadResourceList(ctx);
  return toResourceSyncResult(resources);
}

export async function loadUpstashDay(
  ctx: ProviderContext,
  range: DateRange,
): Promise<UpstashDayLoad> {
  const bucketDate = assertSingleUtcDay(range);
  const key = `${ctx.account.id}:${utcDayKey(range.from)}:${utcDayKey(range.to)}:${ctx.now.toISOString()}`;
  if (cachedLoad?.key === key) {
    return cachedLoad.value;
  }
  const creds = resolveUpstashCredentials(ctx.account.credentialRef);
  const resources = await loadResourceList(ctx);
  const stats = await withBackoff(() => fetchUpstashResourceStats(creds, resources), {
    label: 'upstash.stats',
    shouldRetry: retryUnlessAuth,
  });
  const isPartial = isSameUtcDay(bucketDate, ctx.now);
  const value: UpstashDayLoad = {
    bucketDate,
    isPartial,
    costs: upstashStatsToCosts({ resources, stats, bucketDate, isPartial }),
    metrics: upstashStatsToMetrics({ stats, bucketDate }),
  };
  cachedLoad = { key, value };
  return value;
}

async function loadResourceList(ctx: ProviderContext): Promise<UpstashResourceRef[]> {
  const key = `${ctx.account.id}:${ctx.now.toISOString()}`;
  if (cachedResources?.key === key) {
    return cachedResources.value;
  }
  const creds = resolveUpstashCredentials(ctx.account.credentialRef);
  const value = await withBackoff(() => listAllUpstashResources(creds), {
    label: 'upstash.list',
    shouldRetry: retryUnlessAuth,
  });
  cachedResources = { key, value };
  return value;
}
