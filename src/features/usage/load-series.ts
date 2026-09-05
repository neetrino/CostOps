import { COST_SERIES_METRIC } from '@/config/constants';
import { buildCostSeries } from '@/core/cost/build-series';
import { latestSyncForAccounts } from '@/core/cost/cost-view';
import {
  accountSyncMap,
  loadAccountSyncRows,
  loadRangeCostRows,
} from '@/core/cost/load-range-rows';
import { buildMetricSeries } from '@/core/metrics/build-series';
import { loadRangeMetricRows } from '@/core/metrics/load-range';
import { periodHoursForKey } from '@/core/cost/series-buckets';
import { metricDisplayUnit, toMetricDisplayValue } from '@/features/usage/metric-display';
import { rangePayload, type ResolvedDashboardQuery } from '@/shared/dashboard-query';

export async function loadUsageSeries(query: ResolvedDashboardQuery) {
  const metric = query.metric;
  if (metric === COST_SERIES_METRIC) {
    const [rows, accounts] = await Promise.all([
      loadRangeCostRows({
        from: query.from,
        to: query.to,
        projectId: query.projectId,
        providerKey: query.providerKey,
      }),
      loadAccountSyncRows(),
    ]);
    const fallback = latestSyncForAccounts(accounts, query.providerKey);
    return {
      metric: COST_SERIES_METRIC,
      displayUnit: 'usd',
      range: rangePayload(query),
      points: buildCostSeries({
        from: query.from,
        to: query.to,
        groupBy: query.groupBy,
        rows,
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
