'use client';

import type { ProjectDetailResponse } from '@/features/projects/types';
import { isFixedVpsProvider, providerUiLabel } from '@/shared/provider-label';
import { CostViewDisplay } from '@/shared/ui/cost-view-display';

type ProjectProviderSectionProps = {
  provider: ProjectDetailResponse['providers'][number];
};

export function ProjectProviderSection({ provider }: ProjectProviderSectionProps) {
  const isVps = isFixedVpsProvider(provider.providerKey);
  return (
    <article className="overflow-hidden rounded-[var(--radius)] border border-[var(--line-strong)] bg-[var(--paper-raised)] shadow-[var(--shadow-card)]">
      <div className="border-b border-[var(--line)] bg-[var(--sunken)] px-4 py-4">
        <p className="eyebrow">Provider resources</p>
        <h3 className="mt-1 font-semibold text-[var(--ink)]">
          {providerUiLabel(provider.providerKey)}
        </h3>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {isVps
            ? 'Static monthly hosting · edit on the VPS tab'
            : 'Resources mapped to this project'}
        </p>
      </div>
      {provider.resources.length === 0 ? (
        <p className="px-4 py-4 text-sm text-[var(--muted)]">No resources linked.</p>
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {provider.resources.map((resource) => (
            <li
              key={resource.id}
              className="grid gap-3 px-4 py-4 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-[var(--ink)]" title={resource.displayName}>
                  {resource.displayName}
                </p>
                <p className="money mt-0.5 truncate text-[11px] text-[var(--muted)]">
                  {isVps && resource.fixedMonthlyUsd !== null
                    ? `$${resource.fixedMonthlyUsd.toFixed(2)} / month`
                    : `${resource.resourceType} · ${resource.externalId}`}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-sm)] bg-[var(--sunken)] p-3 text-left sm:flex sm:bg-transparent sm:p-0 sm:text-right">
                <div className="min-w-0">
                  <p className="text-[10px] text-[var(--muted)]">Period</p>
                  <CostViewDisplay cost={resource.period} size="sm" />
                </div>
                <div className="min-w-0">
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
