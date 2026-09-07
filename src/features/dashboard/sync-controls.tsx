'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SyncStatusView } from '@/core/sync/load-status';
import { fetchJson } from '@/features/dashboard/api-client';
import { Button } from '@/shared/ui/button';

type SyncNowButtonProps = {
  onComplete?: () => void;
};

export function SyncNowButton({ onComplete }: SyncNowButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncNow = useCallback(async () => {
    if (pending) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      await fetchJson('/api/sync/now', { method: 'POST' });
      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setPending(false);
    }
  }, [onComplete, pending]);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="primary" onClick={() => void syncNow()} disabled={pending}>
        {pending ? 'Syncing…' : 'Sync now'}
      </Button>
      {error ? (
        <p className="max-w-[12rem] text-right text-[10px] text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type SyncStatusChipProps = {
  refreshKey?: number;
};

export function SyncStatusChip({ refreshKey = 0 }: SyncStatusChipProps) {
  const [status, setStatus] = useState<SyncStatusView | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchJson<SyncStatusView>('/api/sync/status')
      .then((data) => {
        if (!cancelled) {
          setStatus(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const latestRun = status?.runs[0];
  const account = status?.accounts[0];
  const label = account
    ? `${account.freshness}${account.lastSuccessfulSyncAt ? ` · ${account.lastSuccessfulSyncAt.slice(0, 10)}` : ''}`
    : 'No accounts';

  return (
    <div
      className="hidden rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-xs text-[var(--muted)] sm:block"
      title={latestRun ? `Latest run ${latestRun.status}` : undefined}
    >
      <span className="font-medium text-[var(--ink)]">Sync</span>
      <span className="mx-1.5 text-[var(--line-strong)]">·</span>
      {label}
      {latestRun?.rowsWritten !== null && latestRun?.rowsWritten !== undefined
        ? ` · ${latestRun.rowsWritten} rows`
        : ''}
    </div>
  );
}
