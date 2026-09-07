import {
  VERCEL_RESOURCE_TYPE,
  VERCEL_UNALLOCATED_EXTERNAL_ID,
  VERCEL_UNALLOCATED_RESOURCE_TYPE,
} from '@/config/constants';
import { isSameUtcDay, toUtcDateOnly, utcDayKey } from '@/shared/dates';
import { withBackoff } from '@/shared/retry';
import { resolveVercelCredentials } from '@/providers/vercel/credentials';
import { isVercelAuthFailure } from '@/providers/vercel/errors';
import { fetchVercelCharges } from '@/providers/vercel/fetch-charges';
import {
  fetchVercelBillingCycle,
  type VercelBillingCycle,
} from '@/providers/vercel/fetch-billing-cycle';
import { listAllVercelProjects } from '@/providers/vercel/list-projects';
import {
  chargesForUtcDay,
  placeholderVercelCosts,
  vercelChargesToCosts,
  vercelChargesToMetrics,
  type VercelProjectRef,
} from '@/providers/vercel/map-costs';
import type {
  DateRange,
  NormalizedCost,
  NormalizedMetric,
  ProviderContext,
  ResourceSyncResult,
} from '@/providers/types';

export type VercelDayLoad = {
  bucketDate: Date;
  isPartial: boolean;
  costs: NormalizedCost[];
  metrics: NormalizedMetric[];
};

const UNALLOCATED_PROJECT: VercelProjectRef = {
  externalId: VERCEL_UNALLOCATED_EXTERNAL_ID,
  displayName: 'Team (unallocated)',
};

let cachedLoad: { key: string; value: VercelDayLoad } | null = null;
let cachedBillingCycle: { key: string; value: VercelBillingCycle | null } | null = null;

function cacheKey(accountId: string, range: DateRange, now: Date): string {
  return `${accountId}:${utcDayKey(range.from)}:${utcDayKey(range.to)}:${now.toISOString()}`;
}

function assertSingleUtcDay(range: DateRange): Date {
  const from = toUtcDateOnly(range.from);
  const to = toUtcDateOnly(range.to);
  if (from.getTime() !== to.getTime()) {
    throw new Error('Vercel adapter expects a single UTC day range');
  }
  return from;
}

function retryUnlessAuth(error: unknown): boolean {
  return !isVercelAuthFailure(error);
}

export async function listVercelResources(ctx: ProviderContext): Promise<ResourceSyncResult> {
  const creds = resolveVercelCredentials(ctx.account.credentialRef);
  const projects = await withBackoff(
    () => listAllVercelProjects({ token: creds.token, teamId: creds.teamId }),
    { label: 'vercel.listProjects', shouldRetry: retryUnlessAuth },
  );
  return {
    discovered: [
      ...projects.map((project) => ({
        externalId: project.id,
        displayName: project.name,
        resourceType: VERCEL_RESOURCE_TYPE,
        metadata: { framework: project.framework ?? null },
      })),
      {
        externalId: UNALLOCATED_PROJECT.externalId,
        displayName: UNALLOCATED_PROJECT.displayName,
        resourceType: VERCEL_UNALLOCATED_RESOURCE_TYPE,
        metadata: { reason: 'charges_without_project_tags' },
      },
    ],
  };
}

export async function loadVercelDay(
  ctx: ProviderContext,
  range: DateRange,
): Promise<VercelDayLoad> {
  const bucketDate = assertSingleUtcDay(range);
  const key = cacheKey(ctx.account.id, range, ctx.now);
  if (cachedLoad?.key === key) {
    return cachedLoad.value;
  }
  const creds = resolveVercelCredentials(ctx.account.credentialRef);
  const [listed, billingCycle] = await Promise.all([
    withBackoff(() => listAllVercelProjects({ token: creds.token, teamId: creds.teamId }), {
      label: 'vercel.listProjects',
      shouldRetry: retryUnlessAuth,
    }),
    loadBillingCycle(ctx, creds),
  ]);
  const projects: VercelProjectRef[] = [
    ...listed.map((project) => ({ externalId: project.id, displayName: project.name })),
    UNALLOCATED_PROJECT,
  ];
  const charges = await withBackoff(
    () => fetchVercelCharges({ token: creds.token, teamId: creds.teamId, utcDay: bucketDate }),
    { label: 'vercel.billingCharges', shouldRetry: retryUnlessAuth },
  );
  const value = toDayLoad(
    projects,
    charges,
    bucketDate,
    isSameUtcDay(bucketDate, ctx.now),
    billingCycle,
  );
  cachedLoad = { key, value };
  return value;
}

function toDayLoad(
  projects: VercelProjectRef[],
  charges: Awaited<ReturnType<typeof fetchVercelCharges>>,
  bucketDate: Date,
  isPartial: boolean,
  billingCycle: VercelBillingCycle | null,
): VercelDayLoad {
  if (charges.kind === 'ok') {
    const dayCharges = chargesForUtcDay(charges.charges, bucketDate);
    return {
      bucketDate,
      isPartial,
      costs: vercelChargesToCosts({
        charges: dayCharges,
        projects,
        bucketDate,
        isPartial,
        billingCycle,
      }),
      metrics: vercelChargesToMetrics({ charges: dayCharges, bucketDate }),
    };
  }
  const sourceStatus = charges.kind === 'forbidden' ? 'error' : 'missing';
  return {
    bucketDate,
    isPartial: false,
    costs: placeholderVercelCosts({
      projects,
      bucketDate,
      sourceStatus,
      metadata: {
        billingHttpStatus: charges.status,
        billingErrorCode: charges.errorCode,
        billingResult: charges.kind,
      },
    }),
    metrics: [],
  };
}

async function loadBillingCycle(
  ctx: ProviderContext,
  creds: ReturnType<typeof resolveVercelCredentials>,
): Promise<VercelBillingCycle | null> {
  const key = `${ctx.account.id}:${ctx.now.toISOString()}`;
  if (cachedBillingCycle?.key === key) {
    return cachedBillingCycle.value;
  }
  const value = await withBackoff(
    () => fetchVercelBillingCycle({ token: creds.token, teamId: creds.teamId, now: ctx.now }),
    { label: 'vercel.billingCycle', shouldRetry: retryUnlessAuth },
  );
  cachedBillingCycle = { key, value };
  return value;
}
