import type { SnapshotMetrics } from '@/providers/neon/map-metrics';
import type { NormalizedCost, NormalizedMetric } from '@/providers/types';
import type { SyncRunStatus } from '@/generated/prisma/enums';

export type OldNeonProjectRow = {
  neonProjectId: string;
  name: string;
  regionId: string | null;
  spendAlertThresholdUsd: number | null;
  spendAlertEscalationPercentOfThreshold: number | null;
};

export type OldUsageSnapshotRow = SnapshotMetrics & {
  neonProjectId: string;
  snapshotDate: Date;
};

export type OldSpendAlertRow = {
  neonProjectId: string;
  snapshotDate: Date;
  sentAt: Date;
  spendUsd: number;
  thresholdUsd: number;
  lastNotifiedSpendUsd: number | null;
};

export type OldSyncRunRow = {
  id: string;
  startedAt: Date;
  finishedAt: Date | null;
  status: string;
  errorMessage: string | null;
  rowsUpserted: number | null;
  targetDate: Date;
};

export type BudgetDefaults = {
  limitUsd: number;
  escalationPercent: number;
};

export type PlannedBudgetRule = {
  limitUsd: number;
  escalationPercent: number;
  enabled: boolean;
};

export type PlannedProject = {
  externalId: string;
  displayName: string;
  regionId: string | null;
  ignored: boolean;
  slug: string;
  remapSlug: string | null;
  budget: PlannedBudgetRule;
};

export type PlannedAlertEvent = {
  externalId: string;
  budgetDate: Date;
  firstBreachCostUsd: number;
  lastNotifiedCostUsd: number;
  lastNotifiedAt: Date;
  createMissingRule: boolean;
  missingRuleLimitUsd: number | null;
};

export type SkippedAlert = {
  externalId: string;
  budgetDate: Date;
  reason: 'no_rule';
};

export type PlannedSyncRun = {
  oldSyncRunId: string;
  startedAt: Date;
  finishedAt: Date | null;
  status: SyncRunStatus;
  rangeFrom: Date;
  rangeTo: Date;
  rowsWritten: number | null;
  errorMessage: string | null;
};

export type MigrationPlanCounts = {
  projects: number;
  ignoredProjects: number;
  remappedProjects: number;
  budgetRulesEnabled: number;
  budgetRulesDisabled: number;
  metricEntries: number;
  costEntries: number;
  alertEvents: number;
  alertEventsSkippedNoRule: number;
  missingRulesToCreate: number;
  syncRuns: number;
};

export type NeonHistoryPlan = {
  projects: PlannedProject[];
  metrics: NormalizedMetric[];
  costs: NormalizedCost[];
  alerts: PlannedAlertEvent[];
  alertsSkipped: SkippedAlert[];
  syncRuns: PlannedSyncRun[];
  counts: MigrationPlanCounts;
};

export type ApplyNeonHistoryResult = {
  resources: number;
  budgetRules: number;
  metrics: number;
  costs: number;
  alerts: number;
  alertsSkipped: number;
  syncRuns: number;
};
