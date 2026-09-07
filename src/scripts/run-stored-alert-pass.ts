import 'dotenv/config';
import { runStoredSpendAlertPass } from '@/core/sync/run-stored-alert-pass';
import { prisma } from '@/shared/db';

/**
 * Evaluates today's stored spend and sends Telegram for new breaches.
 */
async function main(): Promise<void> {
  await runStoredSpendAlertPass();
  process.stdout.write('Stored spend alert pass finished.\n');
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Stored spend alert pass failed';
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
