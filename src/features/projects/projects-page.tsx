'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
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
      <motion.header
        initial={{ opacity: 0, scale: 0.992 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.42, ease: [0.2, 0.8, 0.2, 1] }}
        className="kinetic-panel overflow-hidden"
      >
        <div className="grid xl:grid-cols-[minmax(0,1.3fr)_minmax(22rem,0.7fr)]">
          <div className="relative flex min-h-[17rem] flex-col justify-between overflow-hidden bg-[var(--accent)] p-6 text-[var(--accent-ink)] sm:p-8 lg:min-h-[21rem] lg:p-10">
            <span className="absolute top-8 right-8 size-24 rounded-full border border-[var(--accent-ink)]/15 sm:size-36" />
            <span className="absolute top-16 right-16 size-10 rounded-full bg-[var(--signal)] sm:size-14" />
            <div className="relative flex items-center gap-3">
              <span className="money text-xs font-semibold">01 / PORTFOLIO ORBIT</span>
              <span className="h-px flex-1 bg-[var(--accent-ink)]/25" />
            </div>
            <div className="relative mt-12">
              <p className="eyebrow !text-[var(--accent-ink)]/55">Spend command center</p>
              <h1 className="wordmark mt-3 text-[clamp(3.7rem,7.5vw,7.4rem)] leading-[0.78] text-[var(--accent-ink)]">
                Project
                <span className="block pl-[0.58em]">universe.</span>
              </h1>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <p className="max-w-md text-sm leading-6 text-[var(--accent-ink)]/70">
                  Every product, provider and budget signal in one living financial map.
                </p>
                <span className="money ml-auto inline-flex min-h-9 items-center rounded-full border border-[var(--accent-ink)]/20 bg-[var(--paper-raised)] px-4 text-xs font-semibold text-[var(--ink)]">
                  {filteredProjects.length} ACTIVE ORBITS
                </span>
              </div>
            </div>
          </div>
          <div className="signal-grid dark-stage relative flex min-h-[16rem] flex-col justify-between overflow-hidden p-6 sm:p-8 lg:p-10">
            <CostOrbitGraphic />
            <div className="relative z-10 flex items-center justify-between gap-3">
              <p className="eyebrow !text-white/45">Selected period</p>
              <span className="rounded-full border border-white/15 px-3 py-1 font-[family-name:var(--font-mono)] text-[9px] tracking-[0.12em] text-white/55 uppercase">
                Live ledger
              </span>
            </div>
            <div className="relative z-10 mt-16 [&_*]:!text-[var(--inverse-ink)]">
              <p className="mb-3 text-xs text-white/45">TOTAL OBSERVED SPEND</p>
              <CostViewDisplay cost={totalsData?.total ?? emptyCost()} size="lg" />
            </div>
          </div>
        </div>
        <div className="grid gap-3 border-t border-[var(--line-strong)] bg-[var(--violet-soft)] p-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:p-4">
          <span className="eyebrow hidden px-2 !text-[var(--violet)] sm:block">Find an orbit</span>
          <SearchField value={search} onChange={setSearch} placeholder="Search projects by name…" />
        </div>
      </motion.header>

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

function CostOrbitGraphic() {
  return (
    <div
      className="pointer-events-none absolute top-1/2 left-1/2 aspect-[18/13] w-[115%] -translate-x-1/2 -translate-y-1/2 opacity-70"
      aria-hidden="true"
    >
      <div className="orbit-spin size-full">
        <svg viewBox="0 0 360 260" className="size-full" fill="none">
          <ellipse cx="180" cy="130" rx="142" ry="67" stroke="var(--signal)" strokeWidth="1" />
          <ellipse
            cx="180"
            cy="130"
            rx="105"
            ry="105"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeDasharray="7 10"
          />
          <circle cx="180" cy="25" r="6" fill="var(--signal)" />
          <circle cx="38" cy="130" r="4" fill="var(--accent)" />
        </svg>
      </div>
      <svg viewBox="0 0 360 260" className="absolute inset-0 size-full" fill="none">
        <circle
          cx="180"
          cy="130"
          r="42"
          fill="var(--inverse-2)"
          stroke="white"
          strokeOpacity=".18"
        />
        <path d="M160 130h40M180 110v40" stroke="white" strokeOpacity=".5" />
      </svg>
    </div>
  );
}
