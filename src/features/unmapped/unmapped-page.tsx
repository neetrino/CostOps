'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { CostView } from '@/core/cost/types';
import type { RangePayload } from '@/shared/dashboard-query';
import { fetchJson, UnauthorizedError } from '@/features/dashboard/api-client';
import { useDashboardUrl } from '@/features/dashboard/use-dashboard-url';
import { useUnauthorizedRedirect } from '@/features/dashboard/use-unauthorized-redirect';
import { FilterRail } from '@/features/projects/filter-rail';
import type { ProjectListResponse } from '@/features/projects/types';
import { Button } from '@/shared/ui/button';
import { CostViewDisplay } from '@/shared/ui/cost-view-display';
import { CardSkeleton, EmptyPanel, ErrorPanel } from '@/shared/ui/state-panels';

type UnmappedResourceRow = {
  id: string;
  providerKey: string;
  providerAccountId: string;
  externalId: string;
  displayName: string;
  resourceType: string;
  discoveredAt: string;
  today: CostView;
  period: CostView;
};

type UnmappedResponse = {
  range: RangePayload;
  resources: UnmappedResourceRow[];
};

function UnmappedContent() {
  const { state, queryString, replaceState } = useDashboardUrl();
  const [data, setData] = useState<UnmappedResponse | null>(null);
  const [projects, setProjects] = useState<ProjectListResponse['projects']>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  useUnauthorizedRedirect(error);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [unmapped, projectList] = await Promise.all([
        fetchJson<UnmappedResponse>(`/api/resources/unmapped${queryString}`),
        fetchJson<ProjectListResponse>(`/api/projects${queryString}`),
      ]);
      setData(unmapped);
      setProjects(projectList.projects);
    } catch (err) {
      setData(null);
      setProjects([]);
      setError(err instanceof Error ? err : new Error('Failed to load unmapped resources'));
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
        const [unmapped, projectList] = await Promise.all([
          fetchJson<UnmappedResponse>(`/api/resources/unmapped${queryString}`),
          fetchJson<ProjectListResponse>(`/api/projects${queryString}`),
        ]);
        if (cancelled) {
          return;
        }
        setData(unmapped);
        setProjects(projectList.projects);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setData(null);
        setProjects([]);
        setError(err instanceof Error ? err : new Error('Failed to load unmapped resources'));
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

  const filtered = useMemo(() => {
    const list = data?.resources ?? [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return list;
    }
    return list.filter(
      (row) =>
        row.displayName.toLowerCase().includes(term) ||
        row.externalId.toLowerCase().includes(term) ||
        row.providerKey.toLowerCase().includes(term),
    );
  }, [data?.resources, search]);

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
            <h1 className="wordmark text-3xl text-[var(--ink)]">Unmapped</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Resources without a project · {data?.range.from ?? '…'} → {data?.range.to ?? '…'}
            </p>
          </div>
          <label className="min-w-[12rem] flex-1 text-xs font-medium text-[var(--muted)] sm:max-w-xs">
            Search
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, id, provider…"
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)]"
            />
          </label>
        </header>

        {error && !data ? (
          <ErrorPanel
            message={error instanceof UnauthorizedError ? 'Session expired' : error.message}
            onRetry={() => void load()}
          />
        ) : loading && !data ? (
          <CardSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyPanel
            title={search ? 'No matches' : 'Inbox clear'}
            detail={
              search ? 'Try clearing search.' : 'All discovered resources are mapped to projects.'
            }
          />
        ) : (
          <ul className="space-y-3">
            {filtered.map((resource) => (
              <UnmappedRow
                key={resource.id}
                resource={resource}
                projects={projects}
                onMapped={() => void load()}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function UnmappedRow({
  resource,
  projects,
  onMapped,
}: {
  resource: UnmappedResourceRow;
  projects: ProjectListResponse['projects'];
  onMapped: () => void;
}) {
  const [projectId, setProjectId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapResource = async () => {
    if (!projectId) {
      setError('Select a project first.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await fetchJson(`/api/resources/${resource.id}/mapping`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      onMapped();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mapping failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[var(--ink)]">{resource.displayName}</p>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-[var(--muted)]">
            {resource.providerKey} · {resource.resourceType} · {resource.externalId}
          </p>
          <p className="mt-1 text-[11px] text-[var(--muted)]">
            Discovered {resource.discoveredAt.slice(0, 10)}
          </p>
        </div>
        <div className="flex shrink-0 gap-6 text-right">
          <div>
            <p className="text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
              Period
            </p>
            <CostViewDisplay cost={resource.period} size="sm" />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
              Today
            </p>
            <CostViewDisplay cost={resource.today} size="sm" />
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-[var(--line)] pt-4">
        <label className="min-w-[12rem] flex-1 text-xs font-medium text-[var(--muted)]">
          Map to project
          <select
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--canvas)] px-3 py-2 text-sm text-[var(--ink)]"
          >
            <option value="">Select…</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <Button variant="secondary" disabled={saving} onClick={() => void mapResource()}>
          {saving ? 'Saving…' : 'Map'}
        </Button>
      </div>
      {error ? <p className="mt-2 text-xs text-[var(--danger)]">{error}</p> : null}
    </li>
  );
}

export function UnmappedPage() {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <UnmappedContent />
    </Suspense>
  );
}
