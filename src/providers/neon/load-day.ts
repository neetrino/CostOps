import { NEON_RESOURCE_TYPE } from '@/config/constants';
import { addUtcDays, isSameUtcDay, toUtcDateOnly, utcDayKey } from '@/shared/dates';
import { getEnv } from '@/shared/env';
import { withBackoff } from '@/shared/retry';
import { isNeonAuthFailure } from '@/providers/neon/errors';
import { fetchConsumptionHistoryV2 } from '@/providers/neon/fetch-consumption-v2';
import { listAllNeonProjects } from '@/providers/neon/list-projects';
import {
  emptySnapshot,
  mapMetricsToSnapshot,
  snapshotToRawTotals,
  sumSnapshotMetrics,
  type SnapshotMetrics,
} from '@/providers/neon/map-metrics';
import { NEON_METRIC_UNITS, NEON_USAGE_METRICS } from '@/providers/neon/metrics';
import {
  applyPublicTransferAllowance,
  estimateProjectCost,
  normalizeTotals,
  periodHoursFromCalendarDays,
  PRICING_RATES,
  type EstimatedProjectCost,
} from '@/providers/neon/pricing';
import { resolveNeonCredentials } from '@/providers/neon/credentials';
import { filterIgnoredNeonProjects } from '@/providers/neon/ignored-projects';
import type {
  DateRange,
  NormalizedCost,
  NormalizedMetric,
  ProviderContext,
  ResourceSyncResult,
} from '@/providers/types';

export type NeonLoadedProject = {
  externalId: string;
  displayName: string;
  regionId: string | null;
  metrics: SnapshotMetrics;
  estimated: EstimatedProjectCost;
};

export type NeonDayLoad = {
  bucketDate: Date;
  isPartial: boolean;
  projects: NeonLoadedProject[];
};

type ConsumptionProject = Awaited<ReturnType<typeof fetchConsumptionHistoryV2>>[number];

let cachedLoad: { key: string; value: NeonDayLoad } | null = null;

function cacheKey(accountId: string, range: DateRange, now: Date): string {
  return `${accountId}:${utcDayKey(range.from)}:${utcDayKey(range.to)}:${now.toISOString()}`;
}

function assertSingleUtcDay(range: DateRange): Date {
  const from = toUtcDateOnly(range.from);
  const to = toUtcDateOnly(range.to);
  if (from.getTime() !== to.getTime()) {
    throw new Error('Neon adapter expects a single UTC day range');
  }
  return from;
}

function retryUnlessAuth(error: unknown): boolean {
  return !isNeonAuthFailure(error);
}

export async function listNeonResources(ctx: ProviderContext): Promise<ResourceSyncResult> {
  const creds = resolveNeonCredentials(ctx.account.credentialRef);
  const projects = filterIgnoredNeonProjects(
    await withBackoff(() => listAllNeonProjects({ apiKey: creds.apiKey, orgId: creds.orgId }), {
      label: 'neon.listProjects',
      shouldRetry: retryUnlessAuth,
    }),
  );
  return {
    discovered: projects.map((project) => ({
      externalId: project.id,
      displayName: project.name,
      resourceType: NEON_RESOURCE_TYPE,
      metadata: { regionId: project.region_id ?? null },
    })),
  };
}

function collectProjectMetrics(
  consumption: ConsumptionProject[],
  listedIds: Set<string>,
  targetKey: string,
  hourly: boolean,
): Map<string, SnapshotMetrics> {
  const merged = new Map<string, SnapshotMetrics>();
  for (const project of consumption) {
    if (!listedIds.has(project.project_id)) {
      continue;
    }
    let acc = emptySnapshot();
    let hadSlot = false;
    for (const period of project.periods) {
      for (const slot of period.consumption) {
        if (slot.timeframe_start.slice(0, 10) !== targetKey) {
          continue;
        }
        hadSlot = true;
        const mapped = mapMetricsToSnapshot(slot.metrics);
        acc = hourly ? sumSnapshotMetrics(acc, mapped) : mapped;
      }
    }
    if (hadSlot) {
      merged.set(project.project_id, acc);
    }
  }
  return merged;
}

