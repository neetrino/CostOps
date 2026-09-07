import type { BudgetScope } from '@/generated/prisma/enums';

export function budgetScopeKey(input: {
  scope: BudgetScope;
  projectProviderId?: string | null;
  projectId?: string | null;
  providerKey?: string | null;
}): string {
  switch (input.scope) {
    case 'PROJECT_PROVIDER':
      if (!input.projectProviderId) {
        throw new Error('PROJECT_PROVIDER scopeKey requires projectProviderId');
      }
      return `PROJECT_PROVIDER:${input.projectProviderId}`;
    case 'PROJECT_TOTAL':
      if (!input.projectId) {
        throw new Error('PROJECT_TOTAL scopeKey requires projectId');
      }
      return `PROJECT_TOTAL:${input.projectId}`;
    case 'PROVIDER_TOTAL':
      if (!input.providerKey) {
        throw new Error('PROVIDER_TOTAL scopeKey requires providerKey');
      }
      return `PROVIDER_TOTAL:${input.providerKey}`;
    case 'GLOBAL_TOTAL':
      return 'GLOBAL_TOTAL';
  }
}
