'use client';

import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CostSeriesPoint } from '@/core/cost/build-series';
import { buildUsageSeriesModel, formatChartUsd } from '@/features/projects/chart-data';
import { formatChartAxisUsd } from '@/features/projects/chart-format';
import { ChartPanel } from '@/features/projects/chart-panel';
import { UsageSeriesLegend } from '@/features/projects/usage-series-legend';
import { chartColor } from '@/shared/ui/chart-colors';
import { Button } from '@/shared/ui/button';
import { EmptyPanel } from '@/shared/ui/state-panels';

const CHART_HEIGHT_PX = 380;
const LINE_DIM = 0.2;
const LINE_NORMAL = 0.95;

type UsageSeriesChartProps = {
  points: CostSeriesPoint[];
  projectNames: Record<string, string>;
  visibleIds?: ReadonlySet<string>;
};

export function UsageSeriesChart({ points, projectNames, visibleIds }: UsageSeriesChartProps) {
  const { chartRows, series } = useMemo(
    () => buildUsageSeriesModel(points, projectNames, visibleIds),
    [points, projectNames, visibleIds],
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const focusedId = hoveredId ?? selectedId;

  if (chartRows.length === 0 || series.length === 0) {
    return <EmptyPanel title="No series data" detail="Try a wider date range or run sync." />;
  }

  return (
    <ChartPanel
      title="Cost over time"
      subtitle="USD by project · missing days are gaps, not $0"
      action={
        selectedId ? (
          <Button variant="ghost" className="px-2.5 py-1 text-xs" onClick={() => setSelectedId(null)}>
            Clear highlight
          </Button>
        ) : null
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="h-[300px] w-full sm:h-[380px]" style={{ minHeight: CHART_HEIGHT_PX }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartRows} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--chart-axis)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={formatChartAxisUsd}
              />
              <Tooltip
                content={({ active, payload, label }) =>
                  renderSeriesTooltip(Boolean(active), label, payload as unknown, series)
                }
              />
              {series.map((item, index) => {
                const isFocused = focusedId === item.projectId;
                const isDimmed = Boolean(focusedId) && !isFocused;
                return (
                  <Line
                    key={item.projectId}
                    type="monotone"
                    dataKey={item.projectId}
                    name={item.name}
                    stroke={chartColor(index)}
                    strokeWidth={isFocused ? 3.5 : 2}
                    strokeOpacity={isDimmed ? LINE_DIM : LINE_NORMAL}
                    dot={false}
                    connectNulls={false}
                    isAnimationActive={false}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--paper)' }}
                    onMouseEnter={() => setHoveredId(item.projectId)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() =>
                      setSelectedId((current) => (current === item.projectId ? null : item.projectId))
                    }
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <UsageSeriesLegend
          series={series}
          focusedId={focusedId}
          onHover={setHoveredId}
          onToggle={(id) => setSelectedId((current) => (current === id ? null : id))}
        />
      </div>
    </ChartPanel>
  );
}

function isTooltipRow(entry: unknown): entry is { dataKey: string; value: number } {
  if (typeof entry !== 'object' || entry === null) {
    return false;
  }
  const row = entry as { dataKey?: unknown; value?: unknown };
  return typeof row.dataKey === 'string' && typeof row.value === 'number';
}

function renderSeriesTooltip(
  active: boolean,
  label: string | number | undefined,
  payload: unknown,
  series: Array<{ projectId: string; name: string }>,
) {
  if (!active || !Array.isArray(payload) || payload.length === 0) {
    return null;
  }
  const valueById = new Map<string, number>();
  for (const entry of payload) {
    if (!isTooltipRow(entry)) {
      continue;
    }
    valueById.set(entry.dataKey, entry.value);
  }
  return (
    <div className="w-[18rem] rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--paper)] p-3 text-xs shadow-[var(--shadow-card)]">
      <p className="font-semibold text-[var(--ink)]">{label}</p>
      <p className="mt-0.5 text-[11px] text-[var(--muted)]">Same rank as the legend</p>
      <ul className="mt-2 max-h-[16rem] space-y-1 overflow-y-auto">
        {series.map((item) => {
          const value = valueById.get(item.projectId);
          return (
            <li key={item.projectId} className="flex justify-between gap-3">
              <span className="truncate text-[var(--muted)]">{item.name}</span>
              <span className="shrink-0 font-[family-name:var(--font-mono)] tabular-nums">
                {value === undefined ? '—' : formatChartUsd(value)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
