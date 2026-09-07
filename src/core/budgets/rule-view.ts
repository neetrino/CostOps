import { decimalToNumber } from '@/shared/money';

export type BudgetRuleView = {
  id: string;
  limitUsd: number;
  escalationPercent: number;
  enabled: boolean;
};

export function toBudgetRuleView(
  rule: {
    id: string;
    limitUsd: { toString(): string };
    escalationPercent: { toString(): string };
    enabled: boolean;
  } | null,
): BudgetRuleView | null {
  if (!rule) {
    return null;
  }
  return {
    id: rule.id,
    limitUsd: decimalToNumber(rule.limitUsd),
    escalationPercent: decimalToNumber(rule.escalationPercent),
    enabled: rule.enabled,
  };
}

export function ruleViewForProjectTotal(
  rules: Array<{
    id: string;
    scope: string;
    projectId: string | null;
    limitUsd: { toString(): string };
    escalationPercent: { toString(): string };
    enabled: boolean;
  }>,
  projectId: string,
): BudgetRuleView | null {
  const rule =
    rules.find((item) => item.scope === 'PROJECT_TOTAL' && item.projectId === projectId) ?? null;
  return toBudgetRuleView(rule);
}

export function ruleViewForProjectProvider(
  rules: Array<{
    id: string;
    projectProviderId: string | null;
    limitUsd: { toString(): string };
    escalationPercent: { toString(): string };
    enabled: boolean;
  }>,
  projectProviderId: string,
): BudgetRuleView | null {
  const rule = rules.find((item) => item.projectProviderId === projectProviderId) ?? null;
  return toBudgetRuleView(rule);
}
