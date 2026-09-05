import type { PlannedBudgetRule } from '@/scripts/migrate-from-neon/types';

export type ExistingBudgetRule = {
  limitUsd: number;
  escalationPercent: number;
  enabled: boolean;
};

export type BudgetRuleMergeResult =
  | { action: 'create'; rule: PlannedBudgetRule }
  | { action: 'update'; rule: PlannedBudgetRule }
  | { action: 'keep' };

/**
 * Merges a planned old-Neon budget rule with an existing CostOps rule.
 * Explicit old thresholds (planned.enabled) win on update; env-default rows do not clobber UI sets.
 */
export function mergeBudgetRule(
  existing: ExistingBudgetRule | null,
  planned: PlannedBudgetRule,
): BudgetRuleMergeResult {
  const explicitThreshold = planned.enabled;

  if (!existing) {
    return { action: 'create', rule: planned };
  }

  if (explicitThreshold) {
    return {
      action: 'update',
      rule: {
        limitUsd: planned.limitUsd,
        escalationPercent: planned.escalationPercent,
        enabled: true,
      },
    };
  }

  return { action: 'keep' };
}
