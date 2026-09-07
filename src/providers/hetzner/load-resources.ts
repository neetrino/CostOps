import { prisma } from '@/shared/db';
import { startOfUtcMonth } from '@/shared/dates';
import { decimalToNumber } from '@/shared/money';
import { fixedMonthKey, type FixedVpsResource } from '@/providers/hetzner/map-costs';

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

export async function loadExistingPastFixedMonthKeys(
  accountId: string,
  now: Date,
): Promise<Set<string>> {
  const currentMonth = startOfUtcMonth(now);
  const rows = await prisma.costEntry.findMany({
    where: {
      providerAccountId: accountId,
      providerKey: 'HETZNER',
      sourceType: 'FIXED',
      bucketDate: { lt: currentMonth },
    },
    select: { resource: { select: { externalId: true } }, bucketDate: true },
  });
  return new Set(
    rows.flatMap((row) => {
      if (!row.resource) {
        return [];
      }
      return [fixedMonthKey(row.resource.externalId, row.bucketDate)];
    }),
  );
}
