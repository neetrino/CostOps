import { describe, expect, it } from 'vitest';
import { vpsMaterializeFrom } from '@/core/vps/materialize-from';

describe('vpsMaterializeFrom', () => {
  const now = new Date('2026-09-07T12:00:00.000Z');

  it('rewrites from the current month when the amount changes', () => {
    const from = vpsMaterializeFrom({
      now,
      effectiveOn: new Date('2026-08-01T00:00:00.000Z'),
      amountChanged: true,
    });
    expect(from.toISOString().slice(0, 10)).toBe('2026-09-01');
  });

  it('does not walk back before a mid-month start date', () => {
    const from = vpsMaterializeFrom({
      now,
      effectiveOn: new Date('2026-09-10T00:00:00.000Z'),
      amountChanged: true,
    });
    expect(from.toISOString().slice(0, 10)).toBe('2026-09-10');
  });

  it('does not walk back before effectiveOn', () => {
    const from = vpsMaterializeFrom({
      now,
      effectiveOn: new Date('2026-10-01T00:00:00.000Z'),
      amountChanged: true,
    });
    expect(from.toISOString().slice(0, 10)).toBe('2026-10-01');
  });

  it('backfills from effectiveOn when the amount did not change', () => {
    const from = vpsMaterializeFrom({
      now,
      effectiveOn: new Date('2026-08-01T00:00:00.000Z'),
      amountChanged: false,
    });
    expect(from.toISOString().slice(0, 10)).toBe('2026-08-01');
  });
});
