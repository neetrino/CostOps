import type { ReactNode } from 'react';

type ChartPanelProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function ChartPanel({ title, subtitle, action, children }: ChartPanelProps) {
  return (
    <section className="overflow-hidden rounded-[var(--radius)] border border-[var(--line-strong)] bg-[var(--paper-raised)] shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--line)] bg-[var(--sunken)] px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="text-base font-semibold text-[var(--ink)]">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-[var(--muted)]">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-3 sm:p-5">{children}</div>
    </section>
  );
}
