import { describe, expect, it } from 'vitest';
import { compareProviderNavOrder, parseRegisteredProviderKey } from '@/shared/registered-providers';

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

describe('compareProviderNavOrder', () => {
  it('follows Neon → Vercel → Upstash → VPS', () => {
    const keys = ['HETZNER', 'UPSTASH', 'NEON', 'VERCEL'];
    expect([...keys].sort(compareProviderNavOrder)).toEqual([
      'NEON',
      'VERCEL',
      'UPSTASH',
      'HETZNER',
    ]);
  });
});
