import { loadDashboardCostContext } from '@/core/cost/load-dashboard-costs';
import {
  loadProviderDetail,
  type ProviderDetailResponse,
} from '@/features/providers/load-provider-detail';
import { loadUsageSeries, requireCostSeries } from '@/features/usage';
import type { CostUsageSeriesResponse } from '@/features/usage';
import { cacheDashboardRead, dashboardReadCacheKey } from '@/shared/dashboard-read-cache';
import type { ResolvedDashboardQuery } from '@/shared/dashboard-query';
import type { ProviderKey } from '@/generated/prisma/enums';

export type ProviderDetailBoardPayload = {
  detail: ProviderDetailResponse;
  series: CostUsageSeriesResponse;
};

export async function loadProviderDetailBoard(
  providerKey: ProviderKey,
  query: ResolvedDashboardQuery,
): Promise<ProviderDetailBoardPayload | null> {
  const scopedQuery = { ...query, providerKey };
  const cost = await loadDashboardCostContext({
    from: scopedQuery.from,
    to: scopedQuery.to,
    projectId: scopedQuery.projectId,
    providerKey,
  });
  const [detail, series] = await Promise.all([
    loadProviderDetail(providerKey, scopedQuery, new Date(), cost),
    loadUsageSeries(scopedQuery, cost),
  ]);
  if (!detail) {
    return null;
  }
  return { detail, series: requireCostSeries(series) };
}

export function loadProviderDetailBoardCached(
  providerKey: ProviderKey,
  query: ResolvedDashboardQuery,
): Promise<ProviderDetailBoardPayload | null> {
  return cacheDashboardRead(
    'provider-detail-board',
    `${providerKey}|${dashboardReadCacheKey(query)}`,
    () => loadProviderDetailBoard(providerKey, query),
  );
}
