import { describe, expect, it } from 'vitest';
import { planBudgetPatch } from '@/core/budgets/patch-project-provider-budget';
import {
  patchProjectTotalBudget,
  type ProjectTotalBudgetStore,
} from '@/core/budgets/patch-project-total-budget';

function memoryStore(seed?: { slug: string; id: string }): ProjectTotalBudgetStore & {
  updates: Array<{ id: string; enabled?: true; limitUsd?: string }>;
  ensured: boolean;
} {
  const updates: Array<{ id: string; enabled?: true; limitUsd?: string }> = [];
  return {
    updates,
    ensured: false,
    async findProject(slug) {
      if (!seed || seed.slug !== slug) {
        return null;
      }
      return { id: seed.id };
    },
    async ensureRule() {
      this.ensured = true;
      return { id: 'rule-total-1' };
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

describe('PROJECT_TOTAL budget PATCH', () => {
  it('enables the rule when the operator sets a limit', () => {
    expect(planBudgetPatch({ limitUsd: 5.82 })).toEqual({
      limitUsd: '5.8200',
      enabled: true,
    });
  });

  it('does not enable on escalation-only updates', () => {
    expect(planBudgetPatch({ escalationPercent: 25 })).toEqual({
      escalationPercent: '25.00',
    });
  });

  it('returns NOT_FOUND when the project is missing', async () => {
    const result = await patchProjectTotalBudget(memoryStore(), 'missing', { limitUsd: 5 });
    expect(result).toEqual({ ok: false, code: 'NOT_FOUND' });
  });

  it('ensures a PROJECT_TOTAL rule, writes the limit, and enables it', async () => {
    const store = memoryStore({ slug: 'degusto', id: 'proj-1' });
    const result = await patchProjectTotalBudget(store, 'degusto', {
      limitUsd: 5.82,
      escalationPercent: 30,
    });
    expect(store.ensured).toBe(true);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.scope).toBe('PROJECT_TOTAL');
      expect(result.data.enabled).toBe(true);
      expect(result.data.limitUsd).toBe(5.82);
      expect(result.data.escalationPercent).toBe(30);
      expect(result.data.projectId).toBe('proj-1');
    }
  });

  it('creates via ensure even when no rule existed yet', async () => {
    const store = memoryStore({ slug: 'degusto', id: 'proj-1' });
    const result = await patchProjectTotalBudget(store, 'degusto', { limitUsd: 4 });
    expect(store.ensured).toBe(true);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.budgetRuleId).toBe('rule-total-1');
      expect(result.data.enabled).toBe(true);
    }
  });
});
