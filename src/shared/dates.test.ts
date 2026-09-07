import { describe, expect, it } from 'vitest';
import { eachUtcDay, startOfUtcMonth, utcDayKey, utcMonthsOverlapping } from '@/shared/dates';

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

describe('utcMonthsOverlapping', () => {
  it('emits the first of the month for a mid-month day', () => {
    const months = utcMonthsOverlapping(
      new Date('2026-09-07T14:00:00.000Z'),
      new Date('2026-09-07T14:00:00.000Z'),
    );
    expect(months.map(utcDayKey)).toEqual(['2026-09-01']);
  });

  it('covers every month the range crosses', () => {
    const months = utcMonthsOverlapping(
      new Date('2026-09-15T00:00:00.000Z'),
      new Date('2026-10-02T00:00:00.000Z'),
    );
    expect(months.map(utcDayKey)).toEqual(['2026-09-01', '2026-10-01']);
  });

  it('normalizes effectiveOn to month start', () => {
    expect(utcDayKey(startOfUtcMonth(new Date('2026-09-15T08:00:00.000Z')))).toBe('2026-09-01');
  });
});
