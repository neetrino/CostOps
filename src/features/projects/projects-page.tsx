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
import { ViewToggle } from '@/features/projects/view-toggle';
import { useBoardViewMode } from '@/features/projects/use-board-view-mode';
import type { ProjectListResponse } from '@/features/projects/types';
import { CostViewDisplay } from '@/shared/ui/cost-view-display';
import { SearchField } from '@/shared/ui/search-field';
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
  const [viewMode, setViewMode] = useBoardViewMode();
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
      <header className="surface-ledger overflow-hidden">
        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(17rem,34%)]">
          <div className="flex min-h-36 flex-col justify-between p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="money text-xs text-[var(--accent)]">01 / COMMAND</span>
              <span className="h-px flex-1 bg-[var(--line)]" />
            </div>
            <div className="mt-8">
              <h1 className="wordmark text-4xl leading-none text-[var(--ink)] sm:text-5xl">
                Projects
              </h1>
              <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
                Spend intelligence across every product and infrastructure provider.
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-between border-t border-[var(--line)] bg-[var(--inverse)] p-5 text-[var(--inverse-ink)] md:border-t-0 md:border-l">
            <p className="eyebrow !text-[color:rgba(247,246,241,.58)]">Selected period</p>
            <div className="mt-8 [&_*]:!text-[var(--inverse-ink)]">
              <CostViewDisplay cost={totalsData?.total ?? emptyCost()} size="lg" />
            </div>
          </div>
        </div>
        <div className="border-t border-[var(--line)] bg-[var(--sunken)] p-3 sm:p-4">
          <SearchField value={search} onChange={setSearch} placeholder="Search projects by name…" />
        </div>
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

          <div className="flex items-center justify-between gap-3 border-b border-[var(--line-strong)] pb-3">
            <p className="eyebrow">
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
