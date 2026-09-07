'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { CostSeriesPoint } from '@/core/cost/build-series';
import type { CostView } from '@/core/cost/types';
import { fetchJson, UnauthorizedError } from '@/features/dashboard/api-client';
import { useDashboardUrl } from '@/features/dashboard/use-dashboard-url';
import { useUnauthorizedRedirect } from '@/features/dashboard/use-unauthorized-redirect';
import { buildCompareBarData } from '@/features/projects/chart-data';
import { FilterRail } from '@/features/projects/filter-rail';
import { KpiStrip } from '@/features/projects/kpi-strip';
import { ProjectCards } from '@/features/projects/project-cards';
import { ProjectCompareChart } from '@/features/projects/project-compare-chart';
import { ProjectListView } from '@/features/projects/project-list-view';
import { UsageSeriesChart } from '@/features/projects/usage-series-chart';
import type { ProjectListResponse } from '@/features/projects/types';
import { Button } from '@/shared/ui/button';
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

type ViewMode = 'cards' | 'list';

function ProjectsContent() {
  const { state, queryString, replaceState } = useDashboardUrl();
  const [projectsData, setProjectsData] = useState<ProjectListResponse | null>(null);
  const [totalsData, setTotalsData] = useState<UsageTotalsResponse | null>(null);
  const [seriesData, setSeriesData] = useState<UsageSeriesResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
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
    if (!term) {
      return list;
    }
    return list.filter((project) => project.name.toLowerCase().includes(term));
  }, [projectsData?.projects, search]);

  const projectNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const project of projectsData?.projects ?? []) {
      map[project.id] = project.name;
    }
    return map;
  }, [projectsData?.projects]);

  const compareData = useMemo(
    () =>
      buildCompareBarData(
        (totalsData?.byProject ?? []).map((row) => ({
          projectId: row.projectId,
          name: row.name,
          cost: row.cost,
        })),
      ),
    [totalsData?.byProject],
  );

  return (
    <div className="flex flex-col lg:flex-row lg:gap-0">
      <FilterRail
        state={state}
        onChange={replaceState}
        onRefresh={() => void load()}
        loading={loading}
      />
      <div className="min-w-0 flex-1 space-y-6 p-4 lg:p-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="wordmark text-3xl text-[var(--ink)]">Projects</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Daily board · {projectsData?.range.from ?? '…'} → {projectsData?.range.to ?? '…'}
            </p>
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
            <KpiStrip
              total={totalsData?.total ?? emptyCost()}
              byProvider={totalsData?.byProvider ?? []}
              loading={loading && !totalsData}
            />
            <div className="grid gap-6 xl:grid-cols-2">
              <ProjectCompareChart data={compareData} />
              <UsageSeriesChart points={seriesData?.points ?? []} projectNames={projectNames} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[var(--muted)]">
                {filteredProjects.length} project{filteredProjects.length === 1 ? '' : 's'}
              </p>
              <div className="flex gap-1 rounded-[var(--radius-sm)] border border-[var(--line)] p-1">
                <ViewToggle active={viewMode === 'cards'} onClick={() => setViewMode('cards')}>
                  Cards
                </ViewToggle>
                <ViewToggle active={viewMode === 'list'} onClick={() => setViewMode('list')}>
                  List
                </ViewToggle>
              </div>
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
      </div>
    </div>
  );
}

function ViewToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant={active ? 'primary' : 'ghost'}
      className="px-3 py-1.5 text-xs"
      onClick={onClick}
    >
      {children}
    </Button>
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
