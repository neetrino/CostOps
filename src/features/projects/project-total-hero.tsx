'use client';

import { BudgetInlineField } from '@/features/projects/budget-inline-field';
import type { ProjectDetailResponse } from '@/features/projects/types';
import { CostViewDisplay } from '@/shared/ui/cost-view-display';

type ProjectTotalHeroProps = {
  slug: string;
  detail: ProjectDetailResponse;
  onBudgetSaved: () => void;
};

export function ProjectTotalHero({ slug, detail, onBudgetSaved }: ProjectTotalHeroProps) {
  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <HeroMetric label="Total today" cost={detail.today} accent />
        <HeroMetric label="Total period" cost={detail.period} />
      </div>
      <article className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--sidebar)] px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
              Project total
            </p>
            <h2 className="text-sm font-semibold text-[var(--ink)]">Mapped providers only</h2>
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
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <p className="font-medium text-[var(--ink)]">{provider.providerKey}</p>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-xs">
                    Period <CostViewDisplay cost={provider.period} size="sm" />
                  </span>
                  <span className="text-xs">
                    Today <CostViewDisplay cost={provider.today} size="sm" />
                  </span>
                  <BudgetInlineField
                    savePath={`/api/project-providers/${provider.projectProviderId}/budget`}
                    budget={provider.budget}
                    onSaved={onBudgetSaved}
                  />
                </div>
              </li>
            ))
          )}
          <li className="flex flex-wrap items-center justify-between gap-3 bg-[var(--accent-soft)] px-4 py-3">
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
  accent = false,
}: {
  label: string;
  cost: ProjectDetailResponse['today'];
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--radius)] border px-5 py-4 shadow-[var(--shadow-card)] ${
        accent
          ? 'border-[var(--accent-soft)] bg-[var(--accent-soft)]'
          : 'border-[var(--line)] bg-[var(--paper)]'
      }`}
    >
      <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      <div className="mt-2">
        <CostViewDisplay cost={cost} size="lg" />
      </div>
    </div>
  );
}
