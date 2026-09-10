import { prisma } from '@/shared/db';
import { startOfUtcMonth } from '@/shared/dates';
import { decimalToNumber } from '@/shared/money';
import {
  classifyPastFixedMonths,
  type FixedVpsResource,
  type PastFixedMonthRewrite,
} from '@/providers/hetzner/map-costs';

export async function loadActiveFixedVpsResources(accountId: string): Promise<FixedVpsResource[]> {
  const rows = await prisma.resource.findMany({
    where: {
      providerAccountId: accountId,
      providerKey: 'HETZNER',
      archivedAt: null,
      fixedMonthlyUsd: { not: null },
      fixedEffectiveOn: { not: null },
    },
    select: {
      externalId: true,
      fixedMonthlyUsd: true,
      fixedEffectiveOn: true,
    },
  });
  return rows.flatMap((row) => {
    if (!row.fixedMonthlyUsd || !row.fixedEffectiveOn) {
      return [];
    }
    return [
      {
        externalId: row.externalId,
        monthlyAmountUsd: decimalToNumber(row.fixedMonthlyUsd),
        effectiveOn: row.fixedEffectiveOn,
      },
    ];
  });
}

export async function loadPastFixedMonthRewrite(
  accountId: string,
  now: Date,
): Promise<PastFixedMonthRewrite> {
  const currentMonth = startOfUtcMonth(now);
  const rows = await prisma.costEntry.findMany({
    where: {
      providerAccountId: accountId,
      providerKey: 'HETZNER',
      sourceType: 'FIXED',
      bucketDate: { lt: currentMonth },
    },
    select: {
      bucketDate: true,
      costUsd: true,
      resource: { select: { externalId: true } },
    },
  });
  return classifyPastFixedMonths(
    rows.flatMap((row) => {
      if (!row.resource) {
        return [];
      }
      return [
        {
          externalId: row.resource.externalId,
          bucketDate: row.bucketDate,
          costUsd: decimalToNumber(row.costUsd),
        },
      ];
    }),
    now,
  );
}
