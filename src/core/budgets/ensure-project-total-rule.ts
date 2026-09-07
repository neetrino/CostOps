import { budgetScopeKey } from '@/core/budgets/scope-key';
import { defaultBudgetLimits } from '@/core/budgets/defaults';
import { prisma } from '@/shared/db';

export async function ensureProjectTotalBudgetRule(input: {
  projectId: string;
}): Promise<{ id: string; limitUsd: number; escalationPercent: number }> {
  const scopeKey = budgetScopeKey({
    scope: 'PROJECT_TOTAL',
    projectId: input.projectId,
  });
  const defaults = defaultBudgetLimits();
  const existing = await prisma.budgetRule.findUnique({ where: { scopeKey } });
  if (existing) {
    return {
      id: existing.id,
      limitUsd: Number(existing.limitUsd.toString()),
      escalationPercent: Number(existing.escalationPercent.toString()),
    };
  }
  const created = await prisma.budgetRule.create({
    data: {
      scopeKey,
      scope: 'PROJECT_TOTAL',
      projectId: input.projectId,
      limitUsd: defaults.limitUsd.toFixed(4),
      escalationPercent: defaults.escalationPercent.toFixed(2),
      enabled: false,
    },
  });
  return {
    id: created.id,
    limitUsd: defaults.limitUsd,
    escalationPercent: defaults.escalationPercent,
  };
}
