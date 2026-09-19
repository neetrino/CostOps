import { loadDashboardCostContext } from '@/core/cost/load-dashboard-costs';
import { loadProjectDetail } from '@/features/projects/load-project-detail';
import { loadProjectOptions } from '@/features/projects/load-project-options';
import type { ProjectDetailResponse } from '@/features/projects/types';
import { loadUsageSeries, requireCostSeries } from '@/features/usage';
import type { CostUsageSeriesResponse } from '@/features/usage';
import type { ProjectOptionsResponse } from '@/features/unmapped/types';
import { cacheDashboardRead, dashboardReadCacheKey } from '@/shared/dashboard-read-cache';
import type { ResolvedDashboardQuery } from '@/shared/dashboard-query';
import { prisma } from '@/shared/db';

export type ProjectDetailBoardPayload = {
  detail: ProjectDetailResponse;
  series: CostUsageSeriesResponse;
  options: ProjectOptionsResponse;
};

export async function loadProjectDetailBoard(
  slug: string,
  query: ResolvedDashboardQuery,
): Promise<ProjectDetailBoardPayload | null> {
  const project = await prisma.project.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!project) {
    return null;
  }
  const scopedQuery = { ...query, projectId: project.id };
  const cost = await loadDashboardCostContext({
    from: scopedQuery.from,
    to: scopedQuery.to,
    projectId: project.id,
    providerKey: scopedQuery.providerKey,
  });
  const [detail, series, options] = await Promise.all([
    loadProjectDetail(slug, scopedQuery, cost),
    loadUsageSeries(scopedQuery, cost),
    loadProjectOptions(),
  ]);
  if (!detail) {
    return null;
  }
  return { detail, series: requireCostSeries(series), options };
}

export function loadProjectDetailBoardCached(
  slug: string,
  query: ResolvedDashboardQuery,
): Promise<ProjectDetailBoardPayload | null> {
  return cacheDashboardRead('project-detail-board', `${slug}|${dashboardReadCacheKey(query)}`, () =>
    loadProjectDetailBoard(slug, query),
  );
}
