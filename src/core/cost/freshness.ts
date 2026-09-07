import type { CostSourceType, Freshness } from '@/providers/types';
import type { CostAggregate, CostRow } from '@/core/cost/types';

const STATUS_RANK: Record<Freshness, number> = {
  error: 6,
  missing: 5,
  stale: 4,
  partial: 3,
  fresh: 2,
  final: 1,
};

export function rollupFreshness(statuses: Freshness[]): Freshness {
  if (statuses.length === 0) {
    return 'missing';
  }
  return statuses.reduce((worst, status) =>
    STATUS_RANK[status] > STATUS_RANK[worst] ? status : worst,
  );
}

/**
 * Sum usable cost rows. Missing/error never become $0.
 */
export function aggregateCostRows(rows: CostRow[]): CostAggregate {
  if (rows.length === 0) {
    return {
      kind: 'missing',
      costUsd: null,
      sourceStatus: 'missing',
      sourceType: null,
      isPartial: false,
    };
  }
  const usable = rows.filter(
    (row) => row.sourceStatus !== 'error' && row.sourceStatus !== 'missing',
  );
  if (usable.length === 0) {
    return {
      kind: 'error',
      costUsd: null,
      sourceStatus: 'error',
      sourceType: null,
      isPartial: false,
    };
  }
  const costUsd = usable.reduce((sum, row) => sum + row.costUsd, 0);
  const sourceStatus = rollupFreshness(usable.map((row) => row.sourceStatus));
  const sourceType = usable.every((row) => row.sourceType === usable[0]?.sourceType)
    ? usable[0].sourceType
    : usable[0].sourceType;
  return {
    kind: 'value',
    costUsd,
    sourceStatus,
    sourceType: sourceType as CostSourceType,
    isPartial: usable.some((row) => row.isPartial) || sourceStatus === 'partial',
  };
}

export function displayCostUsd(aggregate: CostAggregate): number | null {
  return aggregate.costUsd;
}
