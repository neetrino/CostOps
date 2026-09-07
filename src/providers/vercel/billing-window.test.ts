import { describe, expect, it } from 'vitest';
import { vercelBillingWindowUtc } from '@/providers/vercel/billing-window';

describe('vercelBillingWindowUtc', () => {
  it('uses PDT midnight (07:00Z) in September', () => {
    const window = vercelBillingWindowUtc(new Date('2026-09-06T00:00:00.000Z'));
    expect(window.from.toISOString()).toBe('2026-09-06T07:00:00.000Z');
    expect(window.to.toISOString()).toBe('2026-09-07T07:00:00.000Z');
  });

  it('uses PST midnight (08:00Z) in January', () => {
    const window = vercelBillingWindowUtc(new Date('2026-01-15T00:00:00.000Z'));
    expect(window.from.toISOString()).toBe('2026-01-15T08:00:00.000Z');
    expect(window.to.toISOString()).toBe('2026-01-16T08:00:00.000Z');
  });
});
