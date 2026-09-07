import { DEFAULT_COST_DIMENSION_KEY } from '@/config/constants';
import { costIdempotencyKey } from '@/core/cost/idempotency';
import type { ProviderKey } from '@/generated/prisma/enums';
import { prisma } from '@/shared/db';
import { toUtcDateOnly } from '@/shared/dates';
import { toFixedUsd } from '@/shared/money';
import type { NormalizedCost } from '@/providers/types';

type ResourceLink = {
  id: string;
  projectId: string | null;
  projectProviderId: string | null;
  externalId: string;
};

function toPrismaStatus(
  status: NormalizedCost['sourceStatus'],
): 'FRESH' | 'PARTIAL' | 'FINAL' | 'STALE' | 'ERROR' | 'MISSING' {
  return status.toUpperCase() as 'FRESH' | 'PARTIAL' | 'FINAL' | 'STALE' | 'ERROR' | 'MISSING';
}

export async function upsertCostEntries(input: {
  providerKey: ProviderKey;
  providerAccountId: string;
  costs: NormalizedCost[];
  resourcesByExternalId: Map<string, ResourceLink>;
  finalize: boolean;
}): Promise<number> {
  let written = 0;
  for (const cost of input.costs) {
    const resource = input.resourcesByExternalId.get(cost.externalId);
    const bucketDate = toUtcDateOnly(cost.bucketDate);
    const finalizeRow =
      input.finalize && cost.sourceStatus !== 'error' && cost.sourceStatus !== 'missing';
    const sourceStatus = finalizeRow ? 'FINAL' : toPrismaStatus(cost.sourceStatus);
    const isPartial = finalizeRow ? false : cost.isPartial;
    const dimensionKey = cost.dimensionKey ?? DEFAULT_COST_DIMENSION_KEY;
    const idempotencyKey = costIdempotencyKey({
      providerKey: input.providerKey,
      providerAccountId: input.providerAccountId,
      externalId: cost.externalId,
      bucketDate,
      dimensionKey,
    });
    await prisma.costEntry.upsert({
      where: { idempotencyKey },
      create: {
        idempotencyKey,
        projectId: resource?.projectId ?? null,
        projectProviderId: resource?.projectProviderId ?? null,
        providerKey: input.providerKey,
        providerAccountId: input.providerAccountId,
        resourceId: resource?.id ?? null,
        bucketDate,
        costUsd: toFixedUsd(cost.costUsd, 6),
        originalAmount:
          cost.originalAmount !== undefined ? toFixedUsd(cost.originalAmount, 6) : null,
        originalCurrency: cost.originalCurrency ?? null,
        sourceType: cost.sourceType,
        sourceStatus,
        isPartial,
        dimensionKey,
        sourceRecordId: cost.sourceRecordId ?? null,
        metadata: cost.metadata ?? undefined,
      },
      update: {
        projectId: resource?.projectId ?? null,
        projectProviderId: resource?.projectProviderId ?? null,
        resourceId: resource?.id ?? null,
        costUsd: toFixedUsd(cost.costUsd, 6),
        originalAmount:
          cost.originalAmount !== undefined ? toFixedUsd(cost.originalAmount, 6) : null,
        originalCurrency: cost.originalCurrency ?? null,
        sourceType: cost.sourceType,
        sourceStatus,
        isPartial,
        metadata: cost.metadata ?? undefined,
      },
    });
    written += 1;
  }
  return written;
}
