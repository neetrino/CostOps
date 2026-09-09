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

const BAR_SLOT_PX = 92;
const CHART_MIN_WIDTH_PX = 760;
const CHART_HEIGHT_PX = 410;
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

  const rankedData = [...data].sort(
    (left, right) =>
      (right.costUsd ?? Number.NEGATIVE_INFINITY) - (left.costUsd ?? Number.NEGATIVE_INFINITY),
  );
  const innerWidth = Math.max(CHART_MIN_WIDTH_PX, rankedData.length * BAR_SLOT_PX + 72);

  return (
    <ChartPanel
      title={title}
      subtitle={`${subtitle} · top spenders first · scroll right for all ${data.length}`}
      index="04"
      accent="signal"
    >
      <div className="chart-scroll overflow-x-auto overflow-y-hidden pb-2">
        <div style={{ width: innerWidth, height: CHART_HEIGHT_PX }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rankedData}
              margin={{ top: 38, right: 20, left: 4, bottom: 70 }}
              barCategoryGap="24%"
            >
              <CartesianGrid stroke={GRID} vertical={false} strokeDasharray="4 8" />
              <XAxis
                type="category"
                dataKey="label"
                tick={{ fill: 'var(--muted)', fontSize: 10 }}
                axisLine={{ stroke: AXIS }}
                tickLine={false}
                interval={0}
                angle={-34}
                textAnchor="end"
                height={72}
              />
              <YAxis
                type="number"
                tick={{ fill: 'var(--muted)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={52}
                tickFormatter={formatChartAxisUsd}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255, 253, 245, 0.055)', radius: 12 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]?.payload) {
                    return null;
                  }
                  const row = payload[0].payload as CompareBarDatum;
                  return (
                    <div className="rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-xs shadow-[var(--shadow-card)]">
                      <p className="eyebrow mb-1 !text-[var(--accent)]">Spend rank</p>
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
                radius={[12, 12, 3, 3]}
                maxBarSize={48}
                isAnimationActive
                animationBegin={100}
                animationDuration={820}
                animationEasing="ease-out"
              >
                {rankedData.map((row) => (
                  <Cell key={row.projectId} fill={chartColorForKey(row.projectId)} />
                ))}
                <LabelList
                  dataKey="costUsd"
                  position="top"
                  fill="var(--ink)"
                  fontSize={11}
                  fontWeight={600}
                  formatter={(value) =>
                    typeof value === 'number' ? formatChartBarLabel(value) : ''
                  }
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between gap-4 border-t border-white/10 px-2 pt-4 text-[10px] text-[var(--muted)]">
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[var(--signal)]" /> Ranked by selected period
        </span>
        <span className="font-[family-name:var(--font-mono)] tracking-[0.12em] uppercase">
          Horizontal browse →
        </span>
      </div>
    </ChartPanel>
  );
}
