'use client';

import type { ProjectDetailResponse } from '@/features/projects/types';
import { CostViewDisplay } from '@/shared/ui/cost-view-display';

type ProjectProviderSectionProps = {
  provider: ProjectDetailResponse['providers'][number];
};

export function ProjectProviderSection({ provider }: ProjectProviderSectionProps) {
  return (
    <article className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow-card)]">
      <div className="border-b border-[var(--line)] bg-[var(--sidebar)] px-4 py-3">
        <h3 className="font-semibold text-[var(--ink)]">{provider.providerKey}</h3>
        <p className="mt-1 text-xs text-[var(--muted)]">Resources mapped to this project</p>
      </div>
      {provider.resources.length === 0 ? (
        <p className="px-4 py-4 text-sm text-[var(--muted)]">No resources linked.</p>
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {provider.resources.map((resource) => (
            <li
              key={resource.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-[var(--ink)]" title={resource.displayName}>
                  {resource.displayName}
                </p>
                <p className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted)]">
                  {resource.resourceType} · {resource.externalId}
                </p>
              </div>
              <div className="flex shrink-0 gap-4 text-right">
                <div>
                  <p className="text-[10px] text-[var(--muted)]">Period</p>
                  <CostViewDisplay cost={resource.period} size="sm" />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--muted)]">Today</p>
                  <CostViewDisplay cost={resource.today} size="sm" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
