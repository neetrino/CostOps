'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import type { loadIntegrations } from '@/features/integrations/load-integrations';
import { fetchJson, UnauthorizedError } from '@/features/dashboard/api-client';
import { useUnauthorizedRedirect } from '@/features/dashboard/use-unauthorized-redirect';
import { AppIcon } from '@/shared/ui/app-icon';
import { Button } from '@/shared/ui/button';
import { CardSkeleton, EmptyPanel, ErrorPanel } from '@/shared/ui/state-panels';

type IntegrationsResponse = Awaited<ReturnType<typeof loadIntegrations>>;
type IntegrationAccount = IntegrationsResponse['accounts'][number];

function IntegrationsContent() {
  const [data, setData] = useState<IntegrationsResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  useUnauthorizedRedirect(error);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchJson<IntegrationsResponse>('/api/integrations'));
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err : new Error('Failed to load integrations'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const payload = await fetchJson<IntegrationsResponse>('/api/integrations');
        if (!cancelled) {
          setData(payload);
        }
      } catch (err) {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err : new Error('Failed to load integrations'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !data) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error && !data) {
    return (
      <ErrorPanel
        message={error instanceof UnauthorizedError ? 'Session expired' : error.message}
        onRetry={() => void load()}
      />
    );
  }

  if (!data || data.accounts.length === 0) {
    return (
      <EmptyPanel
        title="No provider accounts"
        detail="Seed or configure provider accounts to connect integrations."
      />
    );
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      <header className="surface-ledger overflow-hidden">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-4 flex size-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-ink)]">
              <AppIcon name="integrations" size={22} />
            </div>
            <p className="eyebrow">Provider operations</p>
            <h1 className="wordmark mt-2 text-3xl text-[var(--ink)] sm:text-4xl">Integrations</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
              One place to verify connection health, spot failed credentials, and rotate access
              without exposing a secret.
            </p>
          </div>
          <IntegrationSummary accounts={data.accounts} />
        </div>
        <div className="border-t border-[var(--line)] bg-[var(--sunken)] px-5 py-3 sm:px-7">
          <p className="text-xs leading-5 text-[var(--muted)]">
            Health reflects the latest provider request. Expiry dates are not stored.
          </p>
        </div>
      </header>
      <ul className="grid gap-4 xl:grid-cols-2">
        {data.accounts.map((account) => (
          <IntegrationAccountCard
            key={account.id}
            account={account}
            onUpdated={() => void load()}
          />
        ))}
      </ul>
    </div>
  );
}

