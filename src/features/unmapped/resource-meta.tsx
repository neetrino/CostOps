import { CostViewDisplay } from '@/shared/ui/cost-view-display';
import type { InboxResourceRow } from '@/features/unmapped/types';
import { providerUiLabel } from '@/shared/provider-label';

export function ResourceMeta({ resource, extra }: { resource: InboxResourceRow; extra?: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex shrink-0 rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[9px] font-semibold tracking-[0.12em] text-[var(--accent)] uppercase">
            {providerUiLabel(resource.providerKey)}
          </span>
          {extra ? (
            <span className="truncate text-[10px] font-medium text-[var(--stale)]">{extra}</span>
          ) : null}
        </div>
        <p
          className="mt-3 truncate text-base font-semibold text-[var(--ink)]"
          title={resource.displayName}
        >
          {resource.displayName}
        </p>
        <p className="money mt-1 break-all text-[11px] leading-5 text-[var(--muted)]">
          {resource.resourceType} · {resource.externalId}
        </p>
        <p className="mt-2 text-[10px] font-medium tracking-wide text-[var(--faint)] uppercase">
          Discovered {resource.discoveredAt.slice(0, 10)}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 md:min-w-[17rem]">
        <div className="rounded-[var(--radius-sm)] bg-[var(--sunken)] px-3 py-2.5">
          <p className="eyebrow">Period</p>
          <CostViewDisplay cost={resource.period} size="sm" />
        </div>
        <div className="rounded-[var(--radius-sm)] bg-[var(--sunken)] px-3 py-2.5">
          <p className="eyebrow">Today</p>
          <CostViewDisplay cost={resource.today} size="sm" />
        </div>
      </div>
    </div>
  );
}
