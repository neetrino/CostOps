import { describe, expect, it } from 'vitest';
import { aggregateForScope, filterRowsForScope } from '@/core/cost/aggregate';
import { aggregateCostRows, displayCostUsd } from '@/core/cost/freshness';
import type { CostRow } from '@/core/cost/types';

function row(partial: Partial<CostRow> & Pick<CostRow, 'costUsd'>): CostRow {
  return {
    sourceStatus: 'fresh',
    sourceType: 'ESTIMATED',
    isPartial: false,
    projectId: 'proj-1',
    projectProviderId: 'pp-1',
    providerKey: 'NEON',
    ...partial,
  };
}

describe('cost aggregation', () => {
  it('sums PROJECT_PROVIDER rows', () => {
    const rows = [
      row({ costUsd: 1.1 }),
      row({ costUsd: 0.4 }),
      row({ costUsd: 9, projectProviderId: 'other' }),
    ];
    const aggregate = aggregateForScope(rows, {
      scope: 'PROJECT_PROVIDER',
      projectProviderId: 'pp-1',
    });
    expect(aggregate.kind).toBe('value');
    expect(aggregate.costUsd).toBeCloseTo(1.5);
  });

  it('PROJECT_TOTAL uses mapped project rows only', () => {
    const rows = [
      row({ costUsd: 2, projectId: 'proj-1' }),
      row({ costUsd: 3, projectId: 'proj-2' }),
      row({ costUsd: 4, projectId: null, projectProviderId: null }),
    ];
    const aggregate = aggregateForScope(rows, { scope: 'PROJECT_TOTAL', projectId: 'proj-1' });
    expect(aggregate.costUsd).toBe(2);
    expect(filterRowsForScope(rows, { scope: 'PROJECT_TOTAL', projectId: 'proj-1' })).toHaveLength(
      1,
    );
  });

  it('excludes unmapped spend from PROJECT_TOTAL (stays on provider/global)', () => {
    const unmapped = row({
      costUsd: 9.99,
      projectId: null,
      projectProviderId: null,
      providerKey: 'VERCEL',
    });
    const mapped = row({ costUsd: 1.62, projectId: 'proj-1', providerKey: 'VERCEL' });
    const scoped = filterRowsForScope([mapped, unmapped], {
      scope: 'PROJECT_TOTAL',
      projectId: 'proj-1',
    });
    expect(scoped).toEqual([mapped]);
    expect(
      aggregateForScope([mapped, unmapped], { scope: 'PROVIDER_TOTAL', providerKey: 'VERCEL' })
        .costUsd,
    ).toBe(11.61);
  });

  it('PROVIDER_TOTAL includes unmapped spend', () => {
    const rows = [
      row({ costUsd: 1, providerKey: 'NEON', projectId: null }),
      row({ costUsd: 2, providerKey: 'NEON' }),
      row({ costUsd: 8, providerKey: 'VERCEL' }),
    ];
    expect(aggregateForScope(rows, { scope: 'PROVIDER_TOTAL', providerKey: 'NEON' }).costUsd).toBe(
      3,
    );
  });

  it('GLOBAL_TOTAL sums every usable row', () => {
    const rows = [row({ costUsd: 1 }), row({ costUsd: 2, providerKey: 'VERCEL', projectId: null })];
    expect(aggregateForScope(rows, { scope: 'GLOBAL_TOTAL' }).costUsd).toBe(3);
  });

  it('does not treat missing as $0', () => {
    const aggregate = aggregateCostRows([]);
    expect(aggregate.kind).toBe('missing');
    expect(aggregate.costUsd).toBeNull();
    expect(displayCostUsd(aggregate)).toBeNull();
  });

  it('does not treat error-only rows as $0', () => {
    const aggregate = aggregateCostRows([row({ costUsd: 0, sourceStatus: 'error' })]);
    expect(aggregate.kind).toBe('error');
    expect(aggregate.costUsd).toBeNull();
  });

  it('marks current-day partial aggregates', () => {
    const aggregate = aggregateCostRows([
      row({ costUsd: 1.08, sourceStatus: 'partial', isPartial: true }),
    ]);
    expect(aggregate.kind).toBe('value');
    expect(aggregate.isPartial).toBe(true);
    expect(aggregate.sourceStatus).toBe('partial');
  });
});
