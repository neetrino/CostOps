import { describe, expect, it } from 'vitest';
import {
  buildUtcMondayGrid,
  formatUtcDayLabel,
  formatUtcMonthTitle,
  shiftUtcDayKey,
  shiftUtcMonth,
  utcMonthFromDayKey,
} from '@/shared/ui/calendar-month';
import { utcDayKey } from '@/shared/dates';

describe('buildUtcMondayGrid', () => {
  it('starts Monday and pads September 2026 from 31 Aug', () => {
    const cells = buildUtcMondayGrid(new Date('2026-09-10T00:00:00.000Z'));
    expect(cells).toHaveLength(42);
    expect(cells[0]).toEqual({ dayKey: '2026-08-31', day: 31, inCurrentMonth: false });
    expect(cells[1]).toEqual({ dayKey: '2026-09-01', day: 1, inCurrentMonth: true });
    expect(cells[9]).toEqual({ dayKey: '2026-09-09', day: 9, inCurrentMonth: true });
    expect(cells[41].dayKey).toBe('2026-10-11');
  });

  it('keeps leap-day February 2024 inside the month', () => {
    const cells = buildUtcMondayGrid(new Date('2024-02-10T00:00:00.000Z'));
    const leap = cells.find((cell) => cell.dayKey === '2024-02-29');
    expect(leap).toEqual({ dayKey: '2024-02-29', day: 29, inCurrentMonth: true });
    expect(cells[0].dayKey).toBe('2024-01-29');
  });
});

describe('calendar month helpers', () => {
  it('formats the UTC day and month title', () => {
    expect(formatUtcDayLabel('2026-09-10')).toBe('10 Sep 2026');
    expect(formatUtcMonthTitle(new Date('2026-09-10T12:00:00.000Z'))).toEqual({
      month: 'September',
      year: '2026',
    });
  });

  it('shifts months and days in UTC', () => {
    expect(utcDayKey(shiftUtcMonth(utcMonthFromDayKey('2026-09-10'), 1))).toBe('2026-10-01');
    expect(shiftUtcDayKey('2026-09-10', -7)).toBe('2026-09-03');
  });
});
