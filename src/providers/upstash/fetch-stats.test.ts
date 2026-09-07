import { beforeEach, describe, expect, it, vi } from 'vitest';
import { upstashGetJson } from '@/providers/upstash/client';
import { fetchUpstashResourceStats } from '@/providers/upstash/fetch-stats';
import type { UpstashResourceRef } from '@/providers/upstash/list-resources';

vi.mock('@/providers/upstash/client', () => ({
  upstashGetJson: vi.fn(),
}));

const redis: UpstashResourceRef = {
  externalId: 'db-1',
  displayName: 'Redis',
  resourceType: 'upstash_redis',
  product: 'redis',
  metadata: { product: 'redis' },
};

describe('fetchUpstashResourceStats', () => {
  beforeEach(() => {
    vi.mocked(upstashGetJson).mockReset();
  });

  it('requests the widest supported Redis daily billing window', async () => {
    vi.mocked(upstashGetJson).mockResolvedValue({
      dailybilling: [],
      dailyrequests: [],
      total_monthly_billing: 0.42,
    });

    await fetchUpstashResourceStats({ email: 'ops@example.com', apiKey: 'secret' }, [redis]);

    expect(upstashGetJson).toHaveBeenCalledOnce();
    const request = vi.mocked(upstashGetJson).mock.calls[0]?.[0];
    expect(request?.path).toBe('/redis/stats/db-1');
    expect(request?.searchParams?.get('period')).toBe('7d');
  });
});
