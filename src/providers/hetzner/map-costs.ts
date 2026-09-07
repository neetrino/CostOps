import { startOfUtcMonth, utcDayKey, utcMonthsOverlapping } from '@/shared/dates';
import type { DateRange, NormalizedCost } from '@/providers/types';

export type FixedVpsResource = {
  externalId: string;
  monthlyAmountUsd: number;
  effectiveOn: Date;
};

/**
 * One FIXED row per resource per UTC month that overlaps the range
 * and is on/after the resource effective month.
 */
export function fixedResourcesToCosts(
  resources: FixedVpsResource[],
  range: DateRange,
): NormalizedCost[] {
  const months = utcMonthsOverlapping(range.from, range.to);
  const costs: NormalizedCost[] = [];
  for (const resource of resources) {
    const effectiveMonth = startOfUtcMonth(resource.effectiveOn);
    for (const monthStart of months) {
      if (monthStart.getTime() < effectiveMonth.getTime()) {
        continue;
      }
      costs.push({
        externalId: resource.externalId,
        bucketDate: monthStart,
        costUsd: resource.monthlyAmountUsd,
        sourceType: 'FIXED',
        sourceStatus: 'final',
        isPartial: false,
      });
    }
  }
  return costs;
}

export function fixedMonthKey(externalId: string, bucketDate: Date): string {
  return `${externalId}:${utcDayKey(bucketDate)}`;
}

/** Keep past FIXED history when the monthly amount changes. */
export function filterFixedCostsForRewrite(
  costs: NormalizedCost[],
  existingPastKeys: ReadonlySet<string>,
  now: Date,
): NormalizedCost[] {
  const currentMonth = startOfUtcMonth(now);
  return costs.filter((cost) => {
    if (cost.bucketDate.getTime() >= currentMonth.getTime()) {
      return true;
    }
    return !existingPastKeys.has(fixedMonthKey(cost.externalId, cost.bucketDate));
  });
}
