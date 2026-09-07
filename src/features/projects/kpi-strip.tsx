'use client';

import type { CostView } from '@/core/cost/types';
import { CostViewDisplay } from '@/shared/ui/cost-view-display';

type KpiStripProps = {
  total: CostView;
  byProvider: Array<{ providerKey: string; displayName: string; cost: CostView }>;
  loading: boolean;
};

function periodCostLabel(sourceType: CostView['sourceType']): string {
  if (sourceType === 'API') {
    return 'Billed cost';
  }
  if (sourceType === 'FIXED') {
    return 'Fixed cost';
  }
  if (sourceType === 'MANUAL') {
    return 'Manual cost';
  }
  return 'Estimated cost';
}

function periodCostHint(sourceType: CostView['sourceType']): string {
  if (sourceType === 'API') {
    return 'API billed · period total';
  }
  return 'Approximate · period total';
}

export function KpiStrip({ total, byProvider, loading }: KpiStripProps) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)]"
          />
        ))}
      </div>
    );
  }

  const tiles = [
    { label: periodCostLabel(total.sourceType), cost: total },
    ...byProvider.slice(0, 3).map((row) => ({
      label: row.displayName,
      cost: row.cost,
    })),
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-4 py-4 shadow-[var(--shadow-card)]"
        >
          <p className="text-[11px] font-semibold tracking-wide text-[var(--muted)] uppercase">
            {tile.label}
          </p>
          <div className="mt-2">
            <CostViewDisplay cost={tile.cost} size="md" />
          </div>
          <p className="mt-2 text-[10px] text-[var(--muted)]">
            {periodCostHint(tile.cost.sourceType)}
          </p>
        </div>
      ))}
    </div>
  );
}
