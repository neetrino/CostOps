'use client';

import Link from 'next/link';
import type { ProviderProjectRow } from '@/features/providers/load-provider-detail';
import { VpsLineEdit } from '@/features/providers/vps-line-edit';
import { BudgetInlineField } from '@/features/projects/budget-inline-field';
import { CostViewDisplay } from '@/shared/ui/cost-view-display';
import { AppIcon } from '@/shared/ui/app-icon';
import { BudgetMeter } from '@/shared/ui/budget-meter';
import { motion } from 'motion/react';

type ProviderProjectCardsProps = {
  projects: ProviderProjectRow[];
  hideDailyLimit?: boolean;
  onBudgetSaved: () => void;
};

export function ProviderProjectCards({
  projects,
  hideDailyLimit = false,
  onBudgetSaved,
}: ProviderProjectCardsProps) {
  if (projects.length === 0) {
    return null;
  }
  return (
    <ul className="grid list-none gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {projects.map((project, index) => (
        <ProviderProjectCard
          key={project.projectProviderId}
          project={project}
          index={index}
          hideDailyLimit={hideDailyLimit}
          onBudgetSaved={onBudgetSaved}
        />
      ))}
    </ul>
  );
}

function ProviderProjectCard({
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index, 8) * 0.025 }}
      whileHover={{ y: -7, rotate: index % 2 === 0 ? -0.22 : 0.22 }}
      className={`group flex flex-col overflow-hidden rounded-[var(--radius)] border bg-[var(--paper-raised)] shadow-[var(--shadow-color)] ${
        overLimit ? 'border-[var(--danger)]' : 'border-[var(--line-strong)]'
      }`}
    >
      <div className={index % 2 === 0 ? 'h-2 bg-[var(--accent)]' : 'h-2 bg-[var(--violet)]'} />
      <div
        className={`border-b px-5 py-5 ${
          overLimit
            ? 'border-[var(--danger)]/20 bg-[var(--danger-soft)]'
            : 'border-[var(--line)] bg-[var(--paper-raised)]'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="money flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--signal)] text-[10px] font-semibold text-[var(--signal-ink)]">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0 flex-1">
            <Link
              href={`/projects/${project.slug}`}
              className="wordmark block min-h-11 content-center truncate text-2xl leading-none text-[var(--ink)] transition-colors hover:text-[var(--accent)]"
              title={project.name}
            >
              {project.name}
            </Link>
            <p className="money -mt-1 truncate text-[10px] text-[var(--muted)]">
              {project.slug}
              {project.archived ? ' · Archived' : ''}
            </p>
          </div>
          <AppIcon
            name="arrow"
            size={18}
            className="text-[var(--faint)] transition-transform group-hover:translate-x-0.5"
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Period" cost={project.period} tone="dark" />
          <Metric label="Today" cost={project.today} tone="signal" />
        </div>
        {hideDailyLimit ? (
          <div className="mt-auto space-y-3 border-t border-[var(--line)] pt-3">
            <p className="eyebrow">Monthly hosting</p>
            {project.vpsLines.length === 0 ? (
              <p className="rounded-[var(--radius-sm)] bg-[var(--sunken)] px-3 py-3 text-xs text-[var(--muted)]">
                No active VPS line.
              </p>
            ) : (
              project.vpsLines.map((line) => (
                <div
                  key={line.id}
                  className="space-y-2 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--sunken)] p-3"
                >
                  <p
                    className="truncate text-xs font-semibold text-[var(--ink)]"
                    title={line.displayName}
                  >
                    {line.displayName}
                  </p>
                  <VpsLineEdit
                    resourceId={line.id}
                    monthlyAmountUsd={line.monthlyAmountUsd}
                    effectiveOn={line.effectiveOn}
                    onChanged={onBudgetSaved}
                  />
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="mt-auto space-y-3 border-t border-[var(--line)] pt-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-[var(--muted)]">Daily budget</span>
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
          </div>
        )}
      </div>
    </motion.li>
  );
}

function Metric({
  label,
  cost,
  tone,
}: {
  label: string;
  cost: ProviderProjectRow['period'];
  tone: 'dark' | 'signal';
}) {
  return (
    <div
      className={`min-w-0 rounded-[var(--radius-sm)] px-3 py-3 ${tone === 'dark' ? 'dark-stage' : 'tone-signal'}`}
    >
      <p className="eyebrow">{label}</p>
      <div className="mt-1">
        <CostViewDisplay cost={cost} size="sm" />
      </div>
    </div>
  );
}
