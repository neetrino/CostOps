import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { DEFAULT_SYNC_INTERVAL_MINUTES, NEON_CREDENTIAL_REF } from '../src/config/constants';

function neonOrgId(): string | undefined {
  const value = process.env.NEON_ORG_ID?.trim();
  return value && value.length > 0 ? value : undefined;
}

async function seed(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to seed');
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.provider.upsert({
      where: { key: 'NEON' },
      create: { key: 'NEON', displayName: 'Neon', enabled: true },
      update: { displayName: 'Neon', enabled: true },
    });

    const orgId = neonOrgId();
    if (!orgId) {
      return;
    }

    await prisma.providerAccount.upsert({
      where: {
        providerKey_externalAccountId: {
          providerKey: 'NEON',
          externalAccountId: orgId,
        },
      },
      create: {
        providerKey: 'NEON',
        name: 'Neon organization',
        externalAccountId: orgId,
        credentialRef: NEON_CREDENTIAL_REF,
        recommendedSyncIntervalMinutes: DEFAULT_SYNC_INTERVAL_MINUTES,
      },
      update: {
        name: 'Neon organization',
        credentialRef: NEON_CREDENTIAL_REF,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Seed failed';
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
