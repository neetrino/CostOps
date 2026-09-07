import { describe, expect, it } from 'vitest';
import { UPSTASH_REDIS_RESOURCE_TYPE } from '@/config/constants';
import { upstashStatsToCosts, upstashStatsToMetrics } from '@/providers/upstash/map-costs';
import type { UpstashResourceRef } from '@/providers/upstash/list-resources';
import type { UpstashResourceStats } from '@/providers/upstash/fetch-stats';

const redis: UpstashResourceRef = {
  externalId: 'db-1',
  displayName: 'Ommm.am',
  resourceType: UPSTASH_REDIS_RESOURCE_TYPE,
  product: 'redis',
  metadata: { product: 'redis' },
};

const stats: UpstashResourceStats = {
  externalId: 'db-1',
  product: 'redis',
  billing: [
    { x: '2026-09-06 09:50:16 +0000 UTC', y: 0.02 },
    { x: '2026-09-07 09:50:16 +0000 UTC', y: 0.018 },
  ],
  requests: [{ x: '2026-09-06 09:50:16 +0000 UTC', y: 145 }],
  monthlyBillingUsd: 0.171,
};

describe('upstashStatsToCosts', () => {
  it('writes API cost when the UTC day is in dailybilling', () => {
    const rows = upstashStatsToCosts({
      resources: [redis],
      stats: [stats],
      bucketDate: new Date('2026-09-06T00:00:00Z'),
      isPartial: false,
    });
    expect(rows[0]?.costUsd).toBeCloseTo(0.02);
    expect(rows[0]?.sourceStatus).toBe('fresh');
    expect(rows[0]?.sourceType).toBe('API');
  });

  it('marks current-day cost partial', () => {
    const rows = upstashStatsToCosts({
      resources: [redis],
      stats: [stats],
      bucketDate: new Date('2026-09-07T00:00:00Z'),
      isPartial: true,
    });
    expect(rows[0]?.sourceStatus).toBe('partial');
    expect(rows[0]?.isPartial).toBe(true);
  });

  it('does not invent $0 when the day is outside the Redis window', () => {
    const rows = upstashStatsToCosts({
      resources: [redis],
      stats: [stats],
      bucketDate: new Date('2026-09-01T00:00:00Z'),
      isPartial: false,
    });
    expect(rows[0]?.sourceStatus).toBe('missing');
    expect(rows[0]?.costUsd).toBe(0);
  });
});

describe('upstashStatsToMetrics', () => {
  it('emits request counts only for days present in the series', () => {
    const present = upstashStatsToMetrics({
      stats: [stats],
      bucketDate: new Date('2026-09-06T00:00:00Z'),
    });
    expect(present).toHaveLength(1);
    expect(present[0]?.valueNumeric).toBe(145);
    expect(
      upstashStatsToMetrics({
        stats: [stats],
        bucketDate: new Date('2026-09-01T00:00:00Z'),
      }),
    ).toHaveLength(0);
  });
});
