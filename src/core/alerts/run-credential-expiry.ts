import { evaluateExpiryAlerts } from '@/core/alerts/evaluate-credentials';
import { createPrismaCredentialStore } from '@/core/alerts/prisma-credential-store';
import { prisma } from '@/shared/db';
import { getEnv } from '@/shared/env';
import { logger } from '@/shared/logger';
import { createTelegramChannel } from '@/notifications/telegram/send';
import { tryGetAdapter } from '@/providers/registry';

export async function evaluateCredentialExpiryForAccounts(now: Date = new Date()): Promise<void> {
  const env = getEnv();
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    logger.info('Credential expiry alerts skipped (Telegram unset)');
    return;
  }
  const accounts = await prisma.providerAccount.findMany({
    where: { status: { not: 'DISABLED' } },
    include: { provider: { select: { displayName: true } } },
  });
  const store = createPrismaCredentialStore();
  const notifier = createTelegramChannel({
    botToken: env.TELEGRAM_BOT_TOKEN,
    chatId: env.TELEGRAM_CHAT_ID,
  });
  for (const account of accounts) {
    const adapter = tryGetAdapter(account.providerKey);
    if (!adapter) {
      continue;
    }
    try {
      await evaluateExpiryAlerts({
        account: {
          id: account.id,
          name: account.name,
          providerKey: account.providerKey,
          providerDisplayName: account.provider.displayName,
          credentialExpiresAt: account.credentialExpiresAt,
        },
        meta: adapter.credentials,
        now,
        store,
        notifier,
      });
    } catch (error) {
      logger.error({ err: error, providerAccountId: account.id }, 'Credential expiry alert failed');
    }
  }
}
