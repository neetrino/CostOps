'use client';

import Link from 'next/link';
import type { ProjectListRow } from '@/features/projects/types';
import { BudgetInlineField } from '@/features/projects/budget-inline-field';
import { CostViewDisplay } from '@/shared/ui/cost-view-display';
import { firstAlertableProvider } from '@/features/projects/alertable-provider';
import { providerUiLabel } from '@/shared/provider-label';
import { formatUsd } from '@/shared/money';
import { AppIcon } from '@/shared/ui/app-icon';
import { BudgetMeter } from '@/shared/ui/budget-meter';

type ProjectListViewProps = {
  projects: ProjectListRow[];
  onBudgetSaved: () => void;
};

export function ProjectListView({ projects, onBudgetSaved }: ProjectListViewProps) {
  if (projects.length === 0) {
    return null;
  }
  return (
    <>
      <ul className="space-y-2 md:hidden">
        {projects.map((project) => {
          const primary = firstAlertableProvider(project.providers);
          return (
            <li
              key={project.id}
              className="overflow-hidden rounded-[var(--radius)] border border-[var(--line-strong)] bg-[var(--paper-raised)] shadow-[var(--shadow-card)]"
            >
              <Link
                href={`/projects/${project.slug}`}
                className="flex min-h-14 items-center gap-3 border-b border-[var(--line)] px-4 py-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-[var(--ink)]">
                    {project.name}
                  </span>
                  <span className="money block truncate text-[10px] text-[var(--muted)]">
                    {project.slug}
                  </span>
                </span>
                <AppIcon name="arrow" size={18} className="text-[var(--faint)]" />
              </Link>
              <div className="grid grid-cols-2 divide-x divide-[var(--line)] border-b border-[var(--line)] bg-[var(--sunken)]">
                <MobileMetric label="Period" cost={project.period} />
                <MobileMetric label="Today" cost={project.today} />
              </div>
              <div className="space-y-3 px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {project.providers.map((provider) => (
                    <span
                      key={provider.projectProviderId}
                      className="rounded-full border border-[var(--line)] bg-[var(--sunken)] px-2 py-1 text-[10px] font-semibold text-[var(--muted)]"
                    >
                      {providerUiLabel(provider.providerKey)}
                    </span>
                  ))}
                </div>
                {primary ? (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-[var(--muted)]">Daily budget</span>
                      <BudgetInlineField
                        savePath={`/api/project-providers/${primary.projectProviderId}/budget`}
                        budget={primary.budget}
                        onSaved={onBudgetSaved}
                      />
                    </div>
                    {primary.budget?.enabled ? (
                      <BudgetMeter
                        spendUsd={project.today.costUsd}
                        limitUsd={primary.budget.limitUsd}
                        compact
                      />
                    ) : null}
                  </>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="hidden overflow-x-auto rounded-[var(--radius)] border border-[var(--line-strong)] bg-[var(--paper-raised)] shadow-[var(--shadow-card)] md:block">
        <table className="min-w-full text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--sunken)] text-left text-xs text-[var(--muted)]">
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
              const primary = firstAlertableProvider(project.providers);
              return (
                <tr
                  key={project.id}
                  className="align-top transition-colors hover:bg-[var(--sunken)]/60"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${project.slug}`}
                      className="font-medium text-[var(--ink)] transition-colors hover:text-[var(--accent)]"
                    >
                      {project.name}
                    </Link>
                    <p className="money text-[11px] text-[var(--muted)]">{project.slug}</p>
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
                        <span>{providerUiLabel(link.providerKey)}</span>
                        <span className="money">
                          {link.period.costUsd === null ? '—' : formatUsd(link.period.costUsd)}
                        </span>
                      </div>
                    ))}
                  </td>
                  <td className="px-4 py-3">
                    {primary ? (
                      <BudgetInlineField
                        savePath={`/api/project-providers/${primary.projectProviderId}/budget`}
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
    </>
  );
}

function MobileMetric({ label, cost }: { label: string; cost: ProjectListRow['period'] }) {
  return (
    <div className="px-4 py-3">
      <p className="eyebrow">{label}</p>
      <div className="mt-1">
        <CostViewDisplay cost={cost} size="sm" />
      </div>
    </div>
  );
}
