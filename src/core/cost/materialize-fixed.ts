import { upsertCostEntries } from '@/core/cost/upsert';
import { prisma } from '@/shared/db';
import { startOfUtcMonth, utcMonthsOverlapping } from '@/shared/dates';
import { decimalToNumber } from '@/shared/money';
import {
  filterFixedCostsForRewrite,
  fixedMonthKey,
  fixedResourcesToCosts,
} from '@/providers/hetzner/map-costs';
import type { DateRange } from '@/providers/types';

/**
 * Writes FIXED month-start rows. Current and future months always upsert.
 * Past months are created only when missing, so an amount edit does not rewrite history.
 */
export async function materializeFixedVpsCosts(input: {
  providerAccountId: string;
  resourceId: string;
  range: DateRange;
  now?: Date;
}): Promise<number> {
  const now = input.now ?? new Date();
  const resource = await prisma.resource.findUnique({
    where: { id: input.resourceId },
    select: {
      id: true,
      externalId: true,
      projectId: true,
      projectProviderId: true,
      archivedAt: true,
      fixedMonthlyUsd: true,
      fixedEffectiveOn: true,
    },
  });
  if (!resource || resource.archivedAt || !resource.fixedMonthlyUsd || !resource.fixedEffectiveOn) {
    return 0;
  }
  const allCosts = fixedResourcesToCosts(
    [
      {
        externalId: resource.externalId,
        monthlyAmountUsd: decimalToNumber(resource.fixedMonthlyUsd),
        effectiveOn: resource.fixedEffectiveOn,
      },
    ],
    input.range,
  );
  const currentMonth = startOfUtcMonth(now);
  const monthStarts = utcMonthsOverlapping(input.range.from, input.range.to);
  const existing = await prisma.costEntry.findMany({
    where: {
      resourceId: resource.id,
      bucketDate: { in: monthStarts },
    },
    select: { bucketDate: true },
  });
  const existingPast = new Set(
    existing
      .filter((row) => row.bucketDate.getTime() < currentMonth.getTime())
      .map((row) => fixedMonthKey(resource.externalId, row.bucketDate)),
  );
  const costs = filterFixedCostsForRewrite(allCosts, existingPast, now);
  if (costs.length === 0) {
    return 0;
  }
  const written = await upsertCostEntries({
    providerKey: 'HETZNER',
    providerAccountId: input.providerAccountId,
    costs,
    resourcesByExternalId: new Map([
      [
        resource.externalId,
        {
          id: resource.id,
          projectId: resource.projectId,
          projectProviderId: resource.projectProviderId,
          externalId: resource.externalId,
        },
      ],
    ]),
    finalize: true,
  });
  await prisma.providerAccount.update({
    where: { id: input.providerAccountId },
    data: {
      lastSuccessfulSyncAt: now,
      status: 'ACTIVE',
      lastErrorAt: null,
      lastErrorMessage: null,
    },
  });
  return written;
}
