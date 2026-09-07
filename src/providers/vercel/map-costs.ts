import { VERCEL_UNALLOCATED_EXTERNAL_ID } from '@/config/constants';
import { vercelMetricKey } from '@/providers/vercel/metrics';
import { utcDayKey } from '@/shared/dates';
import type { NormalizedCost, NormalizedMetric } from '@/providers/types';
import type { VercelFocusCharge } from '@/providers/vercel/schemas';

export type VercelProjectRef = {
  externalId: string;
  displayName: string;
};

type CostAccumulator = {
  billedUsd: number;
  effectiveUsd: number;
  chargeCount: number;
};

type MetricAccumulator = {
  value: number;
  unit: string;
  serviceName: string;
};

export function chargeProjectExternalId(charge: VercelFocusCharge): string {
  const projectId = charge.Tags.ProjectId?.trim();
  return projectId && projectId.length > 0 ? projectId : VERCEL_UNALLOCATED_EXTERNAL_ID;
}

export function chargesForUtcDay(charges: VercelFocusCharge[], utcDay: Date): VercelFocusCharge[] {
  const dayKey = utcDayKey(utcDay);
  return charges.filter((charge) => charge.ChargePeriodStart.slice(0, 10) === dayKey);
}

export function vercelChargesToCosts(input: {
  charges: VercelFocusCharge[];
  projects: VercelProjectRef[];
  bucketDate: Date;
  isPartial: boolean;
}): NormalizedCost[] {
  const totals = new Map<string, CostAccumulator>();
  for (const charge of input.charges) {
    const externalId = chargeProjectExternalId(charge);
    const current = totals.get(externalId) ?? { billedUsd: 0, effectiveUsd: 0, chargeCount: 0 };
    current.billedUsd += charge.BilledCost;
    current.effectiveUsd += charge.EffectiveCost;
    current.chargeCount += 1;
    totals.set(externalId, current);
  }
  const knownIds = new Set(input.projects.map((project) => project.externalId));
  const rows: NormalizedCost[] = input.projects.map((project) =>
    toCostRow(
      project.externalId,
      totals.get(project.externalId),
      input.bucketDate,
      input.isPartial,
    ),
  );
  for (const [externalId, acc] of totals) {
    if (!knownIds.has(externalId)) {
      rows.push(toCostRow(externalId, acc, input.bucketDate, input.isPartial));
    }
  }
  return rows;
}

export function vercelChargesToMetrics(input: {
  charges: VercelFocusCharge[];
  bucketDate: Date;
}): NormalizedMetric[] {
  const merged = new Map<string, MetricAccumulator>();
  for (const charge of input.charges) {
    if (charge.ConsumedQuantity === null) {
      continue;
    }
    const externalId = chargeProjectExternalId(charge);
    const metricKey = vercelMetricKey(charge.ServiceName);
    const mapKey = `${externalId}:${metricKey}`;
    const current = merged.get(mapKey);
    if (current) {
      current.value += charge.ConsumedQuantity;
    } else {
      merged.set(mapKey, {
        value: charge.ConsumedQuantity,
        unit: charge.ConsumedUnit ?? 'raw',
        serviceName: charge.ServiceName,
      });
    }
  }
  return [...merged.entries()].map(([mapKey, acc]) => {
    const separator = mapKey.indexOf(':');
    return {
      externalId: mapKey.slice(0, separator),
      bucketDate: input.bucketDate,
      metricKey: mapKey.slice(separator + 1),
      valueNumeric: acc.value,
      unit: acc.unit,
      metadata: { serviceName: acc.serviceName },
    };
  });
}

export function placeholderVercelCosts(input: {
  projects: VercelProjectRef[];
  bucketDate: Date;
  sourceStatus: 'missing' | 'error';
  metadata: Record<string, string | number | boolean | null>;
}): NormalizedCost[] {
  return input.projects.map((project) => ({
    externalId: project.externalId,
    bucketDate: input.bucketDate,
    costUsd: 0,
    sourceType: 'API',
    sourceStatus: input.sourceStatus,
    isPartial: false,
    dimensionKey: '_',
    metadata: input.metadata,
  }));
}

function toCostRow(
  externalId: string,
  acc: CostAccumulator | undefined,
  bucketDate: Date,
  isPartial: boolean,
): NormalizedCost {
  const billedUsd = acc?.billedUsd ?? 0;
  const effectiveUsd = acc?.effectiveUsd ?? 0;
  // Usage (who spent), including plan credit. Invoice remainder stays in metadata.billedUsd.
  return {
    externalId,
    bucketDate,
    costUsd: effectiveUsd,
    originalAmount: effectiveUsd,
    originalCurrency: 'USD',
    sourceType: 'API',
    sourceStatus: isPartial ? 'partial' : 'fresh',
    isPartial,
    dimensionKey: '_',
    metadata: {
      billedUsd,
      effectiveUsd,
      chargeCount: acc?.chargeCount ?? 0,
    },
  };
}
