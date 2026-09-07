import { UNMAPPED_RESOURCE_QUERY_LIMIT } from '@/config/constants';
import { costViewForRows, latestSyncForAccounts } from '@/core/cost/cost-view';
import type { CostView } from '@/core/cost/types';
import { rowsForResource, rowsInRange, rowsOnUtcDay } from '@/core/cost/filter-entries';
import { loadDashboardCostContext } from '@/core/cost/load-dashboard-costs';
import { suggestProjectForResource } from '@/core/mapping/suggest-project';
import type { ProjectSuggestion } from '@/core/mapping/suggest-project';
import { prisma } from '@/shared/db';
import {
  rangePayload,
  type RangePayload,
  type ResolvedDashboardQuery,
} from '@/shared/dashboard-query';

export type InboxResourceRow = {
  id: string;
  providerKey: string;
  providerAccountId: string;
  externalId: string;
  displayName: string;
  resourceType: string;
  discoveredAt: string;
  archivedAt: string | null;
  suggestion: ProjectSuggestion | null;
  today: CostView;
  period: CostView;
};

export type InboxResourcesResponse = {
  range: RangePayload;
  inbox: 'open' | 'archived';
  openCount: number;
  archivedCount: number;
  resources: InboxResourceRow[];
};

export async function loadUnmappedResources(
  query: ResolvedDashboardQuery,
): Promise<InboxResourcesResponse> {
  return loadInboxResources(query, 'open');
}

export async function loadArchivedResources(
  query: ResolvedDashboardQuery,
): Promise<InboxResourcesResponse> {
  return loadInboxResources(query, 'archived');
}

async function loadInboxResources(
  query: ResolvedDashboardQuery,
  inbox: 'open' | 'archived',
): Promise<InboxResourcesResponse> {
  const providerFilter = query.providerKey ? { providerKey: query.providerKey } : {};
  const openWhere = { projectId: null, archivedAt: null, ...providerFilter };
  const archivedWhere = { projectId: null, archivedAt: { not: null }, ...providerFilter };
  const [cost, resources, projects, openCount, archivedCount] = await Promise.all([
    loadDashboardCostContext({
      from: query.from,
      to: query.to,
      providerKey: query.providerKey,
    }),
    prisma.resource.findMany({
      where: inbox === 'archived' ? archivedWhere : openWhere,
      orderBy: inbox === 'archived' ? { archivedAt: 'desc' } : { discoveredAt: 'desc' },
      take: UNMAPPED_RESOURCE_QUERY_LIMIT,
    }),
    prisma.project.findMany({
      where: { archived: false },
      select: { id: true, name: true, slug: true },
    }),
    prisma.resource.count({ where: openWhere }),
    prisma.resource.count({ where: archivedWhere }),
  ]);
  const periodRows = rowsInRange(cost.entries, query.from, query.to);
  const todayRows = rowsOnUtcDay(cost.entries, cost.today);
  const fallback = latestSyncForAccounts(cost.accounts, query.providerKey);

  return {
    range: rangePayload(query),
    inbox,
    openCount,
    archivedCount,
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
        archivedAt: resource.archivedAt?.toISOString() ?? null,
        suggestion: inbox === 'open' ? suggestProjectForResource(resource, projects) : null,
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
