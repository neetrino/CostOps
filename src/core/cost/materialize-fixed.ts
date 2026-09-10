import { upsertCostEntries } from '@/core/cost/upsert';
import { prisma } from '@/shared/db';
import { startOfUtcMonth, toUtcDateOnly, utcMonthsOverlapping } from '@/shared/dates';
import { decimalToNumber } from '@/shared/money';
import {
  classifyPastFixedMonths,
  filterFixedCostsForRewrite,
  fixedResourcesToCosts,
} from '@/providers/hetzner/map-costs';
import type { DateRange } from '@/providers/types';

/**
 * Writes FIXED daily rows for the monthly fee from `fixedEffectiveOn`.
 * Current and future months always upsert. Days before the start date in the
 * current month are removed so a mid-month purchase does not bill the 1st.
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
  const monthlyAmountUsd = decimalToNumber(resource.fixedMonthlyUsd);
  const monthStarts = utcMonthsOverlapping(input.range.from, input.range.to);
  const firstMonth = monthStarts[0];
  const lastMonth = monthStarts[monthStarts.length - 1];
  const existing =
    firstMonth && lastMonth
      ? await prisma.costEntry.findMany({
          where: {
            resourceId: resource.id,
            sourceType: 'FIXED',
            bucketDate: {
              gte: firstMonth,
              lt: new Date(Date.UTC(lastMonth.getUTCFullYear(), lastMonth.getUTCMonth() + 1, 1)),
            },
          },
          select: { bucketDate: true, costUsd: true },
        })
      : [];
  const past = classifyPastFixedMonths(
    existing.map((row) => ({
      externalId: resource.externalId,
      bucketDate: row.bucketDate,
      costUsd: decimalToNumber(row.costUsd),
    })),
    now,
  );
  const allCosts = fixedResourcesToCosts(
    [
      {
        externalId: resource.externalId,
        monthlyAmountUsd,
        effectiveOn: resource.fixedEffectiveOn,
      },
    ],
    input.range,
    past.lumpAmounts,
  );
  const costs = filterFixedCostsForRewrite(allCosts, past.skipKeys, now);
  const effectiveOn = toUtcDateOnly(resource.fixedEffectiveOn);
  await prisma.costEntry.deleteMany({
    where: {
      resourceId: resource.id,
      sourceType: 'FIXED',
      bucketDate: {
        gte: startOfUtcMonth(now),
        lt: effectiveOn,
      },
    },
  });
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
