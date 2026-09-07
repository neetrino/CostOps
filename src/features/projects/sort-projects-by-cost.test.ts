import { describe, expect, it } from 'vitest';
import { sortByPeriodCostDesc } from '@/features/projects/sort-projects-by-cost';
import type { CostView } from '@/core/cost/types';

function period(costUsd: number | null): CostView {
  return {
    costUsd,
    sourceStatus: costUsd === null ? 'missing' : 'final',
    sourceType: costUsd === null ? null : 'ESTIMATED',
    isPartial: false,
    lastSuccessfulSyncAt: null,
  };
}

describe('sortByPeriodCostDesc', () => {
  it('ranks higher period cost first', () => {
    const rows = sortByPeriodCostDesc([
      { name: 'Cheap', period: period(0.07) },
      { name: 'Dear', period: period(7.79) },
      { name: 'Mid', period: period(1.2) },
    ]);
    expect(rows.map((row) => row.name)).toEqual(['Dear', 'Mid', 'Cheap']);
  });

  it('puts missing cost after real spend, not as $0', () => {
    const rows = sortByPeriodCostDesc([
      { name: 'Zero', period: period(0) },
      { name: 'Missing', period: period(null) },
      { name: 'Spend', period: period(2) },
    ]);
    expect(rows.map((row) => row.name)).toEqual(['Spend', 'Zero', 'Missing']);
  });

  it('breaks ties by name', () => {
    const rows = sortByPeriodCostDesc([
      { name: 'Beta', period: period(5) },
      { name: 'Alpha', period: period(5) },
    ]);
    expect(rows.map((row) => row.name)).toEqual(['Alpha', 'Beta']);
  });
});
