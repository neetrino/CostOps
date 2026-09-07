import type { CostView } from '@/core/cost/types';

type NamedPeriodCost = {
  name: string;
  period: CostView;
};

/**
 * Highest period cost first. Missing cost is last — never ranked as $0.
 */
export function compareByPeriodCostDesc(left: NamedPeriodCost, right: NamedPeriodCost): number {
  const leftUsd = left.period.costUsd;
  const rightUsd = right.period.costUsd;
  if (leftUsd === null && rightUsd === null) {
    return left.name.localeCompare(right.name);
  }
  if (leftUsd === null) {
    return 1;
  }
  if (rightUsd === null) {
    return -1;
  }
  if (rightUsd !== leftUsd) {
    return rightUsd - leftUsd;
  }
  return left.name.localeCompare(right.name);
}

export function sortByPeriodCostDesc<T extends NamedPeriodCost>(items: readonly T[]): T[] {
  return [...items].sort(compareByPeriodCostDesc);
}
