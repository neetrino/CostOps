import { getEnv } from '@/shared/env';
import { PRICING_RATES } from '@/providers/neon/pricing';
import { MIGRATE_FROM_NEON_HELP, parseMigrateCliArgs } from '@/scripts/migrate-from-neon/cli-args';
import { assertMigrationEnv } from '@/scripts/migrate-from-neon/env-guard';
import { buildNeonHistoryPlan } from '@/scripts/migrate-from-neon/plan';
import { readOldNeonHistory } from '@/scripts/migrate-from-neon/read-old-neon';
import { MANUAL_NEON_PROJECT_REMAP } from '@/scripts/migrate-from-neon/remap-table';
import type { ApplyNeonHistoryResult, NeonHistoryPlan } from '@/scripts/migrate-from-neon/types';

function formatPlanSummary(plan: NeonHistoryPlan, mode: 'dry-run' | 'apply'): string {
  const { counts } = plan;
  return [
    `CostOps Neon history migration (${mode})`,
    `Projects: ${counts.projects} (ignored: ${counts.ignoredProjects}, remapped: ${counts.remappedProjects})`,
    `Budget rules: ${counts.budgetRulesEnabled} enabled (explicit threshold), ${counts.budgetRulesDisabled} disabled (env default)`,
    `Usage: ${counts.metricEntries} MetricEntry + ${counts.costEntries} CostEntry`,
    `Alerts: ${counts.alertEvents} AlertEvent, ${counts.alertEventsSkippedNoRule} skipped (no rule), ${counts.missingRulesToCreate} missing rules to create`,
    `Sync runs: ${counts.syncRuns}`,
    '',
  ].join('\n');
}

function formatApplyResult(result: ApplyNeonHistoryResult): string {
  return [
    'Apply complete (idempotent upserts).',
    `Resources: ${result.resources}`,
    `Budget rules touched: ${result.budgetRules}`,
    `MetricEntry upserts: ${result.metrics}`,
    `CostEntry upserts: ${result.costs}`,
    `AlertEvent upserts: ${result.alerts} (skipped: ${result.alertsSkipped})`,
    `SyncRun created: ${result.syncRuns}`,
    '',
  ].join('\n');
}

export async function runMigrateFromNeon(argv: string[]): Promise<void> {
  const options = parseMigrateCliArgs(argv);
  if (options.help) {
    process.stdout.write(MIGRATE_FROM_NEON_HELP);
    return;
  }

  const targets = assertMigrationEnv(process.env);
  const env = getEnv();
  const history = await readOldNeonHistory(targets.oldUrl);
  const plan = buildNeonHistoryPlan({
    ...history,
    takenSlugs: [],
    remap: MANUAL_NEON_PROJECT_REMAP,
    createMissingRules: options.createMissingRules,
    defaults: {
      limitUsd: env.TELEGRAM_SPEND_ALERT_DEFAULT_USD,
      escalationPercent: env.SPEND_ALERT_ESCALATION_PERCENT_OF_THRESHOLD,
    },
    rates: PRICING_RATES[env.NEON_PRICING_PLAN],
    today: new Date(),
  });
  process.stdout.write(formatPlanSummary(plan, options.apply ? 'apply' : 'dry-run'));

  if (!options.apply) {
    process.stdout.write(
      'No writes (dry-run). Pass --apply to persist into CostOps DATABASE_URL.\n',
    );
    return;
  }

  const { applyNeonHistoryPlan, disconnectCostOps } = await import(
    '@/scripts/migrate-from-neon/apply'
  );
  try {
    const result = await applyNeonHistoryPlan({
      plan,
      createMissingRules: options.createMissingRules,
    });
    process.stdout.write(formatApplyResult(result));
  } finally {
    await disconnectCostOps();
  }
}
