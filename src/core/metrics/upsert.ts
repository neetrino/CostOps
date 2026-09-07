import { metricIdempotencyKey } from '@/core/metrics/idempotency';
import type { ProviderKey } from '@/generated/prisma/enums';
import { prisma } from '@/shared/db';
import { toUtcDateOnly } from '@/shared/dates';
import type { NormalizedMetric } from '@/providers/types';

type ResourceLink = {
  id: string;
  projectId: string | null;
  projectProviderId: string | null;
};

export async function upsertMetricEntries(input: {
  providerKey: ProviderKey;
  providerAccountId: string;
  metrics: NormalizedMetric[];
  resourcesByExternalId: Map<string, ResourceLink>;
}): Promise<number> {
  let written = 0;
  for (const metric of input.metrics) {
    const resource = input.resourcesByExternalId.get(metric.externalId);
    const bucketDate = toUtcDateOnly(metric.bucketDate);
    const idempotencyKey = metricIdempotencyKey({
      providerKey: input.providerKey,
      providerAccountId: input.providerAccountId,
      externalId: metric.externalId,
      bucketDate,
      metricKey: metric.metricKey,
    });
    await prisma.metricEntry.upsert({
      where: { idempotencyKey },
      create: {
        idempotencyKey,
        projectId: resource?.projectId ?? null,
        projectProviderId: resource?.projectProviderId ?? null,
        providerKey: input.providerKey,
        providerAccountId: input.providerAccountId,
        resourceId: resource?.id ?? null,
        bucketDate,
        metricKey: metric.metricKey,
        valueNumeric: metric.valueNumeric !== undefined ? metric.valueNumeric.toFixed(6) : null,
        valueBigint: metric.valueBigint ?? null,
        unit: metric.unit,
        metadata: metric.metadata ?? undefined,
      },
      update: {
        projectId: resource?.projectId ?? null,
        projectProviderId: resource?.projectProviderId ?? null,
        resourceId: resource?.id ?? null,
        valueNumeric: metric.valueNumeric !== undefined ? metric.valueNumeric.toFixed(6) : null,
        valueBigint: metric.valueBigint ?? null,
        unit: metric.unit,
        metadata: metric.metadata ?? undefined,
      },
    });
    written += 1;
  }
  return written;
}
