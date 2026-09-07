import { credentialHealth } from '@/core/alerts/credential-health';
import { combineProviderCostViews } from '@/core/cost/combine-views';
import { costViewForRows, latestSyncForAccounts } from '@/core/cost/cost-view';
import {
  rowsForProjectProvider,
  rowsForProvider,
  rowsInDashboardPeriod,
  rowsInRange,
  rowsOnUtcDay,
} from '@/core/cost/filter-entries';
import { loadDashboardCostContext } from '@/core/cost/load-dashboard-costs';
import { loadSyncStatus } from '@/core/sync/load-status';
import { buildNearLimitRows } from '@/features/overview/near-limit';
import type {
  OverviewProjectRow,
  OverviewProviderRow,
  OverviewResponse,
} from '@/features/overview/types';
import { prisma } from '@/shared/db';
import { rangePayload, type ResolvedDashboardQuery } from '@/shared/dashboard-query';

export async function loadOverview(
  query: ResolvedDashboardQuery,
  now: Date = new Date(),
): Promise<OverviewResponse> {
  const [cost, catalog, sync] = await Promise.all([
    loadDashboardCostContext({
      from: query.from,
      to: query.to,
      projectId: query.projectId,
      providerKey: query.providerKey,
      now,
    }),
    loadOverviewCatalog(),
    loadSyncStatus(now),
  ]);
  const periodRows = rowsInDashboardPeriod(cost.entries, query.from, query.to, query.preset);
  const todayRows = rowsOnUtcDay(cost.entries, cost.today);
  const globalFallback = latestSyncForAccounts(cost.accounts, query.providerKey);
  const today = costViewForRows(todayRows, cost.syncAtByAccountId, globalFallback);
  const period = costViewForRows(periodRows, cost.syncAtByAccountId, globalFallback);

  return {
    range: rangePayload(query),
    today,
    period,
    byProvider: buildProviderRows(
      catalog.providers,
      todayRows,
      periodRows,
      cost,
      query.providerKey,
    ),
    byProject: buildProjectRows(catalog.projects, todayRows, periodRows, cost, query.providerKey),
    nearLimit: buildNearLimitRows({
      rules: catalog.rules,
      todayRows,
      accounts: cost.accounts,
      syncAtByAccountId: cost.syncAtByAccountId,
    }),
    health: {
      sync,
      unmappedResourceCount: catalog.unmappedResourceCount,
      credentialAlerts: catalog.accounts
        .map((account) => ({
          accountId: account.id,
          providerKey: account.providerKey,
          name: account.name,
          health: credentialHealth({
            lastAuthFailureAt: account.lastAuthFailureAt,
            lastErrorAt: account.lastErrorAt,
            lastSuccessfulSyncAt: account.lastSuccessfulSyncAt,
          }).health,
        }))
        .filter((row) => row.health !== 'ok'),
    },
  };
}

async function loadOverviewCatalog() {
  const [providers, projects, rules, unmappedResourceCount, accounts] = await Promise.all([
    prisma.provider.findMany({ orderBy: { displayName: 'asc' } }),
    prisma.project.findMany({
      where: { archived: false },
      select: {
        id: true,
        slug: true,
        name: true,
        projectProviders: { select: { id: true, providerKey: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.budgetRule.findMany({
      where: { enabled: true },
      include: { project: { select: { id: true, slug: true, name: true, archived: true } } },
    }),
    prisma.resource.count({ where: { projectId: null, archivedAt: null } }),
    prisma.providerAccount.findMany({
      select: {
        id: true,
        providerKey: true,
        name: true,
        lastAuthFailureAt: true,
        lastErrorAt: true,
        lastSuccessfulSyncAt: true,
      },
    }),
  ]);
  return { providers, projects, rules, unmappedResourceCount, accounts };
}

function buildProviderRows(
  providers: Array<{ key: string; displayName: string }>,
  todayRows: ReturnType<typeof rowsOnUtcDay>,
  periodRows: ReturnType<typeof rowsInRange>,
  cost: Awaited<ReturnType<typeof loadDashboardCostContext>>,
  providerKey?: string,
): OverviewProviderRow[] {
  const list = providerKey
    ? providers.filter((provider) => provider.key === providerKey)
    : providers;
  return list.map((provider) => {
    const fallback = latestSyncForAccounts(cost.accounts, provider.key);
    return {
      providerKey: provider.key,
      displayName: provider.displayName,
      today: costViewForRows(
        rowsForProvider(todayRows, provider.key),
        cost.syncAtByAccountId,
        fallback,
      ),
      period: costViewForRows(
        rowsForProvider(periodRows, provider.key),
        cost.syncAtByAccountId,
        fallback,
      ),
    };
  });
}

function buildProjectRows(
  projects: Array<{
    id: string;
    slug: string;
    name: string;
    projectProviders: Array<{ id: string; providerKey: string }>;
  }>,
  todayRows: ReturnType<typeof rowsOnUtcDay>,
  periodRows: ReturnType<typeof rowsInRange>,
  cost: Awaited<ReturnType<typeof loadDashboardCostContext>>,
  providerKey?: string,
): OverviewProjectRow[] {
  const rows = projects.map((project) => {
    const links = project.projectProviders.filter(
      (link) => !providerKey || link.providerKey === providerKey,
    );
    const views = links.map((link) => {
      const fallback = latestSyncForAccounts(cost.accounts, link.providerKey);
      return {
        today: costViewForRows(
          rowsForProjectProvider(todayRows, link.id),
          cost.syncAtByAccountId,
          fallback,
        ),
        period: costViewForRows(
          rowsForProjectProvider(periodRows, link.id),
          cost.syncAtByAccountId,
          fallback,
        ),
      };
    });
    return {
      projectId: project.id,
      slug: project.slug,
      name: project.name,
      today: combineProviderCostViews(views.map((item) => item.today)),
      period: combineProviderCostViews(views.map((item) => item.period)),
    };
  });
  return rows.sort((left, right) => (right.period.costUsd ?? -1) - (left.period.costUsd ?? -1));
}
