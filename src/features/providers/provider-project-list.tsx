'use client';

import Link from 'next/link';
import type { ProviderProjectRow } from '@/features/providers/load-provider-detail';
import { VpsLineEdit } from '@/features/providers/vps-line-edit';
import { BudgetInlineField } from '@/features/projects/budget-inline-field';
import { CostViewDisplay } from '@/shared/ui/cost-view-display';
import { AppIcon } from '@/shared/ui/app-icon';
import { BudgetMeter } from '@/shared/ui/budget-meter';
import { motion } from 'motion/react';

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
    <>
      <ul className="space-y-2 lg:hidden">
        {projects.map((project, index) => (
          <MobileProviderProjectRow
            key={project.projectProviderId}
            project={project}
            index={index}
            hideDailyLimit={hideDailyLimit}
            onBudgetSaved={onBudgetSaved}
          />
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-[var(--radius)] border border-[var(--line-strong)] bg-[var(--paper-raised)] shadow-[var(--shadow-card)] lg:block">
        <table className="min-w-full text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--sunken)] text-left text-xs text-[var(--muted)]">
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
              <tr
                key={project.projectProviderId}
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
                    <div className="min-w-44 space-y-2">
                      <BudgetInlineField
                        savePath={`/api/project-providers/${project.projectProviderId}/budget`}
                        budget={project.budget}
                        onSaved={onBudgetSaved}
                      />
                      {project.budget?.enabled ? (
                        <BudgetMeter
                          spendUsd={project.today.costUsd}
                          limitUsd={project.budget.limitUsd}
                          compact
                        />
                      ) : null}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function MobileProviderProjectRow({
  project,
  index,
  hideDailyLimit,
  onBudgetSaved,
}: {
  project: ProviderProjectRow;
  index: number;
  hideDailyLimit: boolean;
  onBudgetSaved: () => void;
}) {
  const overLimit =
    project.budget?.enabled &&
    project.today.costUsd !== null &&
    project.today.costUsd >= project.budget.limitUsd;

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.02 }}
      className={`overflow-hidden rounded-[var(--radius)] border bg-[var(--paper-raised)] shadow-[var(--shadow-card)] ${
        overLimit ? 'border-[var(--danger)]' : 'border-[var(--line-strong)]'
      }`}
    >
      <Link
        href={`/projects/${project.slug}`}
        className={`flex min-h-14 items-center gap-3 border-b px-4 py-3 ${
          overLimit ? 'border-[var(--danger)]/20 bg-[var(--danger-soft)]' : 'border-[var(--line)]'
        }`}
      >
        <span className="money flex size-7 shrink-0 items-center justify-center rounded-md bg-[var(--sunken)] text-[10px] text-[var(--muted)]">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-[var(--ink)]">{project.name}</span>
          <span className="money block truncate text-[10px] text-[var(--muted)]">
            {project.slug}
            {project.archived ? ' · Archived' : ''}
          </span>
        </span>
        <AppIcon name="arrow" size={18} className="shrink-0 text-[var(--faint)]" />
      </Link>

      <div className="grid grid-cols-2 divide-x divide-[var(--line)] border-b border-[var(--line)] bg-[var(--sunken)]">
        <MobileMetric label="Period" cost={project.period} />
        <MobileMetric label="Today" cost={project.today} />
      </div>

      <div className="space-y-3 px-4 py-3">
        {hideDailyLimit ? (
          project.vpsLines.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">No active VPS line</p>
          ) : (
            <div className="space-y-3">
              {project.vpsLines.map((line) => (
                <div key={line.id} className="space-y-2">
                  <p
                    className="truncate text-xs font-semibold text-[var(--ink)]"
                    title={line.displayName}
                  >
                    {line.displayName}
                  </p>
                  <VpsLineEdit
                    resourceId={line.id}
                    monthlyAmountUsd={line.monthlyAmountUsd}
                    onChanged={onBudgetSaved}
                  />
                </div>
              ))}
            </div>
          )
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-[var(--muted)]">Daily budget</span>
              <BudgetInlineField
                savePath={`/api/project-providers/${project.projectProviderId}/budget`}
                budget={project.budget}
                onSaved={onBudgetSaved}
              />
            </div>
            {project.budget?.enabled ? (
              <BudgetMeter
                spendUsd={project.today.costUsd}
                limitUsd={project.budget.limitUsd}
                compact
              />
            ) : null}
          </>
        )}
      </div>
    </motion.li>
  );
}

function MobileMetric({ label, cost }: { label: string; cost: ProviderProjectRow['period'] }) {
  return (
    <div className="px-4 py-3">
      <p className="eyebrow">{label}</p>
      <div className="mt-1">
        <CostViewDisplay cost={cost} size="sm" />
      </div>
    </div>
  );
}
