import { NEAR_LIMIT_MAX_ROWS, NEAR_LIMIT_USAGE_PERCENT } from '@/config/constants';
import type { CostView } from '@/core/cost/types';
import type { ProjectListRow } from '@/features/projects/types';
import { isFixedVpsProvider } from '@/shared/provider-label';
import { usagePercent } from '@/shared/money';

export type BoardNearLimitItem = {
  key: string;
  projectSlug: string;
  projectName: string;
  providerKey: string;
  limitUsd: number;
  usagePercent: number;
  spend: CostView;
};

export function buildBoardNearLimitItems(projects: ProjectListRow[]): BoardNearLimitItem[] {
  const rows: BoardNearLimitItem[] = [];
  for (const project of projects) {
    for (const provider of project.providers) {
      if (
        isFixedVpsProvider(provider.providerKey) ||
        !provider.budget?.enabled ||
        provider.today.costUsd === null
      ) {
        continue;
      }
      const percent = usagePercent(provider.today.costUsd, provider.budget.limitUsd);
      if (percent < NEAR_LIMIT_USAGE_PERCENT) {
        continue;
      }
      rows.push({
        key: provider.projectProviderId,
        projectSlug: project.slug,
        projectName: project.name,
        providerKey: provider.providerKey,
        limitUsd: provider.budget.limitUsd,
        usagePercent: percent,
        spend: provider.today,
      });
    }
  }
  return rows
    .sort((left, right) => right.usagePercent - left.usagePercent)
    .slice(0, NEAR_LIMIT_MAX_ROWS);
}
