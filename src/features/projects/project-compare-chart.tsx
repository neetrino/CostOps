'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CompareBarDatum } from '@/features/projects/chart-data';
import { formatChartUsd } from '@/features/projects/chart-data';
import { chartColor } from '@/shared/ui/chart-colors';
import { EmptyPanel } from '@/shared/ui/state-panels';

const CHART_HEIGHT = 360;
const GRID = 'var(--chart-grid)';
const AXIS = 'var(--chart-axis)';

type ProjectCompareChartProps = {
  data: CompareBarDatum[];
  title?: string;
  subtitle?: string;
  emptyTitle?: string;
};

export function ProjectCompareChart({
  data,
  title = 'Project comparison',
  subtitle = 'Period estimated cost (USD)',
  emptyTitle = 'No comparable projects',
}: ProjectCompareChartProps) {
  if (data.length === 0) {
    return <EmptyPanel title={emptyTitle} detail="Costs may be missing in this range." />;
  }

  return (
    <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-[var(--shadow-card)]">
      <h3 className="text-sm font-semibold text-[var(--ink)]">{title}</h3>
      <p className="mt-1 text-xs text-[var(--muted)]">{subtitle}</p>
      <div className="mt-4 overflow-x-auto">
        <div style={{ minWidth: Math.max(520, data.length * 88), height: CHART_HEIGHT }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 16, right: 12, left: 4, bottom: 48 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
                axisLine={{ stroke: AXIS }}
                tickLine={false}
                interval={0}
                angle={-28}
                textAnchor="end"
                height={56}
              />
              <YAxis
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
                axisLine={{ stroke: AXIS }}
                tickLine={false}
                tickFormatter={(value: number) => `$${value}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]?.payload) {
                    return null;
                  }
                  const row = payload[0].payload as CompareBarDatum;
                  return (
                    <div className="rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-xs shadow-[var(--shadow-card)]">
                      <p className="font-semibold text-[var(--ink)]">{row.fullName}</p>
                      <p className="mt-1 font-[family-name:var(--font-mono)] tabular-nums">
                        {row.costUsd === null ? '—' : formatChartUsd(row.costUsd)}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="costUsd" radius={[4, 4, 0, 0]}>
                {data.map((row, index) => (
                  <Cell key={row.projectId} fill={chartColor(index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
