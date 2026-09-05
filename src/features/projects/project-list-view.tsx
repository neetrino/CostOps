'use client';

import Link from 'next/link';
import type { ProjectListRow } from '@/features/projects/types';
import { BudgetInlineField } from '@/features/projects/budget-inline-field';
import { CostViewDisplay } from '@/shared/ui/cost-view-display';
import { formatUsd } from '@/shared/money';

type ProjectListViewProps = {
  projects: ProjectListRow[];
  onBudgetSaved: () => void;
};

export function ProjectListView({ projects, onBudgetSaved }: ProjectListViewProps) {
  if (projects.length === 0) {
    return null;
  }
  return (
    <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow-card)]">
      <table className="min-w-full text-sm">
        <thead className="border-b border-[var(--line)] bg-[var(--sidebar)] text-left text-xs text-[var(--muted)]">
          <tr>
            <th className="px-4 py-3 font-semibold">Project</th>
            <th className="px-4 py-3 font-semibold">Period</th>
            <th className="px-4 py-3 font-semibold">Today</th>
            <th className="px-4 py-3 font-semibold">Providers</th>
            <th className="px-4 py-3 font-semibold">Daily limit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)]">
          {projects.map((project) => {
            const primary = project.providers[0];
            return (
              <tr key={project.id} className="align-top">
                <td className="px-4 py-3">
                  <Link
                    href={`/projects/${project.slug}`}
                    className="font-medium text-[var(--ink)] transition hover:text-[var(--accent)]"
                  >
                    {project.name}
                  </Link>
                  <p className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted)]">
                    {project.slug}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <CostViewDisplay cost={project.period} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <CostViewDisplay cost={project.today} size="sm" />
                </td>
                <td className="px-4 py-3 text-xs text-[var(--muted)]">
                  {project.providers.map((link) => (
                    <div key={link.projectProviderId} className="flex justify-between gap-4">
                      <span>{link.providerKey}</span>
                      <span className="font-[family-name:var(--font-mono)] tabular-nums">
                        {link.period.costUsd === null ? '—' : formatUsd(link.period.costUsd)}
                      </span>
                    </div>
                  ))}
                </td>
                <td className="px-4 py-3">
                  {primary ? (
                    <BudgetInlineField
                      projectProviderId={primary.projectProviderId}
                      budget={primary.budget}
                      onSaved={onBudgetSaved}
                    />
                  ) : (
                    <span className="text-[var(--muted)]">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
