import { prisma } from '@/shared/db';
import { ignoredNeonProjectIds } from '@/providers/neon/ignored-projects';

/** Marks already-synced ignored Neon projects archived so they stay out of cost/alert paths. */
export async function archiveIgnoredNeonResources(providerAccountId: string): Promise<number> {
  const result = await prisma.resource.updateMany({
    where: {
      providerAccountId,
      providerKey: 'NEON',
      externalId: { in: [...ignoredNeonProjectIds()] },
      archivedAt: null,
    },
    data: { archivedAt: new Date() },
  });
  return result.count;
}
