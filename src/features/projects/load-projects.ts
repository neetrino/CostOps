import { combineProviderCostViews } from '@/core/cost/combine-views';
import { costViewForRows, latestSyncForAccounts } from '@/core/cost/cost-view';
import {
  rowsForProjectProvider,
  rowsInDashboardPeriod,
  rowsOnUtcDay,
} from '@/core/cost/filter-entries';
import {
  loadDashboardCostContext,
  type DashboardCostContext,
} from '@/core/cost/load-dashboard-costs';
import { ruleViewForProjectProvider } from '@/core/budgets/rule-view';
import type {
  ProjectListResponse,
  ProjectListRow,
  ProjectProviderRow,
} from '@/features/projects/types';
import { sortByPeriodCostDesc } from '@/features/projects/sort-projects-by-cost';
import { prisma } from '@/shared/db';
import { rangePayload, type ResolvedDashboardQuery } from '@/shared/dashboard-query';

export async function loadProjects(
  query: ResolvedDashboardQuery,
  cost?: DashboardCostContext,
): Promise<ProjectListResponse> {
  const [resolvedCost, projects, rules] = await Promise.all([
    cost ??
      loadDashboardCostContext({
        from: query.from,
        to: query.to,
        projectId: query.projectId,
        providerKey: query.providerKey,
      }),
    prisma.project.findMany({
      where: query.projectId ? { id: query.projectId } : { archived: false },
      include: {
        projectProviders: { orderBy: { providerKey: 'asc' } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.budgetRule.findMany({
      where: { scope: 'PROJECT_PROVIDER' },
    }),
  ]);
  const periodRows = rowsInDashboardPeriod(resolvedCost.entries, query.from, query.to, query.preset);
  const todayRows = rowsOnUtcDay(resolvedCost.entries, resolvedCost.today);

  const rows: ProjectListRow[] = projects.map((project) => {
    const providers: ProjectProviderRow[] = project.projectProviders
      .filter((link) => !query.providerKey || link.providerKey === query.providerKey)
      .map((link) => {
        const linkFallback = latestSyncForAccounts(resolvedCost.accounts, link.providerKey);
        return {
          providerKey: link.providerKey,
          projectProviderId: link.id,
          today: costViewForRows(
            rowsForProjectProvider(todayRows, link.id),
            resolvedCost.syncAtByAccountId,
            linkFallback,
          ),
          period: costViewForRows(
            rowsForProjectProvider(periodRows, link.id),
            resolvedCost.syncAtByAccountId,
            linkFallback,
          ),
          budget: ruleViewForProjectProvider(rules, link.id),
        };
      });
    return {
      id: project.id,
      slug: project.slug,
      name: project.name,
      archived: project.archived,
      today: combineProviderCostViews(providers.map((provider) => provider.today)),
      period: combineProviderCostViews(providers.map((provider) => provider.period)),
      providers,
    };
  });

  return { range: rangePayload(query), projects: sortByPeriodCostDesc(rows) };
}
