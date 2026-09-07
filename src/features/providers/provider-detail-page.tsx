'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { CostSeriesPoint } from '@/core/cost/build-series';
import type { CostView } from '@/core/cost/types';
import { fetchJson, UnauthorizedError } from '@/features/dashboard/api-client';
import { useDashboardUrl } from '@/features/dashboard/use-dashboard-url';
import { useUnauthorizedRedirect } from '@/features/dashboard/use-unauthorized-redirect';
import { buildCompareBarData } from '@/features/projects/chart-data';
import { DashboardBoard } from '@/features/projects/dashboard-board';
import { FilterRail } from '@/features/projects/filter-rail';
import { ProjectCompareChart } from '@/features/projects/project-compare-chart';
import { UsageSeriesChart } from '@/features/projects/usage-series-chart';
import { sortByPeriodCostDesc } from '@/features/projects/sort-projects-by-cost';
import { ViewToggle, type BoardViewMode } from '@/features/projects/view-toggle';
import type { ProviderDetailResponse } from '@/features/providers/load-provider-detail';
import { BackfillPeriodButton } from '@/features/providers/backfill-period-button';
import { ProviderProjectCards } from '@/features/providers/provider-project-cards';
import { ProviderProjectList } from '@/features/providers/provider-project-list';
import { VpsAddProject } from '@/features/providers/vps-add-project';
import { isFixedVpsProvider } from '@/shared/provider-label';
import { CostViewDisplay } from '@/shared/ui/cost-view-display';
import { CardSkeleton, EmptyPanel, ErrorPanel } from '@/shared/ui/state-panels';

type UsageSeriesResponse = { points: CostSeriesPoint[] };

