'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { CostSeriesPoint } from '@/core/cost/build-series';
import type { CostView } from '@/core/cost/types';
import { fetchJson, UnauthorizedError } from '@/features/dashboard/api-client';
import { useDashboardUrl } from '@/features/dashboard/use-dashboard-url';
import { useUnauthorizedRedirect } from '@/features/dashboard/use-unauthorized-redirect';
import { buildCompareBarData } from '@/features/projects/chart-data';
import { DashboardBoard } from '@/features/projects/dashboard-board';
import { FilterRail } from '@/features/projects/filter-rail';
import { KpiStrip } from '@/features/projects/kpi-strip';
import { NearLimitStrip } from '@/features/projects/near-limit-strip';
import { buildBoardNearLimitItems } from '@/features/projects/near-limit-from-projects';
import { ProjectCards } from '@/features/projects/project-cards';
import { ProjectCompareChart } from '@/features/projects/project-compare-chart';
import { ProjectListView } from '@/features/projects/project-list-view';
import { UsageSeriesChart } from '@/features/projects/usage-series-chart';
import { sortByPeriodCostDesc } from '@/features/projects/sort-projects-by-cost';
import { ViewToggle, type BoardViewMode } from '@/features/projects/view-toggle';
import type { ProjectListResponse } from '@/features/projects/types';
import { CostViewDisplay } from '@/shared/ui/cost-view-display';
import { CardSkeleton, EmptyPanel, ErrorPanel } from '@/shared/ui/state-panels';

type UsageTotalsResponse = {
  total: CostView;
  byProvider: Array<{ providerKey: string; displayName: string; cost: CostView }>;
  byProject: Array<{
    projectId: string;
    slug: string;
    name: string;
    archived: boolean;
    cost: CostView;
  }>;
};

type UsageSeriesResponse = {
  points: CostSeriesPoint[];
};

function ProjectsContent() {
  const { state, queryString, replaceState } = useDashboardUrl();
  const [projectsData, setProjectsData] = useState<ProjectListResponse | null>(null);
  const [totalsData, setTotalsData] = useState<UsageTotalsResponse | null>(null);
  const [seriesData, setSeriesData] = useState<UsageSeriesResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<BoardViewMode>('cards');
  useUnauthorizedRedirect(error);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projects, totals, series] = await Promise.all([
        fetchJson<ProjectListResponse>(`/api/projects${queryString}`),
        fetchJson<UsageTotalsResponse>(`/api/usage/totals${queryString}`),
        fetchJson<UsageSeriesResponse>(`/api/usage/series${queryString}`),
      ]);
      setProjectsData(projects);
      setTotalsData(totals);
      setSeriesData(series);
    } catch (err) {
      setProjectsData(null);
      setTotalsData(null);
      setSeriesData(null);
      setError(err instanceof Error ? err : new Error('Failed to load projects'));
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [projects, totals, series] = await Promise.all([
          fetchJson<ProjectListResponse>(`/api/projects${queryString}`),
          fetchJson<UsageTotalsResponse>(`/api/usage/totals${queryString}`),
          fetchJson<UsageSeriesResponse>(`/api/usage/series${queryString}`),
        ]);
        if (cancelled) {
          return;
        }
        setProjectsData(projects);
        setTotalsData(totals);
        setSeriesData(series);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setProjectsData(null);
        setTotalsData(null);
        setSeriesData(null);
        setError(err instanceof Error ? err : new Error('Failed to load projects'));
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

  const filteredProjects = useMemo(() => {
    const list = projectsData?.projects ?? [];
    const term = search.trim().toLowerCase();
    const matched = term
      ? list.filter((project) => project.name.toLowerCase().includes(term))
      : list;
    return sortByPeriodCostDesc(matched);
  }, [projectsData?.projects, search]);

  const visibleIds = useMemo(
    () => new Set(filteredProjects.map((project) => project.id)),
    [filteredProjects],
  );

  const projectNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const project of filteredProjects) {
      map[project.id] = project.name;
    }
    return map;
  }, [filteredProjects]);

  const compareData = useMemo(
    () =>
      buildCompareBarData(
        (totalsData?.byProject ?? [])
          .filter((row) => visibleIds.has(row.projectId))
          .map((row) => ({
            projectId: row.projectId,
            name: row.name,
            cost: row.cost,
          })),
      ),
    [totalsData?.byProject, visibleIds],
  );

  const nearLimit = useMemo(() => buildBoardNearLimitItems(filteredProjects), [filteredProjects]);

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
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-end gap-x-8 gap-y-3">
          <div>
            <h1 className="wordmark text-3xl text-[var(--ink)]">Projects</h1>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-[var(--muted)] uppercase">
              Period total
            </p>
            <div className="mt-1">
              <CostViewDisplay cost={totalsData?.total ?? emptyCost()} size="lg" />
            </div>
          </div>
        </div>
        <label className="min-w-[12rem] flex-1 text-xs font-medium text-[var(--muted)] sm:max-w-xs">
          Search
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter by name…"
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)]"
          />
        </label>
      </header>

      {error && !projectsData ? (
        <ErrorPanel
          message={error instanceof UnauthorizedError ? 'Session expired' : error.message}
          onRetry={() => void load()}
        />
      ) : (
        <>
          <KpiStrip byProvider={totalsData?.byProvider ?? []} loading={loading && !totalsData} />
          <NearLimitStrip rows={nearLimit} />
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

          {loading && !projectsData ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : filteredProjects.length === 0 ? (
            <EmptyPanel
              title="No projects in range"
              detail={search ? 'Try clearing search.' : 'Run sync or widen the date range.'}
            />
          ) : viewMode === 'cards' ? (
            <ProjectCards projects={filteredProjects} onBudgetSaved={() => void load()} />
          ) : (
            <ProjectListView projects={filteredProjects} onBudgetSaved={() => void load()} />
          )}
        </>
      )}
    </DashboardBoard>
  );
}

function emptyCost(): CostView {
  return {
    costUsd: null,
    sourceStatus: 'missing',
    sourceType: null,
    isPartial: false,
    lastSuccessfulSyncAt: null,
  };
}

export function ProjectsPage() {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <ProjectsContent />
    </Suspense>
  );
}
