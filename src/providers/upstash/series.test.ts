import { describe, expect, it } from 'vitest';
import { sumSeriesForUtcDay, upstashSeriesUtcDayKey } from '@/providers/upstash/series';

describe('Upstash billing series', () => {
  it('reads the UTC calendar day from an observed timestamp', () => {
    expect(upstashSeriesUtcDayKey('2026-09-07 09:50:16.123 +0000 UTC')).toBe('2026-09-07');
  });

  it('sums multiple points on the same UTC day', () => {
    const day = new Date(Date.UTC(2026, 8, 6));
    const total = sumSeriesForUtcDay(
      [
        { x: '2026-09-06 00:00:00 +0000 UTC', y: 0.02 },
        { x: '2026-09-06 12:00:00 +0000 UTC', y: 0.01 },
        { x: '2026-09-07 00:00:00 +0000 UTC', y: 9 },
      ],
      day,
    );
    expect(total).toBeCloseTo(0.03);
  });

  it('returns null when the day is outside the series window', () => {
    expect(
      sumSeriesForUtcDay(
        [{ x: '2026-09-07 09:50:16 +0000 UTC', y: 0 }],
        new Date('2026-09-01T00:00:00Z'),
      ),
    ).toBeNull();
  });
});
