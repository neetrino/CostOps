import { AUTH_FAILED_WINDOW_KEY } from '@/config/constants';
import { expiryKindsDue, expiryStatusLine, expiryWindowKey } from '@/core/alerts/credential-kinds';
import type {
  CredentialAccountView,
  CredentialAlertStore,
  CredentialNotifier,
} from '@/core/alerts/credential-types';
import { formatAuthFailedTelegramHtml, formatExpiryTelegramHtml } from '@/notifications/telegram';
import { isPrismaUniqueViolation } from '@/shared/prisma-errors';
import type { ProviderCredentialMeta } from '@/providers/types';

export async function sendAuthFailureAlert(input: {
  account: CredentialAccountView;
  meta: ProviderCredentialMeta;
  statusCode: string;
  store: CredentialAlertStore;
  notifier: CredentialNotifier;
}): Promise<'sent' | 'skipped'> {
  const record = {
    providerAccountId: input.account.id,
    kind: 'AUTH_FAILED' as const,
    windowKey: AUTH_FAILED_WINDOW_KEY,
  };
  if (await input.store.has(record)) {
    return 'skipped';
  }
  await input.notifier.sendHtml(
    formatAuthFailedTelegramHtml({
      providerName: input.account.providerDisplayName,
      accountName: input.account.name,
      statusCode: input.statusCode,
      createUrl: input.meta.credentialCreateUrl,
      createPath: input.meta.credentialCreatePath,
      envVarNames: input.meta.envVarNames,
    }),
  );
  try {
    await input.store.insert(record);
  } catch (error) {
    if (isPrismaUniqueViolation(error)) {
      return 'skipped';
    }
    throw error;
  }
  return 'sent';
}

export async function evaluateExpiryAlerts(input: {
  account: CredentialAccountView;
  meta: ProviderCredentialMeta;
  now: Date;
  store: CredentialAlertStore;
  notifier: CredentialNotifier;
}): Promise<string[]> {
  if (!input.account.credentialExpiresAt) {
    return [];
  }
  const sent: string[] = [];
  const windowKey = expiryWindowKey(input.account.credentialExpiresAt);
  for (const kind of expiryKindsDue(input.account.credentialExpiresAt, input.now)) {
    const record = { providerAccountId: input.account.id, kind, windowKey };
    if (await input.store.has(record)) {
      continue;
    }
    await input.notifier.sendHtml(
      formatExpiryTelegramHtml({
        providerName: input.account.providerDisplayName,
        accountName: input.account.name,
        statusLine: expiryStatusLine(kind, input.account.credentialExpiresAt),
        createUrl: input.meta.credentialCreateUrl,
        createPath: input.meta.credentialCreatePath,
        envVarNames: input.meta.envVarNames,
      }),
    );
    try {
      await input.store.insert(record);
      sent.push(kind);
    } catch (error) {
      if (isPrismaUniqueViolation(error)) {
        continue;
      }
      throw error;
    }
  }
  return sent;
}

export async function clearAuthFailureIncident(
  store: CredentialAlertStore,
  providerAccountId: string,
): Promise<void> {
  await store.deleteAuthFailed(providerAccountId);
}
