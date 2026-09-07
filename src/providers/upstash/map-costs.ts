import { sumSeriesForUtcDay } from '@/providers/upstash/series';
import type { UpstashResourceRef } from '@/providers/upstash/list-resources';
import type { UpstashResourceStats } from '@/providers/upstash/fetch-stats';
import type { NormalizedCost, NormalizedMetric } from '@/providers/types';

export function upstashStatsToCosts(input: {
  resources: readonly UpstashResourceRef[];
  stats: readonly UpstashResourceStats[];
  bucketDate: Date;
  isPartial: boolean;
}): NormalizedCost[] {
  const byId = new Map(input.stats.map((row) => [row.externalId, row]));
  return input.resources.map((resource) => {
    const stats = byId.get(resource.externalId);
    const billedUsd = stats ? sumSeriesForUtcDay(stats.billing, input.bucketDate) : null;
    if (billedUsd === null) {
      return missingCost(resource.externalId, input.bucketDate, {
        product: resource.product,
        monthlyBillingUsd: stats?.monthlyBillingUsd ?? null,
        billingWindow: 'day_not_in_series',
      });
    }
    return {
      externalId: resource.externalId,
      bucketDate: input.bucketDate,
      costUsd: billedUsd,
      originalAmount: billedUsd,
      originalCurrency: 'USD',
      sourceType: 'API',
      sourceStatus: input.isPartial ? 'partial' : 'fresh',
      isPartial: input.isPartial,
      dimensionKey: '_',
      metadata: {
        product: resource.product,
        billedUsd,
        monthlyBillingUsd: stats?.monthlyBillingUsd ?? null,
      },
    };
  });
}

export function upstashStatsToMetrics(input: {
  stats: readonly UpstashResourceStats[];
  bucketDate: Date;
}): NormalizedMetric[] {
  const rows: NormalizedMetric[] = [];
  for (const stats of input.stats) {
    const requests = sumSeriesForUtcDay(stats.requests, input.bucketDate);
    if (requests === null) {
      continue;
    }
    rows.push({
      externalId: stats.externalId,
      bucketDate: input.bucketDate,
      metricKey: 'requests',
      valueNumeric: requests,
      unit: 'count',
      metadata: { product: stats.product },
    });
  }
  return rows;
}

function missingCost(
  externalId: string,
  bucketDate: Date,
  metadata: Record<string, string | number | boolean | null>,
): NormalizedCost {
  return {
    externalId,
    bucketDate,
    costUsd: 0,
    sourceType: 'API',
    sourceStatus: 'missing',
    isPartial: false,
    dimensionKey: '_',
    metadata,
  };
}
