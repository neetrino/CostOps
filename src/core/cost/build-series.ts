import { costViewForRows } from '@/core/cost/cost-view';
import { enumeratePeriodKeys, periodKeyForDate } from '@/core/cost/series-buckets';
import { unmappedRows } from '@/core/cost/filter-entries';
import type { CostEntryRow, CostView } from '@/core/cost/types';
import type { GroupBy } from '@/shared/dashboard-query';

export type CostSeriesPoint = {
  period: string;
  total: CostView;
  byProject: Record<string, CostView>;
  byProvider: Record<string, CostView>;
  unmapped: CostView;
};

export function buildCostSeries(input: {
  from: Date;
  to: Date;
  groupBy: GroupBy;
  rows: CostEntryRow[];
  syncAtByAccountId: ReadonlyMap<string, Date | null>;
  fallbackSyncAt: Date | null;
}): CostSeriesPoint[] {
  const grouped = new Map<string, CostEntryRow[]>();
  for (const row of input.rows) {
    const key = periodKeyForDate(row.bucketDate, input.groupBy);
    const bucket = grouped.get(key);
    if (bucket) {
      bucket.push(row);
    } else {
      grouped.set(key, [row]);
    }
  }
  return enumeratePeriodKeys(input.from, input.to, input.groupBy).map((period) => {
    const rows = grouped.get(period) ?? [];
    return {
      period,
      total: costViewForRows(rows, input.syncAtByAccountId, input.fallbackSyncAt),
      byProject: viewsByKey(rows, (row) => row.projectId, input.syncAtByAccountId),
      byProvider: viewsByKey(rows, (row) => row.providerKey, input.syncAtByAccountId),
      unmapped: costViewForRows(unmappedRows(rows), input.syncAtByAccountId, input.fallbackSyncAt),
    };
  });
}

function viewsByKey(
  rows: CostEntryRow[],
  keyOf: (row: CostEntryRow) => string | null,
  syncAtByAccountId: ReadonlyMap<string, Date | null>,
): Record<string, CostView> {
  const groups = new Map<string, CostEntryRow[]>();
  for (const row of rows) {
    const key = keyOf(row);
    if (!key) {
      continue;
    }
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(row);
    } else {
      groups.set(key, [row]);
    }
  }
  const result: Record<string, CostView> = {};
  for (const [key, group] of groups) {
    result[key] = costViewForRows(group, syncAtByAccountId, null);
  }
  return result;
}
