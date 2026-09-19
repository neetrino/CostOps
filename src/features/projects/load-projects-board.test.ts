import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadDashboardCostContext } from '@/core/cost/load-dashboard-costs';
import { loadProjects } from '@/features/projects/load-projects';
import { loadProjectsBoard } from '@/features/projects/load-projects-board';
import { loadUsageSeries, loadUsageTotals } from '@/features/usage';
import { resolveDashboardQuery } from '@/shared/dashboard-query';

vi.mock('@/core/cost/load-dashboard-costs', () => ({
  loadDashboardCostContext: vi.fn(),
}));

vi.mock('@/features/projects/load-projects', () => ({
  loadProjects: vi.fn(),
}));

vi.mock('@/features/usage', () => ({
  loadUsageSeries: vi.fn(),
  loadUsageTotals: vi.fn(),
  requireCostSeries: (series: unknown) => series,
}));

const emptyCost = {
  today: new Date('2026-09-19T00:00:00.000Z'),
  entries: [],
  accounts: [],
  syncAtByAccountId: new Map(),
};

describe('loadProjectsBoard', () => {
  beforeEach(() => {
    vi.mocked(loadDashboardCostContext).mockResolvedValue(emptyCost);
    vi.mocked(loadProjects).mockResolvedValue({
      range: {
        from: '2026-09-01',
        to: '2026-09-19',
        preset: 'current_month',
        groupBy: 'day',
        calendarDays: 19,
      },
      projects: [],
    });
    vi.mocked(loadUsageTotals).mockResolvedValue({
      range: {
        from: '2026-09-01',
        to: '2026-09-19',
        preset: 'current_month',
        groupBy: 'day',
        calendarDays: 19,
      },
      total: {
        costUsd: null,
        sourceStatus: 'missing',
        sourceType: null,
        isPartial: false,
        lastSuccessfulSyncAt: null,
      },
      unmapped: {
        costUsd: null,
        sourceStatus: 'missing',
        sourceType: null,
        isPartial: false,
        lastSuccessfulSyncAt: null,
      },
      byProvider: [],
      byProject: [],
    });
    vi.mocked(loadUsageSeries).mockResolvedValue({
      metric: 'cost',
      displayUnit: 'usd',
      range: {
        from: '2026-09-01',
        to: '2026-09-19',
        preset: 'current_month',
        groupBy: 'day',
        calendarDays: 19,
      },
      points: [],
    });
  });

  it('loads cost entries once and reuses them for projects, totals, and series', async () => {
    const parsed = resolveDashboardQuery({}, new Date('2026-09-19T12:00:00.000Z'));
    if (!parsed.ok) {
      throw new Error(parsed.message);
    }
    await loadProjectsBoard(parsed.data);
    expect(loadDashboardCostContext).toHaveBeenCalledTimes(1);
    expect(loadProjects).toHaveBeenCalledWith(parsed.data, emptyCost);
    expect(loadUsageTotals).toHaveBeenCalledWith(parsed.data, emptyCost);
    expect(loadUsageSeries).toHaveBeenCalledWith(parsed.data, emptyCost);
  });
});
