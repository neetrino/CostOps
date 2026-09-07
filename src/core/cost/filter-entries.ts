import type { CostEntryRow } from '@/core/cost/types';
import { toUtcDateOnly, utcDayKey } from '@/shared/dates';
import type { DatePreset } from '@/shared/date-presets';

export function rowsOnUtcDay(rows: CostEntryRow[], day: Date): CostEntryRow[] {
  const key = utcDayKey(day);
  return rows.filter((row) => utcDayKey(row.bucketDate) === key);
}

export function rowsInRange(rows: CostEntryRow[], from: Date, to: Date): CostEntryRow[] {
  const start = toUtcDateOnly(from).getTime();
  const end = toUtcDateOnly(to).getTime();
  return rows.filter((row) => {
    const time = toUtcDateOnly(row.bucketDate).getTime();
    return time >= start && time <= end;
  });
}

/**
 * The current-month board mirrors each provider's active billing period. Vercel
 * cycles need not start on the first calendar day, so retain older rows for
 * history but leave them out of the current board once the active cycle is known.
 */
export function rowsInDashboardPeriod(
  rows: CostEntryRow[],
  from: Date,
  to: Date,
  preset: DatePreset,
): CostEntryRow[] {
  const ranged = rowsInRange(rows, from, to);
  if (preset !== 'current_month') {
    return ranged;
  }
  const vercelCycleStart = ranged.reduce<string | null>((latest, row) => {
    const start = row.providerKey === 'VERCEL' ? row.providerBillingCycleStart : null;
    if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(start)) {
      return latest;
    }
    return !latest || start > latest ? start : latest;
  }, null);
  if (!vercelCycleStart) {
    return ranged;
  }
  return ranged.filter(
    (row) => row.providerKey !== 'VERCEL' || utcDayKey(row.bucketDate) >= vercelCycleStart,
  );
}

export function rowsForProject(rows: CostEntryRow[], projectId: string): CostEntryRow[] {
  return rows.filter((row) => row.projectId === projectId);
}

export function rowsForProvider(rows: CostEntryRow[], providerKey: string): CostEntryRow[] {
  return rows.filter((row) => row.providerKey === providerKey);
}

export function rowsForProjectProvider(
  rows: CostEntryRow[],
  projectProviderId: string,
): CostEntryRow[] {
  return rows.filter((row) => row.projectProviderId === projectProviderId);
}

export function rowsForResource(rows: CostEntryRow[], resourceId: string): CostEntryRow[] {
  return rows.filter((row) => row.resourceId === resourceId);
}

export function unmappedRows(rows: CostEntryRow[]): CostEntryRow[] {
  return rows.filter((row) => row.projectId === null);
}
