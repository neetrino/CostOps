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
  limit = 12,
): CompareBarDatum[] {
  const ranked = [...projects]
    .filter((row) => row.cost.costUsd !== null)
    .sort((left, right) => (right.cost.costUsd ?? 0) - (left.cost.costUsd ?? 0))
    .slice(0, limit);
  return ranked.map((row) => ({
    projectId: row.projectId,
    label: truncateLabel(row.name),
    fullName: row.name,
    costUsd: row.cost.costUsd,
    sourceStatus: row.cost.sourceStatus,
  }));
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
  if (name.length <= 14) {
    return name;
  }
  return `${name.slice(0, 12)}…`;
}

export function formatChartUsd(value: number): string {
  return formatUsd(value);
}
