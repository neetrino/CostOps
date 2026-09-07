import { DEFAULT_SYNC_INTERVAL_MINUTES, VERCEL_CREDENTIAL_REF } from '@/config/constants';
import { prisma } from '@/shared/db';
import { getEnv } from '@/shared/env';

/**
 * Ensures Provider VERCEL + the team ProviderAccount exist so cron works after env is set.
 */
export async function ensureVercelAccountFromEnv(): Promise<void> {
  const env = getEnv();
  await prisma.provider.upsert({
    where: { key: 'VERCEL' },
    create: { key: 'VERCEL', displayName: 'Vercel', enabled: true },
    update: { displayName: 'Vercel', enabled: true },
  });
  if (!env.VERCEL_TEAM_ID) {
    return;
  }
  await prisma.providerAccount.upsert({
    where: {
      providerKey_externalAccountId: {
        providerKey: 'VERCEL',
        externalAccountId: env.VERCEL_TEAM_ID,
      },
    },
    create: {
      providerKey: 'VERCEL',
      name: 'Vercel team',
      externalAccountId: env.VERCEL_TEAM_ID,
      credentialRef: VERCEL_CREDENTIAL_REF,
      recommendedSyncIntervalMinutes: DEFAULT_SYNC_INTERVAL_MINUTES,
      syncEnabled: true,
      status: 'ACTIVE',
    },
    update: {
      credentialRef: VERCEL_CREDENTIAL_REF,
    },
  });
}