function ProviderDetailContent() {
  const params = useParams<{ key: string }>();
  const providerKey = params.key.toUpperCase();
  const { state, queryString, replaceState } = useDashboardUrl();
  const [detail, setDetail] = useState<ProviderDetailResponse | null>(null);
  const [seriesData, setSeriesData] = useState<UsageSeriesResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<BoardViewMode>('cards');
  useUnauthorizedRedirect(error);

  const scopedQuery = useMemo(() => {
    const params = new URLSearchParams(queryString.replace(/^\?/, ''));
    params.set('providerKey', providerKey);
    const query = params.toString();
    return query ? `?${query}` : '';
  }, [providerKey, queryString]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [providerDetail, series] = await Promise.all([
        fetchJson<ProviderDetailResponse>(`/api/providers/${params.key}${queryString}`),
        fetchJson<UsageSeriesResponse>(`/api/usage/series${scopedQuery}`),
      ]);
      setDetail(providerDetail);
      setSeriesData(series);
    } catch (err) {
      setDetail(null);
      setSeriesData(null);
      setError(err instanceof Error ? err : new Error('Failed to load provider'));
    } finally {
      setLoading(false);
    }
  }, [params.key, queryString, scopedQuery]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [providerDetail, series] = await Promise.all([
          fetchJson<ProviderDetailResponse>(`/api/providers/${params.key}${queryString}`),
          fetchJson<UsageSeriesResponse>(`/api/usage/series${scopedQuery}`),
        ]);
        if (cancelled) {
          return;
        }
        setDetail(providerDetail);
        setSeriesData(series);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setDetail(null);
        setSeriesData(null);
        setError(err instanceof Error ? err : new Error('Failed to load provider'));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.key, queryString, scopedQuery]);

  const filteredProjects = useMemo(() => {
    const list = detail?.projects ?? [];
    const term = search.trim().toLowerCase();
    const matched = term
      ? list.filter((project) => project.name.toLowerCase().includes(term))
      : list;
    return sortByPeriodCostDesc(matched);
  }, [detail?.projects, search]);

  const projectNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const project of detail?.projects ?? []) {
      map[project.projectId] = project.name;
    }
    return map;
  }, [detail?.projects]);

  const compareData = useMemo(
    () =>
      buildCompareBarData(
        filteredProjects.map((row) => ({
          projectId: row.projectId,
          name: row.name,
          cost: row.period,
        })),
      ),
    [filteredProjects],
  );

  const visibleIds = useMemo(
    () => new Set(filteredProjects.map((project) => project.projectId)),
    [filteredProjects],
  );

  return (
    <DashboardBoard
      rail={
        <FilterRail
          state={state}
          onChange={replaceState}
          onRefresh={() => void load()}
          loading={loading}
        />
      }
    >
      {error && !detail ? (
        <ErrorPanel
          message={error instanceof UnauthorizedError ? 'Session expired' : error.message}
          onRetry={() => void load()}
        />
      ) : loading && !detail ? (
        <CardSkeleton />
      ) : !detail ? (
        <EmptyPanel title="Provider not found" detail="Unknown provider key." />
      ) : (
        <>
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="wordmark text-3xl text-[var(--ink)]">{detail.provider.displayName}</h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Provider board · {detail.range.from} → {detail.range.to}. Sync now only refreshes
                today.
              </p>
            </div>
            <BackfillPeriodButton
              providerKey={detail.provider.key}
              from={detail.range.from}
              to={detail.range.to}
              onComplete={() => void load()}
            />
            <label className="min-w-[12rem] flex-1 text-xs font-medium text-[var(--muted)] sm:max-w-xs">
              Search
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter projects…"
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)]"
              />
            </label>
          </header>

          {isFixedVpsProvider(detail.provider.key) ? (
            <VpsAddProject onAdded={() => void load()} />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <HeroMetric label="Today" cost={detail.today} accent />
            <HeroMetric label="Selected period" cost={detail.period} />
            <UnmappedTile unmapped={detail.unmapped} />
          </div>

          <ProjectCompareChart data={compareData} />
          <UsageSeriesChart
            points={seriesData?.points ?? []}
            projectNames={projectNames}
            visibleIds={visibleIds}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--muted)]">
              {filteredProjects.length} project{filteredProjects.length === 1 ? '' : 's'}
            </p>
            <ViewToggle mode={viewMode} onChange={setViewMode} />
          </div>

          {filteredProjects.length === 0 ? (
            <EmptyPanel
              title="No projects in range"
              detail={
                search
                  ? 'Try clearing search.'
                  : isFixedVpsProvider(detail.provider.key)
                    ? 'Add a project above to attach a monthly VPS line.'
                    : 'Run sync or widen the date range.'
              }
            />
          ) : viewMode === 'cards' ? (
            <ProviderProjectCards
              projects={filteredProjects}
              hideDailyLimit={isFixedVpsProvider(detail.provider.key)}
              onBudgetSaved={() => void load()}
            />
          ) : (
            <ProviderProjectList
              projects={filteredProjects}
              hideDailyLimit={isFixedVpsProvider(detail.provider.key)}
              onBudgetSaved={() => void load()}
            />
          )}
        </>
      )}
    </DashboardBoard>
  );
}

function HeroMetric({
  label,
  cost,
  accent = false,
}: {
  label: string;
  cost: CostView;
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

function UnmappedTile({ unmapped }: { unmapped: ProviderDetailResponse['unmapped'] }) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--warning)]/30 bg-[var(--warning-soft)] px-5 py-4 shadow-[var(--shadow-card)] sm:col-span-2 lg:col-span-1">
      <p className="text-xs font-medium text-[var(--muted)]">Unmapped</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--ink)]">{unmapped.count}</p>
      <div className="mt-2 flex flex-wrap gap-4 text-xs">
        <span>
          Period <CostViewDisplay cost={unmapped.period} size="sm" />
        </span>
        <span>
          Today <CostViewDisplay cost={unmapped.today} size="sm" />
        </span>
      </div>
      {unmapped.count > 0 ? (
        <Link
          href="/unmapped"
          className="mt-3 inline-block text-xs font-semibold text-[var(--accent)]"
        >
          Open inbox →
        </Link>
      ) : null}
    </div>
  );
}

export function ProviderDetailPage() {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <ProviderDetailContent />
    </Suspense>
  );
}
