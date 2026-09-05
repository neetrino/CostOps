import { describe, expect, it } from 'vitest';
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
});
