'use client';

import { Suspense, useEffect, useState } from 'react';
import type { OverviewResponse } from '@/features/overview/types';
import { fetchJson, UnauthorizedError } from '@/features/dashboard/api-client';
import { useDashboardUrl } from '@/features/dashboard/use-dashboard-url';
import { useUnauthorizedRedirect } from '@/features/dashboard/use-unauthorized-redirect';
import { CostViewDisplay } from '@/shared/ui/cost-view-display';
import { CardSkeleton, EmptyPanel, ErrorPanel } from '@/shared/ui/state-panels';
import { formatUsd } from '@/shared/money';
import { FreshnessBadge } from '@/shared/ui/freshness-badge';

function OverviewContent() {
  const { queryString } = useDashboardUrl();
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  useUnauthorizedRedirect(error);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const payload = await fetchJson<OverviewResponse>(`/api/overview${queryString}`);
        if (!cancelled) {
          setData(payload);
        }
      } catch (err) {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err : new Error('Failed to load overview'));
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
  }, [queryString]);

  const retry = () => {
    setLoading(true);
    setError(null);
    void fetchJson<OverviewResponse>(`/api/overview${queryString}`)
      .then(setData)
      .catch((err: unknown) => {
        setData(null);
        setError(err instanceof Error ? err : new Error('Failed to load overview'));
      })
      .finally(() => setLoading(false));
  };

  if (loading && !data) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error && !data) {
    const message = error instanceof UnauthorizedError ? 'Session expired' : error.message;
    return <ErrorPanel message={message} onRetry={retry} />;
  }

  if (!data) {
    return <EmptyPanel title="No overview data" detail="Run sync to populate costs." />;
  }

  const topProjects = data.byProject.slice(0, 8);
  const topProviders = data.byProvider.slice(0, 6);

  return (
    <div className="space-y-8">
      <section className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
              {data.range.preset.replace('_', ' ')} · {data.range.from} → {data.range.to}
            </p>
            <h1 className="wordmark mt-2 text-3xl text-[var(--ink)]">Spend overview</h1>
          </div>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--canvas)] p-5">
            <p className="text-xs font-medium text-[var(--muted)]">Today</p>
            <div className="mt-2">
              <CostViewDisplay cost={data.today} size="lg" />
            </div>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-[var(--accent-soft)] bg-[var(--accent-soft)] p-5">
            <p className="text-xs font-medium text-[var(--muted)]">Selected period</p>
            <div className="mt-2">
              <CostViewDisplay cost={data.period} size="lg" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <OverviewTable
          title="By provider"
          rows={topProviders.map((row) => ({
            key: row.providerKey,
            name: row.displayName,
            period: row.period,
            today: row.today,
          }))}
        />
        <OverviewTable
          title="By project (mapped providers)"
          rows={topProjects.map((row) => ({
            key: row.projectId,
            name: row.name,
            period: row.period,
            today: row.today,
          }))}
        />
      </div>

      <NearLimitSection rows={data.nearLimit} />
      <HealthSection health={data.health} />
    </div>
  );
}

type OverviewTableRow = {
  key: string;
  name: string;
  period: OverviewResponse['period'];
  today: OverviewResponse['today'];
};

function OverviewTable({ title, rows }: { title: string; rows: OverviewTableRow[] }) {
  if (rows.length === 0) {
    return (
      <section className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-[var(--ink)]">{title}</h2>
        <EmptyPanel title="Nothing in range" detail="Adjust filters or run sync." />
      </section>
    );
  }
  return (
    <section className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-sm font-semibold text-[var(--ink)]">{title}</h2>
      <ul className="mt-4 divide-y divide-[var(--line)]">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center justify-between gap-3 py-3">
            <span className="min-w-0 truncate font-medium text-[var(--ink)]" title={row.name}>
              {row.name}
            </span>
            <div className="shrink-0 text-right">
              <CostViewDisplay cost={row.period} size="sm" />
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                Today {row.today.costUsd === null ? '—' : formatUsd(row.today.costUsd)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function NearLimitSection({ rows }: { rows: OverviewResponse['nearLimit'] }) {
  return (
    <section className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-sm font-semibold text-[var(--ink)]">Near daily limit</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">
          No projects at ≥70% of today&apos;s limit.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--line)]">
          {rows.map((row) => (
            <li
              key={row.budgetRuleId}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-[var(--ink)]">
                  {row.projectName ?? row.scope}
                  {row.providerKey ? ` · ${row.providerKey}` : ''}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Limit {formatUsd(row.limitUsd)} · {row.usagePercent}% used
                </p>
              </div>
              <CostViewDisplay cost={row.spend} size="sm" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function HealthSection({ health }: { health: OverviewResponse['health'] }) {
  const syncIssues = health.sync.accounts.filter((account) => account.freshness !== 'fresh');
  return (
    <section className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-sm font-semibold text-[var(--ink)]">Health</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <HealthTile
          label="Sync"
          value={syncIssues.length === 0 ? 'All fresh' : `${syncIssues.length} need attention`}
          tone={syncIssues.length === 0 ? 'ok' : 'warning'}
        />
        <HealthTile
          label="Unmapped resources"
          value={String(health.unmappedResourceCount)}
          tone={health.unmappedResourceCount > 0 ? 'warning' : 'ok'}
        />
        <HealthTile
          label="Credential alerts"
          value={String(health.credentialAlerts.length)}
          tone={health.credentialAlerts.length > 0 ? 'danger' : 'ok'}
        />
      </div>
      {health.credentialAlerts.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm">
          {health.credentialAlerts.map((alert) => (
            <li key={alert.accountId} className="flex items-center gap-2 text-[var(--ink)]">
              <FreshnessBadge status="error" compact />
              {alert.name} · {alert.health}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function HealthTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'ok' | 'warning' | 'danger';
}) {
  const bg =
    tone === 'ok'
      ? 'bg-[var(--ok-soft)]'
      : tone === 'warning'
        ? 'bg-[var(--warning-soft)]'
        : 'bg-[var(--danger-soft)]';
  return (
    <div className={`rounded-[var(--radius-sm)] border border-[var(--line)] p-4 ${bg}`}>
      <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-semibold text-[var(--ink)]">{value}</p>
    </div>
  );
}

export function OverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-4 lg:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      }
    >
      <OverviewContent />
    </Suspense>
  );
}
