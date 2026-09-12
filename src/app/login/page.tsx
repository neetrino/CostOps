import { Suspense } from 'react';
import { SkeletonBlock } from '@/shared/ui/state-panels';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

function LoginFallback() {
  return (
    <main className="flex min-h-full flex-1 items-center bg-[var(--canvas)] px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
      <div
        className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[1.25rem] border border-[var(--line-strong)] bg-[var(--paper-raised)] shadow-[var(--shadow-popover)] lg:min-h-[42rem] lg:grid-cols-[1.08fr_0.92fr]"
        role="status"
      >
        <span className="sr-only">Loading sign in</span>
        <div
          className="hidden bg-[var(--inverse)] p-10 lg:flex lg:flex-col lg:justify-between"
          aria-hidden
        >
          <SkeletonBlock className="h-12 w-12 bg-[var(--accent-mid)]" />
          <div>
            <SkeletonBlock className="h-3 w-28 bg-[var(--accent-mid)]" />
            <SkeletonBlock className="mt-5 h-16 w-4/5 bg-[var(--paper)]/20" />
            <SkeletonBlock className="mt-4 h-4 w-3/5 bg-[var(--paper)]/15" />
          </div>
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-14" aria-hidden>
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="mt-5 h-10 w-48" />
          <SkeletonBlock className="mt-4 h-4 w-64 max-w-full" />
          <SkeletonBlock className="mt-10 h-12 w-full" />
          <SkeletonBlock className="mt-4 h-12 w-full bg-[var(--accent-mid)]" />
        </div>
      </div>
    </main>
  );
}
