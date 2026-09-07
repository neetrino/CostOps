'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import type { loadIntegrations } from '@/features/integrations/load-integrations';
import { fetchJson, UnauthorizedError } from '@/features/dashboard/api-client';
import { useUnauthorizedRedirect } from '@/features/dashboard/use-unauthorized-redirect';
import { Button } from '@/shared/ui/button';
import { FreshnessBadge } from '@/shared/ui/freshness-badge';
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
    <div className="space-y-6">
      <header>
        <h1 className="wordmark text-3xl text-[var(--ink)]">Integrations</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Status comes from the last provider API request. Token expiry dates are not stored. No
          secrets on screen.
        </p>
      </header>
      <ul className="grid gap-5 lg:grid-cols-2">
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

  const markRotated = async () => {
    if (!window.confirm('Mark credential as rotated? Clears auth-failure incident.')) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await fetchJson(`/api/provider-accounts/${account.id}/credential`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markRotated: true }),
      });
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const rotateUrl = account.credentialCreateUrl ?? account.credentialDocsUrl;

  return (
    <li className="flex flex-col rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow-card)]">
      <div className="border-b border-[var(--line)] bg-[var(--sidebar)] px-4 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-[var(--ink)]">{account.name}</h2>
            <p className="text-xs text-[var(--muted)]">
              {account.providerDisplayName} · {account.externalAccountId}
            </p>
          </div>
          <CredentialHealthBadge health={account.credentialHealth} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4 text-sm">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Stat label="Account status" value={account.status} />
          <Stat label="Sync" value={account.syncEnabled ? 'Enabled' : 'Disabled'} />
          <Stat label="Last sync" value={formatTimestamp(account.lastSuccessfulSyncAt)} />
          <Stat label="Last error" value={formatTimestamp(account.lastErrorAt)} />
        </dl>
        {account.lastErrorMessage ? (
          <p className="rounded-[var(--radius-sm)] border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-3 py-2 text-xs text-[var(--danger)]">
            {account.lastErrorMessage}
          </p>
        ) : null}
        {account.lastAuthFailureAt ? (
          <p className="text-xs text-[var(--warning)]">
            Auth failure {formatTimestamp(account.lastAuthFailureAt)}
            {account.lastAuthFailureCode ? ` · ${account.lastAuthFailureCode}` : ''}
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
          {account.requiresCredentials === false ? (
            <p className="text-xs text-[var(--muted)]">
              Manual fixed cost — no API token to rotate.
            </p>
          ) : (
            <>
              {rotateUrl ? (
                <a
                  href={rotateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--accent)]"
                >
                  Rotate credential ↗
                </a>
              ) : null}
              <Button
                variant="ghost"
                className="text-xs"
                disabled={saving}
                onClick={() => void markRotated()}
              >
                Mark rotated
              </Button>
            </>
          )}
        </div>
        {error ? <p className="text-xs text-[var(--danger)]">{error}</p> : null}
      </div>
    </li>
  );
}

function CredentialHealthBadge({ health }: { health: IntegrationAccount['credentialHealth'] }) {
  const tone =
    health === 'ok'
      ? 'fresh'
      : health === 'unknown'
        ? 'missing'
        : health === 'error'
          ? 'stale'
          : 'error';
  const label =
    health === 'ok'
      ? 'Healthy'
      : health === 'auth_failed'
        ? 'Auth failed'
        : health === 'error'
          ? 'Request failed'
          : 'Unknown';
  return (
    <span title={`Credential: ${label}`}>
      <FreshnessBadge status={tone} />
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
        {label}
      </dt>
      <dd className="mt-1 font-medium text-[var(--ink)]">{value}</dd>
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
