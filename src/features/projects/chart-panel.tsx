import type { ReactNode } from 'react';

type ChartPanelProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  index?: string;
  accent?: 'signal' | 'coral' | 'violet';
};

const ACCENT_CLASS = {
  signal: 'bg-[var(--signal)]',
  coral: 'bg-[var(--accent)]',
  violet: 'bg-[var(--violet)]',
} as const;

const ACCENT_TEXT_CLASS = {
  signal: 'text-[var(--signal-ink)]',
  coral: 'text-[var(--accent-ink)]',
  violet: 'text-white',
} as const;

export function ChartPanel({
  title,
  subtitle,
  action,
  children,
  index = '04',
  accent = 'signal',
}: ChartPanelProps) {
  return (
    <section className="dark-stage signal-grid relative overflow-hidden rounded-[var(--radius)] border border-white/10 shadow-[var(--shadow-popover)]">
      <div className={`h-1.5 w-full ${ACCENT_CLASS[accent]}`} />
      <div className="relative flex flex-wrap items-end justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex items-start gap-4">
          <span
            className={`money flex size-10 shrink-0 items-center justify-center rounded-full text-[11px] ${ACCENT_CLASS[accent]} ${ACCENT_TEXT_CLASS[accent]}`}
          >
            {index}
          </span>
          <div>
            <p className="eyebrow !text-white/40">Data in motion</p>
            <h2 className="wordmark mt-1 text-2xl leading-none text-[var(--ink)] sm:text-3xl">
              {title}
            </h2>
            {subtitle ? <p className="mt-2 text-xs text-[var(--muted)]">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className="relative p-3 sm:p-6">{children}</div>
    </section>
  );
}
