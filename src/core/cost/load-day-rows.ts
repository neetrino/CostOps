import type { CostRow } from '@/core/cost/types';
import type { CostSourceType, Freshness } from '@/providers/types';
import type { CostSourceStatus } from '@/generated/prisma/enums';
import { prisma } from '@/shared/db';
import { decimalToNumber } from '@/shared/money';

function toFreshness(status: CostSourceStatus): Freshness {
  return status.toLowerCase() as Freshness;
}

export async function loadDayCostRows(bucketDate: Date): Promise<CostRow[]> {
  const rows = await prisma.costEntry.findMany({ where: { bucketDate } });
  return rows.map((row) => ({
    costUsd: decimalToNumber(row.costUsd),
    sourceStatus: toFreshness(row.sourceStatus),
    sourceType: row.sourceType as CostSourceType,
    isPartial: row.isPartial,
    projectId: row.projectId,
    projectProviderId: row.projectProviderId,
    providerKey: row.providerKey,
  }));
}
