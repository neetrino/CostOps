import { upsertCostEntries } from '@/core/cost/upsert';
import { upsertMetricEntries } from '@/core/metrics/upsert';
import { budgetScopeKey } from '@/core/budgets/scope-key';
import type { ResourceLink } from '@/core/sync/upsert-resources';
import { DEFAULT_SPEND_ALERT_ESCALATION_PERCENT_OF_THRESHOLD } from '@/config/constants';
import { prisma } from '@/shared/db';
import { logger } from '@/shared/logger';
import { toFixedUsd } from '@/shared/money';
import type { Prisma } from '@/generated/prisma/client';
import { upsertBudgetRule } from '@/scripts/migrate-from-neon/apply-projects';
import type {
  PlannedAlertEvent,
  PlannedSyncRun,
  SkippedAlert,
} from '@/scripts/migrate-from-neon/types';
import type { NormalizedCost, NormalizedMetric } from '@/providers/types';

const HISTORY_SOURCE = 'migrate-from-neon';

export async function writeMetricAndCostHistory(input: {
  accountId: string;
  metrics: NormalizedMetric[];
  costs: NormalizedCost[];
  links: Map<string, ResourceLink>;
}): Promise<{ metrics: number; costs: number }> {
  const metrics = await upsertMetricEntries({
    providerKey: 'NEON',
    providerAccountId: input.accountId,
    metrics: input.metrics,
    resourcesByExternalId: input.links,
  });
  const past = input.costs.filter((cost) => !cost.isPartial);
  const today = input.costs.filter((cost) => cost.isPartial);
  let costs = 0;
  if (past.length > 0) {
    costs += await upsertCostEntries({
      providerKey: 'NEON',
      providerAccountId: input.accountId,
      costs: past,
      resourcesByExternalId: input.links,
      finalize: true,
    });
  }
  if (today.length > 0) {
    costs += await upsertCostEntries({
      providerKey: 'NEON',
      providerAccountId: input.accountId,
      costs: today,
      resourcesByExternalId: input.links,
      finalize: false,
    });
  }
  return { metrics, costs };
}

async function resolveAlertRuleId(
  alert: PlannedAlertEvent,
  links: Map<string, ResourceLink>,
  createMissingRules: boolean,
): Promise<string | null> {
  const link = links.get(alert.externalId);
  if (!link?.projectId || !link.projectProviderId) {
    return null;
  }
  const existing = await prisma.budgetRule.findUnique({
    where: {
      scopeKey: budgetScopeKey({
        scope: 'PROJECT_PROVIDER',
        projectProviderId: link.projectProviderId,
      }),
    },
  });
  if (existing) {
    return existing.id;
  }
  if (!alert.createMissingRule && !createMissingRules) {
    return null;
  }
  const limitUsd = alert.missingRuleLimitUsd;
  if (limitUsd === null) {
    return null;
  }
  return upsertBudgetRule(
    { projectId: link.projectId, projectProviderId: link.projectProviderId },
    {
      limitUsd,
      escalationPercent: DEFAULT_SPEND_ALERT_ESCALATION_PERCENT_OF_THRESHOLD,
      enabled: true,
    },
  );
}

export async function writeAlertEvents(input: {
  alerts: PlannedAlertEvent[];
  skipped: SkippedAlert[];
  links: Map<string, ResourceLink>;
  createMissingRules: boolean;
}): Promise<{ written: number; skipped: number }> {
  let written = 0;
  let skipped = input.skipped.length;
  for (const row of input.skipped) {
    logger.warn(
      { neonProjectId: row.externalId, budgetDate: row.budgetDate.toISOString() },
      'Skipping SpendAlertSent: no BudgetRule (pass --create-missing-rules to invent one)',
    );
  }
  for (const alert of input.alerts) {
    const budgetRuleId = await resolveAlertRuleId(alert, input.links, input.createMissingRules);
    if (!budgetRuleId) {
      skipped += 1;
      logger.warn(
        { neonProjectId: alert.externalId, budgetDate: alert.budgetDate.toISOString() },
        'Skipping SpendAlertSent: no resolvable BudgetRule',
      );
      continue;
    }
    await prisma.alertEvent.upsert({
      where: {
        budgetRuleId_budgetDate: { budgetRuleId, budgetDate: alert.budgetDate },
      },
      create: {
        budgetRuleId,
        budgetDate: alert.budgetDate,
        firstBreachCostUsd: toFixedUsd(alert.firstBreachCostUsd, 6),
        lastNotifiedCostUsd: toFixedUsd(alert.lastNotifiedCostUsd, 6),
        lastNotifiedAt: alert.lastNotifiedAt,
        notificationChannel: 'TELEGRAM',
        status: 'OPEN',
        createdAt: alert.lastNotifiedAt,
      },
      update: {
        lastNotifiedCostUsd: toFixedUsd(alert.lastNotifiedCostUsd, 6),
        lastNotifiedAt: alert.lastNotifiedAt,
      },
    });
    written += 1;
  }
  return { written, skipped };
}

function oldSyncRunIdFromMetadata(metadata: Prisma.JsonValue): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }
  const value = metadata.oldSyncRunId;
  return typeof value === 'string' ? value : null;
}

export async function writeSyncRuns(
  accountId: string,
  runs: PlannedSyncRun[],
): Promise<number> {
  const existing = await prisma.syncRun.findMany({
    where: { providerAccountId: accountId, providerKey: 'NEON' },
    select: { metadata: true },
  });
  const imported = new Set(
    existing
      .map((row) => oldSyncRunIdFromMetadata(row.metadata))
      .filter((id): id is string => id !== null),
  );
  let written = 0;
  for (const run of runs) {
    if (imported.has(run.oldSyncRunId)) {
      continue;
    }
    await prisma.syncRun.create({
      data: {
        providerAccountId: accountId,
        providerKey: 'NEON',
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
        status: run.status,
        rangeFrom: run.rangeFrom,
        rangeTo: run.rangeTo,
        granularity: 'daily',
        rowsWritten: run.rowsWritten,
        errorMessage: run.errorMessage,
        metadata: { source: HISTORY_SOURCE, oldSyncRunId: run.oldSyncRunId },
      },
    });
    imported.add(run.oldSyncRunId);
    written += 1;
  }
  return written;
}
