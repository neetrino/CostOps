import type { PricingRates } from '@/providers/neon/pricing';
import {
  planAlertEvents,
  planProjects,
  planSnapshots,
  mapOldSyncRun,
} from '@/scripts/migrate-from-neon/mapping';
import type {
  BudgetDefaults,
  MigrationPlanCounts,
  NeonHistoryPlan,
  OldNeonProjectRow,
  OldSpendAlertRow,
  OldSyncRunRow,
  OldUsageSnapshotRow,
} from '@/scripts/migrate-from-neon/types';

export type BuildNeonHistoryPlanInput = {
  projects: OldNeonProjectRow[];
  snapshots: OldUsageSnapshotRow[];
  alerts: OldSpendAlertRow[];
  syncRuns: OldSyncRunRow[];
  takenSlugs: Iterable<string>;
  remap: Readonly<Record<string, string>>;
  createMissingRules: boolean;
  defaults: BudgetDefaults;
  rates: PricingRates;
  today: Date;
};

function countPlan(plan: Omit<NeonHistoryPlan, 'counts'>): MigrationPlanCounts {
  return {
    projects: plan.projects.length,
    ignoredProjects: plan.projects.filter((project) => project.ignored).length,
    remappedProjects: plan.projects.filter((project) => project.remapSlug).length,
    budgetRulesEnabled: plan.projects.filter((project) => project.budget.enabled).length,
    budgetRulesDisabled: plan.projects.filter((project) => !project.budget.enabled).length,
    metricEntries: plan.metrics.length,
    costEntries: plan.costs.length,
    alertEvents: plan.alerts.length,
    alertEventsSkippedNoRule: plan.alertsSkipped.length,
    missingRulesToCreate: plan.alerts.filter((alert) => alert.createMissingRule).length,
    syncRuns: plan.syncRuns.length,
  };
}

/** Builds an in-memory migration plan. No database writes. */
export function buildNeonHistoryPlan(input: BuildNeonHistoryPlanInput): NeonHistoryPlan {
  const projects = planProjects({
    projects: input.projects,
    takenSlugs: input.takenSlugs,
    remap: input.remap,
    defaults: input.defaults,
  });
  const { metrics, costs } = planSnapshots({
    snapshots: input.snapshots,
    rates: input.rates,
    today: input.today,
  });
  const { alerts, skipped } = planAlertEvents({
    alerts: input.alerts,
    projectExternalIds: projects.map((project) => project.externalId),
    createMissingRules: input.createMissingRules,
  });
  const draft = {
    projects,
    metrics,
    costs,
    alerts,
    alertsSkipped: skipped,
    syncRuns: input.syncRuns.map(mapOldSyncRun),
  };
  return { ...draft, counts: countPlan(draft) };
}
