'use client';

import Link from 'next/link';
import type { ProjectListRow } from '@/features/projects/types';
import { BudgetInlineField } from '@/features/projects/budget-inline-field';
import { CostViewDisplay } from '@/shared/ui/cost-view-display';
import { firstAlertableProvider } from '@/features/projects/alertable-provider';
import { providerUiLabel } from '@/shared/provider-label';
import { formatUsd } from '@/shared/money';
import { motion } from 'motion/react';
import { AppIcon } from '@/shared/ui/app-icon';
import { BudgetMeter } from '@/shared/ui/budget-meter';

type ProjectCardsProps = {
  projects: ProjectListRow[];
  onBudgetSaved: () => void;
};

export function ProjectCards({ projects, onBudgetSaved }: ProjectCardsProps) {
  if (projects.length === 0) {
    return null;
  }
  return (
    <ul className="grid list-none gap-4 sm:grid-cols-2 2xl:grid-cols-3">
      {projects.map((project, index) => (
        <ProjectCard
          key={project.id}
          project={project}
          index={index}
          onBudgetSaved={onBudgetSaved}
        />
      ))}
    </ul>
  );
}

function ProjectCard({
  project,
  index,
  onBudgetSaved,
}: {
  project: ProjectListRow;
  index: number;
  onBudgetSaved: () => void;
}) {
  const primaryProvider = firstAlertableProvider(project.providers);
  const overLimit =
    primaryProvider?.budget?.enabled &&
    project.today.costUsd !== null &&
    project.today.costUsd >= primaryProvider.budget.limitUsd;

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index, 8) * 0.025 }}
      whileHover={{ y: -7, rotate: index % 2 === 0 ? -0.22 : 0.22 }}
      className={`group relative flex flex-col overflow-hidden rounded-[var(--radius)] border bg-[var(--paper-raised)] shadow-[var(--shadow-color)] ${
        overLimit ? 'border-[var(--danger)]' : 'border-[var(--line-strong)]'
      }`}
    >
      <span className={`h-2 w-full ${cardAccent(index)}`} aria-hidden="true" />
      <div
        className={`relative overflow-hidden border-b px-5 py-5 ${overLimit ? 'border-[var(--danger)]/20 bg-[var(--danger-soft)]' : 'border-[var(--line)] bg-[var(--paper-raised)]'}`}
      >
        <span className="absolute -top-8 -right-7 size-24 rounded-full border border-[var(--line-strong)] opacity-40 transition-transform duration-500 group-hover:scale-125" />
        <div className="flex items-center gap-3">
          <span
            className={`money relative flex size-10 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-[var(--signal-ink)] ${cardAccent(index)}`}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0 flex-1">
            <Link
              href={`/projects/${project.slug}`}
              className="wordmark block truncate text-2xl leading-none text-[var(--ink)] transition-colors hover:text-[var(--accent)]"
              title={project.name}
            >
              {project.name}
            </Link>
            <p className="money mt-0.5 truncate text-[10px] text-[var(--muted)]">{project.slug}</p>
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
        {project.providers.length > 0 ? (
          <div className="rounded-[var(--radius-sm)] border border-[var(--violet)]/15 bg-[var(--violet-soft)] px-4 py-3.5">
            <p className="eyebrow">Providers</p>
            <ul className="mt-2 space-y-1 text-xs">
              {project.providers.map((link, providerIndex) => (
                <li key={link.projectProviderId} className="flex justify-between gap-2">
                  <span className="flex items-center gap-2 text-[var(--ink)]">
                    <span className={`size-1.5 rounded-full ${cardAccent(providerIndex + 1)}`} />
                    {providerUiLabel(link.providerKey)}
                  </span>
                  <span className="money text-[var(--muted)]">
                    {link.period.costUsd === null ? '—' : formatUsd(link.period.costUsd)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {primaryProvider ? (
          <div className="mt-auto space-y-3 border-t border-[var(--line)] pt-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-[var(--muted)]">Daily limit</span>
              <BudgetInlineField
                savePath={`/api/project-providers/${primaryProvider.projectProviderId}/budget`}
                budget={primaryProvider.budget}
                onSaved={onBudgetSaved}
              />
            </div>
            {primaryProvider.budget?.enabled ? (
              <BudgetMeter
                spendUsd={project.today.costUsd}
                limitUsd={primaryProvider.budget.limitUsd}
                compact
              />
            ) : null}
          </div>
        ) : null}
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
  cost: ProjectListRow['period'];
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

function cardAccent(index: number): string {
  const accents = [
    'bg-[var(--signal)]',
    'bg-[var(--accent)]',
    'bg-[var(--violet)]',
    'bg-[var(--sky)]',
  ] as const;
  return accents[index % accents.length];
}
