'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { CostSeriesPoint } from '@/core/cost/build-series';
import { fetchJson, UnauthorizedError } from '@/features/dashboard/api-client';
import { useDashboardUrl } from '@/features/dashboard/use-dashboard-url';
import { useUnauthorizedRedirect } from '@/features/dashboard/use-unauthorized-redirect';
import { buildCompareBarData } from '@/features/projects/chart-data';
import { DashboardBoard } from '@/features/projects/dashboard-board';
import { FilterRail } from '@/features/projects/filter-rail';
import { ProjectCompareChart } from '@/features/projects/project-compare-chart';
import { ProjectProviderSection } from '@/features/projects/project-provider-section';
import { ProjectTotalHero } from '@/features/projects/project-total-hero';
import { ProviderStackChart } from '@/features/projects/provider-stack-chart';
import type { ProjectDetailResponse } from '@/features/projects/types';
import { providerUiLabel } from '@/shared/provider-label';
import { Button } from '@/shared/ui/button';
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
          name: providerUiLabel(row.providerKey),
          cost: row.period,
        })),
      ),
    [detail?.providers],
  );

  const providerKeys = useMemo(
    () => (detail?.providers ?? []).map((provider) => provider.providerKey),
    [detail?.providers],
  );

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
        <EmptyPanel title="Project not found" detail="Check the slug or return to Projects." />
      ) : (
        <>
          <ProjectDetailHeader
            detail={detail}
            editingName={editingName}
            nameDraft={nameDraft}
            savingName={savingName}
            onNameDraft={setNameDraft}
            onStartEdit={() => setEditingName(true)}
            onCancelEdit={() => setEditingName(false)}
            onSaveName={() => void saveName()}
            onArchive={() => void archiveProject()}
          />
          <ProjectTotalHero slug={slug} detail={detail} onBudgetSaved={() => void load()} />
          <ProjectCompareChart
            data={compareData}
            title="Provider mix"
            subtitle="Period cost by mapped provider (USD)"
            emptyTitle="No comparable providers"
          />
          <ProviderStackChart points={seriesData?.points ?? []} providerKeys={providerKeys} />
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-[var(--line-strong)] pb-3">
              <h2 className="wordmark text-2xl text-[var(--ink)]">Resources</h2>
              <span className="money rounded-full bg-[var(--sunken)] px-2 py-1 text-[10px] text-[var(--muted)]">
                {detail.providers.reduce((count, provider) => count + provider.resources.length, 0)}{' '}
                linked
              </span>
            </div>
            {detail.providers.length === 0 ? (
              <EmptyPanel title="No provider links" detail="Map resources or run sync." />
            ) : (
              detail.providers.map((provider) => (
                <ProjectProviderSection key={provider.projectProviderId} provider={provider} />
              ))
            )}
          </section>
        </>
      )}
    </DashboardBoard>
  );
}

function ProjectDetailHeader({
  detail,
  editingName,
  nameDraft,
  savingName,
  onNameDraft,
  onStartEdit,
  onCancelEdit,
  onSaveName,
  onArchive,
}: {
  detail: ProjectDetailResponse;
  editingName: boolean;
  nameDraft: string;
  savingName: boolean;
  onNameDraft: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveName: () => void;
  onArchive: () => void;
}) {
  return (
    <header className="surface-ledger overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow">
            <Link href="/" className="hover:text-[var(--accent)]">
              Projects
            </Link>
            {' · '}
            {detail.range.from} → {detail.range.to}
          </p>
          {!detail.project.archived ? (
            <Button variant="secondary" className="text-xs" onClick={onArchive}>
              Archive
            </Button>
          ) : null}
        </div>
        {editingName ? (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={nameDraft}
              onChange={(event) => onNameDraft(event.target.value)}
              className="field-control max-w-xl text-xl font-semibold"
              aria-label="Project name"
            />
            <Button variant="secondary" disabled={savingName} onClick={onSaveName}>
              Save
            </Button>
            <Button variant="ghost" onClick={onCancelEdit}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap items-end gap-3">
            <h1 className="wordmark min-w-0 text-4xl leading-none text-[var(--ink)] sm:text-5xl">
              {detail.project.name}
            </h1>
            {!detail.project.archived ? (
              <Button variant="ghost" className="text-xs" onClick={onStartEdit}>
                Rename
              </Button>
            ) : null}
          </div>
        )}
        <p className="money mt-2 text-xs text-[var(--muted)]">
          {detail.project.slug}
          {detail.project.archived ? ' · Archived' : ''}
        </p>
      </div>
      <div className="flex items-center gap-3 border-t border-[var(--line)] bg-[var(--sunken)] px-5 py-3 text-xs text-[var(--muted)]">
        <span className="size-2 rounded-full bg-[var(--ok)]" />
        Mapped provider costs only · missing days remain gaps
      </div>
    </header>
  );
}

export function ProjectDetailPage() {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <ProjectDetailContent />
    </Suspense>
  );
}
