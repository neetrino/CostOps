import { describe, expect, it } from 'vitest';
import { dashboardReadCacheKey } from '@/shared/dashboard-read-cache';
import { resolveDashboardQuery } from '@/shared/dashboard-query';

describe('dashboardReadCacheKey', () => {
  it('includes the resolved range and filters', () => {
    const parsed = resolveDashboardQuery(
      { preset: '7', groupBy: 'week', projectId: 'p1', providerKey: 'NEON' },
      new Date('2026-09-19T12:00:00.000Z'),
    );
    if (!parsed.ok) {
      throw new Error(parsed.message);
    }
    expect(dashboardReadCacheKey(parsed.data)).toBe('2026-09-13|2026-09-19|7|week|p1|NEON|cost');
  });

  it('uses empty slots when filters are absent', () => {
    const parsed = resolveDashboardQuery({}, new Date('2026-09-19T12:00:00.000Z'));
    if (!parsed.ok) {
      throw new Error(parsed.message);
    }
    expect(dashboardReadCacheKey(parsed.data)).toBe(
      '2026-09-01|2026-09-19|current_month|day|||cost',
    );
  });
});
