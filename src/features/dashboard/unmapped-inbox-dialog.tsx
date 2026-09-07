'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import type { InboxStatusPreview } from '@/features/unmapped/types';
import { Button } from '@/shared/ui/button';

export function UnmappedInboxDialog({
  count,
  preview,
  onDismiss,
}: {
  count: number;
  preview: InboxStatusPreview[];
  onDismiss: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--ink)]/45"
        aria-label="Dismiss inbox reminder"
        onClick={onDismiss}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="unmapped-inbox-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-[var(--radius)] border border-[var(--line-strong)] bg-[var(--paper)] p-6 shadow-[var(--shadow-card)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-[var(--muted)] uppercase">
              Inbox
            </p>
            <h2 id="unmapped-inbox-title" className="wordmark mt-1 text-2xl text-[var(--ink)]">
              Unmapped resources
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onDismiss}
            className="rounded-[var(--radius-sm)] px-2 py-1 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--canvas)] hover:text-[var(--ink)]"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="mt-3 text-sm text-[var(--muted)]">
          {count} {count === 1 ? 'item needs' : 'items need'} a decision. Map to an existing
          project, Save as project for a single-provider app, or Archive leftovers.
        </p>
        <ul className="mt-4 max-h-[40vh] space-y-2 overflow-auto">
          {preview.map((row) => (
            <li
              key={row.id}
              className="rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--canvas)] px-3 py-2"
            >
              <p className="text-sm font-medium text-[var(--ink)]">{row.displayName}</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                {row.providerKey}
                {row.suggestion
                  ? ` · suggested ${row.suggestion.projectName}`
                  : ' · no confident match'}
              </p>
            </li>
          ))}
          {count > preview.length ? (
            <li className="text-xs text-[var(--muted)]">
              +{count - preview.length} more in the inbox
            </li>
          ) : null}
        </ul>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <Button variant="ghost" onClick={onDismiss}>
            Not now
          </Button>
          <Link
            href="/unmapped"
            onClick={onDismiss}
            className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-transparent bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-[var(--accent-ink)] hover:opacity-90"
          >
            Open Unmapped
          </Link>
        </div>
      </div>
    </div>
  );
}
