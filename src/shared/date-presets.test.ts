import { describe, expect, it } from 'vitest';
import {
  rangeCurrentMonthUtc,
  rangeLastDays,
  rangePreviousMonthUtc,
  resolveDatePreset,
  utcToday,
} from '@/shared/date-presets';

describe('date presets (UTC, Neon port)', () => {
  const now = new Date('2026-09-05T16:30:00.000Z');

  it('utcToday is the UTC calendar day', () => {
    expect(utcToday(now)).toBe('2026-09-05');
  });

  it('rangeCurrentMonthUtc runs from the 1st through today', () => {
    expect(rangeCurrentMonthUtc(now)).toEqual({ from: '2026-09-01', to: '2026-09-05' });
  });

  it('rangePreviousMonthUtc covers the full previous month', () => {
    expect(rangePreviousMonthUtc(now)).toEqual({ from: '2026-08-01', to: '2026-08-31' });
  });

  it('rangePreviousMonthUtc wraps January to December', () => {
    expect(rangePreviousMonthUtc(new Date('2026-01-10T00:00:00.000Z'))).toEqual({
      from: '2025-12-01',
      to: '2025-12-31',
    });
  });

  it('rangeLastDays(1) is today only', () => {
    expect(rangeLastDays(1, now)).toEqual({ from: '2026-09-05', to: '2026-09-05' });
  });

  it('rangeLastDays(7) is inclusive of today', () => {
    expect(rangeLastDays(7, now)).toEqual({ from: '2026-08-30', to: '2026-09-05' });
  });

  it('resolveDatePreset maps named presets', () => {
    expect(resolveDatePreset('30', now)).toEqual({ from: '2026-08-07', to: '2026-09-05' });
    expect(resolveDatePreset('60', now).from).toBe('2026-07-08');
    expect(resolveDatePreset('current_month', now).from).toBe('2026-09-01');
  });
});
