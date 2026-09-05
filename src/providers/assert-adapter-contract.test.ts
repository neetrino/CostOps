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
