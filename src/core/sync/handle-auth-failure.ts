import { sendAuthFailureAlert } from '@/core/alerts/evaluate-credentials';
import { createPrismaCredentialStore } from '@/core/alerts/prisma-credential-store';
import { prisma } from '@/shared/db';
import { getEnv } from '@/shared/env';
import { logger } from '@/shared/logger';
import { createTelegramChannel } from '@/notifications/telegram/send';
import type { CostProviderAdapter } from '@/providers/types';

export function authFailureCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status: unknown }).status;
    if (typeof status === 'number') {
      return String(status);
    }
  }
  if (error instanceof Error && /401/.test(error.message)) {
    return '401';
  }
  if (error instanceof Error && /403/.test(error.message)) {
    return '403';
  }
  return '401';
}

export async function recordAuthFailure(input: {
  accountId: string;
  adapter: CostProviderAdapter;
  error: unknown;
  now: Date;
}): Promise<void> {
  const code = authFailureCode(input.error);
  const account = await prisma.providerAccount.update({
    where: { id: input.accountId },
    data: {
      status: 'ERROR',
      lastAuthFailureAt: input.now,
      lastAuthFailureCode: code,
      lastErrorAt: input.now,
      lastErrorMessage: `Provider API rejected credentials (${code})`,
    },
    include: { provider: { select: { displayName: true } } },
  });

  const env = getEnv();
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    logger.info('Credential auth-failure alert skipped (Telegram unset)');
    return;
  }

  await sendAuthFailureAlert({
    account: {
      id: account.id,
      name: account.name,
      providerKey: account.providerKey,
      providerDisplayName: account.provider.displayName,
      credentialExpiresAt: account.credentialExpiresAt,
    },
    meta: input.adapter.credentials,
    statusCode: code,
    store: createPrismaCredentialStore(),
    notifier: createTelegramChannel({
      botToken: env.TELEGRAM_BOT_TOKEN,
      chatId: env.TELEGRAM_CHAT_ID,
    }),
  });
}
