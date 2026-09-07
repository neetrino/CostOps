import type { UsageSeriesKey } from '@/features/projects/chart-data';
import { formatChartUsd } from '@/features/projects/chart-data';
import { chartColor } from '@/shared/ui/chart-colors';

type UsageSeriesLegendProps = {
  series: UsageSeriesKey[];
  focusedId: string | null;
  onHover: (id: string | null) => void;
  onToggle: (id: string) => void;
};

export function UsageSeriesLegend({
  series,
  focusedId,
  onHover,
  onToggle,
}: UsageSeriesLegendProps) {
  return (
    <aside className="rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--canvas)] p-3">
      <p className="text-[11px] font-semibold tracking-wide text-[var(--muted)] uppercase">
        Ranked by period
      </p>
      <p className="mt-0.5 text-[11px] text-[var(--muted)]">Hover or click to highlight</p>
      <ul className="mt-2 max-h-[17rem] space-y-1.5 overflow-y-auto pr-1">
        {series.map((item, index) => {
          const isFocused = focusedId === item.projectId;
          const isDimmed = Boolean(focusedId) && !isFocused;
          return (
            <li key={item.projectId}>
              <button
                type="button"
                onClick={() => onToggle(item.projectId)}
                onMouseEnter={() => onHover(item.projectId)}
                onMouseLeave={() => onHover(null)}
                className={`flex w-full items-start justify-between gap-2 rounded-[var(--radius-sm)] border px-2 py-1.5 text-left transition ${
                  isFocused
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                    : 'border-[var(--line)] bg-[var(--paper)] hover:border-[var(--line-strong)]'
                }`}
                style={{ opacity: isDimmed ? 0.55 : 1 }}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-[var(--ink)]">
                    {index + 1}. {item.name}
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted)]">
                    {formatChartUsd(item.totalUsd)}
                  </span>
                </span>
                <span
                  className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: chartColor(index) }}
                  aria-hidden
                />
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
