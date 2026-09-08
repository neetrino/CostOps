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
import { ViewToggle } from '@/features/projects/view-toggle';
import { useBoardViewMode } from '@/features/projects/use-board-view-mode';
import type { ProviderDetailResponse } from '@/features/providers/load-provider-detail';
import { BackfillPeriodButton } from '@/features/providers/backfill-period-button';
import { ProviderProjectCards } from '@/features/providers/provider-project-cards';
import { ProviderProjectList } from '@/features/providers/provider-project-list';
import { VpsAddProject } from '@/features/providers/vps-add-project';
import { isFixedVpsProvider } from '@/shared/provider-label';
import { CostViewDisplay } from '@/shared/ui/cost-view-display';
import { CardSkeleton, EmptyPanel, ErrorPanel } from '@/shared/ui/state-panels';
import { SearchField } from '@/shared/ui/search-field';

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
  const [viewMode, setViewMode] = useBoardViewMode();
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
          <header className="surface-ledger overflow-hidden">
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="money text-xs text-[var(--accent)]">
                    PROVIDER / {detail.provider.key}
                  </span>
                  <span className="h-px w-12 bg-[var(--accent-mid)]" />
                </div>
                <h1 className="wordmark mt-6 text-4xl leading-none text-[var(--ink)] sm:text-5xl">
                  {detail.provider.displayName}
                </h1>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {detail.range.from} → {detail.range.to} · Sync now refreshes today
                </p>
              </div>
              <BackfillPeriodButton
                providerKey={detail.provider.key}
                from={detail.range.from}
                to={detail.range.to}
                onComplete={() => void load()}
              />
            </div>
            <div className="border-t border-[var(--line)] bg-[var(--sunken)] p-3 sm:p-4">
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder="Search this provider's projects…"
              />
            </div>
          </header>

          {isFixedVpsProvider(detail.provider.key) ? (
            <VpsAddProject onAdded={() => void load()} />
          ) : null}

          <div className="grid overflow-hidden rounded-[var(--radius)] border border-[var(--line-strong)] bg-[var(--paper-raised)] shadow-[var(--shadow-card)] sm:grid-cols-3">
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

          <div className="flex items-center justify-between gap-3 border-b border-[var(--line-strong)] pb-3">
            <p className="eyebrow">
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
      className={`min-h-32 border-b border-[var(--line)] px-5 py-5 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0 ${accent ? 'bg-[var(--inverse)] text-[var(--inverse-ink)]' : ''}`}
    >
      <p className={`eyebrow ${accent ? '!text-[color:rgba(247,246,241,.58)]' : ''}`}>{label}</p>
      <div className={`mt-5 ${accent ? '[&_*]:!text-[var(--inverse-ink)]' : ''}`}>
        <CostViewDisplay cost={cost} size="lg" />
      </div>
    </div>
  );
}

function UnmappedTile({ unmapped }: { unmapped: ProviderDetailResponse['unmapped'] }) {
  return (
    <div className="min-h-32 bg-[var(--warning-soft)] px-5 py-5">
      <p className="eyebrow">Unmapped spend</p>
      <p className="money mt-4 text-3xl font-semibold text-[var(--ink)]">{unmapped.count}</p>
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
