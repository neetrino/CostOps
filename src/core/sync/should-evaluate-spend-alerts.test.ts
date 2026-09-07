import { describe, expect, it } from 'vitest';
import { shouldEvaluateSpendAlerts } from '@/core/sync/should-evaluate-spend-alerts';

describe('shouldEvaluateSpendAlerts', () => {
  const now = new Date('2026-09-07T15:00:00.000Z');

  it('allows today and yesterday', () => {
    expect(shouldEvaluateSpendAlerts(new Date('2026-09-07T00:00:00.000Z'), now)).toBe(true);
    expect(shouldEvaluateSpendAlerts(new Date('2026-09-06T00:00:00.000Z'), now)).toBe(true);
  });

  it('skips older backfill days', () => {
    expect(shouldEvaluateSpendAlerts(new Date('2026-09-01T00:00:00.000Z'), now)).toBe(false);
  });
});
