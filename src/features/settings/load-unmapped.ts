import { UNMAPPED_RESOURCE_QUERY_LIMIT } from '@/config/constants';
import { costViewForRows, latestSyncForAccounts } from '@/core/cost/cost-view';
import { rowsForResource, rowsInRange, rowsOnUtcDay } from '@/core/cost/filter-entries';
import { loadDashboardCostContext } from '@/core/cost/load-dashboard-costs';
import { prisma } from '@/shared/db';
import { rangePayload, type ResolvedDashboardQuery } from '@/shared/dashboard-query';

export async function loadUnmappedResources(query: ResolvedDashboardQuery) {
  const [cost, resources] = await Promise.all([
    loadDashboardCostContext({
      from: query.from,
      to: query.to,
      providerKey: query.providerKey,
    }),
    prisma.resource.findMany({
      where: {
        projectId: null,
        archivedAt: null,
        ...(query.providerKey ? { providerKey: query.providerKey } : {}),
      },
      orderBy: { discoveredAt: 'desc' },
      take: UNMAPPED_RESOURCE_QUERY_LIMIT,
    }),
  ]);
  const periodRows = rowsInRange(cost.entries, query.from, query.to);
  const todayRows = rowsOnUtcDay(cost.entries, cost.today);
  const fallback = latestSyncForAccounts(cost.accounts, query.providerKey);

  return {
    range: rangePayload(query),
    resources: resources.map((resource) => {
      const resourceFallback = latestSyncForAccounts(cost.accounts, resource.providerKey);
      return {
        id: resource.id,
        providerKey: resource.providerKey,
        providerAccountId: resource.providerAccountId,
        externalId: resource.externalId,
        displayName: resource.displayName,
        resourceType: resource.resourceType,
        discoveredAt: resource.discoveredAt.toISOString(),
        today: costViewForRows(
          rowsForResource(todayRows, resource.id),
          cost.syncAtByAccountId,
          resourceFallback,
        ),
        period: costViewForRows(
          rowsForResource(periodRows, resource.id),
          cost.syncAtByAccountId,
          fallback,
        ),
      };
    }),
  };
}
