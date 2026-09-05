import { enumeratePeriodKeys, periodKeyForDate } from '@/core/cost/series-buckets';
import type { MetricEntryRow } from '@/core/metrics/load-range';
import type { GroupBy } from '@/shared/dashboard-query';

export type MetricSeriesPoint = {
  period: string;
  value: number | null;
  byProject: Record<string, number>;
  byProvider: Record<string, number>;
};

export function buildMetricSeries(input: {
  from: Date;
  to: Date;
  groupBy: GroupBy;
  rows: MetricEntryRow[];
  displayValue: (raw: number, periodHours: number) => number;
  periodHours: (period: string) => number;
}): MetricSeriesPoint[] {
  const grouped = new Map<string, MetricEntryRow[]>();
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
    const hours = input.periodHours(period);
    if (rows.length === 0) {
      return { period, value: null, byProject: {}, byProvider: {} };
    }
    const byProject = sumBy(rows, (row) => row.projectId, hours, input.displayValue);
    const byProvider = sumBy(rows, (row) => row.providerKey, hours, input.displayValue);
    const rawTotal = rows.reduce((sum, row) => sum + row.value, 0);
    return {
      period,
      value: input.displayValue(rawTotal, hours),
      byProject,
      byProvider,
    };
  });
}

function sumBy(
  rows: MetricEntryRow[],
  keyOf: (row: MetricEntryRow) => string | null,
  periodHours: number,
  displayValue: (raw: number, periodHours: number) => number,
): Record<string, number> {
  const raw: Record<string, number> = {};
  for (const row of rows) {
    const key = keyOf(row);
    if (!key) {
      continue;
    }
    raw[key] = (raw[key] ?? 0) + row.value;
  }
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    result[key] = displayValue(value, periodHours);
  }
  return result;
}
