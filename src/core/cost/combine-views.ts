import { rollupFreshness } from '@/core/cost/freshness';
import type { CostView } from '@/core/cost/types';
import type { Freshness } from '@/providers/types';

const STATUS_RANK: Record<Freshness, number> = {
  error: 6,
  missing: 5,
  stale: 4,
  partial: 3,
  fresh: 2,
  final: 1,
};

/**
 * Project total from mapped provider CostViews only.
 * Missing/error never become $0. A gap among mapped providers is `partial`,
 * not a fake complete sum.
 */
export function combineProviderCostViews(views: CostView[]): CostView {
  if (views.length === 0) {
    return {
      costUsd: null,
      sourceType: null,
      sourceStatus: 'missing',
      isPartial: false,
      lastSuccessfulSyncAt: null,
    };
  }

  const usable = views.filter(
    (view) =>
      view.costUsd !== null && view.sourceStatus !== 'error' && view.sourceStatus !== 'missing',
  );
  const hasGap = usable.length !== views.length;
  const lastSuccessfulSyncAt = latestSyncIso(views);

  if (usable.length === 0) {
    const allError = views.every((view) => view.sourceStatus === 'error');
    return {
      costUsd: null,
      sourceType: null,
      sourceStatus: allError ? 'error' : 'missing',
      isPartial: false,
      lastSuccessfulSyncAt,
    };
  }

  const costUsd = usable.reduce((sum, view) => sum + (view.costUsd ?? 0), 0);
  const fromUsable = rollupFreshness(usable.map((view) => view.sourceStatus));
  const sourceStatus = hasGap ? worseFreshness(fromUsable, 'partial') : fromUsable;

  return {
    costUsd,
    sourceType: usable[0]?.sourceType ?? null,
    sourceStatus,
    isPartial: hasGap || usable.some((view) => view.isPartial) || sourceStatus === 'partial',
    lastSuccessfulSyncAt,
  };
}

function worseFreshness(left: Freshness, right: Freshness): Freshness {
  return STATUS_RANK[left] > STATUS_RANK[right] ? left : right;
}

function latestSyncIso(views: CostView[]): string | null {
  let latest: string | null = null;
  for (const view of views) {
    if (!view.lastSuccessfulSyncAt) {
      continue;
    }
    if (!latest || view.lastSuccessfulSyncAt > latest) {
      latest = view.lastSuccessfulSyncAt;
    }
  }
  return latest;
}
