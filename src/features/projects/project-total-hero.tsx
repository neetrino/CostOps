'use client';

import { BudgetInlineField } from '@/features/projects/budget-inline-field';
import type { ProjectDetailResponse } from '@/features/projects/types';
import { isFixedVpsProvider, providerUiLabel } from '@/shared/provider-label';
import { CostViewDisplay } from '@/shared/ui/cost-view-display';

type ProjectTotalHeroProps = {
  slug: string;
  detail: ProjectDetailResponse;
  onBudgetSaved: () => void;
};

export function ProjectTotalHero({ slug, detail, onBudgetSaved }: ProjectTotalHeroProps) {
  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <HeroMetric label="Total today" cost={detail.today} tone="signal" />
        <HeroMetric label="Total period" cost={detail.period} tone="dark" />
      </div>
      <article className="overflow-hidden rounded-[var(--radius)] border border-[var(--line-strong)] bg-[var(--paper-raised)] shadow-[var(--shadow-color)]">
        <div className="tone-accent flex flex-col gap-4 border-b border-[var(--line)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">Project budget</p>
            <h2 className="mt-1 text-base font-semibold text-[var(--ink)]">
              Mapped providers only
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Unmapped spend stays on the provider board — not inside this total.
            </p>
          </div>
          <BudgetInlineField
            savePath={`/api/projects/${slug}/budget-total`}
            budget={detail.totalBudget}
            onSaved={onBudgetSaved}
          />
        </div>
        <ul className="divide-y divide-[var(--line)]">
          {detail.providers.length === 0 ? (
            <li className="px-4 py-4 text-sm text-[var(--muted)]">No mapped providers.</li>
          ) : (
            detail.providers.map((provider) => (
              <li
                key={provider.projectProviderId}
                className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(8rem,1fr)_auto] sm:items-center"
              >
                <p className="font-medium text-[var(--ink)]">
                  {providerUiLabel(provider.providerKey)}
                </p>
                <div className="grid grid-cols-2 items-center gap-3 sm:flex sm:flex-wrap sm:gap-4">
                  <span className="text-xs text-[var(--muted)]">
                    <span className="block text-[10px]">Period</span>
                    <CostViewDisplay cost={provider.period} size="sm" />
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    <span className="block text-[10px]">Today</span>
                    <CostViewDisplay cost={provider.today} size="sm" />
                  </span>
                  {isFixedVpsProvider(provider.providerKey) ? (
                    <span className="text-[10px] text-[var(--muted)]">No daily alert</span>
                  ) : (
                    <BudgetInlineField
                      savePath={`/api/project-providers/${provider.projectProviderId}/budget`}
                      budget={provider.budget}
                      onSaved={onBudgetSaved}
                    />
                  )}
                </div>
              </li>
            ))
          )}
          <li className="flex flex-wrap items-center justify-between gap-3 bg-[var(--accent-soft)] px-4 py-4">
            <p className="font-semibold text-[var(--ink)]">Total</p>
            <div className="flex flex-wrap gap-4 text-xs">
              <span>
                Period <CostViewDisplay cost={detail.period} size="sm" />
              </span>
              <span>
                Today <CostViewDisplay cost={detail.today} size="sm" />
              </span>
            </div>
          </li>
        </ul>
      </article>
    </section>
  );
}

function HeroMetric({
  label,
  cost,
  tone,
}: {
  label: string;
  cost: ProjectDetailResponse['today'];
  tone: 'dark' | 'signal';
}) {
  return (
    <div
      className={`min-h-40 rounded-[var(--radius)] border border-[var(--line)] px-5 py-5 shadow-[var(--shadow-card)] ${tone === 'dark' ? 'dark-stage' : 'tone-signal'}`}
    >
      <p className="eyebrow">{label}</p>
      <div className="mt-8">
        <CostViewDisplay cost={cost} size="lg" />
      </div>
    </div>
  );
}
