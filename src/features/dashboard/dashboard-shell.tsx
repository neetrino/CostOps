'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { MotionConfig } from 'motion/react';
import { APP_NAME } from '@/config/constants';
import {
  MobileBottomNavigation,
  MobileBrand,
  MobileWorkspaceMenu,
} from '@/features/dashboard/mobile-navigation';
import { SyncNowButton, SyncStatusChip } from '@/features/dashboard/sync-controls';
import { UnmappedInboxController } from '@/features/dashboard/unmapped-inbox-controller';
import { CostOpsMark } from '@/shared/ui/costops-mark';
import { SignOutButton } from '@/shared/ui/sign-out-button';

const NAV = [
  { href: '/', label: 'Projects' },
  { href: '/unmapped', label: 'Unmapped' },
  { href: '/integrations', label: 'Integrations' },
] as const;

const PROVIDER_NAV = [
  { href: '/providers/neon', label: 'Neon', meta: 'Postgres' },
  { href: '/providers/vercel', label: 'Vercel', meta: 'Platform' },
  { href: '/providers/upstash', label: 'Upstash', meta: 'Data' },
  { href: '/providers/hetzner', label: 'VPS', meta: 'Fixed' },
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
    <MotionConfig reducedMotion="user">
      <div className="app-bottom-safe min-h-dvh bg-[var(--canvas)]">
        <header className="sticky top-0 z-30 border-b border-[var(--line-strong)] bg-[var(--paper)] lg:hidden">
          <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
            <MobileBrand />
            <div className="flex items-center gap-2">
              <SyncNowButton compact onComplete={() => setSyncKey((value) => value + 1)} />
              <MobileWorkspaceMenu />
            </div>
          </div>
        </header>
        <header className="sticky top-0 z-30 hidden border-b border-[var(--line-strong)] bg-[var(--sidebar)] lg:block">
          <div className="flex min-h-[4.75rem] items-center gap-4 px-6 py-3">
            <Link
              href="/"
              className="mr-2 flex shrink-0 items-center gap-2.5"
              aria-label={`${APP_NAME} home`}
            >
              <CostOpsMark size={34} className="text-[var(--accent)]" />
              <span>
                <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--muted)] uppercase">
                  Neetrino
                </p>
                <p className="wordmark text-xl text-[var(--ink)]">{APP_NAME}</p>
              </span>
            </Link>
            <nav className="flex flex-1 items-center gap-1" aria-label="Primary navigation">
              {NAV.map((item, index) => {
                const active = navActive(item.href, pathname);
                return (
                  <span key={item.href} className="contents">
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                          : 'text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {item.label}
                    </Link>
                    {index === 0 ? <DesktopProviderMenu pathname={pathname} /> : null}
                  </span>
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
        <MobileBottomNavigation />
        <UnmappedInboxController />
      </div>
    </MotionConfig>
  );
}

function DesktopProviderMenu({ pathname }: { pathname: string }) {
  const active = pathname.startsWith('/providers/');
  return (
    <details className="group relative">
      <summary
        className={`cursor-pointer list-none rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors marker:hidden ${
          active
            ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
            : 'text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]'
        }`}
      >
        Providers <span className="ml-1 text-[10px] opacity-60">▾</span>
      </summary>
      <div className="absolute top-[calc(100%+.55rem)] left-0 z-50 w-60 overflow-hidden rounded-[var(--radius)] border border-[var(--line-strong)] bg-[var(--paper-raised)] p-1.5 shadow-[var(--shadow-popover)]">
        {PROVIDER_NAV.map((item, index) => {
          const itemActive = navActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(event) => event.currentTarget.closest('details')?.removeAttribute('open')}
              aria-current={itemActive ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 transition-colors ${itemActive ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--sunken)]'}`}
            >
              <span className="money flex size-7 items-center justify-center rounded-md bg-[var(--inverse)] text-[9px] text-[var(--inverse-ink)]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold text-[var(--ink)]">
                {item.label}
              </span>
              <span className="text-[10px] text-[var(--muted)]">{item.meta}</span>
            </Link>
          );
        })}
      </div>
    </details>
  );
}
