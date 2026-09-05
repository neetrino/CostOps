import { describe, expect, it } from 'vitest';
import { buildCompareBarData } from '@/features/projects/chart-data';

describe('buildCompareBarData', () => {
  it('ranks projects by period cost descending', () => {
    const rows = buildCompareBarData([
      {
        projectId: 'a',
        name: 'Alpha',
        cost: {
          costUsd: 10,
          sourceStatus: 'final',
          sourceType: 'ESTIMATED',
          isPartial: false,
          lastSuccessfulSyncAt: null,
        },
      },
      {
        projectId: 'b',
        name: 'Beta',
        cost: {
          costUsd: 25,
          sourceStatus: 'final',
          sourceType: 'ESTIMATED',
          isPartial: false,
          lastSuccessfulSyncAt: null,
        },
      },
    ]);
    expect(rows[0]?.projectId).toBe('b');
    expect(rows[1]?.projectId).toBe('a');
  });

  it('skips null costs', () => {
    const rows = buildCompareBarData([
      {
        projectId: 'a',
        name: 'Alpha',
        cost: {
          costUsd: null,
          sourceStatus: 'missing',
          sourceType: null,
          isPartial: false,
          lastSuccessfulSyncAt: null,
        },
      },
    ]);
    expect(rows).toHaveLength(0);
  });
});
