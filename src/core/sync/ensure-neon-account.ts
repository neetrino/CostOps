import { DEFAULT_SYNC_INTERVAL_MINUTES, NEON_CREDENTIAL_REF } from '@/config/constants';
import { prisma } from '@/shared/db';
import { getEnv } from '@/shared/env';

/**
 * Ensures Provider NEON + the org ProviderAccount exist so cron works after env is set.
 */
export async function ensureNeonAccountFromEnv(): Promise<void> {
  const env = getEnv();
  await prisma.provider.upsert({
    where: { key: 'NEON' },
    create: { key: 'NEON', displayName: 'Neon', enabled: true },
    update: { displayName: 'Neon', enabled: true },
  });
  if (!env.NEON_ORG_ID) {
    return;
  }
  await prisma.providerAccount.upsert({
    where: {
      providerKey_externalAccountId: {
        providerKey: 'NEON',
        externalAccountId: env.NEON_ORG_ID,
      },
    },
    create: {
      providerKey: 'NEON',
      name: 'Neon organization',
      externalAccountId: env.NEON_ORG_ID,
      credentialRef: NEON_CREDENTIAL_REF,
      recommendedSyncIntervalMinutes: DEFAULT_SYNC_INTERVAL_MINUTES,
      syncEnabled: true,
      status: 'ACTIVE',
    },
    update: {
      credentialRef: NEON_CREDENTIAL_REF,
    },
  });
}
