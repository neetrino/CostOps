import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runAccountSync } from '@/core/sync/run-account-sync';
import { runAccountSyncBatch } from '@/core/sync/run-sync-batch';

vi.mock('@/core/sync/run-account-sync', () => ({
  runAccountSync: vi.fn(),
}));

const day = new Date('2026-09-07T00:00:00.000Z');

function okResult(accountId: string) {
  return {
    ok: true,
    syncRunId: `run-${accountId}`,
    providerAccountId: accountId,
    rowsRead: 1,
    rowsWritten: 1,
  };
}

describe('runAccountSyncBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs every account when the batch stays inside the reserve', async () => {
    vi.mocked(runAccountSync).mockImplementation(async ({ accountId }) => okResult(accountId));

    const results = await runAccountSyncBatch({
      accountIds: ['neon', 'vercel', 'upstash'],
      range: { from: day, to: day },
      mode: 'intraday',
      now: new Date(0),
      startedAt: 0,
      deadlineMs: 60_000,
      reserveMs: 15_000,
    });

    expect(results).toHaveLength(3);
    expect(runAccountSync).toHaveBeenCalledTimes(3);
  });

  it('does not start the next account after the reserve is exhausted', async () => {
    vi.mocked(runAccountSync).mockImplementation(async ({ accountId }) => {
      vi.setSystemTime(Date.now() + 50_000);
      return okResult(accountId);
    });

    const results = await runAccountSyncBatch({
      accountIds: ['neon', 'vercel', 'upstash'],
      range: { from: day, to: day },
      mode: 'intraday',
      now: new Date(0),
      startedAt: 0,
      deadlineMs: 60_000,
      reserveMs: 15_000,
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.providerAccountId).toBe('neon');
    expect(runAccountSync).toHaveBeenCalledOnce();
  });
});
