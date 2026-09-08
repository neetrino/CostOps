import type { Freshness } from '@/providers/types';

const LABELS: Record<Freshness, string> = {
  fresh: 'Fresh',
  partial: 'Partial',
  final: 'Final',
  stale: 'Stale',
  error: 'Error',
  missing: 'Missing',
};

const TONE: Record<Freshness, string> = {
  fresh: 'bg-[var(--ok-soft)] text-[var(--ok)]',
  partial: 'bg-[var(--warning-soft)] text-[var(--warning)]',
  final: 'bg-[var(--ok-soft)] text-[var(--ok)]',
  stale: 'bg-[var(--stale-soft)] text-[var(--stale)]',
  error: 'bg-[var(--danger-soft)] text-[var(--danger)]',
  missing: 'bg-[var(--stale-soft)] text-[var(--stale)]',
};

type FreshnessBadgeProps = {
  status: Freshness;
  compact?: boolean;
};

export function FreshnessBadge({ status, compact = false }: FreshnessBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold tracking-[0.08em] uppercase ${TONE[status]} ${
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
      }`}
      title={`Data status: ${LABELS[status]}`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {LABELS[status]}
    </span>
  );
}
