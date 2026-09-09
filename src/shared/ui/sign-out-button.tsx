'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const signOut = async () => {
    setPending(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/login');
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      disabled={pending}
      className="min-h-10 rounded-full border border-[var(--line-strong)] bg-[var(--paper-raised)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition-[background-color,border-color,transform] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] disabled:opacity-50"
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
