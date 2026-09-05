import type { CostAggregate, CostEntryRow, CostView } from '@/core/cost/types';
import { aggregateCostRows } from '@/core/cost/freshness';

export function toCostView(aggregate: CostAggregate, lastSuccessfulSyncAt: Date | null): CostView {
  return {
    costUsd: aggregate.costUsd,
    sourceType: aggregate.sourceType,
    sourceStatus: aggregate.sourceStatus,
    isPartial: aggregate.isPartial,
    lastSuccessfulSyncAt: lastSuccessfulSyncAt?.toISOString() ?? null,
  };
}

export function viewFromRows(rows: CostEntryRow[], lastSuccessfulSyncAt: Date | null): CostView {
  return toCostView(aggregateCostRows(rows), lastSuccessfulSyncAt);
}

export function latestSyncAt(dates: Array<Date | null | undefined>): Date | null {
  let latest: Date | null = null;
  for (const date of dates) {
    if (!date) {
      continue;
    }
    if (!latest || date > latest) {
      latest = date;
    }
  }
  return latest;
}

export function latestSyncForRows(
  rows: CostEntryRow[],
  syncAtByAccountId: ReadonlyMap<string, Date | null>,
): Date | null {
  const seen = new Set<string>();
  const dates: Array<Date | null> = [];
  for (const row of rows) {
    if (seen.has(row.providerAccountId)) {
      continue;
    }
    seen.add(row.providerAccountId);
    dates.push(syncAtByAccountId.get(row.providerAccountId) ?? null);
  }
  return latestSyncAt(dates);
}

export function latestSyncForAccounts(
  accounts: Array<{ providerKey: string; lastSuccessfulSyncAt: Date | null }>,
  providerKey?: string,
): Date | null {
  const matched = providerKey
    ? accounts.filter((account) => account.providerKey === providerKey)
    : accounts;
  return latestSyncAt(matched.map((account) => account.lastSuccessfulSyncAt));
}

export function costViewForRows(
  rows: CostEntryRow[],
  syncAtByAccountId: ReadonlyMap<string, Date | null>,
  fallbackSyncAt: Date | null,
): CostView {
  const syncAt = rows.length > 0 ? latestSyncForRows(rows, syncAtByAccountId) : fallbackSyncAt;
  return viewFromRows(rows, syncAt);
}
