import {
  HETZNER_CREDENTIAL_REF,
  HETZNER_DISPLAY_NAME,
  HETZNER_EXTERNAL_ACCOUNT_ID,
  HETZNER_FIXED_SYNC_INTERVAL_MINUTES,
} from '@/config/constants';
import { prisma } from '@/shared/db';

/**
 * Ensures Provider HETZNER (UI: VPS) and the synthetic internal account exist.
 * No API token — fixed monthly lines are operator-entered.
 */
export async function ensureHetznerAccount(): Promise<{ id: string }> {
  await prisma.provider.upsert({
    where: { key: 'HETZNER' },
    create: { key: 'HETZNER', displayName: HETZNER_DISPLAY_NAME, enabled: true },
    update: { displayName: HETZNER_DISPLAY_NAME, enabled: true },
  });
  const account = await prisma.providerAccount.upsert({
    where: {
      providerKey_externalAccountId: {
        providerKey: 'HETZNER',
        externalAccountId: HETZNER_EXTERNAL_ACCOUNT_ID,
      },
    },
    create: {
      providerKey: 'HETZNER',
      name: 'VPS (manual)',
      externalAccountId: HETZNER_EXTERNAL_ACCOUNT_ID,
      credentialRef: HETZNER_CREDENTIAL_REF,
      recommendedSyncIntervalMinutes: HETZNER_FIXED_SYNC_INTERVAL_MINUTES,
      syncEnabled: true,
      status: 'ACTIVE',
    },
    update: {
      credentialRef: HETZNER_CREDENTIAL_REF,
      recommendedSyncIntervalMinutes: HETZNER_FIXED_SYNC_INTERVAL_MINUTES,
    },
    select: { id: true },
  });
  return account;
}
