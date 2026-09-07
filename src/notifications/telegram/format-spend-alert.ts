import { formatUsd } from '@/shared/money';
import { escapeTelegramHtml } from '@/notifications/telegram/escape-html';

export type SpendAlertMessageKind = 'first' | 'escalation';

export type FormatSpendAlertParams = {
  projectName: string;
  providerName: string;
  budgetDate: Date;
  spendUsd: number;
  limitUsd: number;
  kind: SpendAlertMessageKind;
  previousNotifiedSpendUsd?: number;
};

function formatUtcDayLabel(date: Date): string {
  return `Day ${String(date.getUTCDate()).padStart(2, '0')}`;
}

/**
 * Compact Telegram HTML. Same layout as Neon: emoji rows, only the project name is bold.
 */
export function formatSpendAlertTelegramHtml(params: FormatSpendAlertParams): string {
  const project = `<b>${escapeTelegramHtml(params.projectName)}</b>`;
  const provider = escapeTelegramHtml(params.providerName);
  const day = escapeTelegramHtml(formatUtcDayLabel(params.budgetDate));
  const spend = formatUsd(params.spendUsd);
  const limit = formatUsd(params.limitUsd);

  let body =
    `${provider}\n\n` +
    `📦 ${project}\n\n` +
    `📅 ${day}\n\n` +
    `💵 Estimated ${spend}\n\n` +
    `🎯 Limit ${limit}`;

  if (params.kind === 'escalation' && params.previousNotifiedSpendUsd !== undefined) {
    const delta = formatUsd(Math.max(0, params.spendUsd - params.previousNotifiedSpendUsd));
    body += `\n\n↑ ${delta} since last alert`;
  }

  return body;
}
