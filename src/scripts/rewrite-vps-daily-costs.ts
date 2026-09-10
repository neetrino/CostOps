import 'dotenv/config';
import { materializeFixedVpsCosts } from '@/core/cost/materialize-fixed';
import { prisma } from '@/shared/db';
import { startOfUtcMonth, toUtcDateOnly, utcDayKey } from '@/shared/dates';
import { decimalToNumber } from '@/shared/money';

/**
 * Rewrites HETZNER/VPS FIXED rows into daily slices.
 * `--created-today-starts-today` moves lines created today to start on today.
 */
async function main(): Promise<void> {
  const now = new Date();
  const today = toUtcDateOnly(now);
  if (process.argv.includes('--created-today-starts-today')) {
    const moved = await prisma.resource.updateMany({
      where: {
        providerKey: 'HETZNER',
        archivedAt: null,
        createdAt: { gte: today },
      },
      data: { fixedEffectiveOn: today },
    });
    process.stdout.write(`Set start date to ${utcDayKey(today)} on ${moved.count} line(s) created today.\n`);
  }
  const resources = await prisma.resource.findMany({
    where: {
      providerKey: 'HETZNER',
      archivedAt: null,
      fixedMonthlyUsd: { not: null },
      fixedEffectiveOn: { not: null },
    },
    select: {
      id: true,
      displayName: true,
      providerAccountId: true,
      fixedMonthlyUsd: true,
      fixedEffectiveOn: true,
      project: { select: { slug: true } },
      costEntries: {
        where: { sourceType: 'FIXED' },
        select: { bucketDate: true, costUsd: true },
        orderBy: { bucketDate: 'asc' },
      },
    },
  });

  process.stdout.write(`Found ${resources.length} active VPS line(s).\n`);
  for (const resource of resources) {
    const monthly = resource.fixedMonthlyUsd ? decimalToNumber(resource.fixedMonthlyUsd) : 0;
    const effectiveOn = resource.fixedEffectiveOn ?? startOfUtcMonth(now);
    const before = resource.costEntries.map(
      (row) => `${utcDayKey(row.bucketDate)}=$${decimalToNumber(row.costUsd).toFixed(2)}`,
    );
    process.stdout.write(
      `${resource.project?.slug ?? 'unmapped'} / ${resource.displayName}: $${monthly.toFixed(2)}/mo ` +
        `effective ${utcDayKey(effectiveOn)} rows=${before.length || 0}` +
        `${before.length ? ` [${before.slice(0, 3).join(', ')}${before.length > 3 ? ', …' : ''}]` : ''}\n`,
    );
    const written = await materializeFixedVpsCosts({
      providerAccountId: resource.providerAccountId,
      resourceId: resource.id,
      range: { from: effectiveOn, to: toUtcDateOnly(now) },
      now,
    });
    process.stdout.write(`  wrote ${written} daily row(s)\n`);
  }

  const after = await prisma.costEntry.findMany({
    where: { providerKey: 'HETZNER', sourceType: 'FIXED' },
    select: {
      bucketDate: true,
      costUsd: true,
      resource: { select: { displayName: true } },
    },
    orderBy: [{ resource: { displayName: 'asc' } }, { bucketDate: 'asc' }],
  });
  const months = new Map<string, { count: number; sum: number }>();
  for (const row of after) {
    const name = row.resource?.displayName ?? 'unknown';
    const key = `${name} ${utcDayKey(row.bucketDate).slice(0, 7)}`;
    const month = months.get(key) ?? { count: 0, sum: 0 };
    month.count += 1;
    month.sum += decimalToNumber(row.costUsd);
    months.set(key, month);
  }
  process.stdout.write('Month totals after rewrite:\n');
  for (const [key, month] of months) {
    process.stdout.write(`  ${key}: ${month.count} days, $${month.sum.toFixed(2)}\n`);
  }
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Rewrite VPS daily costs failed';
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
