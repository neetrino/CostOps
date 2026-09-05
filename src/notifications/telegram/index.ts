export { escapeTelegramHtml } from './escape-html';
export { createTelegramChannel, sendTelegramMessage } from './send';
export type { NotificationChannel } from './send';
export { formatSpendAlertTelegramHtml } from './format-spend-alert';
export type { FormatSpendAlertParams, SpendAlertMessageKind } from './format-spend-alert';
export { formatAuthFailedTelegramHtml, formatExpiryTelegramHtml } from './format-credential-alert';

export const TELEGRAM_CHANNEL = 'TELEGRAM' as const;
