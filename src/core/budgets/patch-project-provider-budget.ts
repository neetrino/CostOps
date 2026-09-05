import { z } from 'zod';
import type { ProviderKey } from '@/generated/prisma/enums';

export const budgetPatchBodySchema = z
  .object({
    limitUsd: z.number().positive().optional(),
    escalationPercent: z.number().min(0.1).max(100).optional(),
  })
  .refine((data) => data.limitUsd !== undefined || data.escalationPercent !== undefined, {
    message: 'Provide limitUsd and/or escalationPercent',
  });

export type BudgetPatchBody = z.infer<typeof budgetPatchBodySchema>;

export type BudgetPatchUpdate = {
  limitUsd?: string;
  escalationPercent?: string;
  enabled?: true;
};

export type BudgetPatchView = {
  projectProviderId: string;
  budgetRuleId: string;
  limitUsd: number;
  escalationPercent: number;
  enabled: boolean;
};

export type ProjectProviderBudgetStore = {
  findProjectProvider(id: string): Promise<{
    id: string;
    projectId: string;
    providerKey: ProviderKey;
  } | null>;
  ensureRule(input: {
    projectId: string;
    projectProviderId: string;
    providerKey: ProviderKey;
  }): Promise<{ id: string }>;
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
 * Setting a daily limit enables the rule (inline Neon spend-alert parity).
 */
export function planBudgetPatch(input: BudgetPatchBody): BudgetPatchUpdate {
  const update: BudgetPatchUpdate = {};
  if (input.limitUsd !== undefined) {
    update.limitUsd = input.limitUsd.toFixed(4);
    update.enabled = true;
  }
  if (input.escalationPercent !== undefined) {
    update.escalationPercent = input.escalationPercent.toFixed(2);
  }
  return update;
}

export async function patchProjectProviderBudget(
  store: ProjectProviderBudgetStore,
  projectProviderId: string,
  input: BudgetPatchBody,
): Promise<{ ok: true; data: BudgetPatchView } | { ok: false; code: 'NOT_FOUND' }> {
  const link = await store.findProjectProvider(projectProviderId);
  if (!link) {
    return { ok: false, code: 'NOT_FOUND' };
  }
  const rule = await store.ensureRule({
    projectId: link.projectId,
    projectProviderId: link.id,
    providerKey: link.providerKey,
  });
  const updated = await store.updateRule(rule.id, planBudgetPatch(input));
  return {
    ok: true,
    data: {
      projectProviderId: link.id,
      budgetRuleId: updated.id,
      limitUsd: updated.limitUsd,
      escalationPercent: updated.escalationPercent,
      enabled: updated.enabled,
    },
  };
}
