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
import { chartColorForKey } from '@/shared/ui/chart-colors';
import { EmptyPanel } from '@/shared/ui/state-panels';

const BAR_SLOT_PX = 46;
const CHART_MIN_HEIGHT_PX = 300;
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

  const innerHeight = Math.max(CHART_MIN_HEIGHT_PX, data.length * BAR_SLOT_PX + 44);

  return (
    <ChartPanel title={title} subtitle={`${subtitle} · ${data.length} with cost`}>
      <div className="max-h-[44rem] overflow-y-auto pr-1">
        <div style={{ width: '100%', height: innerHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 54, left: 8, bottom: 16 }}
            >
              <CartesianGrid stroke={GRID} horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: 'var(--muted)', fontSize: 10 }}
                axisLine={{ stroke: AXIS }}
                tickLine={false}
                tickFormatter={formatChartAxisUsd}
                label={{
                  value: 'USD',
                  position: 'insideBottomRight',
                  offset: -8,
                  fill: 'var(--muted)',
                  fontSize: 10,
                }}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={112}
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
                      <p className="money mt-1">
                        {row.costUsd === null ? '—' : formatChartUsd(row.costUsd)}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="costUsd"
                radius={[0, 6, 6, 0]}
                maxBarSize={20}
                isAnimationActive
                animationDuration={420}
              >
                {data.map((row) => (
                  <Cell key={row.projectId} fill={chartColorForKey(row.projectId)} />
                ))}
                <LabelList
                  dataKey="costUsd"
                  position="right"
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
