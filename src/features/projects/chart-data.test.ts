import { describe, expect, it } from 'vitest';
import {
  buildCompareBarData,
  buildProviderStackData,
  toProviderChartRows,
} from '@/features/projects/chart-data';
import type { CostSeriesPoint } from '@/core/cost/build-series';

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

function seriesPoint(period: string, byProvider: CostSeriesPoint['byProvider']): CostSeriesPoint {
  return {
    period,
    total: {
      costUsd: null,
      sourceStatus: 'missing',
      sourceType: null,
      isPartial: false,
      lastSuccessfulSyncAt: null,
    },
    byProject: {},
    byProvider,
    unmapped: {
      costUsd: null,
      sourceStatus: 'missing',
      sourceType: null,
      isPartial: false,
      lastSuccessfulSyncAt: null,
    },
  };
}

describe('buildProviderStackData', () => {
  it('keeps mapped provider keys and leaves missing as null', () => {
    const data = buildProviderStackData(
      [
        seriesPoint('2026-09-01', {
          NEON: {
            costUsd: 2.81,
            sourceStatus: 'fresh',
            sourceType: 'ESTIMATED',
            isPartial: false,
            lastSuccessfulSyncAt: null,
          },
        }),
      ],
      ['NEON', 'VERCEL'],
    );
    expect(data[0]?.values.NEON).toBe(2.81);
    expect(data[0]?.values.VERCEL).toBeNull();
  });

  it('omits null provider values from chart rows so stacks are not fake $0', () => {
    const rows = toProviderChartRows(
      [
        {
          period: '2026-09-01',
          values: { NEON: 2.81, VERCEL: null },
        },
      ],
      ['NEON', 'VERCEL'],
    );
    expect(rows[0]?.NEON).toBe(2.81);
    expect(rows[0]).not.toHaveProperty('VERCEL');
  });
});
