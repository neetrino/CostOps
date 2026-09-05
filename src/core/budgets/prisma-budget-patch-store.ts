import { ensureProjectProviderBudgetRule } from '@/core/budgets/ensure-project-provider-rule';
import type { ProjectProviderBudgetStore } from '@/core/budgets/patch-project-provider-budget';
import { prisma } from '@/shared/db';
import { decimalToNumber } from '@/shared/money';

export function createPrismaBudgetPatchStore(): ProjectProviderBudgetStore {
  return {
    async findProjectProvider(id) {
      return prisma.projectProvider.findUnique({
        where: { id },
        select: { id: true, projectId: true, providerKey: true },
      });
    },
    async ensureRule(input) {
      return ensureProjectProviderBudgetRule(input);
    },
    async updateRule(id, data) {
      const updated = await prisma.budgetRule.update({
        where: { id },
        data,
      });
      return {
        id: updated.id,
        limitUsd: decimalToNumber(updated.limitUsd),
        escalationPercent: decimalToNumber(updated.escalationPercent),
        enabled: updated.enabled,
      };
    },
  };
}
