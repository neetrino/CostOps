import { describe, expect, it } from 'vitest';
import { buildBoardNearLimitItems } from '@/features/projects/near-limit-from-projects';
import type { ProjectListRow } from '@/features/projects/types';

function cost(usd: number | null) {
  return {
    costUsd: usd,
    sourceStatus: usd === null ? ('missing' as const) : ('fresh' as const),
    sourceType: usd === null ? null : ('ESTIMATED' as const),
    isPartial: false,
    lastSuccessfulSyncAt: null,
  };
}

function project(
  overrides: Partial<ProjectListRow> & Pick<ProjectListRow, 'id' | 'name'>,
): ProjectListRow {
  return {
    slug: overrides.slug ?? overrides.id,
    archived: false,
    today: cost(null),
    period: cost(null),
    providers: [],
    ...overrides,
  };
}

describe('buildBoardNearLimitItems', () => {
  it('keeps provider rows at or above 70% of today limit', () => {
    const rows = buildBoardNearLimitItems([
      project({
        id: 'hot',
        name: 'Hot',
        slug: 'hot',
        providers: [
          {
            providerKey: 'NEON',
            projectProviderId: 'pp-hot',
            today: cost(8),
            period: cost(20),
            budget: { id: 'b-hot', limitUsd: 10, escalationPercent: 30, enabled: true },
          },
        ],
      }),
      project({
        id: 'ok',
        name: 'Ok',
        slug: 'ok',
        providers: [
          {
            providerKey: 'NEON',
            projectProviderId: 'pp-ok',
            today: cost(2),
            period: cost(6),
            budget: { id: 'b-ok', limitUsd: 10, escalationPercent: 30, enabled: true },
          },
        ],
      }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.projectSlug).toBe('hot');
    expect(rows[0]?.usagePercent).toBe(80);
  });

  it('skips missing spend and missing budgets', () => {
    const rows = buildBoardNearLimitItems([
      project({
        id: 'none',
        name: 'None',
        providers: [
          {
            providerKey: 'NEON',
            projectProviderId: 'pp-none',
            today: cost(null),
            period: cost(null),
            budget: { id: 'b-none', limitUsd: 10, escalationPercent: 30, enabled: true },
          },
        ],
      }),
    ]);
    expect(rows).toHaveLength(0);
  });
});
