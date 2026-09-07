import { describe, expect, it } from 'vitest';
import { eachUtcDay, utcDayKey } from '@/shared/dates';

describe('eachUtcDay', () => {
  it('returns inclusive UTC days', () => {
    const days = eachUtcDay(
      new Date('2026-09-01T12:00:00.000Z'),
      new Date('2026-09-03T01:00:00.000Z'),
    );
    expect(days.map(utcDayKey)).toEqual(['2026-09-01', '2026-09-02', '2026-09-03']);
  });

  it('returns empty when from is after to', () => {
    expect(
      eachUtcDay(new Date('2026-09-03T00:00:00.000Z'), new Date('2026-09-01T00:00:00.000Z')),
    ).toEqual([]);
  });
});
