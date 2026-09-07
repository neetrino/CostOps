import 'dotenv/config';
import { ProviderKey } from '@/generated/prisma/enums';
import { parseBackfillRange, runProviderBackfill } from '@/core/sync/backfill';

function readArg(flag: string): string | null {
  const prefix = `${flag}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}

function parseProviderKey(value: string): ProviderKey {
  const key = value.trim().toUpperCase();
  if (key in ProviderKey) {
    return key as ProviderKey;
  }
  throw new Error(`Unknown provider ${value}`);
}

async function main(): Promise<void> {
  const provider = readArg('--provider');
  const from = readArg('--from');
  const to = readArg('--to');
  if (!provider || !from || !to) {
    process.stderr.write('Usage: tsx scripts/backfill.ts --provider=vercel --from=2026-09-01 --to=2026-09-07\n');
    process.exit(1);
  }
  const range = parseBackfillRange(from, to);
  const result = await runProviderBackfill({
    providerKey: parseProviderKey(provider),
    from: range.from,
    to: range.to,
  });
  if (!result.ok) {
    process.stderr.write(`${result.message}\n`);
    process.exit(1);
  }
  const failed = result.results.filter((row) => !row.ok);
  process.stdout.write(
    `${JSON.stringify(
      {
        ok: failed.length === 0,
        days: result.results.length,
        written: result.results.reduce((sum, row) => sum + row.rowsWritten, 0),
        failed: failed.map((row) => row.errorMessage),
      },
      null,
      2,
    )}\n`,
  );
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'backfill failed'}\n`);
  process.exit(1);
});
