import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import {
  DEFAULT_SYNC_INTERVAL_MINUTES,
  HETZNER_CREDENTIAL_REF,
  HETZNER_DISPLAY_NAME,
  HETZNER_EXTERNAL_ACCOUNT_ID,
  HETZNER_FIXED_SYNC_INTERVAL_MINUTES,
  NEON_CREDENTIAL_REF,
  UPSTASH_CREDENTIAL_REF,
  VERCEL_CREDENTIAL_REF,
} from '../src/config/constants';

function envValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
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
    await prisma.provider.upsert({
      where: { key: 'VERCEL' },
      create: { key: 'VERCEL', displayName: 'Vercel', enabled: true },
      update: { displayName: 'Vercel', enabled: true },
    });
    await prisma.provider.upsert({
      where: { key: 'UPSTASH' },
      create: { key: 'UPSTASH', displayName: 'Upstash', enabled: true },
      update: { displayName: 'Upstash', enabled: true },
    });
    await prisma.provider.upsert({
      where: { key: 'HETZNER' },
      create: { key: 'HETZNER', displayName: HETZNER_DISPLAY_NAME, enabled: true },
      update: { displayName: HETZNER_DISPLAY_NAME, enabled: true },
    });

    await seedNeonAccount(prisma);
    await seedVercelAccount(prisma);
    await seedUpstashAccount(prisma);
    await seedHetznerAccount(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedNeonAccount(prisma: PrismaClient): Promise<void> {
  const orgId = envValue('NEON_ORG_ID');
  if (!orgId) {
    return;
  }
  await prisma.providerAccount.upsert({
    where: {
      providerKey_externalAccountId: { providerKey: 'NEON', externalAccountId: orgId },
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
}

async function seedVercelAccount(prisma: PrismaClient): Promise<void> {
  const teamId = envValue('VERCEL_TEAM_ID');
  if (!teamId) {
    return;
  }
  await prisma.providerAccount.upsert({
    where: {
      providerKey_externalAccountId: { providerKey: 'VERCEL', externalAccountId: teamId },
    },
    create: {
      providerKey: 'VERCEL',
      name: 'Vercel team',
      externalAccountId: teamId,
      credentialRef: VERCEL_CREDENTIAL_REF,
      recommendedSyncIntervalMinutes: DEFAULT_SYNC_INTERVAL_MINUTES,
    },
    update: {
      name: 'Vercel team',
      credentialRef: VERCEL_CREDENTIAL_REF,
    },
  });
}

async function seedUpstashAccount(prisma: PrismaClient): Promise<void> {
  const email = envValue('UPSTASH_EMAIL');
  if (!email) {
    return;
  }
  await prisma.providerAccount.upsert({
    where: {
      providerKey_externalAccountId: { providerKey: 'UPSTASH', externalAccountId: email },
    },
    create: {
      providerKey: 'UPSTASH',
      name: 'Upstash account',
      externalAccountId: email,
      credentialRef: UPSTASH_CREDENTIAL_REF,
      recommendedSyncIntervalMinutes: DEFAULT_SYNC_INTERVAL_MINUTES,
    },
    update: {
      name: 'Upstash account',
      credentialRef: UPSTASH_CREDENTIAL_REF,
    },
  });
}

async function seedHetznerAccount(prisma: PrismaClient): Promise<void> {
  await prisma.providerAccount.upsert({
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
      name: 'VPS (manual)',
      credentialRef: HETZNER_CREDENTIAL_REF,
      recommendedSyncIntervalMinutes: HETZNER_FIXED_SYNC_INTERVAL_MINUTES,
    },
  });
}

seed().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Seed failed';
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
