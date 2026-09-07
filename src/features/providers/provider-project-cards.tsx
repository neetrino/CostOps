'use client';

import Link from 'next/link';
import type { ProviderProjectRow } from '@/features/providers/load-provider-detail';
import { BudgetInlineField } from '@/features/projects/budget-inline-field';
import { CostViewDisplay } from '@/shared/ui/cost-view-display';

type ProviderProjectCardsProps = {
  projects: ProviderProjectRow[];
  onBudgetSaved: () => void;
};

export function ProviderProjectCards({ projects, onBudgetSaved }: ProviderProjectCardsProps) {
  if (projects.length === 0) {
    return null;
  }
  return (
    <ul className="grid list-none gap-5 sm:grid-cols-2 2xl:grid-cols-3">
      {projects.map((project) => (
        <ProviderProjectCard
          key={project.projectProviderId}
          project={project}
          onBudgetSaved={onBudgetSaved}
        />
      ))}
    </ul>
  );
}

function ProviderProjectCard({
  project,
  onBudgetSaved,
}: {
  project: ProviderProjectRow;
  onBudgetSaved: () => void;
}) {
  const overLimit =
    project.budget &&
    project.today.costUsd !== null &&
    project.today.costUsd >= project.budget.limitUsd;

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
          {project.archived ? ' · Archived' : ''}
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Period" cost={project.period} />
          <Metric label="Today" cost={project.today} />
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-3">
          <span className="text-xs font-medium text-[var(--muted)]">Daily limit</span>
          <BudgetInlineField
            savePath={`/api/project-providers/${project.projectProviderId}/budget`}
            budget={project.budget}
            onSaved={onBudgetSaved}
          />
        </div>
      </div>
    </li>
  );
}

function Metric({ label, cost }: { label: string; cost: ProviderProjectRow['period'] }) {
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
