import { describe, expect, it } from 'vitest';
import {
  filterFixedCostsForRewrite,
  fixedMonthKey,
  fixedResourcesToCosts,
} from '@/providers/hetzner/map-costs';

const server = {
  externalId: 'vps-nbos',
  monthlyAmountUsd: 14,
  effectiveOn: new Date('2026-09-01T00:00:00.000Z'),
};

describe('fixedResourcesToCosts', () => {
  it('emits one row on the first of the month for a mid-month sync day', () => {
    const costs = fixedResourcesToCosts([server], {
      from: new Date('2026-09-07T00:00:00.000Z'),
      to: new Date('2026-09-07T00:00:00.000Z'),
    });
    expect(costs).toHaveLength(1);
    expect(costs[0]?.bucketDate.toISOString().slice(0, 10)).toBe('2026-09-01');
    expect(costs[0]?.costUsd).toBe(14);
    expect(costs[0]?.sourceType).toBe('FIXED');
    expect(costs[0]?.sourceStatus).toBe('final');
  });

  it('does not multiply the monthly fee by days in range', () => {
    const costs = fixedResourcesToCosts([server], {
      from: new Date('2026-09-01T00:00:00.000Z'),
      to: new Date('2026-09-30T00:00:00.000Z'),
    });
    expect(costs).toHaveLength(1);
    expect(costs[0]?.costUsd).toBe(14);
  });

  it('emits one row per overlapping month after effectiveOn', () => {
    const costs = fixedResourcesToCosts([server], {
      from: new Date('2026-09-15T00:00:00.000Z'),
      to: new Date('2026-10-02T00:00:00.000Z'),
    });
    expect(costs.map((row) => row.bucketDate.toISOString().slice(0, 10))).toEqual([
      '2026-09-01',
      '2026-10-01',
    ]);
  });

  it('skips months before the effective month', () => {
    const costs = fixedResourcesToCosts(
      [{ ...server, effectiveOn: new Date('2026-10-01T00:00:00.000Z') }],
      {
        from: new Date('2026-09-01T00:00:00.000Z'),
        to: new Date('2026-10-15T00:00:00.000Z'),
      },
    );
    expect(costs.map((row) => row.bucketDate.toISOString().slice(0, 10))).toEqual(['2026-10-01']);
  });
});

describe('filterFixedCostsForRewrite', () => {
  it('rewrites the current month and leaves an existing past month', () => {
    const costs = fixedResourcesToCosts([server], {
      from: new Date('2026-08-01T00:00:00.000Z'),
      to: new Date('2026-09-07T00:00:00.000Z'),
    });
    const now = new Date('2026-09-07T12:00:00.000Z');
    const filtered = filterFixedCostsForRewrite(
      costs,
      new Set([fixedMonthKey('vps-nbos', new Date('2026-08-01T00:00:00.000Z'))]),
      now,
    );
    expect(filtered.map((row) => row.bucketDate.toISOString().slice(0, 10))).toEqual(['2026-09-01']);
  });
});
