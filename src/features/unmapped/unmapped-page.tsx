'use client';

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchJson, UnauthorizedError } from '@/features/dashboard/api-client';
import { useDashboardUrl } from '@/features/dashboard/use-dashboard-url';
import { useUnauthorizedRedirect } from '@/features/dashboard/use-unauthorized-redirect';
import { ArchivedRow } from '@/features/unmapped/archived-row';
import { UnmappedRow } from '@/features/unmapped/unmapped-row';
import type {
  InboxProjectOption,
  InboxResourcesResponse,
  ProjectOptionsResponse,
} from '@/features/unmapped/types';
import { FilterRail } from '@/features/projects/filter-rail';
import { CardSkeleton, EmptyPanel, ErrorPanel } from '@/shared/ui/state-panels';

type InboxTab = InboxResourcesResponse['inbox'];

function UnmappedContent() {
  const { state, queryString, replaceState } = useDashboardUrl();
  const [tab, setTab] = useState<InboxTab>('open');
  const [data, setData] = useState<InboxResourcesResponse | null>(null);
  const [projects, setProjects] = useState<InboxProjectOption[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  useUnauthorizedRedirect(error);

  const applyInbox = useCallback(
    (inbox: InboxResourcesResponse, options: ProjectOptionsResponse) => {
      setData(inbox);
      setProjects(options.projects);
    },
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const path = tab === 'archived' ? '/api/resources/archived' : '/api/resources/unmapped';
      const [inbox, options] = await Promise.all([
        fetchJson<InboxResourcesResponse>(`${path}${queryString}`),
        fetchJson<ProjectOptionsResponse>('/api/projects/options'),
      ]);
      applyInbox(inbox, options);
    } catch (err) {
      setData(null);
      setProjects([]);
      setError(err instanceof Error ? err : new Error('Failed to load inbox'));
    } finally {
      setLoading(false);
    }
  }, [applyInbox, queryString, tab]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const path = tab === 'archived' ? '/api/resources/archived' : '/api/resources/unmapped';
        const [inbox, options] = await Promise.all([
          fetchJson<InboxResourcesResponse>(`${path}${queryString}`),
          fetchJson<ProjectOptionsResponse>('/api/projects/options'),
        ]);
        if (cancelled) {
          return;
        }
        applyInbox(inbox, options);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setData(null);
        setProjects([]);
        setError(err instanceof Error ? err : new Error('Failed to load inbox'));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyInbox, queryString, tab]);

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
        <InboxHeader
          tab={tab}
          openCount={data?.openCount ?? 0}
          archivedCount={data?.archivedCount ?? 0}
          rangeLabel={`${data?.range.from ?? '…'} → ${data?.range.to ?? '…'}`}
          search={search}
          onTab={setTab}
          onSearch={setSearch}
        />
        {error && !data ? (
          <ErrorPanel
            message={error instanceof UnauthorizedError ? 'Session expired' : error.message}
            onRetry={() => void load()}
          />
        ) : loading && (!data || data.inbox !== tab) ? (
          <CardSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyPanel
            title={search ? 'No matches' : tab === 'archived' ? 'Archive empty' : 'Inbox clear'}
            detail={
              search
                ? 'Try clearing search.'
                : tab === 'archived'
                  ? 'Nothing hidden. Archived rows can be restored.'
                  : 'All discovered resources are mapped or archived.'
            }
          />
        ) : (
          <ul className="space-y-3">
            {filtered.map((resource) =>
              data?.inbox === 'archived' ? (
                <ArchivedRow key={resource.id} resource={resource} onChanged={() => void load()} />
              ) : (
                <UnmappedRow
                  key={resource.id}
                  resource={resource}
                  projects={projects}
                  onChanged={() => void load()}
                />
              ),
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function InboxHeader({
  tab,
  openCount,
  archivedCount,
  rangeLabel,
  search,
  onTab,
  onSearch,
}: {
  tab: InboxTab;
  openCount: number;
  archivedCount: number;
  rangeLabel: string;
  search: string;
  onTab: (tab: InboxTab) => void;
  onSearch: (value: string) => void;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="wordmark text-3xl text-[var(--ink)]">Unmapped</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Resources without a project · {rangeLabel}. Mapping is optional. A project can have only
          Neon, only Vercel, or only Upstash.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <TabButton active={tab === 'open'} onClick={() => onTab('open')}>
            Inbox {openCount}
          </TabButton>
          <TabButton active={tab === 'archived'} onClick={() => onTab('archived')}>
            Archived {archivedCount}
          </TabButton>
        </div>
      </div>
      <label className="min-w-[12rem] flex-1 text-xs font-medium text-[var(--muted)] sm:max-w-xs">
        Search
        <input
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Name, id, provider…"
          className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)]"
        />
      </label>
    </header>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium ${
        active
          ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
          : 'bg-[var(--paper)] text-[var(--muted)] border border-[var(--line)] hover:text-[var(--ink)]'
      }`}
    >
      {children}
    </button>
  );
}

export function UnmappedPage() {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <UnmappedContent />
    </Suspense>
  );
}
