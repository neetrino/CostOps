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
    vi.mocked(prisma.budgetRule.findMany).mockResolvedValue([]);
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
    });
    vi.mocked(prisma.budgetRule.findUnique).mockResolvedValue({
      id: 'rule-disabled',
      enabled: false,
      scope: 'PROJECT_PROVIDER',
      projectProviderId: 'pp-1',
      projectId: 'p-1',
      providerKey: 'NEON',
    } as Awaited<ReturnType<typeof prisma.budgetRule.findUnique>>);

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
    });
    vi.mocked(prisma.budgetRule.findUnique).mockResolvedValue({
      id: 'rule-enabled',
      enabled: true,
      scope: 'PROJECT_PROVIDER',
      projectProviderId: 'pp-1',
      projectId: 'p-1',
      providerKey: 'NEON',
    } as Awaited<ReturnType<typeof prisma.budgetRule.findUnique>>);

    await evaluateSpendAlertsForDay({ budgetDate: day, lastSyncAt });

    expect(evaluateSpendForTarget).toHaveBeenCalledOnce();
  });
});
