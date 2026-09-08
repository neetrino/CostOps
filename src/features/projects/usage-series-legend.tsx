import type { UsageSeriesKey } from '@/features/projects/chart-data';
import { formatChartUsd } from '@/features/projects/chart-data';
import { chartColorForKey } from '@/shared/ui/chart-colors';

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
    <aside className="rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--sunken)] p-3">
      <p className="eyebrow">Ranked by period</p>
      <p className="mt-0.5 text-[11px] text-[var(--muted)]">Tap a project to focus its line</p>
      <ul className="scrollbar-none mt-2 flex snap-x gap-2 overflow-x-auto pb-1 xl:block xl:max-h-[17rem] xl:space-y-1.5 xl:overflow-y-auto xl:pr-1">
        {series.map((item, index) => {
          const isFocused = focusedId === item.projectId;
          const isDimmed = Boolean(focusedId) && !isFocused;
          return (
            <li key={item.projectId} className="min-w-[12rem] snap-start xl:min-w-0">
              <button
                type="button"
                onClick={() => onToggle(item.projectId)}
                onMouseEnter={() => onHover(item.projectId)}
                onMouseLeave={() => onHover(null)}
                className={`flex min-h-11 w-full items-start justify-between gap-2 rounded-[var(--radius-sm)] border px-2.5 py-2 text-left transition-colors ${
                  isFocused
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                    : 'border-[var(--line)] bg-[var(--paper-raised)] hover:border-[var(--line-strong)]'
                }`}
                style={{ opacity: isDimmed ? 0.55 : 1 }}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-[var(--ink)]">
                    {index + 1}. {item.name}
                  </span>
                  <span className="money text-[11px] text-[var(--muted)]">
                    {formatChartUsd(item.totalUsd)}
                  </span>
                </span>
                <span
                  className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: chartColorForKey(item.projectId) }}
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
