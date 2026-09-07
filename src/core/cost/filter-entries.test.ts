import { describe, expect, it } from 'vitest';
import { rowsInDashboardPeriod } from '@/core/cost/filter-entries';
import type { CostEntryRow } from '@/core/cost/types';

function row(
  providerKey: string,
  day: string,
  providerBillingCycleStart: string | null = null,
): CostEntryRow {
  return {
    costUsd: 1,
    sourceStatus: 'fresh',
    sourceType: 'API',
    isPartial: false,
    projectId: null,
    projectProviderId: null,
    providerKey,
    providerAccountId: `${providerKey}-account`,
    resourceId: null,
    bucketDate: new Date(`${day}T00:00:00.000Z`),
    providerBillingCycleStart,
  };
}

describe('rowsInDashboardPeriod', () => {
  const from = new Date('2026-09-01T00:00:00.000Z');
  const to = new Date('2026-09-07T00:00:00.000Z');
  const rows = [
    row('NEON', '2026-09-01'),
    row('VERCEL', '2026-09-01', '2026-09-03'),
    row('VERCEL', '2026-09-02', '2026-09-03'),
    row('VERCEL', '2026-09-03', '2026-09-03'),
    row('VERCEL', '2026-09-07', '2026-09-03'),
  ];

  it('uses the active Vercel billing cycle on the current-month board', () => {
    const result = rowsInDashboardPeriod(rows, from, to, 'current_month');
    expect(
      result.map((item) => `${item.providerKey}:${item.bucketDate.toISOString().slice(0, 10)}`),
    ).toEqual(['NEON:2026-09-01', 'VERCEL:2026-09-03', 'VERCEL:2026-09-07']);
  });

  it('preserves calendar history for explicit custom ranges', () => {
    expect(rowsInDashboardPeriod(rows, from, to, 'custom')).toHaveLength(5);
  });
});
