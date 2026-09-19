import { loadDashboardCostContext } from '@/core/cost/load-dashboard-costs';
import { loadProjects } from '@/features/projects/load-projects';
import type { ProjectListResponse } from '@/features/projects/types';
import { loadUsageSeries, loadUsageTotals, requireCostSeries } from '@/features/usage';
import type { CostUsageSeriesResponse, UsageTotalsResponse } from '@/features/usage';
import { cacheDashboardRead, dashboardReadCacheKey } from '@/shared/dashboard-read-cache';
import type { ResolvedDashboardQuery } from '@/shared/dashboard-query';

export type ProjectsBoardPayload = {
  projects: ProjectListResponse;
  totals: UsageTotalsResponse;
  series: CostUsageSeriesResponse;
};

export async function loadProjectsBoard(
  query: ResolvedDashboardQuery,
): Promise<ProjectsBoardPayload> {
  const cost = await loadDashboardCostContext({
    from: query.from,
    to: query.to,
    projectId: query.projectId,
    providerKey: query.providerKey,
  });
  const [projects, totals, series] = await Promise.all([
    loadProjects(query, cost),
    loadUsageTotals(query, cost),
    loadUsageSeries(query, cost),
  ]);
  return { projects, totals, series: requireCostSeries(series) };
}

export function loadProjectsBoardCached(
  query: ResolvedDashboardQuery,
): Promise<ProjectsBoardPayload> {
  return cacheDashboardRead('projects-board', dashboardReadCacheKey(query), () =>
    loadProjectsBoard(query),
  );
}
