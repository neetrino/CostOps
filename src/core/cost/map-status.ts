import type { CostSourceType, Freshness } from '@/providers/types';
import type { CostSourceStatus } from '@/generated/prisma/enums';

export function toFreshness(status: CostSourceStatus): Freshness {
  return status.toLowerCase() as Freshness;
}

export function toCostSourceType(value: string): CostSourceType {
  return value as CostSourceType;
}
