import type { HomeStatus } from '@/features/overview/load-home-status';

type HomeSyncStatusProps = {
  status: HomeStatus;
};

export function HomeSyncStatus({ status }: HomeSyncStatusProps) {
  if (!status.available) {
    return (
      <p className="mt-8 border-t border-[var(--line)] pt-6 text-sm text-[var(--muted)]">
        {status.message}
      </p>
    );
  }

  const latest = status.status.runs[0];
  const account = status.status.accounts[0];

  return (
    <div className="mt-8 border-t border-[var(--line)] pt-6 text-sm text-[var(--ink)]">
      <p className="text-xs font-medium tracking-[0.14em] text-[var(--muted)] uppercase">Sync</p>
      {account ? (
        <p className="mt-2">
          {account.name} · {account.freshness}
          {account.lastSuccessfulSyncAt
            ? ` · last success ${account.lastSuccessfulSyncAt.slice(0, 16)}Z`
            : ' · no successful sync yet'}
        </p>
      ) : (
        <p className="mt-2 text-[var(--muted)]">
          No provider accounts yet. Seed NEON_ORG_ID / VERCEL_TEAM_ID / UPSTASH_EMAIL or run cron.
        </p>
      )}
      {latest ? (
        <p className="mt-1 text-[var(--muted)]">
          Latest run {latest.status.toLowerCase()}
          {latest.rowsWritten !== null ? ` · ${latest.rowsWritten} rows` : ''}
        </p>
      ) : null}
    </div>
  );
}
