import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Turns on daily PROJECT_PROVIDER spend alerts ($1 default) for live providers.
 * VPS / HETZNER stays off — FIXED cost is not Telegram-watched.
 */
async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const result = await prisma.budgetRule.updateMany({
      where: {
        scope: 'PROJECT_PROVIDER',
        enabled: false,
        NOT: { providerKey: 'HETZNER' },
      },
      data: { enabled: true },
    });
    process.stdout.write(`Enabled ${result.count} PROJECT_PROVIDER daily alert rule(s).\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Enable project-provider rules failed';
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
