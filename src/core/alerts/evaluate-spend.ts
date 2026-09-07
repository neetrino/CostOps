import { aggregateForScope } from '@/core/cost/aggregate';
import { loadDayCostRows } from '@/core/cost/load-day-rows';
import { ensureProjectProviderBudgetRule } from '@/core/budgets/ensure-project-provider-rule';
import { evaluateSpendForTarget } from '@/core/alerts/evaluate-spend-target';
import { createPrismaSpendStore } from '@/core/alerts/prisma-spend-store';
import { prisma } from '@/shared/db';
import { getEnv } from '@/shared/env';
import { logger } from '@/shared/logger';
import { decimalToNumber } from '@/shared/money';
import { createTelegramChannel } from '@/notifications/telegram/send';
import type { SpendAlertTarget } from '@/core/alerts/spend-types';

async function loadProjectProviderTargets(lastSyncAt: Date): Promise<SpendAlertTarget[]> {
  const links = await prisma.projectProvider.findMany({
    include: {
      project: { select: { name: true, archived: true } },
      provider: { select: { displayName: true } },
    },
  });
  const targets: SpendAlertTarget[] = [];
  for (const link of links) {
    if (link.project.archived || link.providerKey === 'HETZNER') {
      continue;
    }
    const rule = await ensureProjectProviderBudgetRule({
      projectId: link.projectId,
      projectProviderId: link.id,
      providerKey: link.providerKey,
    });
    if (!rule.enabled) {
      continue;
    }
    targets.push({
      budgetRuleId: rule.id,
      scope: 'PROJECT_PROVIDER',
      projectName: link.project.name,
      providerName: link.provider.displayName,
      limitUsd: rule.limitUsd,
      escalationPercent: rule.escalationPercent,
      spend: {
        kind: 'missing',
        costUsd: null,
        sourceStatus: 'missing',
        sourceType: null,
        isPartial: false,
      },
      lastSyncAt,
    });
  }
  return targets;
}

async function loadOptionalScopeTargets(lastSyncAt: Date): Promise<SpendAlertTarget[]> {
  const rules = await prisma.budgetRule.findMany({
    where: { enabled: true, scope: { not: 'PROJECT_PROVIDER' } },
    include: {
      project: { select: { name: true } },
      provider: { select: { displayName: true } },
    },
  });
  return rules.map((rule) => ({
    budgetRuleId: rule.id,
    scope: rule.scope,
    projectName: rule.project?.name ?? 'All projects',
    providerName: rule.provider?.displayName ?? rule.providerKey ?? 'All providers',
    limitUsd: decimalToNumber(rule.limitUsd),
    escalationPercent: decimalToNumber(rule.escalationPercent),
    spend: {
      kind: 'missing',
      costUsd: null,
      sourceStatus: 'missing',
      sourceType: null,
      isPartial: false,
    },
    lastSyncAt,
  }));
}

function scopeFilterFor(
  target: SpendAlertTarget,
  rule: {
    projectProviderId: string | null;
    projectId: string | null;
    providerKey: string | null;
  },
) {
  if (target.scope === 'PROJECT_PROVIDER' && rule.projectProviderId) {
    return { scope: 'PROJECT_PROVIDER' as const, projectProviderId: rule.projectProviderId };
  }
  if (target.scope === 'PROJECT_TOTAL' && rule.projectId) {
    return { scope: 'PROJECT_TOTAL' as const, projectId: rule.projectId };
  }
  if (target.scope === 'PROVIDER_TOTAL' && rule.providerKey) {
    return { scope: 'PROVIDER_TOTAL' as const, providerKey: rule.providerKey };
  }
  return { scope: 'GLOBAL_TOTAL' as const };
}

/**
 * After a successful sync that wrote the current (or finalized) UTC day.
 * Skips when Telegram env is unset. Does not invent $0 for missing/error.
 */
export async function evaluateSpendAlertsForDay(input: {
  budgetDate: Date;
  lastSyncAt: Date;
  now?: Date;
}): Promise<void> {
  const env = getEnv();
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    logger.info('Telegram spend alerts skipped (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID unset)');
    return;
  }

  const now = input.now ?? new Date();
  const rows = await loadDayCostRows(input.budgetDate);
  const projectTargets = await loadProjectProviderTargets(input.lastSyncAt);
  const optionalTargets = await loadOptionalScopeTargets(input.lastSyncAt);
  const store = createPrismaSpendStore();
  const notifier = createTelegramChannel({
    botToken: env.TELEGRAM_BOT_TOKEN,
    chatId: env.TELEGRAM_CHAT_ID,
  });

  const allTargets = [...projectTargets, ...optionalTargets];
  if (allTargets.length === 0) {
    return;
  }
  const rules = await prisma.budgetRule.findMany({
    where: { id: { in: allTargets.map((target) => target.budgetRuleId) } },
  });
  const ruleById = new Map(rules.map((rule) => [rule.id, rule]));
  for (const target of allTargets) {
    const rule = ruleById.get(target.budgetRuleId);
    if (!rule) {
      continue;
    }
    const spend = aggregateForScope(
      rows.filter((row) => row.sourceType !== 'FIXED'),
      scopeFilterFor(target, rule),
    );
    try {
      await evaluateSpendForTarget({
        target: { ...target, spend },
        budgetDate: input.budgetDate,
        store,
        notifier,
        now,
      });
    } catch (error) {
      logger.error({ err: error, budgetRuleId: target.budgetRuleId }, 'Spend alert target failed');
    }
  }
}
