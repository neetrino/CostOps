import { combineProviderCostViews } from '@/core/cost/combine-views';
import { costViewForRows, latestSyncForAccounts } from '@/core/cost/cost-view';
import {
  rowsForProjectProvider,
  rowsForResource,
  rowsInDashboardPeriod,
  rowsOnUtcDay,
} from '@/core/cost/filter-entries';
import { loadDashboardCostContext } from '@/core/cost/load-dashboard-costs';
import { ruleViewForProjectProvider, ruleViewForProjectTotal } from '@/core/budgets/rule-view';
import type { ProjectDetailResponse } from '@/features/projects/types';
import { prisma } from '@/shared/db';
import { utcDayKey } from '@/shared/dates';
import { decimalToNumber } from '@/shared/money';
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
      where: {
        projectId: project.id,
        scope: { in: ['PROJECT_PROVIDER', 'PROJECT_TOTAL'] },
      },
    }),
  ]);
  const periodRows = rowsInDashboardPeriod(cost.entries, query.from, query.to, query.preset);
  const todayRows = rowsOnUtcDay(cost.entries, cost.today);
  const providers = project.projectProviders
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
            fixedMonthlyUsd: resource.fixedMonthlyUsd
              ? decimalToNumber(resource.fixedMonthlyUsd)
              : null,
            fixedEffectiveOn: resource.fixedEffectiveOn
              ? utcDayKey(resource.fixedEffectiveOn)
              : null,
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
    });

  return {
    range: rangePayload(query),
    project: {
      id: project.id,
      slug: project.slug,
      name: project.name,
      archived: project.archived,
      createdAt: project.createdAt.toISOString(),
    },
    today: combineProviderCostViews(providers.map((provider) => provider.today)),
    period: combineProviderCostViews(providers.map((provider) => provider.period)),
    totalBudget: ruleViewForProjectTotal(rules, project.id),
    providers,
  };
}
