import Link from 'next/link';
import type { BoardNearLimitItem } from '@/features/projects/near-limit-from-projects';
import { CostViewDisplay } from '@/shared/ui/cost-view-display';
import { providerUiLabel } from '@/shared/provider-label';
import { formatUsd } from '@/shared/money';

type NearLimitStripProps = {
  rows: BoardNearLimitItem[];
};

export function NearLimitStrip({ rows }: NearLimitStripProps) {
  if (rows.length === 0) {
    return null;
  }
  return (
    <section className="rounded-[var(--radius)] border border-[var(--warning)]/35 bg-[var(--warning-soft)] px-4 py-3 shadow-[var(--shadow-card)]">
      <h2 className="text-xs font-semibold tracking-wide text-[var(--ink)] uppercase">
        Near daily limit
      </h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {rows.map((row) => (
          <li key={row.key}>
            <Link
              href={`/projects/${row.projectSlug}`}
              className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--paper)] px-2.5 py-1.5 text-xs transition hover:border-[var(--line-strong)]"
            >
              <span className="font-medium text-[var(--ink)]">
                {row.projectName}
                <span className="text-[var(--muted)]"> · {providerUiLabel(row.providerKey)}</span>
              </span>
              <span className="text-[var(--muted)]">{row.usagePercent}%</span>
              <CostViewDisplay cost={row.spend} size="sm" />
              <span className="text-[var(--muted)]">/ {formatUsd(row.limitUsd)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
