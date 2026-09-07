'use client';

import { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CostSeriesPoint } from '@/core/cost/build-series';
import { chartColor } from '@/shared/ui/chart-colors';
import { formatUsd } from '@/shared/money';
import { EmptyPanel } from '@/shared/ui/state-panels';

type UsageSeriesChartProps = {
  points: CostSeriesPoint[];
  projectNames: Record<string, string>;
};

export function UsageSeriesChart({ points, projectNames }: UsageSeriesChartProps) {
  const { chartRows, seriesKeys } = useMemo(
    () => buildChartRows(points, projectNames),
    [points, projectNames],
  );

  if (chartRows.length === 0 || seriesKeys.length === 0) {
    return <EmptyPanel title="No series data" detail="Try a wider date range or run sync." />;
  }

  return (
    <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-[var(--shadow-card)]">
      <h3 className="text-sm font-semibold text-[var(--ink)]">Usage over time</h3>
      <p className="mt-1 text-xs text-[var(--muted)]">Cost by project (USD)</p>
      <div className="mt-4 h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartRows} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="period"
              tick={{ fill: 'var(--muted)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--chart-axis)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--muted)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--chart-axis)' }}
              tickLine={false}
              tickFormatter={(value: number) => `$${value}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) {
                  return null;
                }
                return (
                  <div className="max-w-xs rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-xs shadow-[var(--shadow-card)]">
                    <p className="font-semibold text-[var(--ink)]">{label}</p>
                    <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                      {payload.map((entry) => (
                        <li key={String(entry.dataKey)} className="flex justify-between gap-4">
                          <span className="text-[var(--muted)]">{entry.name}</span>
                          <span className="font-[family-name:var(--font-mono)] tabular-nums">
                            {typeof entry.value === 'number' ? formatUsd(entry.value) : '—'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
              formatter={(value: string) => (
                <span className="text-[var(--muted)]">{projectNames[value] ?? value}</span>
              )}
            />
            {seriesKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={key}
                stroke={chartColor(index)}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function buildChartRows(
  points: CostSeriesPoint[],
  projectNames: Record<string, string>,
): { chartRows: Array<Record<string, string | number>>; seriesKeys: string[] } {
  const totals = new Map<string, number>();
  for (const point of points) {
    for (const [projectId, view] of Object.entries(point.byProject)) {
      if (view.costUsd === null) {
        continue;
      }
      totals.set(projectId, (totals.get(projectId) ?? 0) + view.costUsd);
    }
  }
  const seriesKeys = [...totals.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([projectId]) => projectId)
    .filter((id) => projectNames[id] || id);

  const chartRows = points.map((point) => {
    const row: Record<string, string | number> = { period: point.period };
    for (const key of seriesKeys) {
      const view = point.byProject[key];
      row[key] = view?.costUsd ?? 0;
    }
    return row;
  });

  return { chartRows, seriesKeys };
}
