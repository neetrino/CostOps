import { DEFAULT_COST_DIMENSION_KEY } from '@/config/constants';
import { utcDayKey } from '@/shared/dates';

export function costIdempotencyKey(input: {
  providerKey: string;
  providerAccountId: string;
  externalId: string;
  bucketDate: Date;
  dimensionKey?: string;
}): string {
  const day = utcDayKey(input.bucketDate);
  const dimension = input.dimensionKey ?? DEFAULT_COST_DIMENSION_KEY;
  return `cost:${input.providerKey}:${input.providerAccountId}:${input.externalId}:${day}:${dimension}`;
}
