import { DEFAULT_SYNC_INTERVAL_MINUTES, UPSTASH_CREDENTIAL_REF } from '@/config/constants';
import { prisma } from '@/shared/db';
import { getEnv } from '@/shared/env';

/**
 * Ensures Provider UPSTASH + the Management API account exist so cron works after env is set.
 */
export async function ensureUpstashAccountFromEnv(): Promise<void> {
  const env = getEnv();
  await prisma.provider.upsert({
    where: { key: 'UPSTASH' },
    create: { key: 'UPSTASH', displayName: 'Upstash', enabled: true },
    update: { displayName: 'Upstash', enabled: true },
  });
  if (!env.UPSTASH_EMAIL) {
    return;
  }
  await prisma.providerAccount.upsert({
    where: {
      providerKey_externalAccountId: {
        providerKey: 'UPSTASH',
        externalAccountId: env.UPSTASH_EMAIL,
      },
    },
    create: {
      providerKey: 'UPSTASH',
      name: 'Upstash account',
      externalAccountId: env.UPSTASH_EMAIL,
      credentialRef: UPSTASH_CREDENTIAL_REF,
      recommendedSyncIntervalMinutes: DEFAULT_SYNC_INTERVAL_MINUTES,
      syncEnabled: true,
      status: 'ACTIVE',
    },
    update: {
      credentialRef: UPSTASH_CREDENTIAL_REF,
    },
  });
}
