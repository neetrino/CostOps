import { describe, expect, it } from 'vitest';
import { vpsMaterializeFrom } from '@/core/vps/materialize-from';

describe('vpsMaterializeFrom', () => {
  const now = new Date('2026-09-19T12:00:00.000Z');
  const purchaseStart = new Date('2026-09-01T00:00:00.000Z');

  it('rewrites from the chosen day when the amount changes', () => {
    const from = vpsMaterializeFrom({
      now,
      purchaseStart,
      amountFrom: new Date('2026-09-19T00:00:00.000Z'),
      amountChanged: true,
    });
    expect(from.toISOString().slice(0, 10)).toBe('2026-09-19');
  });

  it('does not walk back before the purchase start', () => {
    const from = vpsMaterializeFrom({
      now,
      purchaseStart: new Date('2026-09-10T00:00:00.000Z'),
      amountFrom: new Date('2026-09-01T00:00:00.000Z'),
      amountChanged: true,
    });
    expect(from.toISOString().slice(0, 10)).toBe('2026-09-10');
  });

  it('does not start after today', () => {
    const from = vpsMaterializeFrom({
      now,
      purchaseStart,
      amountFrom: new Date('2026-09-25T00:00:00.000Z'),
      amountChanged: true,
    });
    expect(from.toISOString().slice(0, 10)).toBe('2026-09-19');
  });

  it('uses the purchase start when the amount did not change', () => {
    const from = vpsMaterializeFrom({
      now,
      purchaseStart: new Date('2026-08-01T00:00:00.000Z'),
      amountFrom: new Date('2026-09-19T00:00:00.000Z'),
      amountChanged: false,
    });
    expect(from.toISOString().slice(0, 10)).toBe('2026-08-01');
  });
});
