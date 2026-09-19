import { COST_SERIES_METRIC } from '@/config/constants';
import { buildCostSeries, type CostSeriesPoint } from '@/core/cost/build-series';
import { latestSyncForAccounts } from '@/core/cost/cost-view';
import { rowsInDashboardPeriod } from '@/core/cost/filter-entries';
import type { DashboardCostContext } from '@/core/cost/load-dashboard-costs';
import {
  accountSyncMap,
  loadAccountSyncRows,
  loadRangeCostRows,
} from '@/core/cost/load-range-rows';
import { buildMetricSeries } from '@/core/metrics/build-series';
import { loadRangeMetricRows } from '@/core/metrics/load-range';
import { periodHoursForKey } from '@/core/cost/series-buckets';
import { metricDisplayUnit, toMetricDisplayValue } from '@/features/usage/metric-display';
import {
  rangePayload,
  type RangePayload,
  type ResolvedDashboardQuery,
} from '@/shared/dashboard-query';

export type UsageSeriesResponse = Awaited<ReturnType<typeof loadUsageSeries>>;

export type CostUsageSeriesResponse = {
  metric: typeof COST_SERIES_METRIC;
  displayUnit: 'usd';
  range: RangePayload;
  points: CostSeriesPoint[];
};

export function requireCostSeries(series: UsageSeriesResponse): CostUsageSeriesResponse {
  if (series.metric !== COST_SERIES_METRIC || series.displayUnit !== 'usd') {
    throw new Error(`Dashboard boards expect cost series, got ${series.metric}`);
  }
  return {
    metric: COST_SERIES_METRIC,
    displayUnit: 'usd',
    range: series.range,
    points: series.points as CostSeriesPoint[],
  };
}

export async function loadUsageSeries(query: ResolvedDashboardQuery, cost?: DashboardCostContext) {
  const metric = query.metric;
  if (metric === COST_SERIES_METRIC) {
    const rows = cost
      ? cost.entries
      : await loadRangeCostRows({
          from: query.from,
          to: query.to,
          projectId: query.projectId,
          providerKey: query.providerKey,
        });
    const accounts = cost ? cost.accounts : await loadAccountSyncRows();
    const fallback = latestSyncForAccounts(accounts, query.providerKey);
    return {
      metric: COST_SERIES_METRIC,
      displayUnit: 'usd',
      range: rangePayload(query),
      points: buildCostSeries({
        from: query.from,
        to: query.to,
        groupBy: query.groupBy,
        rows: rowsInDashboardPeriod(rows, query.from, query.to, query.preset),
        syncAtByAccountId: accountSyncMap(accounts),
        fallbackSyncAt: fallback,
      }),
    };
  }

  const rows = await loadRangeMetricRows({
    from: query.from,
    to: query.to,
    metricKey: metric,
    projectId: query.projectId,
    providerKey: query.providerKey,
  });
  return {
    metric,
    displayUnit: metricDisplayUnit(metric),
    range: rangePayload(query),
    points: buildMetricSeries({
      from: query.from,
      to: query.to,
      groupBy: query.groupBy,
      rows,
      displayValue: (raw, hours) => toMetricDisplayValue(metric, raw, hours),
      periodHours: (period) => periodHoursForKey(period, query.groupBy),
    }),
  };
}
