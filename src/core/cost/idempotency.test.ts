import { describe, expect, it } from 'vitest';
import { costIdempotencyKey } from '@/core/cost/idempotency';
import { metricIdempotencyKey } from '@/core/metrics/idempotency';

describe('idempotency keys', () => {
  it('builds deterministic cost and metric keys', () => {
    const day = new Date('2026-09-05T15:00:00.000Z');
    expect(
      costIdempotencyKey({
        providerKey: 'NEON',
        providerAccountId: 'acc',
        externalId: 'proj',
        bucketDate: day,
      }),
    ).toBe('cost:NEON:acc:proj:2026-09-05:_');
    expect(
      metricIdempotencyKey({
        providerKey: 'NEON',
        providerAccountId: 'acc',
        externalId: 'proj',
        bucketDate: day,
        metricKey: 'compute_unit_seconds',
      }),
    ).toBe('metric:NEON:acc:proj:2026-09-05:compute_unit_seconds');
  });
});
