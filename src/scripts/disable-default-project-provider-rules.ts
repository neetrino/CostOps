import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { defaultBudgetLimits } from '@/core/budgets/defaults';

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const defaults = defaultBudgetLimits();
    const rules = await prisma.budgetRule.findMany({
      where: { scope: 'PROJECT_PROVIDER', enabled: true },
      select: { id: true, limitUsd: true },
    });
    const ids = rules
      .filter((rule) => Number(rule.limitUsd.toString()) === defaults.limitUsd)
      .map((rule) => rule.id);

    if (ids.length === 0) {
      process.stdout.write('No enabled PROJECT_PROVIDER rules at the env default limit.\n');
      return;
    }

    const result = await prisma.budgetRule.updateMany({
      where: { id: { in: ids } },
      data: { enabled: false },
    });
    process.stdout.write(
      `Disabled ${result.count} PROJECT_PROVIDER rule(s) at default $${defaults.limitUsd}.\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Disable-default rules failed';
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
