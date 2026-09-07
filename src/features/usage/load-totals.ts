import { costViewForRows, latestSyncForAccounts } from '@/core/cost/cost-view';
import {
  rowsForProject,
  rowsForProvider,
  rowsInDashboardPeriod,
  unmappedRows,
} from '@/core/cost/filter-entries';
import { loadDashboardCostContext } from '@/core/cost/load-dashboard-costs';
import { prisma } from '@/shared/db';
import { rangePayload, type ResolvedDashboardQuery } from '@/shared/dashboard-query';

export async function loadUsageTotals(query: ResolvedDashboardQuery) {
  const [cost, projects, providers] = await Promise.all([
    loadDashboardCostContext({
      from: query.from,
      to: query.to,
      projectId: query.projectId,
      providerKey: query.providerKey,
    }),
    prisma.project.findMany({
      select: { id: true, slug: true, name: true, archived: true },
      orderBy: { name: 'asc' },
    }),
    prisma.provider.findMany({ orderBy: { displayName: 'asc' } }),
  ]);
  const periodRows = rowsInDashboardPeriod(cost.entries, query.from, query.to, query.preset);
  const fallback = latestSyncForAccounts(cost.accounts, query.providerKey);
  const visibleProviders = query.providerKey
    ? providers.filter((provider) => provider.key === query.providerKey)
    : providers;
  const visibleProjects = query.projectId
    ? projects.filter((project) => project.id === query.projectId)
    : projects;

  return {
    range: rangePayload(query),
    total: costViewForRows(periodRows, cost.syncAtByAccountId, fallback),
    unmapped: costViewForRows(unmappedRows(periodRows), cost.syncAtByAccountId, fallback),
    byProvider: visibleProviders.map((provider) => ({
      providerKey: provider.key,
      displayName: provider.displayName,
      cost: costViewForRows(
        rowsForProvider(periodRows, provider.key),
        cost.syncAtByAccountId,
        latestSyncForAccounts(cost.accounts, provider.key),
      ),
    })),
    byProject: visibleProjects.map((project) => ({
      projectId: project.id,
      slug: project.slug,
      name: project.name,
      archived: project.archived,
      cost: costViewForRows(
        rowsForProject(periodRows, project.id),
        cost.syncAtByAccountId,
        fallback,
      ),
    })),
  };
}
