'use client';

import type { CostView } from '@/core/cost/types';
import { motion } from 'motion/react';
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
            className={`relative min-h-36 min-w-[76vw] snap-start overflow-hidden rounded-[var(--radius)] border border-[var(--line)] p-5 shadow-[var(--shadow-card)] sm:min-w-0 ${tileTone(index)}`}
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
            <div className="mt-4">
              <CostViewDisplay cost={tile.cost} size="md" />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-[var(--muted)]">
              {periodCostHint(tile.cost.sourceType, tile.providerKey)}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function tileTone(index: number): string {
  const tones = ['dark-stage', 'tone-signal', 'tone-violet', 'tone-accent'] as const;
  return tones[index % tones.length];
}
