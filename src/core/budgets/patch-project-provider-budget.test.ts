import { describe, expect, it } from 'vitest';
import {
  budgetPatchBodySchema,
  patchProjectProviderBudget,
  planBudgetPatch,
  type ProjectProviderBudgetStore,
} from '@/core/budgets/patch-project-provider-budget';
import type { ProviderKey } from '@/generated/prisma/enums';

function memoryStore(seed?: {
  id: string;
  projectId: string;
  providerKey: ProviderKey;
}): ProjectProviderBudgetStore & {
  updates: Array<{ id: string; enabled?: true; limitUsd?: string }>;
  ensured: boolean;
} {
  const updates: Array<{ id: string; enabled?: true; limitUsd?: string }> = [];
  return {
    updates,
    ensured: false,
    async findProjectProvider(id) {
      if (!seed || seed.id !== id) {
        return null;
      }
      return seed;
    },
    async ensureRule() {
      this.ensured = true;
      return { id: 'rule-1' };
    },
    async updateRule(id, data) {
      updates.push({ id, enabled: data.enabled, limitUsd: data.limitUsd });
      return {
        id,
        limitUsd: data.limitUsd ? Number(data.limitUsd) : 1,
        escalationPercent: data.escalationPercent ? Number(data.escalationPercent) : 30,
        enabled: data.enabled ?? false,
      };
    },
  };
}

describe('budget PATCH', () => {
  it('rejects an empty body', () => {
    const parsed = budgetPatchBodySchema.safeParse({});
    expect(parsed.success).toBe(false);
  });

  it('rejects a non-positive limit', () => {
    expect(budgetPatchBodySchema.safeParse({ limitUsd: 0 }).success).toBe(false);
    expect(budgetPatchBodySchema.safeParse({ limitUsd: -1 }).success).toBe(false);
  });

  it('enables the rule when the operator sets a limit', () => {
    expect(planBudgetPatch({ limitUsd: 2.5 })).toEqual({
      limitUsd: '2.5000',
      enabled: true,
    });
  });

  it('does not enable on escalation-only updates', () => {
    expect(planBudgetPatch({ escalationPercent: 40 })).toEqual({
      escalationPercent: '40.00',
    });
  });

  it('returns NOT_FOUND when the project provider is missing', async () => {
    const result = await patchProjectProviderBudget(memoryStore(), 'missing', { limitUsd: 2 });
    expect(result).toEqual({ ok: false, code: 'NOT_FOUND' });
  });

  it('ensures a rule, writes the limit, and enables it', async () => {
    const store = memoryStore({
      id: 'pp-1',
      projectId: 'proj-1',
      providerKey: 'NEON',
    });
    const result = await patchProjectProviderBudget(store, 'pp-1', {
      limitUsd: 5,
      escalationPercent: 25,
    });
    expect(store.ensured).toBe(true);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.enabled).toBe(true);
      expect(result.data.limitUsd).toBe(5);
      expect(result.data.escalationPercent).toBe(25);
      expect(result.data.projectProviderId).toBe('pp-1');
    }
  });
});
