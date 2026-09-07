'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CostSeriesPoint } from '@/core/cost/build-series';
import {
  buildProviderStackData,
  formatChartUsd,
  toProviderChartRows,
} from '@/features/projects/chart-data';
import { formatChartAxisUsd } from '@/features/projects/chart-format';
import { ChartPanel } from '@/features/projects/chart-panel';
import { providerUiLabel } from '@/shared/provider-label';
import { chartColor } from '@/shared/ui/chart-colors';
import { EmptyPanel } from '@/shared/ui/state-panels';

const CHART_HEIGHT_PX = 380;

type ProviderStackChartProps = {
  points: CostSeriesPoint[];
  providerKeys: string[];
};

export function ProviderStackChart({ points, providerKeys }: ProviderStackChartProps) {
  const { rows, keys } = useMemo(() => {
    const stacked = buildProviderStackData(points, providerKeys);
    return {
      rows: toProviderChartRows(stacked, providerKeys),
      keys: providerKeys,
    };
  }, [points, providerKeys]);

  if (rows.length === 0 || keys.length === 0) {
    return (
      <EmptyPanel
        title="No provider series"
        detail="Mapped providers will stack here after sync."
      />
    );
  }

  return (
    <ChartPanel
      title="Cost over time"
      subtitle="Mapped providers stacked (USD). Missing series are omitted — not $0."
    >
      <div style={{ height: CHART_HEIGHT_PX }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
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
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) {
                  return null;
                }
                return (
                  <div className="max-w-xs rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-xs shadow-[var(--shadow-card)]">
                    <p className="font-semibold text-[var(--ink)]">{label}</p>
                    <ul className="mt-2 space-y-1">
                      {payload.map((entry) => (
                        <li key={String(entry.dataKey)} className="flex justify-between gap-4">
                          <span className="text-[var(--muted)]">{entry.name}</span>
                          <span className="font-[family-name:var(--font-mono)] tabular-nums">
                            {typeof entry.value === 'number' ? formatChartUsd(entry.value) : '—'}
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
              formatter={(value: string) => <span className="text-[var(--muted)]">{value}</span>}
            />
            {keys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                name={providerUiLabel(key)}
                stackId="providers"
                fill={chartColor(index)}
                maxBarSize={36}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartPanel>
  );
}
