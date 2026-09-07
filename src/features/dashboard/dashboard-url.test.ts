import { describe, expect, it } from 'vitest';
import {
  buildDashboardQueryString,
  mergeDashboardUrlState,
  readDashboardUrlState,
} from '@/features/dashboard/dashboard-url';

describe('dashboard URL helpers', () => {
  it('reads preset and groupBy from search params', () => {
    const params = new URLSearchParams('preset=7&groupBy=week');
    expect(readDashboardUrlState(params)).toEqual({ preset: '7', groupBy: 'week' });
  });

  it('builds query string omitting empty fields', () => {
    expect(buildDashboardQueryString({ preset: 'current_month', groupBy: 'day' })).toBe(
      '?preset=current_month&groupBy=day',
    );
  });

  it('merges partial updates', () => {
    expect(
      mergeDashboardUrlState({ preset: 'current_month', groupBy: 'day' }, { groupBy: 'week' }),
    ).toEqual({ preset: 'current_month', groupBy: 'week' });
  });
});
