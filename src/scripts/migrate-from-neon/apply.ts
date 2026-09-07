import { ensureNeonAccountFromEnv } from '@/core/sync/ensure-neon-account';
import { prisma } from '@/shared/db';
import {
  requireNeonAccountId,
  upsertPlannedProjects,
} from '@/scripts/migrate-from-neon/apply-projects';
import {
  writeAlertEvents,
  writeMetricAndCostHistory,
  writeSyncRuns,
} from '@/scripts/migrate-from-neon/apply-history';
import type { ApplyNeonHistoryResult, NeonHistoryPlan } from '@/scripts/migrate-from-neon/types';

/** Writes the plan through existing CostOps upsert keys. Not used by dry-run. */
export async function applyNeonHistoryPlan(input: {
  plan: NeonHistoryPlan;
  createMissingRules: boolean;
  now?: Date;
}): Promise<ApplyNeonHistoryResult> {
  const now = input.now ?? new Date();
  await ensureNeonAccountFromEnv();
  const accountId = await requireNeonAccountId();
  const links = await upsertPlannedProjects(accountId, input.plan.projects, now);
  const history = await writeMetricAndCostHistory({
    accountId,
    metrics: input.plan.metrics,
    costs: input.plan.costs,
    links,
  });
  const alerts = await writeAlertEvents({
    alerts: input.plan.alerts,
    skipped: input.plan.alertsSkipped,
    links,
    createMissingRules: input.createMissingRules,
  });
  const syncRuns = await writeSyncRuns(accountId, input.plan.syncRuns);
  return {
    resources: links.size,
    budgetRules: input.plan.projects.length,
    metrics: history.metrics,
    costs: history.costs,
    alerts: alerts.written,
    alertsSkipped: alerts.skipped,
    syncRuns,
  };
}

export async function disconnectCostOps(): Promise<void> {
  await prisma.$disconnect();
}
