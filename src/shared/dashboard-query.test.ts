import { describe, expect, it } from 'vitest';
import { MAX_DASHBOARD_RANGE_DAYS } from '@/config/constants';
import { addUtcDays, parseIsoDateOnly } from '@/shared/dates';
import { utcDayKey } from '@/shared/dates';
import { resolveDashboardQuery } from '@/shared/dashboard-query';

describe('dashboard query range validation', () => {
  const now = new Date('2026-09-05T12:00:00.000Z');

  it('defaults to current_month', () => {
    const result = resolveDashboardQuery({}, now);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.preset).toBe('current_month');
      expect(result.data.fromKey).toBe('2026-09-01');
      expect(result.data.toKey).toBe('2026-09-05');
      expect(result.data.groupBy).toBe('day');
    }
  });

  it('rejects from > to', () => {
    const result = resolveDashboardQuery(
      { preset: 'custom', from: '2026-09-05', to: '2026-09-01' },
      now,
    );
    expect(result).toEqual({ ok: false, message: 'from must be <= to' });
  });

  it('rejects ranges longer than 400 days', () => {
    const from = parseIsoDateOnly('2025-01-01');
    const to = addUtcDays(from, MAX_DASHBOARD_RANGE_DAYS);
    const result = resolveDashboardQuery(
      { preset: 'custom', from: utcDayKey(from), to: utcDayKey(to) },
      now,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('400');
    }
  });

  it('accepts a 400-day inclusive range', () => {
    const from = parseIsoDateOnly('2025-01-01');
    const to = addUtcDays(from, MAX_DASHBOARD_RANGE_DAYS - 1);
    const result = resolveDashboardQuery(
      { preset: 'custom', from: utcDayKey(from), to: utcDayKey(to) },
      now,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.calendarDays).toBe(MAX_DASHBOARD_RANGE_DAYS);
    }
  });

  it('rejects an invalid calendar date', () => {
    const result = resolveDashboardQuery(
      { preset: 'custom', from: '2026-02-31', to: '2026-03-01' },
      now,
    );
    expect(result.ok).toBe(false);
  });

  it('requires from and to for custom', () => {
    const result = resolveDashboardQuery({ preset: 'custom' }, now);
    expect(result).toEqual({ ok: false, message: 'custom range requires from and to' });
  });

  it('treats from+to without preset as custom', () => {
    const result = resolveDashboardQuery({ from: '2026-08-01', to: '2026-08-07' }, now);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.preset).toBe('custom');
      expect(result.data.calendarDays).toBe(7);
    }
  });

  it('normalizes providerKey case', () => {
    const result = resolveDashboardQuery({ providerKey: 'neon' }, now);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.providerKey).toBe('NEON');
    }
  });
});
