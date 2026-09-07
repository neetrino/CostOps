import { describe, expect, it } from 'vitest';
import {
  buildCompareBarData,
  buildProviderStackData,
  buildUsageSeriesModel,
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

  it('keeps every ranked project when no limit is passed', () => {
    const rows = buildCompareBarData(
      Array.from({ length: 15 }, (_, index) => ({
        projectId: `p${index}`,
        name: `Project ${index}`,
        cost: {
          costUsd: index + 1,
          sourceStatus: 'final' as const,
          sourceType: 'ESTIMATED' as const,
          isPartial: false,
          lastSuccessfulSyncAt: null,
        },
      })),
    );
    expect(rows).toHaveLength(15);
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

function emptyCost(): CostSeriesPoint['total'] {
  return {
    costUsd: null,
    sourceStatus: 'missing',
    sourceType: null,
    isPartial: false,
    lastSuccessfulSyncAt: null,
  };
}

function seriesPoint(
  period: string,
  byProvider: CostSeriesPoint['byProvider'],
  byProject: CostSeriesPoint['byProject'] = {},
): CostSeriesPoint {
  return {
    period,
    total: emptyCost(),
    byProject,
    byProvider,
    unmapped: emptyCost(),
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

describe('buildUsageSeriesModel', () => {
  it('ranks series by summed cost and omits missing days', () => {
    const cost = (usd: number | null): CostSeriesPoint['total'] => ({
      costUsd: usd,
      sourceStatus: usd === null ? 'missing' : 'final',
      sourceType: usd === null ? null : 'ESTIMATED',
      isPartial: false,
      lastSuccessfulSyncAt: null,
    });
    const model = buildUsageSeriesModel(
      [
        seriesPoint('2026-09-01', {}, { a: cost(10), b: cost(null) }),
        seriesPoint('2026-09-02', {}, { a: cost(5), b: cost(20) }),
      ],
      { a: 'Alpha', b: 'Beta' },
    );
    expect(model.series.map((row) => row.projectId)).toEqual(['b', 'a']);
    expect(model.chartRows[0]).not.toHaveProperty('b');
    expect(model.chartRows[0]?.a).toBe(10);
  });

  it('respects a visible-id filter', () => {
    const cost = (usd: number): CostSeriesPoint['total'] => ({
      costUsd: usd,
      sourceStatus: 'final',
      sourceType: 'ESTIMATED',
      isPartial: false,
      lastSuccessfulSyncAt: null,
    });
    const model = buildUsageSeriesModel(
      [seriesPoint('2026-09-01', {}, { a: cost(10), b: cost(20) })],
      { a: 'Alpha', b: 'Beta' },
      new Set(['a']),
    );
    expect(model.series).toHaveLength(1);
    expect(model.series[0]?.projectId).toBe('a');
  });
});
