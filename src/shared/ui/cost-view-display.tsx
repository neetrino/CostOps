import type { CostView } from '@/core/cost/types';
import { formatUsd } from '@/shared/money';
import { FreshnessBadge } from '@/shared/ui/freshness-badge';

type CostSize = 'sm' | 'md' | 'lg' | 'xl';

type CostViewDisplayProps = {
  cost: CostView;
  size?: CostSize;
  align?: 'start' | 'center';
  showFreshness?: boolean;
};

const SIZE_CLASS: Record<CostSize, string> = {
  sm: 'text-sm font-semibold',
  md: 'text-2xl font-semibold leading-none tracking-[-0.04em]',
  lg: 'text-[clamp(2.2rem,4.8vw,3.4rem)] font-semibold leading-none tracking-[-0.055em]',
  xl: 'text-[clamp(2.8rem,6vw,4.4rem)] font-semibold leading-none tracking-[-0.06em]',
};

function missingLabel(status: CostView['sourceStatus']): string {
  if (status === 'error') {
    return 'Unavailable';
  }
  if (status === 'missing') {
    return 'No data';
  }
  return '—';
}

export function CostViewDisplay({
  cost,
  size = 'md',
  align = 'start',
  showFreshness = true,
}: CostViewDisplayProps) {
  const amount =
    cost.costUsd === null ? (
      <span className="text-[var(--muted)]">{missingLabel(cost.sourceStatus)}</span>
    ) : (
      <span className="money whitespace-nowrap text-[var(--ink)]">{formatUsd(cost.costUsd)}</span>
    );

  const layout =
    align === 'center'
      ? 'flex flex-col items-center gap-2 text-center'
      : 'inline-flex flex-wrap items-center gap-2';

  return (
    <span className={`${layout} ${SIZE_CLASS[size]}`}>
      {amount}
      {showFreshness ? <FreshnessBadge status={cost.sourceStatus} compact={size === 'sm'} /> : null}
    </span>
  );
}

type CostMetricTone = 'dark' | 'signal';

type CostMetricTileProps = {
  label: string;
  cost: CostView;
  tone: CostMetricTone;
  size?: 'md' | 'lg';
};

export function CostMetricTile({ label, cost, tone, size = 'md' }: CostMetricTileProps) {
  const frame =
    size === 'lg'
      ? 'min-h-40 rounded-[var(--radius)] border border-[var(--line)] px-5 py-5 shadow-[var(--shadow-card)]'
      : 'min-h-[6.25rem] min-w-0 rounded-[var(--radius-sm)] px-3 py-4';

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${frame} ${
        tone === 'dark' ? 'dark-stage' : 'tone-signal'
      }`}
    >
      <p className="eyebrow">{label}</p>
      <div className={size === 'lg' ? 'mt-5' : 'mt-2'}>
        <CostViewDisplay cost={cost} size={size} align="center" />
      </div>
    </div>
  );
}
