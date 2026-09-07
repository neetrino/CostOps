import { describe, expect, it } from 'vitest';
import { planBackfillDays } from '@/core/sync/plan-backfill-days';
import { utcDayKey } from '@/shared/dates';

describe('planBackfillDays', () => {
  const now = new Date('2026-09-07T15:00:00.000Z');

  it('reconciles past days and keeps today intraday', () => {
    const planned = planBackfillDays(
      new Date('2026-09-05T00:00:00.000Z'),
      new Date('2026-09-07T00:00:00.000Z'),
      now,
    );
    expect(planned.map((row) => ({ day: utcDayKey(row.day), mode: row.mode }))).toEqual([
      { day: '2026-09-05', mode: 'reconcile' },
      { day: '2026-09-06', mode: 'reconcile' },
      { day: '2026-09-07', mode: 'intraday' },
    ]);
  });
});
