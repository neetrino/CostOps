import { escapeTelegramHtml } from '@/notifications/telegram/escape-html';

export type FormatAuthFailedParams = {
  providerName: string;
  accountName: string;
  statusCode: string;
  createUrl: string;
  createPath: string;
  envVarNames: string[];
};

export type FormatExpiryParams = {
  providerName: string;
  accountName: string;
  statusLine: string;
  createUrl: string;
  createPath: string;
  envVarNames: string[];
};

export function formatAuthFailedTelegramHtml(params: FormatAuthFailedParams): string {
  const provider = escapeTelegramHtml(params.providerName);
  const account = escapeTelegramHtml(params.accountName);
  const envVars = params.envVarNames.join(' and ');
  return [
    'CREDENTIAL ALERT',
    '',
    `Provider: ${provider}`,
    `Account: ${account}`,
    `Status: API key rejected (${escapeTelegramHtml(params.statusCode)})`,
    '',
    'Create a new org API key:',
    params.createUrl,
    `Path: ${escapeTelegramHtml(params.createPath)}`,
    '',
    `Update ${escapeTelegramHtml(envVars)}. Do not treat today's cost as $0.`,
  ].join('\n');
}

export function formatExpiryTelegramHtml(params: FormatExpiryParams): string {
  const provider = escapeTelegramHtml(params.providerName);
  const account = escapeTelegramHtml(params.accountName);
  const envVars = params.envVarNames.join(' and ');
  return [
    'CREDENTIAL ALERT',
    '',
    `Provider: ${provider}`,
    `Account: ${account}`,
    `Status: ${escapeTelegramHtml(params.statusLine)}`,
    '',
    'Create a new token:',
    params.createUrl,
    `Path: ${escapeTelegramHtml(params.createPath)}`,
    '',
    `Then put the new value in ${escapeTelegramHtml(envVars)}.`,
  ].join('\n');
}
