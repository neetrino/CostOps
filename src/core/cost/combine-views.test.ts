import { describe, expect, it } from 'vitest';
import { combineProviderCostViews } from '@/core/cost/combine-views';
import type { CostView } from '@/core/cost/types';

function view(partial: Partial<CostView> & Pick<CostView, 'costUsd' | 'sourceStatus'>): CostView {
  return {
    sourceType: 'ESTIMATED',
    isPartial: false,
    lastSuccessfulSyncAt: '2026-09-06T12:00:00.000Z',
    ...partial,
  };
}

describe('combineProviderCostViews', () => {
  it('sums mapped providers (spec Degusto 2.81 + 1.62 + 0.31 + 1.08)', () => {
    const total = combineProviderCostViews([
      view({ costUsd: 2.81, sourceStatus: 'fresh' }),
      view({ costUsd: 1.62, sourceStatus: 'fresh' }),
      view({ costUsd: 0.31, sourceStatus: 'fresh' }),
      view({ costUsd: 1.08, sourceStatus: 'fresh' }),
    ]);
    expect(total.costUsd).toBeCloseTo(5.82);
    expect(total.sourceStatus).toBe('fresh');
    expect(total.isPartial).toBe(false);
  });

  it('does not fold unmapped spend into the total (caller omits it)', () => {
    const mappedOnly = combineProviderCostViews([view({ costUsd: 2.81, sourceStatus: 'final' })]);
    expect(mappedOnly.costUsd).toBe(2.81);
    expect(mappedOnly.sourceStatus).toBe('final');
  });

  it('marks the total partial when one mapped provider is missing', () => {
    const total = combineProviderCostViews([
      view({ costUsd: 2.81, sourceStatus: 'fresh' }),
      view({ costUsd: null, sourceStatus: 'missing', sourceType: null }),
    ]);
    expect(total.costUsd).toBe(2.81);
    expect(total.sourceStatus).toBe('partial');
    expect(total.isPartial).toBe(true);
  });

  it('does not emit $0 when every mapped provider is missing', () => {
    const total = combineProviderCostViews([
      view({ costUsd: null, sourceStatus: 'missing', sourceType: null }),
      view({ costUsd: null, sourceStatus: 'missing', sourceType: null }),
    ]);
    expect(total.costUsd).toBeNull();
    expect(total.sourceStatus).toBe('missing');
  });

  it('does not emit $0 when every mapped provider is error', () => {
    const total = combineProviderCostViews([
      view({ costUsd: null, sourceStatus: 'error', sourceType: null }),
    ]);
    expect(total.costUsd).toBeNull();
    expect(total.sourceStatus).toBe('error');
  });

  it('keeps a worse usable status when a gap is also present', () => {
    const total = combineProviderCostViews([
      view({ costUsd: 1, sourceStatus: 'stale' }),
      view({ costUsd: null, sourceStatus: 'missing', sourceType: null }),
    ]);
    expect(total.costUsd).toBe(1);
    expect(total.sourceStatus).toBe('stale');
    expect(total.isPartial).toBe(true);
  });

  it('returns missing when there are no mapped providers', () => {
    const total = combineProviderCostViews([]);
    expect(total.costUsd).toBeNull();
    expect(total.sourceStatus).toBe('missing');
  });
});
