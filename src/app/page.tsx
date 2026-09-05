import { APP_NAME } from '@/config/constants';
import { getPublicEnv } from '@/shared/env';
import { SignOutButton } from '@/shared/ui/sign-out-button';

export default function HomePage() {
  const { hasDashboardAuth } = getPublicEnv();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-10 shadow-[var(--shadow)]">
        <p className="text-xs font-medium tracking-[0.18em] text-[var(--muted)] uppercase">
          Neetrino
        </p>
        <h1 className="wordmark mt-3 text-5xl text-[var(--ink)]">{APP_NAME}</h1>
        <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--muted)]">
          Internal FinOps. Spend by project and period, Telegram when a Project × Provider daily
          limit breaks, history we own.
        </p>
        <p className="mt-8 border-t border-[var(--line)] pt-6 text-sm text-[var(--ink)]">
          Foundation is up. Schema, session, and health are ready. Dashboard boards come next.
        </p>
        {hasDashboardAuth ? (
          <div className="mt-6">
            <SignOutButton />
          </div>
        ) : null}
      </div>
    </main>
  );
}
