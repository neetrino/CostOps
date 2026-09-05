import type { ProviderKey } from '@/generated/prisma/enums';
import { prisma } from '@/shared/db';
import { decimalToNumber } from '@/shared/money';

export type MetricEntryRow = {
  bucketDate: Date;
  projectId: string | null;
  providerKey: string;
  metricKey: string;
  value: number;
  unit: string;
};

export async function loadRangeMetricRows(input: {
  from: Date;
  to: Date;
  metricKey: string;
  projectId?: string;
  providerKey?: ProviderKey;
}): Promise<MetricEntryRow[]> {
  const rows = await prisma.metricEntry.findMany({
    where: {
      bucketDate: { gte: input.from, lte: input.to },
      metricKey: input.metricKey,
      ...(input.projectId ? { projectId: input.projectId } : {}),
      ...(input.providerKey ? { providerKey: input.providerKey } : {}),
    },
  });
  return rows.map((row) => ({
    bucketDate: row.bucketDate,
    projectId: row.projectId,
    providerKey: row.providerKey,
    metricKey: row.metricKey,
    value: metricNumericValue(row.valueNumeric, row.valueBigint),
    unit: row.unit,
  }));
}

function metricNumericValue(
  valueNumeric: { toString(): string } | null,
  valueBigint: bigint | null,
): number {
  if (valueNumeric !== null) {
    return decimalToNumber(valueNumeric);
  }
  if (valueBigint !== null) {
    return Number(valueBigint);
  }
  return 0;
}
