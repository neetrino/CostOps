import { slugifyName, slugWithSuffix } from '@/core/mapping/slugify';
import { addUtcDays, isSameUtcDay, toUtcDateOnly } from '@/shared/dates';
import { isIgnoredNeonProjectId } from '@/providers/neon/ignored-projects';
import { snapshotToRawTotals, type SnapshotMetrics } from '@/providers/neon/map-metrics';
import { NEON_METRIC_UNITS, NEON_USAGE_METRICS } from '@/providers/neon/metrics';
import {
  estimateProjectCost,
  normalizeTotals,
  periodHoursFromCalendarDays,
  type PricingRates,
} from '@/providers/neon/pricing';
import type { NormalizedCost, NormalizedMetric } from '@/providers/types';
import type { SyncRunStatus } from '@/generated/prisma/enums';
import type {
  BudgetDefaults,
  OldNeonProjectRow,
  OldSpendAlertRow,
  OldSyncRunRow,
  OldUsageSnapshotRow,
  PlannedAlertEvent,
  PlannedBudgetRule,
  PlannedProject,
  PlannedSyncRun,
  SkippedAlert,
} from '@/scripts/migrate-from-neon/types';

export function nextAvailableSlug(base: string, isTaken: (slug: string) => boolean): string {
  for (let attempt = 1; attempt < 50; attempt += 1) {
    const slug = slugWithSuffix(base, attempt);
    if (!isTaken(slug)) {
      return slug;
    }
  }
  return `${base}-50`;
}

/**
 * Allocates unique slugs. Remap table wins; identical names never merge.
 */
export function assignProjectSlugs(input: {
  projects: Array<{ neonProjectId: string; name: string }>;
  takenSlugs: Iterable<string>;
  remap: Readonly<Record<string, string>>;
}): Map<string, { slug: string; remapped: boolean }> {
  const taken = new Set(input.takenSlugs);
  for (const slug of Object.values(input.remap)) {
    taken.add(slug);
  }
  const assigned = new Map<string, { slug: string; remapped: boolean }>();
  const sorted = [...input.projects].sort((left, right) =>
    left.neonProjectId.localeCompare(right.neonProjectId),
  );
  for (const project of sorted) {
    const remapSlug = input.remap[project.neonProjectId];
    if (remapSlug) {
      assigned.set(project.neonProjectId, { slug: remapSlug, remapped: true });
      continue;
    }
    const base = slugifyName(project.name, project.neonProjectId);
    const slug = nextAvailableSlug(base, (candidate) => taken.has(candidate));
    taken.add(slug);
    assigned.set(project.neonProjectId, { slug, remapped: false });
  }
  return assigned;
}

/**
 * Explicit old threshold → persist and enable. Null (env default) → disabled.
 */
export function planBudgetRuleFromOld(
  project: Pick<
    OldNeonProjectRow,
    'spendAlertThresholdUsd' | 'spendAlertEscalationPercentOfThreshold'
  >,
  defaults: BudgetDefaults,
): PlannedBudgetRule {
  const explicit = project.spendAlertThresholdUsd;
  const escalation = project.spendAlertEscalationPercentOfThreshold;
  if (explicit === null) {
    return {
      limitUsd: defaults.limitUsd,
      escalationPercent: escalation ?? defaults.escalationPercent,
      enabled: false,
    };
  }
  return {
    limitUsd: explicit,
    escalationPercent: escalation ?? defaults.escalationPercent,
    enabled: true,
  };
}

export function planProjects(input: {
  projects: OldNeonProjectRow[];
  takenSlugs: Iterable<string>;
  remap: Readonly<Record<string, string>>;
  defaults: BudgetDefaults;
}): PlannedProject[] {
  const slugs = assignProjectSlugs({
    projects: input.projects,
    takenSlugs: input.takenSlugs,
    remap: input.remap,
  });
  return input.projects.map((project) => {
    const slugRow = slugs.get(project.neonProjectId);
    return {
      externalId: project.neonProjectId,
      displayName: project.name,
      regionId: project.regionId,
      ignored: isIgnoredNeonProjectId(project.neonProjectId),
      slug: slugRow?.slug ?? slugifyName(project.name, project.neonProjectId),
      remapSlug: slugRow?.remapped ? (slugRow.slug ?? null) : null,
      budget: planBudgetRuleFromOld(project, input.defaults),
    };
  });
}

function snapshotMetrics(snapshot: OldUsageSnapshotRow): SnapshotMetrics {
  return {
    computeUnitSeconds: snapshot.computeUnitSeconds,
    rootBranchBytesMonth: snapshot.rootBranchBytesMonth,
    childBranchBytesMonth: snapshot.childBranchBytesMonth,
    instantRestoreBytesMonth: snapshot.instantRestoreBytesMonth,
    publicNetworkTransferBytes: snapshot.publicNetworkTransferBytes,
    privateNetworkTransferBytes: snapshot.privateNetworkTransferBytes,
    extraBranchesMonth: snapshot.extraBranchesMonth,
  };
}

