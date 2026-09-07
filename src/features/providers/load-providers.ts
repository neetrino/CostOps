import { rollupFreshness } from '@/core/cost/freshness';
import { costViewForRows, latestSyncForAccounts } from '@/core/cost/cost-view';
import { rowsForProvider, rowsInDashboardPeriod, rowsOnUtcDay } from '@/core/cost/filter-entries';
import { loadDashboardCostContext } from '@/core/cost/load-dashboard-costs';
import { accountFreshness } from '@/core/sync/account-freshness';
import type { CostView } from '@/core/cost/types';
import type { Freshness } from '@/providers/types';
import { prisma } from '@/shared/db';
import {
  rangePayload,
  type RangePayload,
  type ResolvedDashboardQuery,
} from '@/shared/dashboard-query';

export type ProviderListRow = {
  key: string;
  displayName: string;
  enabled: boolean;
  today: CostView;
  period: CostView;
  accountCount: number;
  freshness: Freshness;
  lastSuccessfulSyncAt: string | null;
};

export type ProviderListResponse = {
  range: RangePayload;
  providers: ProviderListRow[];
};

export async function loadProviders(
  query: ResolvedDashboardQuery,
  now: Date = new Date(),
): Promise<ProviderListResponse> {
  const [cost, providers, accounts] = await Promise.all([
    loadDashboardCostContext({
      from: query.from,
      to: query.to,
      projectId: query.projectId,
      providerKey: query.providerKey,
      now,
    }),
    prisma.provider.findMany({
      where: query.providerKey ? { key: query.providerKey } : undefined,
      orderBy: { displayName: 'asc' },
    }),
    prisma.providerAccount.findMany({
      select: {
        providerKey: true,
        lastSuccessfulSyncAt: true,
        lastErrorAt: true,
        recommendedSyncIntervalMinutes: true,
      },
    }),
  ]);
  const periodRows = rowsInDashboardPeriod(cost.entries, query.from, query.to, query.preset);
  const todayRows = rowsOnUtcDay(cost.entries, cost.today);

  return {
    range: rangePayload(query),
    providers: providers.map((provider) => {
      const fallback = latestSyncForAccounts(cost.accounts, provider.key);
      const providerAccounts = accounts.filter((account) => account.providerKey === provider.key);
      const freshness = rollupAccountFreshness(providerAccounts, provider.key, now);
      return {
        key: provider.key,
        displayName: provider.displayName,
        enabled: provider.enabled,
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
        accountCount: providerAccounts.length,
        freshness,
        lastSuccessfulSyncAt: fallback?.toISOString() ?? null,
      };
    }),
  };
}

function rollupAccountFreshness(
  accounts: Array<{
    lastSuccessfulSyncAt: Date | null;
    lastErrorAt: Date | null;
    recommendedSyncIntervalMinutes: number | null;
  }>,
  providerKey: string,
  now: Date,
): Freshness {
  if (accounts.length === 0) {
    return 'missing';
  }
  return rollupFreshness(
    accounts.map((account) =>
      accountFreshness({
        lastSuccessfulSyncAt: account.lastSuccessfulSyncAt,
        lastErrorAt: account.lastErrorAt,
        recommendedSyncIntervalMinutes: account.recommendedSyncIntervalMinutes,
        providerKey,
        now,
      }),
    ),
  );
}
