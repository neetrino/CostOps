'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { APP_NAME } from '@/config/constants';
import { SyncNowButton, SyncStatusChip } from '@/features/dashboard/sync-controls';
import { UnmappedInboxController } from '@/features/dashboard/unmapped-inbox-controller';
import { CostOpsMark } from '@/shared/ui/costops-mark';
import { SignOutButton } from '@/shared/ui/sign-out-button';

const NAV = [
  { href: '/', label: 'Projects' },
  { href: '/providers/neon', label: 'Neon' },
  { href: '/providers/vercel', label: 'Vercel' },
  { href: '/providers/upstash', label: 'Upstash' },
  { href: '/providers/hetzner', label: 'VPS' },
  { href: '/unmapped', label: 'Unmapped' },
  { href: '/integrations', label: 'Integrations' },
] as const;

type DashboardShellProps = {
  children: React.ReactNode;
};

function isBoardPath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/unmapped' ||
    pathname.startsWith('/projects/') ||
    pathname.startsWith('/providers/')
  );
}

function navActive(href: string, pathname: string): boolean {
  if (href === '/') {
    return pathname === '/' || pathname.startsWith('/projects/');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const [syncKey, setSyncKey] = useState(0);

  return (
    <div className="min-h-screen bg-[var(--canvas)]">
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--sidebar)]/95 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
          <Link href="/" className="mr-2 flex shrink-0 items-center gap-2.5">
            <CostOpsMark size={32} />
            <span>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--muted)] uppercase">
                Neetrino
              </p>
              <p className="wordmark text-xl text-[var(--ink)]">{APP_NAME}</p>
            </span>
          </Link>
          <nav className="flex flex-1 flex-wrap items-center gap-1">
            {NAV.map((item) => {
              const active = navActive(item.href, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                      : 'text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <SyncStatusChip refreshKey={syncKey} />
          <SyncNowButton onComplete={() => setSyncKey((value) => value + 1)} />
          <SignOutButton />
        </div>
      </header>
      <main className={isBoardPath(pathname) ? '' : 'mx-auto max-w-[1600px] px-4 py-6 lg:px-6'}>
        {children}
      </main>
      <UnmappedInboxController />
    </div>
  );
}
