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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)]"
          />
        ))}
      </div>
    );
  }

  const tiles = [...byProvider].sort((left, right) =>
    compareProviderNavOrder(left.providerKey, right.providerKey),
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((tile) => (
        <div
          key={tile.providerKey}
          className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-4 py-4 shadow-[var(--shadow-card)]"
        >
          <p className="text-[11px] font-semibold tracking-wide text-[var(--muted)] uppercase">
            {providerUiLabel(tile.providerKey) || tile.displayName}
          </p>
          <div className="mt-2">
            <CostViewDisplay cost={tile.cost} size="md" />
          </div>
          <p className="mt-2 text-[10px] text-[var(--muted)]">
            {periodCostHint(tile.cost.sourceType, tile.providerKey)}
          </p>
        </div>
      ))}
    </div>
  );
}
