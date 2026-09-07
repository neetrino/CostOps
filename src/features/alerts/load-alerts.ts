import { ALERT_EVENT_QUERY_LIMIT } from '@/config/constants';
import { prisma } from '@/shared/db';
import { decimalToNumber } from '@/shared/money';
import { rangePayload, type ResolvedDashboardQuery } from '@/shared/dashboard-query';

export async function loadAlerts(query: ResolvedDashboardQuery) {
  const events = await prisma.alertEvent.findMany({
    where: {
      budgetDate: { gte: query.from, lte: query.to },
      ...(query.projectId || query.providerKey
        ? {
            budgetRule: {
              ...(query.projectId ? { projectId: query.projectId } : {}),
              ...(query.providerKey ? { providerKey: query.providerKey } : {}),
            },
          }
        : {}),
    },
    include: {
      budgetRule: {
        include: { project: { select: { id: true, slug: true, name: true } } },
      },
    },
    orderBy: { lastNotifiedAt: 'desc' },
    take: ALERT_EVENT_QUERY_LIMIT,
  });

  return {
    range: rangePayload(query),
    events: events.map((event) => ({
      id: event.id,
      budgetRuleId: event.budgetRuleId,
      budgetDate: event.budgetDate.toISOString().slice(0, 10),
      firstBreachCostUsd: decimalToNumber(event.firstBreachCostUsd),
      lastNotifiedCostUsd: decimalToNumber(event.lastNotifiedCostUsd),
      lastNotifiedAt: event.lastNotifiedAt.toISOString(),
      notificationChannel: event.notificationChannel,
      status: event.status,
      rule: {
        scope: event.budgetRule.scope,
        projectId: event.budgetRule.projectId,
        projectSlug: event.budgetRule.project?.slug ?? null,
        projectName: event.budgetRule.project?.name ?? null,
        providerKey: event.budgetRule.providerKey,
        limitUsd: decimalToNumber(event.budgetRule.limitUsd),
        escalationPercent: decimalToNumber(event.budgetRule.escalationPercent),
        enabled: event.budgetRule.enabled,
      },
    })),
  };
}
