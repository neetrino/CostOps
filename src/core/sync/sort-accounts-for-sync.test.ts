import { describe, expect, it } from 'vitest';
import { sortProviderAccountsForSync } from '@/core/sync/sort-accounts-for-sync';

describe('sortProviderAccountsForSync', () => {
  it('puts Neon and Upstash before Vercel', () => {
    const sorted = sortProviderAccountsForSync([
      { id: 'v', providerKey: 'VERCEL' },
      { id: 'n', providerKey: 'NEON' },
      { id: 'u', providerKey: 'UPSTASH' },
    ]);
    expect(sorted.map((account) => account.providerKey)).toEqual(['NEON', 'UPSTASH', 'VERCEL']);
  });
});
