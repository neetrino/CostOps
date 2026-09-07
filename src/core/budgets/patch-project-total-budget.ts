import {
  planBudgetPatch,
  type BudgetPatchBody,
  type BudgetPatchUpdate,
} from '@/core/budgets/patch-project-provider-budget';

export type ProjectTotalBudgetView = {
  projectId: string;
  budgetRuleId: string;
  scope: 'PROJECT_TOTAL';
  limitUsd: number;
  escalationPercent: number;
  enabled: boolean;
};

export type ProjectTotalBudgetStore = {
  findProject(slug: string): Promise<{ id: string } | null>;
  ensureRule(input: { projectId: string }): Promise<{ id: string }>;
  updateRule(
    id: string,
    data: BudgetPatchUpdate,
  ): Promise<{
    id: string;
    limitUsd: number;
    escalationPercent: number;
    enabled: boolean;
  }>;
};

/**
 * Setting a daily limit enables the PROJECT_TOTAL rule (same as Project × Provider).
 */
export async function patchProjectTotalBudget(
  store: ProjectTotalBudgetStore,
  slug: string,
  input: BudgetPatchBody,
): Promise<{ ok: true; data: ProjectTotalBudgetView } | { ok: false; code: 'NOT_FOUND' }> {
  const project = await store.findProject(slug);
  if (!project) {
    return { ok: false, code: 'NOT_FOUND' };
  }
  const rule = await store.ensureRule({ projectId: project.id });
  const updated = await store.updateRule(rule.id, planBudgetPatch(input));
  return {
    ok: true,
    data: {
      projectId: project.id,
      budgetRuleId: updated.id,
      scope: 'PROJECT_TOTAL',
      limitUsd: updated.limitUsd,
      escalationPercent: updated.escalationPercent,
      enabled: updated.enabled,
    },
  };
}
