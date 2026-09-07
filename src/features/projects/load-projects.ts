import { combineProviderCostViews } from '@/core/cost/combine-views';
import { costViewForRows, latestSyncForAccounts } from '@/core/cost/cost-view';
import { rowsForProjectProvider, rowsInRange, rowsOnUtcDay } from '@/core/cost/filter-entries';
import { loadDashboardCostContext } from '@/core/cost/load-dashboard-costs';
import { ruleViewForProjectProvider } from '@/core/budgets/rule-view';
import type {
  ProjectListResponse,
  ProjectListRow,
  ProjectProviderRow,
} from '@/features/projects/types';
import { prisma } from '@/shared/db';
import { rangePayload, type ResolvedDashboardQuery } from '@/shared/dashboard-query';

export async function loadProjects(query: ResolvedDashboardQuery): Promise<ProjectListResponse> {
  const [cost, projects, rules] = await Promise.all([
    loadDashboardCostContext({
      from: query.from,
      to: query.to,
      projectId: query.projectId,
      providerKey: query.providerKey,
    }),
    prisma.project.findMany({
      where: query.projectId ? { id: query.projectId } : undefined,
      include: {
        projectProviders: { orderBy: { providerKey: 'asc' } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.budgetRule.findMany({
      where: { scope: 'PROJECT_PROVIDER' },
    }),
  ]);
  const periodRows = rowsInRange(cost.entries, query.from, query.to);
  const todayRows = rowsOnUtcDay(cost.entries, cost.today);

  const rows: ProjectListRow[] = projects.map((project) => {
    const providers: ProjectProviderRow[] = project.projectProviders
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

  return { range: rangePayload(query), projects: rows };
}
