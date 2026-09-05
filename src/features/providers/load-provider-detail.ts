import { costViewForRows, latestSyncForAccounts } from '@/core/cost/cost-view';
import {
  rowsForProject,
  rowsForProvider,
  rowsInRange,
  rowsOnUtcDay,
  unmappedRows,
} from '@/core/cost/filter-entries';
import { loadDashboardCostContext } from '@/core/cost/load-dashboard-costs';
import { loadSyncStatus } from '@/core/sync/load-status';
import { ruleViewForProjectProvider, type BudgetRuleView } from '@/core/budgets/rule-view';
import type { CostView } from '@/core/cost/types';
import type { ProviderKey } from '@/generated/prisma/enums';
import { prisma } from '@/shared/db';
import {
  rangePayload,
  type RangePayload,
  type ResolvedDashboardQuery,
} from '@/shared/dashboard-query';

export type ProviderProjectRow = {
  projectId: string;
  slug: string;
  name: string;
  archived: boolean;
  projectProviderId: string;
  today: CostView;
  period: CostView;
  budget: BudgetRuleView | null;
};

export type ProviderDetailResponse = {
  range: RangePayload;
  provider: { key: string; displayName: string; enabled: boolean };
  today: CostView;
  period: CostView;
  unmapped: { count: number; today: CostView; period: CostView };
  projects: ProviderProjectRow[];
  sync: Awaited<ReturnType<typeof loadSyncStatus>>;
};

export async function loadProviderDetail(
  providerKey: ProviderKey,
  query: ResolvedDashboardQuery,
  now: Date = new Date(),
): Promise<ProviderDetailResponse | null> {
  const provider = await prisma.provider.findUnique({ where: { key: providerKey } });
  if (!provider) {
    return null;
  }
  const [cost, links, rules, unmappedCount, sync] = await Promise.all([
    loadDashboardCostContext({
      from: query.from,
      to: query.to,
      projectId: query.projectId,
      providerKey,
      now,
    }),
    prisma.projectProvider.findMany({
      where: { providerKey },
      include: { project: { select: { id: true, slug: true, name: true, archived: true } } },
      orderBy: { project: { name: 'asc' } },
    }),
    prisma.budgetRule.findMany({
      where: { scope: 'PROJECT_PROVIDER', providerKey },
    }),
    prisma.resource.count({
      where: { providerKey, projectId: null, archivedAt: null },
    }),
    loadSyncStatus(now),
  ]);
  const periodRows = rowsForProvider(rowsInRange(cost.entries, query.from, query.to), providerKey);
  const todayRows = rowsForProvider(rowsOnUtcDay(cost.entries, cost.today), providerKey);
  const fallback = latestSyncForAccounts(cost.accounts, providerKey);

  return {
    range: rangePayload(query),
    provider: {
      key: provider.key,
      displayName: provider.displayName,
      enabled: provider.enabled,
    },
    today: costViewForRows(todayRows, cost.syncAtByAccountId, fallback),
    period: costViewForRows(periodRows, cost.syncAtByAccountId, fallback),
    unmapped: {
      count: unmappedCount,
      today: costViewForRows(unmappedRows(todayRows), cost.syncAtByAccountId, fallback),
      period: costViewForRows(unmappedRows(periodRows), cost.syncAtByAccountId, fallback),
    },
    projects: links
      .filter((link) => !query.projectId || link.projectId === query.projectId)
      .map((link) => ({
        projectId: link.project.id,
        slug: link.project.slug,
        name: link.project.name,
        archived: link.project.archived,
        projectProviderId: link.id,
        today: costViewForRows(
          rowsForProject(todayRows, link.projectId),
          cost.syncAtByAccountId,
          fallback,
        ),
        period: costViewForRows(
          rowsForProject(periodRows, link.projectId),
          cost.syncAtByAccountId,
          fallback,
        ),
        budget: ruleViewForProjectProvider(rules, link.id),
      })),
    sync: {
      ...sync,
      accounts: sync.accounts.filter((account) => account.providerKey === providerKey),
      runs: sync.runs.filter((run) => run.providerKey === providerKey),
    },
  };
}
