import { config } from 'dotenv';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fetchUpstashResourceStats } from '@/providers/upstash/fetch-stats';
import { listAllUpstashResources } from '@/providers/upstash/list-resources';

config({ path: resolve(process.cwd(), '.env') });

const email = process.env.UPSTASH_EMAIL?.trim();
const apiKey = process.env.UPSTASH_API_KEY?.trim();
const live = Boolean(email && apiKey);

describe.skipIf(!live)('Upstash live probe (optional)', () => {
  it('lists Redis databases and reads one stats window', async () => {
    if (!email || !apiKey) {
      return;
    }
    const credentials = { email, apiKey };
    const resources = await listAllUpstashResources(credentials);
    const redis = resources.filter((row) => row.product === 'redis');
    expect(redis.length).toBeGreaterThan(0);
    expect(redis[0]?.externalId.length).toBeGreaterThan(8);

    const sample = redis.slice(0, 1);
    const stats = await fetchUpstashResourceStats(credentials, sample);
    expect(stats).toHaveLength(1);
    expect(Array.isArray(stats[0]?.billing)).toBe(true);
  }, 20_000);
});
