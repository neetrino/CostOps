import type { ReactNode } from 'react';
import { Button } from '@/shared/ui/button';
import { AppIcon } from '@/shared/ui/app-icon';

type ErrorPanelProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorPanel({ message, onRetry }: ErrorPanelProps) {
  return (
    <div
      className="relative overflow-hidden rounded-[var(--radius)] border border-[var(--danger)]/25 bg-[var(--paper-raised)] shadow-[var(--shadow-card)]"
      role="alert"
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-[var(--danger)]" aria-hidden />
      <div className="flex flex-col gap-5 p-5 pl-6 sm:flex-row sm:items-center sm:justify-between sm:p-6 sm:pl-7">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--danger-soft)] text-[var(--danger)]">
            <AppIcon name="alert" size={20} />
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="eyebrow text-[var(--danger)]">Could not load</p>
            <p className="mt-1.5 text-sm leading-6 text-[var(--ink)]">{message}</p>
          </div>
        </div>
        {onRetry ? (
          <Button variant="secondary" className="min-h-12 shrink-0 sm:min-h-11" onClick={onRetry}>
            <AppIcon name="sync" size={17} />
            Try again
          </Button>
        ) : null}
      </div>
    </div>
  );
}

type EmptyPanelProps = {
  title: string;
  detail?: string;
  action?: ReactNode;
};

export function EmptyPanel({ title, detail, action }: EmptyPanelProps) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-5 py-10 text-center shadow-[var(--shadow)] sm:px-8 sm:py-14">
      <EmptyLedgerMark />
      <p className="eyebrow mt-6">No entries</p>
      <p className="wordmark mt-2 text-2xl leading-tight text-[var(--ink)]">{title}</p>
      {detail ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">{detail}</p>
      ) : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-[var(--radius-sm)] bg-[var(--line)] ${className}`}
      aria-hidden
    />
  );
}

export function CardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper-raised)] shadow-[var(--shadow-card)]"
      role="status"
    >
      <span className="sr-only">Loading content</span>
      <div className="border-b border-[var(--line)] bg-[var(--sunken)] px-5 py-4" aria-hidden>
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="mt-3 h-5 w-2/5" />
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-6 p-5" aria-hidden>
        <div>
          <SkeletonBlock className="h-2.5 w-14" />
          <SkeletonBlock className="mt-3 h-8 w-24" />
        </div>
        <div>
          <SkeletonBlock className="h-2.5 w-16" />
          <SkeletonBlock className="mt-3 h-8 w-20" />
        </div>
        <SkeletonBlock className="col-span-2 h-14 w-full" />
      </div>
    </div>
  );
}

function EmptyLedgerMark() {
  return (
    <span
      className="relative mx-auto block h-14 w-14 rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--paper-raised)] shadow-[var(--shadow)]"
      aria-hidden
    >
      <span className="absolute inset-x-3 top-3 h-px bg-[var(--line-strong)]" />
      <span className="absolute inset-x-3 top-6 h-px bg-[var(--line-strong)]" />
      <span className="absolute inset-x-3 top-9 h-px bg-[var(--line-strong)]" />
      <span className="absolute inset-y-3 left-6 w-px bg-[var(--line)]" />
    </span>
  );
}
