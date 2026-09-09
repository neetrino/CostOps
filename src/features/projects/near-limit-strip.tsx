import Link from 'next/link';
import type { BoardNearLimitItem } from '@/features/projects/near-limit-from-projects';
import { CostViewDisplay } from '@/shared/ui/cost-view-display';
import { providerUiLabel } from '@/shared/provider-label';
import { formatUsd } from '@/shared/money';
import { AppIcon } from '@/shared/ui/app-icon';
import { BudgetMeter } from '@/shared/ui/budget-meter';

type NearLimitStripProps = {
  rows: BoardNearLimitItem[];
};

export function NearLimitStrip({ rows }: NearLimitStripProps) {
  if (rows.length === 0) {
    return null;
  }
  return (
    <section className="dark-stage overflow-hidden rounded-[var(--radius)] border border-white/10 shadow-[var(--shadow-card)]">
      <div className="h-1.5 bg-[var(--accent)]" />
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <span className="flex size-9 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)]">
          <AppIcon name="alert" size={17} />
        </span>
        <div>
          <p className="eyebrow !text-white/40">Priority signal</p>
          <h2 className="wordmark mt-0.5 text-xl text-[var(--ink)]">Budget watch</h2>
        </div>
        <p className="ml-auto hidden text-xs text-[var(--muted)] sm:block">
          Projects approaching a daily limit
        </p>
      </div>
      <ul className="scrollbar-none flex snap-x gap-3 overflow-x-auto p-4">
        {rows.map((row) => (
          <li key={row.key} className="min-w-[82vw] snap-start sm:min-w-[20rem]">
            <Link
              href={`/projects/${row.projectSlug}`}
              className="light-stage block rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--paper-raised)] px-4 py-3.5 text-xs shadow-[var(--shadow)] transition-[border-color,transform] hover:-translate-y-1 hover:border-[var(--accent)]"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-[var(--ink)]">
                    {row.projectName}
                  </span>
                  <span className="text-[var(--muted)]">{providerUiLabel(row.providerKey)}</span>
                </span>
                <span className="money text-sm font-semibold text-[var(--warning)]">
                  {row.usagePercent}%
                </span>
              </span>
              <span className="mt-3 block">
                <BudgetMeter spendUsd={row.spend.costUsd} limitUsd={row.limitUsd} compact />
              </span>
              <span className="mt-2 flex items-center justify-between gap-2 text-[11px] text-[var(--muted)]">
                <CostViewDisplay cost={row.spend} size="sm" showFreshness={false} />
                <span>of {formatUsd(row.limitUsd)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
