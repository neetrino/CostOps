'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  duplicateProjectNames,
  filterAndRankProjectOptions,
} from '@/features/unmapped/filter-project-options';
import { ProviderChips } from '@/features/unmapped/provider-chips';
import type { InboxProjectOption } from '@/features/unmapped/types';

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
    <div ref={rootRef} className="relative min-w-[16rem] flex-1">
      <p className="text-xs font-medium text-[var(--muted)]">Map to project</p>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          setQuery('');
          setOpen((current) => !current);
        }}
        className={`mt-1 flex w-full items-start justify-between gap-3 rounded-[var(--radius-sm)] border bg-[var(--canvas)] px-3 py-2 text-left text-sm ${
          suggestedProjectId && value === suggestedProjectId
            ? 'border-[var(--warning)]'
            : 'border-[var(--line-strong)]'
        }`}
      >
        <PickerSummary selected={selected} />
        <span className="text-[11px] text-[var(--muted)]">{open ? 'Close' : 'Search'}</span>
      </button>
      {open ? (
        <div
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--paper)] shadow-[var(--shadow-card)]"
        >
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, slug, Neon…"
            className="w-full border-b border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)]"
          />
          <ul className="max-h-64 overflow-auto py-1">
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
              <li className="px-3 py-2 text-xs text-[var(--muted)]">No projects match.</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function PickerSummary({ selected }: { selected: InboxProjectOption | null }) {
  if (!selected) {
    return (
      <span>
        <span className="font-medium text-[var(--ink)]">Keep unmapped</span>
        <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
          Stay in inbox. Save as project if this app stands alone.
        </span>
      </span>
    );
  }
  return (
    <span>
      <span className="font-medium text-[var(--ink)]">{selected.name}</span>
      <span className="mt-1 block">
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
        className={`flex w-full flex-col items-start px-3 py-2 text-left text-sm ${
          active ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--canvas)]'
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
        className={`flex w-full flex-col items-start gap-1 px-3 py-2 text-left ${
          selected ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--canvas)]'
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
        <span className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted)]">
          {project.slug}
        </span>
        <ProviderChips providerKeys={project.providerKeys} />
      </button>
    </li>
  );
}
