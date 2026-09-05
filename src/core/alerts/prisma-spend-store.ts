import type { SpendAlertStore } from '@/core/alerts/spend-types';
import { prisma } from '@/shared/db';
import { decimalToNumber, toFixedUsd } from '@/shared/money';

export function createPrismaSpendStore(): SpendAlertStore {
  return {
    async findEvent(budgetRuleId, budgetDate) {
      const row = await prisma.alertEvent.findUnique({
        where: { budgetRuleId_budgetDate: { budgetRuleId, budgetDate } },
      });
      if (!row) {
        return null;
      }
      return { lastNotifiedCostUsd: decimalToNumber(row.lastNotifiedCostUsd) };
    },
    async createFirstBreach(input) {
      const amount = toFixedUsd(input.spendUsd, 6);
      await prisma.alertEvent.create({
        data: {
          budgetRuleId: input.budgetRuleId,
          budgetDate: input.budgetDate,
          firstBreachCostUsd: amount,
          lastNotifiedCostUsd: amount,
          lastNotifiedAt: input.notifiedAt,
          notificationChannel: 'TELEGRAM',
          status: 'OPEN',
        },
      });
    },
    async updateEscalation(input) {
      await prisma.alertEvent.update({
        where: {
          budgetRuleId_budgetDate: {
            budgetRuleId: input.budgetRuleId,
            budgetDate: input.budgetDate,
          },
        },
        data: {
          lastNotifiedCostUsd: toFixedUsd(input.spendUsd, 6),
          lastNotifiedAt: input.notifiedAt,
          status: 'OPEN',
        },
      });
    },
  };
}
