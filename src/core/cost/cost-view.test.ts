import { describe, expect, it } from 'vitest';
import { buildCostSeries } from '@/core/cost/build-series';
import { toCostView, viewFromRows } from '@/core/cost/cost-view';
import { aggregateCostRows } from '@/core/cost/freshness';
import type { CostEntryRow } from '@/core/cost/types';
import { parseIsoDateOnly } from '@/shared/dates';

function entry(partial: Partial<CostEntryRow> & Pick<CostEntryRow, 'costUsd'>): CostEntryRow {
  return {
    sourceStatus: 'fresh',
    sourceType: 'ESTIMATED',
    isPartial: false,
    projectId: 'proj-1',
    projectProviderId: 'pp-1',
    providerKey: 'NEON',
    bucketDate: parseIsoDateOnly('2026-09-05'),
    resourceId: 'res-1',
    providerAccountId: 'acc-1',
    ...partial,
  };
}

describe('CostView freshness', () => {
  it('does not emit 0 when the aggregate is missing', () => {
    const aggregate = aggregateCostRows([]);
    const view = toCostView(aggregate, null);
    expect(view.sourceStatus).toBe('missing');
    expect(view.costUsd).toBeNull();
    expect(view.costUsd).not.toBe(0);
    expect(view.sourceType).toBeNull();
  });

  it('does not emit 0 when rows are error-only', () => {
    const view = viewFromRows(
      [entry({ costUsd: 0, sourceStatus: 'error' })],
      new Date('2026-09-05T14:00:00.000Z'),
    );
    expect(view.sourceStatus).toBe('error');
    expect(view.costUsd).toBeNull();
  });

  it('fills missing series days as missing, not $0', () => {
    const points = buildCostSeries({
      from: parseIsoDateOnly('2026-09-01'),
      to: parseIsoDateOnly('2026-09-03'),
      groupBy: 'day',
      rows: [entry({ costUsd: 1.25, bucketDate: parseIsoDateOnly('2026-09-01') })],
      syncAtByAccountId: new Map([['acc-1', new Date('2026-09-01T12:00:00.000Z')]]),
      fallbackSyncAt: null,
    });
    expect(points).toHaveLength(3);
    expect(points[0]?.total.costUsd).toBeCloseTo(1.25);
    expect(points[0]?.total.sourceStatus).toBe('fresh');
    expect(points[1]?.total.sourceStatus).toBe('missing');
    expect(points[1]?.total.costUsd).toBeNull();
    expect(points[2]?.total.sourceStatus).toBe('missing');
    expect(points[2]?.total.costUsd).toBeNull();
  });
});
