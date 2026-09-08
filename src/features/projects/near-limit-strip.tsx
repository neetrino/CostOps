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
    <section className="overflow-hidden rounded-[var(--radius)] border border-[var(--warning)]/35 bg-[var(--warning-soft)] shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 border-b border-[var(--warning)]/15 px-4 py-3">
        <AppIcon name="alert" size={17} className="text-[var(--warning)]" />
        <div>
          <h2 className="text-xs font-semibold text-[var(--ink)]">Budget watch</h2>
          <p className="text-[11px] text-[var(--warning)]">Projects approaching a daily limit</p>
        </div>
      </div>
      <ul className="scrollbar-none flex snap-x gap-2 overflow-x-auto p-3">
        {rows.map((row) => (
          <li key={row.key} className="min-w-[82vw] snap-start sm:min-w-[20rem]">
            <Link
              href={`/projects/${row.projectSlug}`}
              className="block rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--paper-raised)] px-3.5 py-3 text-xs transition-[border-color,transform] hover:-translate-y-0.5 hover:border-[var(--warning)]/50"
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
