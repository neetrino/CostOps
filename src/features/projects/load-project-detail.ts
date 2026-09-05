import { costViewForRows, latestSyncForAccounts } from '@/core/cost/cost-view';
import {
  rowsForProject,
  rowsForProjectProvider,
  rowsForResource,
  rowsInRange,
  rowsOnUtcDay,
} from '@/core/cost/filter-entries';
import { loadDashboardCostContext } from '@/core/cost/load-dashboard-costs';
import { ruleViewForProjectProvider } from '@/core/budgets/rule-view';
import type { ProjectDetailResponse } from '@/features/projects/types';
import { prisma } from '@/shared/db';
import { rangePayload, type ResolvedDashboardQuery } from '@/shared/dashboard-query';

export async function loadProjectDetail(
  slug: string,
  query: ResolvedDashboardQuery,
): Promise<ProjectDetailResponse | null> {
  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      projectProviders: { orderBy: { providerKey: 'asc' } },
      resources: {
        where: { archivedAt: null },
        orderBy: { displayName: 'asc' },
      },
    },
  });
  if (!project) {
    return null;
  }
  const [cost, rules] = await Promise.all([
    loadDashboardCostContext({
      from: query.from,
      to: query.to,
      projectId: project.id,
      providerKey: query.providerKey,
    }),
    prisma.budgetRule.findMany({
      where: { scope: 'PROJECT_PROVIDER', projectId: project.id },
    }),
  ]);
  const periodRows = rowsInRange(cost.entries, query.from, query.to);
  const todayRows = rowsOnUtcDay(cost.entries, cost.today);
  const fallback = latestSyncForAccounts(cost.accounts, query.providerKey);

  return {
    range: rangePayload(query),
    project: {
      id: project.id,
      slug: project.slug,
      name: project.name,
      archived: project.archived,
      createdAt: project.createdAt.toISOString(),
    },
    today: costViewForRows(rowsForProject(todayRows, project.id), cost.syncAtByAccountId, fallback),
    period: costViewForRows(
      rowsForProject(periodRows, project.id),
      cost.syncAtByAccountId,
      fallback,
    ),
    providers: project.projectProviders
      .filter((link) => !query.providerKey || link.providerKey === query.providerKey)
      .map((link) => {
        const linkFallback = latestSyncForAccounts(cost.accounts, link.providerKey);
        return {
          providerKey: link.providerKey,
          projectProviderId: link.id,
          today: costViewForRows(
            rowsForProjectProvider(todayRows, link.id),
            cost.syncAtByAccountId,
            linkFallback,
          ),
          period: costViewForRows(
            rowsForProjectProvider(periodRows, link.id),
            cost.syncAtByAccountId,
            linkFallback,
          ),
          budget: ruleViewForProjectProvider(rules, link.id),
          resources: project.resources
            .filter((resource) => resource.projectProviderId === link.id)
            .map((resource) => ({
              id: resource.id,
              externalId: resource.externalId,
              displayName: resource.displayName,
              resourceType: resource.resourceType,
              today: costViewForRows(
                rowsForResource(todayRows, resource.id),
                cost.syncAtByAccountId,
                linkFallback,
              ),
              period: costViewForRows(
                rowsForResource(periodRows, resource.id),
                cost.syncAtByAccountId,
                linkFallback,
              ),
            })),
        };
      }),
  };
}
