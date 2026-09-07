import { CostViewDisplay } from '@/shared/ui/cost-view-display';
import type { InboxResourceRow } from '@/features/unmapped/types';

export function ResourceMeta({ resource, extra }: { resource: InboxResourceRow; extra?: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[var(--ink)]">{resource.displayName}</p>
        <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-[var(--muted)]">
          {resource.providerKey} · {resource.resourceType} · {resource.externalId}
        </p>
        <p className="mt-1 text-[11px] text-[var(--muted)]">
          Discovered {resource.discoveredAt.slice(0, 10)}
          {extra ? ` · ${extra}` : ''}
        </p>
      </div>
      <div className="flex shrink-0 gap-6 text-right">
        <div>
          <p className="text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
            Period
          </p>
          <CostViewDisplay cost={resource.period} size="sm" />
        </div>
        <div>
          <p className="text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
            Today
          </p>
          <CostViewDisplay cost={resource.today} size="sm" />
        </div>
      </div>
    </div>
  );
}
