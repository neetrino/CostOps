import {
  accountSyncMap,
  loadAccountSyncRows,
  loadRangeCostRows,
  type AccountSyncRow,
} from '@/core/cost/load-range-rows';
import type { CostEntryRow } from '@/core/cost/types';
import { getStartOfTodayUtc } from '@/shared/dates';
import type { ProviderKey } from '@/generated/prisma/enums';

export type DashboardCostContext = {
  today: Date;
  entries: CostEntryRow[];
  accounts: AccountSyncRow[];
  syncAtByAccountId: Map<string, Date | null>;
};

/**
 * Loads CostEntry rows covering today and the selected range (union).
 */
export async function loadDashboardCostContext(input: {
  from: Date;
  to: Date;
  projectId?: string;
  providerKey?: ProviderKey;
  now?: Date;
}): Promise<DashboardCostContext> {
  const today = getStartOfTodayUtc(input.now);
  const from = input.from < today ? input.from : today;
  const to = input.to > today ? input.to : today;
  const [entries, accounts] = await Promise.all([
    loadRangeCostRows({
      from,
      to,
      projectId: input.projectId,
      providerKey: input.providerKey,
    }),
    loadAccountSyncRows(),
  ]);
  return {
    today,
    entries,
    accounts,
    syncAtByAccountId: accountSyncMap(accounts),
  };
}
