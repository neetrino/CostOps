'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { APP_NAME } from '@/config/constants';
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--canvas)] px-4">
      <div className="w-full max-w-sm rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-8 shadow-[var(--shadow-card)]">
        <CostOpsMark size={44} className="mb-4" />
        <p className="text-xs font-medium tracking-[0.18em] text-[var(--muted)] uppercase">
          Neetrino
        </p>
        <h1 className="wordmark mt-2 text-3xl text-[var(--ink)]">{APP_NAME}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Sign in to the dashboard</p>
        {err === 'config' ? (
          <p className="mt-4 text-sm text-amber-900" role="alert">
            Set <code className="text-xs">JWT_SECRET</code> with{' '}
            <code className="text-xs">DASHBOARD_PASSWORD</code>.
          </p>
        ) : null}
        <form onSubmit={(event) => void submit(event)} className="mt-6 flex flex-col gap-4">
          <label className="text-xs font-medium text-[var(--muted)]">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-md border border-[var(--line-strong)] bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </label>
          {message ? (
            <p className="text-sm text-[var(--danger)]" role="alert">
              {message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent-ink)] transition hover:opacity-90 disabled:opacity-50"
          >
            {pending ? 'Signing in…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
