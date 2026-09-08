'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { APP_NAME } from '@/config/constants';
import { AppIcon, type AppIconName } from '@/shared/ui/app-icon';
import { CostOpsMark } from '@/shared/ui/costops-mark';
import { MobileSheet } from '@/shared/ui/mobile-sheet';
import { SignOutButton } from '@/shared/ui/sign-out-button';

const PROVIDERS = [
  { href: '/providers/neon', label: 'Neon', detail: 'Postgres and compute' },
  { href: '/providers/vercel', label: 'Vercel', detail: 'Deployments and platform' },
  { href: '/providers/upstash', label: 'Upstash', detail: 'Redis and QStash' },
  { href: '/providers/hetzner', label: 'VPS', detail: 'Fixed infrastructure' },
] as const;

const ROOT_NAV: Array<{ href: string; label: string; icon: AppIconName }> = [
  { href: '/', label: 'Projects', icon: 'projects' },
  { href: '/unmapped', label: 'Inbox', icon: 'inbox' },
  { href: '/integrations', label: 'Health', icon: 'integrations' },
];

function activeFor(href: string, pathname: string) {
  if (href === '/') {
    return pathname === '/' || pathname.startsWith('/projects/');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBrand() {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label={`${APP_NAME} home`}>
      <CostOpsMark size={34} className="shrink-0 text-[var(--accent)]" />
      <span className="min-w-0">
        <span className="block text-[9px] font-semibold tracking-[0.18em] text-[var(--muted)] uppercase">
          Neetrino
        </span>
        <span className="wordmark block truncate text-lg leading-none text-[var(--ink)]">
          {APP_NAME}
        </span>
      </span>
    </Link>
  );
}

export function MobileBottomNavigation() {
  const pathname = usePathname();
  const providersActive = pathname.startsWith('/providers/');

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line-strong)] bg-[var(--paper)] px-2 pt-1.5 pb-[max(.45rem,env(safe-area-inset-bottom))] lg:hidden"
      aria-label="Primary navigation"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4">
        <MobileNavLink item={ROOT_NAV[0]} pathname={pathname} />
        <MobileSheet
          title="Provider boards"
          description="Open spend by infrastructure provider"
          triggerClassName={`flex min-h-[3.65rem] flex-col items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-semibold transition-colors ${
            providersActive ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
          }`}
          trigger={
            <>
              <span
                className={providersActive ? 'rounded-lg bg-[var(--accent-soft)] p-1.5' : 'p-1.5'}
              >
                <AppIcon name="provider" size={20} />
              </span>
              Providers
            </>
          }
        >
          {(close) => (
            <ul className="grid gap-2 p-4">
              {PROVIDERS.map((provider, index) => {
                const active = activeFor(provider.href, pathname);
                return (
                  <li key={provider.href}>
                    <Link
                      href={provider.href}
                      onClick={close}
                      aria-current={active ? 'page' : undefined}
                      className={`flex min-h-16 items-center gap-4 rounded-xl border px-4 py-3 transition-colors ${
                        active
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                          : 'border-[var(--line)] bg-[var(--paper-raised)]'
                      }`}
                    >
                      <span className="money flex size-9 items-center justify-center rounded-lg bg-[var(--inverse)] text-xs text-[var(--inverse-ink)]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-[var(--ink)]">
                          {provider.label}
                        </span>
                        <span className="block text-xs text-[var(--muted)]">{provider.detail}</span>
                      </span>
                      <AppIcon name="arrow" className="text-[var(--muted)]" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </MobileSheet>
        <MobileNavLink item={ROOT_NAV[1]} pathname={pathname} />
        <MobileNavLink item={ROOT_NAV[2]} pathname={pathname} />
      </div>
    </nav>
  );
}

export function MobileWorkspaceMenu() {
  return (
    <MobileSheet
      title="Workspace"
      description="CostOps operator controls"
      triggerClassName="inline-flex size-11 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--paper-raised)] text-[var(--muted)]"
      trigger={
        <>
          <AppIcon name="menu" />
          <span className="sr-only">Open workspace menu</span>
        </>
      }
    >
      {(close) => (
        <div className="space-y-4 p-4">
          <div className="grid gap-2">
            <Link
              href="/integrations"
              onClick={close}
              className="flex min-h-14 items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--paper-raised)] px-4 font-semibold text-[var(--ink)]"
            >
              <AppIcon name="integrations" className="text-[var(--accent)]" />
              Integration health
              <AppIcon name="arrow" size={17} className="ml-auto text-[var(--faint)]" />
            </Link>
            <Link
              href="/unmapped"
              onClick={close}
              className="flex min-h-14 items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--paper-raised)] px-4 font-semibold text-[var(--ink)]"
            >
              <AppIcon name="inbox" className="text-[var(--accent)]" />
              Unmapped inbox
              <AppIcon name="arrow" size={17} className="ml-auto text-[var(--faint)]" />
            </Link>
          </div>
          <div className="border-t border-[var(--line)] pt-4 [&>button]:w-full">
            <SignOutButton />
          </div>
        </div>
      )}
    </MobileSheet>
  );
}

function MobileNavLink({ item, pathname }: { item: (typeof ROOT_NAV)[number]; pathname: string }) {
  const active = activeFor(item.href, pathname);
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-[3.65rem] flex-col items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-semibold transition-colors ${
        active ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
      }`}
    >
      <span className={active ? 'rounded-lg bg-[var(--accent-soft)] p-1.5' : 'p-1.5'}>
        <AppIcon name={item.icon} size={20} />
      </span>
      {item.label}
    </Link>
  );
}
