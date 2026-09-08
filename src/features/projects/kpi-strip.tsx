'use client';

import type { CostView } from '@/core/cost/types';
import { providerUiLabel } from '@/shared/provider-label';
import { compareProviderNavOrder } from '@/shared/registered-providers';
import { CostViewDisplay } from '@/shared/ui/cost-view-display';

type KpiStripProps = {
  byProvider: Array<{ providerKey: string; displayName: string; cost: CostView }>;
  loading: boolean;
};

function periodCostHint(sourceType: CostView['sourceType'], providerKey?: string): string {
  if (providerKey === 'VERCEL') {
    return 'Current billing cycle · credit counted';
  }
  if (sourceType === 'API') {
    return 'API usage · period total';
  }
  if (sourceType === 'FIXED') {
    return 'Fixed cost · period total';
  }
  return 'Approximate · period total';
}

export function KpiStrip({ byProvider, loading }: KpiStripProps) {
  if (loading) {
    return (
      <div className="scrollbar-none flex snap-x gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 min-w-[76vw] snap-start animate-pulse rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] sm:min-w-0"
          />
        ))}
      </div>
    );
  }

  const tiles = [...byProvider].sort((left, right) =>
    compareProviderNavOrder(left.providerKey, right.providerKey),
  );

  return (
    <section className="overflow-hidden rounded-[var(--radius)] border border-[var(--line-strong)] bg-[var(--paper-raised)] shadow-[var(--shadow-card)]">
      <div className="scrollbar-none flex snap-x overflow-x-auto sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
        {tiles.map((tile, index) => (
          <div
            key={tile.providerKey}
            className="min-w-[76vw] snap-start border-r border-[var(--line)] px-5 py-5 last:border-r-0 sm:min-w-0 sm:border-b sm:[&:nth-child(2n)]:border-r-0 sm:[&:nth-last-child(-n+2)]:border-b-0 lg:border-b-0 lg:[&:nth-child(2n)]:border-r"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="eyebrow">{providerUiLabel(tile.providerKey) || tile.displayName}</p>
              <span className="money flex size-7 items-center justify-center rounded-md bg-[var(--sunken)] text-[10px] text-[var(--muted)]">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <div className="mt-4">
              <CostViewDisplay cost={tile.cost} size="md" />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-[var(--muted)]">
              {periodCostHint(tile.cost.sourceType, tile.providerKey)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