export function snapshotToMetrics(snapshot: OldUsageSnapshotRow): NormalizedMetric[] {
  const raw = snapshotToRawTotals(snapshotMetrics(snapshot));
  const bucketDate = toUtcDateOnly(snapshot.snapshotDate);
  return NEON_USAGE_METRICS.map((metricKey) => ({
    externalId: snapshot.neonProjectId,
    bucketDate,
    metricKey,
    valueBigint: raw[metricKey],
    unit: NEON_METRIC_UNITS[metricKey],
  }));
}

export function snapshotToCost(
  snapshot: OldUsageSnapshotRow,
  rates: PricingRates,
  today: Date,
): NormalizedCost {
  const raw = snapshotToRawTotals(snapshotMetrics(snapshot));
  const periodHours = periodHoursFromCalendarDays(1);
  const estimated = estimateProjectCost(raw, normalizeTotals(raw, periodHours), rates, periodHours);
  const bucketDate = toUtcDateOnly(snapshot.snapshotDate);
  const isToday = isSameUtcDay(bucketDate, today);
  return {
    externalId: snapshot.neonProjectId,
    bucketDate,
    costUsd: estimated.totalUsd,
    sourceType: 'ESTIMATED',
    sourceStatus: isToday ? 'partial' : 'final',
    isPartial: isToday,
    dimensionKey: '_',
    metadata: {
      computeUsd: estimated.computeUsd,
      storageUsd: estimated.storageUsd,
      historyUsd: estimated.historyUsd,
      privateTransferUsd: estimated.privateTransferUsd,
      branchesUsd: estimated.branchesUsd,
      publicTransferUsd: estimated.publicTransferUsd,
      publicTransferGb: estimated.publicTransferGb,
    },
  };
}

export function planSnapshots(input: {
  snapshots: OldUsageSnapshotRow[];
  rates: PricingRates;
  today: Date;
}): { metrics: NormalizedMetric[]; costs: NormalizedCost[] } {
  const metrics: NormalizedMetric[] = [];
  const costs: NormalizedCost[] = [];
  for (const snapshot of input.snapshots) {
    metrics.push(...snapshotToMetrics(snapshot));
    costs.push(snapshotToCost(snapshot, input.rates, input.today));
  }
  return { metrics, costs };
}

export function mapSpendAlertEvent(
  alert: OldSpendAlertRow,
  createMissingRule: boolean,
): PlannedAlertEvent {
  return {
    externalId: alert.neonProjectId,
    budgetDate: toUtcDateOnly(alert.snapshotDate),
    firstBreachCostUsd: alert.spendUsd,
    lastNotifiedCostUsd: alert.lastNotifiedSpendUsd ?? alert.spendUsd,
    lastNotifiedAt: alert.sentAt,
    createMissingRule,
    missingRuleLimitUsd: createMissingRule ? alert.thresholdUsd : null,
  };
}

/**
 * Maps SpendAlertSent after a BudgetRule is planned. Unknown projects skip
 * unless `--create-missing-rules`.
 */
export function planAlertEvents(input: {
  alerts: OldSpendAlertRow[];
  projectExternalIds: Iterable<string>;
  createMissingRules: boolean;
}): { alerts: PlannedAlertEvent[]; skipped: SkippedAlert[] } {
  const known = new Set(input.projectExternalIds);
  const alerts: PlannedAlertEvent[] = [];
  const skipped: SkippedAlert[] = [];
  for (const alert of input.alerts) {
    if (known.has(alert.neonProjectId)) {
      alerts.push(mapSpendAlertEvent(alert, false));
      continue;
    }
    if (input.createMissingRules) {
      alerts.push(mapSpendAlertEvent(alert, true));
      continue;
    }
    skipped.push({
      externalId: alert.neonProjectId,
      budgetDate: toUtcDateOnly(alert.snapshotDate),
      reason: 'no_rule',
    });
  }
  return { alerts, skipped };
}

export function mapOldSyncStatus(status: string): SyncRunStatus {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'running') {
    return 'RUNNING';
  }
  if (normalized === 'success') {
    return 'SUCCESS';
  }
  return 'ERROR';
}

export function mapOldSyncRun(row: OldSyncRunRow): PlannedSyncRun {
  const rangeFrom = toUtcDateOnly(row.targetDate);
  return {
    oldSyncRunId: row.id,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    status: mapOldSyncStatus(row.status),
    rangeFrom,
    rangeTo: addUtcDays(rangeFrom, 1),
    rowsWritten: row.rowsUpserted,
    errorMessage: row.errorMessage,
  };
}
