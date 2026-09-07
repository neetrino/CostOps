import { getEnv } from '@/shared/env';

export function defaultBudgetLimits(): { limitUsd: number; escalationPercent: number } {
  const env = getEnv();
  return {
    limitUsd: env.TELEGRAM_SPEND_ALERT_DEFAULT_USD,
    escalationPercent: env.SPEND_ALERT_ESCALATION_PERCENT_OF_THRESHOLD,
  };
}
