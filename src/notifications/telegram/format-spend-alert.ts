import { formatUtcClock } from '@/shared/dates';
import { formatUsd, usagePercent } from '@/shared/money';
import { escapeTelegramHtml } from '@/notifications/telegram/escape-html';
import type { Freshness } from '@/providers/types';

export type SpendAlertMessageKind = 'first' | 'escalation';

export type FormatSpendAlertParams = {
  projectName: string;
  providerName: string;
  spendUsd: number;
  limitUsd: number;
  kind: SpendAlertMessageKind;
  freshness: Freshness;
  lastSyncAt: Date;
  sourceType?: string;
  previousNotifiedSpendUsd?: number;
  escalationStepUsd?: number;
};

function freshnessLabel(status: Freshness): string {
  switch (status) {
    case 'partial':
      return 'partial current day';
    case 'fresh':
      return 'fresh';
    case 'final':
      return 'final';
    case 'stale':
      return 'stale';
    case 'error':
      return 'error';
    case 'missing':
      return 'missing';
  }
}

export function formatSpendAlertTelegramHtml(params: FormatSpendAlertParams): string {
  const project = escapeTelegramHtml(params.projectName);
  const provider = escapeTelegramHtml(params.providerName);
  const usage = usagePercent(params.spendUsd, params.limitUsd);
  const lines = [
    'COST ALERT',
    '',
    `Project: ${project}`,
    `Provider: ${provider}`,
    `Today: ${formatUsd(params.spendUsd)}`,
    `Daily limit: ${formatUsd(params.limitUsd)}`,
    `Usage: ${usage}%`,
    '',
    `Last sync: ${formatUtcClock(params.lastSyncAt)}`,
    `Status: ${freshnessLabel(params.freshness)}`,
  ];
  if (params.sourceType === 'ESTIMATED') {
    lines.push('Source: estimated');
  }
  if (params.kind === 'escalation' && params.previousNotifiedSpendUsd !== undefined) {
    lines.push('');
    lines.push(`Previous notified: ${formatUsd(params.previousNotifiedSpendUsd)}`);
    if (params.escalationStepUsd !== undefined) {
      lines.push(`Step: ${formatUsd(params.escalationStepUsd)}`);
    }
  }
  return lines.join('\n');
}
