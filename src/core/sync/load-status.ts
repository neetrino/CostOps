import { accountFreshness } from '@/core/sync/account-freshness';
import { prisma } from '@/shared/db';

export type SyncStatusView = {
  accounts: Array<{
    id: string;
    providerKey: string;
    name: string;
    lastSuccessfulSyncAt: string | null;
    lastErrorAt: string | null;
    lastErrorMessage: string | null;
    freshness: ReturnType<typeof accountFreshness>;
  }>;
  runs: Array<{
    id: string;
    providerAccountId: string;
    providerKey: string;
    startedAt: string;
    finishedAt: string | null;
    status: string;
    rowsWritten: number | null;
    errorMessage: string | null;
    rangeFrom: string;
    rangeTo: string;
  }>;
};

export async function loadSyncStatus(now: Date = new Date()): Promise<SyncStatusView> {
  const [accounts, runs] = await Promise.all([
    prisma.providerAccount.findMany({ orderBy: { name: 'asc' } }),
    prisma.syncRun.findMany({ orderBy: { startedAt: 'desc' }, take: 12 }),
  ]);
  return {
    accounts: accounts.map((account) => ({
      id: account.id,
      providerKey: account.providerKey,
      name: account.name,
      lastSuccessfulSyncAt: account.lastSuccessfulSyncAt?.toISOString() ?? null,
      lastErrorAt: account.lastErrorAt?.toISOString() ?? null,
      lastErrorMessage: account.lastErrorMessage,
      freshness: accountFreshness({
        lastSuccessfulSyncAt: account.lastSuccessfulSyncAt,
        lastErrorAt: account.lastErrorAt,
        recommendedSyncIntervalMinutes: account.recommendedSyncIntervalMinutes,
        providerKey: account.providerKey,
        now,
      }),
    })),
    runs: runs.map((run) => ({
      id: run.id,
      providerAccountId: run.providerAccountId,
      providerKey: run.providerKey,
      startedAt: run.startedAt.toISOString(),
      finishedAt: run.finishedAt?.toISOString() ?? null,
      status: run.status,
      rowsWritten: run.rowsWritten,
      errorMessage: run.errorMessage,
      rangeFrom: run.rangeFrom.toISOString(),
      rangeTo: run.rangeTo.toISOString(),
    })),
  };
}
