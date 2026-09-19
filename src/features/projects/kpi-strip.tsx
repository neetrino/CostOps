'use client';

import type { CostView } from '@/core/cost/types';
import { motion } from 'motion/react';
import { providerUiLabel } from '@/shared/provider-label';
import { providerStageClass } from '@/shared/provider-tone';
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
      <div className="scrollbar-none flex snap-x gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-36 min-w-[76vw] snap-start animate-pulse rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] sm:min-w-0"
          />
        ))}
      </div>
    );
  }

  const tiles = [...byProvider].sort((left, right) =>
    compareProviderNavOrder(left.providerKey, right.providerKey),
  );

  return (
    <section>
      <div className="scrollbar-none flex snap-x gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible xl:grid-cols-4">
        {tiles.map((tile, index) => (
          <motion.div
            key={tile.providerKey}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.34, delay: index * 0.055 }}
            whileHover={{ y: -5, rotate: index % 2 === 0 ? -0.35 : 0.35 }}
            className={`relative flex min-h-44 min-w-[76vw] snap-start flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--line)] p-5 shadow-[var(--shadow-card)] sm:min-w-0 ${providerStageClass(tile.providerKey)}`}
          >
            <span className="absolute -right-5 -bottom-9 font-[family-name:var(--font-display)] text-[7rem] leading-none font-extrabold text-[var(--ink)] opacity-[0.055]">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="flex items-center justify-between gap-3">
              <p className="eyebrow">{providerUiLabel(tile.providerKey) || tile.displayName}</p>
              <span className="money flex size-7 items-center justify-center rounded-full border border-[var(--line)] bg-white/15 text-[10px] text-[var(--muted)]">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <div className="mt-5 flex flex-1 flex-col items-center justify-center">
              <CostViewDisplay cost={tile.cost} size="lg" align="center" />
            </div>
            <p className="mt-4 text-center text-[11px] leading-relaxed text-[var(--muted)]">
              {periodCostHint(tile.cost.sourceType, tile.providerKey)}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
