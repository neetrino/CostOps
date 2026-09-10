import { describe, expect, it } from 'vitest';
import {
  filterFixedCostsForRewrite,
  fixedMonthKey,
  fixedResourcesToCosts,
  pastFixedMonthSkipKeys,
  splitMonthlyUsdAcrossDays,
} from '@/providers/hetzner/map-costs';

const server = {
  externalId: 'vps-nbos',
  monthlyAmountUsd: 14,
  effectiveOn: new Date('2026-09-01T00:00:00.000Z'),
};

function sumUsd(costs: { costUsd: number }[]): number {
  return Number(costs.reduce((total, row) => total + row.costUsd, 0).toFixed(6));
}

describe('splitMonthlyUsdAcrossDays', () => {
  it('spreads $10 across 30 days so the month still sums to $10', () => {
    const amounts = splitMonthlyUsdAcrossDays(10, 30);
    expect(amounts).toHaveLength(30);
    expect(amounts[0]).toBe(0.333333);
    expect(amounts[28]).toBe(0.333333);
    expect(amounts[29]).toBe(0.333343);
    expect(Number(amounts.reduce((total, value) => total + value, 0).toFixed(6))).toBe(10);
  });
});

describe('fixedResourcesToCosts', () => {
  it('emits one row per UTC day of the month for a mid-month sync day', () => {
    const costs = fixedResourcesToCosts([server], {
      from: new Date('2026-09-07T00:00:00.000Z'),
      to: new Date('2026-09-07T00:00:00.000Z'),
    });
    expect(costs).toHaveLength(30);
    expect(costs[0]?.bucketDate.toISOString().slice(0, 10)).toBe('2026-09-01');
    expect(costs[29]?.bucketDate.toISOString().slice(0, 10)).toBe('2026-09-30');
    expect(sumUsd(costs)).toBe(14);
    expect(costs[0]?.sourceType).toBe('FIXED');
    expect(costs[0]?.sourceStatus).toBe('final');
  });

  it('does not multiply the monthly fee by days in range', () => {
    const costs = fixedResourcesToCosts([server], {
      from: new Date('2026-09-01T00:00:00.000Z'),
      to: new Date('2026-09-30T00:00:00.000Z'),
    });
    expect(costs).toHaveLength(30);
    expect(sumUsd(costs)).toBe(14);
  });

  it('emits every day of each overlapping month after effectiveOn', () => {
    const costs = fixedResourcesToCosts([server], {
      from: new Date('2026-09-15T00:00:00.000Z'),
      to: new Date('2026-10-02T00:00:00.000Z'),
    });
    expect(costs).toHaveLength(61);
    expect(costs[0]?.bucketDate.toISOString().slice(0, 10)).toBe('2026-09-01');
    expect(costs[30]?.bucketDate.toISOString().slice(0, 10)).toBe('2026-10-01');
    expect(sumUsd(costs.slice(0, 30))).toBe(14);
    expect(sumUsd(costs.slice(30))).toBe(14);
  });

  it('starts on the effective day and prorates the first month', () => {
    const costs = fixedResourcesToCosts(
      [{ ...server, monthlyAmountUsd: 10, effectiveOn: new Date('2026-09-10T00:00:00.000Z') }],
      {
        from: new Date('2026-09-01T00:00:00.000Z'),
        to: new Date('2026-10-02T00:00:00.000Z'),
      },
    );
    expect(costs[0]?.bucketDate.toISOString().slice(0, 10)).toBe('2026-09-10');
    expect(costs.filter((row) => row.bucketDate.getUTCMonth() === 8)).toHaveLength(21);
    expect(sumUsd(costs.filter((row) => row.bucketDate.getUTCMonth() === 8))).toBe(7.000003);
    expect(costs.filter((row) => row.bucketDate.getUTCMonth() === 9)).toHaveLength(31);
    expect(sumUsd(costs.filter((row) => row.bucketDate.getUTCMonth() === 9))).toBe(10);
  });

  it('skips months before the effective month', () => {
    const costs = fixedResourcesToCosts(
      [{ ...server, effectiveOn: new Date('2026-10-01T00:00:00.000Z') }],
      {
        from: new Date('2026-09-01T00:00:00.000Z'),
        to: new Date('2026-10-15T00:00:00.000Z'),
      },
    );
    expect(costs[0]?.bucketDate.toISOString().slice(0, 10)).toBe('2026-10-01');
    expect(costs).toHaveLength(31);
    expect(sumUsd(costs)).toBe(14);
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
    expect(filtered).toHaveLength(30);
    expect(filtered[0]?.bucketDate.toISOString().slice(0, 10)).toBe('2026-09-01');
    expect(filtered[29]?.bucketDate.toISOString().slice(0, 10)).toBe('2026-09-30');
  });
});

describe('pastFixedMonthSkipKeys', () => {
  const now = new Date('2026-09-07T12:00:00.000Z');

  it('converts a 1st-of-month lump even when the current fee differs', () => {
    const skip = pastFixedMonthSkipKeys(
      [
        {
          externalId: 'vps-nbos',
          bucketDate: new Date('2026-08-01T00:00:00.000Z'),
          costUsd: 6.5,
        },
      ],
      now,
    );
    expect(skip.size).toBe(0);
  });

  it('keeps a past month that is already spread across days', () => {
    const skip = pastFixedMonthSkipKeys(
      [
        {
          externalId: 'vps-nbos',
          bucketDate: new Date('2026-08-01T00:00:00.000Z'),
          costUsd: 0.451613,
        },
        {
          externalId: 'vps-nbos',
          bucketDate: new Date('2026-08-02T00:00:00.000Z'),
          costUsd: 0.451613,
        },
      ],
      now,
    );
    expect([...skip]).toEqual(['vps-nbos:2026-08']);
  });
});

describe('fixedResourcesToCosts month overrides', () => {
  it('splits a booked past lump instead of the current monthly fee', () => {
    const costs = fixedResourcesToCosts(
      [{ ...server, monthlyAmountUsd: 7, effectiveOn: new Date('2026-08-01T00:00:00.000Z') }],
      {
        from: new Date('2026-08-01T00:00:00.000Z'),
        to: new Date('2026-08-31T00:00:00.000Z'),
      },
      new Map([[fixedMonthKey('vps-nbos', new Date('2026-08-01T00:00:00.000Z')), 6.5]]),
    );
    expect(costs).toHaveLength(31);
    expect(sumUsd(costs)).toBe(6.5);
  });
});
