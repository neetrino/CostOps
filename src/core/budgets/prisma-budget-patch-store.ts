import { ensureProjectProviderBudgetRule } from '@/core/budgets/ensure-project-provider-rule';
import { ensureProjectTotalBudgetRule } from '@/core/budgets/ensure-project-total-rule';
import type { ProjectProviderBudgetStore } from '@/core/budgets/patch-project-provider-budget';
import type { ProjectTotalBudgetStore } from '@/core/budgets/patch-project-total-budget';
import { prisma } from '@/shared/db';
import { decimalToNumber } from '@/shared/money';

async function updateBudgetRule(
  id: string,
  data: Parameters<ProjectProviderBudgetStore['updateRule']>[1],
) {
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
}

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
    updateRule: updateBudgetRule,
  };
}

export function createPrismaProjectTotalBudgetStore(): ProjectTotalBudgetStore {
  return {
    async findProject(slug) {
      return prisma.project.findUnique({
        where: { slug },
        select: { id: true },
      });
    },
    async ensureRule(input) {
      return ensureProjectTotalBudgetRule(input);
    },
    updateRule: updateBudgetRule,
  };
}
