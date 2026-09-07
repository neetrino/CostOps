'use client';

import Link from 'next/link';
import type { ProviderProjectRow } from '@/features/providers/load-provider-detail';
import { VpsLineEdit } from '@/features/providers/vps-line-edit';
import { BudgetInlineField } from '@/features/projects/budget-inline-field';
import { CostViewDisplay } from '@/shared/ui/cost-view-display';

type ProviderProjectListProps = {
  projects: ProviderProjectRow[];
  hideDailyLimit?: boolean;
  onBudgetSaved: () => void;
};

export function ProviderProjectList({
  projects,
  hideDailyLimit = false,
  onBudgetSaved,
}: ProviderProjectListProps) {
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
            <th className="px-4 py-3 font-semibold">
              {hideDailyLimit ? 'Monthly fee' : 'Daily limit'}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)]">
          {projects.map((project) => (
            <tr key={project.projectProviderId} className="align-top">
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
              <td className="px-4 py-3">
                {hideDailyLimit ? (
                  project.vpsLines.length === 0 ? (
                    <span className="text-xs text-[var(--muted)]">No active VPS line</span>
                  ) : (
                    <div className="space-y-3">
                      {project.vpsLines.map((line) => (
                        <VpsLineEdit
                          key={line.id}
                          resourceId={line.id}
                          monthlyAmountUsd={line.monthlyAmountUsd}
                          onChanged={onBudgetSaved}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  <BudgetInlineField
                    savePath={`/api/project-providers/${project.projectProviderId}/budget`}
                    budget={project.budget}
                    onSaved={onBudgetSaved}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
