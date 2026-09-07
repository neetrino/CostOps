import type { CostSeriesPoint } from '@/core/cost/build-series';
import type { CostView } from '@/core/cost/types';
import { formatUsd } from '@/shared/money';

export type CompareBarDatum = {
  projectId: string;
  label: string;
  fullName: string;
  costUsd: number | null;
  sourceStatus: CostView['sourceStatus'];
};

export function buildCompareBarData(
  projects: Array<{ projectId: string; name: string; cost: CostView }>,
  limit?: number,
): CompareBarDatum[] {
  const ranked = [...projects]
    .filter((row) => row.cost.costUsd !== null)
    .sort((left, right) => (right.cost.costUsd ?? 0) - (left.cost.costUsd ?? 0));
  const sliced = limit === undefined ? ranked : ranked.slice(0, limit);
  return sliced.map((row) => ({
    projectId: row.projectId,
    label: truncateLabel(row.name),
    fullName: row.name,
    costUsd: row.cost.costUsd,
    sourceStatus: row.cost.sourceStatus,
  }));
}

export type UsageSeriesKey = {
  projectId: string;
  name: string;
  totalUsd: number;
};

export type UsageSeriesModel = {
  chartRows: Array<Record<string, string | number>>;
  series: UsageSeriesKey[];
};

/**
 * Ranks projects by summed period cost. Missing day costs stay omitted
 * (not written as $0) so lines do not invent spend.
 */
export function buildUsageSeriesModel(
  points: CostSeriesPoint[],
  projectNames: Record<string, string>,
  visibleIds?: ReadonlySet<string>,
): UsageSeriesModel {
  const totals = new Map<string, number>();
  for (const point of points) {
    for (const [projectId, view] of Object.entries(point.byProject)) {
      if (visibleIds && !visibleIds.has(projectId)) {
        continue;
      }
      if (view.costUsd === null) {
        continue;
      }
      totals.set(projectId, (totals.get(projectId) ?? 0) + view.costUsd);
    }
  }
  const series = [...totals.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([projectId, totalUsd]) => ({
      projectId,
      name: projectNames[projectId] ?? projectId,
      totalUsd,
    }));

  const chartRows = points.map((point) => {
    const row: Record<string, string | number> = { period: point.period };
    for (const item of series) {
      const view = point.byProject[item.projectId];
      if (view?.costUsd !== null && view?.costUsd !== undefined) {
        row[item.projectId] = view.costUsd;
      }
    }
    return row;
  });

  return { chartRows, series };
}

export type ProviderStackDatum = {
  period: string;
  values: Record<string, number | null>;
};

export function buildProviderStackData(
  points: CostSeriesPoint[],
  providerKeys: string[],
): ProviderStackDatum[] {
  return points.map((point) => {
    const values: Record<string, number | null> = {};
    for (const key of providerKeys) {
      const view = point.byProvider[key];
      values[key] = view?.costUsd ?? null;
    }
    return { period: point.period, values };
  });
}

export function toProviderChartRows(
  data: ProviderStackDatum[],
  providerKeys: string[],
): Array<Record<string, string | number>> {
  return data.map((point) => {
    const row: Record<string, string | number> = { period: point.period };
    for (const key of providerKeys) {
      const value = point.values[key];
      if (value !== null && value !== undefined) {
        row[key] = value;
      }
    }
    return row;
  });
}

function truncateLabel(name: string): string {
  if (name.length <= 20) {
    return name;
  }
  return `${name.slice(0, 18)}…`;
}

export function formatChartUsd(value: number): string {
  return formatUsd(value);
}