function estimateLoadedProjects(
  names: Map<string, { name: string; regionId: string | null }>,
  metricsById: Map<string, SnapshotMetrics>,
): NeonLoadedProject[] {
  const plan = getEnv().NEON_PRICING_PLAN;
  const rates = PRICING_RATES[plan];
  const periodHours = periodHoursFromCalendarDays(1);
  const projects: NeonLoadedProject[] = [];
  for (const [externalId, metrics] of metricsById) {
    const raw = snapshotToRawTotals(metrics);
    const estimated = estimateProjectCost(
      raw,
      normalizeTotals(raw, periodHours),
      rates,
      periodHours,
    );
    const meta = names.get(externalId);
    projects.push({
      externalId,
      displayName: meta?.name ?? externalId,
      regionId: meta?.regionId ?? null,
      metrics,
      estimated,
    });
  }
  applyPublicTransferAllowance(
    projects.map((project) => ({ estimatedCost: project.estimated })),
    rates,
  );
  return projects;
}

export async function loadNeonDay(ctx: ProviderContext, range: DateRange): Promise<NeonDayLoad> {
  const bucketDate = assertSingleUtcDay(range);
  const key = cacheKey(ctx.account.id, range, ctx.now);
  if (cachedLoad?.key === key) {
    return cachedLoad.value;
  }

  const creds = resolveNeonCredentials(ctx.account.credentialRef);
  const hourly = isSameUtcDay(bucketDate, ctx.now);
  const fromIso = bucketDate.toISOString();
  const toIso = hourly ? ctx.now.toISOString() : addUtcDays(bucketDate, 1).toISOString();

  const listed = filterIgnoredNeonProjects(
    await withBackoff(() => listAllNeonProjects({ apiKey: creds.apiKey, orgId: creds.orgId }), {
      label: 'neon.listProjects',
      shouldRetry: retryUnlessAuth,
    }),
  );
  const names = new Map(
    listed.map((project) => [
      project.id,
      { name: project.name, regionId: project.region_id ?? null },
    ]),
  );
  const consumption = await withBackoff(
    () =>
      fetchConsumptionHistoryV2({
        apiKey: creds.apiKey,
        orgId: creds.orgId,
        fromIso,
        toIso,
        granularity: hourly ? 'hourly' : 'daily',
      }),
    {
      label: hourly ? 'neon.consumptionHourly' : 'neon.consumptionDaily',
      shouldRetry: retryUnlessAuth,
    },
  );

  const metricsById = collectProjectMetrics(
    consumption,
    new Set(names.keys()),
    utcDayKey(bucketDate),
    hourly,
  );
  const value: NeonDayLoad = {
    bucketDate,
    isPartial: hourly,
    projects: estimateLoadedProjects(names, metricsById),
  };
  cachedLoad = { key, value };
  return value;
}

export function neonDayToCosts(load: NeonDayLoad): NormalizedCost[] {
  const sourceStatus = load.isPartial ? 'partial' : 'fresh';
  return load.projects.map((project) => ({
    externalId: project.externalId,
    bucketDate: load.bucketDate,
    costUsd: project.estimated.totalUsd,
    sourceType: 'ESTIMATED',
    sourceStatus,
    isPartial: load.isPartial,
    dimensionKey: '_',
    metadata: {
      computeUsd: project.estimated.computeUsd,
      storageUsd: project.estimated.storageUsd,
      historyUsd: project.estimated.historyUsd,
      privateTransferUsd: project.estimated.privateTransferUsd,
      branchesUsd: project.estimated.branchesUsd,
      publicTransferUsd: project.estimated.publicTransferUsd,
      publicTransferGb: project.estimated.publicTransferGb,
    },
  }));
}

export function neonDayToMetrics(load: NeonDayLoad): NormalizedMetric[] {
  const rows: NormalizedMetric[] = [];
  const rawByProject = load.projects.map((project) => ({
    project,
    raw: snapshotToRawTotals(project.metrics),
  }));
  for (const { project, raw } of rawByProject) {
    for (const metricKey of NEON_USAGE_METRICS) {
      rows.push({
        externalId: project.externalId,
        bucketDate: load.bucketDate,
        metricKey,
        valueBigint: raw[metricKey],
        unit: NEON_METRIC_UNITS[metricKey],
      });
    }
  }
  return rows;
}
