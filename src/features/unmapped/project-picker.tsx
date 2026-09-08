'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  duplicateProjectNames,
  filterAndRankProjectOptions,
} from '@/features/unmapped/filter-project-options';
import { ProviderChips } from '@/features/unmapped/provider-chips';
import type { InboxProjectOption } from '@/features/unmapped/types';
import { AppIcon } from '@/shared/ui/app-icon';
import { MobileSheet } from '@/shared/ui/mobile-sheet';
import { SearchField } from '@/shared/ui/search-field';

export function ProjectPicker({
  projects,
  value,
  suggestedProjectId,
  onChange,
}: {
  projects: InboxProjectOption[];
  value: string;
  suggestedProjectId: string | null;
  onChange: (projectId: string) => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const duplicates = useMemo(() => duplicateProjectNames(projects), [projects]);
  const ranked = useMemo(
    () => filterAndRankProjectOptions(projects, query, suggestedProjectId),
    [projects, query, suggestedProjectId],
  );
  const selected = projects.find((project) => project.id === value) ?? null;

  useEffect(() => {
    if (!open) {
      return;
    }
    searchRef.current?.focus();
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <p className="mb-1.5 text-xs font-medium text-[var(--muted)]">Map to project</p>

      <div className="sm:hidden">
        <MobileSheet
          title="Choose a project"
          description="Search by name, slug, or provider"
          triggerClassName={`flex min-h-12 w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] border bg-[var(--paper-raised)] px-3.5 py-2.5 text-left ${
            suggestedProjectId && value === suggestedProjectId
              ? 'border-[var(--warning)]'
              : 'border-[var(--line-strong)]'
          }`}
          trigger={
            <>
              <PickerSummary selected={selected} />
              <AppIcon name="arrow" size={17} className="shrink-0 text-[var(--muted)]" />
            </>
          }
        >
          {(close) => (
            <div className="p-4 pb-2">
              <SearchField
                value={query}
                onChange={setQuery}
                placeholder="Search projects…"
                label="Search projects"
              />
              <ul role="listbox" className="mt-3 space-y-1">
                <KeepUnmappedRow
                  active={!value}
                  onSelect={() => {
                    onChange('');
                    close();
                  }}
                />
                {ranked.map((project) => (
                  <ProjectOptionRow
                    key={project.id}
                    project={project}
                    selected={project.id === value}
                    suggested={project.id === suggestedProjectId}
                    showSlug={duplicates.has(project.name.trim().toLowerCase())}
                    onSelect={() => {
                      onChange(project.id);
                      close();
                    }}
                  />
                ))}
                {ranked.length === 0 ? (
                  <li className="px-3 py-8 text-center text-xs text-[var(--muted)]">
                    No projects match.
                  </li>
                ) : null}
              </ul>
            </div>
          )}
        </MobileSheet>
      </div>

      <div className="hidden sm:block">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => {
            setQuery('');
            setOpen((current) => !current);
          }}
          className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] border bg-[var(--paper-raised)] px-3 py-2 text-left text-sm transition-colors hover:border-[var(--accent)] ${
            suggestedProjectId && value === suggestedProjectId
              ? 'border-[var(--warning)]'
              : 'border-[var(--line-strong)]'
          }`}
        >
          <PickerSummary selected={selected} />
          <span className="text-[11px] font-medium text-[var(--muted)]">
            {open ? 'Close' : 'Choose'}
          </span>
        </button>
        {open ? (
          <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--paper-raised)] shadow-[var(--shadow-popover)]">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, slug, provider…"
              aria-label="Search projects"
              className="field-control rounded-none border-x-0 border-t-0 text-sm"
            />
            <ul id={listId} role="listbox" className="max-h-72 overflow-auto p-1">
              <KeepUnmappedRow
                active={!value}
                onSelect={() => {
                  onChange('');
                  setOpen(false);
                }}
              />
              {ranked.map((project) => (
                <ProjectOptionRow
                  key={project.id}
                  project={project}
                  selected={project.id === value}
                  suggested={project.id === suggestedProjectId}
                  showSlug={duplicates.has(project.name.trim().toLowerCase())}
                  onSelect={() => {
                    onChange(project.id);
                    setOpen(false);
                  }}
                />
              ))}
              {ranked.length === 0 ? (
                <li className="px-3 py-6 text-center text-xs text-[var(--muted)]">
                  No projects match.
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PickerSummary({ selected }: { selected: InboxProjectOption | null }) {
  if (!selected) {
    return (
      <span>
        <span className="font-medium text-[var(--ink)]">Not assigned</span>
        <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
          Stay in inbox. Save as project if this app stands alone.
        </span>
      </span>
    );
  }
  return (
    <span className="min-w-0">
      <span className="block truncate font-medium text-[var(--ink)]">{selected.name}</span>
      <span className="mt-1 hidden sm:block">
        <ProviderChips providerKeys={selected.providerKeys} />
      </span>
    </span>
  );
}

function KeepUnmappedRow({ active, onSelect }: { active: boolean; onSelect: () => void }) {
  return (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={active}
        onClick={onSelect}
        className={`flex min-h-12 w-full flex-col items-start rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm transition-colors ${
          active ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--sunken)]'
        }`}
      >
        <span className="font-medium text-[var(--ink)]">Keep unmapped</span>
        <span className="text-[11px] text-[var(--muted)]">Stay off project totals</span>
      </button>
    </li>
  );
}

function ProjectOptionRow({
  project,
  selected,
  suggested,
  showSlug,
  onSelect,
}: {
  project: InboxProjectOption;
  selected: boolean;
  suggested: boolean;
  showSlug: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={selected}
        onClick={onSelect}
        className={`flex min-h-12 w-full flex-col items-start gap-1 rounded-[var(--radius-sm)] px-3 py-2 text-left transition-colors ${
          selected ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--sunken)]'
        }`}
      >
        <span className="flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-medium text-[var(--ink)]">{project.name}</span>
          {suggested ? (
            <span className="text-[10px] font-semibold tracking-wide text-[var(--warning)] uppercase">
              Suggested
            </span>
          ) : null}
          {showSlug ? (
            <span className="text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
              Same name
            </span>
          ) : null}
        </span>
        <span className="money text-[11px] text-[var(--muted)]">{project.slug}</span>
        <ProviderChips providerKeys={project.providerKeys} />
      </button>
    </li>
  );
}
