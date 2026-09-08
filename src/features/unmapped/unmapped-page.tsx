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
import { DashboardBoard } from '@/features/projects/dashboard-board';
import { FilterRail } from '@/features/projects/filter-rail';
import { AppIcon } from '@/shared/ui/app-icon';
import { SearchField } from '@/shared/ui/search-field';
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
    </DashboardBoard>
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
    <header className="surface-ledger overflow-hidden">
      <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
        <div className="min-w-0 max-w-3xl">
          <div className="mb-4 flex size-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--warning-soft)] text-[var(--warning)]">
            <AppIcon name="inbox" size={22} />
          </div>
          <p className="eyebrow">Allocation inbox</p>
          <h1 className="wordmark mt-2 text-3xl text-[var(--ink)] sm:text-4xl">Unmapped spend</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Decide where newly discovered resources belong. Mapping is optional, and every action
            preserves cost history.
          </p>
        </div>
        <div className="space-y-3">
          <SearchField
            value={search}
            onChange={onSearch}
            placeholder="Name, ID, or provider…"
            label="Search unmapped resources"
          />
          <p className="truncate text-[11px] text-[var(--muted)]" title={rangeLabel}>
            Cost window · {rangeLabel}
          </p>
        </div>
      </div>
      <div
        className="grid grid-cols-2 border-t border-[var(--line)] bg-[var(--sunken)] p-1.5 sm:flex sm:w-full sm:justify-start sm:gap-1"
        role="tablist"
        aria-label="Inbox view"
      >
        <TabButton active={tab === 'open'} count={openCount} onClick={() => onTab('open')}>
          Needs decision
        </TabButton>
        <TabButton
          active={tab === 'archived'}
          count={archivedCount}
          onClick={() => onTab('archived')}
        >
          Archived
        </TabButton>
      </div>
    </header>
  );
}

function TabButton({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count: number;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] px-3.5 py-2 text-xs font-semibold transition-colors sm:min-h-10 ${
        active
          ? 'bg-[var(--paper-raised)] text-[var(--ink)] shadow-[var(--shadow)]'
          : 'text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]'
      }`}
    >
      {children}
      <span
        className={`money rounded-full px-2 py-0.5 text-[10px] ${
          active
            ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
            : 'bg-[var(--line)] text-[var(--muted)]'
        }`}
      >
        {count}
      </span>
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
