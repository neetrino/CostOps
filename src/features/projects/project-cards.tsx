'use client';

import Link from 'next/link';
import type { ProjectListRow } from '@/features/projects/types';
import { BudgetInlineField } from '@/features/projects/budget-inline-field';
import { CostViewDisplay } from '@/shared/ui/cost-view-display';
import { formatUsd } from '@/shared/money';

type ProjectCardsProps = {
  projects: ProjectListRow[];
  onBudgetSaved: () => void;
};

export function ProjectCards({ projects, onBudgetSaved }: ProjectCardsProps) {
  if (projects.length === 0) {
    return null;
  }
  return (
    <ul className="grid list-none gap-5 sm:grid-cols-2 2xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} onBudgetSaved={onBudgetSaved} />
      ))}
    </ul>
  );
}

function ProjectCard({
  project,
  onBudgetSaved,
}: {
  project: ProjectListRow;
  onBudgetSaved: () => void;
}) {
  const primaryProvider = project.providers[0];
  const overLimit =
    primaryProvider?.budget &&
    project.today.costUsd !== null &&
    project.today.costUsd >= primaryProvider.budget.limitUsd;

  return (
    <li
      className={`flex flex-col overflow-hidden rounded-[var(--radius)] border bg-[var(--paper)] shadow-[var(--shadow-card)] ${
        overLimit ? 'border-[var(--danger)] bg-[var(--danger-soft)]' : 'border-[var(--line)]'
      }`}
    >
      <div className="border-b border-[var(--line)] bg-[var(--sidebar)] px-4 py-3.5">
        <Link
          href={`/projects/${project.slug}`}
          className="block truncate text-lg font-semibold text-[var(--ink)] transition hover:text-[var(--accent)]"
          title={project.name}
        >
          {project.name}
        </Link>
        <p className="mt-1 font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted)]">
          {project.slug}
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Period" cost={project.period} />
          <Metric label="Today" cost={project.today} />
        </div>
        {project.providers.length > 0 ? (
          <div className="rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--canvas)] px-3 py-2">
            <p className="text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
              Providers
            </p>
            <ul className="mt-2 space-y-1 text-xs">
              {project.providers.map((link) => (
                <li key={link.projectProviderId} className="flex justify-between gap-2">
                  <span className="text-[var(--ink)]">{link.providerKey}</span>
                  <span className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--muted)]">
                    {link.period.costUsd === null ? '—' : formatUsd(link.period.costUsd)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {primaryProvider ? (
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-3">
            <span className="text-xs font-medium text-[var(--muted)]">Daily limit</span>
            <BudgetInlineField
              projectProviderId={primaryProvider.projectProviderId}
              budget={primaryProvider.budget}
              onSaved={onBudgetSaved}
            />
          </div>
        ) : null}
      </div>
    </li>
  );
}

function Metric({ label, cost }: { label: string; cost: ProjectListRow['period'] }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--canvas)] px-3 py-2.5">
      <p className="text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
        {label}
      </p>
      <div className="mt-1">
        <CostViewDisplay cost={cost} size="sm" />
      </div>
    </div>
  );
}
