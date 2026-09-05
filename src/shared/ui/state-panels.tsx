import { Button } from '@/shared/ui/button';

type ErrorPanelProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorPanel({ message, onRetry }: ErrorPanelProps) {
  return (
    <div
      className="rounded-[var(--radius)] border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 py-6 text-sm text-[var(--danger)]"
      role="alert"
    >
      <p className="font-medium">{message}</p>
      {onRetry ? (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}

type EmptyPanelProps = {
  title: string;
  detail?: string;
};

export function EmptyPanel({ title, detail }: EmptyPanelProps) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-6 py-10 text-center">
      <p className="font-medium text-[var(--ink)]">{title}</p>
      {detail ? <p className="mt-2 text-sm text-[var(--muted)]">{detail}</p> : null}
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
    <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[var(--shadow-card)]">
      <SkeletonBlock className="h-5 w-2/5" />
      <SkeletonBlock className="mt-4 h-8 w-1/3" />
      <SkeletonBlock className="mt-6 h-16 w-full" />
    </div>
  );
}
