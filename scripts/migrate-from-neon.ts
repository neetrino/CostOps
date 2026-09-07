import 'dotenv/config';
import { runMigrateFromNeon } from '@/scripts/migrate-from-neon/run';

runMigrateFromNeon(process.argv.slice(2)).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'migrate-from-neon failed';
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
