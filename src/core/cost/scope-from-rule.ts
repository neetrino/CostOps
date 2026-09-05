import type { BudgetScopeFilter } from '@/core/cost/types';
import type { BudgetScope, ProviderKey } from '@/generated/prisma/enums';

export function scopeFilterFromRule(rule: {
  scope: BudgetScope;
  projectId: string | null;
  projectProviderId: string | null;
  providerKey: ProviderKey | null;
}): BudgetScopeFilter | null {
  switch (rule.scope) {
    case 'PROJECT_PROVIDER':
      return rule.projectProviderId
        ? { scope: 'PROJECT_PROVIDER', projectProviderId: rule.projectProviderId }
        : null;
    case 'PROJECT_TOTAL':
      return rule.projectId ? { scope: 'PROJECT_TOTAL', projectId: rule.projectId } : null;
    case 'PROVIDER_TOTAL':
      return rule.providerKey ? { scope: 'PROVIDER_TOTAL', providerKey: rule.providerKey } : null;
    case 'GLOBAL_TOTAL':
      return { scope: 'GLOBAL_TOTAL' };
  }
}
