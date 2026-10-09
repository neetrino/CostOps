import { describe, expect, it } from 'vitest';
import { HETZNER_FIXED_SYNC_INTERVAL_MINUTES } from '@/config/constants';
import { isAccountDue } from '@/core/sync/due-accounts';

describe('isAccountDue', () => {
  const now = new Date('2026-09-05T12:00:00.000Z');

  it('is due when never synced', () => {
    expect(
      isAccountDue(
        { providerKey: 'NEON', lastSuccessfulSyncAt: null, recommendedSyncIntervalMinutes: 60 },
        now,
      ),
    ).toBe(true);
  });

  it('respects the adapter interval', () => {
    expect(
      isAccountDue(
        {
          providerKey: 'NEON',
          lastSuccessfulSyncAt: new Date('2026-09-05T11:30:00.000Z'),
          recommendedSyncIntervalMinutes: 60,
        },
        now,
      ),
    ).toBe(false);
    expect(
      isAccountDue(
        {
          providerKey: 'NEON',
          lastSuccessfulSyncAt: new Date('2026-09-05T10:59:00.000Z'),
          recommendedSyncIntervalMinutes: 60,
        },
        now,
      ),
    ).toBe(true);
  });

  it('is due for the next VPS cron after a run that finished past 00:30 UTC', () => {
    expect(
      isAccountDue(
        {
          providerKey: 'HETZNER',
          lastSuccessfulSyncAt: new Date('2026-10-01T00:32:00.000Z'),
          recommendedSyncIntervalMinutes: HETZNER_FIXED_SYNC_INTERVAL_MINUTES,
        },
        new Date('2026-10-02T00:30:00.000Z'),
      ),
    ).toBe(true);
  });
});
