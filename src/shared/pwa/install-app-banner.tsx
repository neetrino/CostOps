'use client';

import { APP_NAME } from '@/config/constants';
import { useInstallAppOffer } from '@/shared/pwa/use-install-app-offer';
import { Button } from '@/shared/ui/button';

export function InstallAppBanner() {
  const { mode, promptInstall, dismiss } = useInstallAppOffer();

  if (mode === 'hidden') {
    return null;
  }

  const title = `Install ${APP_NAME}`;
  const body =
    mode === 'ios'
      ? 'In Safari, tap Share, then Add to Home Screen.'
      : 'Open the board like an app — from your home screen.';

  return (
    <aside
      className="shrink-0 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4"
      aria-label={title}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper-raised)] px-4 py-3.5 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-5">
        <div className="min-w-0">
          <h2 className="wordmark text-lg leading-none text-[var(--ink)]">{title}</h2>
          <p className="mt-1.5 text-sm leading-5 text-[var(--muted)]">{body}</p>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2">
          {mode === 'android' ? (
            <Button className="min-h-10 px-4" onClick={() => void promptInstall()}>
              Install
            </Button>
          ) : null}
          <Button
            variant="secondary"
            className="min-h-10 px-4"
            onClick={dismiss}
            aria-label="Dismiss"
          >
            Not now
          </Button>
        </div>
      </div>
    </aside>
  );
}
