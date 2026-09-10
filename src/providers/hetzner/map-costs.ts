import {
  eachUtcDay,
  endOfUtcMonth,
  startOfUtcMonth,
  utcDaysInMonth,
  utcMonthKey,
  utcMonthsOverlapping,
} from '@/shared/dates';
import type { DateRange, NormalizedCost } from '@/providers/types';

/** Matches CostEntry.costUsd Decimal(14, 6). */
const COST_USD_MICROS = 1_000_000;

export type FixedVpsResource = {
  externalId: string;
  monthlyAmountUsd: number;
  effectiveOn: Date;
};

export type PastFixedCostRow = {
  externalId: string;
  bucketDate: Date;
  costUsd: number;
};

export function fixedMonthKey(externalId: string, bucketDate: Date): string {
  return `${externalId}:${utcMonthKey(bucketDate)}`;
}

/**
 * Spread a monthly fee across UTC days so the sum equals `monthlyAmountUsd`.
 * The last day absorbs leftover micros from integer division.
 */
export function splitMonthlyUsdAcrossDays(monthlyAmountUsd: number, daysInMonth: number): number[] {
  if (daysInMonth <= 0) {
    throw new Error('daysInMonth must be positive');
  }
  const totalMicros = Math.round(monthlyAmountUsd * COST_USD_MICROS);
  const dailyMicros = Math.floor(totalMicros / daysInMonth);
  const amounts: number[] = [];
  for (let index = 0; index < daysInMonth; index += 1) {
    const micros =
      index === daysInMonth - 1 ? totalMicros - dailyMicros * (daysInMonth - 1) : dailyMicros;
    amounts.push(micros / COST_USD_MICROS);
  }
  return amounts;
}

/**
 * One FIXED row per UTC day of each month that overlaps the range
 * and is on/after the resource effective month. The monthly fee is split
 * across days in that month (last day absorbs remainder).
 */
export function fixedResourcesToCosts(
  resources: FixedVpsResource[],
  range: DateRange,
  monthAmountOverrides: ReadonlyMap<string, number> = new Map(),
): NormalizedCost[] {
  const months = utcMonthsOverlapping(range.from, range.to);
  const costs: NormalizedCost[] = [];
  for (const resource of resources) {
    const effectiveMonth = startOfUtcMonth(resource.effectiveOn);
    for (const monthStart of months) {
      if (monthStart.getTime() < effectiveMonth.getTime()) {
        continue;
      }
      const days = eachUtcDay(monthStart, endOfUtcMonth(monthStart));
      const monthlyAmountUsd =
        monthAmountOverrides.get(fixedMonthKey(resource.externalId, monthStart)) ??
        resource.monthlyAmountUsd;
      const amounts = splitMonthlyUsdAcrossDays(monthlyAmountUsd, utcDaysInMonth(monthStart));
      for (const [index, bucketDate] of days.entries()) {
        const costUsd = amounts[index];
        if (costUsd === undefined) {
          throw new Error('VPS daily split length mismatch');
        }
        costs.push({
          externalId: resource.externalId,
          bucketDate,
          costUsd,
          sourceType: 'FIXED',
          sourceStatus: 'final',
          isPartial: false,
        });
      }
    }
  }
  return costs;
}

export type PastFixedMonthRewrite = {
  skipKeys: Set<string>;
  lumpAmounts: Map<string, number>;
};

/**
 * Past months that already have booked FIXED rows. A single 1st-of-month
 * lump is convertible: skip it and split that booked amount across the month.
 */
export function classifyPastFixedMonths(
  rows: PastFixedCostRow[],
  now: Date,
): PastFixedMonthRewrite {
  const currentMonthMs = startOfUtcMonth(now).getTime();
  const groups = new Map<string, PastFixedCostRow[]>();
  for (const row of rows) {
    if (startOfUtcMonth(row.bucketDate).getTime() >= currentMonthMs) {
      continue;
    }
    const key = fixedMonthKey(row.externalId, row.bucketDate);
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  const skipKeys = new Set<string>();
  const lumpAmounts = new Map<string, number>();
  for (const [key, group] of groups) {
    const lump = convertibleLegacyLump(group);
    if (lump) {
      lumpAmounts.set(key, lump.costUsd);
      continue;
    }
    skipKeys.add(key);
  }
  return { skipKeys, lumpAmounts };
}

export function pastFixedMonthSkipKeys(rows: PastFixedCostRow[], now: Date): Set<string> {
  return classifyPastFixedMonths(rows, now).skipKeys;
}

function convertibleLegacyLump(group: PastFixedCostRow[]): PastFixedCostRow | null {
  if (group.length !== 1) {
    return null;
  }
  const row = group[0];
  if (!row || row.bucketDate.getUTCDate() !== 1) {
    return null;
  }
  return row;
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
