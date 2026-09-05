import { describe, expect, it } from 'vitest';
import { costIdempotencyKey } from '@/core/cost/idempotency';
import { metricIdempotencyKey } from '@/core/metrics/idempotency';
import { NEON_USAGE_METRICS } from '@/providers/neon/metrics';
import { PRICING_RATES } from '@/providers/neon/pricing';
import {
  assertMigrationEnv,
  readOldNeonDatabaseUrl,
  urlsPointAtSameDatabase,
} from '@/scripts/migrate-from-neon/env-guard';
import { assignProjectSlugs, planBudgetRuleFromOld } from '@/scripts/migrate-from-neon/mapping';
import { buildNeonHistoryPlan } from '@/scripts/migrate-from-neon/plan';
import type {
  OldNeonProjectRow,
  OldSpendAlertRow,
  OldUsageSnapshotRow,
} from '@/scripts/migrate-from-neon/types';

const DEFAULTS = { limitUsd: 1, escalationPercent: 30 };
const TODAY = new Date('2026-09-05T12:00:00.000Z');
const COSTOPS_URL = 'postgresql://app:secret@costops.example/costops';
const OLD_URL = 'postgresql://ro:secret@old-neon.example/neon_app';

function project(overrides: Partial<OldNeonProjectRow> & Pick<OldNeonProjectRow, 'neonProjectId'>): OldNeonProjectRow {
  return {
    name: 'Sample',
    regionId: 'aws-us-east-1',
    spendAlertThresholdUsd: null,
    spendAlertEscalationPercentOfThreshold: null,
    ...overrides,
  };
}

function snapshot(
  overrides: Partial<OldUsageSnapshotRow> & Pick<OldUsageSnapshotRow, 'neonProjectId'>,
): OldUsageSnapshotRow {
  return {
    snapshotDate: new Date('2026-09-01T00:00:00.000Z'),
    computeUnitSeconds: 3600n,
    rootBranchBytesMonth: null,
    childBranchBytesMonth: null,
    instantRestoreBytesMonth: null,
    publicNetworkTransferBytes: null,
    privateNetworkTransferBytes: null,
    extraBranchesMonth: null,
    ...overrides,
  };
}

function alert(
  overrides: Partial<OldSpendAlertRow> & Pick<OldSpendAlertRow, 'neonProjectId'>,
): OldSpendAlertRow {
  return {
    snapshotDate: new Date('2026-09-01T00:00:00.000Z'),
    sentAt: new Date('2026-09-01T08:00:00.000Z'),
    spendUsd: 2.5,
    thresholdUsd: 1,
    lastNotifiedSpendUsd: 3.25,
    ...overrides,
  };
}

function planOf(input: {
  projects?: OldNeonProjectRow[];
  snapshots?: OldUsageSnapshotRow[];
  alerts?: OldSpendAlertRow[];
  createMissingRules?: boolean;
  takenSlugs?: string[];
  remap?: Record<string, string>;
}) {
  return buildNeonHistoryPlan({
    projects: input.projects ?? [],
    snapshots: input.snapshots ?? [],
    alerts: input.alerts ?? [],
    syncRuns: [],
    takenSlugs: input.takenSlugs ?? [],
    remap: input.remap ?? {},
    createMissingRules: input.createMissingRules ?? false,
    defaults: DEFAULTS,
    rates: PRICING_RATES.launch,
    today: TODAY,
  });
}

describe('migrate-from-neon env guard', () => {
  it('aborts when OLD_NEON_PROJECT_DATABASE_URL is missing', () => {
    expect(() => readOldNeonDatabaseUrl({ DATABASE_URL: COSTOPS_URL })).toThrow(
      /OLD_NEON_PROJECT_DATABASE_URL is not set/,
    );
    expect(() =>
      assertMigrationEnv({
        DATABASE_URL: COSTOPS_URL,
        OLD_NEON_PROJECTDATABASE_URL: OLD_URL,
      }),
    ).toThrow(/OLD_NEON_PROJECT_DATABASE_URL is not set/);
  });

  it('aborts when the two URLs look like the same database', () => {
    const shared = 'postgresql://a:b@shared.example/app';
    const otherUser = 'postgresql://c:d@shared.example/app?sslmode=require';
    expect(urlsPointAtSameDatabase(shared, otherUser)).toBe(true);
    expect(() =>
      assertMigrationEnv({
        DATABASE_URL: shared,
        OLD_NEON_PROJECT_DATABASE_URL: otherUser,
      }),
    ).toThrow(/same database/);
  });

  it('accepts distinct host+database pairs', () => {
    expect(assertMigrationEnv({ DATABASE_URL: COSTOPS_URL, OLD_NEON_PROJECT_DATABASE_URL: OLD_URL })).toEqual({
      oldUrl: OLD_URL,
      costopsUrl: COSTOPS_URL,
    });
  });
});

