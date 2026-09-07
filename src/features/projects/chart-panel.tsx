import type { ReactNode } from 'react';

type ChartPanelProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function ChartPanel({ title, subtitle, action, children }: ChartPanelProps) {
  return (
    <section className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--ink)]">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-[var(--muted)]">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
