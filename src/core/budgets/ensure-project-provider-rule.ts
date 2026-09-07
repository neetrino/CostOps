import { budgetScopeKey } from '@/core/budgets/scope-key';
import { defaultBudgetLimits } from '@/core/budgets/defaults';
import { prisma } from '@/shared/db';
import { isPrismaUniqueViolation } from '@/shared/prisma-errors';
import type { ProviderKey } from '@/generated/prisma/enums';

/**
 * Ensures a daily PROJECT_PROVIDER rule exists. New rules start at the env $1
 * default and **enabled** so Telegram watches spend without an operator Set.
 */
export async function ensureProjectProviderBudgetRule(input: {
  projectId: string;
  projectProviderId: string;
  providerKey: ProviderKey;
}): Promise<{
  id: string;
  limitUsd: number;
  escalationPercent: number;
  enabled: boolean;
}> {
  const scopeKey = budgetScopeKey({
    scope: 'PROJECT_PROVIDER',
    projectProviderId: input.projectProviderId,
  });
  const defaults = defaultBudgetLimits();
  const existing = await prisma.budgetRule.findUnique({ where: { scopeKey } });
  if (existing) {
    return {
      id: existing.id,
      limitUsd: Number(existing.limitUsd.toString()),
      escalationPercent: Number(existing.escalationPercent.toString()),
      enabled: existing.enabled,
    };
  }
  try {
    const created = await prisma.budgetRule.create({
      data: {
        scopeKey,
        scope: 'PROJECT_PROVIDER',
        projectId: input.projectId,
        projectProviderId: input.projectProviderId,
        providerKey: input.providerKey,
        limitUsd: defaults.limitUsd.toFixed(4),
        escalationPercent: defaults.escalationPercent.toFixed(2),
        enabled: true,
      },
    });
    return {
      id: created.id,
      limitUsd: defaults.limitUsd,
      escalationPercent: defaults.escalationPercent,
      enabled: created.enabled,
    };
  } catch (error) {
    if (!isPrismaUniqueViolation(error)) {
      throw error;
    }
    const raced = await prisma.budgetRule.findUniqueOrThrow({ where: { scopeKey } });
    return {
      id: raced.id,
      limitUsd: Number(raced.limitUsd.toString()),
      escalationPercent: Number(raced.escalationPercent.toString()),
      enabled: raced.enabled,
    };
  }
}
