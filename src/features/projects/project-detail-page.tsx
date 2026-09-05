'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { CostSeriesPoint } from '@/core/cost/build-series';
import { fetchJson, UnauthorizedError } from '@/features/dashboard/api-client';
import { useDashboardUrl } from '@/features/dashboard/use-dashboard-url';
import { useUnauthorizedRedirect } from '@/features/dashboard/use-unauthorized-redirect';
import { buildCompareBarData } from '@/features/projects/chart-data';
import { BudgetInlineField } from '@/features/projects/budget-inline-field';
import { FilterRail } from '@/features/projects/filter-rail';
import { ProjectCompareChart } from '@/features/projects/project-compare-chart';
import { UsageSeriesChart } from '@/features/projects/usage-series-chart';
import type { ProjectDetailResponse } from '@/features/projects/types';
import { Button } from '@/shared/ui/button';
import { CostViewDisplay } from '@/shared/ui/cost-view-display';
import { CardSkeleton, EmptyPanel, ErrorPanel } from '@/shared/ui/state-panels';

type UsageSeriesResponse = { points: CostSeriesPoint[] };

function ProjectDetailContent() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { state, queryString, replaceState } = useDashboardUrl();
  const [detail, setDetail] = useState<ProjectDetailResponse | null>(null);
  const [seriesData, setSeriesData] = useState<UsageSeriesResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);
  useUnauthorizedRedirect(error);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const projectDetail = await fetchJson<ProjectDetailResponse>(
        `/api/projects/${slug}${queryString}`,
      );
      const seriesParams = new URLSearchParams(queryString.replace(/^\?/, ''));
      seriesParams.set('projectId', projectDetail.project.id);
      const seriesQuery = seriesParams.toString();
      const series = await fetchJson<UsageSeriesResponse>(
        `/api/usage/series${seriesQuery ? `?${seriesQuery}` : ''}`,
      );
      setDetail(projectDetail);
      setSeriesData(series);
      setNameDraft(projectDetail.project.name);
    } catch (err) {
      setDetail(null);
      setSeriesData(null);
      setError(err instanceof Error ? err : new Error('Failed to load project'));
    } finally {
      setLoading(false);
    }
  }, [queryString, slug]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const projectDetail = await fetchJson<ProjectDetailResponse>(
          `/api/projects/${slug}${queryString}`,
        );
        const seriesParams = new URLSearchParams(queryString.replace(/^\?/, ''));
        seriesParams.set('projectId', projectDetail.project.id);
        const seriesQuery = seriesParams.toString();
        const series = await fetchJson<UsageSeriesResponse>(
          `/api/usage/series${seriesQuery ? `?${seriesQuery}` : ''}`,
        );
        if (cancelled) {
          return;
        }
        setDetail(projectDetail);
        setSeriesData(series);
        setNameDraft(projectDetail.project.name);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setDetail(null);
        setSeriesData(null);
        setError(err instanceof Error ? err : new Error('Failed to load project'));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [queryString, slug]);

  const compareData = useMemo(
    () =>
      buildCompareBarData(
        (detail?.providers ?? []).map((row) => ({
          projectId: row.projectProviderId,
          name: row.providerKey,
          cost: row.period,
        })),
      ),
    [detail?.providers],
  );

  const projectNames = useMemo(() => {
    if (!detail) {
      return {};
    }
    return { [detail.project.id]: detail.project.name };
  }, [detail]);

  const saveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === detail?.project.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      await fetchJson(`/api/projects/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      setEditingName(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Rename failed'));
    } finally {
      setSavingName(false);
    }
  };

  const archiveProject = async () => {
    if (!window.confirm('Archive this project? It will stay in history but leave active boards.')) {
      return;
    }
    try {
      await fetchJson(`/api/projects/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Archive failed'));
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:gap-0">
      <FilterRail
        state={state}
        onChange={replaceState}
        onRefresh={() => void load()}
        loading={loading}
      />
      <div className="min-w-0 flex-1 space-y-6 p-4 lg:p-6">
        {error && !detail ? (
          <ErrorPanel
            message={error instanceof UnauthorizedError ? 'Session expired' : error.message}
            onRetry={() => void load()}
          />
        ) : loading && !detail ? (
          <CardSkeleton />
        ) : !detail ? (
          <EmptyPanel title="Project not found" detail="Check the slug or return to Projects." />
        ) : (
          <>
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--muted)]">
                  <Link href="/projects" className="hover:text-[var(--accent)]">
                    Projects
                  </Link>
                  {' · '}
                  {detail.range.from} → {detail.range.to}
                </p>
                {editingName ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={nameDraft}
                      onChange={(event) => setNameDraft(event.target.value)}
                      className="rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-xl font-semibold"
                      aria-label="Project name"
                    />
                    <Button
                      variant="secondary"
                      disabled={savingName}
                      onClick={() => void saveName()}
                    >
                      Save
                    </Button>
                    <Button variant="ghost" onClick={() => setEditingName(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <h1 className="wordmark text-3xl text-[var(--ink)]">{detail.project.name}</h1>
                    {!detail.project.archived ? (
                      <Button
                        variant="ghost"
                        className="text-xs"
                        onClick={() => setEditingName(true)}
                      >
                        Rename
                      </Button>
                    ) : null}
                  </div>
                )}
                <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-[var(--muted)]">
                  {detail.project.slug}
                  {detail.project.archived ? ' · Archived' : ''}
                </p>
              </div>
              {!detail.project.archived ? (
                <Button
                  variant="secondary"
                  className="text-xs"
                  onClick={() => void archiveProject()}
                >
                  Archive
                </Button>
              ) : null}
            </header>

            <div className="grid gap-4 sm:grid-cols-2">
              <HeroMetric label="Today" cost={detail.today} accent />
              <HeroMetric label="Selected period" cost={detail.period} />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <ProjectCompareChart data={compareData} />
              <UsageSeriesChart points={seriesData?.points ?? []} projectNames={projectNames} />
            </div>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-[var(--ink)]">Providers & resources</h2>
              {detail.providers.length === 0 ? (
                <EmptyPanel title="No provider links" detail="Map resources or run sync." />
              ) : (
                detail.providers.map((provider) => (
                  <ProviderSection
                    key={provider.projectProviderId}
                    provider={provider}
                    onBudgetSaved={() => void load()}
                  />
                ))
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function HeroMetric({
  label,
  cost,
  accent = false,
}: {
  label: string;
  cost: ProjectDetailResponse['today'];
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--radius)] border px-5 py-4 shadow-[var(--shadow-card)] ${
        accent
          ? 'border-[var(--accent-soft)] bg-[var(--accent-soft)]'
          : 'border-[var(--line)] bg-[var(--paper)]'
      }`}
    >
      <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      <div className="mt-2">
        <CostViewDisplay cost={cost} size="lg" />
      </div>
    </div>
  );
}

function ProviderSection({
  provider,
  onBudgetSaved,
}: {
  provider: ProjectDetailResponse['providers'][number];
  onBudgetSaved: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--sidebar)] px-4 py-3">
        <div>
          <h3 className="font-semibold text-[var(--ink)]">{provider.providerKey}</h3>
          <div className="mt-1 flex flex-wrap gap-4 text-xs">
            <span>
              Period <CostViewDisplay cost={provider.period} size="sm" />
            </span>
            <span>
              Today <CostViewDisplay cost={provider.today} size="sm" />
            </span>
          </div>
        </div>
        <BudgetInlineField
          projectProviderId={provider.projectProviderId}
          budget={provider.budget}
          onSaved={onBudgetSaved}
        />
      </div>
      {provider.resources.length === 0 ? (
        <p className="px-4 py-4 text-sm text-[var(--muted)]">No resources linked.</p>
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {provider.resources.map((resource) => (
            <li
              key={resource.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-[var(--ink)]" title={resource.displayName}>
                  {resource.displayName}
                </p>
                <p className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted)]">
                  {resource.resourceType} · {resource.externalId}
                </p>
              </div>
              <div className="flex shrink-0 gap-4 text-right">
                <div>
                  <p className="text-[10px] text-[var(--muted)]">Period</p>
                  <CostViewDisplay cost={resource.period} size="sm" />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--muted)]">Today</p>
                  <CostViewDisplay cost={resource.today} size="sm" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function ProjectDetailPage() {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <ProjectDetailContent />
    </Suspense>
  );
}
