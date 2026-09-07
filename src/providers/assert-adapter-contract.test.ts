import { describe, expect, it } from 'vitest';
import { assertAdapterContract } from '@/providers/assert-adapter-contract';
import { neonAdapter } from '@/providers/neon/adapter';
import { getAdapter } from '@/providers/registry';
import type { CostProviderAdapter } from '@/providers/types';

describe('adapter contract', () => {
  it('registers Neon with a create-token URL', () => {
    const adapter = getAdapter('NEON');
    expect(adapter.providerKey).toBe('NEON');
    expect(adapter.credentials.credentialCreateUrl).toMatch(/^https:\/\//);
    expect(adapter.credentials.supportsExpiryDate).toBe(false);
    expect(() => assertAdapterContract(adapter)).not.toThrow();
  });

  it('registers Vercel with rotate metadata and no stored expiry date', () => {
    const adapter = getAdapter('VERCEL');
    expect(adapter.providerKey).toBe('VERCEL');
    expect(adapter.supportsIntraday).toBe(false);
    expect(adapter.supportsBackfill).toBe(true);
    expect(adapter.credentials.credentialCreateUrl).toBe('https://vercel.com/account/tokens');
    expect(adapter.credentials.envVarNames).toEqual(['VERCEL_API_TOKEN', 'VERCEL_TEAM_ID']);
    expect(adapter.credentials.supportsExpiryDate).toBe(false);
    expect(() => assertAdapterContract(adapter)).not.toThrow();
  });

  it('registers Upstash with Management API rotate metadata', () => {
    const adapter = getAdapter('UPSTASH');
    expect(adapter.providerKey).toBe('UPSTASH');
    expect(adapter.supportsIntraday).toBe(true);
    expect(adapter.supportsBackfill).toBe(true);
    expect(adapter.credentials.credentialCreateUrl).toBe('https://console.upstash.com/account/api');
    expect(adapter.credentials.envVarNames).toEqual(['UPSTASH_EMAIL', 'UPSTASH_API_KEY']);
    expect(adapter.credentials.supportsExpiryDate).toBe(false);
    expect(() => assertAdapterContract(adapter)).not.toThrow();
  });

  it('fails when credentialCreateUrl is missing', () => {
    const broken: CostProviderAdapter = {
      ...neonAdapter,
      credentials: {
        ...neonAdapter.credentials,
        credentialCreateUrl: '',
      },
    };
    expect(() => assertAdapterContract(broken)).toThrow(/credentialCreateUrl/);
  });
});
