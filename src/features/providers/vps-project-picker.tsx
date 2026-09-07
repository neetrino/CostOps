'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  duplicateProjectNames,
  filterAndRankProjectOptions,
} from '@/features/unmapped/filter-project-options';
import { ProviderChips } from '@/features/unmapped/provider-chips';
import type { InboxProjectOption } from '@/features/unmapped/types';

type VpsProjectPickerProps = {
  projects: InboxProjectOption[];
  value: string;
  disabled?: boolean;
  onChange: (projectId: string) => void;
};

export function VpsProjectPicker({
  projects,
  value,
  disabled = false,
  onChange,
}: VpsProjectPickerProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const duplicates = useMemo(() => duplicateProjectNames(projects), [projects]);
  const ranked = useMemo(
    () => filterAndRankProjectOptions(projects, query, null),
    [projects, query],
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
    <div ref={rootRef} className="relative min-w-[16rem]">
      <p className="text-xs font-medium text-[var(--muted)]">Project</p>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => {
          setQuery('');
          setOpen((current) => !current);
        }}
        className="mt-1 flex w-full items-start justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-left text-sm disabled:opacity-50"
      >
        {selected ? (
          <span>
            <span className="font-medium text-[var(--ink)]">{selected.name}</span>
            <span className="mt-1 block">
              <ProviderChips providerKeys={selected.providerKeys} />
            </span>
          </span>
        ) : (
          <span className="text-[var(--muted)]">Search and select a project…</span>
        )}
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
            placeholder="Search name or slug…"
            className="w-full border-b border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)]"
          />
          <ul className="max-h-64 overflow-auto py-1">
            {ranked.map((project) => (
              <li key={project.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={project.id === value}
                  onClick={() => {
                    onChange(project.id);
                    setOpen(false);
                  }}
                  className={`flex w-full flex-col items-start gap-1 px-3 py-2 text-left ${
                    project.id === value ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--canvas)]'
                  }`}
                >
                  <span className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-medium text-[var(--ink)]">{project.name}</span>
                    {duplicates.has(project.name.trim().toLowerCase()) ? (
                      <span className="text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
                        {project.slug}
                      </span>
                    ) : null}
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted)]">
                    {project.slug}
                  </span>
                  <ProviderChips providerKeys={project.providerKeys} />
                </button>
              </li>
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
