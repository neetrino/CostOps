import { beforeEach, describe, expect, it, vi } from 'vitest';
import { evaluateSpendAlertsForDay } from '@/core/alerts/evaluate-spend';
import { evaluateSpendForTarget } from '@/core/alerts/evaluate-spend-target';
import { ensureProjectProviderBudgetRule } from '@/core/budgets/ensure-project-provider-rule';
import { loadDayCostRows } from '@/core/cost/load-day-rows';
import { prisma } from '@/shared/db';
import { getEnv } from '@/shared/env';

vi.mock('@/shared/env', () => ({
  getEnv: vi.fn(),
}));

vi.mock('@/core/cost/load-day-rows', () => ({
  loadDayCostRows: vi.fn(),
}));

vi.mock('@/core/budgets/ensure-project-provider-rule', () => ({
  ensureProjectProviderBudgetRule: vi.fn(),
}));

vi.mock('@/core/alerts/evaluate-spend-target', () => ({
  evaluateSpendForTarget: vi.fn(),
}));

vi.mock('@/shared/db', () => ({
  prisma: {
    projectProvider: { findMany: vi.fn() },
    budgetRule: { findUnique: vi.fn(), findMany: vi.fn() },
  },
}));

describe('evaluateSpendAlertsForDay', () => {
  const day = new Date('2026-09-05T00:00:00.000Z');
  const lastSyncAt = new Date('2026-09-05T14:05:00.000Z');

  beforeEach(() => {
    vi.mocked(getEnv).mockReturnValue({
      TELEGRAM_BOT_TOKEN: 'token',
      TELEGRAM_CHAT_ID: 'chat',
    } as ReturnType<typeof getEnv>);
    vi.mocked(loadDayCostRows).mockResolvedValue([]);
    vi.mocked(prisma.projectProvider.findMany).mockResolvedValue([]);
    vi.mocked(prisma.budgetRule.findMany).mockReset();
    vi.mocked(prisma.budgetRule.findMany).mockResolvedValue([]);
    vi.mocked(ensureProjectProviderBudgetRule).mockReset();
    vi.mocked(evaluateSpendForTarget).mockReset();
    vi.mocked(evaluateSpendForTarget).mockResolvedValue('skipped');
  });

  it('skips disabled PROJECT_PROVIDER rules', async () => {
    vi.mocked(prisma.projectProvider.findMany).mockResolvedValue([
      {
        id: 'pp-1',
        projectId: 'p-1',
        providerKey: 'NEON',
        project: { name: 'Degusto', archived: false },
        provider: { displayName: 'Neon' },
      },
    ] as unknown as Awaited<ReturnType<typeof prisma.projectProvider.findMany>>);
    vi.mocked(ensureProjectProviderBudgetRule).mockResolvedValue({
      id: 'rule-disabled',
      limitUsd: 1,
      escalationPercent: 30,
      enabled: false,
    });

    await evaluateSpendAlertsForDay({ budgetDate: day, lastSyncAt });

    expect(evaluateSpendForTarget).not.toHaveBeenCalled();
  });

  it('evaluates enabled PROJECT_PROVIDER rules', async () => {
    vi.mocked(prisma.projectProvider.findMany).mockResolvedValue([
      {
        id: 'pp-1',
        projectId: 'p-1',
        providerKey: 'NEON',
        project: { name: 'Degusto', archived: false },
        provider: { displayName: 'Neon' },
      },
    ] as unknown as Awaited<ReturnType<typeof prisma.projectProvider.findMany>>);
    vi.mocked(ensureProjectProviderBudgetRule).mockResolvedValue({
      id: 'rule-enabled',
      limitUsd: 1,
      escalationPercent: 30,
      enabled: true,
    });
    const enabledRule = {
      id: 'rule-enabled',
      enabled: true,
      scope: 'PROJECT_PROVIDER' as const,
      projectProviderId: 'pp-1',
      projectId: 'p-1',
      providerKey: 'NEON' as const,
    };
    vi.mocked(prisma.budgetRule.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([enabledRule] as unknown as Awaited<
        ReturnType<typeof prisma.budgetRule.findMany>
      >);

    await evaluateSpendAlertsForDay({ budgetDate: day, lastSyncAt });

    expect(evaluateSpendForTarget).toHaveBeenCalledOnce();
  });

  it('skips HETZNER PROJECT_PROVIDER targets', async () => {
    vi.mocked(prisma.projectProvider.findMany).mockResolvedValue([
      {
        id: 'pp-vps',
        projectId: 'p-1',
        providerKey: 'HETZNER',
        project: { name: 'NBOS', archived: false },
        provider: { displayName: 'VPS' },
      },
    ] as unknown as Awaited<ReturnType<typeof prisma.projectProvider.findMany>>);

    await evaluateSpendAlertsForDay({ budgetDate: day, lastSyncAt });

    expect(ensureProjectProviderBudgetRule).not.toHaveBeenCalled();
    expect(evaluateSpendForTarget).not.toHaveBeenCalled();
  });

  it('excludes FIXED rows from daily spend aggregation', async () => {
    vi.mocked(prisma.projectProvider.findMany).mockResolvedValue([]);
    vi.mocked(loadDayCostRows).mockResolvedValue([
      {
        costUsd: 14,
        sourceStatus: 'final',
        sourceType: 'FIXED',
        isPartial: false,
        projectId: 'p-1',
        projectProviderId: 'pp-vps',
        providerKey: 'HETZNER',
      },
      {
        costUsd: 0.5,
        sourceStatus: 'partial',
        sourceType: 'ESTIMATED',
        isPartial: true,
        projectId: 'p-1',
        projectProviderId: 'pp-neon',
        providerKey: 'NEON',
      },
    ]);
    const totalRule = {
      id: 'rule-total',
      enabled: true,
      scope: 'PROJECT_TOTAL' as const,
      projectProviderId: null,
      projectId: 'p-1',
      providerKey: null,
    };
    vi.mocked(prisma.budgetRule.findMany)
      .mockResolvedValueOnce([
        {
          ...totalRule,
          limitUsd: { toString: () => '2' },
          escalationPercent: { toString: () => '30' },
          project: { name: 'NBOS' },
          provider: null,
        },
      ] as unknown as Awaited<ReturnType<typeof prisma.budgetRule.findMany>>)
      .mockResolvedValueOnce([totalRule] as unknown as Awaited<
        ReturnType<typeof prisma.budgetRule.findMany>
      >);

    await evaluateSpendAlertsForDay({ budgetDate: day, lastSyncAt });

    expect(evaluateSpendForTarget).toHaveBeenCalledOnce();
    const payload = vi.mocked(evaluateSpendForTarget).mock.calls[0]?.[0];
    expect(payload?.target.spend).toMatchObject({ kind: 'value', costUsd: 0.5 });
  });
});
