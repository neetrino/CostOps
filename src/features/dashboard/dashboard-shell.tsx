'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, MotionConfig } from 'motion/react';
import { APP_NAME } from '@/config/constants';
import {
  MobileBottomNavigation,
  MobileBrand,
  MobileWorkspaceMenu,
} from '@/features/dashboard/mobile-navigation';
import { SyncNowButton, SyncStatusChip } from '@/features/dashboard/sync-controls';
import { UnmappedInboxController } from '@/features/dashboard/unmapped-inbox-controller';
import { AppIcon } from '@/shared/ui/app-icon';
import { CostOpsMark } from '@/shared/ui/costops-mark';
import { SignOutButton } from '@/shared/ui/sign-out-button';

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
      <div className="app-bottom-safe min-h-dvh bg-[var(--inverse)] lg:grid lg:grid-cols-[7.25rem_minmax(0,1fr)] lg:p-3 lg:pr-0">
        <header className="sticky top-0 z-30 border-b border-[var(--line-strong)] bg-[var(--paper-raised)] lg:hidden">
          <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
            <MobileBrand />
            <div className="flex items-center gap-2">
              <SyncNowButton compact onComplete={() => setSyncKey((value) => value + 1)} />
              <MobileWorkspaceMenu />
            </div>
          </div>
        </header>
        <DesktopControlRail pathname={pathname} />
        <section className="workspace-frame min-w-0">
          <header className="sticky top-0 z-30 hidden min-h-[4.75rem] items-center justify-between gap-5 border-b border-[var(--line)] bg-[var(--paper-raised)]/95 px-7 lg:flex">
            <div className="flex min-w-0 items-center gap-4">
              <span className="relative flex size-3 items-center justify-center" aria-hidden="true">
                <span className="signal-pulse absolute size-3 rounded-full bg-[var(--accent)]" />
                <span className="relative size-1.5 rounded-full bg-[var(--accent)]" />
              </span>
              <div>
                <p className="eyebrow !text-[var(--accent)]">Live cost intelligence</p>
                <p className="mt-0.5 text-sm font-semibold text-[var(--ink)]">
                  {desktopSectionLabel(pathname)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <SyncStatusChip refreshKey={syncKey} />
              <SyncNowButton onComplete={() => setSyncKey((value) => value + 1)} />
              <SignOutButton />
            </div>
          </header>
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            className={
              isBoardPath(pathname) ? '' : 'mx-auto max-w-[1600px] px-4 py-6 lg:px-8 lg:py-8'
            }
          >
            {children}
          </motion.main>
        </section>
        <MobileBottomNavigation />
        <UnmappedInboxController />
      </div>
    </MotionConfig>
  );
}

function DesktopControlRail({ pathname }: { pathname: string }) {
  return (
    <aside className="sticky top-3 hidden h-[calc(100dvh-1.5rem)] flex-col items-center text-[var(--inverse-ink)] lg:flex">
      <Link
        href="/"
        className="flex w-full flex-col items-center gap-2 py-2"
        aria-label={`${APP_NAME} home`}
      >
        <CostOpsMark size={44} className="text-[var(--signal)]" />
        <span className="wordmark text-[13px] tracking-[-0.03em]">CostOps</span>
      </Link>
      <span className="mt-5 h-px w-10 bg-white/15" />
      <nav className="mt-6 flex w-full flex-col items-center gap-2" aria-label="Primary navigation">
        <RailLink href="/" label="Projects" icon="projects" pathname={pathname} />
        <DesktopProviderMenu pathname={pathname} />
        <RailLink href="/unmapped" label="Inbox" icon="inbox" pathname={pathname} />
        <RailLink href="/integrations" label="Health" icon="integrations" pathname={pathname} />
      </nav>
      <div className="mt-auto mb-3 flex flex-col items-center gap-2 text-center">
        <span className="flex size-8 items-center justify-center rounded-full border border-white/15 bg-white/5">
          <span className="signal-pulse size-2 rounded-full bg-[var(--signal)]" />
        </span>
        <p className="font-[family-name:var(--font-mono)] text-[8px] leading-3 tracking-[0.16em] text-white/45 uppercase">
          Systems
          <br />
          online
        </p>
      </div>
    </aside>
  );
}

function RailLink({
  href,
  label,
  icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: 'projects' | 'inbox' | 'integrations';
  pathname: string;
}) {
  const active = navActive(href, pathname);
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`relative flex min-h-[4.35rem] w-[5.25rem] flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[1.2rem] text-[10px] font-semibold transition-colors ${
        active ? 'text-[var(--signal-ink)]' : 'text-white/55 hover:bg-white/8 hover:text-white'
      }`}
    >
      {active ? (
        <motion.span
          layoutId="desktop-rail-active"
          className="absolute inset-0 bg-[var(--signal)]"
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        />
      ) : null}
      <AppIcon name={icon} size={22} className="relative" />
      <span className="relative">{label}</span>
    </Link>
  );
}

function DesktopProviderMenu({ pathname }: { pathname: string }) {
  const active = pathname.startsWith('/providers/');
  return (
    <details className="group relative w-[5.25rem]">
      <summary
        className={`relative flex min-h-[4.35rem] cursor-pointer list-none flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[1.2rem] text-[10px] font-semibold transition-colors marker:hidden ${
          active
            ? 'bg-[var(--signal)] text-[var(--signal-ink)]'
            : 'text-white/55 hover:bg-white/8 hover:text-white'
        }`}
      >
        <AppIcon name="provider" size={22} />
        Providers
      </summary>
      <div className="absolute top-0 left-[calc(100%+.9rem)] z-50 w-72 overflow-hidden rounded-[1.4rem] border border-white/10 bg-[var(--inverse-2)] p-2 text-[var(--inverse-ink)] shadow-[var(--shadow-popover)]">
        <div className="px-3 pt-2 pb-3">
          <p className="eyebrow !text-white/45">Provider orbit</p>
          <p className="mt-1 text-sm font-semibold">Choose a cost stream</p>
        </div>
        {PROVIDER_NAV.map((item, index) => {
          const itemActive = navActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(event) => event.currentTarget.closest('details')?.removeAttribute('open')}
              aria-current={itemActive ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-[1rem] px-3 py-3 transition-colors ${itemActive ? 'bg-[var(--accent)] text-[var(--accent-ink)]' : 'hover:bg-white/8'}`}
            >
              <span
                className={`money flex size-8 items-center justify-center rounded-lg text-[9px] ${itemActive ? 'bg-[var(--inverse)] text-[var(--inverse-ink)]' : 'bg-white/8 text-white/55'}`}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold">{item.label}</span>
              <span
                className={`text-[10px] ${itemActive ? 'text-[var(--accent-ink)]/60' : 'text-white/35'}`}
              >
                {item.meta}
              </span>
            </Link>
          );
        })}
      </div>
    </details>
  );
}

function desktopSectionLabel(pathname: string): string {
  if (pathname.startsWith('/projects/')) return 'Project intelligence';
  if (pathname.startsWith('/providers/')) return 'Provider intelligence';
  if (pathname === '/unmapped') return 'Allocation inbox';
  if (pathname === '/integrations') return 'Provider operations';
  return 'Portfolio command center';
}
