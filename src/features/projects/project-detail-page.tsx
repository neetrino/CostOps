'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { fetchJson, UnauthorizedError } from '@/features/dashboard/api-client';
import type { DashboardUrlState } from '@/features/dashboard/dashboard-url';
import { useDashboardRefresh } from '@/features/dashboard/use-dashboard-refresh';
import { useDashboardUrl } from '@/features/dashboard/use-dashboard-url';
import { useUnauthorizedRedirect } from '@/features/dashboard/use-unauthorized-redirect';
import type { ProjectDetailBoardPayload } from '@/features/projects/load-project-detail-board';
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

function ProjectDetailContent({ board }: { board: ProjectDetailBoardPayload }) {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { state, replaceState } = useDashboardUrl();
  const { isPending, startTransition, refresh, bustAndRefresh } = useDashboardRefresh();
  const detail = board.detail;
  const seriesData = board.series;
  const projects = board.options.projects;
  const [error, setError] = useState<Error | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(detail.project.name);
  const [savingName, setSavingName] = useState(false);
  useUnauthorizedRedirect(error);
  const loading = isPending;

  const onFilterChange = (patch: Partial<DashboardUrlState>) => {
    startTransition(() => replaceState(patch));
  };

  const compareData = useMemo(
    () =>
      buildCompareBarData(
        detail.providers.map((row) => ({
          projectId: row.projectProviderId,
          name: providerUiLabel(row.providerKey),
          cost: row.period,
        })),
      ),
    [detail.providers],
  );

  const providerKeys = useMemo(
    () => detail.providers.map((provider) => provider.providerKey),
    [detail.providers],
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
      refresh();
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
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Archive failed'));
    }
  };

  return (
    <DashboardBoard
      rail={
        <FilterRail
          state={state}
          onChange={onFilterChange}
          onRefresh={bustAndRefresh}
          loading={loading}
        />
      }
    >
      {error ? (
        <ErrorPanel
          message={error instanceof UnauthorizedError ? 'Session expired' : error.message}
          onRetry={bustAndRefresh}
        />
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
          <ProjectTotalHero slug={slug} detail={detail} onBudgetSaved={refresh} />
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
                <ProjectProviderSection
                  key={provider.projectProviderId}
                  provider={provider}
                  currentProjectId={detail.project.id}
                  projects={projects}
                  onMappingChanged={refresh}
                />
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
    <header className="kinetic-panel overflow-hidden">
      <div className="tone-violet signal-grid relative overflow-hidden p-6 sm:p-8 lg:p-10">
        <span className="absolute -top-12 right-12 size-44 rounded-full border border-white/15" />
        <span className="absolute top-10 right-24 size-12 rounded-full bg-[var(--signal)]" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow !text-white/55">
            <Link href="/" className="hover:text-[var(--signal)]">
              Projects
            </Link>
            {' · '}
            {detail.range.from} → {detail.range.to}
          </p>
          {!detail.project.archived ? (
            <Button
              variant="secondary"
              className="border-white/20 bg-white/10 text-xs text-white hover:border-white/40 hover:bg-white/15"
              onClick={onArchive}
            >
              Archive
            </Button>
          ) : null}
        </div>
        {editingName ? (
          <div className="relative mt-10 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={nameDraft}
              onChange={(event) => onNameDraft(event.target.value)}
              className="field-control light-stage max-w-xl text-xl font-semibold"
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
          <div className="relative mt-10 flex flex-wrap items-end gap-3">
            <h1 className="wordmark min-w-0 text-[clamp(3.5rem,7vw,6.7rem)] leading-[0.82] text-[var(--ink)]">
              {detail.project.name}
            </h1>
            {!detail.project.archived ? (
              <Button
                variant="ghost"
                className="border border-white/15 bg-white/8 text-xs text-white hover:bg-white/15"
                onClick={onStartEdit}
              >
                Rename
              </Button>
            ) : null}
          </div>
        )}
        <p className="money relative mt-4 text-xs text-[var(--muted)]">
          {detail.project.slug}
          {detail.project.archived ? ' · Archived' : ''}
        </p>
      </div>
      <div className="tone-signal flex items-center gap-3 border-t border-[var(--line)] px-5 py-3 text-xs text-[var(--muted)]">
        <span className="signal-pulse size-2 rounded-full bg-[var(--accent)]" />
        Mapped provider costs only · missing days remain gaps
      </div>
    </header>
  );
}

export function ProjectDetailPage({ board }: { board: ProjectDetailBoardPayload }) {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <ProjectDetailContent board={board} />
    </Suspense>
  );
}
