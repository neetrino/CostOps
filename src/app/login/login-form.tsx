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
    <main className="signal-grid flex min-h-[100dvh] items-center bg-[var(--inverse)] px-4 py-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/15 bg-[var(--paper-raised)] shadow-[16px_16px_0_rgba(201,255,74,.22)] lg:min-h-[44rem] lg:grid-cols-[1.08fr_0.92fr]">
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
            <p className="eyebrow !text-[var(--violet)]">Operator access / 01</p>
            <h1 className="wordmark mt-4 max-w-md text-[3rem] leading-[0.85] text-[var(--ink)] sm:text-6xl">
              Enter the
              <span className="block pl-[0.5em] text-[var(--accent)]">spend orbit.</span>
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
                className="mt-5 inline-flex min-h-13 w-full items-center justify-between rounded-full border border-[var(--ink)] bg-[var(--signal)] px-5 text-sm font-semibold text-[var(--signal-ink)] shadow-[var(--shadow-color)] transition-[background-color,transform,opacity] duration-[var(--duration-ui)] ease-[var(--ease-ui)] hover:-translate-y-1 hover:bg-[var(--accent)] active:translate-y-px disabled:cursor-wait disabled:opacity-60"
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
    <aside className="tone-violet signal-grid relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between">
      <span className="float-slow absolute top-20 right-16 size-32 rounded-full border border-white/20" />
      <span className="absolute top-36 right-28 size-10 rounded-full bg-[var(--signal)]" />
      <div className="flex items-center gap-3">
        <CostOpsMark size={44} className="text-[var(--signal)]" />
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] text-white/45 uppercase">
            Neetrino
          </p>
          <p className="wordmark text-2xl leading-none">{APP_NAME}</p>
        </div>
      </div>

      <div className="max-w-md py-14">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-white/45 uppercase">
          Kinetic FinOps studio
        </p>
        <h2 className="wordmark relative mt-5 text-7xl leading-[0.82]">
          Make cost
          <span className="block pl-[0.52em] text-[var(--signal)]">visible.</span>
        </h2>
        <p className="mt-7 max-w-sm text-sm leading-6 text-white/60">
          A living map of spend, limits and provider health—built for decisive operators.
        </p>
      </div>

      <dl className="border-y border-white/15">
        {LEDGER_ROWS.map((row, index) => (
          <div
            key={row.label}
            className="grid grid-cols-[2rem_1fr_auto] items-center gap-4 border-b border-white/15 py-4 last:border-b-0"
          >
            <dt className="contents">
              <span className="money text-xs text-[var(--signal)]">0{index + 1}</span>
              <span className="text-xs text-white/55">{row.label}</span>
            </dt>
            <dd className="text-sm font-medium text-[var(--inverse-ink)]">{row.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
