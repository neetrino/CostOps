import { describe, expect, it } from 'vitest';
import { parseRegisteredProviderKey } from '@/shared/registered-providers';

describe('parseRegisteredProviderKey', () => {
  it('accepts cron path casing', () => {
    expect(parseRegisteredProviderKey('neon')).toBe('NEON');
    expect(parseRegisteredProviderKey('Vercel')).toBe('VERCEL');
  });

  it('rejects unknown keys', () => {
    expect(parseRegisteredProviderKey('gcp')).toBeNull();
    expect(parseRegisteredProviderKey('')).toBeNull();
  });
});