function IntegrationAccountCard({
  account,
  onUpdated,
}: {
  account: IntegrationAccount;
  onUpdated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRotation, setConfirmRotation] = useState(false);

  const markRotated = async () => {
    setSaving(true);
    setError(null);
    try {
      await fetchJson(`/api/provider-accounts/${account.id}/credential`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markRotated: true }),
      });
      setConfirmRotation(false);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const rotateUrl = account.credentialCreateUrl ?? account.credentialDocsUrl;
  const health = credentialHealthPresentation(account.credentialHealth);

  return (
    <li className="surface-ledger flex min-w-0 flex-col overflow-hidden">
      <div className="border-b border-[var(--line)] px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent)]">
              {account.providerDisplayName.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h2
                className="truncate text-base font-semibold text-[var(--ink)]"
                title={account.name}
              >
                {account.name}
              </h2>
              <p
                className="money mt-0.5 truncate text-[11px] text-[var(--muted)]"
                title={account.externalAccountId}
              >
                {account.providerDisplayName} · {account.externalAccountId}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase ${health.className}`}
          >
            <span className="size-1.5 rounded-full bg-current" aria-hidden />
            {health.label}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4 text-sm sm:p-5">
        <dl className="grid grid-cols-2 gap-2 sm:gap-3">
          <Stat label="Account status" value={account.status} />
          <Stat label="Sync" value={account.syncEnabled ? 'Enabled' : 'Disabled'} />
          <Stat label="Last sync" value={formatTimestamp(account.lastSuccessfulSyncAt)} />
          <Stat label="Last error" value={formatTimestamp(account.lastErrorAt)} />
        </dl>
        {account.lastErrorMessage ? (
          <div className="flex items-start gap-2.5 rounded-[var(--radius-sm)] border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-3 py-3 text-xs leading-5 text-[var(--danger)]">
            <AppIcon name="alert" size={16} className="mt-0.5 shrink-0" />
            <p className="min-w-0 break-words">{account.lastErrorMessage}</p>
          </div>
        ) : null}
        {account.lastAuthFailureAt ? (
          <p className="text-xs text-[var(--warning)]">
            Auth failure {formatTimestamp(account.lastAuthFailureAt)}
            {account.lastAuthFailureCode ? ` · ${account.lastAuthFailureCode}` : ''}
          </p>
        ) : null}
        {confirmRotation ? (
          <div className="rounded-[var(--radius-sm)] border border-[var(--warning)]/25 bg-[var(--warning-soft)] p-3">
            <p className="text-xs font-semibold text-[var(--ink)]">Confirm credential rotation</p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              This clears the recorded authentication incident. Use it only after replacing the
              provider credential.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                variant="ghost"
                className="w-full"
                disabled={saving}
                onClick={() => setConfirmRotation(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="w-full"
                disabled={saving}
                onClick={() => void markRotated()}
              >
                {saving ? 'Updating…' : 'Confirm'}
              </Button>
            </div>
          </div>
        ) : null}
        <div className="mt-auto border-t border-[var(--line)] pt-4">
          {account.requiresCredentials === false ? (
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <AppIcon name="check" size={16} className="text-[var(--ok)]" />
              Manual fixed cost — no credential required.
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {rotateUrl ? (
                <a
                  href={rotateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--paper-raised)] px-3.5 py-2 text-xs font-semibold text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--sunken)] sm:min-h-10"
                >
                  Open provider <AppIcon name="arrow" size={15} />
                </a>
              ) : null}
              <Button
                variant="ghost"
                className="w-full text-xs"
                disabled={saving || confirmRotation}
                onClick={() => setConfirmRotation(true)}
              >
                Mark as rotated
              </Button>
            </div>
          )}
        </div>
        {error ? <p className="text-xs text-[var(--danger)]">{error}</p> : null}
      </div>
    </li>
  );
}

function credentialHealthPresentation(health: IntegrationAccount['credentialHealth']) {
  if (health === 'ok') {
    return { label: 'Healthy', className: 'bg-[var(--ok-soft)] text-[var(--ok)]' };
  }
  if (health === 'auth_failed') {
    return { label: 'Auth failed', className: 'bg-[var(--danger-soft)] text-[var(--danger)]' };
  }
  if (health === 'error') {
    return { label: 'Request failed', className: 'bg-[var(--warning-soft)] text-[var(--warning)]' };
  }
  return { label: 'Unknown', className: 'bg-[var(--stale-soft)] text-[var(--stale)]' };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-[var(--sunken)] px-3 py-2.5">
      <dt className="text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
        {label}
      </dt>
      <dd className="mt-1 truncate font-medium text-[var(--ink)]" title={value}>
        {value}
      </dd>
    </div>
  );
}

function IntegrationSummary({ accounts }: { accounts: IntegrationAccount[] }) {
  const healthy = accounts.filter((account) => account.credentialHealth === 'ok').length;
  const attention = accounts.filter(
    (account) => account.credentialHealth === 'auth_failed' || account.credentialHealth === 'error',
  ).length;
  return (
    <dl className="grid grid-cols-3 overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper-raised)] shadow-[var(--shadow)]">
      <SummaryStat label="Connected" value={accounts.length} />
      <SummaryStat label="Healthy" value={healthy} />
      <SummaryStat label="Attention" value={attention} tone={attention > 0 ? 'danger' : 'normal'} />
    </dl>
  );
}

function SummaryStat({
  label,
  value,
  tone = 'normal',
}: {
  label: string;
  value: number;
  tone?: 'normal' | 'danger';
}) {
  return (
    <div className="min-w-[5.5rem] border-r border-[var(--line)] px-3 py-3 text-center last:border-r-0 sm:min-w-[7rem] sm:px-5">
      <dt className="text-[9px] font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
        {label}
      </dt>
      <dd
        className={`money mt-1 text-xl font-semibold ${tone === 'danger' ? 'text-[var(--danger)]' : 'text-[var(--ink)]'}`}
      >
        {value}
      </dd>
    </div>
  );
}

function formatTimestamp(value: string | null): string {
  if (!value) {
    return '—';
  }
  return value.replace('T', ' ').slice(0, 16);
}

export function IntegrationsPage() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-4 lg:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      }
    >
      <IntegrationsContent />
    </Suspense>
  );
}