describe('migrate-from-neon mapping', () => {
  it('suffixes slugs on collision and does not merge equal names', () => {
    const slugs = assignProjectSlugs({
      projects: [
        { neonProjectId: 'proj-b', name: 'Degusto App' },
        { neonProjectId: 'proj-a', name: 'Degusto App' },
      ],
      takenSlugs: ['degusto-app'],
      remap: {},
    });
    expect(slugs.get('proj-a')).toEqual({ slug: 'degusto-app-2', remapped: false });
    expect(slugs.get('proj-b')).toEqual({ slug: 'degusto-app-3', remapped: false });
  });

  it('keeps MetricEntry and CostEntry history for ignored Neon IDs', () => {
    const ignoredId = 'red-violet-56414917';
    const built = planOf({
      projects: [project({ neonProjectId: ignoredId, name: 'Ignored' })],
      snapshots: [snapshot({ neonProjectId: ignoredId })],
    });
    expect(built.projects[0]?.ignored).toBe(true);
    expect(built.metrics).toHaveLength(7);
    expect(built.costs).toHaveLength(1);
    expect(built.metrics.every((row) => row.externalId === ignoredId)).toBe(true);
    expect(built.costs[0]?.sourceType).toBe('ESTIMATED');
    expect(built.costs[0]?.sourceStatus).toBe('final');
    const metricKeys = new Set(
      built.metrics.map((row) =>
        metricIdempotencyKey({
          providerKey: 'NEON',
          providerAccountId: 'acc',
          externalId: row.externalId,
          bucketDate: row.bucketDate,
          metricKey: row.metricKey,
        }),
      ),
    );
    expect(metricKeys.size).toBe(7);
    expect(NEON_USAGE_METRICS.every((key) => built.metrics.some((row) => row.metricKey === key))).toBe(
      true,
    );
    expect(
      costIdempotencyKey({
        providerKey: 'NEON',
        providerAccountId: 'acc',
        externalId: ignoredId,
        bucketDate: new Date('2026-09-01T00:00:00.000Z'),
      }),
    ).toBe('cost:NEON:acc:red-violet-56414917:2026-09-01:_');
  });

  it('keeps the env-default threshold disabled and enables an explicit threshold', () => {
    expect(
      planBudgetRuleFromOld(
        { spendAlertThresholdUsd: null, spendAlertEscalationPercentOfThreshold: null },
        DEFAULTS,
      ),
    ).toEqual({ limitUsd: 1, escalationPercent: 30, enabled: false });
    expect(
      planBudgetRuleFromOld(
        { spendAlertThresholdUsd: 5, spendAlertEscalationPercentOfThreshold: 20 },
        DEFAULTS,
      ),
    ).toEqual({ limitUsd: 5, escalationPercent: 20, enabled: true });
    const built = planOf({
      projects: [
        project({ neonProjectId: 'default-th', spendAlertThresholdUsd: null }),
        project({
          neonProjectId: 'explicit-th',
          spendAlertThresholdUsd: 8,
          spendAlertEscalationPercentOfThreshold: null,
        }),
      ],
    });
    expect(built.counts.budgetRulesDisabled).toBe(1);
    expect(built.counts.budgetRulesEnabled).toBe(1);
    expect(built.projects.find((row) => row.externalId === 'explicit-th')?.budget).toEqual({
      limitUsd: 8,
      escalationPercent: 30,
      enabled: true,
    });
  });

  it('maps SpendAlertSent onto AlertEvent and skips when no rule exists', () => {
    const mapped = planOf({
      projects: [project({ neonProjectId: 'neon-1' })],
      alerts: [alert({ neonProjectId: 'neon-1', lastNotifiedSpendUsd: null })],
    });
    expect(mapped.alerts).toEqual([
      {
        externalId: 'neon-1',
        budgetDate: new Date('2026-09-01T00:00:00.000Z'),
        firstBreachCostUsd: 2.5,
        lastNotifiedCostUsd: 2.5,
        lastNotifiedAt: new Date('2026-09-01T08:00:00.000Z'),
        createMissingRule: false,
        missingRuleLimitUsd: null,
      },
    ]);
    const skipped = planOf({
      alerts: [alert({ neonProjectId: 'ghost' })],
    });
    expect(skipped.alerts).toEqual([]);
    expect(skipped.alertsSkipped).toEqual([
      {
        externalId: 'ghost',
        budgetDate: new Date('2026-09-01T00:00:00.000Z'),
        reason: 'no_rule',
      },
    ]);
    const created = planOf({
      alerts: [alert({ neonProjectId: 'ghost' })],
      createMissingRules: true,
    });
    expect(created.counts.missingRulesToCreate).toBe(1);
    expect(created.alerts[0]?.createMissingRule).toBe(true);
    expect(created.alerts[0]?.missingRuleLimitUsd).toBe(1);
  });
});
