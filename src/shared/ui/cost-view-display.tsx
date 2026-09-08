import type { CostView } from '@/core/cost/types';
import { formatUsd } from '@/shared/money';
import { FreshnessBadge } from '@/shared/ui/freshness-badge';

type CostViewDisplayProps = {
  cost: CostView;
  size?: 'sm' | 'md' | 'lg';
  showFreshness?: boolean;
};

const SIZE_CLASS: Record<NonNullable<CostViewDisplayProps['size']>, string> = {
  sm: 'text-sm font-semibold',
  md: 'text-xl font-semibold',
  lg: 'text-[clamp(1.8rem,4vw,2.65rem)] font-semibold leading-none tracking-[-0.055em]',
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

export function CostViewDisplay({ cost, size = 'md', showFreshness = true }: CostViewDisplayProps) {
  const amount =
    cost.costUsd === null ? (
      <span className="text-[var(--muted)]">{missingLabel(cost.sourceStatus)}</span>
    ) : (
      <span className="money text-[var(--ink)]">{formatUsd(cost.costUsd)}</span>
    );

  return (
    <span className={`inline-flex flex-wrap items-center gap-2 ${SIZE_CLASS[size]}`}>
      {amount}
      {showFreshness ? <FreshnessBadge status={cost.sourceStatus} compact={size === 'sm'} /> : null}
    </span>
  );
}
