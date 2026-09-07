import { NEAR_LIMIT_MAX_ROWS, NEAR_LIMIT_USAGE_PERCENT } from '@/config/constants';
import { costViewForRows, latestSyncForAccounts } from '@/core/cost/cost-view';
import { filterRowsForScope } from '@/core/cost/aggregate';
import { scopeFilterFromRule } from '@/core/cost/scope-from-rule';
import type { AccountSyncRow } from '@/core/cost/load-range-rows';
import type { CostEntryRow } from '@/core/cost/types';
import type { NearLimitRow } from '@/features/overview/types';
import { decimalToNumber, usagePercent } from '@/shared/money';
import type { BudgetScope, ProviderKey } from '@/generated/prisma/enums';

type RuleRow = {
  id: string;
  scope: BudgetScope;
  projectId: string | null;
  projectProviderId: string | null;
  providerKey: ProviderKey | null;
  limitUsd: { toString(): string };
  escalationPercent: { toString(): string };
  project: { id: string; slug: string; name: string; archived: boolean } | null;
};

export function buildNearLimitRows(input: {
  rules: RuleRow[];
  todayRows: CostEntryRow[];
  accounts: AccountSyncRow[];
  syncAtByAccountId: ReadonlyMap<string, Date | null>;
}): NearLimitRow[] {
  const rows: NearLimitRow[] = [];
  for (const rule of input.rules) {
    if (rule.project?.archived) {
      continue;
    }
    const filter = scopeFilterFromRule(rule);
    if (!filter) {
      continue;
    }
    const scoped = filterRowsForScope(input.todayRows, filter);
    const fallback = latestSyncForAccounts(input.accounts, rule.providerKey ?? undefined);
    const spend = costViewForRows(scoped, input.syncAtByAccountId, fallback);
    if (spend.costUsd === null) {
      continue;
    }
    const limitUsd = decimalToNumber(rule.limitUsd);
    const percent = usagePercent(spend.costUsd, limitUsd);
    if (percent < NEAR_LIMIT_USAGE_PERCENT) {
      continue;
    }
    rows.push({
      budgetRuleId: rule.id,
      scope: rule.scope,
      projectId: rule.project?.id ?? rule.projectId,
      projectSlug: rule.project?.slug ?? null,
      projectName: rule.project?.name ?? null,
      providerKey: rule.providerKey,
      limitUsd,
      escalationPercent: decimalToNumber(rule.escalationPercent),
      spend,
      usagePercent: percent,
    });
  }
  return rows
    .sort((left, right) => right.usagePercent - left.usagePercent)
    .slice(0, NEAR_LIMIT_MAX_ROWS);
}
