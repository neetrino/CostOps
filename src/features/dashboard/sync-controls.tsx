'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SyncStatusView } from '@/core/sync/load-status';
import { fetchJson } from '@/features/dashboard/api-client';
import { REGISTERED_PROVIDER_KEYS } from '@/shared/registered-providers';
import { AppIcon } from '@/shared/ui/app-icon';
import { Button } from '@/shared/ui/button';

type SyncNowButtonProps = {
  onComplete?: () => void;
  compact?: boolean;
};

export function SyncNowButton({ onComplete, compact = false }: SyncNowButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncNow = useCallback(async () => {
    if (pending) {
      return;
    }
    setPending(true);
    setError(null);
    const failures: string[] = [];
    try {
      for (const providerKey of REGISTERED_PROVIDER_KEYS) {
        try {
          await fetchJson('/api/sync/now', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ providerKey }),
          });
        } catch (err) {
          failures.push(`${providerKey}: ${err instanceof Error ? err.message : 'Sync failed'}`);
        }
      }
      onComplete?.();
      if (failures.length > 0) {
        setError(failures.join(' · '));
      }
    } finally {
      setPending(false);
    }
  }, [onComplete, pending]);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="primary"
        className={compact ? 'size-11 rounded-full px-0' : ''}
        onClick={() => void syncNow()}
        disabled={pending}
        aria-label={
          compact ? (pending ? 'Syncing provider data' : 'Sync provider data now') : undefined
        }
      >
        {compact ? (
          <AppIcon name="sync" className={pending ? 'animate-spin' : ''} />
        ) : pending ? (
          'Syncing…'
        ) : (
          'Sync now'
        )}
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
