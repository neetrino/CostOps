'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { APP_NAME } from '@/config/constants';
import { AppIcon } from '@/shared/ui/app-icon';
import { CostOpsMark } from '@/shared/ui/costops-mark';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const err = params.get('error');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setMessage(body.error ?? 'Login failed');
        return;
      }
      router.replace('/');
      router.refresh();
    } catch {
      setMessage('Network error');
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="flex min-h-[100dvh] items-center bg-[var(--canvas)] px-4 py-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[1.25rem] border border-[var(--line-strong)] bg-[var(--paper-raised)] shadow-[var(--shadow-popover)] lg:min-h-[42rem] lg:grid-cols-[1.08fr_0.92fr]">
        <LoginEditorialPanel />

        <section className="flex min-h-[calc(100dvh-3rem)] flex-col justify-between p-5 sm:min-h-0 sm:p-10 lg:justify-center lg:p-14">
          <div className="flex items-center gap-3 lg:hidden">
            <CostOpsMark size={40} className="shrink-0 text-[var(--inverse)]" />
            <div>
              <p className="eyebrow">Neetrino</p>
              <p className="wordmark text-xl leading-none text-[var(--ink)]">{APP_NAME}</p>
            </div>
          </div>

          <div className="my-auto w-full py-10 lg:my-0 lg:py-0">
            <p className="eyebrow">Operator access</p>
            <h1 className="wordmark mt-3 max-w-md text-[2.5rem] leading-[0.96] text-[var(--ink)] sm:text-5xl">
              The cost ledger,
              <span className="block text-[var(--accent)]">ready for review.</span>
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-[var(--muted)]">
              Sign in to inspect spend, freshness and budget pressure across every connected
              provider.
            </p>

            {err === 'config' ? (
              <div
                className="mt-6 flex gap-3 rounded-[var(--radius-sm)] border border-[var(--warning)]/30 bg-[var(--warning-soft)] p-3.5 text-sm text-[var(--warning)]"
                role="alert"
              >
                <AppIcon name="alert" size={18} className="mt-0.5 shrink-0" />
                <p>
                  Set{' '}
                  <code className="font-[family-name:var(--font-mono)] text-xs">JWT_SECRET</code>{' '}
                  with{' '}
                  <code className="font-[family-name:var(--font-mono)] text-xs">
                    DASHBOARD_PASSWORD
                  </code>
                  .
                </p>
              </div>
            ) : null}

            <form onSubmit={(event) => void submit(event)} className="mt-8">
              <label htmlFor="dashboard-password" className="eyebrow block">
                Dashboard password
              </label>
              <input
                id="dashboard-password"
                type="password"
                autoComplete="current-password"
                required
                disabled={pending}
                aria-describedby={message ? 'login-error' : 'password-note'}
                aria-invalid={message ? true : undefined}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="field-control mt-2 min-h-12 text-base disabled:cursor-wait disabled:opacity-60"
              />
              <div className="mt-2 min-h-5">
                {message ? (
                  <p
                    id="login-error"
                    className="flex items-center gap-2 text-sm font-medium text-[var(--danger)]"
                    role="alert"
                  >
                    <AppIcon name="alert" size={16} className="shrink-0" />
                    {message}
                  </p>
                ) : (
                  <p id="password-note" className="text-xs text-[var(--faint)]">
                    Internal workspace · authenticated sessions only
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={pending}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-between rounded-[var(--radius-sm)] border border-transparent bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-ink)] shadow-[var(--shadow)] transition-[background-color,transform,opacity] duration-[var(--duration-ui)] ease-[var(--ease-ui)] hover:bg-[var(--accent-hover)] active:translate-y-px disabled:cursor-wait disabled:opacity-60"
              >
                <span>{pending ? 'Opening ledger…' : 'Open cost ledger'}</span>
                <AppIcon
                  name={pending ? 'sync' : 'arrow'}
                  size={19}
                  className={pending ? 'animate-spin' : ''}
                />
              </button>
            </form>
          </div>

          <p className="text-[11px] leading-5 text-[var(--faint)] lg:mt-10">
            Spend data remains scoped to the Neetrino operator workspace.
          </p>
        </section>
      </div>
    </main>
  );
}

const LEDGER_ROWS = [
  { label: 'Cost visibility', value: 'Project × Provider' },
  { label: 'Budget signals', value: 'Daily limits' },
  { label: 'Data quality', value: 'Freshness attached' },
] as const;

function LoginEditorialPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-[var(--inverse)] p-10 text-[var(--inverse-ink)] lg:flex lg:flex-col lg:justify-between">
      <div className="flex items-center gap-3">
        <CostOpsMark size={44} className="text-[var(--paper-raised)]" />
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] text-[var(--accent-mid)] uppercase">
            Neetrino
          </p>
          <p className="wordmark text-2xl leading-none">{APP_NAME}</p>
        </div>
      </div>

      <div className="max-w-md py-14">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--accent-mid)] uppercase">
          FinOps command ledger
        </p>
        <h2 className="wordmark mt-5 text-6xl leading-[0.93] tracking-[-0.05em]">
          Every dollar has a place.
        </h2>
        <p className="mt-6 max-w-sm text-sm leading-6 text-[var(--accent-mid)]">
          A calm operational view of spend, limits and source health—without hiding uncertainty.
        </p>
      </div>

      <dl className="border-y border-[var(--paper)]/15">
        {LEDGER_ROWS.map((row, index) => (
          <div
            key={row.label}
            className="grid grid-cols-[2rem_1fr_auto] items-center gap-4 border-b border-[var(--paper)]/15 py-4 last:border-b-0"
          >
            <dt className="contents">
              <span className="money text-xs text-[var(--accent-mid)]">0{index + 1}</span>
              <span className="text-xs text-[var(--accent-mid)]">{row.label}</span>
            </dt>
            <dd className="text-sm font-medium text-[var(--inverse-ink)]">{row.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
