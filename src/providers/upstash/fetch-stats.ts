import { upstashGetJson } from '@/providers/upstash/client';
import type { UpstashApiCredentials } from '@/providers/upstash/credentials';
import type { UpstashResourceRef } from '@/providers/upstash/list-resources';
import {
  parseUpstashObject,
  upstashQstashStatsSchema,
  upstashRedisStatsSchema,
  upstashVectorSearchStatsSchema,
  type UpstashTimeSeriesPoint,
} from '@/providers/upstash/schemas';

export type UpstashResourceStats = {
  externalId: string;
  product: UpstashResourceRef['product'];
  billing: UpstashTimeSeriesPoint[];
  requests: UpstashTimeSeriesPoint[];
  monthlyBillingUsd: number | null;
};

/**
 * Per-resource stats. Sequential to stay inside Management API rate limits.
 * Do not pass `period=30d` — live QStash returns 400 for that value.
 */
export async function fetchUpstashResourceStats(
  credentials: UpstashApiCredentials,
  resources: readonly UpstashResourceRef[],
): Promise<UpstashResourceStats[]> {
  const rows: UpstashResourceStats[] = [];
  for (const resource of resources) {
    rows.push(await fetchOne(credentials, resource));
  }
  return rows;
}

async function fetchOne(
  credentials: UpstashApiCredentials,
  resource: UpstashResourceRef,
): Promise<UpstashResourceStats> {
  if (resource.product === 'redis') {
    return fetchRedisStats(credentials, resource.externalId);
  }
  if (resource.product === 'qstash') {
    return fetchQstashStats(credentials, resource.externalId);
  }
  return fetchIndexStats(credentials, resource);
}

async function fetchRedisStats(
  credentials: UpstashApiCredentials,
  id: string,
): Promise<UpstashResourceStats> {
  // The default live response only contains about five daily points. `7d` is
  // the widest period accepted by the Redis endpoint and covers the complete
  // current month during its first week instead of silently undercounting it.
  const raw = await upstashGetJson({
    credentials,
    path: `/redis/stats/${id}`,
    searchParams: new URLSearchParams({ period: '7d' }),
  });
  const stats = parseUpstashObject(upstashRedisStatsSchema, raw, 'redis stats');
  return {
    externalId: id,
    product: 'redis',
    billing: stats.dailybilling ?? [],
    requests: stats.dailyrequests ?? [],
    monthlyBillingUsd: stats.total_monthly_billing ?? null,
  };
}

async function fetchQstashStats(
  credentials: UpstashApiCredentials,
  id: string,
): Promise<UpstashResourceStats> {
  const raw = await upstashGetJson({ credentials, path: `/qstash/stats/${id}` });
  const stats = parseUpstashObject(upstashQstashStatsSchema, raw, 'qstash stats');
  return {
    externalId: id,
    product: 'qstash',
    billing: stats.daily_billings ?? [],
    requests: stats.daily_requests ?? [],
    monthlyBillingUsd: stats.total_monthly_billing ?? null,
  };
}

async function fetchIndexStats(
  credentials: UpstashApiCredentials,
  resource: UpstashResourceRef,
): Promise<UpstashResourceStats> {
  const path =
    resource.product === 'vector'
      ? `/vector/index/${resource.externalId}/stats`
      : `/search/${resource.externalId}/stats`;
  const raw = await upstashGetJson({ credentials, path });
  const stats = parseUpstashObject(
    upstashVectorSearchStatsSchema,
    raw,
    `${resource.product} stats`,
  );
  return {
    externalId: resource.externalId,
    product: resource.product,
    billing: [],
    requests: [],
    monthlyBillingUsd: stats.monthly_cost ?? null,
  };
}
