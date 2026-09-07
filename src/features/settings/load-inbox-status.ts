import { UNMAPPED_INBOX_PREVIEW_LIMIT } from '@/config/constants';
import { suggestProjectForResource } from '@/core/mapping/suggest-project';
import type { InboxStatusResponse } from '@/features/unmapped/types';
import { prisma } from '@/shared/db';

export async function loadInboxStatus(): Promise<InboxStatusResponse> {
  const where = { projectId: null, archivedAt: null };
  const [unmappedCount, resources, projects] = await Promise.all([
    prisma.resource.count({ where }),
    prisma.resource.findMany({
      where,
      orderBy: { discoveredAt: 'desc' },
      take: UNMAPPED_INBOX_PREVIEW_LIMIT,
      select: {
        id: true,
        displayName: true,
        providerKey: true,
        resourceType: true,
        externalId: true,
      },
    }),
    prisma.project.findMany({
      where: { archived: false },
      select: { id: true, name: true, slug: true },
    }),
  ]);
  return {
    unmappedCount,
    preview: resources.map((resource) => ({
      id: resource.id,
      displayName: resource.displayName,
      providerKey: resource.providerKey,
      suggestion: suggestProjectForResource(resource, projects),
    })),
  };
}
