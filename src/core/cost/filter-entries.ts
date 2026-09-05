import type { CostEntryRow } from '@/core/cost/types';
import { toUtcDateOnly, utcDayKey } from '@/shared/dates';

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
