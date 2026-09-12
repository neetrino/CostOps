import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_NAME } from '@/config/constants';
import { CostOpsMark } from '@/shared/ui/costops-mark';

export const metadata: Metadata = {
  title: `Offline · ${APP_NAME}`,
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--canvas)] px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper-raised)] p-8 shadow-[var(--shadow-card)]">
        <CostOpsMark size={44} className="text-[var(--signal)]" />
        <p className="eyebrow mt-6">Offline</p>
        <h1 className="wordmark mt-2 text-3xl leading-tight text-[var(--ink)]">
          {APP_NAME} needs a network
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Spend figures stay live from providers. Reconnect, then open the board again.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] px-3.5 py-2 text-sm font-semibold text-[var(--accent-ink)] shadow-[var(--shadow)]"
        >
          Try again
        </Link>
      </div>
    </main>
  );
}
