'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CompareBarDatum } from '@/features/projects/chart-data';
import { formatChartUsd } from '@/features/projects/chart-data';
import { formatChartAxisUsd, formatChartBarLabel } from '@/features/projects/chart-format';
import { ChartPanel } from '@/features/projects/chart-panel';
import { chartColor } from '@/shared/ui/chart-colors';
import { EmptyPanel } from '@/shared/ui/state-panels';

const BAR_SLOT_PX = 88;
const CHART_HEIGHT_PX = 400;
const CHART_MIN_WIDTH_PX = 520;
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
  subtitle = 'Period cost (USD), ranked',
  emptyTitle = 'No comparable projects',
}: ProjectCompareChartProps) {
  if (data.length === 0) {
    return <EmptyPanel title={emptyTitle} detail="Costs may be missing in this range." />;
  }

  const innerWidth = Math.max(CHART_MIN_WIDTH_PX, data.length * BAR_SLOT_PX);

  return (
    <ChartPanel title={title} subtitle={`${subtitle} · ${data.length} with cost`}>
      <div className="overflow-x-auto pb-1">
        <div style={{ width: innerWidth, minWidth: '100%', height: CHART_HEIGHT_PX }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 28, right: 12, left: 4, bottom: 48 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--muted)', fontSize: 10 }}
                axisLine={{ stroke: AXIS }}
                tickLine={false}
                interval={0}
                angle={-32}
                textAnchor="end"
                height={52}
              />
              <YAxis
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={formatChartAxisUsd}
                label={{
                  value: 'USD',
                  angle: -90,
                  position: 'insideLeft',
                  fill: 'var(--muted)',
                  fontSize: 11,
                }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(28, 25, 23, 0.04)' }}
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
              <Bar dataKey="costUsd" radius={[6, 6, 0, 0]} maxBarSize={BAR_SLOT_PX - 18} isAnimationActive={false}>
                {data.map((row, index) => (
                  <Cell key={row.projectId} fill={chartColor(index)} />
                ))}
                <LabelList
                  dataKey="costUsd"
                  position="top"
                  fill="var(--muted)"
                  fontSize={10}
                  formatter={(value) =>
                    typeof value === 'number' ? formatChartBarLabel(value) : ''
                  }
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ChartPanel>
  );
}
