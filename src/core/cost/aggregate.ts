import type { BudgetScopeFilter, CostRow } from '@/core/cost/types';
import { aggregateCostRows } from '@/core/cost/freshness';

export function filterRowsForScope<T extends CostRow>(rows: T[], filter: BudgetScopeFilter): T[] {
  switch (filter.scope) {
    case 'PROJECT_PROVIDER':
      return rows.filter((row) => row.projectProviderId === filter.projectProviderId);
    case 'PROJECT_TOTAL':
      return rows.filter((row) => row.projectId === filter.projectId);
    case 'PROVIDER_TOTAL':
      return rows.filter((row) => row.providerKey === filter.providerKey);
    case 'GLOBAL_TOTAL':
      return rows;
  }
}

export function aggregateForScope(rows: CostRow[], filter: BudgetScopeFilter) {
  return aggregateCostRows(filterRowsForScope(rows, filter));
}
