import { escalationStepUsd } from '@/core/budgets/escalation';
import type {
  SpendAlertTarget,
  SpendAlertStore,
  SpendEvalResult,
  SpendNotifier,
} from '@/core/alerts/spend-types';
import { formatSpendAlertTelegramHtml } from '@/notifications/telegram/format-spend-alert';
import { isPrismaUniqueViolation } from '@/shared/prisma-errors';

export async function evaluateSpendForTarget(input: {
  target: SpendAlertTarget;
  budgetDate: Date;
  store: SpendAlertStore;
  notifier: SpendNotifier;
  now: Date;
}): Promise<SpendEvalResult> {
  const { target, budgetDate, store, notifier, now } = input;
  if (target.spend.kind !== 'value') {
    return 'skipped';
  }
  const spendUsd = target.spend.costUsd;
  if (spendUsd <= target.limitUsd) {
    return 'skipped';
  }

  const existing = await store.findEvent(target.budgetRuleId, budgetDate);
  if (!existing) {
    await notifier.sendHtml(
      formatSpendAlertTelegramHtml({
        projectName: target.projectName,
        providerName: target.providerName,
        spendUsd,
        limitUsd: target.limitUsd,
        kind: 'first',
        freshness: target.spend.sourceStatus,
        lastSyncAt: target.lastSyncAt,
        sourceType: target.spend.sourceType ?? undefined,
      }),
    );
    try {
      await store.createFirstBreach({
        budgetRuleId: target.budgetRuleId,
        budgetDate,
        spendUsd,
        notifiedAt: now,
      });
    } catch (error) {
      if (isPrismaUniqueViolation(error)) {
        return 'skipped';
      }
      throw error;
    }
    return 'sent_first';
  }

  const step = escalationStepUsd(target.limitUsd, target.escalationPercent);
  if (spendUsd <= existing.lastNotifiedCostUsd + step) {
    return 'skipped';
  }

  await notifier.sendHtml(
    formatSpendAlertTelegramHtml({
      projectName: target.projectName,
      providerName: target.providerName,
      spendUsd,
      limitUsd: target.limitUsd,
      kind: 'escalation',
      freshness: target.spend.sourceStatus,
      lastSyncAt: target.lastSyncAt,
      sourceType: target.spend.sourceType ?? undefined,
      previousNotifiedSpendUsd: existing.lastNotifiedCostUsd,
      escalationStepUsd: step,
    }),
  );
  await store.updateEscalation({
    budgetRuleId: target.budgetRuleId,
    budgetDate,
    spendUsd,
    notifiedAt: now,
  });
  return 'sent_escalation';
}
